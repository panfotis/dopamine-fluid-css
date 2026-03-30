'use strict';

const CONTAINER_RE = /^container-(\d+)$/;

/**
 * Keyword → CSS mapping.
 * Each entry: 'class-name': { prop: 'css-property', value: 'css-value' }
 *
 * All keywords support breakpoint variants: e.g. flex-md, align-center-lg
 */
const KEYWORD_MAP = {
  // Display
  'block':        { prop: 'display', value: 'block' },
  'inline':       { prop: 'display', value: 'inline' },
  'inline-block': { prop: 'display', value: 'inline-block' },
  'flex':         { prop: 'display', value: 'flex' },
  'inline-flex':  { prop: 'display', value: 'inline-flex' },
  'grid':         { prop: 'display', value: 'grid' },
  'inline-grid':  { prop: 'display', value: 'inline-grid' },
  'hidden':       { prop: 'display', value: 'none' },

  // Flex direction
  'flex-row':          { prop: 'flex-direction', value: 'row' },
  'flex-row-reverse':  { prop: 'flex-direction', value: 'row-reverse' },
  'flex-col':          { prop: 'flex-direction', value: 'column' },
  'flex-col-reverse':  { prop: 'flex-direction', value: 'column-reverse' },

  // Flex wrap
  'flex-wrap':   { prop: 'flex-wrap', value: 'wrap' },
  'flex-nowrap': { prop: 'flex-wrap', value: 'nowrap' },

  // Justify content
  'justify-start':   { prop: 'justify-content', value: 'flex-start' },
  'justify-center':  { prop: 'justify-content', value: 'center' },
  'justify-end':     { prop: 'justify-content', value: 'flex-end' },
  'justify-between': { prop: 'justify-content', value: 'space-between' },
  'justify-around':  { prop: 'justify-content', value: 'space-around' },
  'justify-evenly':  { prop: 'justify-content', value: 'space-evenly' },

  // Align items (container)
  'align-start':   { prop: 'align-items', value: 'flex-start' },
  'align-center':  { prop: 'align-items', value: 'center' },
  'align-end':     { prop: 'align-items', value: 'flex-end' },
  'align-stretch': { prop: 'align-items', value: 'stretch' },
  'align-baseline':{ prop: 'align-items', value: 'baseline' },

  // Align self (child)
  'self-start':   { prop: 'align-self', value: 'flex-start' },
  'self-center':  { prop: 'align-self', value: 'center' },
  'self-end':     { prop: 'align-self', value: 'flex-end' },
  'self-stretch': { prop: 'align-self', value: 'stretch' },
  'self-auto':    { prop: 'align-self', value: 'auto' },

  // Justify items (grid container)
  'justify-items-start':  { prop: 'justify-items', value: 'start' },
  'justify-items-center': { prop: 'justify-items', value: 'center' },
  'justify-items-end':    { prop: 'justify-items', value: 'end' },
  'justify-items-stretch':{ prop: 'justify-items', value: 'stretch' },

  // Justify self (grid child)
  'justify-self-start':  { prop: 'justify-self', value: 'start' },
  'justify-self-center': { prop: 'justify-self', value: 'center' },
  'justify-self-end':    { prop: 'justify-self', value: 'end' },
  'justify-self-stretch':{ prop: 'justify-self', value: 'stretch' },

  // Place (shorthand for both axes)
  'place-center': { prop: 'place-items', value: 'center' },

  // Text alignment
  'text-left':   { prop: 'text-align', value: 'left' },
  'text-center': { prop: 'text-align', value: 'center' },
  'text-right':  { prop: 'text-align', value: 'right' },

  // Font weight (named)
  'fw-light':  { prop: 'font-weight', value: '300' },
  'fw-normal': { prop: 'font-weight', value: '400' },
  'fw-medium': { prop: 'font-weight', value: '500' },
  'fw-bold':   { prop: 'font-weight', value: '700' },

  // Position
  'relative': { prop: 'position', value: 'relative' },
  'absolute': { prop: 'position', value: 'absolute' },
  'fixed':    { prop: 'position', value: 'fixed' },
  'sticky':   { prop: 'position', value: 'sticky' },

  // Overflow
  'overflow-hidden':  { prop: 'overflow', value: 'hidden' },
  'overflow-auto':    { prop: 'overflow', value: 'auto' },
  'overflow-visible': { prop: 'overflow', value: 'visible' },
  'overflow-scroll':  { prop: 'overflow', value: 'scroll' },

  // Z-index
  'z-0':   { prop: 'z-index', value: '0' },
  'z-1':   { prop: 'z-index', value: '1' },
  'z-2':   { prop: 'z-index', value: '2' },
  'z-3':   { prop: 'z-index', value: '3' },
  'z-4':   { prop: 'z-index', value: '4' },
  'z-5':   { prop: 'z-index', value: '5' },
  'z-10':  { prop: 'z-index', value: '10' },
  'z-50':  { prop: 'z-index', value: '50' },
  'z-100': { prop: 'z-index', value: '100' },
};

// Sorted by length descending so longer names match first
// e.g. "inline-block" before "inline", "flex-row-reverse" before "flex-row"
const KEYWORD_NAMES = Object.keys(KEYWORD_MAP).sort((a, b) => b.length - a.length);

/**
 * Parse a keyword/container class string into a descriptor.
 * Returns null if unrecognized.
 */
function parseGridClass(cls, config) {
  // Exact keyword match
  if (KEYWORD_MAP[cls]) {
    const { prop, value } = KEYWORD_MAP[cls];
    return { raw: cls, type: 'keyword', prop, value };
  }

  // Keyword with breakpoint: try longest name first
  // e.g. "flex-row-reverse-md" → "flex-row-reverse" + bp "md"
  if (config) {
    for (const name of KEYWORD_NAMES) {
      if (cls.startsWith(name + '-')) {
        const bp = cls.slice(name.length + 1);
        if (config.breakpoints[bp]) {
          const { prop, value } = KEYWORD_MAP[name];
          return { raw: cls, type: 'keyword', prop, value, breakpoint: bp };
        }
      }
    }
  }

  // Container
  const containerMatch = cls.match(CONTAINER_RE);
  if (containerMatch) {
    const maxWidth = parseInt(containerMatch[1], 10);
    if (maxWidth <= 0) return null;
    return { raw: cls, type: 'container', maxWidth };
  }

  return null;
}

module.exports = { parseGridClass, KEYWORD_NAMES };
