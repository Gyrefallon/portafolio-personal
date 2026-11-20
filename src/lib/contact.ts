// Shared contact validation. Imported by the browser form, the Cloudflare
// Worker and the Node tests, so it must stay free of DOM and Workers APIs.
// Erasable TypeScript only: Node runs this file with type stripping.

export const CONTACT_LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 254 },
  message: { min: 20, max: 2000 }
} as const;

export type ContactErrorCode =
  | 'name_required'
  | 'name_short'
  | 'name_long'
  | 'email_required'
  | 'email_invalid'
  | 'message_required'
  | 'message_short'
  | 'message_long';

export interface ContactValue {
  name: string;
  email: string;
  message: string;
}

export interface ContactErrors {
  name?: ContactErrorCode;
  email?: ContactErrorCode;
  message?: ContactErrorCode;
}

export type ContactResult = { ok: true; value: ContactValue } | { ok: false; errors: ContactErrors };

// Codes the browser maps to localized messages, in focus order.
export const CONTACT_FIELDS = ['name', 'email', 'message'] as const;

// Deliberately simple: one @, no whitespace, a dotted domain with a real suffix.
// Whitespace is checked separately because `$` can match before a trailing newline.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function asRecord(input: unknown): Record<string, unknown> {
  return input !== null && typeof input === 'object' ? input as Record<string, unknown> : {};
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function validateContact(input: unknown): ContactResult {
  const source = asRecord(input);
  const errors: ContactErrors = {};

  // Strip CR/LF before collapsing so a name cannot smuggle mail headers.
  const name = asText(source.name)
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!name) errors.name = 'name_required';
  else if (name.length < CONTACT_LIMITS.name.min) errors.name = 'name_short';
  else if (name.length > CONTACT_LIMITS.name.max) errors.name = 'name_long';

  const email = asText(source.email).trim();
  if (!email) errors.email = 'email_required';
  else if (email.length > CONTACT_LIMITS.email.max || /\s/.test(email) || !EMAIL_PATTERN.test(email)) {
    errors.email = 'email_invalid';
  }

  const message = asText(source.message).trim();
  if (!message) errors.message = 'message_required';
  else if (message.length < CONTACT_LIMITS.message.min) errors.message = 'message_short';
  else if (message.length > CONTACT_LIMITS.message.max) errors.message = 'message_long';

  if (errors.name || errors.email || errors.message) return { ok: false, errors };
  return { ok: true, value: { name, email, message } };
}

export function buildMailto(value: ContactValue, to: string): string {
  const name = value.name.replace(/[\r\n]+/g, ' ').trim();
  const subject = `Contacto desde el portfolio · ${name}`;
  const body = `${value.message}\n\n— ${name}\n${value.email}`;
  const params = new URLSearchParams({ subject, body });
  return `mailto:${to}?${params.toString()}`;
}
