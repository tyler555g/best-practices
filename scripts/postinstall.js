#!/usr/bin/env node
// Postinstall: installs best-practices skill + injects AI defaults into tool configs.
// Reports installation status and supports: ~/.copilot/skills, ~/.claude/skills

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

// --- Helpers (postinstall-specific) ---

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function copyFileSync(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
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

// --- Main (async to support interactive overwrite prompts) ---

async function main() {
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

    // Copy standalone files with overwrite protection
    for (const file of STANDALONE_FILES) {
      const src = path.join(CONTENT_ROOT, file);
      const dest = path.join(skillDir, file);
      if (!fs.existsSync(src)) continue;

      if (fs.existsSync(dest)) {
        const srcContent = fs.readFileSync(src, 'utf8');
        const destContent = fs.readFileSync(dest, 'utf8');
        if (srcContent === destContent) continue; // identical — skip silently

        // Content differs
        if (process.env.BEST_PRACTICES_OVERWRITE === '1') {
          copyFileSync(src, dest);
          continue;
        }
        if (IS_CI || !process.stdin.isTTY) {
          console.log(`⚠️  Skipped (content differs — set BEST_PRACTICES_OVERWRITE=1 to force): ${path.basename(dest)}`);
          continue;
        }
        const overwrite = await promptYN(`  ⚠️  ${file} in ${target.name} has local changes. Overwrite? (y/n): `);
        if (!overwrite) {
          console.log(`   Kept existing: ${file}`);
          continue;
        }
      }
      copyFileSync(src, dest);
    }

    // Copy agents/ directory (recursive — handles nested subdirs).
    // Agents are package-owned and always overwritten (unlike STANDALONE_FILES
    // which prompt for user-edited content). Agent specs must match the
    // installed package version to work correctly.
    // Remove stale destination first so renamed/deleted agents don't linger.
    const agentsSrc = path.join(CONTENT_ROOT, 'agents');
    const agentsDest = path.join(skillDir, 'agents');
    if (fs.existsSync(agentsSrc)) {
      if (fs.existsSync(agentsDest)) {
        fs.rmSync(agentsDest, { recursive: true });
      }
      copyDirSync(agentsSrc, agentsDest);
    }

    console.log(`✅ ${isFirstInstall ? 'Installed' : 'Updated'} best-practices skill → ${target.name} (${skillDir})`);
    skillsInstalled++;
  }

  // Restore all previously selected domains (respects saved config, not just hardcoded list).
  if (targets.length > 0) {
    installDomains(config.selectedDomains, targets);
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

main().catch(err => {
  console.error('Postinstall error:', err.message);
  process.exit(1);
});
