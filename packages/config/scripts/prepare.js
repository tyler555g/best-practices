#!/usr/bin/env node
// prepack: copies content directories from repo root into this package dir before npm publish.
// The copied directories are .gitignored so they don't live in the git tree.

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const PKG_DIR = path.join(__dirname, '..');

const COPY_FILES = ['SKILL.md', 'README.md', 'categories.md'];
const COPY_DIRS = ['technology_and_information'];

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠️  Source not found, skipping: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Preparing @tyler555g/best-practices-config for publish...\n');

for (const file of COPY_FILES) {
  const src = path.join(REPO_ROOT, file);
  const dest = path.join(PKG_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${file}`);
  }
}

for (const dir of COPY_DIRS) {
  const src = path.join(REPO_ROOT, dir);
  const dest = path.join(PKG_DIR, dir);
  copyDirSync(src, dest);
  console.log(`  Copied: ${dir}/`);
}

console.log('\n✅ Package prepared for publish.');
