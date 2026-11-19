// Astro normalizes BASE_URL according to the configured deployment base.
export function pageUrl(language: 'es' | 'en'): string {
  return `${import.meta.env.BASE_URL}${language === 'en' ? 'en/' : ''}`;
}
