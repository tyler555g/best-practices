// Tests for conflict detection in scripts/postinstall.js
// Uses Node.js built-in test runner (node --test).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  hashContent,
  readManifest,
  writeManifest,
  defaultConflictPrompt,
  installStandaloneFile,
} = require('../scripts/postinstall');

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeTmp(dir, name, content) {
  const filePath = path.join(dir, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

// ── hashContent ─────────────────────────────────────────────────────────────

test('hashContent returns a consistent hex sha256 string', () => {
  const h = hashContent('hello world');
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(h, hashContent('hello world'));
});

test('hashContent produces different hashes for different content', () => {
  assert.notEqual(hashContent('a'), hashContent('b'));
});

// ── readManifest / writeManifest ─────────────────────────────────────────────

test('readManifest returns empty files for missing manifest', () => {
  const dir = makeTempDir('bp-manifest-missing-');
  const manifest = readManifest(dir);
  assert.deepEqual(manifest.files, {});
});

test('readManifest returns empty files for malformed JSON', () => {
  const dir = makeTempDir('bp-manifest-bad-json-');
  fs.writeFileSync(path.join(dir, '.install-manifest.json'), '{ not valid json', 'utf8');
  const manifest = readManifest(dir);
  assert.deepEqual(manifest.files, {});
});

test('readManifest coerces files: null to empty object', () => {
  const dir = makeTempDir('bp-manifest-null-');
  fs.writeFileSync(
    path.join(dir, '.install-manifest.json'),
    JSON.stringify({ packageName: '@tyler.given/best-practices', files: null }),
    'utf8',
  );
  const manifest = readManifest(dir);
  assert.deepEqual(manifest.files, {});
});

test('writeManifest creates the manifest file and readManifest reads it back', () => {
  const dir = makeTempDir('bp-manifest-roundtrip-');
  const m = { packageName: '@tyler.given/best-practices', packageVersion: '0.1.0', files: { 'SKILL.md': { upstream: 'abc', disk: 'def' } } };
  writeManifest(dir, m);
  const result = readManifest(dir);
  assert.equal(result.packageName, m.packageName);
  assert.deepEqual(result.files['SKILL.md'], m.files['SKILL.md']);
});

// ── defaultConflictPrompt (non-TTY) ─────────────────────────────────────────

test('defaultConflictPrompt returns keep for all conflict types in non-TTY', async () => {
  // process.stdout.isTTY is undefined in test runner
  assert.equal(await defaultConflictPrompt('SKILL.md', 'conflict', {}), 'keep');
  assert.equal(await defaultConflictPrompt('SKILL.md', 'user-added', {}), 'keep');
  assert.equal(await defaultConflictPrompt('SKILL.md', 'upstream-deleted', {}), 'keep');
});

// ── installStandaloneFile — Case A ───────────────────────────────────────────

test('Case A: installs new file silently when dest does not exist', async () => {
  const srcDir = makeTempDir('bp-src-');
  const dstDir = makeTempDir('bp-dst-');
  const srcPath = writeTmp(srcDir, 'SKILL.md', '# content\n');
  const destPath = path.join(dstDir, 'SKILL.md');

  const { action, newEntry } = await installStandaloneFile(srcPath, destPath, {});
  assert.equal(action, 'copied');
  assert.equal(fs.readFileSync(destPath, 'utf8'), '# content\n');
  assert.equal(newEntry.upstream, hashContent('# content\n'));
  assert.equal(newEntry.disk, newEntry.upstream);
});

// ── installStandaloneFile — Case B ───────────────────────────────────────────

test('Case B: no-op when dest is identical to source', async () => {
  const srcDir = makeTempDir('bp-src-');
  const dstDir = makeTempDir('bp-dst-');
  const content = '# same content\n';
  const srcPath = writeTmp(srcDir, 'SKILL.md', content);
  const destPath = writeTmp(dstDir, 'SKILL.md', content);
  const mtime = fs.statSync(destPath).mtimeMs;

  const { action } = await installStandaloneFile(srcPath, destPath, {});
  assert.equal(action, 'skipped');
  assert.equal(fs.statSync(destPath).mtimeMs, mtime, 'file should not be touched');
});

// ── installStandaloneFile — forceReplace ────────────────────────────────────

test('forceReplace overwrites even when user has modified the file', async () => {
  const srcDir = makeTempDir('bp-src-');
  const dstDir = makeTempDir('bp-dst-');
  const pkgContent = '# package version\n';
  const userContent = '# user modified\n';
  const srcPath = writeTmp(srcDir, 'README.md', pkgContent);
  const destPath = writeTmp(dstDir, 'README.md', userContent);

  // Manifest reflects a clean install (disk === upstream === src), but the user has
  // since changed destPath — this is Case D (pkg unchanged, user modified).
  // forceReplace must override Case D and still overwrite the user's file.
  const manifestEntry = { upstream: hashContent(pkgContent), disk: hashContent(pkgContent) };

  const promptSpy = () => { throw new Error('prompt must not be called with forceReplace'); };
  const { action } = await installStandaloneFile(srcPath, destPath, {
    forceReplace: true,
    promptFn: promptSpy,
    manifestEntry,
  });
  assert.equal(action, 'replaced');
  assert.equal(fs.readFileSync(destPath, 'utf8'), pkgContent);
});

// ── installStandaloneFile — Case C ───────────────────────────────────────────

test('Case C: package updated, user unchanged — silently updates file', async () => {
  const srcDir = makeTempDir('bp-src-');
  const dstDir = makeTempDir('bp-dst-');
  const oldPkgContent = '# old package\n';
  const newPkgContent = '# new package\n';
  const srcPath = writeTmp(srcDir, 'SKILL.md', newPkgContent);
  const destPath = writeTmp(dstDir, 'SKILL.md', oldPkgContent);

  // Manifest says: upstream was old, disk is old (user hasn't touched it)
  const manifestEntry = {
    upstream: hashContent(oldPkgContent),
    disk: hashContent(oldPkgContent),
  };

  const promptSpy = () => { throw new Error('prompt must not be called in Case C'); };
  const { action } = await installStandaloneFile(srcPath, destPath, {
    promptFn: promptSpy,
    manifestEntry,
  });

  assert.equal(action, 'updated');
  assert.equal(fs.readFileSync(destPath, 'utf8'), newPkgContent);
});

// ── installStandaloneFile — Case D ───────────────────────────────────────────

test('Case D: package unchanged, user modified — silently preserves user version', async () => {
  const srcDir = makeTempDir('bp-src-');
  const dstDir = makeTempDir('bp-dst-');
  const pkgContent = '# package\n';
  const userContent = '# user modified\n';
  const srcPath = writeTmp(srcDir, 'SKILL.md', pkgContent);
  const destPath = writeTmp(dstDir, 'SKILL.md', userContent);

  const manifestEntry = {
    upstream: hashContent(pkgContent),
    disk: hashContent(pkgContent), // installed as pkg, user changed afterward
  };

  const promptSpy = () => { throw new Error('prompt must not be called in Case D'); };
  const { action, newEntry } = await installStandaloneFile(srcPath, destPath, {
    promptFn: promptSpy,
    manifestEntry,
  });

  assert.equal(action, 'preserved');
  assert.equal(fs.readFileSync(destPath, 'utf8'), userContent, 'user content must be preserved');
  assert.equal(newEntry.upstream, hashContent(pkgContent));
  assert.equal(newEntry.disk, hashContent(userContent));
});

test('Case D stability: preserved user version survives repeated installs without prompting', async () => {
  const srcDir = makeTempDir('bp-src-');
  const dstDir = makeTempDir('bp-dst-');
  const pkgContent = '# package\n';
  const userContent = '# user modified\n';
  const srcPath = writeTmp(srcDir, 'SKILL.md', pkgContent);
  const destPath = writeTmp(dstDir, 'SKILL.md', userContent);

  // Simulate state after first keep: disk recorded as user content
  const manifestEntry = {
    upstream: hashContent(pkgContent),
    disk: hashContent(userContent), // disk now records user's version
  };

  // Second install: existingHash === manifestEntry.disk, srcHash === manifestEntry.upstream
  // (This is the regression case — old code would fall to Case E here)
  const promptSpy = () => { throw new Error('prompt must not be called on stable kept version'); };
  const { action } = await installStandaloneFile(srcPath, destPath, {
    promptFn: promptSpy,
    manifestEntry,
  });

  assert.equal(action, 'preserved');
  assert.equal(fs.readFileSync(destPath, 'utf8'), userContent);
});

// ── installStandaloneFile — Case E ───────────────────────────────────────────

test('Case E keep: prompts and keeps user version on conflict', async () => {
  const srcDir = makeTempDir('bp-src-');
  const dstDir = makeTempDir('bp-dst-');
  const pkgContent = '# new package\n';
  const userContent = '# user modified\n';
  const srcPath = writeTmp(srcDir, 'SKILL.md', pkgContent);
  const destPath = writeTmp(dstDir, 'SKILL.md', userContent);

  // Both sides changed: corrupt manifest to show old hashes
  const manifestEntry = { upstream: 'old-upstream', disk: 'old-disk' };
  let prompted = false;
  const mockPrompt = async (_relPath, conflictType) => {
    assert.equal(conflictType, 'conflict');
    prompted = true;
    return 'keep';
  };

  const { action } = await installStandaloneFile(srcPath, destPath, {
    promptFn: mockPrompt,
    manifestEntry,
  });

  assert.ok(prompted);
  assert.equal(action, 'kept');
  assert.equal(fs.readFileSync(destPath, 'utf8'), userContent);
});

test('Case E replace: prompts and replaces with package version', async () => {
  const srcDir = makeTempDir('bp-src-');
  const dstDir = makeTempDir('bp-dst-');
  const pkgContent = '# new package\n';
  const srcPath = writeTmp(srcDir, 'SKILL.md', pkgContent);
  const destPath = writeTmp(dstDir, 'SKILL.md', '# user modified\n');
  const manifestEntry = { upstream: 'old', disk: 'old' };

  const { action } = await installStandaloneFile(srcPath, destPath, {
    promptFn: async () => 'replace',
    manifestEntry,
  });

  assert.equal(action, 'replaced');
  assert.equal(fs.readFileSync(destPath, 'utf8'), pkgContent);
});

test('Case E amend: prompts, creates .incoming file, preserves original', async () => {
  const srcDir = makeTempDir('bp-src-');
  const dstDir = makeTempDir('bp-dst-');
  const pkgContent = '# new package\n';
  const userContent = '# user modified\n';
  const srcPath = writeTmp(srcDir, 'SKILL.md', pkgContent);
  const destPath = writeTmp(dstDir, 'SKILL.md', userContent);
  const manifestEntry = { upstream: 'old', disk: 'old' };

  const { action } = await installStandaloneFile(srcPath, destPath, {
    promptFn: async () => 'amend',
    manifestEntry,
  });

  assert.equal(action, 'amended');
  assert.equal(fs.readFileSync(destPath, 'utf8'), userContent, 'original must be preserved');
  const incomingPath = destPath + '.incoming';
  assert.ok(fs.existsSync(incomingPath), '.incoming file must be created');
  assert.equal(fs.readFileSync(incomingPath, 'utf8'), pkgContent);
});

test('Case E (no manifest): conflicts without manifest entry prompt correctly', async () => {
  const srcDir = makeTempDir('bp-src-');
  const dstDir = makeTempDir('bp-dst-');
  const srcPath = writeTmp(srcDir, 'README.md', '# pkg\n');
  const destPath = writeTmp(dstDir, 'README.md', '# user\n');

  let prompted = false;
  const { action } = await installStandaloneFile(srcPath, destPath, {
    promptFn: async (_rp, ct) => { prompted = true; assert.equal(ct, 'conflict'); return 'keep'; },
    manifestEntry: null,
  });

  assert.ok(prompted, 'should prompt when no manifest entry and content differs');
  assert.equal(action, 'kept');
});

// ── skipped-no-src ───────────────────────────────────────────────────────────

test('returns skipped-no-src when source file does not exist', async () => {
  const dstDir = makeTempDir('bp-dst-');
  const { action, newEntry } = await installStandaloneFile(
    '/nonexistent/path/SKILL.md',
    path.join(dstDir, 'SKILL.md'),
    {},
  );
  assert.equal(action, 'skipped-no-src');
  assert.equal(newEntry, null);
});

// ── upstream-deleted standalone (Pass 2a) ────────────────────────────────────

test('Pass 2a: installStandaloneFile returns skipped-no-src + null entry for upstream-deleted files', async () => {
  // Verifies the contract main() relies on for Pass 2a:
  // When the source file is gone (upstream-deleted), installStandaloneFile returns
  // action='skipped-no-src' and newEntry=null so main() can collect it into
  // upstreamDeletedStandalones and handle deletion separately.
  const dstDir = makeTempDir('bp-dst-upstream-del-contract-');
  const pkgContent = '# previously installed\n';
  const destPath = path.join(dstDir, 'SKILL.md');
  fs.writeFileSync(destPath, pkgContent, 'utf8');

  const manifestEntry = { upstream: hashContent(pkgContent), disk: hashContent(pkgContent) };

  const { action, newEntry } = await installStandaloneFile('/nonexistent/SKILL.md', destPath, {
    manifestEntry,
  });

  assert.equal(action, 'skipped-no-src', 'action must signal upstream-delete to caller');
  assert.equal(newEntry, null, 'newEntry must be null so file is dropped from new manifest');
  // dest file still on disk — deletion is main()'s responsibility in Pass 2a
  assert.ok(fs.existsSync(destPath), 'installStandaloneFile itself must not delete the dest');
});

// ── per-target manifest isolation ────────────────────────────────────────────

test('manifests are written independently per target directory', () => {
  const dir1 = makeTempDir('bp-target1-');
  const dir2 = makeTempDir('bp-target2-');

  writeManifest(dir1, { packageName: 'pkg', packageVersion: '1.0.0', files: { 'SKILL.md': { upstream: 'aaa', disk: 'aaa' } } });
  writeManifest(dir2, { packageName: 'pkg', packageVersion: '2.0.0', files: { 'SKILL.md': { upstream: 'bbb', disk: 'ccc' } } });

  const m1 = readManifest(dir1);
  const m2 = readManifest(dir2);

  assert.equal(m1.packageVersion, '1.0.0');
  assert.equal(m1.files['SKILL.md'].upstream, 'aaa');
  assert.equal(m2.packageVersion, '2.0.0');
  assert.equal(m2.files['SKILL.md'].disk, 'ccc');
});

// ── require.main guard ───────────────────────────────────────────────────────

test('requiring postinstall.js does not execute main() (require.main guard)', () => {
  // If require.main guard is missing, requiring the module would have run main()
  // and either failed (no ~/.copilot or ~/.claude) or mutated the filesystem.
  // The fact that we successfully required it above and nothing crashed verifies the guard.
  assert.ok(typeof hashContent === 'function', 'module exports should be accessible');
  assert.ok(typeof installStandaloneFile === 'function', 'installStandaloneFile should be exported');
});
