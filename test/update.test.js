'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildUpdateMessage } = require('../lib/update-message');

test('prints safe package-manager update guidance', () => {
  const message = buildUpdateMessage();

  assert.match(message, /package manager/i);
  assert.match(message, /npm install --save-dev dopamine-fluid@latest/);
  assert.match(message, /npm update dopamine-fluid/);
});
