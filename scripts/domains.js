#!/usr/bin/env node
// Shared domain definitions, config helpers, and interactive domain selection.
// Used by both scripts/postinstall.js and bin/best-practices.js.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const HOME = os.homedir();
const CONFIG_FILE = path.join(HOME, '.best-practices.json');
const CONTENT_ROOT = path.dirname(require.resolve('@tyler.given/best-practices-content/package.json'));

const DOMAINS = [
  { id: 'sciences',                      name: 'Sciences',                      desc: 'Mathematics, physics, chemistry, biology, earth sciences, etc.' },
  { id: 'engineering',                   name: 'Engineering',                   desc: 'Software, hardware, electrical, mechanical, civil, aerospace, etc.' },
  { id: 'trades_and_crafts',             name: 'Trades & Crafts',               desc: 'Construction, plumbing, woodworking, HVAC, welding, etc.' },
  { id: 'medicine_and_health',           name: 'Medicine & Health',             desc: 'Clinical medicine, pharmacy, nursing, public health, etc.' },
  { id: 'business_and_economics',        name: 'Business & Economics',          desc: 'Entrepreneurship, finance, marketing, operations, etc.' },
  { id: 'governance_and_law',            name: 'Governance & Law',              desc: 'Constitutional law, criminal justice, public policy, etc.' },
  { id: 'arts_and_humanities',           name: 'Arts & Humanities',             desc: 'Visual arts, music, literature, philosophy, history, etc.' },
  { id: 'environment_and_sustainability',name: 'Environment & Sustainability',  desc: 'Climate science, conservation, renewable energy, etc.' },
  { id: 'technology_and_information',    name: 'Technology & Information',      desc: 'IT, cybersecurity, data science, AI, telecom, etc.' },
  { id: 'personal_and_interpersonal',    name: 'Personal & Interpersonal',      desc: 'Health, relationships, finance, career, safety, etc.' },
];

// Always installed regardless of user selection.
const ALWAYS_INSTALLED = ['technology_and_information'];

// Candidate install targets — only those whose parent skill dir exists get used.
const SKILL_TARGETS = [
  path.join(HOME, '.copilot', 'skills', 'best-practices'),
  path.join(HOME, '.claude',   'skills', 'best-practices'),
];

// --- Config ---

function normalizeConfig(raw) {
  const known = new Set(DOMAINS.map(d => d.id));
  const selected = Array.isArray(raw?.selectedDomains) ? raw.selectedDomains : [];
  const normalized = [...new Set([
    ...ALWAYS_INSTALLED,
    ...selected.filter(id => known.has(id)),
  ])];
  const baseConfig = raw && typeof raw === 'object' ? raw : {};
  return { ...baseConfig, selectedDomains: normalized };
}

function loadConfig() {
  try {
    return normalizeConfig(JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')));
  } catch {
    return { selectedDomains: [...ALWAYS_INSTALLED] };
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
}

// --- File helpers ---

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src,  entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

function hasDomainContent(domainId) {
  const domainPath = path.join(CONTENT_ROOT, domainId);
  if (!fs.existsSync(domainPath)) return false;
  function hasMarkdown(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && hasMarkdown(path.join(dir, entry.name))) return true;
      if (entry.name.endsWith('.md')) return true;
    }
    return false;
  }
  return hasMarkdown(domainPath);
}

// --- Install / prune ---

// Returns targets where the agent root directory exists (e.g. ~/.copilot, ~/.claude).
function detectTargets() {
  return SKILL_TARGETS.filter(t => fs.existsSync(path.dirname(path.dirname(t))));
}

// Copies domain content into every detected target. Returns total file count.
function installDomains(domainIds, targets) {
  targets = targets ?? detectTargets();
  let totalFiles = 0;
  for (const targetDir of targets) {
    fs.mkdirSync(targetDir, { recursive: true });
    for (const domainId of domainIds) {
      const src = path.join(CONTENT_ROOT, domainId);
      if (fs.existsSync(src)) {
        totalFiles += copyDirSync(src, path.join(targetDir, domainId));
      }
    }
  }
  return totalFiles;
}

// Removes domain folders that are no longer selected (respects ALWAYS_INSTALLED).
function pruneDomains(selectedDomains, targets) {
  targets = targets ?? detectTargets();
  const keep = new Set(selectedDomains);
  for (const targetDir of targets) {
    if (!fs.existsSync(targetDir)) continue;
    for (const { id } of DOMAINS) {
      if (!keep.has(id) && !ALWAYS_INSTALLED.includes(id)) {
        const domainPath = path.join(targetDir, id);
        if (fs.existsSync(domainPath)) {
          fs.rmSync(domainPath, { recursive: true, force: true });
        }
      }
    }
  }
}

// --- Interactive selection ---

// Presents the domain picker via readline, updates config.selectedDomains in place.
// Creates and closes its own readline interface.
async function selectDomains(config) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(resolve => rl.question(q, resolve));

  console.log('\n📚 Best Practices — Domain Setup\n');
  console.log('Select which domains to install to your AI agent skills directories.');
  console.log('Domains marked [installed] are already active. Domains marked [no content yet]');
  console.log('are planned but have no best-practice files yet.\n');

  for (const domain of DOMAINS) {
    const hasContent = hasDomainContent(domain.id);
    const isAlways   = ALWAYS_INSTALLED.includes(domain.id);
    const isSelected = config.selectedDomains.includes(domain.id);

    let status = isAlways ? ' [always installed]' : !hasContent ? ' [no content yet]' : isSelected ? ' [installed]' : '';
    console.log(`  ${domain.name}${status}`);
    console.log(`    ${domain.desc}`);

    if (isAlways)    { console.log('    → Core domain — always installed\n'); continue; }
    if (!hasContent) { console.log('    → Content coming in a future release\n'); continue; }

    const answer = await ask(`    Install? (y/n) [${isSelected ? 'y' : 'n'}]: `);
    const install = answer.trim().toLowerCase() === 'y' || (answer.trim() === '' && isSelected);

    if (install && !config.selectedDomains.includes(domain.id)) {
      config.selectedDomains.push(domain.id);
    } else if (!install) {
      config.selectedDomains = config.selectedDomains.filter(d => d !== domain.id);
    }
    console.log('');
  }

  rl.close();
  return config;
}

module.exports = {
  DOMAINS,
  ALWAYS_INSTALLED,
  SKILL_TARGETS,
  CONFIG_FILE,
  CONTENT_ROOT,
  normalizeConfig,
  loadConfig,
  saveConfig,
  copyDirSync,
  hasDomainContent,
  detectTargets,
  installDomains,
  pruneDomains,
  selectDomains,
};
