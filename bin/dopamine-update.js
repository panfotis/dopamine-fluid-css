#!/usr/bin/env node

'use strict';

const { buildUpdateMessage } = require('../lib/update-message');

console.log(buildUpdateMessage());
