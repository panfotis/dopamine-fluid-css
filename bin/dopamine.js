#!/usr/bin/env node

'use strict';

const fs   = require('fs');
const path = require('path');
const { program } = require('commander');
const { version } = require('../package.json');
const { run } = require('../lib/runner');

program
  .name('dopamine')
  .description('Dopamine Fluid — generate fluid CSS and grid layouts from class names')
  .version(version)
  .argument('[input]', 'Input file, glob pattern, or directory', '.')
  .option('-c, --config <file>', 'Path to config file', 'dopamine.config.json')
  .option('-o, --out <file>', 'Output CSS file', 'fluid.css')
  .option('-w, --watch', 'Watch for file changes')
  .option('--ext <extensions>', 'File extensions to scan (comma-separated)', 'twig,html,htm')
  .option('--no-header', 'Omit the generated-by comment header')
  .option('--no-reset', 'Omit the CSS reset')
  .option('--dry-run', 'Print CSS to stdout without writing file')
  .parse(process.argv);

const opts = program.opts();
const [inputArg] = program.args;

// Peek at config file for input/ext/out defaults (full config is loaded in runner)
let configHints = {};
const configFile = path.resolve(process.cwd(), opts.config);
if (fs.existsSync(configFile)) {
  try { configHints = JSON.parse(fs.readFileSync(configFile, 'utf8')); } catch {}
}

const input = inputArg || configHints.input || '.';
if (!inputArg && configHints.ext && opts.ext === 'twig,html,htm') opts.ext = configHints.ext;
if (!inputArg && configHints.out && opts.out === 'fluid.css') opts.out = configHints.out;
if (configHints.reset === false && opts.reset !== false) opts.reset = false;

run(input, opts).catch(err => {
  console.error('\x1b[31m✖\x1b[0m', err.message);
  process.exit(1);
});
