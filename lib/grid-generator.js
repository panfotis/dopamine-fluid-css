'use strict';

/**
 * Generate CSS blocks from a grid descriptor.
 *
 * Returns { base: string[], media: { bpName: string[], ... } }
 */
function generateGridRule(descriptor) {
  if (descriptor.type === 'keyword')   return generateKeyword(descriptor);
  if (descriptor.type === 'container') return generateContainer(descriptor);
  return { base: [], media: {} };
}

function generateKeyword(descriptor) {
  const sel = escapeSelector(descriptor.raw);
  let declarations;
  if (descriptor.props) {
    declarations = descriptor.props.map(([p, v]) => `  ${p}: ${v};`).join('\n');
  } else {
    declarations = `  ${descriptor.prop}: ${descriptor.value};`;
  }
  const rule = `.${sel} {\n${declarations}\n}`;

  if (descriptor.breakpoint) {
    return { base: [], media: { [descriptor.breakpoint]: [rule] } };
  }

  return { base: [rule], media: {} };
}

function generateContainer(descriptor) {
  const sel = escapeSelector(descriptor.raw);
  const base = `.${sel} {\n  width: 100%;\n  max-width: ${descriptor.maxWidth}px;\n  margin-left: auto;\n  margin-right: auto;\n}`;
  return { base: [base], media: {} };
}

function escapeSelector(cls) {
  return cls.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
}

module.exports = { generateGridRule };
