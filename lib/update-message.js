'use strict';

function buildUpdateMessage(packageName = 'dopamine-fluid') {
  return [
    `\x1b[36m◆\x1b[0m ${packageName} is updated through your package manager.`,
    '',
    'Local project dependency:',
    `  npm install --save-dev ${packageName}@latest`,
    `  pnpm add -D ${packageName}@latest`,
    `  yarn add --dev ${packageName}@latest`,
    '',
    'Global install:',
    `  npm install -g ${packageName}@latest`,
    `  pnpm add -g ${packageName}@latest`,
    '',
    'If the package is already installed in a project, you can also run:',
    `  npm update ${packageName}`,
  ].join('\n');
}

module.exports = { buildUpdateMessage };
