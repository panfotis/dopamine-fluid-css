'use strict';

const fs   = require('fs');
const path = require('path');

const VERSION = 1;

function buildManifest(classNames) {
  return {
    version: VERSION,
    generated: new Date().toISOString(),
    classes: [...classNames].sort(),
  };
}

function writeManifest(outPath, classNames) {
  const resolved = path.resolve(process.cwd(), outPath);
  const dir      = path.dirname(resolved);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const json = JSON.stringify(buildManifest(classNames), null, 2) + '\n';
  fs.writeFileSync(resolved, json, 'utf8');
  console.log(`\x1b[32m✔\x1b[0m  Written → ${path.relative(process.cwd(), resolved)} (${classNames.length} classes)`);
}

module.exports = { buildManifest, writeManifest, VERSION };
