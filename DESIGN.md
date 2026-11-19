# Portfolio visual system

The selected direction is a light, editorial portfolio in the spirit of current Tailwind portfolio and résumé templates: oversized tight headlines, generous whitespace, rounded media and content cards, numbered sections and a slim sticky header.

## Stack and token layer

- Tailwind CSS v4 through `@tailwindcss/vite`; all design values live as `@theme` tokens in `src/styles/global.css` (colours, type scale, radii, shadows, easing and the marquee animation).
- Components compose utilities and a small `@layer components` set (`container-page`, `section`, `btn*`, `field*`) instead of scattering raw hex values.
- Self-hosted Inter Variable (`@fontsource-variable/inter`) for text and display; the system monospace stack carries technical labels, dates and code.
- Progressive reveal uses CSS `animation-timeline: view()` behind `@supports` and `prefers-reduced-motion`; no JavaScript animation layer.

## Palette and type

- Surface: white; canvas bands: `#f5f8f6`; ink and dark panels: `#0b1512`; accent: teal `#0e7a6a` with soft mint `#dff1ec` for tints.
- Body and secondary text use `muted #56655f` on white and canvas, above WCAG AA contrast.
- Display type uses a fluid `clamp()` scale with tight tracking (`text-display`, `text-h2`); eyebrows are monospaced, uppercase and tracked.

## Composition

- A sticky translucent header carries the monogram, section navigation, a language pill and a short contact CTA; on narrow screens the navigation becomes its own scrollable row.
- The hero pairs a large statement with a dark code-profile panel and a floating experience badge. It replaces invented portraits or project imagery with a truthful visual.
- A moving stack band separates the hero from numbered sections: services cards, an experience timeline with derived technology tags, a dark project case panel and a two-column contact section with a rounded form.
- Layouts are mobile-first and stack in source order; anchor targets carry scroll margins for the sticky header.
- No raster assets, fabricated screenshots, testimonials or metrics are used.
