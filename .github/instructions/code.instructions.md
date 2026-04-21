---
applyTo: "**/*.js,**/*.cjs,**/*.mjs,**/*.json,scripts/**,bin/**,tests/**"
---

# Code Instructions

## npm Package Conventions

- Node.js >= 22 required (specified in `engines.node`)
- Use `npm ci` in CI environments
- Use `npm test` for running tests
- `publishConfig.access = "public"` on all packages

## Test Runner

- Node.js built-in test runner (`node --test`)
- Test files: `tests/**/*.test.js` and `tests/*.test.js`
- Run with: `npm test`

## Monorepo Structure

- Root package: `@tyler.given/best-practices`
- Content package: `@tyler.given/best-practices-content` (in `packages/content/`)
- Config package: In `packages/config/`
- Workspaces configured in root `package.json`

## Git and Releases

- **Conventional commits** enforced by commitlint
- Use `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Feature branches + draft PRs only
- Release with: `npm run release` (changeset-based)
- Use: `npx changeset` to create changesets

## Security

- **No secrets in code** — use environment variables and secrets managers
- Never commit API keys, passwords, or credentials
- Use proper error handling to avoid information leakage

## Scripts Available

- `npm test` — run tests with Node.js test runner
- `npx changeset` — create version bump changesets
- `npm run release` — publish to npm with public access
- `npm run audit:deps` — security audit dependencies
