# Git Workflow Best Practices

## Core Rules

- **One logical change per commit** — if your commit message description gets long, that's a sign the commit should be split
- **Every commit must be bisectable** — each commit must independently build and pass tests; `git bisect` depends on this
- **Never rebase public/shared history** — only rebase local, unpushed branches; rebasing published commits destroys provenance and Signed-off-by traceability
- **Always merge to sync, never rebase shared branches** — preserve original commits; resolve conflicts explicitly so every integration is intentional and traceable
- **Always use merge requests / PRs** — no direct pushes to protected branches
- **Merge commits represent real integration points** — merging a feature branch into `main` or an integration branch; avoid noise merges just to sync with upstream
- **Always include references** for architectural/engineering decisions — in commit body, merge commit message, changelog, or an ADR markdown file

---

## Commit Message Format

Use **Conventional Commits** as the primary format (enforced by commitlint). The kernel-style `subsystem:` prefix maps directly to the Conventional Commits `type(scope):` pattern — the `scope` is your subsystem.

```
type(scope): brief description of the change (≤75 chars)

Describe *why* the change is needed and what problem it solves.
Describe user-visible impact. Quantify optimizations with numbers.
Wrap body at 75 columns.

Fixes: 54a4f0239f2e ("type(scope): description of the buggy commit")
Closes: https://github.com/owner/repo/issues/123
Link: https://lore.kernel.org/... (or any discussion reference)
Signed-off-by: Your Name <your@email.com>
Co-authored-by: Name <email>
```

> **Kernel analogy:** Linux uses `subsystem: description` (e.g., `net: fix null deref`). Conventional Commits adds a structured type prefix: `fix(net): fix null deref`. Both encode the same information — commitlint enforces the type; the scope names the subsystem.

### Rules
- **Imperative mood** in the subject: "Fix null deref in…" not "Fixed…" or "Fixes…"
- **Subject ≤ 75 characters**, no trailing period
- **Blank line** between subject and body — always
- **Body explains the *why***, not just the *what*: describe the problem, its impact, and why this approach was chosen
- **Quantify** performance/memory improvements with actual numbers
- **Self-contained**: the commit + its message should be understandable without referencing external URLs
- **Long paths/URLs** — exempt from the 75-column wrap; break *before* them if possible, never mid-path or mid-URL

### Conventional Commits Mapping

Follow **[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)** for the subject prefix — compatible with the kernel style above.

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

Previously the postinstall only targeted Claude Code (~/.claude).
Copilot CLI stores instructions in ~/.copilot/copilot-instructions.md.
Without injection there, Copilot users had to configure defaults
manually on every machine.

This adds idempotent injection using the same marker-based block
system used for CLAUDE.md, ensuring the 10 AI-human interaction
rules are applied to both tools on install.

Closes: https://github.com/tyler555g/best-practices/issues/12
```

```
fix(postinstall): handle missing ~/.copilot directory gracefully

Reported on Windows where the directory may not exist until
first Copilot CLI run. Without this fix, the injection step would
throw ENOENT and abort the entire postinstall.
```

```
perf(content): reduce tarball size by 40% (14kB → 8.4kB)

Moved full domain content to @tyler.given/best-practices-content.
Main package now ships only bin/ and scripts/ — no markdown files.
Measured with `npm pack --dry-run` before and after.
```

---

## Commit Trailers

### Signed-off-by (DCO)

The **Developer Certificate of Origin** trailer certifies that you wrote the
patch or have the right to contribute it as open source. Use `git commit -s`
to append it automatically:

```
Signed-off-by: Your Name <your@email.com>
```

Required for Linux kernel contributions; recommended for any open-source project.

### Fixes

Reference the exact commit that introduced the bug. Use at least 12 SHA characters:

```
Fixes: 54a4f0239f2e ("type(scope): description of the buggy commit")
```

Git config shortcut:
```
[core]
    abbrev = 12
[pretty]
    fixes = Fixes: %h ("%s")
```
Then: `git log -1 --pretty=fixes <sha>`

### Closes / Link

```
Closes: https://github.com/owner/repo/issues/123   # auto-closes on merge
Link: https://lore.kernel.org/...                   # reference a discussion
```

---

## References Rule

**Every architectural or engineering decision must be traceable.** Include references to:
- The issue, ticket, or discussion that motivated the change
- Any RFC, ADR, spec, or external standard consulted
- Benchmark data, benchmark methodology, or tool used

**Where to put references:**
- **Commit body** — `Link:` trailer or inline URL for the specific change
- **Merge commit message** — summarize the decision rationale and list key references when integrating a feature branch
- **CHANGELOG / changeset** — surface decisions at the version level
- **ADR markdown** (e.g., `docs/decisions/001_use_npm_workspaces.md`) — for long-lived architectural decisions that need their own document

```
feat: switch to npm workspaces monorepo

Eliminated content duplication that arose from copying markdown into
each package before publish. The workspace approach lets packages
reference each other via symlinks in development and npm installs
the content as a peer package in production.

Considered: (a) prepack copy, (b) workspaces, (c) separate repo
Chose (b) — minimal tooling overhead, native npm support, DRY.

Link: https://docs.npmjs.com/cli/v10/using-npm/workspaces
Link: https://snyk.io/blog/best-practices-create-modern-npm-package/
ADR: docs/decisions/001_monorepo_workspaces.md
```

---

## Branching Strategy

- `main` — always deployable, protected
- Feature branches: `feat/<description>`
- Fix branches: `fix/<description>`
- All changes enter `main` via PR only

---

## Merge vs Rebase

| Situation | Use |
|---|---|
| Local unpushed branch cleanup | `git rebase` ✅ |
| Integrating feature → main | Merge commit ✅ |
| Syncing with upstream (pull) | `git merge` (or `git pull --no-rebase`) ✅ |
| Any published/shared commit | **Never rebase** ❌ |

> *"The whole point of a distributed SCM is that you can track merges and have a historic record of exactly how things happened."*
> — Linus Torvalds

Default config:
```bash
# Always merge on pull — preserves original commits and makes every
# conflict resolution explicit. Overlapping changes must be handled
# case-by-case, whether by a human or an AI tool.
git config --global pull.rebase false
git config --global init.defaultBranch main
```

---

## Git Tools

### git bisect — find the commit that introduced a bug

`git bisect` binary-searches your history to find the first bad commit.
**This only works if every commit is bisectable** (builds and passes tests).

```bash
git bisect start
git bisect bad                  # current commit is broken
git bisect good v1.2.0          # last known good commit/tag
# git checks out midpoint — run your test, then:
git bisect good                 # or: git bisect bad
# repeat until bisect identifies the culprit
git bisect reset                # return to HEAD
```

### git blame — understand *why*, not who to blame

```bash
git blame -L 42,60 scripts/postinstall.js   # show line history for lines 42-60
```

`git blame` traces who last changed each line and in which commit.
Use it to understand the reasoning behind code — then read that commit's body
for the *why*. Do not use it to assign blame.

### git log — explore history

```bash
git log --oneline --graph --decorate --all   # full branch/merge topology
git log --follow -p -- path/to/file          # full history of a file
git log --grep="Fixes:" --oneline            # find bug-fix commits
git show <sha>                               # full commit with diff
```

---

## Conventional Commits Integration with Changesets

Conventional commit types map directly to changeset bump levels:
- `feat:` → `minor` changeset
- `fix:` → `patch` changeset
- `feat!:` / `BREAKING CHANGE:` → `major` changeset

### Changeset Workflow

```bash
npx changeset        # record a change (describe what changed + bump type)
npx changeset version # bump versions + generate CHANGELOG
npx changeset publish # publish all changed packages
```

Benefits: explicit version categorization, auto-generated changelogs, rollback traceability, monorepo support.

### commitlint enforcement

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```
**CommonJS** (default — no `"type":"module"` in package.json):
```js
// commitlint.config.js
module.exports = { extends: ['@commitlint/config-conventional'] };
```

**ESM** (when package.json has `"type":"module"`):
```js
// commitlint.config.js
export default { extends: ['@commitlint/config-conventional'] };
```

---

## Commit Attribution

- Body explains *why*, not just *what*
- Include `Co-authored-by` trailers for collaborators and AI tools
- Include model name, version, and session ID for AI contributions

```
Co-authored-by: Name <email>
Co-authored-by: GitHub Copilot CLI v1.0.32 (claude-sonnet-4.6) <223556219+Copilot@users.noreply.github.com>
Copilot-Session: <session-id>
```

---

## See Also

- [Conventional Commits](https://www.conventionalcommits.org)
- [Changesets](https://github.com/changesets/changesets)
- [Linux Kernel: Submitting Patches](https://www.kernel.org/doc/html/latest/process/submitting-patches.html)
- [Developer Certificate of Origin](https://developercertificate.org)
- [How to Write a Git Commit Message — Chris Beams](https://cbea.ms/git-commit/)
