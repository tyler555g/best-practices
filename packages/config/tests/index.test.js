// Tests for @tyler.given/best-practices-config
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const PKG_ROOT = path.join(__dirname, '..');
const CONTENT_ROOT = path.dirname(require.resolve('@tyler.given/best-practices-content/package.json'));

test('bin/setup.js exists', () => {
  assert.ok(fs.existsSync(path.join(PKG_ROOT, 'bin', 'setup.js')));
});

test('bin/setup.js is executable (has shebang)', () => {
  const content = fs.readFileSync(path.join(PKG_ROOT, 'bin', 'setup.js'), 'utf8');
  assert.ok(content.startsWith('#!/usr/bin/env node'), 'setup.js should have a Node shebang');
});

test('package.json is valid JSON with required fields', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));
  assert.ok(pkg.name, 'missing name');
  assert.ok(pkg.version, 'missing version');
  assert.equal(pkg.publishConfig?.access, 'public', 'missing publishConfig.access = public');
});

test('content package resolves from config package', () => {
  assert.ok(fs.existsSync(CONTENT_ROOT), `Content root not found: ${CONTENT_ROOT}`);
});

test('agents directory accessible via content package', () => {
  assert.ok(fs.existsSync(path.join(CONTENT_ROOT, 'agents')), 'agents/ directory missing from content package');
});

test('SKILL.md accessible via content package', () => {
  assert.ok(fs.existsSync(path.join(CONTENT_ROOT, 'SKILL.md')));
});
