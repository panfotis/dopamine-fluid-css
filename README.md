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
| `h` | `height` | `h-100` | — | `h-md-100` |
| `maxw` | `max-width` | `maxw-800` | `maxw-400-800` | `maxw-md-800` |
| `minw` | `min-width` | `minw-320` | `minw-200-400` | `minw-md-320` |
| `maxh` | `max-height` | `maxh-400` | — | `maxh-md-400` |
| `minh` | `min-height` | `minh-200` | — | `minh-md-200` |
| **Sizing Auto** | | | | |
| `w-auto` | `width: auto` | — | — | `w-md-auto` |
| `h-auto` | `height: auto` | — | — | `h-md-auto` |
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
> - `h`, `maxh`, `minh` are **fixed-only** (no fluid ranges). Fluid clamp scales by viewport width, which produces wrong results on portrait/narrow viewports. Use viewport units for responsive heights: `h-100dvh`, `minh-80svh`, `maxh-50vh`
> - `cols` supports dot notation for ratios: `cols-1.3` = `1fr 3fr`, `cols-1.2.1` = `1fr 2fr 1fr`
> - `container` is standalone — any number works, containers can be nested
> - All pixel values are converted to `rem` (divided by 16) in the output
> - Viewport override syntax: `fs-16-48--480-1920` uses 480px–1920px instead of config default
> - **Unit suffixes** (sizing prefixes only — `w`, `h`, `maxw`, `minw`, `maxh`, `minh`):
>   append `%`, `vw`, `vh`, `vmin`, `vmax`, `svw`, `svh`, `lvw`, `lvh`, `dvw`, or `dvh` to emit that unit verbatim — no rem conversion.
>   Examples: `w-50%` → `width: 50%`, `h-100dvh` → `height: 100dvh`, `minh-md-100svh` → `@media(md+) { min-height: 100svh }`.
>   Fixed-only (no fluid ranges of units).

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
@use 'dopamine-fluid/addons/sass/dopamine-functions' as dp;

.node--article .field--body p {
  font-size: dp.fluid(16, 48);
  margin-bottom: dp.fluid(8, 24);
}

.hero-banner h1 {
  font-size: dp.fluid(32, 96, 480, 1920);  // custom viewport
}
```

When you output to `.scss`, Dopamine also auto-generates a `_dopamine-functions.scss` with your config's viewport defaults.

### Breakpoint Mixins

Both the standalone addon and the auto-generated functions file include breakpoint mixins that match your config:

```scss
@use 'dopamine-functions' as dp;

.sidebar {
  display: none;
  @include dp.breakpoint-up(lg) { display: block; }
}

.mobile-only {
  @include dp.breakpoint-down(md) { display: block; }
}
```

Available: `breakpoint-up($name)` (min-width) and `breakpoint-down($name)` (max-width). Breakpoint names come from your `dopamine.config.json`.

### Components Addon

Pre-built structural CSS for common UI patterns. No colors, no sizing — just behavior (transitions, open/close, visibility). Style with Dopamine classes in your HTML.

```scss
@use 'dopamine-fluid/addons/components/accordion/accordion';
@use 'dopamine-fluid/addons/components/menu/menu';
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

Available components: `accordion`, `modal`, `menu`, `tabs`, `dropdown`, `collapse`, `checkbox`, `radio`, `switch`, `input`.

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

Three working paths, depending on your project's setup. All use `accordion` as the example — swap the component name (`modal`, `menu`, `tabs`, `dropdown`, `collapse`, `forms/checkbox`, etc.) as needed.

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
document.addEventListener('dp:modal:open', e => console.log('opened', e.target.id));
document.addEventListener('dp:tabs:change', e => console.log('panel', e.detail.panel.id));
```

| Component | Events | API |
|---|---|---|
| accordion | `dp:accordion:open`, `dp:accordion:close` | `open(el)`, `close(el)`, `toggle(el)` |
| modal | `dp:modal:open`, `dp:modal:close` | `open(idOrEl)`, `close(idOrEl)`, `toggle(idOrEl)` |
| menu | `dp:menu:open`, `dp:menu:close` | `open(el)`, `close(el)`, `toggle(el)` |
| tabs | `dp:tabs:change` (detail: `{ panel, trigger }`) | `activate(panelIdOrEl)` |
| dropdown | `dp:dropdown:open`, `dp:dropdown:close` | `open(el)`, `close(el)`, `toggle(el)`, `closeAll()` |
| collapse | `dp:collapse:open`, `dp:collapse:close` | `open(idOrEl)`, `close(idOrEl)`, `toggle(idOrEl)` |

Collapse is a generic show/hide primitive with a `data-collapse-target="#id"` trigger. The target's direct child must be `<div class="collapse__content">` (padding-free — your padded/styled content goes inside it, matching the `accordion__content` pattern). Default mode is in-flow with a height animation; add `collapse--absolute` for a floating fade (requires a positioned ancestor in the markup).

**Event timing.** Events fire *immediately after the class is flipped* — so `:open` fires when the opening transition is just starting, and `:close` fires when the hiding transition is just starting. That's the right moment for most work (updating state, logging, focusing an input).

If you need to wait for the transition to finish — e.g. to unmount content only once a modal has fully faded out — listen for `transitionend` on the element that actually animates:

```js
document.addEventListener('dp:modal:close', e => {
  // e.target is the .modal (class already removed).
  // The .modal__dialog is what animates — wait for it:
  const dialog = e.target.querySelector('.modal__dialog');
  dialog.addEventListener('transitionend', () => {
    // fade-out finished — safe to unmount / free resources
  }, { once: true });
});
```

Pick whichever element has the transition in its CSS: `.modal__dialog` for modals, `.menu__drawer` for menu, `.dropdown__menu` for dropdown, `.accordion__body` for accordion. Tabs has no transition by default, so `dp:tabs:change` already fires at the final state.

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

> **Scanning is strictly attribute-only.** Classes are picked up only from `class="..."` and `className={...}` attributes in your templates — not from `<code>` tags, comments, or JS expressions. If you need a class compiled without having it applied as an HTML attribute (e.g. referenced dynamically from JS, or only used by a Vue/Alpine `:class="..."` expression), add it to the classes file above.

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
  "version": 1,
  "generated": "2026-04-13T12:00:00.000Z",
  "classes": ["cols-md-1.3", "flex", "fs-16-48", "p-md-16-32"]
}
```

The `classes` array is sorted alphabetically for deterministic diffs. The schema is additive-only across minor changes — the `version` field bumps if the shape ever changes in a breaking way.

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
