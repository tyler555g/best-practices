# @tyler.given/best-practices-content

Markdown knowledge-base content for the [`@tyler.given/best-practices`](https://www.npmjs.com/package/@tyler.given/best-practices) skill.

This is a **data-only package** — no executable code. It exists so that other packages (e.g. `best-practices-code-review`, `best-practices-rubber-duck`) can consume the content files without triggering the postinstall side-effects of the parent package.

## Contents

| Path | Description |
|------|-------------|
| `SKILL.md` | Copilot CLI / Claude Code skill descriptor |
| `README.md` | This file — package overview |
| `categories.md` | Full life-category taxonomy (20 categories, ~150 subcategories) |
| `agents/` | Agent prompt templates |
| `technology_and_information/` | Currently populated domain content |

### technology_and_information/

- `information_technology/git-workflow.md` — Git workflow standards, Conventional Commits
- `information_technology/open-source-contribution.md` — Open source contribution best practices
- `data_science_and_ai/ai-agent-development.md` — AI-assisted coding workflow, feature branches, draft PRs
- `data_science_and_ai/ai-human-interaction-defaults.md` — 10 universal rules for AI-human interaction

## Usage

This package is installed automatically when you install `@tyler.given/best-practices`. You generally do not need to install it directly.

To consume the content files in your own package:

```js
const path = require('path');
const contentRoot = path.dirname(require.resolve('@tyler.given/best-practices-content/package.json'));
```

## License

MIT
