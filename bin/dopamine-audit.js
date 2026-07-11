#!/usr/bin/env node

'use strict';

const fs   = require('fs');
const path = require('path');
const { program } = require('commander');
const { version } = require('../package.json');
const { loadConfig } = require('../lib/config');
const { resolveFiles } = require('../lib/scanner');
const { parseClass, resolveViewport } = require('../lib/parser');
const { parseGridClass } = require('../lib/grid-parser');
const { generateRule } = require('../lib/generator');
const { generateGridRule } = require('../lib/grid-generator');
const { collectClassCounts } = require('../lib/counter');

program
  .name('dopamine-audit')
  .description('Analyze numeric utility classes and suggest near-duplicate range combinations')
  .version(version)
  .argument('[input]', 'Input file, glob pattern, or directory')
  .option('-c, --config <file>', 'Path to config file', 'dopamine.config.json')
  .option('--ext <extensions>', 'File extensions to scan (comma-separated)', 'twig,html,htm')
  .option('--prefix <list>', 'Only include these prefixes (comma-separated)')
  .option('--close-min <px>', 'Max allowed min-value delta in px', '2')
  .option('--close-max <px>', 'Max allowed max-value delta in px', '4')
  .option('--include-breakpoints', 'Include breakpoint variants in merge suggestions')
  .option('--include-inline-vp', 'Include inline viewport override variants in merge suggestions')
  .option('-o, --out [file]', 'Write audit report to a file (plain text)', false)
  .parse(process.argv);

const opts = program.opts();
const [inputArg] = program.args;

// Read config hints for input/ext defaults (same as main CLI)
let configHints = {};
const configFile = path.resolve(process.cwd(), opts.config);
if (fs.existsSync(configFile)) {
  try { configHints = JSON.parse(fs.readFileSync(configFile, 'utf8')); } catch {}
}

const input = inputArg || configHints.input || '.';
if (!inputArg && configHints.ext && opts.ext === 'twig,html,htm') opts.ext = configHints.ext;

const closeMin = parseInt(opts.closeMin, 10);
const closeMax = parseInt(opts.closeMax, 10);

if (Number.isNaN(closeMin) || closeMin < 0 || Number.isNaN(closeMax) || closeMax < 0) {
  console.error('\x1b[31m✖\x1b[0m --close-min and --close-max must be non-negative integers');
  process.exit(1);
}

const prefixFilter = opts.prefix
  ? new Set(opts.prefix.split(',').map(p => p.trim()).filter(Boolean))
  : null;

const config = loadConfig(opts.config);
const files = resolveFiles(input, opts.ext);

if (files.length === 0) {
  console.warn(`\x1b[33m⚠\x1b[0m No files found for input: "${input}"`);
  process.exit(0);
}

// Capture output for both terminal and file
const output = [];
function log(line = '') {
  console.log(line);
  output.push(line);
}

const counts = collectClassCounts(files);
const parsed = [];


for (const [cls, uses] of counts.entries()) {
  const descriptor = parseClass(cls, config);
  if (!descriptor) continue;
  if (descriptor.mode !== 'fluid' && descriptor.mode !== 'fixed') continue;
  if (prefixFilter && !prefixFilter.has(descriptor.prefix)) continue;

  parsed.push({ cls, uses, descriptor });
}

const fluid = parsed.filter(item => item.descriptor.mode === 'fluid');
const fixed = parsed.filter(item => item.descriptor.mode === 'fixed');
const totalUses = parsed.reduce((sum, item) => sum + item.uses, 0);

log('');
log('\x1b[1mDopamine Class Audit\x1b[0m');
log('─────────────────────────────────');
log(`Files scanned              ${files.length}`);
log(`Numeric classes (unique)   ${parsed.length}`);
log(`Numeric classes (uses)     ${totalUses}`);
log(`Fluid ranges               ${fluid.length}`);
log(`Fixed values               ${fixed.length}`);
if (prefixFilter) {
  log(`Prefix filter              ${[...prefixFilter].join(', ')}`);
}
log('');

printRangeInventory(fluid, fixed);

const candidates = fluid.filter(item => {
  if (!opts.includeBreakpoints && item.descriptor.breakpoint) return false;
  if (!opts.includeInlineVp && (item.descriptor.inlineVpMin !== null || item.descriptor.inlineVpMax !== null)) {
    return false;
  }
  return true;
});

const mergeGroups = buildMergeSuggestions(candidates, closeMin, closeMax);
printMergeSuggestions(mergeGroups, closeMin, closeMax);

printDuplicateSpellings(counts, config);

/**
 * Resolve any class (numeric or grid/keyword) to its generated declarations
 * plus media scope, without the selector. Returns null for unknown classes.
 * Alias spellings (cols-1.3 / cols-1:3, span/colspan, text-md-center /
 * text-center-md) produce identical declarations — that's the group key.
 */
function declarationsFor(cls) {
  const descriptor = parseClass(cls, config);
  if (descriptor) {
    const viewport = descriptor.mode === 'fluid' ? resolveViewport(descriptor, config) : null;
    const rule = generateRule(descriptor, viewport, config, false);
    return { bp: descriptor.breakpoint || 'base', decls: innerDeclarations(rule) };
  }

  const gridDesc = parseGridClass(cls, config);
  if (gridDesc) {
    const result = generateGridRule(gridDesc);
    const bps = Object.keys(result.media);
    const rule = result.base[0] ?? result.media[bps[0]]?.[0];
    if (!rule) return null;
    return { bp: bps[0] || 'base', decls: innerDeclarations(rule) };
  }

  return null;
}

function innerDeclarations(rule) {
  return rule.slice(rule.indexOf('{') + 1, rule.lastIndexOf('}')).trim();
}

function printDuplicateSpellings(allCounts, _config) {
  const groups = new Map();

  for (const [cls, uses] of allCounts.entries()) {
    const resolved = declarationsFor(cls);
    if (!resolved) continue;
    const key = `${resolved.bp}|${resolved.decls}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ cls, uses });
  }

  const dupes = [...groups.entries()]
    .filter(([, items]) => items.length >= 2)
    .map(([key, items]) => ({
      bp: key.slice(0, key.indexOf('|')),
      items: items.slice().sort((a, b) => b.uses - a.uses),
    }))
    .sort((a, b) => b.items[0].uses - a.items[0].uses);

  log('\x1b[1mDuplicate Spellings\x1b[0m');
  log('Classes that generate identical CSS under different names — pick one per project.');

  if (dupes.length === 0) {
    log('- No duplicate spellings found.');
    log('');
    return;
  }

  for (const { bp, items } of dupes) {
    const [keep, ...rest] = items;
    const scope = bp === 'base' ? '' : ` @ ${bp}`;
    const others = rest.map(item => `\`${item.cls}\` (${item.uses} uses)`).join(', ');
    log(`- keep \`${keep.cls}\` (${keep.uses} uses)${scope} — same CSS: ${others}`);
  }
  log('');
}

function inventoryKey(descriptor) {
  const bp = descriptor.breakpoint ? `@${descriptor.breakpoint}` : '@base';
  return `${descriptor.prefix}${bp}`;
}

function printRangeInventory(fluidItems, fixedItems) {
  const buckets = new Map();

  for (const item of fluidItems) {
    const key = inventoryKey(item.descriptor);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(item);
  }

  for (const item of fixedItems) {
    const key = inventoryKey(item.descriptor);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(item);
  }

  const keys = [...buckets.keys()].sort((a, b) => a.localeCompare(b));
  if (keys.length === 0) {
    log('No numeric classes found for the selected input/filter.');
    return;
  }

  log('\x1b[1mRange Inventory\x1b[0m');
  for (const key of keys) {
    const items = buckets.get(key).slice().sort((a, b) => {
      const aMin = a.descriptor.minPx ?? Number.MAX_SAFE_INTEGER;
      const bMin = b.descriptor.minPx ?? Number.MAX_SAFE_INTEGER;
      if (aMin !== bMin) return aMin - bMin;
      const aMax = a.descriptor.maxPx ?? aMin;
      const bMax = b.descriptor.maxPx ?? bMin;
      return aMax - bMax;
    });

    const compact = items
      .map(item => `${item.cls}(${item.uses})`)
      .join(', ');

    log(`- ${key}: ${compact}`);
  }
  log('');
}

function buildMergeSuggestions(items, maxMinDelta, maxMaxDelta) {
  const byBucket = new Map();

  for (const item of items) {
    const d = item.descriptor;
    const key = `${d.prefix}|${d.breakpoint || 'base'}`;
    if (!byBucket.has(key)) byBucket.set(key, []);
    byBucket.get(key).push(item);
  }

  const groups = [];

  for (const [bucket, bucketItems] of byBucket.entries()) {
    if (bucketItems.length < 2) continue;

    const ranked = bucketItems
      .slice()
      .sort((a, b) => scoreRepresentative(b) - scoreRepresentative(a));
    const consumed = new Set();

    for (const keep of ranked) {
      if (consumed.has(keep.cls)) continue;

      const replace = ranked
        .filter(item => item.cls !== keep.cls && !consumed.has(item.cls))
        .filter(item => isClose(item, keep, maxMinDelta, maxMaxDelta))
        .sort((a, b) => b.uses - a.uses);

      if (replace.length === 0) continue;

      groups.push({ bucket, keep, replace });
      consumed.add(keep.cls);
      for (const item of replace) consumed.add(item.cls);
    }
  }

  groups.sort((a, b) => {
    const aTotal = a.replace.reduce((s, item) => s + item.uses, 0);
    const bTotal = b.replace.reduce((s, item) => s + item.uses, 0);
    return bTotal - aTotal;
  });

  return groups;
}

function isClose(a, b, maxMinDelta, maxMaxDelta) {
  const minDelta = Math.abs(a.descriptor.minPx - b.descriptor.minPx);
  const maxDelta = Math.abs(a.descriptor.maxPx - b.descriptor.maxPx);
  return minDelta <= maxMinDelta && maxDelta <= maxMaxDelta;
}

function scoreRepresentative(item) {
  const d = item.descriptor;
  let score = item.uses * 100;

  // Prefer cleaner numbers for canonical suggestions.
  if (d.minPx % 2 === 0) score += 5;
  if (d.maxPx % 2 === 0) score += 5;
  if (d.minPx % 4 === 0) score += 2;
  if (d.maxPx % 4 === 0) score += 2;

  return score;
}

function printMergeSuggestions(groups, maxMinDelta, maxMaxDelta) {
  log('\x1b[1mClose-Range Merge Suggestions\x1b[0m');
  log(`Threshold: Δmin <= ${maxMinDelta}px and Δmax <= ${maxMaxDelta}px`);

  if (groups.length === 0) {
    log('- No close combinations found.');
    log('');
    return;
  }

  for (const group of groups) {
    const bucketLabel = group.bucket.replace('|', ' @ ');
    log(`- ${bucketLabel}: keep \`${group.keep.cls}\` (${group.keep.uses} uses)`);
    for (const item of group.replace) {
      const minDelta = Math.abs(item.descriptor.minPx - group.keep.descriptor.minPx);
      const maxDelta = Math.abs(item.descriptor.maxPx - group.keep.descriptor.maxPx);
      log(`  replace \`${item.cls}\` (${item.uses} uses, Δmin ${minDelta}px, Δmax ${maxDelta}px)`);
    }
  }

  log('');
}

// Write plain-text report to file (strip ANSI codes)
if (opts.out !== false) {
  const fileName = typeof opts.out === 'string' ? opts.out : 'audit';
  const plain = output.map(line => line.replace(/\x1b\[[0-9;]*m/g, '')).join('\n');
  const outPath = path.resolve(process.cwd(), fileName);
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, plain, 'utf8');
  console.log(`\x1b[32m✔\x1b[0m  Audit written → ${path.relative(process.cwd(), outPath)}`);
}
