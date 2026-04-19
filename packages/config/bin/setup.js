#!/usr/bin/env node
// Explicit setup CLI for @tyler.given/best-practices-config
// Safe for CI, Docker, and per-repo devDependency use — no home-dir writes.
// Usage: npx @tyler.given/best-practices-config setup [--target <dir>]

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const CONTENT_ROOT = path.dirname(require.resolve('@tyler.given/best-practices-content/package.json'));
const HOME = os.homedir();
const IS_CI = Boolean(process.env.CI);

// All 10 domains — matches categories.md structure
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

const ALWAYS_INSTALLED = ['technology_and_information'];

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
  const domainPath = path.join(CONTENT_ROOT, domainId);
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

async function main() {
  const args = process.argv.slice(2);

  if (args[0] !== 'setup') {
    console.log('Usage: npx @tyler.given/best-practices-config setup [--target <dir>]');
    console.log('\nInstall best-practices content to a specified directory (or current directory).');
    console.log('Safe for CI and Docker — no home-directory writes.');
    process.exit(0);
  }

  // --target flag lets callers specify a destination (e.g., ./.ai/skills/best-practices)
  const targetIdx = args.indexOf('--target');
  const target = targetIdx !== -1 ? path.resolve(args[targetIdx + 1]) : path.join(process.cwd(), 'best-practices');

  // In CI: install all available domains non-interactively
  const selectedDomains = IS_CI
    ? DOMAINS.filter(d => hasDomainContent(d.id)).map(d => d.id)
    : null;

  if (IS_CI) {
    console.log(`\n📚 Best Practices — CI Setup (non-interactive)\n`);
  } else {
    console.log('\n📚 Best Practices — Domain Setup\n');
    console.log('Select which domains to install to: ' + target);
    console.log('Domains marked [no content yet] are planned but not yet available.\n');
  }

  const chosen = selectedDomains || [];

  if (!IS_CI) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q) => new Promise(resolve => rl.question(q, resolve));

    for (const domain of DOMAINS) {
      const hasContent = hasDomainContent(domain.id);
      const isAlways = ALWAYS_INSTALLED.includes(domain.id);

      let status = '';
      if (isAlways) status = ' [always installed]';
      else if (!hasContent) status = ' [no content yet]';

      console.log(`  ${domain.name}${status}`);
      console.log(`    ${domain.desc}`);

      if (isAlways) {
        chosen.push(domain.id);
        console.log('    → Core domain — always installed\n');
        continue;
      }

      if (!hasContent) {
        console.log('    → Content coming in a future release\n');
        continue;
      }

      const answer = await ask('    Install? (y/n) [y]: ');
      if (answer.trim().toLowerCase() !== 'n') {
        chosen.push(domain.id);
      }
      console.log('');
    }

    rl.close();
  }

  console.log(`\nInstalling to: ${target}`);
  fs.mkdirSync(target, { recursive: true });

  // Copy SKILL.md + categories.md
  for (const file of ['SKILL.md', 'README.md', 'categories.md']) {
    const src = path.join(CONTENT_ROOT, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(target, file));
    }
  }

  let totalFiles = 0;

  // Copy agents/ directory
  const agentsSrc = path.join(CONTENT_ROOT, 'agents');
  if (fs.existsSync(agentsSrc)) {
    totalFiles += copyDirSync(agentsSrc, path.join(target, 'agents'));
  }
  for (const domainId of chosen) {
    const src = path.join(CONTENT_ROOT, domainId);
    if (fs.existsSync(src)) {
      totalFiles += copyDirSync(src, path.join(target, domainId));
    }
  }

  console.log(`\n✅ Installed ${chosen.length} domain(s) (${totalFiles} files) → ${target}`);
  console.log('\n   Re-run anytime: npx @tyler.given/best-practices-config setup --target <dir>\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
