'use strict';

const { PREFIX_MAP } = require('./config');

/**
 * Build a CSS clamp() value that scales linearly from minPx → maxPx
 * across vpMin → vpMax viewport range.
 */
function buildClamp(minPx, maxPx, vpMin, vpMax) {
  if (vpMin >= vpMax) {
    throw new Error(`Invalid viewport range: ${vpMin}px >= ${vpMax}px. vpMin must be less than vpMax.`);
  }
  const slope     = (maxPx - minPx) / (vpMax - vpMin);
  const intercept = minPx - slope * vpMin;

  const vw   = round(slope * 100, 4);
  const remI = round(intercept / 16, 4);
  const minR = round(minPx / 16, 4);
  const maxR = round(maxPx / 16, 4);

  let preferred;
  if (remI === 0)       preferred = `${vw}vw`;
  else if (remI > 0)    preferred = `calc(${vw}vw + ${remI}rem)`;
  else                  preferred = `calc(${vw}vw - ${Math.abs(remI)}rem)`;

  return `clamp(${minR}rem, ${preferred}, ${maxR}rem)`;
}

/**
 * Generate a complete CSS block (with optional @media wrapper).
 *
 * Modes:
 *   fixed  → single px value, wrapped in @media if breakpoint present
 *   fluid  → clamp() value, wrapped in @media if breakpoint present
 *   grid   → grid-template-columns value (cols prefix)
 */
function generateRule(descriptor, viewport, _config, includeComment = true) {
  const { raw, prefix, minPx, maxPx, mode } = descriptor;
  const props    = PREFIX_MAP[prefix].props;
  const selector = escapeSelector(raw);

  let value, commentStr;

  if (mode === 'grid') {
    value      = buildGridColumns(descriptor.gridValue);
    commentStr = '';
  } else if (mode === 'auto') {
    value      = 'auto';
    commentStr = '';
  } else if (mode === 'unit') {
    value      = `${descriptor.unitValue}${descriptor.unit}`;
    commentStr = '';
  } else if (mode === 'fixed') {
    const { unitless, divisor, unit, valuePrefix } = PREFIX_MAP[prefix];
    if (divisor && unitless) {
      // lh: smart divisor, values < 10 are whole numbers, >= 10 are divided
      value      = minPx < 10 ? `${minPx}` : `${round(minPx / divisor, 4)}`;
      commentStr = '';
    } else if (unitless) {
      // order: "5"; span (via valuePrefix): "span 5"
      value      = valuePrefix ? `${valuePrefix}${minPx}` : `${minPx}`;
      commentStr = '';
    } else if (divisor && unit) {
      // ls: divisor with attached unit (e.g. 5 → "0.05em")
      value      = `${round(minPx / divisor, 4)}${unit}`;
      commentStr = '';
    } else {
      value      = `${round(minPx / 16, 4)}rem`;
      commentStr = includeComment ? `  /* fixed at ${minPx}px */\n` : '';
    }
  } else {
    const { vpMin, vpMax, source } = viewport;
    value      = buildClamp(minPx, maxPx, vpMin, vpMax);
    commentStr = (includeComment && source !== 'default')
      ? `  /* viewport: ${vpMin}px–${vpMax}px [${source}] */\n`
      : '';
  }

  const declarations = props
    .map(prop => `  ${prop}: ${value};`)
    .join('\n');

  return `.${selector} {\n${commentStr}${declarations}\n}`;
}

/**
 * Build grid-template-columns value from a cols value string.
 *   "4"     → "repeat(4, 1fr)"
 *   "1.3"   → "1fr 3fr"
 *   "1.2.1" → "1fr 2fr 1fr"
 */
function buildGridColumns(value) {
  if (value.includes('.')) {
    return value.split('.').map(n => `${n}fr`).join(' ');
  }
  return `repeat(${value}, 1fr)`;
}

function escapeSelector(cls) {
  return cls.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
}

function round(n, decimals) {
  return parseFloat(n.toFixed(decimals));
}

module.exports = { buildClamp, generateRule };
