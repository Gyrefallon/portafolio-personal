import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// SITE_BASE is '/' for a user site or '/repository-name/' for a project site.
const base = `/${(process.env.SITE_BASE || '').replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');

export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || 'https://gyrefallon-portfolio.pages.dev',
  base,
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()]
  }
});
