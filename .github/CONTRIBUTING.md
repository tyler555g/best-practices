# Contributing

## Commit Message Format

PR title = commit subject line. Format:

```
<type>(<scope>): <short imperative summary>
```

- Subject line ≤ 75 chars, imperative mood ("add" not "added")
- Body explains **why**, not what — wrap at 75 chars
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `ci`, `chore`

See `packages/content/technology_and_information/information_technology/git-workflow.md`
for the full commit message standard.

## Merging PRs

Use **Squash and merge** for PRs with WIP or interim commits.
Use **Create a merge commit** for PRs with clean, intentional commit history.

GitHub is configured to pre-fill the squash/merge commit dialog from
the PR title and description — write the PR description as the commit
body from the start (why-focused, 75-char wrap).

## Repository Settings

The following settings are applied to this repo and should be
re-applied if the repo is ever re-created or transferred:

| Setting | Value | Why |
|---|---|---|
| Allow squash merging | Enabled | Preferred strategy for messy branch history |
| Squash commit title | PR title | Subject line is already in the correct format |
| Squash commit message | PR body | Body is already written as a commit body |
| Allow merge commits | Enabled | Preferred strategy for clean branch history |
| Merge commit title | PR title | Consistent with squash default |
| Merge commit message | PR body | Consistent with squash default |
| Allow rebase merging | Disabled | Repo follows merge-always philosophy |

To reapply via GitHub CLI:

```sh
gh api repos/OWNER/REPO --method PATCH \
  -f squash_merge_commit_title=PR_TITLE \
  -f squash_merge_commit_message=PR_BODY \
  -f merge_commit_title=PR_TITLE \
  -f merge_commit_message=PR_BODY \
  -F allow_rebase_merge=false
```

## Branch Protection

See `packages/content/technology_and_information/information_technology/github_branch_protection.md`
for the branch protection strategy applied to this repo.
