#!/usr/bin/env node
// Build the published dist/ folder from addons/components/ sources.
// - Compiles every component .scss to dist/components/<name>/<name>.css (sass mirrors structure).
// - Copies every component .js to dist/components/<name>/<name>.js (preserves layout).
// Re-runs cleanly: wipes dist/ first.
//
// Wired into prepublishOnly so the published npm package always has fresh dist contents.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC = 'addons/components';
const DIST = 'dist/components';

fs.rmSync('dist', { recursive: true, force: true });
execSync(`npx sass ${SRC}:${DIST} --no-source-map`, { stdio: 'inherit' });

(function copyJs(srcDir, destDir) {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyJs(srcPath, destPath);
    else if (entry.name.endsWith('.js')) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
})(SRC, DIST);

console.log('dist/ built');
