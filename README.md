# Gonzalo Peña Páez · Portfolio

Bilingual static Astro portfolio. Spanish is at `/` and English at `/en/`. The site includes a contact form (client-side validated, with an honest `mailto:` fallback) plus direct email and LinkedIn links. It is published at `https://gyrefallon-portfolio.gonzalo-2800.workers.dev/` with Cloudflare Workers static assets (the current Pages platform); the original GitHub Pages deployment remains available as a legacy fallback. The published form uses the `mailto:` fallback until a Worker endpoint is configured.

Styling uses Tailwind CSS v4 compiled through `@tailwindcss/vite`. Design tokens live in `src/styles/global.css`, the section components under `src/components/sections/`, and the visual rules are described in `DESIGN.md`.

## Local setup

Use Node.js 22.23.4 or newer (required by Astro 7) and npm. Install locally and run:

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

## Deployment

The primary site is `https://gyrefallon-portfolio.gonzalo-2800.workers.dev/`, served by Cloudflare as static assets (the current Pages platform, now part of Workers). `public/_headers` adds CSP, HSTS and the other security headers that GitHub Pages cannot set.

Deploy a new build from this machine (the project-local Wrangler keeps its Cloudflare session isolated):

```sh
npm run deploy:cloudflare
```

That script builds with `SITE_URL=https://gyrefallon-portfolio.gonzalo-2800.workers.dev` and `SITE_BASE=/`, then deploys `dist/` with `wrangler deploy` using `wrangler.jsonc` as an assets-only Worker. The project-local Wrangler lives in `.wrangler-tools/` (pinned to 4.160.1) and is ignored by Git, so this is a local command. It isolates the Cloudflare session under `.wrangler-home/` and strips ambient `CLOUDFLARE_*` values before both the build and the deploy. For automatic deploys, connect the repository to the project from the Cloudflare dashboard (Git integration / Workers Builds), use `npm run build` as the build command, `npx wrangler deploy` as the deploy command (the build platform provides Wrangler), and set the same environment variables in the project. The pinned local launcher remains the recommended manual path.

The older `.github/workflows/deploy.yml` still runs the tests and publishes the GitHub Pages fallback at `https://gyrefallon.github.io/portafolio-personal/`. That fallback cannot apply `public/_headers`; treat it as an unhardened fallback and keep Cloudflare as the production origin. Both builds stay base-aware:

- Origin root (Cloudflare): `SITE_URL=<origin> SITE_BASE=/ npm run build`
- GitHub Pages project site: `SITE_URL=https://gyrefallon.github.io SITE_BASE=/portafolio-personal/ npm run build`

`SITE_URL` is the origin and `SITE_BASE` the path prefix; together they determine canonical and alternate-language URLs. The optional build variables `PUBLIC_CONTACT_ENDPOINT` and `PUBLIC_TURNSTILE_SITE_KEY` are read at build time (GitHub Actions repository variables for the fallback, Cloudflare project environment variables for the primary site): when unset, the published form uses the `mailto:` fallback and renders no Turnstile widget.

## Contact architecture

The form never delivers mail by itself and the static site holds no secrets.

- `src/lib/contact.ts` is shared validation (name 2–80, email ≤ 254, message 20–2000) with error codes, used by the browser form, the Worker and the tests. `buildMailto()` builds the fallback link.
- `src/lib/contact-form.ts` wires the form: validates with the shared module, shows localized errors, focuses the first invalid field, and posts JSON `{name, email, message, token, company}` to the configured endpoint.
- `worker/src/index.ts` (Cloudflare Worker, deployed separately from the static site) enforces the order CORS preflight → method → origin → configuration → 415/413/400 → honeypot → field validation → Turnstile `siteverify` → Resend send, and returns 502 if Resend rejects. It never echoes the secret or the token. The honeypot field `company` answers success while sending nothing.
- `worker/wrangler.example.toml` documents the deployable configuration; the real `worker/wrangler.toml` stays local and ignored by Git. There is no Email binding: delivery uses the Resend HTTP API with a Bearer key, so no custom domain is required.

### Build-time variables (public, safe to expose)

- `PUBLIC_CONTACT_ENDPOINT` — full URL of the deployed Worker (for example `https://portfolio-contact.<account>.workers.dev/`). When unset, the JavaScript path opens the visitor's mail app via `buildMailto`; without JavaScript the form shows a direct email link. Success is never faked.
- `PUBLIC_TURNSTILE_SITE_KEY` — Turnstile site key. Direct delivery requires it: the widget renders only with this key and the Worker verifies a token on every submission. Without it the form cannot deliver directly and stays on the `mailto:` fallback.

### Worker variables (runtime, non-secret)

- `CONTACT_EMAIL` — recipient (owner's address).
- `CONTACT_FROM` — Resend sender, for example `portfolio@resend.dev`.
- `ALLOWED_ORIGIN` — exact origin allowed to call the Worker. Use the primary `https://gyrefallon-portfolio.gonzalo-2800.workers.dev` (no trailing slash); use `https://gyrefallon.github.io` only if the fallback serves the form.
- `RESEND_API_KEY` *(secret)* — set from the repository root with `./.wrangler-tools/wrangler secret put --config worker/wrangler.toml RESEND_API_KEY`; the launcher pins and isolates Wrangler. Do not use `npx wrangler` for project values. The Worker sends it only as an `authorization: Bearer` header to `api.resend.com`.
- `TURNSTILE_SECRET` *(secret)* — set with the same pinned launcher and `--config worker/wrangler.toml TURNSTILE_SECRET`.

### Prerequisites to enable direct delivery

- A Turnstile widget (site key + secret) is required for direct delivery: the Worker always verifies a token, so a configured endpoint without a site key will reject every submission. Without an endpoint the form stays on the `mailto:` fallback.
- A Resend account with the API key as a Worker secret; `CONTACT_FROM` must be the Resend sandbox sender or a verified domain sender.
- The Worker's `ALLOWED_ORIGIN` must exactly match the origin that serves the form: the primary `https://gyrefallon-portfolio.gonzalo-2800.workers.dev`, or `https://gyrefallon.github.io` only if the fallback is used.

### Known limitations

- The Worker has no rate limiting: Turnstile is the only throttling layer, the provider enforces single-use tokens, and the Worker keeps no local replay state.
