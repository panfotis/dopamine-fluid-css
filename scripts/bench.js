#!/usr/bin/env node

'use strict';

const fs          = require('fs');
const os          = require('os');
const path        = require('path');
const { spawnSync } = require('child_process');

const argv = parseArgs(process.argv.slice(2));

if (argv.help || argv.h) {
  console.log(`
dopamine-fluid benchmark

Generates a synthetic project of N templates, each with M randomly picked
classes, then runs the CLI multiple times and reports per-phase timings.
Useful for verifying build performance at scale before optimizing.

Usage:
  node scripts/bench.js [--files N] [--classes-per-file M] [--runs R]
  npm run bench -- --files 500 --classes-per-file 200

Options:
  --files N              Number of templates to generate.   Default: 200
  --classes-per-file M   Random classes per template.        Default: 100
  --runs R               Runs per configuration.             Default: 3
  --help, -h             Show this message.

Output:
  Runs twice per invocation — once with --manifest, once without — so you
  can see the manifest phase's contribution directly. Reports median total
  build time plus scan/parse/generate/manifest phase medians.
`);
  process.exit(0);
}

const FILES = argv.files ?? 200;
const CPF   = argv['classes-per-file'] ?? 100;
const RUNS  = argv.runs ?? 3;

const POOL = [
  'flex', 'grid', 'inline-flex', 'block', 'hidden',
  'justify-center', 'align-center', 'justify-end',
  'fs-12', 'fs-16', 'fs-20', 'fs-16-20', 'fs-18-24', 'fs-24-48', 'fs-32-84',
  'fw-300', 'fw-500', 'fw-normal',
  'p-8', 'p-16', 'p-24', 'px-16', 'py-8',
  'm-16', 'm-auto', 'mx-auto', 'mt-24', 'mb-48',
  'gap-8', 'gap-16', 'gap-8-16', 'gap-24-48',
  'w-100%', 'maxw-500', 'maxw-800',
  'cols-1', 'cols-2', 'cols-3', 'cols-1.3', 'cols-md-2', 'cols-md-3', 'cols-lg-4',
  'container-800', 'container-1200', 'container-1600',
  'radius-8', 'radius-16',
  'fs-sm-16', 'fs-md-20-32', 'fs-lg-24-48',
  'p-md-24', 'p-lg-32', 'gap-md-16-32',
];

function parseArgs(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = isNaN(+next) ? next : +next;
      i++;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function pick(n) {
  const chosen = new Array(n);
  for (let i = 0; i < n; i++) chosen[i] = POOL[Math.floor(Math.random() * POOL.length)];
  return chosen;
}

function generateFile(classes) {
  const chunks = [];
  chunks.push('<!DOCTYPE html><html><body>');
  const perDiv = 4;
  for (let i = 0; i < classes.length; i += perDiv) {
    const group = classes.slice(i, i + perDiv).join(' ');
    chunks.push(`<div class="${group}"><span class="${classes[i]}">copy ${i}</span></div>`);
  }
  chunks.push('</body></html>');
  return chunks.join('\n');
}

function buildProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-bench-'));
  for (let i = 0; i < FILES; i++) {
    const classes = pick(CPF);
    fs.writeFileSync(path.join(root, `page-${i}.html`), generateFile(classes), 'utf8');
  }
  return root;
}

function parseTiming(stdout) {
  const line = stdout.split('\n').find(l => l.includes('scan') && l.includes('parse'));
  if (!line) return null;
  const nums = line.match(/\d+/g);
  if (!nums || nums.length < 4) return null;
  return { scan: +nums[0], parse: +nums[1], generate: +nums[2], manifest: +nums[3] };
}

function parseTotal(stdout) {
  const m = stdout.match(/Done in\s+(?:\x1b\[[0-9;]*m)?(\d+)ms/);
  return m ? +m[1] : null;
}

function runOnce(projectDir, withManifest) {
  const cli = path.join(__dirname, '..', 'bin', 'dopamine.js');
  const outCss = path.join(projectDir, 'out.scss');
  const outManifest = path.join(projectDir, 'manifest.json');
  const args = [cli, projectDir, '--ext', 'html', '--out', outCss, '--no-header', '--no-reset'];
  if (withManifest) args.push('--manifest', outManifest);

  const result = spawnSync('node', args, {
    encoding: 'utf8',
    env: { ...process.env, DOPAMINE_TIMING: '1' },
  });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error('CLI failed');
  }

  return { total: parseTotal(result.stdout), timing: parseTiming(result.stdout) };
}

function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function report(label, runs) {
  const totals   = runs.map(r => r.total);
  const scans    = runs.map(r => r.timing.scan);
  const parses   = runs.map(r => r.timing.parse);
  const gens     = runs.map(r => r.timing.generate);
  const mans     = runs.map(r => r.timing.manifest);

  console.log(`\n${label}`);
  for (let i = 0; i < runs.length; i++) {
    const t = runs[i].timing;
    console.log(`  run #${i + 1}: ${runs[i].total}ms  (scan ${t.scan}  parse ${t.parse}  generate ${t.generate}  manifest ${t.manifest})`);
  }
  console.log(`  median:  ${median(totals)}ms  (scan ${median(scans)}  parse ${median(parses)}  generate ${median(gens)}  manifest ${median(mans)})`);
}

console.log(`\nBenchmark: ${FILES} files × ${CPF} classes each (${RUNS} runs per configuration)`);

const projectDir = buildProject();
console.log(`Project: ${projectDir}`);

const withManifest = [];
for (let i = 0; i < RUNS; i++) withManifest.push(runOnce(projectDir, true));
report('WITH manifest:', withManifest);

const withoutManifest = [];
for (let i = 0; i < RUNS; i++) withoutManifest.push(runOnce(projectDir, false));
report('WITHOUT manifest:', withoutManifest);

const withTotal    = median(withManifest.map(r => r.total));
const withoutTotal = median(withoutManifest.map(r => r.total));
const manifestCost = median(withManifest.map(r => r.timing.manifest));
console.log(`\nManifest overhead (median): ${withTotal - withoutTotal}ms wall-clock  /  ${manifestCost}ms in writeManifest`);
console.log('');
