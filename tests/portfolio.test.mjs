import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const base = '/portfolio-preview/';
let es, en, css;
before(() => {
  const build = spawnSync('npm', ['run', 'build'], {
    encoding: 'utf8', env: { ...process.env, SITE_BASE: base, SITE_URL: 'https://example.com' }
  });
  assert.equal(build.status, 0, `Build failed:\n${build.stdout}\n${build.stderr}`);
  es = readFileSync('dist/index.html', 'utf8');
  en = readFileSync('dist/en/index.html', 'utf8');
  const cssFile = readdirSync('dist/_astro').find((file) => file.endsWith('.css'));
  css = readFileSync(`dist/_astro/${cssFile}`, 'utf8');
});

for (const [language, html] of [['es', () => es], ['en', () => en]]) {
  test(`${language}: accessible document and navigation`, () => {
    const page = html();
    assert.match(page, new RegExp(`<html[^>]+lang="${language}"`));
    assert.match(page, /<title>[^<]+<\/title>/);
    assert.match(page, /<meta name="description" content="[^"]+"/);
    assert.match(page, /<main[^>]+id="main"/);
    assert.match(page, /href="#main"/);
    assert.match(page, /<nav[^>]+aria-label=/);
    for (const anchor of ['services', 'experience', 'project', 'contact']) {
      assert.match(page, new RegExp(`id="${anchor}"`));
      assert.match(page, new RegExp(`href="#${anchor}"`));
    }
    assert.match(page, /href="\/portfolio-preview\/"[^>]*hreflang="es"/);
    assert.match(page, /href="\/portfolio-preview\/en\/"[^>]*hreflang="en"/);
    assert.match(page, /href="https:\/\/example\.com\/portfolio-preview\//);
    assert.match(page, /aria-current="page"/);
  });
  test(`${language}: factual portfolio and working contact links`, () => {
    const page = html();
    for (const phrase of ['Gonzalo Peña Páez', 'AFP Capital', 'Santander Cloud', 'Actiobiz', 'Oracle', 'Data Factory', 'Databricks', 'Angular', 'INACAP']) {
      assert.ok(page.includes(phrase), `Missing ${phrase}`);
    }
    assert.match(page, /mailto:gonzalopena\.work@protonmail\.com/);
    assert.match(page, /https:\/\/www\.linkedin\.com\/in\/gonzalopenapaez\//);
    assert.match(page, /https:\/\/github\.com\/Gyrefallon/);
    assert.doesNotMatch(page, /<iframe\b|href="tel:|href="[^"]*\.pdf/i);
    for (const fact of ['VB.NET', 'C#', 'Jenkins', 'MySQL', 'TypeScript', '2026', '2024', '2023']) {
      assert.ok(page.includes(fact), `Missing ${fact}`);
    }
  });
}

for (const [language, html, title, projectLink, contactLink] of [
  ['es', () => es, 'Backend e integraciones para tu negocio.', 'Ver proyecto', 'Hablemos de tu proyecto'],
  ['en', () => en, 'Backend and integrations for your business.', 'View project', 'Let’s talk about your project']
]) {
  const opening = () => {
    const section = html().match(/<section[^>]*data-section="opening"[\s\S]*?<\/section>/)?.[0];
    assert.ok(section, 'Missing opening section');
    return section;
  };
  test(`${language}: opening names the offer`, () => assert.ok(opening().includes(title)));
  test(`${language}: opening links directly to the project`, () => {
    const anchor = opening().match(/<a[^>]*href="#project"[\s\S]*?<\/a>/)?.[0];
    assert.ok(anchor, 'Missing project link');
    assert.ok(anchor.includes(projectLink), 'Project link must name the project view');
  });
  test(`${language}: opening retains the contact action`, () => {
    const anchor = opening().match(/<a[^>]*href="#contact"[\s\S]*?<\/a>/)?.[0];
    assert.ok(anchor, 'Missing contact action');
    assert.ok(anchor.includes(contactLink), 'Contact action must keep its label');
  });
}

test('project title uses referrals in both languages wherever it appears', () => {
  assert.equal(es.split('Una plataforma de fidelización y referidos.').length - 1, 2);
  assert.equal(en.split('A loyalty and referral platform.').length - 1, 2);
});

test('both languages explain the anonymous loyalty project and services', () => {
  for (const phrase of ['fidelización', 'puntos', 'campañas', 'plataforma de ventas', 'Backend', 'integraciones']) assert.ok(es.includes(phrase), phrase);
  for (const phrase of ['loyalty', 'points', 'campaigns', 'sales platform', 'Backend', 'integrations']) assert.ok(en.includes(phrase), phrase);
});

test('assets and internal page links respect the GitHub Pages base', () => {
  for (const page of [es, en]) {
    for (const [, url] of page.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      assert.ok(url.startsWith(base), `Not base-aware: ${url}`);
    }
    assert.ok(page.includes('<style>') || /href="\/portfolio-preview\/_astro\/[^"]+\.css"/.test(page), 'Styles must be inline or base-aware');
  }
});

test('root deployment uses root language and canonical URLs', () => {
  const build = spawnSync('npm', ['run', 'build'], {
    encoding: 'utf8', env: { ...process.env, SITE_BASE: '/', SITE_URL: 'https://example.com' }
  });
  assert.equal(build.status, 0, `Build failed:\n${build.stdout}\n${build.stderr}`);
  const root = readFileSync('dist/index.html', 'utf8');
  const english = readFileSync('dist/en/index.html', 'utf8');
  assert.match(root, /href="\/"[^>]*hreflang="es"/);
  assert.match(root, /href="\/en\/"[^>]*hreflang="en"/);
  assert.match(root, /rel="canonical" href="https:\/\/example\.com\/"/);
  assert.match(english, /rel="canonical" href="https:\/\/example\.com\/en\/"/);
  assert.ok(root.includes('<style>') || /href="\/_astro\/[^"]+\.css"/.test(root), 'Styles must be inline or root-relative');
});

for (const [language, html, expected] of [
  ['es', () => es, {
    labels: ['Nombre', 'Correo', 'Mensaje'],
    submit: 'Enviar mensaje',
    privacy: 'Uso tus datos solo para responderte. No los almaceno ni los comparto.',
    errors: [
      'Escribe tu nombre.',
      'El nombre necesita al menos 2 caracteres.',
      'El nombre no puede superar los 80 caracteres.',
      'Escribe tu correo.',
      'Revisa el correo: falta el @ o el dominio.',
      'Escribe un mensaje.',
      'Cuéntame un poco más: al menos 20 caracteres.',
      'El mensaje no puede superar los 2000 caracteres.'
    ]
  }],
  ['en', () => en, {
    labels: ['Name', 'Email', 'Message'],
    submit: 'Send message',
    privacy: 'I use your details only to reply. I do not store or share them.',
    errors: [
      'Enter your name.',
      'Your name needs at least 2 characters.',
      'Your name cannot exceed 80 characters.',
      'Enter your email address.',
      'Check the email: it is missing the @ or the domain.',
      'Enter a message.',
      'Tell me a little more: at least 20 characters.',
      'Your message cannot exceed 2000 characters.'
    ]
  }]
]) {
  const form = () => {
    const match = html().match(/<form[^>]*>[\s\S]*?<\/form>/);
    assert.ok(match, `${language}: missing contact form`);
    return match[0];
  };

  test(`${language}: contact form is labelled and wired for validation`, () => {
    const markup = form();
    assert.match(markup, /novalidate/);
    assert.match(markup, /data-contact-form/);
    assert.match(markup, new RegExp(`<label[^>]*for="contact-name"[^>]*>${expected.labels[0]}</label>`));
    assert.match(markup, new RegExp(`<label[^>]*for="contact-email"[^>]*>${expected.labels[1]}</label>`));
    assert.match(markup, new RegExp(`<label[^>]*for="contact-message"[^>]*>${expected.labels[2]}</label>`));
    assert.match(markup, /id="contact-name"[^>]*name="name"[^>]*autocomplete="name"[^>]*required/);
    assert.match(markup, /id="contact-email"[^>]*name="email"[^>]*type="email"[^>]*inputmode="email"[^>]*autocomplete="email"[^>]*required/);
    assert.match(markup, /id="contact-message"[^>]*name="message"[^>]*required/);
    for (const field of ['name', 'email', 'message']) {
      assert.match(markup, new RegExp(`id="contact-${field}"[^>]*aria-describedby="[^"]*contact-${field}-error`));
      assert.match(markup, new RegExp(`id="contact-${field}-error"`));
    }
    assert.match(markup, /id="contact-status"[^>]*role="status"[^>]*aria-live="polite"/);
    assert.match(markup, /aria-hidden="true"[\s\S]*name="company"/);
    assert.match(markup, /name="company"[^>]*tabindex="-1"[^>]*autocomplete="off"/);
    assert.match(markup, new RegExp(`<button[^>]*type="submit"[^>]*>${expected.submit}</button>`));
  });

  test(`${language}: contact form offers honest fallback copy and localized errors`, () => {
    const markup = form();
    assert.match(markup, /href="mailto:gonzalopena\.work@protonmail\.com"/);
    assert.ok(markup.includes(expected.privacy), 'Missing privacy note');
    for (const message of expected.errors) assert.ok(markup.includes(message), `Missing error message: ${message}`);
    assert.doesNotMatch(markup, /cf-turnstile|challenges\.cloudflare\.com/, 'Turnstile must not load without a site key');
  });
}

test('S12: contact card grid uses a shrinkable column on narrow screens', () => {
  for (const [language, page] of [['es', () => es], ['en', () => en]]) {
    const grid = page().match(/<div class="mt-8 grid[^"]*"/)?.[0];
    assert.ok(grid, `${language}: missing contact card grid`);
    assert.match(grid, /grid-cols-1|grid-cols-\[minmax\(0/, `${language}: contact card grid must not use an auto track`);
  }
});

test('S12: compiled CSS neutralises animation under prefers-reduced-motion', () => {
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[\s\S]{0,300}?animation-duration:\.01ms!important/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[\s\S]{0,300}?animation-iteration-count:1!important/);
  assert.match(css, /@media\(prefers-reduced-motion:no-preference\)\{@supports \(animation-timeline:view\(\)\)\{\.reveal\{animation:linear both reveal-up/);
});

test('S12: focus-visible outline and skip link are preserved', () => {
  assert.match(css, /:focus-visible\{outline:2px solid var\(--color-accent\)/);
  for (const [language, page] of [['es', () => es], ['en', () => en]]) {
    const body = page().slice(page().indexOf('<body'));
    assert.match(body, /^<body[^>]*>\s*<a[^>]*href="#main"/, `${language}: skip link must be the first focusable element`);
  }
});

test('contact form has a safe no-JavaScript fallback and bounded fields', () => {
  for (const [language, page] of [['es', () => es], ['en', () => en]]) {
    const markup = page().match(/<form[^>]*>[\s\S]*?<\/form>/)?.[0];
    assert.ok(markup, `${language}: missing contact form`);
    assert.match(markup, /method="post"/, `${language}: a native submit must never use GET`);
    assert.match(markup, /action="mailto:gonzalopena\.work@protonmail\.com"/, `${language}: native fallback must be mailto`);
    for (const [field, limit] of [['name', 80], ['email', 254], ['message', 2000]]) {
      assert.match(markup, new RegExp(`id="contact-${field}"[^>]*maxlength="${limit}"`), `${language}: ${field} needs maxlength ${limit}`);
    }
  }
});

test('the English page carries no Spanish copy from the hero code panel', () => {
  assert.ok(!en.includes('3+ años'), 'English page must not show the Spanish panel copy');
  assert.ok(!en.includes('perfil.ts'), 'English page must not show the Spanish panel filename');
  assert.ok(en.includes('3+ years'), 'English panel must keep the English fact');
});
