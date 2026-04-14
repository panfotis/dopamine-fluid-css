'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { applyConfigHints, DEFAULT_EXTENSIONS, DEFAULT_OUT } = require('../lib/cli-options');
const { extractClasses, parseClass, resolveViewport, diagnoseClass } = require('../lib/parser');
const { generateRule } = require('../lib/generator');

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

  // Fluid on fixedOnly height
  assert.match(diagnoseClass('h-60-120', config),    /doesn't support fluid/i);
  assert.match(diagnoseClass('minh-100-300', config), /doesn't support fluid/i);

  // Inverted fluid range
  assert.match(diagnoseClass('fs-48-16', config), /inverted/i);

  // Unknown prefix
  assert.match(diagnoseClass('zzz-16', config), /unknown prefix/i);

  // Genuine valid class gets no diagnosis (parseClass handles it)
  assert.equal(diagnoseClass('fs-16', config), null);
});
