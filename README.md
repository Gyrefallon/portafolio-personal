# Gonzalo Peña Páez · Portfolio

Bilingual static Astro portfolio. Spanish is at `/` and English at `/en/`. The site includes a contact form (client-side validated, with an honest `mailto:` fallback) plus direct email and LinkedIn links. It is published at `https://gyrefallon.github.io/portafolio-personal/` with GitHub Pages; the published form uses the `mailto:` fallback until a Worker endpoint is configured.

Styling uses Tailwind CSS v4 compiled through `@tailwindcss/vite`. Design tokens live in `src/styles/global.css`, the section components under `src/components/sections/`, and the visual rules are described in `DESIGN.md`.

## Local setup

Use a Node.js version supported by Astro 5 and npm. Install locally and run:

```sh
npm install --cache .npm-cache --no-audit --no-fund
npm run dev
```

Run the public-output checks and a production build:

```sh
npm test
npm run build
```

The test builds with a sample project-site base and checks both rendered language pages. Generated files, dependencies and the local npm cache are ignored by Git. Astro telemetry is disabled in the project scripts.

## GitHub Pages deployment

The site is published at `https://gyrefallon.github.io/portafolio-personal/` by `.github/workflows/deploy.yml`. Every push to `main` runs the test suite, builds with `SITE_URL=https://gyrefallon.github.io` and `SITE_BASE=/portafolio-personal/`, and deploys `dist/` through GitHub Pages.

The build stays configurable for other destinations:

- User site at `https://gyrefallon.github.io/`: `SITE_URL=https://gyrefallon.github.io SITE_BASE=/ npm run build`
- Project site at `https://gyrefallon.github.io/REPOSITORY/`: `SITE_URL=https://gyrefallon.github.io SITE_BASE=/REPOSITORY/ npm run build`

`SITE_URL` is the origin and `SITE_BASE` the path prefix; together they determine canonical and alternate-language URLs. The optional repository variables `PUBLIC_CONTACT_ENDPOINT` and `PUBLIC_TURNSTILE_SITE_KEY` are read at build time: when unset, the published form uses the `mailto:` fallback and renders no Turnstile widget.

## Contact architecture

The form never delivers mail by itself and the static site holds no secrets.

- `src/lib/contact.ts` is shared validation (name 2–80, email ≤ 254, message 20–2000) with error codes, used by the browser form, the Worker and the tests. `buildMailto()` builds the fallback link.
- `src/lib/contact-form.ts` wires the form: validates with the shared module, shows localized errors, focuses the first invalid field, and posts JSON `{name, email, message, token, company}` to the configured endpoint.
- `worker/src/index.ts` (Cloudflare Worker, deployed separately from the static site) enforces the order CORS preflight → method → origin → configuration → 415/413/400 → honeypot → field validation → Turnstile `siteverify` → Resend send, and returns 502 if Resend rejects. It never echoes the secret or the token. The honeypot field `company` answers success while sending nothing.
- `worker/wrangler.example.toml` documents the deployable configuration; the real `worker/wrangler.toml` stays local and ignored by Git. There is no Email binding: delivery uses the Resend HTTP API with a Bearer key, so no custom domain is required.

### Build-time variables (public, safe to expose)

- `PUBLIC_CONTACT_ENDPOINT` — full URL of the deployed Worker (for example `https://portfolio-contact.<account>.workers.dev/`). When unset, submitting the form opens the visitor's mail app via `buildMailto` and the helper text says so; success is never faked.
- `PUBLIC_TURNSTILE_SITE_KEY` — Turnstile site key. When unset the widget and its script are not rendered.

### Worker variables (runtime, non-secret)

- `CONTACT_EMAIL` — recipient (owner's address).
- `CONTACT_FROM` — Resend sender, for example `portfolio@resend.dev`.
- `ALLOWED_ORIGIN` — exact origin allowed to call the Worker (the published site origin).
- `RESEND_API_KEY` *(secret)* — set with `npx wrangler secret put RESEND_API_KEY`; the Worker sends it only as an `authorization: Bearer` header to `api.resend.com`.
- `TURNSTILE_SECRET` *(secret)* — set with `npx wrangler secret put TURNSTILE_SECRET`.

### Prerequisites to enable direct delivery

- A Turnstile widget (site key + secret) if the form is to be protected in production; without the site key the form still works with validation and the honeypot.
- A Resend account with the API key as a Worker secret; `CONTACT_FROM` must be the Resend sandbox sender or a verified domain sender.
- The Worker's `ALLOWED_ORIGIN` must exactly match the origin published on GitHub Pages.

### Known limitations

- The Worker has no rate limiting: Turnstile is the only throttling layer, so a solved challenge can be replayed until its value is rotated.
