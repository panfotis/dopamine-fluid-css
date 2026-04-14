'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { applyConfigHints, DEFAULT_EXTENSIONS, DEFAULT_OUT } = require('../lib/cli-options');
const { parseClass, resolveViewport } = require('../lib/parser');
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
