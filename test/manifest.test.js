'use strict';

const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('fs');
const os     = require('os');
const path   = require('path');
const { execFileSync } = require('child_process');

const { buildManifest, writeManifest, VERSION } = require('../lib/manifest');

const CLI = path.join(__dirname, '..', 'bin', 'dopamine.js');

test('buildManifest returns v2 shape with sorted {name, count} entries', () => {
  const manifest = buildManifest(new Map([
    ['p-16', 2],
    ['fs-16-48', 1],
    ['flex', 5],
  ]));

  assert.equal(manifest.version, VERSION);
  assert.equal(VERSION, 2);
  assert.match(manifest.generated, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.deepEqual(manifest.classes, [
    { name: 'flex',     count: 5 },
    { name: 'fs-16-48', count: 1 },
    { name: 'p-16',     count: 2 },
  ]);
});

test('writeManifest writes v2 JSON with trailing newline to the given path', () => {
  const dir  = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-manifest-'));
  const file = path.join(dir, 'out.json');

  writeManifest(file, new Map([['fs-16-48', 3], ['flex', 1]]));

  const raw = fs.readFileSync(file, 'utf8');
  assert.ok(raw.endsWith('\n'));
  const parsed = JSON.parse(raw);
  assert.equal(parsed.version, VERSION);
  assert.deepEqual(parsed.classes, [
    { name: 'flex',     count: 1 },
    { name: 'fs-16-48', count: 3 },
  ]);
});

test('CLI --manifest flag emits v2 manifest matching compiled classes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-cli-'));
  const tpl = path.join(dir, 'index.html');
  fs.writeFileSync(tpl, '<div class="fs-16-48 p-16 flex block-md"></div>', 'utf8');

  const out      = path.join(dir, 'out.css');
  const manifest = path.join(dir, 'dopamine.manifest.json');

  execFileSync('node', [CLI, dir, '--ext', 'html', '--out', out, '--manifest', manifest, '--no-header', '--no-reset'], { stdio: 'pipe' });

  const parsed = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  assert.equal(parsed.version, VERSION);

  const names = parsed.classes.map(c => c.name);
  assert.ok(names.includes('fs-16-48'));
  assert.ok(names.includes('p-16'));
  assert.ok(names.includes('flex'));
  assert.ok(names.includes('block-md'));

  for (const entry of parsed.classes) {
    assert.equal(typeof entry.name, 'string');
    assert.equal(typeof entry.count, 'number');
    assert.ok(entry.count >= 1);
  }

  const css = fs.readFileSync(out, 'utf8');
  for (const name of names) {
    assert.ok(css.includes(name.replace('.', '\\.')) || css.includes(name), `compiled CSS should reference ${name}`);
  }
});

test('CLI --manifest counts multiple uses across attributes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-cli-'));
  const tpl = path.join(dir, 'index.html');
  fs.writeFileSync(tpl,
    '<div class="flex p-16"></div>' +
    '<span class="flex flex p-16"></span>',
    'utf8'
  );

  const out      = path.join(dir, 'out.css');
  const manifest = path.join(dir, 'dopamine.manifest.json');

  execFileSync('node', [CLI, dir, '--ext', 'html', '--out', out, '--manifest', manifest, '--no-header', '--no-reset'], { stdio: 'pipe' });

  const parsed = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const byName = Object.fromEntries(parsed.classes.map(c => [c.name, c.count]));

  assert.equal(byName['flex'], 3);
  assert.equal(byName['p-16'], 2);
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

test('CLI --manifest captures ternary + Twig set/addClass patterns', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-cli-'));
  const tpl = path.join(dir, 'page.html');
  fs.writeFileSync(tpl, [
    `<div class="{{ cond ? 'fs-12-32' : 'fs-12-62' }}"></div>`,
    `{% set classes = ['fs-16', 'p-8 m-16', 'block-' ~ slug] %}`,
    `{{ attributes.addClass(classes, '', float_label ? 'fs-20') }}`,
  ].join('\n'), 'utf8');

  const out      = path.join(dir, 'out.css');
  const manifest = path.join(dir, 'dopamine.manifest.json');

  execFileSync('node', [CLI, dir, '--ext', 'html', '--out', out, '--manifest', manifest, '--no-header', '--no-reset'], { stdio: 'pipe' });

  const parsed = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const names = parsed.classes.map(c => c.name);

  for (const expected of ['fs-12-32', 'fs-12-62', 'fs-16', 'p-8', 'm-16', 'fs-20']) {
    assert.ok(names.includes(expected), `manifest should include ${expected}, got ${names.join(',')}`);
  }
});

test('safelisted classes not used in templates get count 0', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-cli-'));
  const tpl = path.join(dir, 'index.html');
  fs.writeFileSync(tpl, '<div class="flex"></div>', 'utf8');

  const safelist = path.join(dir, 'safelist.txt');
  fs.writeFileSync(safelist, 'p-16\ngrid\n', 'utf8');

  const out      = path.join(dir, 'out.css');
  const manifest = path.join(dir, 'dopamine.manifest.json');

  execFileSync('node', [CLI, dir, '--ext', 'html', '--out', out, '--classes', safelist, '--manifest', manifest, '--no-header', '--no-reset'], { stdio: 'pipe' });

  const parsed = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const byName = Object.fromEntries(parsed.classes.map(c => [c.name, c.count]));

  assert.equal(byName['flex'], 1);
  assert.equal(byName['p-16'], 0);
  assert.equal(byName['grid'], 0);
});
