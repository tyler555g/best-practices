#!/usr/bin/env node
// Postinstall: installs best-practices skill + injects AI defaults into tool configs.
// Reports installation status and supports: ~/.copilot/skills, ~/.claude/skills

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const {
  CONTENT_ROOT,
  copyDirSync,
  loadConfig,
  saveConfig,
  detectTargets,
  installDomains,
  pruneDomains,
  selectDomains,
} = require('./domains');

const HOME = os.homedir();
const IS_CI = Boolean(process.env.CI);

// Targets with friendly display names (for standalone-file overwrite prompts).
const SKILL_TARGETS_NAMED = [
  { dir: path.join(HOME, '.copilot', 'skills'), name: 'Copilot CLI' },
  { dir: path.join(HOME, '.claude',   'skills'), name: 'Claude Code' },
];

// Content dirs to install (only those that exist in the package)
const CONTENT_DIRS = ['technology_and_information', 'agents'];
const STANDALONE_FILES = ['SKILL.md', 'README.md', 'categories.md'];

// Manifest tracking (per skillDir — so Copilot and Claude are independently tracked)
const MANIFEST_FILE = '.install-manifest.json';
const INCOMING_SUFFIX = '.incoming';

// --- Helpers (postinstall-specific) ---

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function copyFileSync(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

// Recursively collect { upstream, disk } manifest entries for all files under srcDir.
// relPath keys use forward-slash separators relative to the skill root (e.g. "agents/foo.md").
function collectManifestEntries(srcDir, destDir, prefix) {
  const entries = {};
  if (!fs.existsSync(srcDir)) return entries;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(entries, collectManifestEntries(srcPath, destPath, relPath));
    } else {
      try {
        const srcHash = hashContent(fs.readFileSync(srcPath, 'utf8'));
        const diskHash = fs.existsSync(destPath)
          ? hashContent(fs.readFileSync(destPath, 'utf8'))
          : srcHash;
        entries[relPath] = { upstream: srcHash, disk: diskHash };
      } catch {
        // skip unreadable files (e.g. binary assets)
      }
    }
  }
  return entries;
}

function mergeManifestFilesForDomains(existingFiles, domainEntries, selectedDomains) {
  const files = existingFiles || {};
  const domainPrefixes = selectedDomains.map(domainId => `${domainId}/`);
  const retainedFiles = Object.fromEntries(
    Object.entries(files).filter(([filePath]) =>
      !domainPrefixes.some(prefix => filePath.startsWith(prefix))
    )
  );
  return { ...retainedFiles, ...domainEntries };
}

function readManifest(skillDir) {
  const manifestPath = path.join(skillDir, MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) return { files: {} };
  try {
    const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const files =
      data && typeof data.files === 'object' && data.files !== null && !Array.isArray(data.files)
        ? data.files
        : {};
    return { ...data, files };
  } catch {
    return { files: {} };
  }
}

function writeManifest(skillDir, manifest) {
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, MANIFEST_FILE),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8',
  );
}

function readlineQuestion(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function defaultConflictPrompt(relPath, conflictType, _opts) {
  if (!process.stdout.isTTY || !process.stdin.isTTY || IS_CI) return 'keep';

  let question;
  if (conflictType === 'user-added') {
    question =
      `\nConflict: "${relPath}" exists in your skill directory but is not part of the package.\n` +
      `  [k] keep — leave your file  [d] delete — remove it\nChoice [k/d]: `;
    const answer = await readlineQuestion(question);
    return answer.startsWith('d') ? 'delete' : 'keep';
  }

  if (conflictType === 'upstream-deleted') {
    question =
      `\nConflict: "${relPath}" was removed from the package but still exists in your skill directory.\n` +
      `  [k] keep — leave your file  [d] delete — follow the package\nChoice [k/d]: `;
    const answer = await readlineQuestion(question);
    return answer.startsWith('d') ? 'delete' : 'keep';
  }

  question =
    `\nConflict: "${relPath}" was modified by both you and the package.\n` +
    `  [k] keep — preserve your version\n` +
    `  [r] replace — overwrite with the package version\n` +
    `  [a] amend — save the package version as ${relPath}${INCOMING_SUFFIX} for manual review\n` +
    `Choice [k/r/a]: `;
  const answer = await readlineQuestion(question);
  if (answer.startsWith('r')) return 'replace';
  if (answer.startsWith('a')) return 'amend';
  return 'keep';
}

/**
 * Installs a single standalone file using five-case three-way merge logic.
 * Returns { action, newEntry } where action describes what happened and
 * newEntry is the { upstream, disk } manifest entry (or null if src missing).
 */
async function installStandaloneFile(srcPath, destPath, options) {
  const {
    forceReplace = false,
    promptFn = defaultConflictPrompt,
    manifestEntry = null,
  } = options;

  if (!fs.existsSync(srcPath)) return { action: 'skipped-no-src', newEntry: null };

  const srcContent = fs.readFileSync(srcPath, 'utf8');
  const srcHash = hashContent(srcContent);

  // Case A: file doesn't exist in target — silent copy
  if (!fs.existsSync(destPath)) {
    copyFileSync(srcPath, destPath);
    return { action: 'copied', newEntry: { upstream: srcHash, disk: srcHash } };
  }

  const existingContent = fs.readFileSync(destPath, 'utf8');
  const existingHash = hashContent(existingContent);

  // Case B: already identical — no-op
  if (existingHash === srcHash) {
    return { action: 'skipped', newEntry: { upstream: srcHash, disk: srcHash } };
  }

  // Force replace: overwrite regardless of history
  if (forceReplace) {
    fs.writeFileSync(destPath, srcContent, 'utf8');
    return { action: 'replaced', newEntry: { upstream: srcHash, disk: srcHash } };
  }

  // Case C: package updated, user hasn't changed the file — silent update.
  // Safe only when the prior install state was clean (disk===upstream) and disk
  // is still unchanged since then.
  if (manifestEntry) {
    const wasCleanInstallState = manifestEntry.disk === manifestEntry.upstream;
    const userUnchangedSinceLastInstall = existingHash === manifestEntry.disk;
    const packageUpdatedSinceLastInstall = srcHash !== manifestEntry.upstream;
    if (wasCleanInstallState && userUnchangedSinceLastInstall && packageUpdatedSinceLastInstall) {
      fs.writeFileSync(destPath, srcContent, 'utf8');
      return { action: 'updated', newEntry: { upstream: srcHash, disk: srcHash } };
    }
  }

  // Case D: package unchanged, user has their own version — silently preserve.
  // Covers both first-edit and repeated-install stability (existingHash may or may not === entry.disk).
  if (manifestEntry && srcHash === manifestEntry.upstream) {
    return { action: 'preserved', newEntry: { upstream: srcHash, disk: existingHash } };
  }

  // Case E: both sides differ (or no manifest entry) — prompt
  const relName = path.basename(destPath);
  const resolution = await promptFn(relName, 'conflict', { srcContent, existingContent });

  if (resolution === 'replace') {
    fs.writeFileSync(destPath, srcContent, 'utf8');
    return { action: 'replaced', newEntry: { upstream: srcHash, disk: srcHash } };
  } else if (resolution === 'amend') {
    fs.writeFileSync(destPath + INCOMING_SUFFIX, srcContent, 'utf8');
    return { action: 'amended', newEntry: { upstream: srcHash, disk: existingHash } };
  } else {
    // keep — preserve existing, record what the package offered
    return { action: 'kept', newEntry: { upstream: srcHash, disk: existingHash } };
  }
}

async function promptYN(question) {
  if (IS_CI || !process.stdin.isTTY) return false;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

// Injects or repairs a marker-delimited block in a config file.
// - Both markers present → replace block (handles updates)
// - Only start marker → truncated block, repair
// - Only end marker → orphaned end, remove and append fresh
// - Neither marker, but content signal found → already configured manually, skip
// - Neither marker, no signal → append fresh block
function injectOrRepair(filePath, content, block, startMarker, endMarker, alreadyPresentSignal, label) {
  const hasStart = content.includes(startMarker);
  const hasEnd = content.includes(endMarker);

  if (hasStart && hasEnd) {
    const pattern = new RegExp(`${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}`, 'g');
    const updated = content.replace(pattern, block);
    if (updated !== content) {
      fs.writeFileSync(filePath, updated);
      console.log(`✅ Updated AI-human defaults → ${label}`);
    } else {
      console.log(`ℹ️  AI-human defaults already up to date in ${label} — skipped`);
    }
  } else if (hasStart) {
    const pattern = new RegExp(`${escapeRegExp(startMarker)}[\\s\\S]*$`);
    const repaired = content.replace(pattern, block);
    fs.writeFileSync(filePath, repaired.endsWith('\n') ? repaired : repaired + '\n');
    console.log(`✅ Repaired AI-human defaults in ${label}`);
  } else if (hasEnd) {
    const pattern = new RegExp(`\\n?${escapeRegExp(endMarker)}\\n?`, 'g');
    const cleaned = content.replace(pattern, '\n').trimEnd();
    const fresh = cleaned ? cleaned + '\n\n' + block + '\n' : block + '\n';
    fs.writeFileSync(filePath, fresh);
    console.log(`✅ Repaired AI-human defaults in ${label}`);
  } else if (alreadyPresentSignal && content.includes(alreadyPresentSignal)) {
    console.log(`ℹ️  AI-human defaults already configured in ${label} (no markers) — skipped`);
  } else {
    fs.appendFileSync(filePath, '\n\n' + block + '\n');
    console.log(`✅ Injected AI-human defaults → ${label}`);
  }
}

// --- AI defaults markers + block ---

const AI_DEFAULTS_MARKER_START = '<!-- ai-human-defaults -->';
const AI_DEFAULTS_MARKER_END = '<!-- /ai-human-defaults -->';
const AI_DEFAULTS_SOURCE = path.join(
  CONTENT_ROOT,
  'technology_and_information',
  'data_science_and_ai',
  'ai-human-interaction-defaults.md'
);

function buildDefaultsBlock() {
  const source = fs.readFileSync(AI_DEFAULTS_SOURCE, 'utf8');
  return `${AI_DEFAULTS_MARKER_START}\n${source.trim()}\n${AI_DEFAULTS_MARKER_END}`;
}

function readPackageJson() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  } catch {
    return { name: '@tyler.given/best-practices', version: '0.0.0' };
  }
}

// --- Main (async to support interactive overwrite prompts) ---

async function main() {
  const forceReplace = process.env.BEST_PRACTICES_OVERWRITE === '1';
  const promptFn = defaultConflictPrompt;
  const pkg = readPackageJson();

  // --- 1. Load config and install all previously selected domains ---

  const config = loadConfig();
  const targets = detectTargets();
  let skillsInstalled = 0;

  for (const target of SKILL_TARGETS_NAMED) {
    const parentDir = path.dirname(target.dir);
    if (!fs.existsSync(parentDir)) continue;

    const skillDir = path.join(target.dir, 'best-practices');
    const isFirstInstall = !fs.existsSync(skillDir);
    fs.mkdirSync(skillDir, { recursive: true });

    // Read existing manifest for this target
    const manifest = readManifest(skillDir);
    const newManifestFiles = {};

    // Pass 1: install standalone files with three-way conflict detection
    const upstreamDeletedStandalones = [];
    for (const file of STANDALONE_FILES) {
      const srcPath = path.join(CONTENT_ROOT, file);
      const destPath = path.join(skillDir, file);

      const { action, newEntry } = await installStandaloneFile(srcPath, destPath, {
        forceReplace,
        promptFn,
        manifestEntry: manifest.files[file] ?? null,
      });

      if (newEntry) newManifestFiles[file] = newEntry;

      if (action === 'copied' || action === 'updated') {
        // logged below as part of skill install summary
      } else if (action === 'amended') {
        console.log(`  📝 Amend: ${file} — package version saved as ${file}${INCOMING_SUFFIX}`);
      } else if (action === 'kept') {
        console.log(`  📌 Kept: ${file} — your version preserved (package version differs)`);
      } else if (action === 'skipped-no-src') {
        // If this file was previously tracked, it's upstream-deleted — handle below
        if (manifest.files[file]) upstreamDeletedStandalones.push(file);
      }
    }

    // Pass 2: handle files that are in the manifest but no longer provided by the package
    const handledFiles = new Set(STANDALONE_FILES);

    // Pass 2a: standalone files removed from the package
    for (const file of upstreamDeletedStandalones) {
      const filePath = path.join(skillDir, file);
      if (!fs.existsSync(filePath)) continue;
      const prevEntry = manifest.files[file];
      const existingContent = fs.readFileSync(filePath, 'utf8');
      const existingHash = hashContent(existingContent);
      if (forceReplace || existingHash === prevEntry.disk) {
        fs.unlinkSync(filePath);
      } else {
        const resolution = await promptFn(file, 'upstream-deleted', { srcContent: null, existingContent });
        if (resolution === 'delete' || resolution === 'replace') {
          fs.unlinkSync(filePath);
        } else {
          newManifestFiles[file] = { upstream: null, disk: existingHash };
        }
      }
    }

    // Pass 2b: non-standalone files in the skill dir that are no longer provided
    if (fs.existsSync(skillDir)) {
      for (const entry of fs.readdirSync(skillDir, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        const name = entry.name;
        if (name === MANIFEST_FILE || name.endsWith(INCOMING_SUFFIX)) continue;
        if (handledFiles.has(name)) continue;

        const filePath = path.join(skillDir, name);
        const prevEntry = manifest.files[name];

        if (prevEntry) {
          // Was previously installed, no longer provided — upstream deleted
          const existingContent = fs.readFileSync(filePath, 'utf8');
          const existingHash = hashContent(existingContent);

          if (forceReplace || existingHash === prevEntry.disk) {
            fs.unlinkSync(filePath);
          } else {
            const resolution = await promptFn(name, 'upstream-deleted', { srcContent: null, existingContent });
            if (resolution === 'delete' || resolution === 'replace') {
              fs.unlinkSync(filePath);
            } else {
              newManifestFiles[name] = { upstream: null, disk: existingHash };
            }
          }
        }
        // user-added files not in manifest: leave untouched (home-dir courtesy)
      }
    }

    // Copy agents/ directory (recursive — always overwritten; package-owned).
    const agentsSrc = path.join(CONTENT_ROOT, 'agents');
    const agentsDest = path.join(skillDir, 'agents');
    if (fs.existsSync(agentsSrc)) {
      if (fs.existsSync(agentsDest)) {
        fs.rmSync(agentsDest, { recursive: true });
      }
      copyDirSync(agentsSrc, agentsDest);
      // Track agents files in manifest so update-detection covers them.
      Object.assign(newManifestFiles, collectManifestEntries(agentsSrc, agentsDest, 'agents'));
    }

    // Write updated manifest (standalone files + agents).
    writeManifest(skillDir, {
      packageName: pkg.name,
      packageVersion: pkg.version,
      installedAt: new Date().toISOString(),
      files: newManifestFiles,
    });

    console.log(`✅ ${isFirstInstall ? 'Installed' : 'Updated'} best-practices skill → ${target.name} (${skillDir})`);
    skillsInstalled++;
  }

  // Restore all previously selected domains (respects saved config, not just hardcoded list).
  if (targets.length > 0) {
    installDomains(config.selectedDomains, targets);

    // Patch each target's manifest to include domain content files so that
    // update-detection covers them (not just the standalone files + agents).
    for (const targetDir of targets) {
      const domainEntries = {};
      for (const domainId of config.selectedDomains) {
        const srcDir = path.join(CONTENT_ROOT, domainId);
        const destDir = path.join(targetDir, domainId);
        Object.assign(domainEntries, collectManifestEntries(srcDir, destDir, domainId));
      }
      const existing = readManifest(targetDir);
      writeManifest(targetDir, {
        ...existing,
        files: mergeManifestFilesForDomains(existing.files, domainEntries, config.selectedDomains),
      });
    }
  }

  // --- 2. Inject AI-human defaults into ~/.claude/CLAUDE.md ---

  const AI_DEFAULTS_BLOCK = buildDefaultsBlock();
  const CLAUDE_MD = path.join(HOME, '.claude', 'CLAUDE.md');
  if (fs.existsSync(CLAUDE_MD)) {
    const content = fs.readFileSync(CLAUDE_MD, 'utf8');
    injectOrRepair(CLAUDE_MD, content, AI_DEFAULTS_BLOCK, AI_DEFAULTS_MARKER_START, AI_DEFAULTS_MARKER_END, null, '~/.claude/CLAUDE.md');
  } else if (fs.existsSync(path.join(HOME, '.claude'))) {
    fs.writeFileSync(CLAUDE_MD, AI_DEFAULTS_BLOCK + '\n');
    console.log('✅ Created ~/.claude/CLAUDE.md with AI-human defaults');
  }

  // --- 3. Inject AI-human defaults into ~/.copilot/copilot-instructions.md ---

  const COPILOT_INSTRUCTIONS = path.join(HOME, '.copilot', 'copilot-instructions.md');
  if (fs.existsSync(COPILOT_INSTRUCTIONS)) {
    const content = fs.readFileSync(COPILOT_INSTRUCTIONS, 'utf8');
    // Signal: file was manually configured with defaults (no markers)
    injectOrRepair(COPILOT_INSTRUCTIONS, content, AI_DEFAULTS_BLOCK, AI_DEFAULTS_MARKER_START, AI_DEFAULTS_MARKER_END, '## 1. Human Authority', '~/.copilot/copilot-instructions.md');
  } else if (fs.existsSync(path.join(HOME, '.copilot'))) {
    fs.writeFileSync(COPILOT_INSTRUCTIONS, AI_DEFAULTS_BLOCK + '\n');
    console.log('✅ Created ~/.copilot/copilot-instructions.md with AI-human defaults');
  }

  // --- 4. Prompt for additional domains (interactive TTY only) ---

  if (targets.length > 0 && !IS_CI && process.stdin.isTTY) {
    const wantMore = await promptYN('\nWant to install additional best-practice domains? (y/n): ');
    if (wantMore) {
      await selectDomains(config);
      pruneDomains(config.selectedDomains, targets);
      installDomains(config.selectedDomains, targets);
      saveConfig(config);
      console.log(`\n✅ Installed ${config.selectedDomains.length} domain(s)`);
      console.log(`   Config saved to ~/.best-practices.json`);
    }
  }

  // --- 5. Summary ---

  if (skillsInstalled === 0) {
    console.log('⚠️  No supported agent directory found (~/.copilot, ~/.claude).');
    console.log("   Install manually: copy the best-practices folder to your agent's skills directory.");
  }

  console.log('\n📚 Run `npx @tyler.given/best-practices setup` anytime to change your domain selection.');
}

if (require.main === module) {
  main().catch(err => {
    console.error('Postinstall error:', err.message);
    process.exit(1);
  });
}

module.exports = {
  hashContent,
  readManifest,
  writeManifest,
  defaultConflictPrompt,
  installStandaloneFile,
  mergeManifestFilesForDomains,
};
