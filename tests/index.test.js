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

// --- CONTEXT ARTIFACT CI TESTS ---

test('SKILL.md references all content files in subdirectories', () => {
  const skillMd = path.join(CONTENT_ROOT, 'SKILL.md');
  const skillContent = fs.readFileSync(skillMd, 'utf8');
  
  // Find all .md files in subdirectories of CONTENT_ROOT (not root-level files)
  const contentDirs = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'node_modules');
  
  const missingFiles = [];
  for (const dir of contentDirs) {
    const walkDir = (dirPath) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.name.endsWith('.md')) {
          // Match on relative path (e.g. "information_technology/git-workflow.md")
          // to avoid false positives from filename-only matches in prose.
          const relativePath = path.relative(CONTENT_ROOT, fullPath).replace(/\\/g, '/');
          if (!skillContent.includes(relativePath)) {
            missingFiles.push(relativePath);
          }
        }
      }
    };
    walkDir(path.join(CONTENT_ROOT, dir.name));
  }
  
  assert.deepStrictEqual(missingFiles, [],
    `SKILL.md is missing references to: ${missingFiles.join(', ')}`);
});

test('context instruction files exist and are non-empty', () => {
  const repoRoot = path.join(__dirname, '..');
  const files = [
    '.github/copilot-instructions.md',
    '.github/instructions/content.instructions.md',
    '.github/instructions/code.instructions.md',
  ];
  for (const file of files) {
    const filePath = path.join(repoRoot, file);
    assert.ok(fs.existsSync(filePath), `Missing context file: ${file}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const meaningful = content.trim().length;
    assert.ok(meaningful > 50, `Context file is too small: ${file} (${meaningful} chars)`);
  }
});

test('scoped instruction files have valid applyTo frontmatter', () => {
  const repoRoot = path.join(__dirname, '..');
  const instructionFiles = [
    '.github/instructions/content.instructions.md',
    '.github/instructions/code.instructions.md',
  ];
  for (const file of instructionFiles) {
    const filePath = path.join(repoRoot, file);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.match(content, /^---\n/, `${file} missing YAML frontmatter`);
    assert.match(content, /applyTo:\s*".+"/, `${file} missing applyTo in frontmatter`);
  }
});

test('agents/ directory is included in content package files', () => {
  const contentPkg = JSON.parse(fs.readFileSync(path.join(CONTENT_ROOT, 'package.json'), 'utf8'));
  assert.ok(contentPkg.files.includes('agents/'),
    'packages/content/package.json files array must include agents/');
});

test('shipped agent docs only reference shipped files', () => {
  const agentsDir = path.join(CONTENT_ROOT, 'agents');
  if (!fs.existsSync(agentsDir)) return;
  
  // Patterns that indicate a reference to a repo-only file (not a glob pattern for matching)
  const repoOnlyRefs = [
    { pattern: /\b(?:see|load|read|reference)\s+.*?\.github\/instructions\//i, label: '.github/instructions/ file reference' },
    { pattern: /\bcontent\.instructions\.md\b/, label: 'content.instructions.md (repo-only)' },
    { pattern: /\bcode\.instructions\.md\b/, label: 'code.instructions.md (repo-only)' },
  ];
  
  for (const file of fs.readdirSync(agentsDir)) {
    if (!file.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(agentsDir, file), 'utf8');
    for (const { pattern, label } of repoOnlyRefs) {
      assert.ok(!pattern.test(content),
        `agents/${file} references repo-only artifact: ${label} — shipped agent docs must only reference shipped files`);
    }
  }
});

test('postinstall copies agents/ directory', () => {
  const postinstall = path.join(__dirname, '..', 'scripts', 'postinstall.js');
  const content = fs.readFileSync(postinstall, 'utf8');
  assert.ok(content.includes("'agents'"),
    'postinstall.js CONTENT_DIRS must include agents for shipping agent docs');
});

test('agent docs only reference existing SKILL.md sections', () => {
  const skillContent = fs.readFileSync(path.join(CONTENT_ROOT, 'SKILL.md'), 'utf8');
  const sectionHeadings = [...skillContent.matchAll(/^## (.+)$/gm)].map(m => m[1].trim());
  
  const agentsDir = path.join(CONTENT_ROOT, 'agents');
  if (!fs.existsSync(agentsDir)) return;
  
  for (const file of fs.readdirSync(agentsDir)) {
    if (!file.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(agentsDir, file), 'utf8');
    // Match references like "SKILL.md §Section Name"
    const refs = [...content.matchAll(/SKILL\.md\s+§([^|§\n]+)/g)];
    for (const ref of refs) {
      const sectionName = ref[1].trim().replace(/\s*\+\s*$/, '');
      assert.ok(sectionHeadings.includes(sectionName),
        `agents/${file} references non-existent SKILL.md section "§${sectionName}". Available: ${sectionHeadings.join(', ')}`);
    }
  }
});
