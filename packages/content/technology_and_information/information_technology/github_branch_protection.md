# GitHub Branch Protection Best Practices

## Rulesets vs. Legacy Branch Protection Rules

GitHub Rulesets (GA 2023) supersede legacy Branch Protection Rules. **Prefer rulesets for
all new configuration.** Legacy rules still work but lack priority ordering, audit visibility,
and path- or actor-scoped conditions.

| Feature | Legacy Branch Protection | Rulesets |
|---|---|---|
| Scope | Single branch/pattern | Multi-branch, multi-repo, org-wide |
| Priority ordering | No | Yes |
| Bypass actors | Admins only | Fine-grained (teams, roles, apps) |
| Enforcement modes | Enforce or off | `active`, `evaluate` (shadow), `disabled` |
| Audit log | Limited | Full evaluation log |
| Future support | Being phased out | Yes — invest here |

Use `evaluate` mode to shadow-test a new ruleset before enabling enforcement.

---

## Core Rules — Default / Main Branch

Apply to `main`, `master`, or any branch that gates releases.

### Required

| Rule | Setting |
|---|---|
| Require pull request before merging | Enabled |
| Required approvals | ≥ 1 (solo); ≥ 2 (team); ≥ 2 (release-critical) |
| Dismiss stale reviews on new commits | Enabled |
| Require review from code owners | Enabled (when CODEOWNERS exists) |
| Require status checks to pass | Enabled — list every mandatory CI check explicitly |
| Require branches to be up to date | Enabled |
| Block force pushes | Enabled |
| Block branch deletion | Enabled |
| Include administrators | Enabled (legacy) / no admin bypass actors (rulesets) — no implicit admin exemption day-to-day |

> **Legacy vs rulesets:** In legacy branch protection, "Include administrators" is a checkbox — enable it so admins follow the same rules. In rulesets, the equivalent is simply not granting any admin bypass actor. For genuine emergencies, a specific admin can be temporarily granted bypass actor status in a ruleset (or the checkbox unchecked in legacy) — but this must be audited. See [Bypass Actors](#bypass-actors) for governance guidance.

### Recommended

| Rule | Setting |
|---|---|
| Require signed commits | Enabled — GPG or SSH signing |
| Require linear history | Optional — enforces rebase/squash merge strategy |
| Require deployments to succeed | Enable if you gate on staging environments |

---

## Core Rules — Release / Long-Lived Branches

Branches like `release/*`, `v2.x`:

- Require PR + 1 approval minimum
- Require status checks
- Block force pushes and deletion
- Code owners optional but recommended for changelog/version files

---

## Core Rules — Feature Branches

Do **not** apply protection to `feat/*`, `fix/*`, `chore/*` — these are personal working
branches. Protect only branches that merge into protected targets.

---

## CODEOWNERS

Create `.github/CODEOWNERS` to auto-assign reviewers by path. Required reviews from code
owners are enforced by the ruleset when "Require review from code owners" is enabled.

```
# Root config files — requires maintainer review
/*.json        @org/maintainers
/.github/      @org/maintainers

# Content additions need content owner sign-off
/packages/content/   @org/maintainers

# Workflow changes are privileged — restricted to maintainers
/.github/workflows/  @org/maintainers
```

Keep CODEOWNERS minimal. Over-specifying creates review bottlenecks.

---

## Status Checks

Only checks that are **always** run should be required. Optional or conditional jobs that
are skipped or excluded never report a status — a required check that never reports stays
in "expected" state and blocks the PR from merging entirely.

```
# Example: required checks in ruleset
- "test (ubuntu-latest)"
- "lint"
- "build"
```

Best practices:
- Name checks consistently across branches so the ruleset pattern matches reliably
- Never require checks from forks you don't control
- Re-run failed checks before assuming a flake; flaky CI blocks legitimate merges

---

## Signed Commits

```bash
# Generate a signing key
gpg --full-generate-key

# Configure git to sign all commits
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true

# Or use SSH signing (simpler, supported since Git 2.34)
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519   # private key path
git config --global commit.gpgsign true
# Note: if using ssh-agent, the public key path (~/.ssh/id_ed25519.pub) also works
```

Add the key to GitHub under **Settings → SSH and GPG keys**:
- **GPG:** click **New GPG key**, paste the armored public key block
- **SSH:** click **New SSH key**, set key type to **Signing Key**, paste the public key

---

## Bypass Actors

Rulesets allow specific actors to bypass rules. Use sparingly:

| Actor | Bypass scope | Rationale |
|---|---|---|
| Release automation bot | Force push to `release/*` | Version bump commits |
| Dependabot | Required reviews bypass | Dependabot cannot respond to review requests; CI status checks must still pass. Note: "patch-only" scoping requires separate automation (e.g., an auto-approve workflow gated on semver type) |
| Repository admin | Emergency hotfix | Break-glass — audit every use |

Never grant blanket admin bypass on `main`. If you need it, you're missing a workflow.

---

## Enforcement Tiers

### Solo / Personal Project

```
main:
  - Require PR (1 approval — yourself via a second review if desired, or skip)
  - Require status checks (CI must pass)
  - Block force push + deletion
  - Signed commits recommended
```

### Small Team (2–10)

```
main:
  - Require PR, 1–2 approvals
  - Dismiss stale reviews
  - Require code owner review
  - Require status checks + up-to-date branch
  - Block force push + deletion
  - Include administrators
  - Signed commits
```

### Organization / Monorepo

```
org-level ruleset → all repos:
  - Block force push to default branch
  - Require signed commits
  - Minimum 1 PR approval

repo-level ruleset → main:
  - 2 approvals + code owner
  - Full status check suite
  - Include administrators
  - Bypass: release bot (force push only on release/*)

repo-level ruleset → .github/workflows/**:
  - Restrict pushes to maintainer team only
  - (Workflow files are privileged — they run with repo secrets)
```

---

## Audit & Maintenance

- Review protection rules quarterly — remove stale required checks for deleted CI jobs
- Check "Insights → Security" for any bypasses or override events
- Use the [Branch Protection API](https://docs.github.com/en/rest/branches/branch-protection)
  or [Rulesets API](https://docs.github.com/en/rest/repos/rules) to manage rules as code
  (store in `.github/rulesets/` and apply via CI)
- Enable **Dependabot security updates** — PRs from Dependabot still go through branch
  protection, keeping the security supply chain intact

---

## See Also

- [GitHub Docs: About Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub Docs: About Protected Branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [CODEOWNERS syntax](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [git-workflow.md](./git-workflow.md) — commit and merge strategy
- [open-source-contribution.md](./open-source-contribution.md) — contributor workflow
