---
"@tyler.given/best-practices": minor
---

feat(postinstall): three-way manifest-based conflict detection for standalone files

Replace the simple "content differs → prompt y/n" overwrite check with a
full three-way merge algorithm backed by a per-target `.install-manifest.json`
file (stored in each skill directory: `~/.copilot/skills/best-practices/` and
`~/.claude/skills/best-practices/`).

**How it works**

On each install the manifest records `{ upstream, disk }` sha256 hashes for
every standalone file (`SKILL.md`, `README.md`, `categories.md`). The
five-case logic on reinstall:

- **A** File doesn't exist → silent copy
- **B** Disk already matches source → no-op
- **C** Package updated, user unchanged → silent update
- **D** Package unchanged, user has their own version → silently preserve (any
  number of reinstalls — fixes a repeated-install false-conflict bug)
- **E** Both sides differ, or no manifest entry → prompt: keep / replace / amend

**Amend resolution** writes the package version as `<file>.incoming` alongside
the existing file so the user can diff and merge manually.

**Pass 2** handles files that appear in the manifest but are no longer provided
by the package (upstream-deleted): silently delete if unmodified, otherwise
prompt. User-added files not in the manifest are left untouched (home-dir
courtesy).

**Force flag**: `BEST_PRACTICES_OVERWRITE=1` bypasses all prompts (existing
env var repurposed as the force-replace mechanism).

**Non-TTY / CI**: `defaultConflictPrompt` returns `keep` without readline —
safe default, never blocks CI.

**Testability**: `postinstall.js` now guards execution with
`if (require.main === module)` and exports `hashContent`, `readManifest`,
`writeManifest`, `defaultConflictPrompt`, and `installStandaloneFile` for
unit testing.

**New tests** (`tests/conflict.test.js` — 20 tests): all five cases,
Case D repeated-install stability regression, forceReplace override, amend
`.incoming` creation, no-source skip, per-target manifest isolation,
malformed/null manifest recovery, and require.main guard verification.
