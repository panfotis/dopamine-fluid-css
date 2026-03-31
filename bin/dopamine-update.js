#!/usr/bin/env node

'use strict';

const { execSync } = require('child_process');

console.log('\x1b[36m◆\x1b[0m Updating dopamine-fluid from GitHub...');

try {
  execSync('rm -rf node_modules/dopamine-fluid package-lock.json && npm install', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('\x1b[32m✔\x1b[0m dopamine-fluid updated successfully.');
} catch {
  console.error('\x1b[31m✖\x1b[0m Update failed.');
  process.exit(1);
}
