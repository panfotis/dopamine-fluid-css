# This project uses Dopamine Fluid

Instructions for AI coding agents (and humans) working in this codebase.

Dopamine Fluid is a compile-time utility CSS generator: it scans templates for
class names and generates a stylesheet — `clamp()`-based for fluid ranges,
rem-converted for fixed values. Zero runtime.

**Full documentation — read before inventing syntax:**

- **Complete class reference** (every prefix, keyword, unit, and note):
  [`node_modules/dopamine-fluid/README.md`](node_modules/dopamine-fluid/README.md) — see the *Value Prefixes* and *Keyword Classes* tables.
- **Changelog / breaking changes per version**: same file, *Changelog* section at the bottom.
- Online mirror: <https://github.com/panfotis/dopamine-fluid-css#readme>
- The cheat sheet below covers the common 90% — when unsure whether a class
  exists or how it's spelled, check the README tables rather than guessing.

## Rule #1 — style with classes, not plain CSS

When styling, reach for a dopamine class in the markup first. Only write CSS
when a utility genuinely can't express it (state selectors like `:hover` /
`:has()`, conditional styling, visual design tokens like colors and shadows) —
and when you do, put it in `scss/custom/` and keep lengths fluid with the
`df.fluid()` Sass function instead of hardcoding px:

```scss
.card:has(img) { padding: df.fluid(16, 48); }
```

## How the classes work (cheat sheet)

- **Numbers are pixels, output is rem**: `fs-16` → `font-size: 1rem`, `p-24` → `padding: 1.5rem`.
- **Fluid range `-min-max`**: `fs-16-48` → `clamp()` from 16px at the small viewport to 48px at the large one. Works on `fs`, paddings, margins, gaps, `w`/`maxw`/`minw`, `radius`, offsets, `stack`.
- **Breakpoint goes right after the prefix** (mobile-first min-width): `fs-md-24`, `p-lg-16-48`, `text-md-center`. Keywords also accept it at the end (`text-center-md`) — pick one style per project.
- **Keywords**: `flex`, `grid`, `hidden`, `flex-col`, `justify-between`, `align-center`, `text-start`/`text-end`, `fw-semibold`, `relative`/`absolute`/`sticky`, `overflow-hidden`, `object-cover`, `truncate`, `sr-only`, …
- **Grid**: `cols-3` (equal), `cols-1.3` or `cols-1:3` (ratio 1fr 3fr), `cols-fit-250` (auto-fit: as many ≥250px columns as fit — prefer this over breakpoint chains), `span-2` / `colspan-2` / `rowspan-2` on children, `gap-16-32`.
- **Stack rhythm**: `stack-16-32` on a parent spaces all direct children (owl selector) — use it for CMS body fields, forms, card innards instead of `mb-*` on every child. Any `mt-*` on a child overrides it.
- **Offsets**: `top-0`, `inset-0`, `start-16` / `end-16` (logical), fluid `top-10-30`, negative `bottom-n10`. Pair with `absolute`/`fixed`/`sticky`.
- **Aspect ratio**: `ratio-16/9` → `aspect-ratio: 16 / 9`.
- **Units** (sizing prefixes only): `w-50%`, `h-100dvh`, `minh-80svh`, `maxw-65ch` (reading measure).
- **Negatives** via `n`: `mt-n10`, `ls-n2`, `z-n1`. **Auto**: `m-auto`, `mx-auto`, `w-auto`.
- **Heights are fixed-only** — no `h-100-300`. Use viewport units (`h-100dvh`) for responsive heights.
- `lh-1.5` is literal, `ls-5` is percent of font size, `fw-700` / `order-2` / `z-10` are literal integers.

## Workflow rules

1. **Never edit the generated CSS file** (the `--out` target, e.g. `css/main.css` or `scss/_dopamine.scss`). It is overwritten on every build. Change the class in the template instead.
2. **Rebuild after adding classes**: `npm run build` (or `npm run dev` for watch mode). A class that hasn't been compiled does nothing in the browser.
3. **Dynamic class names need the safelist.** The scanner only sees literal classes in templates. If code builds a class name at runtime (`'fs-' + size`, `'block-' ~ slug`), add the final names to `dopamine-safelist.txt` — one per line.
4. **Check the build output for skipped classes.** Unknown or malformed classes are skipped with a diagnostic explaining the fix (e.g. `z-10-md — breakpoint goes after the prefix — write 'z-md-10'`). If a style "doesn't apply", this is the first place to look.
5. **Don't write Tailwind or Bootstrap syntax.** Common traps: `w-1/2` → dopamine is `w-50%`; `md:flex` → `flex-md`; `space-y-4` → `stack-16`; `aspect-video` → `ratio-16/9`; `mx-4` means 4px→0.25rem here, not a scale step.
6. **Prefer the fluid/structural solution over breakpoint chains**: `fs-16-48` over `fs-sm-18 fs-md-24 fs-lg-32`; `cols-fit-250` over `cols-1 cols-sm-2 cols-md-3 cols-lg-4`; `stack-16-32` over per-child margins.
7. **Prefer logical properties** (`ps`/`pe`, `ms`/`me`, `text-start`/`text-end`, `start-*`/`end-*`) over physical left/right — they flip automatically in RTL.
8. **Keep spellings consistent** — `cols-1.3` vs `cols-1:3`, `span` vs `colspan`, `text-md-center` vs `text-center-md` compile identically; follow whichever style this project already uses. `npx dopamine-audit` flags mixed spellings and near-duplicate fluid ranges worth merging.
9. **Viewport and breakpoints live in `dopamine.config.json`** — don't assume Tailwind defaults. Fluid math runs over the configured viewport (default 320–1440px).

## Commands

```bash
npm run build          # compile classes + sass once
npm run dev            # watch mode + live reload
npx dopamine-audit     # find near-duplicate ranges and mixed spellings
```
