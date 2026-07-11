```
 ____   ___  ____   _    __  __ ___ _   _ _____   _____ _    _   _ ___ ____
|  _ \ / _ \|  _ \ / \  |  \/  |_ _| \ | | ____| |  ___| |  | | | |_ _|  _ \
| | | | | | | |_) / _ \ | |\/| || ||  \| |  _|   | |_  | |  | | | || || | | |
| |_| | |_| |  __/ ___ \| |  | || || |\  | |___  |  _| | |__| |_| || || |_| |
|____/ \___/|_| /_/   \_\_|  |_|___|_| \_|_____| |_|   |_____\___/|___|____/
```

# Dopamine Fluid

**The CSS that makes you feel good.**

A Node.js CLI that scans your HTML/Twig templates and generates fluid CSS using `clamp()` — plus CSS Grid, flexbox, display, and layout utilities. All from class names. Zero runtime.

```html
<div class="container-1200 p-16-48">
  <h1 class="fs-32-72 fw-bold mb-16-40">Hello World</h1>
  <div class="grid cols-1 cols-md-2 cols-lg-4 gap-16-32">
    <div class="p-12-32 radius-4-12">Card</div>
  </div>
</div>
```

```
dopamine ./templates --ext twig --out ./scss/_dopamine.scss
```

177 rules. 12KB. 20ms.

> Documentation: https://panfotis.github.io/dopamine-fluid-css/

> [!IMPORTANT]
> **Upgrading to 0.9.0?** Two breaking changes: `z-10-md` becomes `z-md-10` (z-index is a numeric prefix now — the build tells you exactly what to rewrite), and `container-N` emits rem instead of px (same computed size at the default root font-size). See the [Changelog](#changelog).

---

## Features

- **Fluid by default** — every value scales smoothly via `clamp()`, no media query spam
- **Class name = spec** — `fs-16-48` means font-size from 16px to 48px. Nothing to memorize
- **CSS Grid** — `grid cols-1 cols-md-1.3 cols-lg-4` with custom ratios via dot notation
- **Keyword utilities** — display, flexbox, alignment, position, overflow, z-index
- **Breakpoint variants** — any class + `-md`, `-lg`, `-xl` etc. for responsive behavior
- **Sass addon** — `df.fluid()` function for custom styles (optional, independent)
- **Components addon** — pre-built structural CSS for accordion, modal, etc. (optional, independent)
- **Modern CSS reset** — included automatically in every build
- **Only what you use** — scans your files, generates only the classes found
- **Fast** — 100 files in ~50ms, deduplicates across all files

---

## Quick Start

```bash
npm install --save-dev dopamine-fluid sass concurrently browser-sync
npx dopamine-fluid init
```

`dopamine init` copies a starter `templates/` folder, `scss/` entrypoint, `dopamine.config.json`, and `dopamine-safelist.txt` into your project. If a `package.json` already exists, it also adds missing `dopamine`, `sass`, `build`, and `dev` scripts without overwriting your existing scripts.

Build the starter project:

```bash
npm run build         # if init added package.json scripts
npm run dev           # watch + BrowserSync live reload

# Or run the tools directly
npx dopamine
npx sass scss/main.scss:css/main.css scss/custom:css/custom --no-source-map
```

---

## Starter Structure

The scaffolded project uses this structure. Files marked as generated appear after the first build:

```
your-project/
├── package.json                   # optional — if present, init adds missing scripts
├── dopamine.config.json           # scan/output configuration
├── dopamine-safelist.txt                   # optional extra classes to compile
├── templates/
│   └── index.html                 # starter markup
├── scss/
│   ├── _dopamine.scss             # generated — utility classes
│   ├── _dopamine-functions.scss   # generated — fluid() + breakpoint mixins
│   ├── main.scss                  # your SCSS entrypoint
│   └── custom/                    # optional extra SCSS files
└── css/
    ├── main.css                   # compiled output
    └── custom/                    # compiled custom styles
```

---

## Starter Scripts

If `package.json` exists, `dopamine init` adds these scripts when they are missing:

| Command | What it does |
|---------|-------------|
| `npm run dopamine` | Only scan HTML → generate `_dopamine.scss` |
| `npm run sass` | Only compile SCSS → CSS |
| `npm run build` | Run `dopamine` + `sass` together |
| `npm run dev` | Watch templates and SCSS, then live-reload with BrowserSync |

### Direct Commands

If you do not want package.json scripts, run the tools directly:

```bash
npx dopamine
npx sass scss/main.scss:css/main.css scss/custom:css/custom --no-source-map

# Watch mode
npx dopamine --watch
npx sass scss/main.scss:css/main.css scss/custom:css/custom --no-source-map --watch
```

### Repository Development

These scripts are for working on the `dopamine-fluid` repository itself, not for projects that install it from npm:

| Command | What it does |
|---------|-------------|
| `npm run dev` | Watch the repo demo templates + Sass + BrowserSync |
| `npm run dev:ddev` | Same but proxies a DDEV URL for Drupal |
| `npm run dry` | Preview generated CSS in terminal |
| `npm test` | Run CLI/config regression tests |
| `npm run docs:build` | Build the docs site |
| `npm run docs:dev` | Watch the docs site |

### Custom SCSS

Any `.scss` file in `scss/custom/` (without a `_` prefix) is compiled to its own `.css` file in `css/custom/`. Useful for Drupal libraries or page-specific styles.

---

## CLI Usage

```bash
dopamine init [target]
dopamine [input] [options]
```

### Commands

| Command | What it does |
|---------|-------------|
| `dopamine init [target]` | Copy the starter files into a project directory. Adds missing `dopamine`, `sass`, `build`, and `dev` scripts when `package.json` exists |
| `dopamine [input] [options]` | Scan templates and generate CSS/SCSS |

### Generate Options

| Flag | Description | Default |
|------|-------------|---------|
| `input` | File, directory, or glob to scan | `.` |
| `-c, --config <file>` | Config file path | `dopamine.config.json` |
| `-o, --out <file>` | Output file (.css or .scss) | `scss/_dopamine.scss` |
| `-w, --watch` | Watch for changes and rebuild | — |
| `--ext <exts>` | Extensions to scan (comma-separated) | `twig,html,htm` |
| `--no-header` | Omit the generated header comment | — |
| `--no-reset` | Omit the CSS reset | — |
| `--classes <file>` | Path to a file with class names to compile (one per line) | — |
| `--manifest <file>` | Emit list of compiled class names as JSON to `<file>` | — |
| `--dry-run` | Print to stdout, don't write | — |

When `--out` ends in `.scss`, Dopamine also generates `_dopamine-functions.scss` alongside it.

---

## Class Reference

### How class names work

```
prefix-{value}                         → fixed (converted to rem)
prefix-{min}-{max}                     → fluid (clamp between viewports)
prefix-{bp}-{value}                    → fixed at breakpoint
prefix-{bp}-{min}-{max}               → fluid at breakpoint
prefix-{min}-{max}--{vpMin}-{vpMax}   → fluid with custom viewport
```

### Value Prefixes

| Prefix | CSS Property | Fixed | Fluid (min-max) | Breakpoint |
|--------|-------------|-------|-----------------|------------|
| **Typography** | | | | |
| `fs` | `font-size` | `fs-16` | `fs-16-48` | `fs-md-16` / `fs-md-16-48` |
| `fw` | `font-weight` | `fw-700` | — | — |
| `lh` | `line-height` | `lh-1.5` → 1.5 | — | `lh-md-1.5` |
| `ls` | `letter-spacing` | `ls-5` = 5% of font size → 0.05em | — | `ls-md-10` |
| **Padding** | | | | |
| `p` | `padding` | `p-16` | `p-16-48` | `p-md-16` / `p-md-16-48` |
| `pt` | `padding-top` | `pt-16` | `pt-16-48` | `pt-md-16` / `pt-md-16-48` |
| `pb` | `padding-bottom` | `pb-16` | `pb-16-48` | `pb-md-16` |
| `ps` | `padding-inline-start` | `ps-16` | `ps-16-48` | `ps-md-16` |
| `pe` | `padding-inline-end` | `pe-16` | `pe-16-48` | `pe-md-16` |
| `px` | `padding-left` + `right` | `px-16` | `px-16-48` | `px-md-16` / `px-md-16-48` |
| `py` | `padding-top` + `bottom` | `py-16` | `py-16-48` | `py-md-16` / `py-md-16-48` |
| **Margin** | | | | |
| `m` | `margin` | `m-16` | `m-16-48` | `m-md-16` / `m-md-16-48` |
| `mt` | `margin-top` | `mt-16` | `mt-16-48` | `mt-md-16` / `mt-md-16-48` |
| `mb` | `margin-bottom` | `mb-16` | `mb-16-48` | `mb-md-16` / `mb-md-16-48` |
| `ms` | `margin-inline-start` | `ms-16` | `ms-16-48` | `ms-md-16` |
| `me` | `margin-inline-end` | `me-16` | `me-16-48` | `me-md-16` |
| `mx` | `margin-left` + `right` | `mx-16` | `mx-16-48` | `mx-md-16` / `mx-md-16-48` |
| `my` | `margin-top` + `bottom` | `my-16` | `my-16-48` | `my-md-16` / `my-md-16-48` |
| **Margin Auto** | | | | |
| `mx-auto` | `margin-left: auto` + `right: auto` | — | — | `mx-md-auto` |
| `my-auto` | `margin-top: auto` + `bottom: auto` | — | — | `my-md-auto` |
| `ms-auto` | `margin-inline-start: auto` | — | — | `ms-md-auto` |
| `me-auto` | `margin-inline-end: auto` | — | — | `me-md-auto` |
| `mt-auto` | `margin-top: auto` | — | — | `mt-md-auto` |
| `mb-auto` | `margin-bottom: auto` | — | — | `mb-md-auto` |
| **Sizing** | | | | |
| `w` | `width` | `w-200` | `w-200-600` | `w-md-200` / `w-md-200-600` |
| `h` | `height` | `h-100` | — | `h-md-100` |
| `maxw` | `max-width` | `maxw-800` | `maxw-400-800` | `maxw-md-800` |
| `minw` | `min-width` | `minw-320` | `minw-200-400` | `minw-md-320` |
| `maxh` | `max-height` | `maxh-400` | — | `maxh-md-400` |
| `minh` | `min-height` | `minh-200` | — | `minh-md-200` |
| **Sizing Auto** | | | | |
| `w-auto` | `width: auto` | — | — | `w-md-auto` |
| `h-auto` | `height: auto` | — | — | `h-md-auto` |
| **Gap** | | | | |
| `stack` | `margin-top` between children (owl selector) | `stack-24` | `stack-16-32` | `stack-md-16-32` |
| `gap` | `gap` | `gap-16` | `gap-16-32` | `gap-md-16` / `gap-md-16-32` |
| `gapx` | `column-gap` | `gapx-16` | `gapx-16-32` | `gapx-md-16` |
| `gapy` | `row-gap` | `gapy-16` | `gapy-16-32` | `gapy-md-16` |
| **Other** | | | | |
| `radius` | `border-radius` | `radius-8` | `radius-4-16` | `radius-md-8` / `radius-md-4-16` |
| `cols` | `grid-template-columns` | `cols-3` / `cols-1.3` / `cols-1:3` | — | `cols-md-3` / `cols-md-1:3` |
| `cols-fit` / `cols-fill` | `grid-template-columns` (auto-fit/fill) | `cols-fit-250` — as many ≥250px columns as fit | — | `cols-fit-md-300` |
| `span` | `grid-column` | `span-3` → `span 3` | — | `span-md-4` |
| `colspan` | `grid-column` | `colspan-3` → `span 3` (alias for `span`) | — | `colspan-md-4` |
| `rowspan` | `grid-row` | `rowspan-2` → `span 2` | — | `rowspan-md-3` |
| `order` | `order` | `order-1` | — | `order-md-2` / `order-lg-4` |
| `z` | `z-index` | `z-10` / `z-999` / `z-n1` | — | `z-md-10` |
| `top` | `top` | `top-0` / `top-n10` | `top-10-30` | `top-md-16` |
| `bottom` | `bottom` | `bottom-0` / `bottom-n10` | `bottom-10-30` | `bottom-md-16` |
| `start` | `inset-inline-start` | `start-16` / `start-n8` | `start-8-24` | `start-md-24` |
| `end` | `inset-inline-end` | `end-16` / `end-n8` | `end-8-24` | `end-md-24` |
| `inset` | `inset` | `inset-0` | `inset-8-24` | `inset-lg-0` |
| `grow` | `flex-grow` | `grow-0` / `grow-1` | — | `grow-md-2` |
| `shrink` | `flex-shrink` | `shrink-0` / `shrink-1` | — | `shrink-md-0` |
| `ratio` | `aspect-ratio` | `ratio-16/9` / `ratio-1/1` | — | `ratio-md-4/3` |
| `container` | `max-width` + centered | `container-1200` | — | — |

> **Notes:**
> - `ps` / `pe` / `ms` / `me` emit **logical properties** (`padding-inline-start`, `padding-inline-end`, `margin-inline-start`, `margin-inline-end`). In LTR these behave identically to left/right; in RTL they automatically flip to the start/end of the reading direction.
> - **Negative values via `n` prefix**: `mt-n10` → `margin-top: -0.625rem`, `ls-n5` → `letter-spacing: -0.05em`, `order-n1` → `order: -1`. Works with breakpoints (`mt-md-n10`) and fluid ranges where applicable (`mt-n10-n5`). Opt-in per prefix — only margins (`m` / `mt` / `mb` / `ms` / `me` / `mx` / `my`), `ls`, `order`, `z`, and the position offsets (`top` / `bottom` / `start` / `end` / `inset`) accept negatives. Others (`fs`, `p*`, `w`, `h`, `lh`, etc.) reject them with a clear warning.
> - `fw` is unitless — `fw-700` outputs `font-weight: 700`, not rem. No fluid range.
> - `order` is unitless, fixed-only (no fluid range). Applies to flex **and** grid items. Positive integers only. Supports breakpoints: `order-1`, `order-md-2`, `order-lg-4`.
> - `z` is unitless, fixed-only — any integer works (`z-999`), negatives via `n` (`z-n1` → `z-index: -1`). **0.9.0 breaking change**: z was previously a fixed set of keywords (`z-0`–`z-100`) with the breakpoint at the end — `z-10-md` must become `z-md-10`.
> - `span` / `rowspan` apply to **grid children** — use alongside `cols-N` on the parent. `span-3` makes the item occupy 3 column tracks; `rowspan-2` makes it span 2 rows. Supports breakpoints: `span-md-4`, `rowspan-lg-3`. Positive integers only (discrete grid lines); fluid ranges and negatives aren't meaningful here.
> - `grow` / `shrink` apply to **flex children** — `grow-1` makes an item fill available space, `shrink-0` keeps an item from shrinking (useful for fixed sidebars). Unitless integers, fixed-only. Supports breakpoints: `grow-md-2`, `shrink-md-0`.
> - `ratio` uses a **slash**, not dots — the class name is the literal CSS value: `ratio-16/9` → `aspect-ratio: 16 / 9`. (Dots stay reserved for `cols` ratios, where `cols-1.3` means `1fr 3fr`.)
> - `cols` ratio parts can be separated by dots **or colons** — `cols-1:3` ≡ `cols-1.3` → `1fr 3fr`, `cols-1:2:1` ≡ `cols-1.2.1`. The colon reads as ratio notation (1:3); pick one style per project.
> - `stack` puts fluid rhythm **between direct children** instead of styling the element itself: `stack-16-32` emits `:where(.stack-16-32) > * + * { margin-top: clamp(…) }`. No space above the first child or below the last. Made for markup you don't control — CMS body fields, Drupal form items, card innards. The `:where()` keeps specificity at zero, so any margin utility on a child overrides it: `mt-40-64` for extra space above one element, `mt-0` to glue two elements together. Use `gap` when the parent is already flex/grid; use `stack` in normal document flow.
> - Position offsets pair with the `relative` / `absolute` / `fixed` / `sticky` keywords. `start` / `end` are **logical** (`inset-inline-start/end`), like `ps` / `pe` — they flip automatically in RTL. `absolute inset-0` is the full-overlay pattern.
> - `lh` is unitless, fixed only (no fluid range), and takes the **literal** value — decimals included: `lh-1.5` → `1.5`, `lh-0.8` → `0.8`, `lh-2` → `2`. The class name is the CSS value; nothing is divided. Unitless is deliberate — a unitless line-height inherits as a multiplier of each element's *own* font-size, so it pairs correctly with fluid `fs-*`. Supports breakpoints: `lh-md-1.2`
>   - ⚠️ **Changed in 0.8.0** — `lh` used to divide by 10 (`lh-15` meant 1.5). It no longer does: `lh-15` now means `line-height: 15`. Rewrite old classes as `lh-1.5`.
>   - The dot means different things per prefix: in `lh-1.5` it's a **decimal**; in `cols-1.3` it's a **ratio list** (`1fr 3fr`). Only `lh` accepts decimals — `fs-16.5` is rejected.
> - `ls` is a **percentage of the font size** — `ls-5` = 5% tracking → `letter-spacing: 0.05em` (≈ Tailwind `tracking-wider`), `ls-10` = 10% → `0.1em` (≈ `tracking-widest`), `ls-n5` = −5%. `em` *is* percent-of-font-size in CSS, so the number reads directly as a percentage and scales with fluid `fs`. Fixed-only; letter-spacing is idiomatically a per-breakpoint token, not a per-viewport one. Supports breakpoints: `ls-md-8`.
> - **The number rule, in one place:** length-ish numbers are **pixels converted to rem** (`fs-16` → `1rem`); unitless CSS values are **literal** (`lh-1.5`, `fw-700`, `order-2`, `z-10`); `ls` is a **percent of font size**; `cols` dots/colons are **ratio lists**; `ratio` slashes are the **literal CSS value**.
> - `h`, `maxh`, `minh` are **fixed-only** (no fluid ranges). Fluid clamp scales by viewport width, which produces wrong results on portrait/narrow viewports. Use viewport units for responsive heights: `h-100dvh`, `minh-80svh`, `maxh-50vh`
> - `cols` supports dot notation for ratios: `cols-1.3` = `minmax(0, 1fr) minmax(0, 3fr)`, `cols-1.2.1` = `minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)`. Tracks use `minmax(0, Nfr)` rather than a bare `Nfr` so a wide child (long unbreakable word, large image) can't stretch its column and break the ratio
> - `container` is standalone — any number works, containers can be nested
> - All pixel values are converted to `rem` (divided by 16) in the output
> - Viewport override syntax: `fs-16-48--480-1920` uses 480px–1920px instead of config default
> - **Unit suffixes** (sizing prefixes only — `w`, `h`, `maxw`, `minw`, `maxh`, `minh`):
>   append `%`, `vw`, `vh`, `vmin`, `vmax`, `svw`, `svh`, `lvw`, `lvh`, `dvw`, `dvh`, or `ch` to emit that unit verbatim — no rem conversion. `ch` is the reading-measure unit: `maxw-65ch` caps prose at ~65 characters per line, which is the actual typographic rule that `maxw-600` only approximates.
>   Examples: `w-50%` → `width: 50%`, `h-100dvh` → `height: 100dvh`, `minh-md-100svh` → `@media(md+) { min-height: 100svh }`.
>   Fixed-only (no fluid ranges of units).

### Keyword Classes

No value needed — each keyword maps to a single CSS declaration. **All support breakpoint variants** — put the breakpoint segment anywhere after the first word: `text-md-center` (Bootstrap-style middle, same position as numeric classes like `fs-md-24`) or `text-center-md` (end) both work.

| Class | CSS Output | With breakpoint |
|-------|-----------|----------------|
| **Display** | | |
| `block` | `display: block` | `block-md` |
| `inline` | `display: inline` | `inline-md` |
| `inline-block` | `display: inline-block` | `inline-block-md` |
| `flex` | `display: flex` | `flex-md` |
| `inline-flex` | `display: inline-flex` | `inline-flex-md` |
| `grid` | `display: grid` | `grid-md` |
| `inline-grid` | `display: inline-grid` | `inline-grid-md` |
| `hidden` | `display: none` | `hidden-md` |
| **Flex Direction** | | |
| `flex-row` | `flex-direction: row` | `flex-row-md` |
| `flex-row-reverse` | `flex-direction: row-reverse` | `flex-row-reverse-md` |
| `flex-col` | `flex-direction: column` | `flex-col-md` |
| `flex-col-reverse` | `flex-direction: column-reverse` | `flex-col-reverse-md` |
| **Flex Wrap** | | |
| `flex-wrap` | `flex-wrap: wrap` | `flex-wrap-md` |
| `flex-nowrap` | `flex-wrap: nowrap` | `flex-nowrap-md` |
| **Justify Content** | | |
| `justify-start` | `justify-content: flex-start` | `justify-start-md` |
| `justify-center` | `justify-content: center` | `justify-center-md` |
| `justify-end` | `justify-content: flex-end` | `justify-end-md` |
| `justify-between` | `justify-content: space-between` | `justify-between-md` |
| `justify-around` | `justify-content: space-around` | `justify-around-md` |
| `justify-evenly` | `justify-content: space-evenly` | `justify-evenly-md` |
| **Align Items** | | |
| `align-start` | `align-items: flex-start` | `align-start-md` |
| `align-center` | `align-items: center` | `align-center-md` |
| `align-end` | `align-items: flex-end` | `align-end-md` |
| `align-stretch` | `align-items: stretch` | `align-stretch-md` |
| `align-baseline` | `align-items: baseline` | `align-baseline-md` |
| **Align Self** (child) | | |
| `self-start` | `align-self: flex-start` | `self-start-md` |
| `self-center` | `align-self: center` | `self-center-md` |
| `self-end` | `align-self: flex-end` | `self-end-md` |
| `self-stretch` | `align-self: stretch` | `self-stretch-md` |
| `self-auto` | `align-self: auto` | `self-auto-md` |
| **Justify Items** (grid) | | |
| `justify-items-start` | `justify-items: start` | `justify-items-start-md` |
| `justify-items-center` | `justify-items: center` | `justify-items-center-md` |
| `justify-items-end` | `justify-items: end` | `justify-items-end-md` |
| `justify-items-stretch` | `justify-items: stretch` | `justify-items-stretch-md` |
| **Justify Self** (grid child) | | |
| `justify-self-start` | `justify-self: start` | `justify-self-start-md` |
| `justify-self-center` | `justify-self: center` | `justify-self-center-md` |
| `justify-self-end` | `justify-self: end` | `justify-self-end-md` |
| `justify-self-stretch` | `justify-self: stretch` | `justify-self-stretch-md` |
| **Place** | | |
| `place-center` | `place-items: center` | `place-center-md` |
| **Text Alignment** | | |
| `text-start` | `text-align: start` (logical, flips in RTL) | `text-md-start` |
| `text-end` | `text-align: end` (logical, flips in RTL) | `text-md-end` |
| `text-left` | `text-align: left` | `text-md-left` |
| `text-center` | `text-align: center` | `text-md-center` |
| `text-right` | `text-align: right` | `text-md-right` |
| **Font Weight** (named) | | |
| `fw-light` | `font-weight: 300` | `fw-md-light` |
| `fw-normal` | `font-weight: 400` | `fw-md-normal` |
| `fw-medium` | `font-weight: 500` | `fw-md-medium` |
| `fw-semibold` | `font-weight: 600` | `fw-md-semibold` |
| `fw-bold` | `font-weight: 700` | `fw-md-bold` |
| **Object Fit** | | |
| `object-cover` | `object-fit: cover` | `object-md-cover` |
| `object-contain` | `object-fit: contain` | `object-md-contain` |
| **Utilities** (multi-declaration) | | |
| `truncate` | `overflow: hidden` + `text-overflow: ellipsis` + `white-space: nowrap` | `truncate-md` |
| `sr-only` | visually hidden, accessible to screen readers | `sr-only-md` |
| **Position** | | |
| `relative` | `position: relative` | `relative-md` |
| `absolute` | `position: absolute` | `absolute-md` |
| `fixed` | `position: fixed` | `fixed-md` |
| `sticky` | `position: sticky` | `sticky-md` |
| **Overflow** | | |
| `overflow-hidden` | `overflow: hidden` | `overflow-hidden-md` |
| `overflow-auto` | `overflow: auto` | `overflow-auto-md` |
| `overflow-visible` | `overflow: visible` | `overflow-visible-md` |
| `overflow-scroll` | `overflow: scroll` | `overflow-scroll-md` |

---

## Grid System

### Container

```html
<div class="container-960">     <!-- max-width: 60rem (960px), centered -->
<div class="container-1200">    <!-- max-width: 75rem (1200px), centered -->
<div class="container-1920">    <!-- max-width: 120rem (1920px), centered -->
```

Any number works. Containers can be nested. Like every other numeric class, the number is pixels converted to rem (**0.9.0** — previously emitted raw px).

### Columns — equal

```html
<div class="grid cols-1 cols-md-2 cols-lg-4 gap-16-32">
```

### Columns — auto-fit (no breakpoints needed)

```html
<!-- As many ≥250px columns as fit; they stretch to fill the row -->
<div class="grid cols-fit-250 gap-16-32">
```

Emits `repeat(auto-fit, minmax(min(15.625rem, 100%), 1fr))` — the browser recomputes the column count at every width, so one class replaces a whole `cols-1 cols-sm-2 cols-md-3 cols-lg-4` chain. It also responds to the **container**, not just the viewport: the same cards get fewer columns in a sidebar than in the main area. The `min(…, 100%)` guard collapses to one full-width column when the container is narrower than the minimum. The number is the "my card still looks good this narrow" floor, px→rem as usual.

`cols-fill-250` is the same but keeps empty tracks (`auto-fill`) — cards stay card-sized instead of stretching when there are only a few. No max value — `1fr` already caps growth by adding a column as soon as another minimum fits. Use `cols-N` when the design demands an exact column count.

### Columns — custom ratios (dot notation)

```html
<!-- Sidebar layout: 1fr + 3fr -->
<div class="grid cols-1 cols-md-1.3 gap-16-32">

<!-- Holy grail: 1fr + 3fr + 1fr -->
<div class="grid cols-1 cols-md-1.3.1 gap-16-32">

<!-- Mix equal and ratio -->
<div class="grid cols-1 cols-md-1.3 cols-lg-4 gap-16-32">
```

### Gaps

```html
<div class="grid cols-3 gap-16-32">              <!-- fluid gap -->
<div class="grid cols-2 gap-16">                 <!-- fixed gap -->
<div class="grid cols-2 gapx-32-48 gapy-4-8">   <!-- split axes -->
```

---

## Keyword Classes

All keywords support breakpoint variants (`sm`, `md`, `lg`, `xl`, `xxl`) — the breakpoint segment can go anywhere after the first word: `flex-md-row-reverse` (Bootstrap-style middle) or `flex-row-reverse-md` (end).

### Display

```html
<div class="block">          <div class="inline">         <div class="inline-block">
<div class="flex">           <div class="inline-flex">    <div class="grid">
<div class="inline-grid">    <div class="hidden">

<!-- Responsive -->
<div class="hidden block-md">         <!-- hidden mobile, block at md -->
<div class="hidden grid-lg">          <!-- hidden mobile, grid at lg -->
```

### Flexbox

```html
<!-- Direction -->
<div class="flex flex-row">           <div class="flex flex-col">
<div class="flex flex-row-reverse">   <div class="flex flex-col-reverse">
<div class="flex flex-col flex-row-md">    <!-- stack mobile, row at md -->

<!-- Wrap -->
<div class="flex flex-wrap">          <div class="flex flex-nowrap">

<!-- Justify content -->
<div class="flex justify-start">      <div class="flex justify-center">
<div class="flex justify-end">        <div class="flex justify-between">
<div class="flex justify-around">     <div class="flex justify-evenly">

<!-- Align items -->
<div class="flex align-start">        <div class="flex align-center">
<div class="flex align-end">          <div class="flex align-stretch">
<div class="flex align-baseline">
```

### Grid / Flex Alignment

```html
<!-- Container -->
<div class="grid cols-3 align-center">              <!-- vertical -->
<div class="grid cols-3 justify-items-center">      <!-- horizontal -->
<div class="grid cols-3 place-center">              <!-- both axes -->

<!-- Child -->
<div class="self-start">      <div class="self-center">       <div class="self-end">
<div class="self-stretch">    <div class="self-auto">
<div class="justify-self-start">   <div class="justify-self-center">
<div class="justify-self-end">     <div class="justify-self-stretch">
```

### Text Alignment

```html
<p class="text-left">          <p class="text-center">         <p class="text-right">
<p class="text-center text-left-lg">     <!-- centered mobile, left at lg -->
```

### Font Weight

```html
<p class="fw-light">       <!-- 300 -->    <p class="fw-normal">      <!-- 400 -->
<p class="fw-medium">      <!-- 500 -->    <p class="fw-bold">        <!-- 700 -->
<p class="fw-900">         <!-- any numeric value -->
```

### Position

```html
<div class="relative">     <div class="absolute">
<div class="fixed">        <div class="sticky">     <div class="sticky-md">
```

### Overflow

```html
<div class="overflow-hidden">     <div class="overflow-auto">
<div class="overflow-scroll">     <div class="overflow-visible">
```

### Z-Index

```html
<div class="z-0">   <div class="z-1">   <div class="z-2">   <div class="z-3">
<div class="z-4">   <div class="z-5">   <div class="z-10">  <div class="z-50">  <div class="z-100">
```

---

## Addons

Dopamine has two optional addons. Both are independent — use either, both, or neither.

### Sass Addon — `df.fluid()`

For elements you can't add classes to (e.g. Drupal-rendered content). Import the function from `addons/sass/`:

```scss
@use 'dopamine-fluid/addons/sass/dopamine-functions' as df;

.node--article .field--body p {
  font-size: df.fluid(16, 48);
  margin-bottom: df.fluid(8, 24);
}

.hero-banner h1 {
  font-size: df.fluid(32, 96, 480, 1920);  // custom viewport
}
```

When you output to `.scss`, Dopamine also auto-generates a `_dopamine-functions.scss` with your config's viewport defaults.

### Breakpoint Mixins

Both the standalone addon and the auto-generated functions file include breakpoint mixins that match your config:

```scss
@use 'dopamine-functions' as df;

.sidebar {
  display: none;
  @include df.breakpoint-up(lg) { display: block; }
}

.mobile-only {
  @include df.breakpoint-down(md) { display: block; }
}
```

Available: `breakpoint-up($name)` (min-width) and `breakpoint-down($name)` (max-width). Breakpoint names come from your `dopamine.config.json`.

### Components Addon

Pre-built structural CSS for common UI patterns. No colors, no sizing — just behavior (transitions, open/close, visibility). Style with Dopamine classes in your HTML.

```scss
@use 'dopamine-fluid/addons/components/accordion/accordion';
@use 'dopamine-fluid/addons/components/menu/menu';
@use 'dopamine-fluid/addons/components/menu-drawer/menu-drawer';
@use 'dopamine-fluid/addons/components/tabs/tabs';
@use 'dopamine-fluid/addons/components/dropdown/dropdown';
@use 'dopamine-fluid/addons/components/collapse/collapse';
@use 'dopamine-fluid/addons/components/forms/checkbox';
@use 'dopamine-fluid/addons/components/forms/radio';
@use 'dopamine-fluid/addons/components/forms/switch';
@use 'dopamine-fluid/addons/components/forms/input';
```

Or pull all four form controls in with a single import:

```scss
@use 'dopamine-fluid/addons/components/forms/forms';   // bundles checkbox, radio, switch, input
```

The bundle also ships as a single `css/components/forms/forms.css` for non-Sass consumers — one `<link>` tag instead of four. Pick whichever fits: the bundle for "give me a working form", individual files for "I only need a switch".

```html
<!-- Accordion — style with Dopamine classes -->
<details class="accordion__item radius-8 mb-8">
  <summary class="accordion__title p-12-24 fs-16-20 fw-bold">Question</summary>
  <div class="accordion__body">
    <div class="accordion__content p-12-24 fs-14-18">Answer</div>
  </div>
</details>

<!-- Menu — side drawer on mobile, inline on desktop -->
<nav class="menu">
  <button class="menu__toggle p-8 fs-24">&#9776;</button>
  <div class="menu__overlay"></div>
  <div class="menu__drawer p-24-48">
    <button class="menu__close p-8 fs-24">&times;</button>
    <a href="#">Home</a>
    <a href="#">About</a>
  </div>
</nav>
```

The menu switches from drawer to inline at 768px by default. Override via Sass:

```scss
@use 'dopamine-fluid/addons/components/menu/menu' with ($menu-bp: 992px);
```

**Menu Drawer** (depends on `menu` — load `menu.js` on the same page) turns a multi-level nav's top-level dropdowns into right-sliding drawers on tablet/mobile (≤991px) and classic dropdowns on desktop. Triggers are detected by class structure — any `ul.menu.menu-level-0 > li` whose direct child is `.menu-dropdown-0` becomes a drawer. One drawer open at a time; auto-injects a back button + title with full ARIA and focus management on mobile; desktop is click-to-toggle by default, click-outside closes. Add `menu-drawer-hover` to the root `<ul>` to also reveal on hover / keyboard focus.

```html
<ul class="menu menu-level-0">
  <li class="menu-item menu-item--expanded">
    <a href="#">Products</a>
    <div class="menu-dropdown-0">
      <!-- any markup: columns, image cards, sub-lists, etc. -->
      <ul><li><a href="/a">Item A</a></li></ul>
    </div>
  </li>
</ul>
```

Override the breakpoint (default 992px, component active below it):

```scss
@use 'dopamine-fluid/addons/components/menu-drawer/menu-drawer' with ($menu-drawer-bp: 768px);
```

Keep the JS in sync with the SCSS breakpoint by setting `window.DOPE_MENU_DRAWER_BP = <bp - 1>` before the script loads. For a sticky header, set `--menu-drawer-top: 64px` on `:root` and the drawer sizes itself to the remaining viewport (uses `visualViewport.height` to handle iOS URL-bar changes).

**Mega dropdown (100vw on desktop)** — add `menu-dropdown-mega` to any `.menu-dropdown-0` and on desktop it becomes `position: fixed` spanning the full viewport width. Mobile is unchanged (still a right-slide drawer). Set `--menu-mega-top` on `:root` to your sticky nav's height so the dropdown sits flush below. Lay out the inside with dopamine grid/flex utilities — e.g. `<div class="grid cols-1 cols-md-4 gap-16-32 p-16-32">`.

Available components: `accordion`, `modal`, `menu`, `menu-drawer`, `tabs`, `dropdown`, `collapse`, `checkbox`, `radio`, `switch`, `input`.

**Backdrops** — `modal` and `menu` ship a dimmed backdrop out of the box (50% black). Override the dim with a custom property, no need to edit the component CSS:

```css
:root {
  --modal-backdrop: rgb(0 0 0 / 0.8);   /* .modal__overlay */
  --menu-backdrop:  rgb(0 0 0 / 0.3);   /* .menu__overlay */
}
```

**Scroll Lock** is a tiny shared helper (~30 lines, no CSS) that locks body scroll for `modal` and `menu`. Include it once and both components use it automatically. `menu` only locks while the drawer is actually in drawer mode (mobile) — desktop inline nav never triggers a lock. `menu-drawer` inherits the lock from its outer `menu` (the burger holds it for the whole session). Handles the iOS Safari `overflow: hidden` gap via `position: fixed` + scroll-position restore, and compensates for the desktop scrollbar so the page doesn't shift when it disappears. Ref-counted so nested dialogs don't unlock each other.

```html
<script src="https://cdn.jsdelivr.net/npm/dopamine-fluid/dist/components/scroll-lock/scroll-lock.js" defer></script>
```

Drive it manually if you have your own dialog: `dopamine.scrollLock.lock()` / `.unlock()` / `.isLocked()`. Without this file loaded, modal and menu-drawer still work — they just don't lock body scroll.

**Form components** (`checkbox`, `radio`, `switch`) are pure-CSS styled replacements for native `<input>` checkboxes and radios. They keep the real `<input>` in the DOM (accessible + form-submittable), visually hide it, and render a styled sibling that reacts to `:checked`. No JS, no a11y tradeoffs. Markup contract:

```html
<label class="df-checkbox">
  <input type="checkbox" class="df-checkbox__input">
  <span class="df-checkbox__box"></span>
  <span class="df-checkbox__label">Remember me</span>
</label>
```

Box/track sizes scale with the `<label>`'s `font-size`; borders and fill use `currentColor`, so you can size and colour the whole thing via Dopamine classes on the label.

For text entry, the `input` component provides a minimal `.df-input` class that applies to any text-like `<input>` (text, email, password, search, tel, url, number, date, time) and to `<textarea>`. It resets browser defaults and keeps everything at `currentColor` / `inherit`; apply `p-*`, `radius-*`, `fs-*` utilities on the same element to compose the look.

#### Using a component in your project

Three working paths, depending on your project's setup. All use `accordion` as the example — swap the component name (`modal`, `menu`, `menu-drawer`, `tabs`, `dropdown`, `collapse`, `forms/checkbox`, etc.) as needed.

**1. CDN (jsDelivr / unpkg)** — zero install, one tag per file:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/dopamine-fluid/dist/components/accordion/accordion.css">
<script src="https://cdn.jsdelivr.net/npm/dopamine-fluid/dist/components/accordion/accordion.js" defer></script>
```

For form controls, use the bundle (`dist/components/forms/forms.css`) for all four at once, or pin a single file (`dist/components/forms/checkbox.css`).

**2. Copy from `node_modules`** — for self-hosted setups (Drupal themes, static sites, anything that doesn't bundle JS). Add a one-liner to your project's `package.json`:

```json
"scripts": {
  "vendor:dopamine": "mkdir -p public/vendor/dopamine && cp -R node_modules/dopamine-fluid/dist/components/* public/vendor/dopamine/"
}
```

Run it once on `npm install` (or wire it as a `postinstall` hook), then reference the local copies:

```html
<link rel="stylesheet" href="/vendor/dopamine/accordion/accordion.css">
<script src="/vendor/dopamine/accordion/accordion.js" defer></script>
```

**3. Sass + bundler** — for projects with a build pipeline (webpack, vite, esbuild, parcel). Imports the source directly; your bundler/Sass compiles it into your own output:

```scss
// Your own SCSS file — compiled into your project's CSS bundle
@use 'dopamine-fluid/addons/components/accordion/accordion';
```

```js
// Your JS entry — bundler resolves and includes the script
import 'dopamine-fluid/addons/components/accordion/accordion';
```

This path uses the `addons/` source tree (not `dist/`), so changes to the source pull through your build automatically.

#### JavaScript API & events

Each component registers methods under `window.dopamine` and emits bubbling `CustomEvent`s on its root element, so you can drive components programmatically and react to state changes.

```js
// Drive components from your code
dopamine.modal.open('my-modal');
dopamine.tabs.activate('#panel-2');
dopamine.dropdown.closeAll();

// React to state changes (events bubble — delegate from document if you like)
document.addEventListener('df:modal:open', e => console.log('opened', e.target.id));
document.addEventListener('df:tabs:change', e => console.log('panel', e.detail.panel.id));
```

| Component | Events | API |
|---|---|---|
| accordion | `df:accordion:open`, `df:accordion:close` | `open(el)`, `close(el)`, `toggle(el)` |
| modal | `df:modal:open`, `df:modal:close` | `open(idOrEl)`, `close(idOrEl)`, `toggle(idOrEl)` |
| menu | `df:menu:open`, `df:menu:close` | `open(el)`, `close(el)`, `toggle(el)` |
| tabs | `df:tabs:change` (detail: `{ panel, trigger }`) | `activate(panelIdOrEl)` |
| dropdown | `df:dropdown:open`, `df:dropdown:close` | `open(el)`, `close(el)`, `toggle(el)`, `closeAll()` |
| collapse | `df:collapse:open`, `df:collapse:close` | `open(idOrEl)`, `close(idOrEl)`, `toggle(idOrEl)` |

Collapse is a generic show/hide primitive with a `data-collapse-target="#id"` trigger. The target's direct child must be `<div class="collapse__content">` (padding-free — your padded/styled content goes inside it, matching the `accordion__content` pattern). Default mode is in-flow with a height animation; add `collapse--absolute` for a floating fade (requires a positioned ancestor in the markup).

**Event timing.** Events fire *immediately after the class is flipped* — so `:open` fires when the opening transition is just starting, and `:close` fires when the hiding transition is just starting. That's the right moment for most work (updating state, logging, focusing an input).

If you need to wait for the transition to finish — e.g. to unmount content only once a modal has fully faded out — listen for `transitionend` on the element that actually animates:

```js
document.addEventListener('df:modal:close', e => {
  // e.target is the .modal (class already removed).
  // The .modal__dialog is what animates — wait for it:
  const dialog = e.target.querySelector('.modal__dialog');
  dialog.addEventListener('transitionend', () => {
    // fade-out finished — safe to unmount / free resources
  }, { once: true });
});
```

Pick whichever element has the transition in its CSS: `.modal__dialog` for modals, `.menu__drawer` for menu, `.dropdown__menu` for dropdown, `.accordion__body` for accordion. Tabs has no transition by default, so `df:tabs:change` already fires at the final state.

---

## Config

Create a `dopamine.config.json` in your project root:

```json
{
  "input": "./templates",
  "ext": "html",
  "out": "./scss/_dopamine.scss",
  "classes": "./dopamine-safelist.txt",

  "viewport": {
    "min": 320,
    "max": 1440
  },
  "breakpoints": {
    "sm": 576,
    "md": 768,
    "lg": 992,
    "xl": 1200,
    "xxl": 1400
  },
  "prefixes": {
    "fs": {
      "vpMin": 375,
      "vpMax": 1440
    }
  }
}
```

### Input / Output

| Key | Description | Default |
|-----|-------------|---------|
| `input` | File, directory, or glob to scan | `.` |
| `ext` | File extensions to scan (comma-separated) | `twig,html,htm` |
| `out` | Output file (.css or .scss) | `scss/_dopamine.scss` |
| `classes` | Path to a classes file (one class per line) | — |

These can also be passed as CLI flags — CLI args override config values.

```bash
# Uses config values
dopamine

# CLI overrides
dopamine ./src --ext twig --out ./scss/_dopamine.scss
```

### Viewport priority

```
1. Inline override      →  fs-16-48--480-1920
2. Per-prefix config    →  prefixes.fs.vpMin / vpMax
3. Global default       →  viewport.min / max
```

Breakpoint-prefixed classes (`fs-md-24-48`, `p-lg-16-32`, …) use the same clamp math as their base counterpart. The breakpoint only controls the `@media (min-width: …)` wrapper — it doesn't change the viewport range the clamp is computed over.

### Custom breakpoints

Add any you need. Set to `null` to remove a default:

```json
{
  "breakpoints": {
    "xxxl": 1600,
    "xxxxl": 1920,
    "xxl": null
  }
}
```

---

## Class Audit

Scan your templates and find near-duplicate fluid classes that could be merged:

```bash
npx dopamine-audit
```

Uses the same `input`, `ext` values from `dopamine.config.json` if no args are passed.

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `input` | File, directory, or glob to scan | from config or `.` |
| `--ext <exts>` | Extensions to scan | from config or `twig,html,htm` |
| `--prefix <list>` | Only audit these prefixes (comma-separated) | all |
| `--close-min <px>` | Max min-value delta for merge suggestions | `2` |
| `--close-max <px>` | Max max-value delta for merge suggestions | `4` |
| `--include-breakpoints` | Include breakpoint variants in suggestions | — |
| `--include-inline-vp` | Include inline viewport overrides in suggestions | — |
| `-o, --out [file]` | Write report to a file (plain text) | `audit` |

### Example output

```
Dopamine Class Audit
─────────────────────────────────
Files scanned              1
Numeric classes (unique)   31
Fluid ranges               24
Fixed values               7

Range Inventory
- fs@base: fs-16-20(9), fs-18-24(2), fs-24-48(7), fs-32-84(3)
- mb@base: mb-8-16(12), mb-16-32(2), mb-24-48(2)

Close-Range Merge Suggestions
Threshold: Δmin <= 2px and Δmax <= 4px
- fs @ base: keep `fs-16-20` (9 uses)
  replace `fs-18-24` (2 uses, Δmin 2px, Δmax 4px)
```

---

## Classes File

You can provide classes directly in a plain text file — one class per line. Useful for prototyping, generating a utility stylesheet from a curated list, or integrating with tools that output class lists.

Create a file (e.g. `dopamine-safelist.txt`):

```
# One class per line
fs-16-48
cols-3
```

Empty lines and lines starting with `#` are ignored.

Run via CLI:

```bash
npx dopamine --classes dopamine-safelist.txt
```

Or set it in `dopamine.config.json`:

```json
{
  "classes": "./dopamine-safelist.txt"
}
```

Classes from the file are merged with any template-scanned classes. Unrecognized class names trigger a per-class diagnostic so you can spot typos or wrong syntax early — e.g. `'px' suffix isn't needed`, `unit suffix 'dvh' is only supported on sizing prefixes`, `breakpoint 'xxl' not found in config.breakpoints`, `'h' doesn't support fluid ranges`. In watch mode, the classes file is also watched for changes.

> **What the scanner picks up.** Classes are extracted from three places in your templates:
>
> 1. Literal `class="..."` / `className="..."` attributes, **including ternary branches**. `class="{{ c ? 'fs-16' : 'fs-20' }}"` captures both `fs-16` and `fs-20`. Twig's one-sided shorthand works too: `class="item {{ active ? 'is-active' }}"`.
> 2. Twig `{% set <var> = ... %}` assignments — the RHS is scanned for string literals. Arrays, ternaries, or bare strings all work.
> 3. `addClass(...)` calls — every string literal in the argument list is extracted. Covers `addClass('foo bar')`, `addClass(['foo', 'bar'])`, and multi-arg forms like `addClass(classes, '', cond ? 'foo')`.
>
> Dynamic pieces that can't be known at build time still need the safelist:
>
> - **Concatenation** like `'block-' ~ slug` — the literal `'block-'` is seen but rejected as incomplete; the composed final names (`block-foo`, `block-bar`) go in the classes file.
> - **Variable-only references** like `link(title, url, {'class': link_classes})` or `removeClass(style_settings.width)` — no literal to extract.
> - **JS template literals** like `` className={`foo-${x}`} `` — use the safelist.
>
> Bare tokens in `<code>` blocks, comments, and prose are still ignored — only the three sources above feed the compiler.

---

## Development: refreshing the golden snapshot

The test suite includes a **golden-file integration test** that compiles a comprehensive fixture and compares the generated SCSS, Sass functions file, and diagnostic output byte-for-byte against committed expected files. It catches any unintended change to compiled output across the full pipeline.

When you intentionally change the fixture or production code that affects output, refresh the expected files:

```bash
UPDATE_GOLDEN=1 npm test
```

Commit the code change and the refreshed fixtures (`test/fixtures/golden.expected.*`) together — reviewers can then see exactly what user-visible output changed. When adding a new prefix, unit, or syntax, add a representative class to `test/fixtures/golden.html` (or `golden.classes.txt` for diagnostics) so the new feature is under the safety net too.

---

## Manifest

Emit a JSON list of every class Dopamine compiled. Useful for tooling that needs to know "what classes exist" without re-scanning templates — e.g. autocomplete in a CMS admin UI.

```bash
npx dopamine --manifest ./dopamine.manifest.json
```

Or via `dopamine.config.json`:

```json
{ "manifest": "./dopamine.manifest.json" }
```

Output:

```json
{
  "version": 2,
  "generated": "2026-04-15T09:40:18.818Z",
  "classes": [
    { "name": "cols-md-1.3", "count": 1 },
    { "name": "flex",        "count": 4 },
    { "name": "fs-16-48",    "count": 2 },
    { "name": "p-md-16-32",  "count": 1 }
  ]
}
```

The `classes` array is sorted alphabetically by `name` for deterministic diffs. Each entry includes `count` — the number of times the class was referenced across scanned templates (safelist-only classes get `count: 0`). The `version` field bumps when the shape changes in a breaking way.

`writeManifest` compares the new output against the existing file and skips the write when nothing changed — avoids touching the file's mtime and prevents downstream file watchers (e.g. a VS Code extension reading the manifest) from firing on no-op rebuilds.

---

## Benchmarking

Measure how long a build takes at realistic project scale:

```bash
npm run bench -- --files 200 --classes-per-file 100
# or directly:
node scripts/bench.js --files 500 --classes-per-file 200 --runs 5
node scripts/bench.js --help
```

The script generates a synthetic project in a tmp directory, runs the CLI with `DOPAMINE_TIMING=1`, and reports per-phase medians (scan / parse / generate / manifest) over multiple runs — twice per invocation, once with `--manifest` and once without, so you can see the manifest phase's contribution directly.

Phase timings are also available on any normal build:

```bash
DOPAMINE_TIMING=1 npx dopamine --manifest ./dopamine.manifest.json
```

Prints a `Timing (ms)` block after the usual build summary. Zero cost when the env var is unset.

Reference measurement (200 files × 100 classes, WSL2): full build ~20 ms, manifest write ~7 ms, scan ~11 ms. Watch-mode rebuilds at this scale are perceptually instant.

---

## CSS Reset

Every build includes a modern CSS reset by default. Disable with `--no-reset` or `"reset": false` in config:

```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
body { min-height: 100vh; line-height: 1.5; -webkit-font-smoothing: antialiased; }
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
```

---

## Using with Drupal

### Setup in your theme

```bash
cd /path/to/your/drupal-theme
dopamine ./templates --ext twig --out ./scss/_dopamine.scss
sass scss/main.scss:css/main.css
```

### Libraries

```yaml
# mytheme.libraries.yml
global-styling:
  css:
    theme:
      css/main.css: {}
```

### Gulp integration

```js
const { run } = require('dopamine-fluid/lib/runner');

function buildDopamine() {
  return run('./templates', {
    config: 'dopamine.config.json',
    out: './scss/_dopamine.scss',
    ext: 'twig',
  });
}

exports.dopamine = buildDopamine;
```

---

## Generated Output

```css
/* ================================================
 * Generated by Dopamine Fluid
 *
 * Default viewport : 320px – 1440px
 * Breakpoints      : sm: 576px, md: 768px, lg: 992px
 * Rules            : 8
 * ============================================== */

/* Reset */

*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
body { min-height: 100vh; line-height: 1.5; -webkit-font-smoothing: antialiased; }
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }

/* Grid */

.container-1200 {
  width: 100%;
  max-width: 75rem;
  margin-left: auto;
  margin-right: auto;
}

.grid {
  display: grid;
}

/* Base */

.cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.fs-16-48 {
  font-size: clamp(1rem, calc(2.8571vw + 0.4286rem), 3rem);
}

.gap-16-32 {
  gap: clamp(1rem, calc(1.4286vw + 0.7143rem), 2rem);
}

/* md — min-width: 768px */

@media (min-width: 768px) {
  .cols-md-1\.3 {
    grid-template-columns: minmax(0, 1fr) minmax(0, 3fr);
  }
}
```

---

## Changelog

### 0.9.0

**Breaking**

- **`z-*` breakpoint position moved.** z-index is now a numeric prefix like `order`, so any integer works (`z-999`) and negatives via `n` (`z-n1` → `z-index: -1`). The keyword-era breakpoint position no longer parses: rewrite `z-10-md` → `z-md-10`. Old forms aren't silently dropped — the build prints `breakpoint goes after the prefix — write 'z-md-10'`. Plain `z-0`…`z-100` compile unchanged.
- **`container-N` emits rem instead of px.** `container-1200` → `max-width: 75rem`. Same computed size at the default root font-size; it now scales with the user's font preference like every other numeric class. Only matters if you diff generated CSS or changed the root font-size.

**Added**

- **Breakpoint position unified.** Keywords now also accept the breakpoint right after the first word — `text-md-center`, `flex-md-row-reverse` (Bootstrap's exact shape, same slot as numeric `fs-md-24`). The end position (`text-center-md`) keeps working.
- **Position offsets**: `top` / `bottom` / `start` / `end` / `inset` — fluid ranges, negatives, and breakpoints (`top-10-30`, `bottom-n10`, `start-md-24`). `start`/`end` are logical (`inset-inline-start/end`), flipping automatically in RTL. `absolute inset-0` is the overlay pattern.
- **`ratio-16/9`** → `aspect-ratio: 16 / 9`, with breakpoint variants (`ratio-md-4/3`). Slash notation — the class name is the literal CSS value.
- **Keywords**: `text-start` / `text-end` (logical text-align — prefer these over `text-left`/`text-right`), `fw-semibold` (600), `object-cover` / `object-contain`, `truncate`, `sr-only`.
- **`stack-16-32`** — fluid vertical rhythm between direct children via the owl selector (`:where(.stack-16-32) > * + * { margin-top: clamp(…) }`). One class on the parent spaces CMS body fields, form items, and card content without classing every child; zero specificity means any `mt-*` on a child overrides it.
- **`cols-fit-250` / `cols-fill-250`** — auto-fit/auto-fill grids: as many ≥250px columns as fit, stretched to fill the row, with a `min(…, 100%)` overflow guard. One class instead of a breakpoint chain, and it responds to the container, not just the viewport.
- **`ch` unit** on sizing prefixes — `maxw-65ch` for reading measure (~65 characters per line).
- **`cols-1:3`** as an alias for `cols-1.3` — colons and dots both separate ratio parts.
- **`colspan-3`** as an explicit alias for `span-3`.

**Fixed**

- `cols-1-3` parsed as a fluid range and emitted `grid-template-columns: clamp(...)` — invalid CSS. Grid/special prefixes no longer take the generic numeric paths.
- Numeric classes with a trailing breakpoint (`fs-24-md`) now get a diagnostic naming the correct form instead of being silently skipped.

### 0.8.0

**Breaking**

- **`lh` values are now literal.** `lh` used to divide by 10 above a cutoff and emit whole numbers below it, so `lh-15` meant `1.5` — and `lh-8` silently meant `line-height: 8`, with `0.8` impossible to express. The value is now exactly what you write: `lh-1.5` → `1.5`, `lh-0.8` → `0.8`, `lh-2` → `2`.

  **Upgrading:** rewrite `lh-15` → `lh-1.5`, `lh-12` → `lh-1.2`, `lh-10` → `lh-1`. Single-digit values (`lh-1`, `lh-2`) already meant what they said and don't change. Old two-digit classes aren't rejected — `lh-15` now compiles to `line-height: 15`, which blows the leading out visibly so you can spot what's left to migrate.

- **`cols-*` emits `minmax(0, Nfr)` tracks** instead of bare `Nfr`. A bare `fr` track is really `minmax(auto, Nfr)`, so a child's intrinsic minimum width (a long unbreakable word, a wide image) could stretch its column and break the ratio — `cols-3` stopped being three equal columns. Tracks now hold their ratio regardless of content. No source changes needed; the generated CSS just gets correct.

**Added**

- `modal` and `menu` ship a visible backdrop (50% black), overridable with `--modal-backdrop` / `--menu-backdrop`. Previously `.modal__overlay` was transparent, so every project had to patch in its own dim.
- Decimal values are supported per-prefix via `allowsDecimal` — currently `lh` only. `fs-16.5` is still rejected, and `cols-1.3` remains a **ratio** (`1fr 3fr`), not a decimal.

**Fixed**

- A single typo'd inline viewport (`fs-16-48--1440-320`, min ≥ max) used to abort the entire build with no CSS written and no mention of the offending class — and in watch mode it killed the watcher. Such classes are now skipped like any other unrecognized class, with a diagnostic that names the fix. Inverted per-prefix viewports in `dopamine.config.json` are caught at load time.
- Watch mode did nothing for single-file and glob inputs (it only ever worked for directories), so saves silently never rebuilt.
- A positional input argument no longer discards `ext` / `out` from `dopamine.config.json` — `dopamine ./templates` was quietly writing to the default output path instead of your configured one. Explicit CLI flags still win.

---

## License

MIT
