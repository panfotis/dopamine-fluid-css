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
 *
 * Units (sizing prefixes only: w, h, maxw, minw, maxh, minh):
 *   w-50%                 width: 50%
 *   h-100dvh              height: 100dvh
 *   minh-md-100svh        @media (min-width: 768px) { min-height: 100svh }
 *   Supported units: %, vw, vh, vmin, vmax, svw, svh, lvw, lvh, dvw, dvh
 *
 * Auto (margin + width/height):
 *   m-auto, mx-auto       centers the element
 *   w-auto, h-auto        width/height: auto
 *   w-md-auto             @media (min-width: 768px) { width: auto }
 */

// Class extraction is strictly attribute-only. Previously two additional
// regexes (BARE_TOKEN_RE for numeric classes, GRID_TOKEN_RE for keyword/grid
// classes) scanned the entire file content and produced phantom captures:
// e.g. `w-50` from `w-50%`, or `justify-center` from `<code>justify-center</code>`
// in documentation prose. Both have been removed. If a class needs to be
// compiled without appearing in a `class="..."` (or `className={...}`)
// attribute, list it in the `classes` file (e.g. `dopamine-safelist.txt`).
const CLASS_ATTR_RE = /(?:class|className)=["']([^"']+)["']|class=\{["']([^"']+)["']\}/g;

// Cols patterns (grid-template-columns): value can be number or dot-separated ratios
const COLS_BASE_RE = /^cols-([\d.]+)$/;
const COLS_BP_RE = /^cols-([a-z]+)-([\d.]+)$/;

// Auto pattern (no breakpoint): prefix-auto (margin + width/height)
const AUTO_PATTERN = /^(?<prefix>m[xytblr]?|w|h)-auto$/;

// Auto with breakpoint: prefix-bp-auto (margin + width/height)
const AUTO_BP_PATTERN = /^(?<prefix>m[xytblr]?|w|h)-(?<bp>[a-z]+)-auto$/;

// Fixed pattern (no breakpoint, single value): prefix-value
const FIXED_PATTERN = /^(?<prefix>[a-z]+(?:[xy])?)-(?<value>\d+)$/;

// Base pattern (no breakpoint): prefix-min-max[--vpMin-vpMax]
const BASE_PATTERN = /^(?<prefix>[a-z]+(?:[xy])?)-(?<minPx>\d+)-(?<maxPx>\d+)(?:--(?<vpMin>\d+)-(?<vpMax>\d+))?$/;

// Breakpoint pattern: prefix-bp-value[-max][--vpMin-vpMax]
// The second number is optional — if absent, it's a fixed value
const BP_PATTERN = /^(?<prefix>[a-z]+(?:[xy])?)-(?<bp>[a-z]+)-(?<minPx>\d+)(?:-(?<maxPx>\d+))?(?:--(?<vpMin>\d+)-(?<vpMax>\d+))?$/;

// Unit patterns (sizing only; prefix must have `allowsUnits: true` in PREFIX_MAP)
const UNIT_RE         = '(?:%|vw|vh|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh)';
const UNIT_PATTERN    = new RegExp(`^(?<prefix>[a-z]+)-(?<value>\\d+)(?<unit>${UNIT_RE})$`);
const UNIT_BP_PATTERN = new RegExp(`^(?<prefix>[a-z]+)-(?<bp>[a-z]+)-(?<value>\\d+)(?<unit>${UNIT_RE})$`);

function extractClasses(content) {
  const classes = new Set();

  let m;
  CLASS_ATTR_RE.lastIndex = 0;
  while ((m = CLASS_ATTR_RE.exec(content)) !== null) {
    const str = m[1] || m[2];
    str.split(/\s+/).forEach(c => { if (c) classes.add(c); });
  }

  return classes;
}

function extractClassCounts(content) {
  const counts = new Map();

  let m;
  CLASS_ATTR_RE.lastIndex = 0;
  while ((m = CLASS_ATTR_RE.exec(content)) !== null) {
    const str = m[1] || m[2];
    for (const c of str.split(/\s+/)) {
      if (!c) continue;
      counts.set(c, (counts.get(c) || 0) + 1);
    }
  }

  return counts;
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
 *   mode: 'fixed' | 'fluid' | 'grid' | 'auto' | 'unit',
 *   gridValue: null | string,   // raw value for cols (e.g. "3", "1.3", "1.2.1")
 *   unitValue: null | number,   // numeric value for unit mode (e.g. 50 for w-50%)
 *   unit:      null | string,   // unit suffix for unit mode (e.g. '%', 'vh', 'dvh')
 * }
 */
function parseClass(cls, config) {
  const bpNames = Object.keys(config.breakpoints);

  // Try unit-suffix patterns first (unambiguous — only these end in a unit suffix)
  const unitBpMatch = cls.match(UNIT_BP_PATTERN);
  if (unitBpMatch) {
    const { prefix, bp, value, unit } = unitBpMatch.groups;
    if (!PREFIX_MAP[prefix] || !PREFIX_MAP[prefix].allowsUnits) return null;
    if (!bpNames.includes(bp)) return null;
    const n = parseInt(value, 10);
    if (n < 0) return null;
    return {
      raw: cls, prefix, breakpoint: bp,
      minPx: null, maxPx: null,
      inlineVpMin: null, inlineVpMax: null,
      mode: 'unit', gridValue: null, unitValue: n, unit,
    };
  }

  const unitMatch = cls.match(UNIT_PATTERN);
  if (unitMatch) {
    const { prefix, value, unit } = unitMatch.groups;
    if (!PREFIX_MAP[prefix] || !PREFIX_MAP[prefix].allowsUnits) return null;
    const n = parseInt(value, 10);
    if (n < 0) return null;
    return {
      raw: cls, prefix, breakpoint: null,
      minPx: null, maxPx: null,
      inlineVpMin: null, inlineVpMax: null,
      mode: 'unit', gridValue: null, unitValue: n, unit,
    };
  }

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
 * Best-effort reason why `cls` failed to parse, suitable for a CLI warning.
 * Only called for classes the user explicitly listed (classes file), not for
 * template-extracted tokens — those are too noisy.
 *
 * Returns a short string like "'px' suffix not needed; ..." or null if no
 * useful diagnosis can be made.
 */
function diagnoseClass(cls, config) {
  // Explicit `-Npx` suffix — common typo from users familiar with plain CSS
  const pxMatch = cls.match(/^([a-z]+)(?:-[a-z]+)?-(\d+)px$/);
  if (pxMatch) {
    return `'px' suffix isn't needed — bare numbers are already pixels (write '${cls.replace(/px$/, '')}')`;
  }

  // Unit suffix on a prefix that doesn't allow units
  const unitBp = cls.match(UNIT_BP_PATTERN);
  const unit   = cls.match(UNIT_PATTERN);
  if (unitBp || unit) {
    const prefix = (unitBp || unit).groups.prefix;
    const u      = (unitBp || unit).groups.unit;
    if (PREFIX_MAP[prefix] && !PREFIX_MAP[prefix].allowsUnits) {
      return `unit suffix '${u}' is only supported on sizing prefixes (w, h, maxw, minw, maxh, minh)`;
    }
  }

  // Looks like a unit suffix but the unit is unknown (e.g. `h-100xx`, `w-50em`)
  const unknownUnit = cls.match(/^([a-z]+(?:-[a-z]+)?-\d+)([a-z]+)$/);
  if (unknownUnit) {
    const prefix = cls.split('-')[0];
    if (PREFIX_MAP[prefix] && PREFIX_MAP[prefix].allowsUnits) {
      return `unknown unit '${unknownUnit[2]}' — supported units: %, vw, vh, vmin, vmax, svw, svh, lvw, lvh, dvw, dvh`;
    }
  }

  // Unknown breakpoint — prefix is valid, breakpoint slot is not in config
  const bpLike = cls.match(/^([a-z]+(?:[xy])?)-([a-z]+)-\d+/);
  if (bpLike) {
    const [, prefix, bp] = bpLike;
    if (PREFIX_MAP[prefix] && !config.breakpoints[bp] && bp !== 'auto') {
      const bpList = Object.keys(config.breakpoints).join(', ');
      return `breakpoint '${bp}' not found in config.breakpoints (available: ${bpList})`;
    }
  }

  // Fluid range on a fixedOnly prefix (h, maxh, minh, lh)
  const fluidLike = cls.match(/^([a-z]+(?:[xy])?)-(?:[a-z]+-)?\d+-\d+(?:--\d+-\d+)?$/);
  if (fluidLike) {
    const prefix = fluidLike[1];
    if (PREFIX_MAP[prefix] && PREFIX_MAP[prefix].fixedOnly) {
      if (prefix === 'h' || prefix === 'maxh' || prefix === 'minh') {
        return `'${prefix}' doesn't support fluid ranges — fluid clamp scales by viewport width, which misbehaves on portrait viewports. Use a viewport unit like '${prefix}-100dvh' or a fixed value.`;
      }
      return `'${prefix}' doesn't support fluid ranges (fixed-only)`;
    }
  }

  // Inverted fluid range (min >= max)
  const invertedRange = cls.match(/^([a-z]+(?:[xy])?)-(?:[a-z]+-)?(\d+)-(\d+)(?:--\d+-\d+)?$/);
  if (invertedRange) {
    const [, , minS, maxS] = invertedRange;
    const min = parseInt(minS, 10);
    const max = parseInt(maxS, 10);
    if (min >= max) {
      return `fluid range inverted — '${minS}' must be less than '${maxS}'`;
    }
  }

  // Unknown prefix
  const prefixLike = cls.match(/^([a-z]+(?:[xy])?)-/);
  if (prefixLike && !PREFIX_MAP[prefixLike[1]]) {
    return `unknown prefix '${prefixLike[1]}'`;
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

module.exports = { extractClasses, extractClassCounts, parseClass, resolveViewport, diagnoseClass };
