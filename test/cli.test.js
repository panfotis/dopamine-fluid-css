'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { applyConfigHints, DEFAULT_EXTENSIONS, DEFAULT_OUT } = require('../lib/cli-options');
const { extractClasses, parseClass, resolveViewport, diagnoseClass } = require('../lib/parser');
const { generateRule } = require('../lib/generator');
const { loadConfig } = require('../lib/config');

// Write a config file to a temp dir and load it. Returns the loaded config.
function loadTempConfig(userConfig) {
  const dir  = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-config-'));
  const file = path.join(dir, 'dopamine.config.json');
  fs.writeFileSync(file, JSON.stringify(userConfig), 'utf8');
  return loadConfig(file);
}

test('uses config.out when the CLI output flag is not provided', () => {
  const resolved = applyConfigHints(undefined, {
    config: 'dopamine.config.json',
    ext: DEFAULT_EXTENSIONS,
    out: DEFAULT_OUT,
    reset: true,
  }, {
    input: './templates',
    ext: 'html',
    out: './build/custom.scss',
  });

  assert.equal(resolved.input, './templates');
  assert.equal(resolved.opts.ext, 'html');
  assert.equal(resolved.opts.out, './build/custom.scss');
});

test('a positional input arg does not discard config ext/out', () => {
  // `dopamine ./templates` with {out, ext} in config used to silently fall back
  // to the built-in defaults — output location is independent of the input.
  const resolved = applyConfigHints('./templates', {
    config: 'dopamine.config.json',
    ext: DEFAULT_EXTENSIONS,
    out: DEFAULT_OUT,
    reset: true,
  }, {
    input: './ignored',
    ext: 'html',
    out: './build/custom.scss',
  });

  assert.equal(resolved.input, './templates');   // positional wins for input
  assert.equal(resolved.opts.ext, 'html');       // …but config ext still applies
  assert.equal(resolved.opts.out, './build/custom.scss');
});

test('an explicit CLI flag still beats config even with a positional input', () => {
  const resolved = applyConfigHints('./templates', {
    config: 'dopamine.config.json',
    ext: 'twig',
    out: './explicit.css',
    reset: true,
  }, {
    ext: 'html',
    out: './build/custom.scss',
  });

  assert.equal(resolved.opts.ext, 'twig');
  assert.equal(resolved.opts.out, './explicit.css');
});

test('keeps explicit CLI output over config output', () => {
  const resolved = applyConfigHints(undefined, {
    config: 'dopamine.config.json',
    ext: DEFAULT_EXTENSIONS,
    out: './explicit.css',
    reset: true,
  }, {
    out: './build/custom.scss',
  });

  assert.equal(resolved.opts.out, './explicit.css');
});

test('breakpoint-prefixed fluid classes use the global viewport for clamp math', () => {
  const config = {
    viewport: { min: 320, max: 1440 },
    breakpoints: {
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400,
      xxxl: 1600,
      xxxxl: 1920,
    },
    prefixes: {},
  };
  const descriptor = parseClass('fs-xxxxl-16-32', config);
  const viewport = resolveViewport(descriptor, config);
  const rule = generateRule(descriptor, viewport, config, false);

  assert.match(rule, /clamp\(1rem,/);
  assert.deepEqual(viewport, { vpMin: 320, vpMax: 1440, source: 'default' });
});

test('breakpoint-prefixed fluid math matches its base counterpart', () => {
  const config = {
    viewport: { min: 320, max: 1440 },
    breakpoints: { sm: 576, md: 768, lg: 992 },
    prefixes: {},
  };
  const base = parseClass('fs-24-48', config);
  const bp   = parseClass('fs-md-24-48', config);
  const baseVp = resolveViewport(base, config);
  const bpVp   = resolveViewport(bp, config);

  assert.deepEqual(baseVp, bpVp);
});

test('per-prefix viewport config overrides the global default for breakpoint classes', () => {
  const config = {
    viewport: { min: 320, max: 1440 },
    breakpoints: { sm: 576, md: 768 },
    prefixes: { fs: { vpMin: 375, vpMax: 1920 } },
  };
  const descriptor = parseClass('fs-md-24-48', config);
  const viewport = resolveViewport(descriptor, config);

  assert.deepEqual(viewport, { vpMin: 375, vpMax: 1920, source: 'prefix-config' });
});

test('unit syntax emits percentage values for sizing prefixes', () => {
  const config = { viewport: { min: 320, max: 1440 }, breakpoints: { md: 768 }, prefixes: {} };

  const w50 = parseClass('w-50%', config);
  assert.equal(w50.mode, 'unit');
  assert.equal(w50.unitValue, 50);
  assert.equal(w50.unit, '%');
  assert.match(generateRule(w50, null, config, false), /width: 50%;/);

  const hFull = parseClass('h-100%', config);
  assert.match(generateRule(hFull, null, config, false), /height: 100%;/);

  const maxw = parseClass('maxw-80%', config);
  assert.match(generateRule(maxw, null, config, false), /max-width: 80%;/);
});

test('unit syntax supports viewport units (vw, vh, dvh, svh, lvh, vmin, vmax)', () => {
  const config = { viewport: { min: 320, max: 1440 }, breakpoints: { md: 768 }, prefixes: {} };

  const hDvh = parseClass('h-100dvh', config);
  assert.equal(hDvh.mode, 'unit');
  assert.equal(hDvh.unitValue, 100);
  assert.equal(hDvh.unit, 'dvh');
  assert.match(generateRule(hDvh, null, config, false), /height: 100dvh;/);

  assert.match(generateRule(parseClass('h-100vh',  config), null, config, false), /height: 100vh;/);
  assert.match(generateRule(parseClass('w-100vw',  config), null, config, false), /width: 100vw;/);
  assert.match(generateRule(parseClass('minh-100svh', config), null, config, false), /min-height: 100svh;/);
  assert.match(generateRule(parseClass('maxh-90lvh', config), null, config, false), /max-height: 90lvh;/);
  assert.match(generateRule(parseClass('w-50vmin',  config), null, config, false), /width: 50vmin;/);
  assert.match(generateRule(parseClass('h-50vmax',  config), null, config, false), /height: 50vmax;/);
});

test('unit syntax supports breakpoint variants', () => {
  const config = { viewport: { min: 320, max: 1440 }, breakpoints: { md: 768 }, prefixes: {} };

  const pct = parseClass('w-md-50%', config);
  assert.equal(pct.breakpoint, 'md');
  assert.equal(pct.unitValue, 50);
  assert.equal(pct.unit, '%');

  const dvh = parseClass('minh-md-100dvh', config);
  assert.equal(dvh.breakpoint, 'md');
  assert.equal(dvh.unit, 'dvh');
});

test('unit syntax is rejected on non-sizing prefixes', () => {
  const config = { viewport: { min: 320, max: 1440 }, breakpoints: { md: 768 }, prefixes: {} };
  assert.equal(parseClass('p-50%', config), null);
  assert.equal(parseClass('fs-50dvh', config), null);
  assert.equal(parseClass('gap-50vh', config), null);
});

test('unit syntax rejects unknown breakpoints and unknown units', () => {
  const config = { viewport: { min: 320, max: 1440 }, breakpoints: { md: 768 }, prefixes: {} };
  assert.equal(parseClass('w-xl-50%', config), null);
  assert.equal(parseClass('h-100xx', config), null);
  assert.equal(parseClass('w-100em', config), null);
});

test('extractClasses does not double-capture the px prefix of unit classes', () => {
  // Regression: `w-50%` was also producing a phantom `w-50` because
  // BARE_TOKEN_RE matched up to the word boundary between `0` and `%`.
  const html = '<div class="w-50% w-100% maxw-80% minh-50% h-md-100% w-md-50%">x</div>';
  const classes = extractClasses(html);

  // Unit classes must be captured in full…
  assert.ok(classes.has('w-50%'));
  assert.ok(classes.has('w-100%'));
  assert.ok(classes.has('maxw-80%'));
  assert.ok(classes.has('minh-50%'));
  assert.ok(classes.has('h-md-100%'));
  assert.ok(classes.has('w-md-50%'));

  // …and the px prefix must NOT leak through as a separate class.
  assert.equal(classes.has('w-50'),    false);
  assert.equal(classes.has('w-100'),   false);
  assert.equal(classes.has('maxw-80'), false);
  assert.equal(classes.has('minh-50'), false);
  assert.equal(classes.has('h-md-100'), false);
  assert.equal(classes.has('w-md-50'), false);
});

test('extractClasses still captures genuine px sizing classes alongside unit ones', () => {
  const html = '<div class="w-200 h-80 w-50% maxw-600">x</div>';
  const classes = extractClasses(html);

  assert.ok(classes.has('w-200'));
  assert.ok(classes.has('h-80'));
  assert.ok(classes.has('maxw-600'));
  assert.ok(classes.has('w-50%'));

  // And no phantom for the one class that ends in %
  assert.equal(classes.has('w-50'), false);
});

test('extractClasses leaves viewport-unit classes intact (regex naturally skips px prefix)', () => {
  const html = '<div class="h-100dvh minh-80svh w-md-50vw">x</div>';
  const classes = extractClasses(html);

  assert.ok(classes.has('h-100dvh'));
  assert.ok(classes.has('minh-80svh'));
  assert.ok(classes.has('w-md-50vw'));

  // No phantom px-mode siblings.
  assert.equal(classes.has('h-100'),    false);
  assert.equal(classes.has('minh-80'),  false);
  assert.equal(classes.has('w-md-50'),  false);
});

test('extractClasses only reads `class="..."` attributes — bare tokens are no longer scanned', () => {
  // Documentation-shaped content with class names in <code> tags and prose
  // should NOT pollute the compiled class set anymore.
  const html = `
    <p>Use <code>fs-18-24</code> for headings and <code>p-16-32</code> for padding.</p>
    <!-- w-200 h-100 mb-24 -->
    <div class="fs-16">actual applied class</div>
  `;
  const classes = extractClasses(html);

  assert.ok(classes.has('fs-16'));          // the real applied class
  assert.equal(classes.has('fs-18-24'), false);  // documentation example, not applied
  assert.equal(classes.has('p-16-32'),  false);  // documentation example, not applied
  assert.equal(classes.has('w-200'),    false);  // comment, not applied
  assert.equal(classes.has('h-100'),    false);
  assert.equal(classes.has('mb-24'),    false);
});

test('extractClasses does not pick up keyword/grid tokens from bare prose or comments', () => {
  // Regression: GRID_TOKEN_RE used to scan the full file text for keywords
  // like `flex`, `justify-center`, `hidden-md`, and grid tokens like
  // `container-1200`, `cols-3`. Those phantom captures are gone — strict
  // attribute-only scanning.
  const html = `
    <p>Use <code>flex</code> and <code>justify-center</code> for layout.</p>
    <!-- hidden-md container-1200 cols-3 fw-bold -->
    <div class="flex justify-center">applied classes</div>
  `;
  const classes = extractClasses(html);

  // Applied via class="..." → captured
  assert.ok(classes.has('flex'));
  assert.ok(classes.has('justify-center'));

  // Bare prose / comments → NOT captured
  assert.equal(classes.has('hidden-md'),     false);
  assert.equal(classes.has('container-1200'), false);
  assert.equal(classes.has('cols-3'),        false);
  assert.equal(classes.has('fw-bold'),       false);
});

test('extractClasses captures both branches of a ternary inside class="..."', () => {
  const html = `<div class="{{ xxx ? 'fs-12-32' : 'fs-12-62' }}"></div>`;
  const classes = extractClasses(html);
  assert.ok(classes.has('fs-12-32'));
  assert.ok(classes.has('fs-12-62'));
});

test('extractClasses handles flipped ternary quotes inside class="..."', () => {
  const html = `<div class='{{ a ? "fs-16" : "fs-20" }}'></div>`;
  const classes = extractClasses(html);
  assert.ok(classes.has('fs-16'));
  assert.ok(classes.has('fs-20'));
});

test('extractClasses handles one-sided ternary (Twig shorthand)', () => {
  const html = `<li class="menu-tabs__item {{ active ? 'is-active' }}"></li>`;
  const classes = extractClasses(html);
  assert.ok(classes.has('menu-tabs__item'));
  assert.ok(classes.has('is-active'));
});

test('extractClasses captures valid classes across || visual separators', () => {
  const html = `<div class="video-wrapper || position-relative d-block || border-0"></div>`;
  const classes = extractClasses(html);
  assert.ok(classes.has('video-wrapper'));
  assert.ok(classes.has('position-relative'));
  assert.ok(classes.has('d-block'));
  assert.ok(classes.has('border-0'));
});

test('extractClasses handles empty class attribute without crashing', () => {
  const html = `<div class=""></div>`;
  const classes = extractClasses(html);
  assert.equal(classes.size, 0);
});

test('extractClasses reads literals from Twig {% set <var> = [...] %}', () => {
  const twig = `{% set classes = ['block', 'fs-32-42', 'px-32-42 py-40-65'] %}<div></div>`;
  const classes = extractClasses(twig);
  assert.ok(classes.has('fs-32-42'));
  assert.ok(classes.has('px-32-42'));
  assert.ok(classes.has('py-40-65'));
  assert.ok(classes.has('block'));
});

test('extractClasses reads the literal prefix from dynamic concatenation in set', () => {
  const twig = `{% set classes = ['block-' ~ slug, 'flex'] %}`;
  const classes = extractClasses(twig);
  assert.ok(classes.has('block-'));  // the literal piece before `~`
  assert.ok(classes.has('flex'));
});

test('extractClasses reads literals from a non-array set RHS ternary', () => {
  const twig = `{% set weight = cond ? 'fw-light' : 'fw-bold' %}`;
  const classes = extractClasses(twig);
  assert.ok(classes.has('fw-light'));
  assert.ok(classes.has('fw-bold'));
});

test('extractClasses reads inline array inside addClass(...)', () => {
  const twig = `{{ attributes.addClass(['fs-16', 'p-8 m-16']) }}`;
  const classes = extractClasses(twig);
  assert.ok(classes.has('fs-16'));
  assert.ok(classes.has('p-8'));
  assert.ok(classes.has('m-16'));
});

test('extractClasses reads single-string addClass argument', () => {
  const twig = `{{ attributes.addClass('fs-18 mb-24') }}`;
  const classes = extractClasses(twig);
  assert.ok(classes.has('fs-18'));
  assert.ok(classes.has('mb-24'));
});

test('extractClasses reads literals across multi-arg addClass with inline ternary', () => {
  // Real-world: form-element.html.twig
  const twig = `{{ attributes.addClass(classes, '', float_label ? 'form-floating') }}`;
  const classes = extractClasses(twig);
  assert.ok(classes.has('form-floating'));
});

test('extractClasses emits nothing for a variable-only addClass call', () => {
  const twig = `{{ attributes.addClass(classes) }}`;
  const classes = extractClasses(twig);
  // Only `classes` as an identifier — no literal string args, nothing to emit.
  assert.equal(classes.has('classes'), false);
});

test('auto keyword works for width and height (fix #4)', () => {
  const config = { viewport: { min: 320, max: 1440 }, breakpoints: { md: 768 }, prefixes: {} };

  const wAuto = parseClass('w-auto', config);
  assert.equal(wAuto.mode, 'auto');
  assert.equal(wAuto.prefix, 'w');
  assert.match(generateRule(wAuto, null, config, false), /width: auto;/);

  const hAuto = parseClass('h-auto', config);
  assert.match(generateRule(hAuto, null, config, false), /height: auto;/);

  const wMdAuto = parseClass('w-md-auto', config);
  assert.equal(wMdAuto.breakpoint, 'md');
  assert.match(generateRule(wMdAuto, null, config, false), /width: auto;/);

  // Existing margin autos still work
  const mAuto = parseClass('m-auto', config);
  assert.match(generateRule(mAuto, null, config, false), /margin: auto;/);
});

test('height prefixes reject fluid ranges (fix #7 — fixedOnly)', () => {
  const config = { viewport: { min: 320, max: 1440 }, breakpoints: { md: 768 }, prefixes: {} };

  // Fluid form must be rejected
  assert.equal(parseClass('h-60-120', config),    null);
  assert.equal(parseClass('maxh-200-400', config), null);
  assert.equal(parseClass('minh-100-300', config), null);
  assert.equal(parseClass('h-md-60-120', config),  null);

  // Fixed form still works
  assert.ok(parseClass('h-120', config));
  assert.ok(parseClass('maxh-400', config));
  assert.ok(parseClass('minh-200', config));

  // Unit form still works
  assert.ok(parseClass('h-100dvh', config));
  assert.ok(parseClass('minh-80svh', config));

  // And width fluid is unaffected
  assert.ok(parseClass('w-100-400', config));
  assert.ok(parseClass('maxw-400-800', config));
});

test('diagnoseClass explains common mistakes (fix #1)', () => {
  const config = {
    viewport: { min: 320, max: 1440 },
    breakpoints: { sm: 576, md: 768, lg: 992 },
    prefixes: {},
  };

  // px suffix
  assert.match(diagnoseClass('w-300px', config), /['"]px['"] suffix isn't needed/i);
  assert.match(diagnoseClass('maxw-600px', config), /['"]px['"] suffix isn't needed/i);

  // Unit suffix on a non-sizing prefix
  assert.match(diagnoseClass('fs-50dvh', config), /sizing prefixes/i);
  assert.match(diagnoseClass('p-50%',    config), /sizing prefixes/i);

  // Unknown unit on a sizing prefix
  assert.match(diagnoseClass('h-100xx', config), /unknown unit/i);
  assert.match(diagnoseClass('w-50em',  config), /unknown unit/i);

  // Unknown breakpoint
  assert.match(diagnoseClass('fs-xxl-16', config), /breakpoint.*xxl/i);

  // Breakpoint at the end of a numeric class (incl. keyword-era z-10-md)
  assert.match(diagnoseClass('z-10-md', config), /write 'z-md-10'/i);
  assert.match(diagnoseClass('fs-24-md', config), /write 'fs-md-24'/i);

  // Fluid on fixedOnly height
  assert.match(diagnoseClass('h-60-120', config),    /doesn't support fluid/i);
  assert.match(diagnoseClass('minh-100-300', config), /doesn't support fluid/i);

  // Inverted fluid range
  assert.match(diagnoseClass('fs-48-16', config), /inverted/i);

  // Inverted / zero-width inline viewport override
  assert.match(diagnoseClass('fs-16-48--1440-320', config), /inline viewport inverted/i);
  assert.match(diagnoseClass('fs-16-48--320-320',  config), /zero-width range/i);

  // Unknown prefix
  assert.match(diagnoseClass('zzz-16', config), /unknown prefix/i);

  // Genuine valid class gets no diagnosis (parseClass handles it)
  assert.equal(diagnoseClass('fs-16', config), null);
  assert.equal(diagnoseClass('fs-16-48--320-1440', config), null);
});

// ---------------------------------------------------------------------------
// Inline viewport override must be a valid range — an inverted one used to
// parse fine and then throw inside buildClamp, aborting the entire build.
// ---------------------------------------------------------------------------

test('inverted inline viewport is rejected instead of crashing the build', () => {
  const config = {
    viewport: { min: 320, max: 1440 },
    breakpoints: { sm: 576, md: 768, lg: 992 },
    prefixes: {},
  };

  // Inverted and zero-width ranges are rejected, base and breakpoint forms alike
  assert.equal(parseClass('fs-16-48--1440-320',    config), null);
  assert.equal(parseClass('fs-16-48--320-320',     config), null);
  assert.equal(parseClass('fs-md-16-48--1440-320', config), null);
  assert.equal(parseClass('p-8-16--900-400',       config), null);

  // A valid override still parses
  const ok = parseClass('fs-16-48--480-1920', config);
  assert.equal(ok.inlineVpMin, 480);
  assert.equal(ok.inlineVpMax, 1920);
});

test('a class with an inverted inline viewport does not abort the build', () => {
  const config = {
    viewport: { min: 320, max: 1440 },
    breakpoints: { sm: 576, md: 768, lg: 992 },
    prefixes: {},
  };

  // The bad class is skipped; the good one still compiles.
  assert.equal(parseClass('fs-16-48--1440-320', config), null);

  const good = parseClass('fs-16-48', config);
  const rule = generateRule(good, resolveViewport(good, config), config, false);
  assert.match(rule, /font-size: clamp\(/);
});

test('config: an inverted per-prefix viewport is rejected at load time', () => {
  // Fully specified, inverted
  assert.throws(
    () => loadTempConfig({ prefixes: { fs: { vpMin: 1440, vpMax: 320 } } }),
    /viewport range for prefix "fs"/i
  );

  // Zero-width
  assert.throws(
    () => loadTempConfig({ prefixes: { fs: { vpMin: 800, vpMax: 800 } } }),
    /viewport range for prefix "fs"/i
  );

  // Partial override inherits the missing bound from the global viewport — and
  // is still invalid if that combination inverts (vpMin 1600 vs global max 1440)
  assert.throws(
    () => loadTempConfig({ viewport: { min: 320, max: 1440 }, prefixes: { fs: { vpMin: 1600 } } }),
    /viewport range for prefix "fs"/i
  );

  // A valid per-prefix override loads fine
  const config = loadTempConfig({ prefixes: { fs: { vpMin: 480, vpMax: 1920 } } });
  assert.deepEqual(config.prefixes.fs, { vpMin: 480, vpMax: 1920 });

  // Prefixes without a viewport override are untouched
  const plain = loadTempConfig({ prefixes: {} });
  assert.deepEqual(plain.prefixes, {});
});

// ---------------------------------------------------------------------------
// Negative value support via `n` prefix (e.g. mt-n10 → margin-top: -0.625rem)
// ---------------------------------------------------------------------------

const NEG_CONFIG = {
  viewport: { min: 320, max: 1440 },
  breakpoints: { sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 },
  prefixes: {},
};

test('n-prefix: negatives parse correctly on allowed prefixes (fixed)', () => {
  assert.equal(parseClass('mt-n10', NEG_CONFIG)?.minPx, -10);
  assert.equal(parseClass('mb-n5',  NEG_CONFIG)?.minPx, -5);
  assert.equal(parseClass('ms-n8',  NEG_CONFIG)?.minPx, -8);
  assert.equal(parseClass('me-n8',  NEG_CONFIG)?.minPx, -8);
  assert.equal(parseClass('mx-n16', NEG_CONFIG)?.minPx, -16);
  assert.equal(parseClass('my-n16', NEG_CONFIG)?.minPx, -16);
  assert.equal(parseClass('m-n4',   NEG_CONFIG)?.minPx, -4);
  assert.equal(parseClass('ls-n5',  NEG_CONFIG)?.minPx, -5);
  assert.equal(parseClass('order-n1', NEG_CONFIG)?.minPx, -1);
});

test('n-prefix: negatives rejected on disallowed prefixes', () => {
  // Nonsensical negatives — must return null
  assert.equal(parseClass('fs-n16',    NEG_CONFIG), null);
  assert.equal(parseClass('p-n10',     NEG_CONFIG), null);
  assert.equal(parseClass('pt-n8',     NEG_CONFIG), null);
  assert.equal(parseClass('ps-n8',     NEG_CONFIG), null);
  assert.equal(parseClass('w-n50',     NEG_CONFIG), null);
  assert.equal(parseClass('h-n100',    NEG_CONFIG), null);
  assert.equal(parseClass('maxw-n400', NEG_CONFIG), null);
  assert.equal(parseClass('minw-n200', NEG_CONFIG), null);
  assert.equal(parseClass('lh-n15',    NEG_CONFIG), null);
  assert.equal(parseClass('fw-n400',   NEG_CONFIG), null);
  assert.equal(parseClass('radius-n8', NEG_CONFIG), null);
  assert.equal(parseClass('gap-n16',   NEG_CONFIG), null);
  assert.equal(parseClass('cols-n3',   NEG_CONFIG), null);
});

test('n-prefix: negative with breakpoint variant', () => {
  const d = parseClass('mt-md-n10', NEG_CONFIG);
  assert.equal(d?.breakpoint, 'md');
  assert.equal(d?.minPx, -10);
  assert.equal(d?.mode, 'fixed');

  const d2 = parseClass('ls-lg-n2', NEG_CONFIG);
  assert.equal(d2?.breakpoint, 'lg');
  assert.equal(d2?.minPx, -2);

  // Disallowed: still rejected with breakpoint
  assert.equal(parseClass('fs-md-n16', NEG_CONFIG), null);
});

test('n-prefix: fluid ranges with negatives (allowed prefix, not fixedOnly)', () => {
  // Negative-to-negative (ordered)
  let d = parseClass('mt-n10-n5', NEG_CONFIG);
  assert.ok(d, 'mt-n10-n5 should parse');
  assert.equal(d.minPx, -10);
  assert.equal(d.maxPx, -5);
  assert.equal(d.mode, 'fluid');

  // Negative-to-positive
  d = parseClass('mt-n5-10', NEG_CONFIG);
  assert.ok(d);
  assert.equal(d.minPx, -5);
  assert.equal(d.maxPx, 10);

  // With breakpoint
  d = parseClass('mt-md-n10-n5', NEG_CONFIG);
  assert.ok(d);
  assert.equal(d.breakpoint, 'md');
  assert.equal(d.minPx, -10);
  assert.equal(d.maxPx, -5);
  assert.equal(d.mode, 'fluid');
});

test('n-prefix: inverted fluid ranges rejected', () => {
  // Negative-to-negative but inverted (-5 > -10)
  assert.equal(parseClass('mt-n5-n10', NEG_CONFIG), null);
  // Positive-to-negative (always inverted)
  assert.equal(parseClass('mt-10-n5', NEG_CONFIG), null);
  // Same value
  assert.equal(parseClass('mt-n5-n5', NEG_CONFIG), null);
});

test('n-prefix: fluid rejected on fixedOnly prefixes even when negatives allowed', () => {
  // ls allows negatives but is fixedOnly — fluid must still be rejected
  assert.equal(parseClass('ls-n10-n5', NEG_CONFIG), null);
  assert.equal(parseClass('ls-n10-5',  NEG_CONFIG), null);
  // order same
  assert.equal(parseClass('order-n1-n5', NEG_CONFIG), null);
});

test('n-prefix: malformed negative values rejected', () => {
  // Bare "n" with no digit
  assert.equal(parseClass('mt-n',    NEG_CONFIG), null);
  // Double-n
  assert.equal(parseClass('mt-nn10', NEG_CONFIG), null);
  // Separator-then-negative (unclear syntax)
  assert.equal(parseClass('mt-n-10', NEG_CONFIG), null);
  // Old double-hyphen must NOT work
  assert.equal(parseClass('mt--5',   NEG_CONFIG), null);
  // Negative with letter suffix (not a unit)
  assert.equal(parseClass('mt-n10x', NEG_CONFIG), null);
});

test('n-prefix: zero with n-prefix (mt-n0) parses but equals 0', () => {
  // Edge case — harmless but worth locking in the behavior
  const d = parseClass('mt-n0', NEG_CONFIG);
  assert.equal(d?.minPx, 0);
});

test('n-prefix: no interference with existing positive value parsing', () => {
  // All of these existed before the n-prefix change — must still work identically
  assert.equal(parseClass('mt-10',      NEG_CONFIG)?.minPx, 10);
  assert.equal(parseClass('mt-md-10',   NEG_CONFIG)?.breakpoint, 'md');
  assert.equal(parseClass('fs-16-48',   NEG_CONFIG)?.mode, 'fluid');
  assert.equal(parseClass('fs-md-16-48', NEG_CONFIG)?.mode, 'fluid');
  assert.equal(parseClass('fs-16-48--320-1440', NEG_CONFIG)?.inlineVpMin, 320);
  assert.equal(parseClass('lh-15',      NEG_CONFIG)?.minPx, 15);
  assert.equal(parseClass('ls-5',       NEG_CONFIG)?.minPx, 5);
  assert.equal(parseClass('fw-400',     NEG_CONFIG)?.minPx, 400);
  assert.equal(parseClass('order-1',    NEG_CONFIG)?.minPx, 1);
  // Auto keyword still works for margin prefixes
  assert.ok(parseClass('mt-auto',      NEG_CONFIG));
  assert.ok(parseClass('ms-md-auto',   NEG_CONFIG));
  assert.ok(parseClass('mx-auto',      NEG_CONFIG));
  // Unit-suffix sizing still works
  assert.ok(parseClass('w-50%',        NEG_CONFIG));
  assert.ok(parseClass('h-100dvh',     NEG_CONFIG));
});

test('n-prefix: cols ratio notation unaffected', () => {
  // cols has its own parser — must not be touched by the n-prefix change
  assert.ok(parseClass('cols-3',      NEG_CONFIG));
  assert.ok(parseClass('cols-1.3',    NEG_CONFIG));
  assert.ok(parseClass('cols-1.2.1',  NEG_CONFIG));
  assert.ok(parseClass('cols-md-2',   NEG_CONFIG));
});

test('n-prefix: generator emits correct CSS for negatives', () => {
  // Margin: -10px → -0.625rem
  let rule = generateRule(parseClass('mt-n10', NEG_CONFIG), null, NEG_CONFIG, false);
  assert.match(rule, /margin-top:\s*-0\.625rem/);

  // Letter-spacing: -5/100 = -0.05em
  rule = generateRule(parseClass('ls-n5', NEG_CONFIG), null, NEG_CONFIG, false);
  assert.match(rule, /letter-spacing:\s*-0\.05em/);

  // Order: unitless, emits raw
  rule = generateRule(parseClass('order-n1', NEG_CONFIG), null, NEG_CONFIG, false);
  assert.match(rule, /order:\s*-1/);

  // Mx (two props) both get the same negative value
  rule = generateRule(parseClass('mx-n16', NEG_CONFIG), null, NEG_CONFIG, false);
  assert.match(rule, /margin-left:\s*-1rem/);
  assert.match(rule, /margin-right:\s*-1rem/);
});

test('n-prefix: fluid clamp with negative values emits correct CSS', () => {
  const d = parseClass('mt-n10-n5', NEG_CONFIG);
  const viewport = resolveViewport(d, NEG_CONFIG);
  const rule = generateRule(d, viewport, NEG_CONFIG, false);
  // min = -10px = -0.625rem, max = -5px = -0.3125rem
  assert.match(rule, /clamp\(-0\.625rem,/);
  assert.match(rule, /-0\.3125rem\)/);
});

test('n-prefix: diagnoseClass explains negative-on-disallowed', () => {
  assert.match(diagnoseClass('fs-n16', NEG_CONFIG), /doesn't support negative/i);
  assert.match(diagnoseClass('p-n10',  NEG_CONFIG), /doesn't support negative/i);
  assert.match(diagnoseClass('w-n50',  NEG_CONFIG), /doesn't support negative/i);
  // And it doesn't fire on allowed prefixes
  assert.equal(diagnoseClass('mt-n10', NEG_CONFIG), null);
  assert.equal(diagnoseClass('ls-n5',  NEG_CONFIG), null);
});

test('n-prefix: diagnoseClass explains inverted negative ranges', () => {
  // Both-negative inverted
  assert.match(diagnoseClass('mt-n5-n10', NEG_CONFIG), /inverted/i);
  // Same-value negatives (min >= max)
  assert.match(diagnoseClass('mt-n5-n5',  NEG_CONFIG), /inverted/i);
  // Positive-to-negative (always inverted)
  assert.match(diagnoseClass('mt-5-n10',  NEG_CONFIG), /inverted/i);
});

test('n-prefix: diagnoseClass explains fluid-on-fixedOnly with negatives', () => {
  // ls is fixedOnly + allowsNegative — fluid forms must give the fixed-only diagnostic
  assert.match(diagnoseClass('ls-n10-n5', NEG_CONFIG), /fixed-only/i);
  assert.match(diagnoseClass('ls-n10-5',  NEG_CONFIG), /fixed-only/i);
  // order same
  assert.match(diagnoseClass('order-n1-n5', NEG_CONFIG), /fixed-only/i);
});

test('fw rejects fluid ranges (fixedOnly) — prevents invalid font-weight clamp output', () => {
  // Regression guard: fw with fluid would emit `font-weight: clamp(25rem, ...)` which is
  // invalid CSS (font-weight takes number, not length). fixedOnly blocks it at parse time.
  assert.equal(parseClass('fw-400-700',    NEG_CONFIG), null);
  assert.equal(parseClass('fw-md-400-700', NEG_CONFIG), null);
  assert.match(diagnoseClass('fw-400-700', NEG_CONFIG), /fixed-only/i);
  // Fixed fw still works
  assert.ok(parseClass('fw-400', NEG_CONFIG));
  assert.ok(parseClass('fw-md-700', NEG_CONFIG));
});

test('n-prefix: keywords starting with n-related substrings unaffected', () => {
  // fw-normal, flex-nowrap, hidden — none should collide with n-prefix parsing
  const { parseGridClass } = require('../lib/grid-parser');
  assert.ok(parseGridClass('fw-normal',   NEG_CONFIG));
  assert.ok(parseGridClass('flex-nowrap', NEG_CONFIG));
  assert.ok(parseGridClass('hidden',      NEG_CONFIG));
  // And parseClass doesn't accidentally steal them
  assert.equal(parseClass('fw-normal',   NEG_CONFIG), null);
  assert.equal(parseClass('flex-nowrap', NEG_CONFIG), null);
});

// ---------------------------------------------------------------------------
// z — unitless z-index prefix (replaced the 9 hardcoded z-* keywords in 0.9.0)
// ---------------------------------------------------------------------------

test('z: parses any integer, negatives, and breakpoints; rejects fluid', () => {
  const { parseGridClass } = require('../lib/grid-parser');
  assert.equal(parseClass('z-10',    NEG_CONFIG)?.minPx, 10);
  assert.equal(parseClass('z-999',   NEG_CONFIG)?.minPx, 999);   // not possible as keyword
  assert.equal(parseClass('z-n1',    NEG_CONFIG)?.minPx, -1);
  assert.equal(parseClass('z-md-10', NEG_CONFIG)?.breakpoint, 'md');
  assert.equal(parseClass('z-1-10',  NEG_CONFIG), null);          // fixedOnly
  // 0.9.0 breaking change: the old keyword-era end position no longer parses
  assert.equal(parseClass('z-10-md',     NEG_CONFIG), null);
  assert.equal(parseGridClass('z-10-md', NEG_CONFIG), null);
});

// ---------------------------------------------------------------------------
// Position offsets — top/bottom/start/end/inset (fluid + negative capable)
// ---------------------------------------------------------------------------

test('offsets: fixed, fluid, negative, breakpoint, and logical properties', () => {
  assert.equal(parseClass('top-0',      NEG_CONFIG)?.minPx, 0);
  assert.equal(parseClass('inset-0',    NEG_CONFIG)?.minPx, 0);
  assert.equal(parseClass('bottom-n10', NEG_CONFIG)?.minPx, -10);
  assert.equal(parseClass('top-10-30',  NEG_CONFIG)?.mode, 'fluid');
  assert.equal(parseClass('start-md-24', NEG_CONFIG)?.breakpoint, 'md');
  // start/end are logical inset properties, matching ps/pe/ms/me
  assert.match(generateRule(parseClass('start-16', NEG_CONFIG), null, NEG_CONFIG, false), /inset-inline-start: 1rem/);
  assert.match(generateRule(parseClass('end-16',   NEG_CONFIG), null, NEG_CONFIG, false), /inset-inline-end: 1rem/);
});

// ---------------------------------------------------------------------------
// ratio — aspect-ratio via slash notation
// ---------------------------------------------------------------------------

test('ratio: slash notation parses, dots and junk rejected', () => {
  assert.equal(parseClass('ratio-16/9', NEG_CONFIG)?.ratioValue, '16 / 9');
  assert.equal(parseClass('ratio-1/1',  NEG_CONFIG)?.ratioValue, '1 / 1');
  assert.equal(parseClass('ratio-md-4/3', NEG_CONFIG)?.breakpoint, 'md');
  assert.match(generateRule(parseClass('ratio-16/9', NEG_CONFIG), null, NEG_CONFIG, false), /aspect-ratio: 16 \/ 9/);
  // Rejected shapes
  assert.equal(parseClass('ratio-16.9', NEG_CONFIG), null);   // dots are cols territory
  assert.equal(parseClass('ratio-16',   NEG_CONFIG), null);   // no bare numbers
  assert.equal(parseClass('ratio-0/9',  NEG_CONFIG), null);   // zero side
  assert.match(diagnoseClass('ratio-16.9', NEG_CONFIG), /write 'ratio-16\/9'/);
});

test('cols colon alias and colspan alias', () => {
  // cols-1:3 ≡ cols-1.3 — identical grid value, different selector
  assert.equal(parseClass('cols-1:3',    NEG_CONFIG)?.gridValue, '1.3');
  assert.equal(parseClass('cols-1.3',    NEG_CONFIG)?.gridValue, '1.3');
  assert.equal(parseClass('cols-md-1:2:1', NEG_CONFIG)?.gridValue, '1.2.1');
  assert.equal(parseClass('cols-1:0',    NEG_CONFIG), null);  // parts must be >= 1
  // colspan-3 ≡ span-3 — explicit alias
  const colspan = parseClass('colspan-3', NEG_CONFIG);
  assert.match(generateRule(colspan, null, NEG_CONFIG, false), /grid-column: span 3/);
});

test('ch unit: reading measure on sizing prefixes only', () => {
  assert.match(generateRule(parseClass('maxw-65ch', NEG_CONFIG), null, NEG_CONFIG, false), /max-width: 65ch/);
  assert.equal(parseClass('w-md-40ch', NEG_CONFIG)?.breakpoint, 'md');
  assert.equal(parseClass('fs-2ch', NEG_CONFIG), null);      // not a sizing prefix
  assert.equal(parseClass('maxw-60ch-80ch', NEG_CONFIG), null);  // no fluid units
});

test('stack: owl-selector rhythm with zero-specificity wrapper', () => {
  const fluid = generateRule(parseClass('stack-16-32', NEG_CONFIG),
    { vpMin: 320, vpMax: 1440, source: 'default' }, NEG_CONFIG, false);
  assert.match(fluid, /^:where\(\.stack-16-32\) > \* \+ \* \{/);
  assert.match(fluid, /margin-top: clamp\(1rem,/);
  const fixed = generateRule(parseClass('stack-24', NEG_CONFIG), null, NEG_CONFIG, false);
  assert.match(fixed, /^:where\(\.stack-24\) > \* \+ \* \{/);
  assert.match(fixed, /margin-top: 1\.5rem/);
  assert.equal(parseClass('stack-md-16-32', NEG_CONFIG)?.breakpoint, 'md');
  assert.equal(parseClass('stack-n10', NEG_CONFIG), null);  // no negatives
});

test('cols-fit / cols-fill: RAM pattern with px→rem minimum and overflow guard', () => {
  const fit = parseClass('cols-fit-250', NEG_CONFIG);
  assert.deepEqual(fit?.gridFit, { kind: 'fit', minPx: 250 });
  assert.match(generateRule(fit, null, NEG_CONFIG, false),
    /grid-template-columns: repeat\(auto-fit, minmax\(min\(15\.625rem, 100%\), 1fr\)\)/);
  assert.match(generateRule(parseClass('cols-fill-250', NEG_CONFIG), null, NEG_CONFIG, false),
    /repeat\(auto-fill,/);
  assert.equal(parseClass('cols-fit-md-300', NEG_CONFIG)?.breakpoint, 'md');
  // Rejected shapes
  assert.equal(parseClass('cols-fit-0', NEG_CONFIG),        null);  // min must be >= 1
  assert.equal(parseClass('cols-fit-250-350', NEG_CONFIG),  null);  // no max — 1fr is the max
  assert.equal(parseClass('cols-fit-xxxl-250', NEG_CONFIG), null);  // unknown bp
  assert.match(diagnoseClass('cols-fit-250-350', NEG_CONFIG), /single minimum/i);
});

test('special/grid prefixes never take the generic numeric paths', () => {
  // Regression: cols-1-3 used to parse as a fluid range and emit
  // grid-template-columns: clamp(...) — invalid CSS.
  assert.equal(parseClass('cols-1-3',   NEG_CONFIG), null);
  assert.equal(parseClass('cols-md-1-3', NEG_CONFIG), null);
  assert.equal(parseClass('ratio-md-16', NEG_CONFIG), null);
});

// ---------------------------------------------------------------------------
// Keyword breakpoints — middle (Bootstrap-style) and end positions both parse
// ---------------------------------------------------------------------------

test('keyword breakpoints: middle and end positions resolve identically', () => {
  const { parseGridClass } = require('../lib/grid-parser');
  const pairs = [
    ['text-md-center',       'text-center-md'],
    ['flex-md-row-reverse',  'flex-row-reverse-md'],
    ['justify-items-md-start', 'justify-items-start-md'],
    ['align-lg-center',      'align-center-lg'],
    ['inline-md-block',      'inline-block-md'],
  ];
  for (const [middle, end] of pairs) {
    const a = parseGridClass(middle, NEG_CONFIG);
    const b = parseGridClass(end,    NEG_CONFIG);
    assert.ok(a, `${middle} should parse`);
    assert.ok(b, `${end} should parse`);
    // Same declarations + same media wrapper — only the selector (raw) differs
    assert.equal(a.prop,       b.prop);
    assert.equal(a.value,      b.value);
    assert.equal(a.breakpoint, b.breakpoint);
  }
});

test('keyword breakpoints: exact keywords win over breakpoint extraction', () => {
  const { parseGridClass } = require('../lib/grid-parser');
  // 'inline-block' must stay display:inline-block even under a pathological
  // config where 'block' is a breakpoint name
  const weird = { ...NEG_CONFIG, breakpoints: { ...NEG_CONFIG.breakpoints, block: 600 } };
  const d = parseGridClass('inline-block', weird);
  assert.equal(d.value, 'inline-block');
  assert.equal(d.breakpoint, undefined);
});

test('keyword breakpoints: unknown shapes still rejected', () => {
  const { parseGridClass } = require('../lib/grid-parser');
  assert.equal(parseGridClass('flex-md-lg-row', NEG_CONFIG), null);  // two breakpoints
  assert.equal(parseGridClass('md-flex',        NEG_CONFIG), null);  // bp can't lead
  assert.equal(parseGridClass('text-xxxl-center', NEG_CONFIG), null); // unknown bp
});

// ---------------------------------------------------------------------------
// span / rowspan — grid item placement (uses valuePrefix mechanism)
// ---------------------------------------------------------------------------

test('span: parses and emits grid-column: span N', () => {
  const d = parseClass('span-5', NEG_CONFIG);
  assert.equal(d?.prefix, 'span');
  assert.equal(d?.minPx, 5);
  assert.equal(d?.mode, 'fixed');
  const rule = generateRule(d, null, NEG_CONFIG, false);
  assert.match(rule, /grid-column:\s*span 5/);
});

test('rowspan: parses and emits grid-row: span N via shared valuePrefix mechanism', () => {
  const d = parseClass('rowspan-3', NEG_CONFIG);
  assert.equal(d?.prefix, 'rowspan');
  assert.equal(d?.minPx, 3);
  const rule = generateRule(d, null, NEG_CONFIG, false);
  assert.match(rule, /grid-row:\s*span 3/);
});

test('span: breakpoint variant works', () => {
  const d = parseClass('span-md-4', NEG_CONFIG);
  assert.equal(d?.breakpoint, 'md');
  assert.equal(d?.minPx, 4);
});

test('span / rowspan: fluid ranges rejected (fixedOnly)', () => {
  assert.equal(parseClass('span-3-5',    NEG_CONFIG), null);
  assert.equal(parseClass('rowspan-2-4', NEG_CONFIG), null);
  assert.match(diagnoseClass('span-3-5', NEG_CONFIG), /fixed-only/i);
});

test('span / rowspan: negatives rejected (no allowsNegative)', () => {
  assert.equal(parseClass('span-n2',    NEG_CONFIG), null);
  assert.equal(parseClass('rowspan-n1', NEG_CONFIG), null);
});

test('span valuePrefix does not leak into other unitless prefixes (order regression)', () => {
  // order is also unitless+fixedOnly but has no valuePrefix — must still emit plain integer
  const rule = generateRule(parseClass('order-5', NEG_CONFIG), null, NEG_CONFIG, false);
  assert.match(rule, /order:\s*5;/);
  assert.doesNotMatch(rule, /span/);
});

// ---------------------------------------------------------------------------
// grow / shrink — flex children (unitless, fixedOnly, no negatives, no valuePrefix)
// ---------------------------------------------------------------------------

test('grow / shrink: parse and emit plain integers on flex-grow / flex-shrink', () => {
  const g = parseClass('grow-1', NEG_CONFIG);
  assert.equal(g?.minPx, 1);
  assert.match(generateRule(g, null, NEG_CONFIG, false), /flex-grow:\s*1;/);

  const s = parseClass('shrink-0', NEG_CONFIG);
  assert.equal(s?.minPx, 0);
  assert.match(generateRule(s, null, NEG_CONFIG, false), /flex-shrink:\s*0;/);
});

test('grow / shrink: breakpoint variants work', () => {
  const d = parseClass('grow-md-2', NEG_CONFIG);
  assert.equal(d?.breakpoint, 'md');
  assert.equal(d?.minPx, 2);
});

test('grow / shrink: fluid and negatives rejected', () => {
  assert.equal(parseClass('grow-1-3',  NEG_CONFIG), null); // fixedOnly
  assert.equal(parseClass('shrink-0-1', NEG_CONFIG), null); // fixedOnly
  assert.equal(parseClass('grow-n1',   NEG_CONFIG), null); // no allowsNegative
  assert.equal(parseClass('shrink-n1', NEG_CONFIG), null); // no allowsNegative
});

// ---------------------------------------------------------------------------
// lh: literal values, decimals allowed (replaced the old ÷10 divisor)
// ---------------------------------------------------------------------------

test('lh: values are literal, decimals allowed', () => {
  const rule = (cls) => {
    const d = parseClass(cls, NEG_CONFIG);
    return generateRule(d, null, NEG_CONFIG, false);
  };

  assert.match(rule('lh-1.5'), /line-height: 1\.5;/);
  assert.match(rule('lh-0.8'), /line-height: 0\.8;/);
  assert.match(rule('lh-2'),   /line-height: 2;/);
  assert.match(rule('lh-1'),   /line-height: 1;/);

  // Unitless — no rem/px ever appended
  assert.doesNotMatch(rule('lh-1.5'), /rem|px/);

  // Old ÷10 syntax now means what it says: lh-15 → 15 (visibly broken, by design)
  assert.match(rule('lh-15'), /line-height: 15;/);

  // Breakpoint variant carries the decimal through
  const bp = parseClass('lh-md-1.2', NEG_CONFIG);
  assert.equal(bp.breakpoint, 'md');
  assert.equal(bp.minPx, 1.2);
});

test('lh: decimal selector is escaped', () => {
  const d = parseClass('lh-1.5', NEG_CONFIG);
  assert.match(generateRule(d, null, NEG_CONFIG, false), /^\.lh-1\\\.5 \{/);
});

test('decimals are gated to allowsDecimal prefixes', () => {
  // Only lh opts in — every other prefix rejects a decimal value
  assert.equal(parseClass('fs-16.5',    NEG_CONFIG), null);
  assert.equal(parseClass('p-1.5',      NEG_CONFIG), null);
  assert.equal(parseClass('mt-2.5',     NEG_CONFIG), null);
  assert.equal(parseClass('order-1.5',  NEG_CONFIG), null);
  assert.equal(parseClass('fs-md-16.5', NEG_CONFIG), null);

  // lh has no allowsNegative — a negative decimal is still rejected
  assert.equal(parseClass('lh-n1.5', NEG_CONFIG), null);

  // Fluid ranges stay integer-only (no fluid prefix allows decimals)
  assert.equal(parseClass('fs-16.5-48', NEG_CONFIG), null);
  assert.equal(parseClass('fs-16-48.5', NEG_CONFIG), null);
});

test('lh decimals do not disturb cols dot-ratio notation', () => {
  // cols dots are ratios, not decimals — matched before the numeric patterns
  const d = parseClass('cols-1.3', NEG_CONFIG);
  assert.equal(d.mode, 'grid');
  assert.equal(d.gridValue, '1.3');
  assert.match(generateRule(d, null, NEG_CONFIG, false), /minmax\(0, 1fr\) minmax\(0, 3fr\)/);
});

// ---------------------------------------------------------------------------
// Watch mode: input may be a file, a directory, or a glob. Only the directory
// case can use chokidar's `cwd` + `**/*.ext` form — the others watched nothing.
// ---------------------------------------------------------------------------

const { watchTargets } = require('../lib/runner');

test('watchTargets: directory input watches extension globs relative to it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-watch-'));

  const { paths, options } = watchTargets(dir, 'twig,html');
  assert.deepEqual(paths, ['**/*.twig', '**/*.html']);
  assert.equal(options.cwd, path.resolve(dir));
});

test('watchTargets: single-file input watches that file, with no cwd', () => {
  const dir  = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-watch-'));
  const file = path.join(dir, 'page.html');
  fs.writeFileSync(file, '<div class="fs-16"></div>', 'utf8');

  const { paths, options } = watchTargets(file, 'twig,html');
  assert.deepEqual(paths, [path.resolve(file)]);
  assert.equal(options.cwd, undefined); // cwd pointed at a file → watched nothing
});

test('watchTargets: glob input is handed to chokidar as-is', () => {
  const { paths, options } = watchTargets('src/**/*.twig', 'twig,html');
  assert.equal(paths, 'src/**/*.twig');
  assert.equal(options.cwd, undefined);
});
