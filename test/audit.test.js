'use strict';

const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('fs');
const os     = require('os');
const path   = require('path');
const { execFileSync } = require('child_process');

const AUDIT = path.join(__dirname, '..', 'bin', 'dopamine-audit.js');

test('audit flags duplicate spellings (aliases producing identical CSS)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-audit-'));
  fs.writeFileSync(path.join(dir, 'index.html'), `
    <div class="cols-1.3 cols-1.3 cols-1:3"></div>
    <div class="text-md-center text-md-center text-center-md"></div>
    <div class="span-2 colspan-2"></div>
    <div class="fs-16 p-24-48"></div>
  `, 'utf8');

  const stdout = execFileSync('node', [AUDIT, dir, '--ext', 'html'], {
    stdio: 'pipe', cwd: dir,
  }).toString();

  assert.match(stdout, /Duplicate Spellings/);
  // Most-used spelling wins the "keep" slot
  assert.match(stdout, /keep `cols-1\.3` \(2 uses\).*same CSS: `cols-1:3` \(1 uses\)/);
  assert.match(stdout, /keep `text-md-center` \(2 uses\) @ md .*same CSS: `text-center-md` \(1 uses\)/);
  assert.match(stdout, /keep `span-2` .*`colspan-2`/);
  // Non-duplicates stay out of the section
  assert.ok(!/same CSS:.*fs-16/.test(stdout));
  assert.ok(!/same CSS:.*p-24-48/.test(stdout));
});

test('audit reports no duplicate spellings when there are none', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dopamine-audit-'));
  fs.writeFileSync(path.join(dir, 'index.html'),
    '<div class="fs-16 p-24-48 flex"></div>', 'utf8');

  const stdout = execFileSync('node', [AUDIT, dir, '--ext', 'html'], {
    stdio: 'pipe', cwd: dir,
  }).toString();

  assert.match(stdout, /No duplicate spellings found/);
});
