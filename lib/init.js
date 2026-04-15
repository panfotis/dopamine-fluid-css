'use strict';

const fs = require('fs');
const path = require('path');

const STARTER_FILES = [
  'dopamine.config.json',
  'safelist.txt',
  'scss/main.scss',
  'scss/custom/README.md',
  'templates/index.html',
];

const STARTER_DIRS = [
  'scss/custom',
];

const RECOMMENDED_SCRIPTS = {
  dopamine: 'dopamine',
  sass: 'sass scss/main.scss:css/main.css scss/custom:css/custom --no-source-map',
  build: 'npm run dopamine && npm run sass',
  dev: 'concurrently "npm run dopamine -- --watch" "npm run sass -- --watch" "browser-sync start --server . --files \'css/**/*.css\' \'templates/**/*.html\' --startPath templates/index.html --no-notify"',
};

function getStarterRoot() {
  return path.resolve(__dirname, '../starter');
}

function getRecommendedScripts() {
  return { ...RECOMMENDED_SCRIPTS };
}

function scaffoldProject(target = '.', options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const force = Boolean(options.force);
  const dryRun = Boolean(options.dryRun);
  const targetDir = path.resolve(cwd, target);
  const starterRoot = options.starterRoot ?? getStarterRoot();
  const starterFiles = loadStarterFiles(starterRoot);
  const plan = planStarterWrites(targetDir, starterFiles, force);

  if (plan.conflicts.length > 0) {
    const err = new Error(`Starter files already exist and differ: ${plan.conflicts.join(', ')}`);
    err.code = 'INIT_CONFLICT';
    err.conflicts = plan.conflicts;
    throw err;
  }

  if (!dryRun) {
    fs.mkdirSync(targetDir, { recursive: true });
    for (const dirPath of plan.directories) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    for (const op of plan.fileOps) {
      fs.writeFileSync(op.destPath, op.content, 'utf8');
    }
  }

  const packageJson = updatePackageJsonScripts(targetDir, { dryRun });

  return {
    targetDir,
    dryRun,
    files: {
      written: plan.fileOps.filter(op => op.type === 'write').map(op => op.relativePath),
      overwritten: plan.fileOps.filter(op => op.type === 'overwrite').map(op => op.relativePath),
      skipped: plan.skipped,
    },
    packageJson,
  };
}

function buildInitMessage(result, options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const lines = [];
  const targetLabel = path.relative(cwd, result.targetDir) || '.';

  lines.push(`\x1b[32m✔\x1b[0m  Dopamine starter ${result.dryRun ? 'previewed' : 'created'} in ${targetLabel}`);

  if (result.files.written.length > 0) {
    lines.push(`  Added files         ${result.files.written.join(', ')}`);
  }
  if (result.files.overwritten.length > 0) {
    lines.push(`  Overwritten files   ${result.files.overwritten.join(', ')}`);
  }
  if (result.files.skipped.length > 0) {
    lines.push(`  Unchanged files     ${result.files.skipped.join(', ')}`);
  }

  if (result.packageJson.path) {
    if (result.packageJson.parseError) {
      lines.push(`  \x1b[33m⚠\x1b[0m package.json not updated: ${result.packageJson.parseError}`);
    } else {
      if (result.packageJson.addedScripts.length > 0) {
        lines.push(`  Added scripts       ${result.packageJson.addedScripts.join(', ')}`);
      }
      if (result.packageJson.preservedScripts.length > 0) {
        lines.push(`  Kept scripts        ${result.packageJson.preservedScripts.join(', ')}`);
      }
    }
  }

  lines.push('');
  lines.push('Next steps:');
  lines.push('1. Install the starter toolchain if it is not already in your project: `npm install --save-dev sass concurrently browser-sync`');

  if (result.packageJson.path && !result.packageJson.parseError) {
    if (result.packageJson.addedScripts.length > 0 || result.packageJson.alreadyPresentScripts.length > 0) {
      lines.push('2. Run `npm run build` for a one-time build or `npm run dev` for watch + live reload');
      lines.push('3. Edit `templates/index.html` and `scss/main.scss` in your project');
    } else {
      lines.push('2. Add the recommended Dopamine scripts to your `package.json`');
      lines.push('3. Run `npx dopamine --watch`, `npx sass scss/main.scss:css/main.css scss/custom:css/custom --no-source-map --watch`, and BrowserSync or add the recommended scripts');
    }
  } else {
    lines.push('2. Add the recommended Dopamine scripts to your `package.json`');
    lines.push('3. Run `npx dopamine --watch`, `npx sass scss/main.scss:css/main.css scss/custom:css/custom --no-source-map --watch`, and BrowserSync or add the recommended scripts');
  }

  lines.push('');
  lines.push('Recommended `package.json` scripts:');
  lines.push(JSON.stringify({ scripts: getRecommendedScripts() }, null, 2));

  return lines.join('\n');
}

function loadStarterFiles(starterRoot) {
  return STARTER_FILES.map(relativePath => {
    const sourcePath = path.join(starterRoot, relativePath);
    return {
      relativePath,
      sourcePath,
      content: fs.readFileSync(sourcePath, 'utf8'),
    };
  });
}

function planStarterWrites(targetDir, starterFiles, force) {
  const directories = new Set(STARTER_DIRS.map(relativePath => path.join(targetDir, relativePath)));
  const fileOps = [];
  const skipped = [];
  const conflicts = [];

  for (const file of starterFiles) {
    const destPath = path.join(targetDir, file.relativePath);
    directories.add(path.dirname(destPath));

    if (!fs.existsSync(destPath)) {
      fileOps.push({ type: 'write', relativePath: file.relativePath, destPath, content: file.content });
      continue;
    }

    const stat = fs.statSync(destPath);
    if (!stat.isFile()) {
      conflicts.push(file.relativePath);
      continue;
    }

    const existing = fs.readFileSync(destPath, 'utf8');
    if (existing === file.content) {
      skipped.push(file.relativePath);
      continue;
    }

    if (!force) {
      conflicts.push(file.relativePath);
      continue;
    }

    fileOps.push({ type: 'overwrite', relativePath: file.relativePath, destPath, content: file.content });
  }

  return {
    directories: [...directories],
    fileOps,
    skipped,
    conflicts,
  };
}

function updatePackageJsonScripts(targetDir, options = {}) {
  const dryRun = Boolean(options.dryRun);
  const packageJsonPath = path.join(targetDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return {
      path: null,
      updated: false,
      addedScripts: [],
      alreadyPresentScripts: [],
      preservedScripts: [],
      parseError: null,
    };
  }

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (err) {
    return {
      path: packageJsonPath,
      updated: false,
      addedScripts: [],
      alreadyPresentScripts: [],
      preservedScripts: [],
      parseError: err.message,
    };
  }

  const scripts = pkg.scripts && typeof pkg.scripts === 'object' ? { ...pkg.scripts } : {};
  const addedScripts = [];
  const alreadyPresentScripts = [];
  const preservedScripts = [];

  for (const [name, command] of Object.entries(RECOMMENDED_SCRIPTS)) {
    if (!(name in scripts)) {
      scripts[name] = command;
      addedScripts.push(name);
      continue;
    }

    if (scripts[name] === command) {
      alreadyPresentScripts.push(name);
    } else {
      preservedScripts.push(name);
    }
  }

  if (addedScripts.length > 0 && !dryRun) {
    const nextPkg = { ...pkg, scripts };
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(nextPkg, null, 2)}\n`, 'utf8');
  }

  return {
    path: packageJsonPath,
    updated: addedScripts.length > 0,
    addedScripts,
    alreadyPresentScripts,
    preservedScripts,
    parseError: null,
  };
}

module.exports = {
  buildInitMessage,
  getRecommendedScripts,
  getStarterRoot,
  scaffoldProject,
};
