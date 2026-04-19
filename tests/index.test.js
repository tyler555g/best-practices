// Tests for @tyler.given/best-practices
// Uses Node.js built-in test runner (node --test).
// See: https://nodejs.org/docs/latest-v22.x/api/test.html

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const CONTENT_ROOT = path.dirname(require.resolve('@tyler.given/best-practices-content/package.json'));

test('content package resolves correctly', () => {
  assert.ok(fs.existsSync(CONTENT_ROOT), `Content root not found: ${CONTENT_ROOT}`);
});

test('SKILL.md exists in content package', () => {
  const skillMd = path.join(CONTENT_ROOT, 'SKILL.md');
  assert.ok(fs.existsSync(skillMd), 'SKILL.md missing from content package');
});

test('categories.md exists in content package', () => {
  const categoriesMd = path.join(CONTENT_ROOT, 'categories.md');
  assert.ok(fs.existsSync(categoriesMd), 'categories.md missing from content package');
});

test('ai-human-interaction-defaults.md exists in content package', () => {
  const defaults = path.join(
    CONTENT_ROOT,
    'technology_and_information',
    'data_science_and_ai',
    'ai-human-interaction-defaults.md'
  );
  assert.ok(fs.existsSync(defaults), 'ai-human-interaction-defaults.md missing');
});

test('ai-human-interaction-defaults.md contains all 10 rules', () => {
  const defaults = path.join(
    CONTENT_ROOT,
    'technology_and_information',
    'data_science_and_ai',
    'ai-human-interaction-defaults.md'
  );
  const content = fs.readFileSync(defaults, 'utf8');
  for (let i = 1; i <= 10; i++) {
    assert.ok(content.includes(`## ${i}.`), `Rule ${i} missing from ai-human-interaction-defaults.md`);
  }
});

test('postinstall.js does not hardcode AI defaults block', () => {
  const postinstall = path.join(__dirname, '..', 'scripts', 'postinstall.js');
  const content = fs.readFileSync(postinstall, 'utf8');
  assert.ok(!content.includes('## 1. Human Authority\n\nThe human is the boss'), 
    'postinstall.js should not contain hardcoded AI defaults — use buildDefaultsBlock()');
});

test('all package.json files have publishConfig.access = public', () => {
  const pkgFiles = [
    path.join(__dirname, '..', 'package.json'),
    path.join(__dirname, '..', 'packages', 'config', 'package.json'),
    path.join(__dirname, '..', 'packages', 'content', 'package.json'),
  ];
  for (const pkgFile of pkgFiles) {
    const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
    assert.equal(pkg.publishConfig?.access, 'public',
      `${pkgFile} missing publishConfig.access = "public"`);
  }
});

test('all package.json files have engines.node >= 22', () => {
  const pkgFiles = [
    path.join(__dirname, '..', 'package.json'),
    path.join(__dirname, '..', 'packages', 'config', 'package.json'),
    path.join(__dirname, '..', 'packages', 'content', 'package.json'),
  ];
  for (const pkgFile of pkgFiles) {
    const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
    assert.ok(pkg.engines?.node?.includes('22'),
      `${pkgFile} should have engines.node >=22`);
  }
});
