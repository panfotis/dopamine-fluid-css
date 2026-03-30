'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Bootstrap 5 breakpoints (min-width, mobile-first).
 * Each breakpoint's clamp viewport runs from its own min-width
 * up to the next breakpoint's min-width (or global viewport.max).
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
  w:    { props: ['width'] },
  h:    { props: ['height'] },
  lh:   { props: ['line-height'] },
  radius: { props: ['border-radius'] },
  maxw: { props: ['max-width'] },
  minw: { props: ['min-width'] },
  maxh: { props: ['max-height'] },
  minh: { props: ['min-height'] },
  fw:   { props: ['font-weight'], unitless: true },
  cols: { props: ['grid-template-columns'], grid: true },
};

/**
 * Given a breakpoint name, return its natural clamp viewport range:
 *   vpMin = the breakpoint's own px value
 *   vpMax = the NEXT breakpoint's px value, or global viewport.max
 */
/**
 * Build a lookup table once: { sm: { vpMin, vpMax }, md: { … }, … }
 * so we don't re-sort on every class.
 */
function buildBreakpointViewportMap(config) {
  const sorted = Object.entries(config.breakpoints).sort((a, b) => a[1] - b[1]);
  const map = {};
  for (let i = 0; i < sorted.length; i++) {
    const [name, px] = sorted[i];
    const next = sorted[i + 1];
    map[name] = { vpMin: px, vpMax: next ? next[1] : config.viewport.max };
  }
  return map;
}

function resolveBreakpointViewport(bpName, bpViewportMap) {
  return bpViewportMap[bpName] || null;
}

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

  return {
    viewport: {
      min: user.viewport?.min ?? defaults.viewport.min,
      max: user.viewport?.max ?? defaults.viewport.max,
    },
    breakpoints,
    prefixes: {
      ...defaults.prefixes,
      ...(user.prefixes || {}),
    },
  };
}

module.exports = { loadConfig, PREFIX_MAP, buildBreakpointViewportMap, resolveBreakpointViewport };
