# @tyler.given/best-practices-config

**CI/Docker-safe** explicit installer for the [best-practices](https://github.com/tyler555g/best-practices) knowledge base.

Unlike [`@tyler.given/best-practices`](https://www.npmjs.com/package/@tyler.given/best-practices), this package has **no `postinstall` script** and makes **no home-directory writes**. Content is installed only when you explicitly run the setup command.

## Use cases

- CI pipelines (`npm install` without side effects)
- Docker images (no home-dir pollution)
- Per-repo devDependency (install content into a project-local path)
- Environments without interactive TTY

## Install

```bash
npm install --save-dev @tyler.given/best-practices-config
```

## Usage

```bash
# Interactive — choose domains, install to ./best-practices/
npx @tyler.given/best-practices-config setup

# Specify target directory
npx @tyler.given/best-practices-config setup --target .ai/skills/best-practices

# CI mode — installs all available domains non-interactively (CI env var set automatically)
npx @tyler.given/best-practices-config setup --target .ai/skills/best-practices
```

## What gets installed

- `SKILL.md` — skill definition (agent navigation + invocation guide)
- `categories.md` — full domain taxonomy reference
- `technology_and_information/` — IT, cybersecurity, data science, AI, git workflow, etc.
- Additional domains based on your selection (or all available in CI mode)

## Differences from `@tyler.given/best-practices`

| Feature | `@tyler.given/best-practices` | `@tyler.given/best-practices-config` |
|---|---|---|
| Auto-install on `npm install` | ✅ Yes | ❌ No |
| Writes to `~/.copilot/` / `~/.claude/` | ✅ Yes | ❌ No |
| CI safe | ⚠️ Warns, skips conflicts | ✅ Always safe |
| Explicit `--target` dir | ❌ No | ✅ Yes |
| Injects AI-human defaults | ✅ Yes | ❌ No |

## Source

Part of the [tyler555g/best-practices](https://github.com/tyler555g/best-practices) repository.
