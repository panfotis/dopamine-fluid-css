'use strict';

const fs   = require('fs');
const path = require('path');

const { loadConfig }                                  = require('./config');
const { resolveFiles, readFile }                      = require('./scanner');
const { extractClasses, parseClass, resolveViewport } = require('./parser');
const { generateRule }                                = require('./generator');
const { parseGridClass }                              = require('./grid-parser');
const { generateGridRule }                            = require('./grid-generator');
const { generateSassFunctions }                       = require('./generator-sass');
const { writeManifest }                               = require('./manifest');

function build(input, opts, config) {
  const extensions = opts.ext || 'twig,html,htm';
  const files      = resolveFiles(input, extensions);

  if (files.length === 0 && !opts.classes) {
    console.warn(`\x1b[33m⚠\x1b[0m  No files found for input: "${input}"`);
    return;
  }

  const t0 = Date.now();
  console.log(`\x1b[36m◆\x1b[0m  Scanning ${files.length} file${files.length > 1 ? 's' : ''}...`);

  const allClasses = new Set();

  for (const filePath of files) {
    const content = readFile(filePath);
    if (!content) continue;
    extractClasses(content).forEach(c => allClasses.add(c));
  }

  // Read extra classes from classes file (one class per line)
  const classesFromFile = new Set();
  if (opts.classes) {
    const classesPath = path.resolve(process.cwd(), opts.classes);
    if (fs.existsSync(classesPath)) {
      const lines = fs.readFileSync(classesPath, 'utf8')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'));
      lines.forEach(c => { allClasses.add(c); classesFromFile.add(c); });
      console.log(`\x1b[36m◆\x1b[0m  Loaded ${lines.length} class${lines.length !== 1 ? 'es' : ''} from ${path.relative(process.cwd(), classesPath)}`);
    } else {
      console.warn(`\x1b[33m⚠\x1b[0m  Classes file not found: "${opts.classes}"`);
    }
  }

  // Separate base rules from breakpoint rules so we can group them cleanly
  const baseRules = new Map();       // cls → css string
  const bpRules   = new Map();       // breakpointName → Map(cls → css string)
  const skipped   = [];
  const stats     = { fixed: 0, fluid: 0, overrides: 0 };

  for (const cls of allClasses) {
    const descriptor = parseClass(cls, config);
    if (!descriptor) continue;

    const { breakpoint } = descriptor;

    if (breakpoint && !bpRules.has(breakpoint)) {
      bpRules.set(breakpoint, new Map());
    }
    const target = breakpoint ? bpRules.get(breakpoint) : baseRules;

    if (target.has(cls)) { skipped.push(cls); continue; }

    const viewport = descriptor.mode === 'fluid'
      ? resolveViewport(descriptor, config)
      : null;

    const rule = generateRule(descriptor, viewport, config, opts.header !== false);
    target.set(cls, rule);

    if (descriptor.mode === 'fixed')      stats.fixed++;
    else if (descriptor.mode === 'auto')  stats.fixed++;
    else if (descriptor.mode === 'unit')  stats.fixed++;
    else                                  stats.fluid++;
    if (viewport && viewport.source !== 'default') stats.overrides++;
  }

  // Grid processing
  const gridBase = [];
  const gridBp   = new Map();
  let gridCount  = 0;
  const processedGrid = new Set();

  for (const cls of allClasses) {
    if (processedGrid.has(cls)) continue;
    const gridDesc = parseGridClass(cls, config);
    if (!gridDesc) continue;
    processedGrid.add(cls);

    const result = generateGridRule(gridDesc);
    gridBase.push(...result.base);
    for (const [bp, blocks] of Object.entries(result.media)) {
      if (!gridBp.has(bp)) gridBp.set(bp, []);
      gridBp.get(bp).push(...blocks);
    }
    gridCount++;
  }

  // Warn about unrecognized classes from the classes file
  if (classesFromFile.size > 0) {
    const matched = new Set([...baseRules.keys(), ...[...bpRules.values()].flatMap(m => [...m.keys()]), ...processedGrid]);
    const unmatched = [...classesFromFile].filter(c => !matched.has(c));
    if (unmatched.length > 0) {
      console.warn(`\x1b[33m⚠\x1b[0m  Skipped ${unmatched.length} unrecognized class${unmatched.length !== 1 ? 'es' : ''}: ${unmatched.join(', ')}`);
    }
  }

  const totalRules = baseRules.size + [...bpRules.values()].reduce((s, m) => s + m.size, 0) + gridCount;
  if (totalRules === 0) { console.warn('\x1b[33m⚠\x1b[0m  No classes found.'); return; }

  const css = buildOutput(baseRules, bpRules, config, opts, gridBase, gridBp);

  if (opts.dryRun) {
    console.log('\n' + css + '\n');
  } else {
    writeOutput(opts.out, css, config);
  }

  if (opts.manifest && !opts.dryRun) {
    const compiled = [
      ...baseRules.keys(),
      ...[...bpRules.values()].flatMap(m => [...m.keys()]),
      ...processedGrid,
    ];
    writeManifest(opts.manifest, compiled);
  }

  printSummary(totalRules, skipped, stats, gridCount, files, config, Date.now() - t0);
}

function buildOutput(baseRules, bpRules, config, opts, gridBase, gridBp) {
  const blocks = [];
  const fluidCount = baseRules.size + [...bpRules.values()].reduce((s, m) => s + m.size, 0);
  const gridBpCount = [...gridBp.values()].reduce((s, arr) => s + arr.length, 0);
  const totalCount = fluidCount + gridBase.length + gridBpCount;

  if (opts.header !== false) {
    const bpList = Object.entries(config.breakpoints)
      .sort((a, b) => a[1] - b[1])
      .map(([k, v]) => `${k}: ${v}px`)
      .join(', ');

    blocks.push([
      `/* ================================================`,
      ` * Generated by Dopamine Fluid`,
      ` *`,
      ` * Default viewport : ${config.viewport.min}px – ${config.viewport.max}px`,
      ` * Breakpoints      : ${bpList}`,
      ` * Generated        : ${new Date().toLocaleString()}`,
      ` * Rules            : ${totalCount}`,
      ` * ============================================== */`,
    ].join('\n'));
  }

  // Modern CSS Reset (optional — disable with --no-reset or "reset": false in config)
  if (opts.reset !== false) {
    blocks.push([
      '/* Reset */',
      '',
      '*, *::before, *::after {',
      '  box-sizing: border-box;',
      '}',
      '',
      '* {',
      '  margin: 0;',
      '}',
      '',
      'body {',
      '  min-height: 100vh;',
      '  line-height: 1.5;',
      '  -webkit-font-smoothing: antialiased;',
      '}',
      '',
      'img, picture, video, canvas, svg {',
      '  display: block;',
      '  max-width: 100%;',
      '}',
      '',
      'input, button, textarea, select {',
      '  font: inherit;',
      '}',
      '',
      'p, h1, h2, h3, h4, h5, h6 {',
      '  overflow-wrap: break-word;',
      '}',
    ].join('\n'));
  }

  // Grid base rules (structural — before fluid)
  if (gridBase.length > 0) {
    if (opts.header !== false) blocks.push('/* Grid */');
    blocks.push(...gridBase);
  }

  // Fluid base rules (no breakpoint)
  if (baseRules.size > 0) {
    if (opts.header !== false) blocks.push('/* Base */');
    blocks.push(...baseRules.values());
  }

  // Breakpoint rules — grouped into single @media blocks per breakpoint
  const sortedBps = Object.entries(config.breakpoints).sort((a, b) => a[1] - b[1]);
  for (const [bpName, bpPx] of sortedBps) {
    const gridBucket  = gridBp.get(bpName);
    const fluidBucket = bpRules.get(bpName);
    const hasGrid  = gridBucket && gridBucket.length > 0;
    const hasFluid = fluidBucket && fluidBucket.size > 0;

    if (!hasGrid && !hasFluid) continue;

    const innerRules = [];
    if (hasGrid)  innerRules.push(...gridBucket);
    if (hasFluid) innerRules.push(...fluidBucket.values());

    const indented = innerRules.map(r => '  ' + r.replace(/\n/g, '\n  ').trimEnd()).join('\n\n');
    const comment = opts.header !== false ? `/* ${bpName} — min-width: ${bpPx}px */\n\n` : '';
    blocks.push(`${comment}@media (min-width: ${bpPx}px) {\n${indented}\n}`);
  }

  return blocks.join('\n\n');
}

function writeOutput(outPath, css, config) {
  const resolved = path.resolve(process.cwd(), outPath);
  const dir      = path.dirname(resolved);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(resolved, css, 'utf8');
  const kb = (Buffer.byteLength(css, 'utf8') / 1024).toFixed(1);
  console.log(`\x1b[32m✔\x1b[0m  Written → ${path.relative(process.cwd(), resolved)} (${kb} KB)`);

  // Generate Sass functions file alongside .scss output
  if (resolved.endsWith('.scss')) {
    const functionsPath = path.join(dir, '_dopamine-functions.scss');
    const scss = generateSassFunctions(config);
    fs.writeFileSync(functionsPath, scss, 'utf8');
    console.log(`\x1b[32m✔\x1b[0m  Written → ${path.relative(process.cwd(), functionsPath)}`);
  }
}

function printSummary(total, skipped, stats, gridCount, files, config, ms) {
  const bpNames = Object.keys(config.breakpoints).join(', ');
  console.log('');
  console.log(`\x1b[1m  Summary\x1b[0m`);
  console.log(`  ─────────────────────────────────`);
  console.log(`  Files scanned        ${files.length}`);
  console.log(`  Rules generated      \x1b[32m${total}\x1b[0m`);
  console.log(`  ↳ fluid (clamp)      ${stats.fluid}`);
  console.log(`  ↳ fixed (rem)        ${stats.fixed}`);
  if (gridCount)         console.log(`  ↳ grid               ${gridCount}`);
  if (skipped.length)    console.log(`  Duplicates skipped   \x1b[90m${skipped.length}\x1b[0m`);
  if (stats.overrides)   console.log(`  Viewport overrides   \x1b[36m${stats.overrides}\x1b[0m`);
  console.log(`  Breakpoints          ${bpNames}`);
  console.log(`  Done in              \x1b[90m${ms}ms\x1b[0m`);
  console.log('');
}

async function run(input, opts) {
  const config = loadConfig(opts.config);

  if (opts.watch) {
    const chokidar = require('chokidar');
    const exts     = (opts.ext || 'twig,html,htm').split(',').map(e => `**/*.${e.trim()}`);

    console.log(`\x1b[36m◆\x1b[0m  Watching for changes... (Ctrl+C to stop)\n`);
    build(input, opts, config);

    chokidar.watch(exts, { cwd: path.resolve(input), ignoreInitial: true }).on('all', (event, filePath) => {
      console.log(`\x1b[90m${event}: ${path.relative(process.cwd(), filePath)}\x1b[0m`);
      build(input, opts, loadConfig(opts.config));
    });

    if (fs.existsSync(opts.config)) {
      chokidar.watch(opts.config).on('change', () => {
        console.log(`\x1b[36m◆\x1b[0m  Config changed, rebuilding...`);
        build(input, opts, loadConfig(opts.config));
      });
    }

    if (opts.classes) {
      const classesPath = path.resolve(process.cwd(), opts.classes);
      if (fs.existsSync(classesPath)) {
        chokidar.watch(classesPath).on('change', () => {
          console.log(`\x1b[36m◆\x1b[0m  Classes file changed, rebuilding...`);
          build(input, opts, loadConfig(opts.config));
        });
      }
    }
  } else {
    build(input, opts, config);
  }
}

module.exports = { run };
