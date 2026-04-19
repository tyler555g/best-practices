# Git Workflow Best Practices

## Core Rules

- **Never rebase** except for local branch management only
- **Always: pull → resolve conflicts → push**
- **Always use merge requests / PRs** — no direct pushes to protected branches
- **If conflicts: pull → resolve → push** (never rebase to resolve remote conflicts)
- **Squash commits where appropriate** and write a clear, descriptive summary message
- **Use changesets** to track features and changes — enables clean versioning, deploys, and rollbacks

## Branching Strategy

- `main` — always deployable, protected
- Feature branches: `feat/<description>`
- Fix branches: `fix/<description>`
- All changes enter `main` via PR only

## Conventional Commits

Follow the **[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)** specification for all commit messages.

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
| Type | When to use | SemVer impact |
|---|---|---|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `feat!` / `BREAKING CHANGE` | Breaking API change | MAJOR |
| `docs` | Documentation only | none |
| `chore` | Build, tooling, maintenance | none |
| `refactor` | Code change, no feature/fix | none |
| `perf` | Performance improvement | none |
| `test` | Adding/fixing tests | none |
| `ci` | CI/CD config changes | none |
| `style` | Formatting, whitespace | none |

### Examples
```
feat(skills): add GitHub Copilot CLI support
fix(postinstall): handle missing ~/.copilot directory gracefully
docs: update README with npm install instructions
chore: initialize changesets for version tracking
feat!: drop Node 14 support

BREAKING CHANGE: requires Node >= 16
```

### Integration with Changesets
Conventional commits map directly to changeset bump types:
- `feat:` → `minor` changeset
- `fix:` → `patch` changeset
- `feat!:` / `BREAKING CHANGE:` → `major` changeset

### Enforcement: commitlint
```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```
```js
// commitlint.config.js
export default { extends: ['@commitlint/config-conventional'] };
```

## Commit Attribution

- Body explains *why*, not just *what*
- Include `Co-authored-by` trailers for collaborators and AI tools
- Include model name, version, and session ID for AI contributions

### Attribution Trailer Format
```
Co-authored-by: Name <email>
Co-authored-by: GitHub Copilot CLI v1.0.32 (claude-sonnet-4.6) <223556219+Copilot@users.noreply.github.com>
Copilot-Session: <session-id>
```

## Changeset Workflow

Changesets track what changed, at what version level, for every PR:

```bash
# After making changes, create a changeset
npx changeset

# On release, bump versions and generate changelog
npx changeset version

# Publish
npx changeset publish
```

Benefits:
- Every feature or fix is explicitly categorized (major/minor/patch)
- Auto-generated changelogs
- Easy rollback — each changeset is a traceable unit
- Multi-package monorepo support

## Default Git Configuration

```bash
git config --global init.defaultBranch main
git config --global pull.rebase false   # always merge, never rebase on pull
```

## See Also
- [Conventional Commits](https://www.conventionalcommits.org)
- [Changesets](https://github.com/changesets/changesets)
