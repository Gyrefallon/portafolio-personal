// Cloudflare Worker for the portfolio contact form.
// Source only: nothing here is deployed. Secrets come from Worker variables.
// Delivery uses Resend (no custom domain required); no Email binding is used.

import { validateContact } from '../../src/lib/contact.ts';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_URL = 'https://api.resend.com/emails';
const MAX_BODY_BYTES = 16 * 1024;

export interface Env {
  CONTACT_EMAIL?: string;
  CONTACT_FROM?: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET?: string;
  ALLOWED_ORIGIN?: string;
}

type Payload = Record<string, unknown>;

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers }
  });
}


// Read at most `max` bytes and cancel the stream as soon as the limit is
// crossed, so an oversized body can never be fully buffered in memory.
async function readBodyWithin(request: Request, max: number): Promise<string | null> {
  const declared = request.headers.get('content-length');
  if (declared !== null && Number(declared) > max) return null;
  if (!request.body) return '';

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > max) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    try { reader.releaseLock(); } catch { /* already released */ }
  }
}

async function submissionId(value: { name: string; email: string; message: string }): Promise<string> {
  const bytes = new TextEncoder().encode(`${value.email}\n${value.name}\n${value.message}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function verifyTurnstile(secret: string, token: string, expectedHostname: string): Promise<{ ok: boolean; codes: string[] }> {
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }).toString(),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return { ok: false, codes: [`siteverify_http_${response.status}`] };
    const outcome = await response.json() as { success?: boolean; hostname?: unknown; action?: unknown; 'error-codes'?: unknown };
    const raw = outcome['error-codes'];
    const codes = Array.isArray(raw) ? raw.filter((code): code is string => typeof code === 'string').slice(0, 6) : [];
    if (outcome.success !== true) return { ok: false, codes };
    if (outcome.action !== 'contact') return { ok: false, codes: [...codes, 'action_mismatch'].slice(0, 6) };
    if (outcome.hostname !== expectedHostname) return { ok: false, codes: [...codes, 'hostname_mismatch'].slice(0, 6) };
    return { ok: true, codes };
  } catch {
    return { ok: false, codes: ['verification_unreachable'] };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('origin') || '';
    const allowed = Boolean(env.ALLOWED_ORIGIN) && origin === env.ALLOWED_ORIGIN;
    // CORS headers on every response; the allow-origin value is only echoed for
    // the configured origin, and Vary keeps caches honest.
    const cors: Record<string, string> = {
      vary: 'Origin',
      'access-control-allow-headers': 'content-type'
    };
    if (allowed) cors['access-control-allow-origin'] = env.ALLOWED_ORIGIN as string;

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...cors, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-max-age': '86400' }
      });
    }

    if (request.method !== 'POST') {
      return json(405, { error: 'method_not_allowed' }, { ...cors, allow: 'POST' });
    }

    // An unset ALLOWED_ORIGIN is a configuration error, not a rejected origin.
    if (env.ALLOWED_ORIGIN && origin !== env.ALLOWED_ORIGIN) {
      return json(403, { error: 'origin_not_allowed' }, cors);
    }

    if (!env.CONTACT_EMAIL || !env.CONTACT_FROM || !env.RESEND_API_KEY || !env.TURNSTILE_SECRET || !env.ALLOWED_ORIGIN) {
      return json(500, { error: 'not_configured' }, cors);
    }

    let expectedHostname: string;
    try {
      expectedHostname = new URL(env.ALLOWED_ORIGIN).hostname;
    } catch {
      return json(500, { error: 'not_configured' }, cors);
    }

    const contentType = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (contentType !== 'application/json') {
      return json(415, { error: 'unsupported_media_type' }, cors);
    }

    const raw = await readBodyWithin(request, MAX_BODY_BYTES);
    if (raw === null) return json(413, { error: 'payload_too_large' }, cors);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json(400, { error: 'invalid_json' }, cors);
    }

    const payload: Payload = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Payload
      : {};

    // Honeypot: answer like a success so the bot does not learn, but send nothing.
    if (typeof payload.company === 'string' && payload.company.trim() !== '') {
      return json(200, { ok: true }, cors);
    }

    const result = validateContact(payload);
    if (!result.ok) return json(422, { error: 'invalid_fields', errors: result.errors }, cors);

    const token = typeof payload.token === 'string' ? payload.token : '';
    const verification = await verifyTurnstile(env.TURNSTILE_SECRET, token, expectedHostname);
    if (!verification.ok) {
      console.warn('turnstile rejected', verification.codes.join(',') || 'no_codes', 'token_length', token.length);
      return json(403, { error: 'verification_failed', codes: verification.codes }, cors);
    }

    const value = result.value;
    const idempotencyKey = await submissionId(value);
    const text = [`Nombre: ${value.name}`, `Correo: ${value.email}`, '', value.message].join('\n');
    let delivered = false;
    let failure = '';
    try {
      const response = await fetch(RESEND_URL, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.RESEND_API_KEY}`,
          'content-type': 'application/json',
          'idempotency-key': idempotencyKey
        },
        body: JSON.stringify({
          from: env.CONTACT_FROM,
          to: env.CONTACT_EMAIL,
          reply_to: value.email,
          subject: `Contacto desde el portfolio · ${value.name}`,
          text
        }),
        signal: AbortSignal.timeout(8000)
      });
      delivered = response.ok;
      if (!delivered) failure = `status ${response.status}`;
    } catch (error) {
      delivered = false;
      failure = 'exception';
    }

    if (!delivered) {
      console.error('resend rejected', failure);
      return json(502, { error: 'send_failed' }, cors);
    }
    return json(200, { ok: true }, cors);
  }
};
