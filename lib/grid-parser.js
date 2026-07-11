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
};

/**
 * Parse a keyword/container class string into a descriptor.
 * Returns null if unrecognized.
 */
function parseGridClass(cls, config) {
  // Exact keyword match — must run before breakpoint extraction so a keyword
  // segment can never be misread as a breakpoint name (e.g. 'justify-start'
  // stays a keyword even if a user configures a breakpoint called 'start').
  if (KEYWORD_MAP[cls]) {
    const { prop, value, props } = KEYWORD_MAP[cls];
    return { raw: cls, type: 'keyword', prop, value, props };
  }

  // Keyword with breakpoint, any position after the first segment: strip the
  // one segment that names a breakpoint; the remainder must be a keyword.
  // Middle (Bootstrap-style) and end both parse: 'flex-md-row-reverse',
  // 'text-md-center', 'align-center-lg' all work.
  if (config) {
    const parts = cls.split('-');
    for (let i = 1; i < parts.length; i++) {
      if (config.breakpoints[parts[i]]) {
        const rest = [...parts.slice(0, i), ...parts.slice(i + 1)].join('-');
        if (KEYWORD_MAP[rest]) {
          const { prop, value, props } = KEYWORD_MAP[rest];
          return { raw: cls, type: 'keyword', prop, value, props, breakpoint: parts[i] };
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

module.exports = { parseGridClass };
