#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const docsPath = path.resolve(__dirname, '../docs/index.html');

const html = fs.readFileSync(docsPath, 'utf8');
const updated = html.replace(
  /(DOPAMINE FLUID<span class="fs-14-18 fw-100">v)[0-9]+\.[0-9]+\.[0-9]+(<\/span>)/,
  `$1${pkg.version}$2`
);

if (html === updated && !html.includes(`v${pkg.version}</span>`)) {
  console.error('sync-docs-version: version string not found in docs/index.html — check the regex or the HTML.');
  process.exit(1);
}

fs.writeFileSync(docsPath, updated);
console.log(`sync-docs-version: docs/index.html set to v${pkg.version}`);
