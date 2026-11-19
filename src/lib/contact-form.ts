// Client wiring for the portfolio contact form. Kept out of the Astro
// component so the DOM logic stays in one testable module.

import {
  CONTACT_FIELDS,
  buildMailto,
  validateContact,
  type ContactErrorCode,
  type ContactErrors,
  type ContactValue
} from './contact';

export interface ContactFormMessages {
  to: string;
  sending: string;
  success: string;
  failure: string;
  mailtoLabel: string;
  mailtoHelper: string;
  errors: Record<ContactErrorCode, string>;
}

type Field = HTMLInputElement | HTMLTextAreaElement;

function inputFor(form: HTMLFormElement, field: string): Field | null {
  return form.querySelector<Field>(`[name="${field}"]`);
}

function errorFor(form: HTMLFormElement, field: string): HTMLElement | null {
  return form.querySelector<HTMLElement>(`#contact-${field}-error`);
}

export function initContactForm(form: HTMLFormElement, messages: ContactFormMessages): void {
  const endpoint = (form.dataset.endpoint || import.meta.env?.PUBLIC_CONTACT_ENDPOINT || '').trim();
  const status = form.querySelector<HTMLElement>('#contact-status');
  const note = form.querySelector<HTMLElement>('#contact-form-note');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const idleLabel = button ? button.textContent || '' : '';

  function announce(text: string): void {
    if (status) status.textContent = text;
  }

  function showErrors(errors: ContactErrors): void {
    let firstInvalid: Field | null = null;
    for (const field of CONTACT_FIELDS) {
      const input = inputFor(form, field);
      const slot = errorFor(form, field);
      const code = errors[field];
      if (!code) {
        if (input) input.setAttribute('aria-invalid', 'false');
        if (slot) slot.textContent = '';
        continue;
      }
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        if (!firstInvalid) firstInvalid = input;
      }
      if (slot) slot.textContent = messages.errors[code] || code;
    }
    if (firstInvalid) firstInvalid.focus();
  }

  function announceFailure(value: ContactValue): void {
    if (!status) return;
    status.textContent = `${messages.failure} `;
    const link = document.createElement('a');
    link.href = buildMailto(value, messages.to);
    link.textContent = messages.mailtoLabel;
    status.appendChild(link);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!button) return;
    announce('');
    showErrors({});

    const data = new FormData(form);
    const raw = {
      name: typeof data.get('name') === 'string' ? data.get('name') as string : '',
      email: typeof data.get('email') === 'string' ? data.get('email') as string : '',
      message: typeof data.get('message') === 'string' ? data.get('message') as string : '',
      company: typeof data.get('company') === 'string' ? data.get('company') as string : ''
    };

    const result = validateContact(raw);
    if (!result.ok) {
      showErrors(result.errors);
      return;
    }
    const value = result.value;

    // Without a configured endpoint the form must not pretend to deliver:
    // hand the message to the visitor's mail app and say so.
    if (!endpoint) {
      if (note) note.textContent = messages.mailtoHelper;
      window.location.href = buildMailto(value, messages.to);
      return;
    }

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = messages.sending;
    try {
      const widget = form.querySelector('.cf-turnstile');
      const tokenInput = form.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]');
      const token = tokenInput ? tokenInput.value : '';
      // A rendered widget without a token means the visitor has not solved the
      // challenge yet; posting anyway would only produce an opaque server error.
      if (widget && !token) {
        announce(messages.verificationRequired);
        return;
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: value.name, email: value.email, message: value.message, token, company: raw.company })
      });

      if (response.ok) {
        form.reset();
        announce(messages.success);
        return;
      }

      if (response.status === 422) {
        const body = await response.json().catch(() => null) as { errors?: ContactErrors } | null;
        if (body && body.errors) {
          showErrors(body.errors);
          return;
        }
      }
      announceFailure(value);
    } catch {
      announceFailure(value);
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = idleLabel;
    }
  });
}
