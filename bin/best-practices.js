#!/usr/bin/env node
// Interactive setup CLI for @tyler555g/best-practices
// Usage: npx @tyler555g/best-practices setup

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const HOME = os.homedir();
const CONFIG_FILE = path.join(HOME, '.best-practices.json');
const PKG_ROOT = path.join(__dirname, '..');

// All 10 domains — matches README.md structure
const DOMAINS = [
  { id: 'sciences', name: 'Sciences', desc: 'Mathematics, physics, chemistry, biology, earth sciences, etc.' },
  { id: 'engineering', name: 'Engineering', desc: 'Software, hardware, electrical, mechanical, civil, aerospace, etc.' },
  { id: 'trades_and_crafts', name: 'Trades & Crafts', desc: 'Construction, plumbing, woodworking, HVAC, welding, etc.' },
  { id: 'medicine_and_health', name: 'Medicine & Health', desc: 'Clinical medicine, pharmacy, nursing, public health, etc.' },
  { id: 'business_and_economics', name: 'Business & Economics', desc: 'Entrepreneurship, finance, marketing, operations, etc.' },
  { id: 'governance_and_law', name: 'Governance & Law', desc: 'Constitutional law, criminal justice, public policy, etc.' },
  { id: 'arts_and_humanities', name: 'Arts & Humanities', desc: 'Visual arts, music, literature, philosophy, history, etc.' },
  { id: 'environment_and_sustainability', name: 'Environment & Sustainability', desc: 'Climate science, conservation, renewable energy, etc.' },
  { id: 'technology_and_information', name: 'Technology & Information', desc: 'IT, cybersecurity, data science, AI, telecom, etc.' },
  { id: 'personal_and_interpersonal', name: 'Personal & Interpersonal', desc: 'Health, relationships, finance, career, safety, etc.' },
];

// SWE/AI/Ethics defaults — always installed
const ALWAYS_INSTALLED = ['technology_and_information'];

const SKILL_TARGETS = [
  path.join(HOME, '.copilot', 'skills', 'best-practices'),
  path.join(HOME, '.claude', 'skills', 'best-practices'),
];

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return { selectedDomains: [...ALWAYS_INSTALLED] };
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
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
  const domainPath = path.join(PKG_ROOT, domainId);
  if (!fs.existsSync(domainPath)) return false;
  function hasMarkdown(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (hasMarkdown(path.join(dir, entry.name))) return true;
      } else if (entry.name.endsWith('.md')) {
        return true;
      }
    }
    return false;
  }
  return hasMarkdown(domainPath);
}

function installDomains(domainIds) {
  let totalFiles = 0;
  for (const target of SKILL_TARGETS) {
    if (!fs.existsSync(path.dirname(path.dirname(target)))) continue;
    for (const domainId of domainIds) {
      const src = path.join(PKG_ROOT, domainId);
      if (fs.existsSync(src)) {
        const dest = path.join(target, domainId);
        totalFiles += copyDirSync(src, dest);
      }
    }
  }
  return totalFiles;
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] !== 'setup') {
    console.log('Usage: npx @tyler555g/best-practices setup');
    console.log('\nInteractively select which best-practice domains to install.');
    process.exit(0);
  }

  const config = loadConfig();

  console.log('\n📚 Best Practices — Domain Setup\n');
  console.log('Select which domains to install to your AI agent skills directories.');
  console.log('Domains marked [installed] are already active. Domains marked [no content yet]');
  console.log('are planned but have no best-practice files yet.\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(resolve => rl.question(q, resolve));

  for (const domain of DOMAINS) {
    const hasContent = hasDomainContent(domain.id);
    const isInstalled = config.selectedDomains.includes(domain.id);
    const isAlways = ALWAYS_INSTALLED.includes(domain.id);

    let status = '';
    if (isAlways) status = ' [always installed]';
    else if (!hasContent) status = ' [no content yet]';
    else if (isInstalled) status = ' [installed]';

    console.log(`  ${domain.name}${status}`);
    console.log(`    ${domain.desc}`);

    if (isAlways) {
      console.log('    → Core domain — always installed\n');
      continue;
    }

    if (!hasContent) {
      console.log('    → Content coming in a future release\n');
      continue;
    }

    const answer = await ask(`    Install? (y/n) [${isInstalled ? 'y' : 'n'}]: `);
    const install = answer.trim().toLowerCase() === 'y' || (answer.trim() === '' && isInstalled);

    if (install && !config.selectedDomains.includes(domain.id)) {
      config.selectedDomains.push(domain.id);
    } else if (!install) {
      config.selectedDomains = config.selectedDomains.filter(d => d !== domain.id);
    }
    console.log('');
  }

  rl.close();

  console.log('\nInstalling selected domains...');
  const files = installDomains(config.selectedDomains);
  saveConfig(config);

  console.log(`\n✅ Installed ${config.selectedDomains.length} domain(s) (${files} files)`);
  console.log(`   Config saved to ${CONFIG_FILE}`);
  console.log('\n   Re-run anytime: npx @tyler555g/best-practices setup\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
