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

---

## Features

- **Fluid by default** — every value scales smoothly via `clamp()`, no media query spam
- **Class name = spec** — `fs-16-48` means font-size from 16px to 48px. Nothing to memorize
- **CSS Grid** — `grid cols-1 cols-md-1.3 cols-lg-4` with custom ratios via dot notation
- **Keyword utilities** — display, flexbox, alignment, position, overflow, z-index
- **Breakpoint variants** — any class + `-md`, `-lg`, `-xl` etc. for responsive behavior
- **Sass addon** — `dp.fluid()` function for custom styles (optional, independent)
- **Components addon** — pre-built structural CSS for accordion, modal, etc. (optional, independent)
- **Modern CSS reset** — included automatically in every build
- **Only what you use** — scans your files, generates only the classes found
- **Fast** — 100 files in ~50ms, deduplicates across all files

---

## Quick Start

```bash
npm install
```

1. Set your template path in `dopamine.config.json`:

```json
{
  "input": "./templates",
  "ext": "html",
  "out": "./scss/_dopamine.scss"
}
```

2. Build or watch:

```bash
npm run build         # scan → generate SCSS → compile CSS
npm run dev           # watch + Sass + browser auto-reload
```

---

## Project Structure

```
dopamine-fluid/
├── bin/
│   └── dopamine.js               # CLI entry point
├── lib/
│   ├── config.js                 # PREFIX_MAP, breakpoints, config loading
│   ├── generator.js              # clamp() builder, CSS rule generator
│   ├── generator-sass.js         # Sass function file generator
│   ├── grid-parser.js            # keyword class parser (display, flex, etc.)
│   ├── grid-generator.js         # keyword CSS generator
│   ├── parser.js                 # class extraction & fluid parsing
│   ├── runner.js                 # orchestrator (build + watch)
│   └── scanner.js                # file resolver
├── addons/
│   ├── sass/
│   │   └── _functions.scss       # Sass addon — fluid() function
│   └── components/
│       └── accordion.scss        # Component addon — structure only
├── scss/
│   ├── _dopamine.scss            # generated — utility classes
│   └── main.scss                 # imports dopamine
├── css/
│   └── main.css                  # compiled
├── docs/                         # docs site (uses Dopamine itself)
├── dopamine.config.json
├── package.json
└── README.md
```

---

## NPM Scripts

| Command | What it does |
|---------|-------------|
| `npm run build` | Scan HTML → generate SCSS → compile CSS (one-time) |
| `npm run dev` | Watch HTML + SCSS + auto-reload browser |
| `npm run dev:ddev` | Same but proxies a DDEV URL for Drupal |
| `npm run dry` | Preview generated CSS in terminal |
| `npm run dopamine` | Only scan HTML → generate `_dopamine.scss` |
| `npm run audit:classes` | Audit numeric classes and suggest close min-max merge candidates |
| `npm run sass` | Only compile SCSS → CSS |

### Development with DDEV

```bash
DDEV_URL=https://mysite.ddev.site BS_PORT=3001 npm run dev:ddev
```

---

## CLI Usage

```bash
dopamine [input] [options]
```

| Flag | Description | Default |
|------|-------------|---------|
| `input` | File, directory, or glob to scan | `.` |
| `-c, --config <file>` | Config file path | `dopamine.config.json` |
| `-o, --out <file>` | Output file (.css or .scss) | `fluid.css` |
| `-w, --watch` | Watch for changes and rebuild | — |
| `--ext <exts>` | Extensions to scan (comma-separated) | `twig,html,htm` |
| `--no-header` | Omit the generated header comment | — |
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
| `lh` | `line-height` | `lh-15` → 1.5 | — | `lh-md-15` |
| **Padding** | | | | |
| `p` | `padding` | `p-16` | `p-16-48` | `p-md-16` / `p-md-16-48` |
| `pt` | `padding-top` | `pt-16` | `pt-16-48` | `pt-md-16` / `pt-md-16-48` |
| `pb` | `padding-bottom` | `pb-16` | `pb-16-48` | `pb-md-16` |
| `pl` | `padding-left` | `pl-16` | `pl-16-48` | `pl-md-16` |
| `pr` | `padding-right` | `pr-16` | `pr-16-48` | `pr-md-16` |
| `px` | `padding-left` + `right` | `px-16` | `px-16-48` | `px-md-16` / `px-md-16-48` |
| `py` | `padding-top` + `bottom` | `py-16` | `py-16-48` | `py-md-16` / `py-md-16-48` |
| **Margin** | | | | |
| `m` | `margin` | `m-16` | `m-16-48` | `m-md-16` / `m-md-16-48` |
| `mt` | `margin-top` | `mt-16` | `mt-16-48` | `mt-md-16` / `mt-md-16-48` |
| `mb` | `margin-bottom` | `mb-16` | `mb-16-48` | `mb-md-16` / `mb-md-16-48` |
| `ml` | `margin-left` | `ml-16` | `ml-16-48` | `ml-md-16` |
| `mr` | `margin-right` | `mr-16` | `mr-16-48` | `mr-md-16` |
| `mx` | `margin-left` + `right` | `mx-16` | `mx-16-48` | `mx-md-16` / `mx-md-16-48` |
| `my` | `margin-top` + `bottom` | `my-16` | `my-16-48` | `my-md-16` / `my-md-16-48` |
| **Margin Auto** | | | | |
| `mx-auto` | `margin-left: auto` + `right: auto` | — | — | `mx-md-auto` |
| `my-auto` | `margin-top: auto` + `bottom: auto` | — | — | `my-md-auto` |
| `ml-auto` | `margin-left: auto` | — | — | `ml-md-auto` |
| `mr-auto` | `margin-right: auto` | — | — | `mr-md-auto` |
| `mt-auto` | `margin-top: auto` | — | — | `mt-md-auto` |
| `mb-auto` | `margin-bottom: auto` | — | — | `mb-md-auto` |
| **Sizing** | | | | |
| `w` | `width` | `w-200` | `w-200-600` | `w-md-200` / `w-md-200-600` |
| `h` | `height` | `h-100` | `h-100-300` | `h-md-100` |
| `maxw` | `max-width` | `maxw-800` | `maxw-400-800` | `maxw-md-800` |
| `minw` | `min-width` | `minw-320` | `minw-200-400` | `minw-md-320` |
| `maxh` | `max-height` | `maxh-400` | `maxh-200-400` | `maxh-md-400` |
| `minh` | `min-height` | `minh-200` | `minh-100-300` | `minh-md-200` |
| **Gap** | | | | |
| `gap` | `gap` | `gap-16` | `gap-16-32` | `gap-md-16` / `gap-md-16-32` |
| `gapx` | `column-gap` | `gapx-16` | `gapx-16-32` | `gapx-md-16` |
| `gapy` | `row-gap` | `gapy-16` | `gapy-16-32` | `gapy-md-16` |
| **Other** | | | | |
| `radius` | `border-radius` | `radius-8` | `radius-4-16` | `radius-md-8` / `radius-md-4-16` |
| `cols` | `grid-template-columns` | `cols-3` / `cols-1.3` | — | `cols-md-3` / `cols-md-1.3` |
| `container` | `max-width` + centered | `container-1200` | — | — |

> **Notes:**
> - `fw` is unitless — `fw-700` outputs `font-weight: 700`, not rem. No fluid range.
> - `lh` is unitless, fixed only (no fluid range). Values ≥ 10 are divided by 10: `lh-15` → `1.5`, `lh-12` → `1.2`. Values < 10 are whole numbers: `lh-2` → `2`. Supports breakpoints: `lh-md-15`
> - `cols` supports dot notation for ratios: `cols-1.3` = `1fr 3fr`, `cols-1.2.1` = `1fr 2fr 1fr`
> - `container` is standalone — any number works, containers can be nested
> - All pixel values are converted to `rem` (divided by 16) in the output
> - Viewport override syntax: `fs-16-48--480-1920` uses 480px–1920px instead of config default

### Keyword Classes

No value needed — each keyword maps to a single CSS declaration. **All support breakpoint variants** by appending `-{bp}`.

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
| `text-left` | `text-align: left` | `text-left-md` |
| `text-center` | `text-align: center` | `text-center-md` |
| `text-right` | `text-align: right` | `text-right-md` |
| **Font Weight** (named) | | |
| `fw-light` | `font-weight: 300` | `fw-light-md` |
| `fw-normal` | `font-weight: 400` | `fw-normal-md` |
| `fw-medium` | `font-weight: 500` | `fw-medium-md` |
| `fw-bold` | `font-weight: 700` | `fw-bold-md` |
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
| **Z-Index** | | |
| `z-0` | `z-index: 0` | `z-0-md` |
| `z-1` | `z-index: 1` | `z-1-md` |
| `z-2` | `z-index: 2` | `z-2-md` |
| `z-3` | `z-index: 3` | `z-3-md` |
| `z-4` | `z-index: 4` | `z-4-md` |
| `z-5` | `z-index: 5` | `z-5-md` |
| `z-10` | `z-index: 10` | `z-10-md` |
| `z-50` | `z-index: 50` | `z-50-md` |
| `z-100` | `z-index: 100` | `z-100-md` |

---

## Grid System

### Container

```html
<div class="container-960">     <!-- max-width: 960px, centered -->
<div class="container-1200">    <!-- max-width: 1200px, centered -->
<div class="container-1920">    <!-- max-width: 1920px, centered -->
```

Any number works. Containers can be nested.

### Columns — equal

```html
<div class="grid cols-1 cols-md-2 cols-lg-4 gap-16-32">
```

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

All keywords support breakpoint variants: append `-sm`, `-md`, `-lg`, `-xl`, `-xxl`.

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

### Sass Addon — `dp.fluid()`

For elements you can't add classes to (e.g. Drupal-rendered content). Import the function from `addons/sass/`:

```scss
@use 'dopamine-fluid/addons/sass/functions' as dp;

.node--article .field--body p {
  font-size: dp.fluid(16, 48);
  margin-bottom: dp.fluid(8, 24);
}

.hero-banner h1 {
  font-size: dp.fluid(32, 96, 480, 1920);  // custom viewport
}
```

When you output to `.scss`, Dopamine also auto-generates a `_dopamine-functions.scss` with your config's viewport defaults.

### Components Addon

Pre-built structural CSS for common UI patterns. No colors, no sizing — just behavior (transitions, open/close, visibility). Style with Dopamine classes in your HTML.

```scss
// Import the structure
@use 'dopamine-fluid/addons/components/accordion';
```

```html
<!-- Style with Dopamine classes -->
<details class="accordion__item radius-8 mb-8">
  <summary class="accordion__title p-12-24 fs-16-20 fw-bold">
    Question
  </summary>
  <div class="accordion__body">
    <div class="accordion__content p-12-24 fs-14-18">Answer</div>
  </div>
</details>
```

Available components: `accordion` (more coming).

---

## Config

Create a `dopamine.config.json` in your project root:

```json
{
  "input": "./templates",
  "ext": "html",
  "out": "./scss/_dopamine.scss",

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
| `out` | Output file (.css or .scss) | `fluid.css` |

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
2. Breakpoint range     →  sm (576px) → md (768px)
3. Per-prefix config    →  prefixes.fs.vpMin / vpMax
4. Global default       →  viewport.min / max
```

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

## CSS Reset

Every build includes a modern CSS reset:

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
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.grid {
  display: grid;
}

/* Base */

.cols-1 {
  grid-template-columns: repeat(1, 1fr);
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
    grid-template-columns: 1fr 3fr;
  }
}
```

---

## License

MIT
