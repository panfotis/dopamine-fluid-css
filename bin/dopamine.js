#!/usr/bin/env node

'use strict';

const { program, Command } = require('commander');
const { version } = require('../package.json');
const { run } = require('../lib/runner');
const {
  DEFAULT_OUT,
  loadConfigHints,
  applyConfigHints,
} = require('../lib/cli-options');
const { scaffoldProject, buildInitMessage } = require('../lib/init');

if (process.argv[2] === 'init') {
  runInit(process.argv.slice(3));
} else {
  runBuild();
}

function runBuild() {
  program
    .name('dopamine')
    .description('Dopamine Fluid — generate fluid CSS and grid layouts from class names')
    .version(version)
    .argument('[input]', 'Input file, glob pattern, or directory', '.')
    .option('-c, --config <file>', 'Path to config file', 'dopamine.config.json')
    .option('-o, --out <file>', 'Output file (.css or .scss)', DEFAULT_OUT)
    .option('-w, --watch', 'Watch for file changes')
    .option('--ext <extensions>', 'File extensions to scan (comma-separated)', 'twig,html,htm')
    .option('--no-header', 'Omit the generated-by comment header')
    .option('--no-reset', 'Omit the CSS reset')
    .option('--classes <file>', 'Path to a file with class names to compile (one per line)')
    .option('--dry-run', 'Print CSS to stdout without writing file')
    .showHelpAfterError()
    .addHelpText('after', '\nCommands:\n  init [target]        Copy Dopamine starter files into a project\n')
    .parse(process.argv);

  const opts = program.opts();
  const [inputArg] = program.args;
  const configHints = loadConfigHints(opts.config);
  const resolved = applyConfigHints(inputArg, opts, configHints);

  run(resolved.input, resolved.opts).catch(err => {
    console.error('\x1b[31m✖\x1b[0m', err.message);
    process.exit(1);
  });
}

function runInit(argv) {
  const initProgram = new Command();

  initProgram
    .name('dopamine init')
    .description('Copy the Dopamine starter files into a project directory')
    .version(version)
    .argument('[target]', 'Target directory to scaffold', '.')
    .option('-f, --force', 'Overwrite starter files that already exist')
    .option('--dry-run', 'Preview the starter files and package.json changes without writing')
    .showHelpAfterError()
    .parse(['node', 'dopamine init', ...argv]);

  const opts = initProgram.opts();
  const [target] = initProgram.processedArgs;

  try {
    const result = scaffoldProject(target, { force: opts.force, dryRun: opts.dryRun });
    console.log(buildInitMessage(result));
  } catch (err) {
    console.error('\x1b[31m✖\x1b[0m', err.message);
    process.exit(1);
  }
}
