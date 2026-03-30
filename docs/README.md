# Dopamine Fluid — Docs

This is the documentation site for Dopamine Fluid. It's built using Dopamine itself — eating our own dog food.

## How it works

The docs site is a real Dopamine project. It scans the HTML files for utility classes and generates the CSS, just like any Drupal theme or website would.

```
docs/
├── index.html              ← pages (scanned by Dopamine)
├── typography.html
├── spacing.html
├── sizing.html
├── grid.html
├── flexbox.html
├── utilities.html
├── components.html
├── search.js               ← search filter (plain JS)
├── dopamine.config.json    ← config for docs
├── scss/
│   ├── _dopamine.scss      ← generated (gitignored)
│   ├── _dopamine-functions.scss  ← generated (gitignored)
│   ├── _docs.scss          ← hand-written docs styles
│   ├── main.scss           ← imports dopamine + docs
│   └── components/
│       └── accordion.scss  ← example component
└── css/
    ├── main.css             ← compiled (committed for GitHub Pages)
    └── components/
        └── accordion.css
```

## Build

From the project root:

```bash
# One-time build
npm run docs:build

# Development with auto-reload
npm run docs:dev
```

### What happens

1. `docs:dopamine` — scans `docs/*.html` for Dopamine classes → generates `docs/scss/_dopamine.scss` + `_dopamine-functions.scss`
2. `docs:sass` — compiles `docs/scss/main.scss` → `docs/css/main.css` + component CSS

### Adding a new page

1. Create a new `.html` file in `docs/`
2. Use the same nav and structure as existing pages
3. Run `npm run docs:build` — Dopamine picks up any new classes automatically

### Adding a new component

1. Create a `.scss` file in `docs/scss/components/`
2. Use `@use '../dopamine-functions' as dp;` for the `dp.fluid()` function
3. Link the compiled CSS in your HTML: `<link rel="stylesheet" href="css/components/yourfile.css">`
4. Run `npm run docs:build`

## GitHub Pages

The docs are deployed via GitHub Pages from the `/docs` folder on the `main` branch.

**Settings → Pages → Source:** Deploy from branch, `main`, `/docs`

The compiled CSS (`docs/css/`) is committed to git so GitHub Pages can serve it directly.

## Styling

- `_docs.scss` — all docs-specific styles (nav, hero, demo boxes, etc.)
- Utility classes from Dopamine handle spacing, typography, grid, and layout
- The `dp.fluid()` Sass function is available for custom component styles
