'use strict';

const { PREFIX_MAP } = require('./config');

/**
 * CLASS SYNTAX (all mobile-first, min-width):
 *
 * Base (no breakpoint):
 *   gap-16                fixed 16px value (single value)
 *   fs-16-48              fluid clamp, uses config/default viewport
 *   fs-16-48--320-1440    fluid clamp, inline viewport override
 *   cols-3                equal columns (grid-template-columns)
 *   cols-1.3              unequal columns 1fr 3fr
 *
 * With breakpoint (same clamp math as base, just wrapped in @media):
 *   fs-sm-24              fixed 24px at @media (min-width: 576px)
 *   fs-sm-24-48           fluid clamp(24->48) at @media (min-width: 576px)
 *                         viewport comes from prefix config or global default
 *   fs-sm-24-48--576-1200 fluid at sm breakpoint, inline viewport override
 *   cols-md-2             equal columns at md
 *   cols-lg-1.2.1         unequal columns at lg
 */

const CLASS_ATTR_RE = /(?:class|className)=["']([^"']+)["']|class=\{["']([^"']+)["']\}/g;
const BARE_TOKEN_RE = /\b([a-z]+(?:[xy])?-(?:[a-z]+-)?\d+-?\d*(?:--\d+-\d+)?)\b/g;
// Captures grid/keyword tokens outside class attributes (bare tokens in templates)
// Matches: container-*, cols-*, and keyword classes (display, flex, align, etc.)
const GRID_TOKEN_RE = /\b(container-\d+|cols-[\d.a-z-]+|(?:inline-(?:block|flex|grid)|flex-(?:row|col|wrap|nowrap|row-reverse|col-reverse)|justify-(?:start|center|end|between|around|evenly|items-start|items-center|items-end|items-stretch|self-start|self-center|self-end|self-stretch)|align-(?:start|center|end|stretch|baseline)|self-(?:start|center|end|stretch|auto)|place-center|text-(?:left|center|right)|fw-(?:light|normal|medium|bold)|overflow-(?:hidden|auto|visible|scroll)|grid|flex|block|inline|hidden|relative|absolute|fixed|sticky|z-\d+)(?:-[a-z]+)?)\b/g;

// Cols patterns (grid-template-columns): value can be number or dot-separated ratios
const COLS_BASE_RE = /^cols-([\d.]+)$/;
const COLS_BP_RE = /^cols-([a-z]+)-([\d.]+)$/;

// Auto pattern (no breakpoint): prefix-auto (margin only)
const AUTO_PATTERN = /^(?<prefix>m[xytblr]?)-auto$/;

// Auto with breakpoint: prefix-bp-auto (margin only)
const AUTO_BP_PATTERN = /^(?<prefix>m[xytblr]?)-(?<bp>[a-z]+)-auto$/;

// Fixed pattern (no breakpoint, single value): prefix-value
const FIXED_PATTERN = /^(?<prefix>[a-z]+(?:[xy])?)-(?<value>\d+)$/;

// Base pattern (no breakpoint): prefix-min-max[--vpMin-vpMax]
const BASE_PATTERN = /^(?<prefix>[a-z]+(?:[xy])?)-(?<minPx>\d+)-(?<maxPx>\d+)(?:--(?<vpMin>\d+)-(?<vpMax>\d+))?$/;

// Breakpoint pattern: prefix-bp-value[-max][--vpMin-vpMax]
// The second number is optional — if absent, it's a fixed value
const BP_PATTERN = /^(?<prefix>[a-z]+(?:[xy])?)-(?<bp>[a-z]+)-(?<minPx>\d+)(?:-(?<maxPx>\d+))?(?:--(?<vpMin>\d+)-(?<vpMax>\d+))?$/;

function extractClasses(content) {
  const classes = new Set();

  let m;
  CLASS_ATTR_RE.lastIndex = 0;
  while ((m = CLASS_ATTR_RE.exec(content)) !== null) {
    const str = m[1] || m[2];
    str.split(/\s+/).forEach(c => { if (c) classes.add(c); });
  }

  BARE_TOKEN_RE.lastIndex = 0;
  while ((m = BARE_TOKEN_RE.exec(content)) !== null) {
    classes.add(m[1]);
  }

  GRID_TOKEN_RE.lastIndex = 0;
  while ((m = GRID_TOKEN_RE.exec(content)) !== null) {
    classes.add(m[1]);
  }

  return classes;
}

/**
 * Parse a class string into a descriptor.
 * Returns null if unrecognized.
 *
 * Descriptor shape:
 * {
 *   raw,
 *   prefix,
 *   breakpoint: null | 'sm' | 'md' | ...,
 *   minPx,
 *   maxPx: null (fixed) | number (fluid),
 *   inlineVpMin, inlineVpMax,
 *   mode: 'fixed' | 'fluid' | 'grid',
 *   gridValue: null | string,   // raw value for cols (e.g. "3", "1.3", "1.2.1")
 * }
 */
function parseClass(cls, config) {
  const bpNames = Object.keys(config.breakpoints);

  // Try cols base pattern: cols-3, cols-1.3, cols-1.2.1
  const colsBaseMatch = cls.match(COLS_BASE_RE);
  if (colsBaseMatch) {
    const value = colsBaseMatch[1];
    if (!validateColsValue(value)) return null;
    return {
      raw: cls, prefix: 'cols', breakpoint: null,
      minPx: null, maxPx: null,
      inlineVpMin: null, inlineVpMax: null,
      mode: 'grid', gridValue: value,
    };
  }

  // Try cols breakpoint pattern: cols-md-2, cols-lg-1.3
  const colsBpMatch = cls.match(COLS_BP_RE);
  if (colsBpMatch) {
    const bp = colsBpMatch[1];
    const value = colsBpMatch[2];
    if (!bpNames.includes(bp)) return null;
    if (!validateColsValue(value)) return null;
    return {
      raw: cls, prefix: 'cols', breakpoint: bp,
      minPx: null, maxPx: null,
      inlineVpMin: null, inlineVpMax: null,
      mode: 'grid', gridValue: value,
    };
  }

  // Try breakpoint pattern first
  const bpMatch = cls.match(BP_PATTERN);
  if (bpMatch) {
    const { prefix, bp, minPx, maxPx, vpMin, vpMax } = bpMatch.groups;

    if (!PREFIX_MAP[prefix]) return null;
    if (!bpNames.includes(bp)) return null;

    const min = parseInt(minPx, 10);
    const max = maxPx !== undefined ? parseInt(maxPx, 10) : null;

    if (max !== null && min >= max) return null;

    const mode = max === null ? 'fixed' : 'fluid';
    if (mode === 'fluid' && PREFIX_MAP[prefix].fixedOnly) return null;

    return {
      raw: cls, prefix, breakpoint: bp,
      minPx: min, maxPx: max,
      inlineVpMin: vpMin ? parseInt(vpMin, 10) : null,
      inlineVpMax: vpMax ? parseInt(vpMax, 10) : null,
      mode,
      gridValue: null,
    };
  }

  // Try base pattern (no breakpoint)
  const baseMatch = cls.match(BASE_PATTERN);
  if (baseMatch) {
    const { prefix, minPx, maxPx, vpMin, vpMax } = baseMatch.groups;

    if (!PREFIX_MAP[prefix]) return null;
    if (PREFIX_MAP[prefix].fixedOnly) return null;

    const min = parseInt(minPx, 10);
    const max = parseInt(maxPx, 10);

    if (min >= max) return null;

    return {
      raw: cls, prefix, breakpoint: null,
      minPx: min, maxPx: max,
      inlineVpMin: vpMin ? parseInt(vpMin, 10) : null,
      inlineVpMax: vpMax ? parseInt(vpMax, 10) : null,
      mode: 'fluid', gridValue: null,
    };
  }

  // Try auto pattern (no breakpoint): prefix-auto
  const autoMatch = cls.match(AUTO_PATTERN);
  if (autoMatch) {
    const { prefix } = autoMatch.groups;
    if (!PREFIX_MAP[prefix]) return null;
    return {
      raw: cls, prefix, breakpoint: null,
      minPx: null, maxPx: null,
      inlineVpMin: null, inlineVpMax: null,
      mode: 'auto', gridValue: null,
    };
  }

  // Try auto with breakpoint: prefix-bp-auto
  const autoBpMatch = cls.match(AUTO_BP_PATTERN);
  if (autoBpMatch) {
    const { prefix, bp } = autoBpMatch.groups;
    if (!PREFIX_MAP[prefix]) return null;
    if (!bpNames.includes(bp)) return null;
    return {
      raw: cls, prefix, breakpoint: bp,
      minPx: null, maxPx: null,
      inlineVpMin: null, inlineVpMax: null,
      mode: 'auto', gridValue: null,
    };
  }

  // Try fixed pattern (single value, no breakpoint): prefix-value
  const fixedMatch = cls.match(FIXED_PATTERN);
  if (fixedMatch) {
    const { prefix, value } = fixedMatch.groups;

    if (!PREFIX_MAP[prefix]) return null;

    return {
      raw: cls, prefix, breakpoint: null,
      minPx: parseInt(value, 10), maxPx: null,
      inlineVpMin: null, inlineVpMax: null,
      mode: 'fixed', gridValue: null,
    };
  }

  return null;
}

/**
 * Validate a cols value string.
 * "4" → true, "1.3" → true, "1.2.1" → true, "0" → false, "abc" → false
 */
function validateColsValue(value) {
  if (value.includes('.')) {
    const parts = value.split('.').map(Number);
    return parts.length >= 2 && parts.every(n => !isNaN(n) && n >= 1);
  }
  const n = parseInt(value, 10);
  return !isNaN(n) && n >= 1;
}

/**
 * Resolve the effective viewport for a fluid class.
 * Breakpoint-prefixed classes use the same clamp math as their base counterpart;
 * the breakpoint only controls the @media wrapper.
 */
function resolveViewport(descriptor, config) {
  const { prefix, inlineVpMin, inlineVpMax } = descriptor;

  if (inlineVpMin !== null && inlineVpMax !== null) {
    return { vpMin: inlineVpMin, vpMax: inlineVpMax, source: 'inline' };
  }

  const pfxCfg = config.prefixes[prefix] || {};
  if (pfxCfg.vpMin != null || pfxCfg.vpMax != null) {
    return {
      vpMin: pfxCfg.vpMin ?? config.viewport.min,
      vpMax: pfxCfg.vpMax ?? config.viewport.max,
      source: 'prefix-config',
    };
  }

  return { vpMin: config.viewport.min, vpMax: config.viewport.max, source: 'default' };
}

module.exports = { extractClasses, parseClass, resolveViewport };
