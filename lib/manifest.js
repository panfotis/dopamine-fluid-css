'use strict';

const fs   = require('fs');
const path = require('path');

const VERSION = 2;

function buildManifest(counts) {
  const entries = [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({ name, count }));

  return {
    version: VERSION,
    generated: new Date().toISOString(),
    classes: entries,
  };
}

function writeManifest(outPath, counts) {
  const resolved = path.resolve(process.cwd(), outPath);
  const dir      = path.dirname(resolved);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const manifest = buildManifest(counts);
  const json = JSON.stringify(manifest, null, 2) + '\n';

  if (manifestUnchanged(resolved, manifest)) {
    if (process.env.DOPAMINE_TIMING) {
      console.log(`\x1b[90m◆  Manifest unchanged → skipped write (${manifest.classes.length} classes)\x1b[0m`);
    }
    return;
  }

  fs.writeFileSync(resolved, json, 'utf8');
  console.log(`\x1b[32m✔\x1b[0m  Written → ${path.relative(process.cwd(), resolved)} (${manifest.classes.length} classes)`);
}

function manifestUnchanged(resolved, next) {
  if (!fs.existsSync(resolved)) return false;
  try {
    const prev = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    if (prev.version !== next.version) return false;
    if (!Array.isArray(prev.classes) || prev.classes.length !== next.classes.length) return false;
    for (let i = 0; i < next.classes.length; i++) {
      const a = prev.classes[i];
      const b = next.classes[i];
      if (!a || a.name !== b.name || a.count !== b.count) return false;
    }
    return true;
  } catch {
    return false;
  }
}

module.exports = { buildManifest, writeManifest, VERSION };
