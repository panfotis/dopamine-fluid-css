'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Bootstrap 5 breakpoints (min-width, mobile-first).
 * Breakpoints only gate @media wrappers; clamp math always uses the
 * global (or per-prefix) viewport range.
 */
const DEFAULT_BREAKPOINTS = {
  sm:  576,
  md:  768,
  lg:  992,
  xl:  1200,
  xxl: 1400,
};

const DEFAULTS = {
  viewport: {
    min: 320,
    max: 1440,
  },
  breakpoints: DEFAULT_BREAKPOINTS,
  prefixes: {},
};

const PREFIX_MAP = {
  fs:   { props: ['font-size'] },
  p:    { props: ['padding'] },
  pt:   { props: ['padding-top'] },
  pb:   { props: ['padding-bottom'] },
  pl:   { props: ['padding-left'] },
  pr:   { props: ['padding-right'] },
  px:   { props: ['padding-left', 'padding-right'] },
  py:   { props: ['padding-top', 'padding-bottom'] },
  m:    { props: ['margin'] },
  mt:   { props: ['margin-top'] },
  mb:   { props: ['margin-bottom'] },
  ml:   { props: ['margin-left'] },
  mr:   { props: ['margin-right'] },
  mx:   { props: ['margin-left', 'margin-right'] },
  my:   { props: ['margin-top', 'margin-bottom'] },
  gap:  { props: ['gap'] },
  gapx: { props: ['column-gap'] },
  gapy: { props: ['row-gap'] },
  w:    { props: ['width'], allowsUnits: true },
  // Height prefixes are fixedOnly: fluid clamp() would scale by viewport WIDTH,
  // which produces wrong results on narrow/tall (portrait) viewports. Use a fixed
  // value (h-400) or a viewport unit (h-100dvh, minh-80svh) for responsive heights.
  h:    { props: ['height'], allowsUnits: true, fixedOnly: true },
  lh:   { props: ['line-height'], unitless: true, divisor: 10, fixedOnly: true },
  radius: { props: ['border-radius'] },
  maxw: { props: ['max-width'], allowsUnits: true },
  minw: { props: ['min-width'], allowsUnits: true },
  maxh: { props: ['max-height'], allowsUnits: true, fixedOnly: true },
  minh: { props: ['min-height'], allowsUnits: true, fixedOnly: true },
  fw:   { props: ['font-weight'], unitless: true },
  cols: { props: ['grid-template-columns'], grid: true },
};

function loadConfig(configPath) {
  let userConfig = {};
  const resolved = path.resolve(process.cwd(), configPath);

  if (fs.existsSync(resolved)) {
    try {
      const raw = fs.readFileSync(resolved, 'utf8');
      userConfig = JSON.parse(raw);
      console.log(`\x1b[36m◆\x1b[0m Config loaded: ${path.relative(process.cwd(), resolved)}`);
    } catch (err) {
      throw new Error(`Failed to parse config file: ${resolved}\n  ${err.message}`);
    }
  } else {
    console.log(`\x1b[33m◆\x1b[0m No config file found at "${configPath}", using defaults`);
  }

  return mergeConfig(DEFAULTS, userConfig);
}

function mergeConfig(defaults, user) {
  const breakpoints = user.breakpoints
    ? { ...defaults.breakpoints, ...user.breakpoints }
    : { ...defaults.breakpoints };

  // Allow removing a breakpoint by setting it to null/false in config
  Object.keys(breakpoints).forEach(k => {
    if (!breakpoints[k]) delete breakpoints[k];
  });

  const viewport = {
    min: user.viewport?.min ?? defaults.viewport.min,
    max: user.viewport?.max ?? defaults.viewport.max,
  };

  if (viewport.min >= viewport.max) {
    throw new Error(`Invalid viewport range: min (${viewport.min}) must be less than max (${viewport.max}).`);
  }

  validateBreakpoints(breakpoints);

  return {
    input: user.input || null,
    ext: user.ext || null,
    out: user.out || null,
    viewport,
    breakpoints,
    prefixes: {
      ...defaults.prefixes,
      ...(user.prefixes || {}),
    },
  };
}

function validateBreakpoints(breakpoints) {
  const sorted = Object.entries(breakpoints).sort((a, b) => a[1] - b[1]);
  let prev = null;

  for (const [name, px] of sorted) {
    if (!Number.isFinite(px) || px <= 0) {
      throw new Error(`Invalid breakpoint "${name}": ${px}. Breakpoint values must be positive numbers.`);
    }

    if (prev && px <= prev[1]) {
      throw new Error(
        `Invalid breakpoint order: "${name}" (${px}) must be greater than "${prev[0]}" (${prev[1]}).`
      );
    }

    prev = [name, px];
  }
}

module.exports = { loadConfig, PREFIX_MAP };
