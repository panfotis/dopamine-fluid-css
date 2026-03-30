'use strict';

const fs   = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Resolve input (file, directory, or glob) to an array of file paths.
 */
function resolveFiles(input, extensions) {
  const exts = extensions.split(',').map(e => e.trim().replace(/^\./, ''));

  // Single file
  if (fs.existsSync(input) && fs.statSync(input).isFile()) {
    return [path.resolve(input)];
  }

  // Directory → scan recursively
  if (fs.existsSync(input) && fs.statSync(input).isDirectory()) {
    const ext     = exts.length === 1 ? exts[0] : `{${exts.join(',')}}`;
    const pattern = `${input}/**/*.${ext}`;
    return glob.sync(pattern, { absolute: true });
  }

  // Treat as glob
  return glob.sync(input, { absolute: true });
}

/**
 * Read file contents, return null on error.
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

module.exports = { resolveFiles, readFile };
