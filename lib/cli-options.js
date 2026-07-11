'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_EXTENSIONS = 'twig,html,htm';
const DEFAULT_OUT = 'scss/_dopamine.scss';

function loadConfigHints(configPath, cwd = process.cwd()) {
  const configFile = path.resolve(cwd, configPath);
  if (!fs.existsSync(configFile)) return {};

  try {
    return JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } catch {
    return {};
  }
}

function applyConfigHints(inputArg, opts, configHints) {
  const resolvedOpts = { ...opts };
  const input = inputArg || configHints.input || '.';

  // `ext` and `out` are independent of which input is being scanned — a
  // positional input arg must not silently discard them. An explicit CLI flag
  // still wins: the `=== DEFAULT` check means we only fill in an untouched flag.
  if (configHints.ext && resolvedOpts.ext === DEFAULT_EXTENSIONS) {
    resolvedOpts.ext = configHints.ext;
  }

  if (configHints.out && resolvedOpts.out === DEFAULT_OUT) {
    resolvedOpts.out = configHints.out;
  }

  if (!resolvedOpts.classes && configHints.classes) {
    resolvedOpts.classes = configHints.classes;
  }

  if (!resolvedOpts.manifest && configHints.manifest) {
    resolvedOpts.manifest = configHints.manifest;
  }

  if (configHints.reset === false && resolvedOpts.reset !== false) {
    resolvedOpts.reset = false;
  }

  return { input, opts: resolvedOpts };
}

module.exports = {
  DEFAULT_EXTENSIONS,
  DEFAULT_OUT,
  loadConfigHints,
  applyConfigHints,
};
