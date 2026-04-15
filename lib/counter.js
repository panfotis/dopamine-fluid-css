'use strict';

const { readFile } = require('./scanner');
const { extractClassCounts } = require('./parser');

function collectClassCounts(filePaths) {
  const totals = new Map();

  for (const filePath of filePaths) {
    const content = readFile(filePath);
    if (!content) continue;

    for (const [name, count] of extractClassCounts(content)) {
      totals.set(name, (totals.get(name) || 0) + count);
    }
  }

  return totals;
}

module.exports = { collectClassCounts };
