# npm Package Development Best Practices

## Sources

- **Snyk — Best practices for creating modern npm packages** (2025)  
  https://snyk.io/blog/best-practices-create-modern-npm-package/
- **npm Docs — Creating and publishing scoped public packages**  
  https://docs.npmjs.com/creating-and-publishing-scoped-public-packages
- **OWASP — NPM Security Cheat Sheet**  
  https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html

---

## 1. Package Setup

### Use scoped package names

Always scope packages to your username or organization:

```
@username/package-name
```

This prevents name conflicts and establishes clear ownership.

### Use a `files` allowlist (not `.npmignore`)

Use the `files` field in `package.json` as a strict allowlist of what gets published. Do **not** rely on `.npmignore` — if both exist, `.npmignore` wins but is easy to forget to update.

```json
"files": [
  "README.md",
  "bin/",
  "scripts/",
  "lib/"
]
```

### Set `publishConfig.access` for scoped packages

Scoped packages are **private by default**. Always declare public access explicitly:

```json
"publishConfig": {
  "access": "public"
}
```

### Declare `engines.node`

Specify the minimum Node.js version your package requires:

```json
"engines": {
  "node": ">=22"
}
```

### Declare `main` (and `exports` for ESM)

Always declare an entry point:

```json
"main": "lib/index.js"
```

For modern ESM packages, prefer `exports`:

```json
"exports": {
  ".": {
    "import": "./lib/index.mjs",
    "require": "./lib/index.cjs"
  }
}
```

---

## 2. Module Format

### Prefer ESM (ECMAScript Modules)

ECMAScript Module format is natively supported in Node.js 12+ and is the standard for all modern JS runtimes (Node.js, Bun, Deno). Use TypeScript or `"type": "module"` to publish ESM packages.

For maximum compatibility, support both ESM and CJS using a dual-build TypeScript setup:

```json
"scripts": {
  "build": "npm run clean && tsc",
  "clean": "del-cli lib",
  "prepack": "npm run build"
}
```

---

## 3. Testing

### Use Node.js built-in test runner

Node.js 18+ includes a built-in test runner. No external test framework needed for simple packages:

```json
"scripts": {
  "test": "node --test tests/**/*.test.js"
}
```

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('my function works', () => {
  assert.equal(myFn(1), 2);
});
```

### Test the package itself (not just the code)

Before publishing, verify the package installs and works in a real consumer context:

```bash
# Option 1: pack and install the tarball (closest to production)
npm pack
cd /path/to/consumer-project
npm install /path/to/package.tgz

# Option 2: npm link (for fast iteration)
npm link
cd /path/to/consumer-project
npm link @username/my-package

# Option 3: dry run (review what would be published)
npm pack --dry-run
npm publish --dry-run
```

---

## 4. Security

### Avoid publishing secrets

Review contents before every publish. Never let `.env`, config files with credentials, or private keys into the tarball. Use `files` allowlist (see above) and run `npm pack --dry-run` to verify.

### Enforce the lockfile in CI

Use `npm ci` instead of `npm install` in CI environments. This enforces the lockfile and fails if there is any inconsistency:

```bash
npm ci
```

### Audit dependencies regularly

```bash
npm audit --audit-level=moderate
```

Integrate into CI as a required step. Monitor continuously — new CVEs can appear between commits.

### Minimize attack surface from run-scripts

Be aware that `postinstall` scripts run **automatically** on install. This is a known attack vector (eslint-scope, crossenv incidents). If your package uses a postinstall script:
- Keep it minimal and auditable
- Document what it does in the README
- Consider providing a `--ignore-scripts` safe fallback for users who distrust run-scripts

For consumer projects installing third-party packages, use:

```bash
npm install --ignore-scripts
```

Or in `.npmrc`:

```
ignore-scripts=true
```

With an allowlist via `@lavamoat/allow-scripts` for packages you explicitly trust.

### Enable 2FA on your npm account

Enable two-factor authentication in auth-and-writes mode to protect against unauthorized publishes:

```bash
npm profile enable-2fa auth-and-writes
```

### Use Automation tokens for CI publishing

Use an **Automation-type** npm token for CI/CD workflows — it bypasses 2FA in automation contexts and can be scoped to specific workflows or IP ranges:

```bash
npm token create --cidr=192.0.2.0/24
```

Restrict, rotate, and revoke tokens as part of normal maintenance.

### Provenance and supply chain

When publishing via GitHub Actions, generate provenance statements to allow consumers to verify the package's origin:

```bash
npm publish --access public --provenance
```

Track provenance for builds and consider generating an SBOM (CycloneDX/SPDX):

```bash
npm install @cyclonedx/cyclonedx-npm
npx @cyclonedx/cyclonedx-npm --validate > sbom.json
```

---

## 5. Versioning and Release

### Use semantic versioning

Follow [semver](https://semver.org/): `MAJOR.MINOR.PATCH`

- `PATCH` — backward-compatible bug fix
- `MINOR` — new backward-compatible feature
- `MAJOR` — breaking change

### Automate releases with Changesets (monorepos) or semantic-release (single packages)

**For monorepos — [Changesets](https://github.com/changesets/changesets):**

```bash
npx changeset        # record a change
npx changeset version # bump versions
npx changeset publish # publish all changed packages
```

**For single packages — [semantic-release](https://semantic-release.gitbook.io/):**

Relies on [conventional commits](https://www.conventionalcommits.org/) to determine version bumps and generate changelogs automatically. Integrates with GitHub Actions.

Use [commitlint](https://commitlint.js.org/) to enforce conventional commit format on every commit.

---

## 6. Typosquatting and Slopsquatting Awareness

### Typosquatting

Attackers publish malicious packages with names visually similar to popular ones (e.g., `crossenv` vs `cross-env`). Always:
- Double-check package names before installing
- Verify publisher identity and download counts
- Hold off on immediately upgrading to new versions; review changelogs first

### Slopsquatting (AI hallucination attacks)

AI coding assistants may hallucinate package names that don't exist. Attackers monitor these hallucinations and publish malicious packages matching them. Always verify that AI-suggested packages exist and are legitimate before installing.

---

## 7. Maintenance

### Check for outdated dependencies

```bash
npm outdated
```

### Diagnose your npm environment

```bash
npm doctor
```

### Responsible disclosure

If you discover a security vulnerability in your own or another package, follow a responsible disclosure process — contact the maintainer privately before making anything public.

---

## 8. CI/CD Pipeline Summary

A complete CI/CD pipeline for an npm package should include:

1. **`npm ci`** — lockfile-enforced install
2. **`npm test`** — unit tests
3. **`npm audit --audit-level=moderate`** — security audit
4. **`npm pack --dry-run`** — verify tarball contents before publish
5. **Release automation** — changesets or semantic-release on merge to main
6. **`npm publish --access public --provenance`** — publish with provenance
