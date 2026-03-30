#!/usr/bin/env node

'use strict';

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
  .option('--dry-run', 'Print CSS to stdout without writing file')
  .parse(process.argv);

const opts = program.opts();
const [input = '.'] = program.args;

run(input, opts).catch(err => {
  console.error('\x1b[31m✖\x1b[0m', err.message);
  process.exit(1);
});
