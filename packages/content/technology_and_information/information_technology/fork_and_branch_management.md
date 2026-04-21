# Fork and Branch Management Best Practices

This document covers the day-to-day operations of maintaining a fork: keeping `main` in sync with upstream, organizing feature branches, working with code across remotes, and branch hygiene.

For commit conventions, see [git-workflow.md](./git-workflow.md). For upstream PR etiquette, see [open-source-contribution.md](./open-source-contribution.md). For protecting branches, see [github_branch_protection.md](./github_branch_protection.md).

---

## The Golden Rule

**Your fork's `main` = upstream's `main`. Always.**

Your fork is a workspace, not a divergent project. `main` is a mirror — never commit to it directly. All your work lives on feature branches.

If `main` diverges, every future branch starts from the wrong base and every PR shows phantom diffs — changes you didn't make, inherited from a polluted `main`.

---

## Core Principles

| Principle | Rule | Why |
|---|---|---|
| Mirror main | Never commit directly to your fork's `main` | Prevents phantom diffs in PRs |
| One branch, one purpose | Each feature/fix/proposal gets its own branch | Keeps PRs focused and independently mergeable |
| Commits over stashes | Persist proposed changes as commits, not stashes | Stashes are invisible to collaborators and tools |
| Branch from upstream | Always `git checkout -b feat/x upstream/main` | Ensures clean base — no fork-only commits sneak in |
| Clean up after yourself | Delete merged/closed branches immediately | Prevents zombie branch accumulation |
| Name consistently | Follow `feat/`, `fix/`, `chore/` prefixes | Ties to [Conventional Commits](./git-workflow.md); scannable at a glance |

---

## Fork Setup & Configuration

### Adding Remotes

After cloning your fork, add the source repository as `upstream`:

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/REPO.git
git remote -v
# origin    https://github.com/YOU/REPO.git (fetch)
# origin    https://github.com/YOU/REPO.git (push)
# upstream  https://github.com/ORIGINAL_OWNER/REPO.git (fetch)
# upstream  https://github.com/ORIGINAL_OWNER/REPO.git (push)
```

Name remotes consistently: `origin` = your fork, `upstream` = source repo.

### Verifying Remotes

Always verify both remotes before starting work. Don't assume `origin/main` matches `upstream/main`.

```bash
# Confirm both remotes point where you expect
git remote -v

# Verify main is in sync
git fetch upstream
git rev-parse origin/main
git rev-parse upstream/main
# These MUST match if your fork is in sync
```

### Configuring Default Branch Tracking

```bash
# Make local main track upstream instead of origin
git branch --set-upstream-to=upstream/main main
```

This ensures `git pull` on `main` fetches from upstream, not your fork.

---

## Keeping Main In Sync

### The Sync Workflow

```bash
git checkout main
git fetch upstream
git reset --hard upstream/main
git push origin main --force-with-lease
```

Four commands. Run them as a unit. This is the only safe way to sync — never merge upstream into your fork's main.

### When to Sync

| Trigger | Action |
|---|---|
| Before creating any new branch | Always sync first |
| Before opening a PR | Sync, then rebase your feature branch |
| After upstream merges your PR | Sync to pick up the merge commit |
| Weekly (minimum) | Even if not actively working |

### When You've Fallen Behind

If `origin/main` has diverged (commits not in upstream):

```bash
# Check divergence
git log --oneline origin/main..upstream/main  # upstream is ahead
git log --oneline upstream/main..origin/main  # fork has extra commits (BAD)

# If fork has extra commits — rescue work first, then reset
git checkout -b rescue/stale-main-work origin/main  # save any work
git checkout main
git reset --hard upstream/main
git push origin main --force-with-lease
```

> **Real-world example:** A fork's main accumulated 7 infrastructure commits (changesets, commitlint config, npm package changes) that were never meant for upstream. Every feature branch created from that main carried phantom diffs. The fix: rescue any valuable work to a branch, then hard-reset main.

---

## Feature Branch Organization

### Creating Feature Branches

Always branch from `upstream/main`, not `origin/main`:

```bash
git fetch upstream
git checkout -b feat/my-feature upstream/main
```

- ❌ `git checkout -b feat/my-feature origin/main` — may include fork-only commits
- ✅ `git checkout -b feat/my-feature upstream/main` — guaranteed clean base

### Naming Conventions

| Prefix | Use | Maps to Conventional Commit |
|---|---|---|
| `feat/` | New features, enhancements | `feat:` |
| `fix/` | Bug fixes | `fix:` |
| `docs/` | Documentation changes | `docs:` |
| `chore/` | Maintenance, tooling | `chore:` |
| `refactor/` | Code restructuring | `refactor:` |
| `shelved/` | Declined or deferred work | N/A — archival prefix |

See [git-workflow.md](./git-workflow.md) for the full Conventional Commits specification.

### One Branch Per Logical Change

- ❌ One branch with docs + infrastructure + feature changes → large unfocused PR
- ✅ Separate branches: `docs/readme-updates`, `feat/new-feature`, `chore/ci-setup`

Maintainers review and merge at the PR level. A PR with 5 unrelated changes forces an all-or-nothing decision. Separate branches let maintainers accept what works and decline what doesn't.

> **Real-world example:** A 12-file PR mixed documentation improvements with infrastructure changes (npm packaging, CI config, README rewrites). The maintainer declined the infrastructure but identified 5 content improvements worth merging. A new focused branch was created from `upstream/main` with only the accepted changes — clean, focused, and easy to merge.

---

## Working With Code Across Remotes

### Checking What's Different

```bash
# What does upstream have that I don't?
git log --oneline main..upstream/main

# What does my branch have that upstream doesn't?
git log --oneline upstream/main..feat/my-feature

# Full diff between your branch and upstream
git diff upstream/main..feat/my-feature --stat
```

### Rebasing Feature Branches on Updated Upstream

```bash
# After syncing main
git checkout feat/my-feature
git rebase upstream/main
# Resolve conflicts if any
git push origin feat/my-feature --force-with-lease
```

This is rebasing a **personal feature branch** (safe). Never rebase shared/public branches. See [git-workflow.md](./git-workflow.md) for the merge-vs-rebase decision matrix.

### Cherry-Picking From Declined PRs

When a large PR is partially accepted, extract the accepted changes into a new focused branch:

```bash
# Create a new focused branch from clean upstream
git fetch upstream
git checkout -b feat/focused-changes upstream/main

# Apply only the accepted changes
# Option 1: Cherry-pick specific commits
git cherry-pick <commit-sha>

# Option 2: Manually apply changes (when commits are mixed)
# Edit files directly, then commit

# Push and open a new PR with only the accepted scope
git push origin feat/focused-changes
```

---

## Shelving Proposed Changes

### Commits Over Stashes

| Method | Visible to others? | Survives branch deletion? | Searchable? |
|---|---|---|---|
| `git stash` | ❌ | ❌ | ❌ |
| Commit on a branch | ✅ | ✅ (if pushed) | ✅ |
| Draft PR | ✅ | ✅ | ✅ |

If a change is worth keeping, it's worth committing. Stashes are for temporary local work only — never use them to persist proposed changes.

### Draft PRs as Change Containers

- Use draft PRs to park proposed changes that aren't ready for review
- The PR description documents the change's intent and context
- Draft PRs are searchable, commentable, and visible to collaborators
- The human promotes to ready when appropriate

### Separating Declined Work

When upstream declines a change, don't delete it — shelve it:

```bash
# Keep declined work on its own branch
git checkout -b shelved/infrastructure-changes
git push origin shelved/infrastructure-changes
# Close the PR but keep the branch as a record
```

Use the `shelved/` prefix for branches containing work that was explicitly declined or deferred. This distinguishes archival branches from active feature work.

---

## Branch Hygiene

### Deleting Merged Branches

```bash
# After PR is merged upstream
git branch -d feat/my-feature              # delete local
git push origin --delete feat/my-feature   # delete remote
```

Do this immediately after merge/close. Don't let branches accumulate.

### Periodic Cleanup

```bash
# Prune remote tracking branches that no longer exist
git fetch --prune origin
git fetch --prune upstream

# Find local branches already merged into main
git branch --merged main

# Delete all merged local branches (except main)
git branch --merged main | grep -v 'main' | xargs git branch -d
```

### Branch Audit

Run monthly for active forks, quarterly for dormant ones:

```bash
# List all branches with last commit date
git for-each-ref --sort=-committerdate refs/heads/ \
  --format='%(committerdate:short) %(refname:short)'

# List all remote branches
git for-each-ref --sort=-committerdate refs/remotes/origin/ \
  --format='%(committerdate:short) %(refname:short)'
```

### Stale Branch Decision Framework

| Last Activity | Has Open PR? | Action |
|---|---|---|
| < 30 days | Yes | Keep |
| < 30 days | No | Review — open PR or delete |
| 30–90 days | Yes | Check if PR is still relevant |
| 30–90 days | No | Delete unless `shelved/` |
| > 90 days | Any | Delete (move to `shelved/` first if valuable) |

---

## Common Pitfalls

### Committing Directly to Main

**Problem:** Adding "just one quick change" to `main`. This diverges your fork from upstream.

**Fix:** Always create a branch, even for one-line changes. The branch is cheap; the diverged main is expensive.

### Phantom Diffs in PRs

**Problem:** Your PR shows changes you didn't make — leftover from a diverged `main`.

**Fix:** Ensure your branch is based on `upstream/main`, not a diverged `origin/main`.

```bash
# Check if your branch has unexpected commits
git log --oneline upstream/main..HEAD
# Should show ONLY your changes
```

### Zombie Branches

**Problem:** Old branches accumulate — some merged, some abandoned, some from closed PRs.

**Fix:** Delete branches immediately after PR merge/close. Run periodic cleanup. Use the stale branch decision framework above.

### Large Unfocused PRs

**Problem:** A single PR with docs + infrastructure + features. Maintainer can't accept the good without the bad.

**Fix:** One branch per logical change. If a PR is declined, extract the accepted parts into a new focused PR on a new branch.

### Losing Track of Remotes

**Problem:** Forgetting which remote is the fork vs upstream, or having stale remote URLs.

**Fix:** Always verify with `git remote -v` before operations. Name remotes consistently: `origin` = your fork, `upstream` = source repo.

---

## Fork Health Checklist

Run this audit periodically to keep your fork healthy:

- [ ] `origin/main` matches `upstream/main` exactly (`git rev-parse` both SHAs)
- [ ] No commits on `main` that aren't in upstream (`git log upstream/main..origin/main` returns empty)
- [ ] All active branches have corresponding open PRs or clear purpose
- [ ] No branches older than 90 days without `shelved/` prefix
- [ ] Remote tracking branches pruned (`git fetch --prune`)
- [ ] All merged/closed PR branches deleted (local + remote)
- [ ] Remotes verified (`git remote -v` shows correct URLs)

---

## See Also

- [git-workflow.md](./git-workflow.md) — commit conventions, merge vs rebase, branching naming
- [github_branch_protection.md](./github_branch_protection.md) — protecting branches, required reviews, enforcement tiers
- [open-source-contribution.md](./open-source-contribution.md) — upstream PR etiquette, attribution, licensing
- [GitHub Docs — Fork a Repo](https://docs.github.com/en/get-started/quickstart/fork-a-repo)
- [GitHub Docs — Syncing a Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork)
