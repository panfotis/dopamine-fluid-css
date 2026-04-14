'use strict';

const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('fs');
const os     = require('os');
const path   = require('path');
const { execFileSync } = require('child_process');

const { buildManifest, writeManifest, VERSION } = require('../lib/manifest');

const CLI = path.join(__dirname, '..', 'bin', 'dopamine.js');

test('buildManifest returns version, ISO timestamp, and sorted classes', () => {
  const manifest = buildManifest(['p-16', 'fs-16-48', 'flex']);

  assert.equal(manifest.version, VERSION);
  assert.match(manifest.generated, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.deepEqual(manifest.classes, ['flex', 'fs-16-48', 'p-16']);
});

test('buildManifest deduplicates via Set semantics when passed a Set', () => {
  const manifest = buildManifest(new Set(['a', 'a', 'b']));
  assert.deepEqual(manifest.classes, ['a', 'b']);
});

test('writeManifest writes JSON with trailing newline to the given path', () => {
  const dir  = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-manifest-'));
  const file = path.join(dir, 'out.json');

  writeManifest(file, ['fs-16-48', 'flex']);

  const raw = fs.readFileSync(file, 'utf8');
  assert.ok(raw.endsWith('\n'));
  const parsed = JSON.parse(raw);
  assert.equal(parsed.version, VERSION);
  assert.deepEqual(parsed.classes, ['flex', 'fs-16-48']);
});

test('CLI --manifest flag emits manifest matching compiled classes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-cli-'));
  const tpl = path.join(dir, 'index.html');
  fs.writeFileSync(tpl, '<div class="fs-16-48 p-16 flex block-md"></div>', 'utf8');

  const out      = path.join(dir, 'out.css');
  const manifest = path.join(dir, 'dopamine.manifest.json');

  execFileSync('node', [CLI, dir, '--ext', 'html', '--out', out, '--manifest', manifest, '--no-header', '--no-reset'], { stdio: 'pipe' });

  const parsed = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  assert.equal(parsed.version, VERSION);
  assert.ok(parsed.classes.includes('fs-16-48'));
  assert.ok(parsed.classes.includes('p-16'));
  assert.ok(parsed.classes.includes('flex'));
  assert.ok(parsed.classes.includes('block-md'));

  const css = fs.readFileSync(out, 'utf8');
  for (const cls of parsed.classes) {
    assert.ok(css.includes(cls.replace('.', '\\.')) || css.includes(cls), `compiled CSS should reference ${cls}`);
  }
});

test('CLI without --manifest writes no manifest file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-cli-'));
  const tpl = path.join(dir, 'index.html');
  fs.writeFileSync(tpl, '<div class="fs-16-48"></div>', 'utf8');
  const out = path.join(dir, 'out.css');

  execFileSync('node', [CLI, dir, '--ext', 'html', '--out', out, '--no-header', '--no-reset'], { stdio: 'pipe' });

  const manifestPath = path.join(dir, 'dopamine.manifest.json');
  assert.equal(fs.existsSync(manifestPath), false);
});

test('applyConfigHints picks up manifest from config when flag omitted', () => {
  const { applyConfigHints, DEFAULT_EXTENSIONS, DEFAULT_OUT } = require('../lib/cli-options');

  const resolved = applyConfigHints(undefined, {
    config: 'dopamine.config.json',
    ext: DEFAULT_EXTENSIONS,
    out: DEFAULT_OUT,
    reset: true,
  }, {
    manifest: './dopamine.manifest.json',
  });

  assert.equal(resolved.opts.manifest, './dopamine.manifest.json');
});

test('applyConfigHints keeps explicit --manifest over config', () => {
  const { applyConfigHints, DEFAULT_EXTENSIONS, DEFAULT_OUT } = require('../lib/cli-options');

  const resolved = applyConfigHints(undefined, {
    config: 'dopamine.config.json',
    ext: DEFAULT_EXTENSIONS,
    out: DEFAULT_OUT,
    reset: true,
    manifest: './explicit.json',
  }, {
    manifest: './from-config.json',
  });

  assert.equal(resolved.opts.manifest, './explicit.json');
});
