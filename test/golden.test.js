'use strict';

/**
 * Golden-file integration test.
 *
 * Compiles a comprehensive fixture (templates + classes file) through the CLI
 * and compares the three outputs byte-for-byte against committed expected files:
 *
 *   - test/fixtures/golden.expected.scss           (compiled classes)
 *   - test/fixtures/golden.expected.functions.scss (Sass functions file)
 *   - test/fixtures/golden.expected.diagnostics.txt (ANSI-stripped stderr)
 *
 * When the fixture is intentionally changed, or production code that affects
 * output is intentionally changed, run:
 *
 *   UPDATE_GOLDEN=1 npm test
 *
 * …to regenerate the expected files. Commit the code change AND the refreshed
 * fixtures together so reviewers can see exactly what user-visible output changed.
 */

const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('fs');
const os     = require('os');
const path   = require('path');
const { spawnSync } = require('child_process');

const CLI          = path.join(__dirname, '..', 'bin', 'dopamine.js');
const FIXTURE_DIR  = path.join(__dirname, 'fixtures');
const INPUT_HTML   = path.join(FIXTURE_DIR, 'golden.html');   // existence guard only
const CLASSES_TXT  = path.join(FIXTURE_DIR, 'golden.classes.txt');
const CONFIG_JSON  = path.join(FIXTURE_DIR, 'golden.config.json');

const EXPECTED_SCSS        = path.join(FIXTURE_DIR, 'golden.expected.scss');
const EXPECTED_FN_SCSS     = path.join(FIXTURE_DIR, 'golden.expected.functions.scss');
const EXPECTED_DIAGNOSTICS = path.join(FIXTURE_DIR, 'golden.expected.diagnostics.txt');

const UPDATE = process.env.UPDATE_GOLDEN === '1';

// Strip ANSI SGR codes (colors/styles) so the diagnostic snapshot stays terminal-agnostic.
function stripAnsi(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

// Keep the test's own sanity check short and obvious if a fixture is missing.
function requireFixture(p) {
  if (!fs.existsSync(p)) throw new Error(`Missing fixture: ${p}`);
}

test('golden snapshot — compiled SCSS, Sass functions, and diagnostics match committed fixtures', () => {
  requireFixture(INPUT_HTML);
  requireFixture(CLASSES_TXT);
  requireFixture(CONFIG_JSON);

  const tmpdir  = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-golden-'));
  const outScss = path.join(tmpdir, 'dopamine.scss');
  const outFn   = path.join(tmpdir, '_dopamine-functions.scss');

  const result = spawnSync('node', [
    CLI,
    FIXTURE_DIR,
    '--ext', 'html',
    '--config', CONFIG_JSON,
    '--classes', CLASSES_TXT,
    '--out', outScss,
    '--no-header',
    '--no-reset',
  ], { encoding: 'utf8' });

  assert.equal(
    result.status, 0,
    `CLI exited with status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );

  const actualScss   = fs.readFileSync(outScss, 'utf8');
  const actualFnScss = fs.readFileSync(outFn,   'utf8');
  // The diagnostic warning block is the only thing the CLI writes to stderr
  // under this invocation. Strip ANSI, normalize trailing whitespace.
  const actualDiag   = stripAnsi(result.stderr).replace(/\s+$/, '') + '\n';

  if (UPDATE) {
    fs.writeFileSync(EXPECTED_SCSS,        actualScss,   'utf8');
    fs.writeFileSync(EXPECTED_FN_SCSS,     actualFnScss, 'utf8');
    fs.writeFileSync(EXPECTED_DIAGNOSTICS, actualDiag,   'utf8');
    // node:test uses console warnings sparingly — this is fine for dev feedback.
    console.warn('UPDATE_GOLDEN=1 — wrote refreshed expected fixtures:');
    console.warn(`  ${path.relative(process.cwd(), EXPECTED_SCSS)}`);
    console.warn(`  ${path.relative(process.cwd(), EXPECTED_FN_SCSS)}`);
    console.warn(`  ${path.relative(process.cwd(), EXPECTED_DIAGNOSTICS)}`);
    return;
  }

  requireFixture(EXPECTED_SCSS);
  requireFixture(EXPECTED_FN_SCSS);
  requireFixture(EXPECTED_DIAGNOSTICS);

  const expectedScss   = fs.readFileSync(EXPECTED_SCSS,        'utf8');
  const expectedFnScss = fs.readFileSync(EXPECTED_FN_SCSS,     'utf8');
  const expectedDiag   = fs.readFileSync(EXPECTED_DIAGNOSTICS, 'utf8');

  assert.equal(
    actualScss, expectedScss,
    'Generated SCSS does not match golden.expected.scss. If the change was intentional, run:\n  UPDATE_GOLDEN=1 npm test'
  );
  assert.equal(
    actualFnScss, expectedFnScss,
    'Generated _dopamine-functions.scss does not match golden.expected.functions.scss.'
  );
  assert.equal(
    actualDiag, expectedDiag,
    'CLI diagnostic output does not match golden.expected.diagnostics.txt.'
  );
});
