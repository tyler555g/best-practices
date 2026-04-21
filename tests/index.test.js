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

test('domains.js normalizeConfig always includes ALWAYS_INSTALLED', () => {
  const { normalizeConfig, ALWAYS_INSTALLED } = require('../scripts/domains');
  const result = normalizeConfig({ selectedDomains: [] });
  for (const id of ALWAYS_INSTALLED) {
    assert.ok(result.selectedDomains.includes(id), `normalizeConfig should always include ${id}`);
  }
});

test('domains.js normalizeConfig deduplicates entries', () => {
  const { normalizeConfig } = require('../scripts/domains');
  const result = normalizeConfig({ selectedDomains: ['technology_and_information', 'technology_and_information'] });
  const count = result.selectedDomains.filter(id => id === 'technology_and_information').length;
  assert.equal(count, 1, 'normalizeConfig should deduplicate selectedDomains');
});

test('domains.js normalizeConfig filters unknown domain IDs', () => {
  const { normalizeConfig } = require('../scripts/domains');
  const result = normalizeConfig({ selectedDomains: ['not_a_real_domain', 'technology_and_information'] });
  assert.ok(!result.selectedDomains.includes('not_a_real_domain'), 'normalizeConfig should remove unknown domain IDs');
});

test('domains.js normalizeConfig handles missing or malformed config', () => {
  const { normalizeConfig, ALWAYS_INSTALLED } = require('../scripts/domains');
  for (const bad of [null, undefined, {}, { selectedDomains: null }, { selectedDomains: 'bad' }]) {
    const result = normalizeConfig(bad);
    assert.ok(Array.isArray(result.selectedDomains), 'normalizeConfig should always return an array');
    for (const id of ALWAYS_INSTALLED) {
      assert.ok(result.selectedDomains.includes(id), `normalizeConfig should include ${id} for input: ${JSON.stringify(bad)}`);
    }
  }
});

test('domains.js pruneDomains removes deselected domain folders', () => {
  const os = require('os');
  const { pruneDomains, ALWAYS_INSTALLED } = require('../scripts/domains');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bp-test-'));
  const fakeTarget = path.join(tmp, 'best-practices');

  // Create a fake domain folder that should be pruned
  const fakeDomain = path.join(fakeTarget, 'sciences');
  fs.mkdirSync(fakeDomain, { recursive: true });
  fs.writeFileSync(path.join(fakeDomain, 'test.md'), '# test');

  // Only keep ALWAYS_INSTALLED — sciences should be pruned
  pruneDomains(ALWAYS_INSTALLED, [fakeTarget]);
  assert.ok(!fs.existsSync(fakeDomain), 'pruneDomains should remove deselected domain folder');

  fs.rmSync(tmp, { recursive: true, force: true });
});

test('domains.js pruneDomains never removes ALWAYS_INSTALLED domains', () => {
  const os = require('os');
  const { pruneDomains, ALWAYS_INSTALLED } = require('../scripts/domains');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bp-test-'));
  const fakeTarget = path.join(tmp, 'best-practices');

  // Create a folder for an always-installed domain
  const alwaysDomain = path.join(fakeTarget, ALWAYS_INSTALLED[0]);
  fs.mkdirSync(alwaysDomain, { recursive: true });
  fs.writeFileSync(path.join(alwaysDomain, 'test.md'), '# test');

  // Try to prune with empty selection — always-installed should survive
  pruneDomains([], [fakeTarget]);
  assert.ok(fs.existsSync(alwaysDomain), 'pruneDomains should never remove ALWAYS_INSTALLED domains');

  fs.rmSync(tmp, { recursive: true, force: true });
});

test('postinstall prompt is suppressed when CI=true', () => {
  // Verify IS_CI guard by checking the source contains the guard pattern
  const postinstall = path.join(__dirname, '..', 'scripts', 'postinstall.js');
  const content = fs.readFileSync(postinstall, 'utf8');
  assert.ok(content.includes('IS_CI') && content.includes('process.stdin.isTTY'),
    'postinstall domain prompt must be gated on !IS_CI && process.stdin.isTTY');
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

test('bin/best-practices.js parses and runs without error', () => {
  const { execFileSync } = require('child_process');
  const binPath = path.join(__dirname, '..', 'bin', 'best-practices.js');
  const output = execFileSync(process.execPath, [binPath], { encoding: 'utf8' });
  assert.ok(output.includes('Usage:'), 'CLI should print usage instructions');
});
