'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { buildBreakpointViewportMap } = require('../lib/config');

test('uses the next breakpoint as the fluid viewport max when available', () => {
  const map = buildBreakpointViewportMap({
    viewport: { min: 320, max: 1440 },
    breakpoints: { sm: 576, md: 768, lg: 992 },
  });

  assert.deepEqual(map.sm, { vpMin: 576, vpMax: 768 });
  assert.deepEqual(map.md, { vpMin: 768, vpMax: 992 });
});

test('extrapolates the last breakpoint range when viewport.max is not above it', () => {
  const map = buildBreakpointViewportMap({
    viewport: { min: 320, max: 1440 },
    breakpoints: { xxl: 1400, xxxl: 1600, xxxxl: 1920 },
  });

  assert.deepEqual(map.xxxl, { vpMin: 1600, vpMax: 1920 });
  assert.deepEqual(map.xxxxl, { vpMin: 1920, vpMax: 2240 });
});

test('uses viewport.max for the last breakpoint when it is still above the breakpoint', () => {
  const map = buildBreakpointViewportMap({
    viewport: { min: 320, max: 1440 },
    breakpoints: { md: 768, xl: 1200 },
  });

  assert.deepEqual(map.xl, { vpMin: 1200, vpMax: 1440 });
});
