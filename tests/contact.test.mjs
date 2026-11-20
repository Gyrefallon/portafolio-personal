import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMailto, validateContact } from '../src/lib/contact.ts';
import worker from '../worker/src/index.ts';

const ORIGIN = 'https://example.com';
const RESEND_URL = 'https://api.resend.com/emails';

function makeEnv(overrides = {}) {
  return {
    CONTACT_EMAIL: 'owner@example.com',
    CONTACT_FROM: 'portfolio@resend.dev',
    RESEND_API_KEY: 're_test_key',
    TURNSTILE_SECRET: 'test-secret',
    ALLOWED_ORIGIN: ORIGIN,
    ...overrides
  };
}

function jsonRequest(body, init = {}) {
  return new Request(`${ORIGIN}/`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    body: JSON.stringify(body),
    ...init
  });
}

const validPayload = {
  name: 'Ana Pérez',
  email: 'ana@example.com',
  message: 'Necesito integrar un sistema de facturación con nuestra plataforma.',
  token: 'turnstile-token',
  company: ''
};

async function withFetch({ turnstile = { success: true }, resend = { id: 'mail_1' }, resendStatus = 200 } = {}, run) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const target = String(url);
    calls.push({ url: target, init });
    if (target.startsWith(RESEND_URL)) {
      return new Response(JSON.stringify(resendStatus < 400 ? resend : { message: 'rejected' }), {
        status: resendStatus,
        headers: { 'content-type': 'application/json' }
      });
    }
    return new Response(JSON.stringify(turnstile), { headers: { 'content-type': 'application/json' } });
  };
  try {
    return await run(calls);
  } finally {
    globalThis.fetch = original;
  }
}

const resendCalls = (calls) => calls.filter((call) => call.url.startsWith(RESEND_URL));

test('validation accepts a complete submission and trims it', () => {
  const result = validateContact({ name: '  Ana   Pérez ', email: ' ana@example.com ', message: '  Necesito integrar un sistema de facturación.  ' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    name: 'Ana Pérez',
    email: 'ana@example.com',
    message: 'Necesito integrar un sistema de facturación.'
  });
});

test('validation reports a missing or unusable name', () => {
  assert.equal(validateContact({ email: 'a@b.co', message: 'x'.repeat(30) }).errors.name, 'name_required');
  assert.equal(validateContact({ name: 'A', email: 'a@b.co', message: 'x'.repeat(30) }).errors.name, 'name_short');
  assert.equal(validateContact({ name: 'A'.repeat(81), email: 'a@b.co', message: 'x'.repeat(30) }).errors.name, 'name_long');
});

test('validation rejects malformed email addresses', () => {
  for (const email of ['', 'ana', 'ana@', '@example.com', 'ana@example', 'ana @example.com', 'ana@example.com\nBcc: x@y.co']) {
    assert.equal(validateContact({ name: 'Ana', email, message: 'x'.repeat(30) }).errors.email, email ? 'email_invalid' : 'email_required', email);
  }
});

test('validation reports missing, short and oversized messages', () => {
  assert.equal(validateContact({ name: 'Ana', email: 'a@b.co' }).errors.message, 'message_required');
  assert.equal(validateContact({ name: 'Ana', email: 'a@b.co', message: 'muy corto' }).errors.message, 'message_short');
  assert.equal(validateContact({ name: 'Ana', email: 'a@b.co', message: 'x'.repeat(2001) }).errors.message, 'message_long');
});

test('validation strips line breaks from the name so headers cannot be injected', () => {
  const result = validateContact({ name: 'Ana\r\nBcc: evil@example.com', email: 'ana@example.com', message: 'x'.repeat(30) });
  assert.equal(result.ok, true);
  assert.ok(!result.value.name.includes('\n'));
  assert.ok(!result.value.name.includes('\r'));
});

test('validation treats non-object input as an empty submission', () => {
  for (const input of [null, undefined, 'text', 42, []]) {
    const result = validateContact(input);
    assert.equal(result.ok, false);
    assert.deepEqual(Object.keys(result.errors).sort(), ['email', 'message', 'name']);
  }
});

test('mailto fallback carries the submission without dropping line breaks', () => {
  const link = buildMailto({ name: 'Ana Pérez', email: 'ana@example.com', message: 'Línea uno\nLínea dos' }, 'owner@example.com');
  assert.ok(link.startsWith('mailto:owner@example.com?'));
  const params = new URLSearchParams(link.slice(link.indexOf('?') + 1));
  assert.equal(params.get('subject'), 'Contacto desde el portfolio · Ana Pérez');
  assert.match(params.get('body'), /ana@example\.com/);
  assert.match(params.get('body'), /Línea uno\nLínea dos/);
});

test('worker answers the CORS preflight for the allowed origin', async () => {
  const response = await worker.fetch(new Request(`${ORIGIN}/`, { method: 'OPTIONS', headers: { origin: ORIGIN } }), makeEnv());
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  assert.match(response.headers.get('access-control-allow-methods'), /POST/);
});

test('worker rejects other methods and other origins', async () => {
  const get = await worker.fetch(new Request(`${ORIGIN}/`, { headers: { origin: ORIGIN } }), makeEnv());
  assert.equal(get.status, 405);
  assert.equal(get.headers.get('allow'), 'POST');

  const foreign = await worker.fetch(jsonRequest(validPayload, { headers: { 'content-type': 'application/json', origin: 'https://evil.example' } }), makeEnv());
  assert.equal(foreign.status, 403);
});

test('worker rejects non-JSON and oversized bodies before validation', async () => {
  const plain = await worker.fetch(
    new Request(`${ORIGIN}/`, { method: 'POST', headers: { 'content-type': 'text/plain', origin: ORIGIN }, body: 'name=ana' }),
    makeEnv()
  );
  assert.equal(plain.status, 415);

  const huge = await worker.fetch(jsonRequest({ ...validPayload, message: 'x'.repeat(20_000) }), makeEnv());
  assert.equal(huge.status, 413);
});

test('worker reports field errors without sending mail', async () => {
  await withFetch({}, async (calls) => {
    const response = await worker.fetch(jsonRequest({ ...validPayload, email: 'not-an-email' }), makeEnv());
    assert.equal(response.status, 422);
    const body = await response.json();
    assert.equal(body.errors.email, 'email_invalid');
    assert.equal(resendCalls(calls).length, 0);
  });
});

test('worker silently accepts a filled honeypot without sending mail', async () => {
  await withFetch({}, async (calls) => {
    const response = await worker.fetch(jsonRequest({ ...validPayload, company: 'spam-bot' }), makeEnv());
    assert.equal(response.status, 200);
    assert.equal(resendCalls(calls).length, 0);
    assert.equal(calls.length, 0);
  });
});

test('worker rejects a submission whose Turnstile check fails', async () => {
  await withFetch({ turnstile: { success: false, 'error-codes': ['invalid-input-response'] } }, async (calls) => {
    const response = await worker.fetch(jsonRequest(validPayload), makeEnv());
    assert.equal(response.status, 403);
    assert.deepEqual((await response.json()).codes, ['invalid-input-response']);
    assert.equal(resendCalls(calls).length, 0);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /siteverify/);
    assert.match(String(calls[0].init.body), /test-secret/);
  });
});

test('worker sends the message once through Resend when Turnstile passes', async () => {
  await withFetch({}, async (calls) => {
    const response = await worker.fetch(jsonRequest(validPayload), makeEnv());
    assert.equal(response.status, 200);
    assert.equal(resendCalls(calls).length, 1);
    const [mail] = resendCalls(calls);
    assert.equal(mail.init.headers.authorization, 'Bearer re_test_key');
    const body = JSON.parse(mail.init.body);
    assert.equal(body.to, 'owner@example.com');
    assert.equal(body.from, 'portfolio@resend.dev');
    assert.equal(body.reply_to, 'ana@example.com');
    assert.match(body.subject, /Ana Pérez/);
    assert.match(body.text, /sistema de facturación/);
    assert.ok(!body.text.includes('turnstile-token'));
  });
});

test('worker reports a delivery failure instead of a false success', async () => {
  await withFetch({ resendStatus: 422 }, async () => {
    const response = await worker.fetch(jsonRequest(validPayload), makeEnv());
    assert.equal(response.status, 502);
    assert.notEqual((await response.json()).ok, true);
  });
});

test('worker refuses to run without the required configuration', async () => {
  for (const missing of ['CONTACT_EMAIL', 'CONTACT_FROM', 'RESEND_API_KEY', 'TURNSTILE_SECRET', 'ALLOWED_ORIGIN']) {
    const response = await worker.fetch(jsonRequest(validPayload), makeEnv({ [missing]: '' }));
    assert.equal(response.status, 500, missing);
  }
});

test('worker cancels a streamed body that exceeds the size limit', async () => {
  let cancelled = false;
  let closed = false;
  const chunk = new TextEncoder().encode('x'.repeat(4096));
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(chunk);
      controller.enqueue(chunk);
      controller.enqueue(chunk);
      // Keep the source open briefly so cancellation is observable, then close
      // so an unbounded reader can still finish instead of hanging the test.
      setTimeout(() => {
        if (closed) return;
        closed = true;
        controller.close();
      }, 50);
    },
    cancel() {
      cancelled = true;
      closed = true;
    }
  });
  const request = new Request(`${ORIGIN}/`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    body,
    duplex: 'half'
  });
  const response = await worker.fetch(request, makeEnv());
  assert.equal(response.status, 413);
  assert.equal(cancelled, true, 'the worker must cancel the stream at the limit');
});
