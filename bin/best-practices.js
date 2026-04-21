#!/usr/bin/env node
// Interactive setup CLI for @tyler.given/best-practices
// Usage: npx @tyler.given/best-practices setup

const {
  loadConfig,
  saveConfig,
  detectTargets,
  installDomains,
  pruneDomains,
  selectDomains,
} = require('../scripts/domains');

async function main() {
  const args = process.argv.slice(2);

  if (args[0] !== 'setup') {
    console.log('Usage: npx @tyler.given/best-practices setup');
    console.log('\nInteractively select which best-practice domains to install.');
    process.exit(0);
  }

  const config = loadConfig();
  const targets = detectTargets();

  await selectDomains(config);

  console.log('\nInstalling selected domains...');
  pruneDomains(config.selectedDomains, targets);
  const files = installDomains(config.selectedDomains, targets);
  saveConfig(config);

  console.log(`\n✅ Installed ${config.selectedDomains.length} domain(s) (${files} files)`);
  console.log(`   Config saved to ~/.best-practices.json`);
  console.log('\n   Re-run anytime: npx @tyler.given/best-practices setup\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

