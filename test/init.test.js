'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { scaffoldProject, getRecommendedScripts } = require('../lib/init');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-init-'));
}

test('scaffoldProject writes starter files and adds missing package scripts', () => {
  const projectDir = makeTempDir();

  try {
    fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({ name: 'demo' }, null, 2));

    const result = scaffoldProject('.', { cwd: projectDir });
    const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'));

    assert.equal(result.files.written.includes('dopamine.config.json'), true);
    assert.equal(result.files.written.includes('scss/main.scss'), true);
    assert.equal(fs.existsSync(path.join(projectDir, 'templates', 'index.html')), true);
    assert.equal(fs.existsSync(path.join(projectDir, 'scss', 'custom')), true);
    assert.deepEqual(pkg.scripts, getRecommendedScripts());
    assert.deepEqual(result.packageJson.addedScripts, ['dopamine', 'sass', 'build', 'dev']);
  } finally {
    fs.rmSync(projectDir, { recursive: true, force: true });
  }
});

test('scaffoldProject preserves existing package scripts', () => {
  const projectDir = makeTempDir();

  try {
    fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({
      name: 'demo',
      scripts: {
        build: 'vite build',
      },
    }, null, 2));

    const result = scaffoldProject('.', { cwd: projectDir });
    const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'));

    assert.equal(pkg.scripts.build, 'vite build');
    assert.equal(pkg.scripts.dopamine, getRecommendedScripts().dopamine);
    assert.equal(pkg.scripts.sass, getRecommendedScripts().sass);
    assert.deepEqual(result.packageJson.addedScripts, ['dopamine', 'sass', 'dev']);
    assert.deepEqual(result.packageJson.preservedScripts, ['build']);
  } finally {
    fs.rmSync(projectDir, { recursive: true, force: true });
  }
});

test('scaffoldProject reports conflicting starter files unless force is used', () => {
  const projectDir = makeTempDir();

  try {
    fs.writeFileSync(path.join(projectDir, 'dopamine.config.json'), '{ "input": "./src" }\n');

    assert.throws(
      () => scaffoldProject('.', { cwd: projectDir }),
      err => err && err.code === 'INIT_CONFLICT' && err.conflicts.includes('dopamine.config.json')
    );

    const result = scaffoldProject('.', { cwd: projectDir, force: true });
    const overwritten = fs.readFileSync(path.join(projectDir, 'dopamine.config.json'), 'utf8');

    assert.equal(result.files.overwritten.includes('dopamine.config.json'), true);
    assert.match(overwritten, /viewport/);
  } finally {
    fs.rmSync(projectDir, { recursive: true, force: true });
  }
});

test('scaffoldProject keeps existing templates/index.html and still writes the rest', () => {
  const projectDir = makeTempDir();

  try {
    fs.mkdirSync(path.join(projectDir, 'templates'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'templates', 'index.html'), '<p>my own page</p>\n');

    const result = scaffoldProject('.', { cwd: projectDir });

    assert.deepEqual(result.files.keptExisting, ['templates/index.html']);
    assert.equal(result.files.written.includes('dopamine.config.json'), true);
    assert.equal(result.files.written.includes('scss/main.scss'), true);

    const templateOnDisk = fs.readFileSync(path.join(projectDir, 'templates', 'index.html'), 'utf8');
    assert.equal(templateOnDisk, '<p>my own page</p>\n');
  } finally {
    fs.rmSync(projectDir, { recursive: true, force: true });
  }
});

test('scaffoldProject supports dry-run mode', () => {
  const projectDir = makeTempDir();

  try {
    const result = scaffoldProject('.', { cwd: projectDir, dryRun: true });

    assert.equal(result.dryRun, true);
    assert.equal(fs.existsSync(path.join(projectDir, 'templates', 'index.html')), false);
    assert.equal(result.files.written.includes('templates/index.html'), true);
  } finally {
    fs.rmSync(projectDir, { recursive: true, force: true });
  }
});
