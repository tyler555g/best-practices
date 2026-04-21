# AI Agent Development Best Practices

## 12-Factor Agents

Apply the **[12-Factor Agents](https://github.com/humanlayer/12-factor-agents)** framework (Dex Horthy / HumanLayer) when building LLM-powered applications.

Key factors most relevant to AI memory and task systems:

| Factor | Principle | Application |
|--------|-----------|-------------|
| F3 | Own Your Context Window | Search before create; structure notes for retrieval, not storage |
| F5 | Unify Execution State and Business State | The note IS the state — don't maintain status in two places |
| F6 | Launch / Pause / Resume | Explicit pause protocol before compaction; explicit resume protocol on start |
| F9 | Compact Errors Into Context | Reflect = distill signal, discard noise; remove resolved error traces |
| F12 | Make Your Agent a Stateless Reducer | Session start = read state; session end = write state; never rely on in-context memory across sessions |

Reference: https://github.com/humanlayer/12-factor-agents

## AI Attribution

Always attribute AI contributions in commits and PRs:

```
Co-authored-by: GitHub Copilot CLI v1.0.32 (claude-sonnet-4.6) <223556219+Copilot@users.noreply.github.com>
Copilot-Session: <session-id>
```

- Include model name and version
- Include session ID for traceability
- Attribute sub-agents separately if they performed distinct work
- Reference frameworks and methodologies used (with links to original sources)

## AI-Assisted Coding Workflow

### Human Review is Required

**Always review AI-generated output before considering it complete.**

- AI produces a first draft — you are the final decision-maker
- Review diffs, PRs, and generated files before approving or merging
- Do not rely on the AI's own "verification" as a substitute for your own eyes

### You Tag, Not the AI

**Never let AI tag repo owners, maintainers, or reviewers on a PR/issue.**

- AI should open PRs as **draft** or leave them requiring your explicit promotion
- You decide when work is ready for external review
- You @mention maintainers and add reviewers — not the AI
- This prevents unsolicited pings and represents you professionally

### Workflow Pattern
```
AI implements → you review → you decide it's ready → you tag maintainer
```

## Open Source AI Projects

- Contribute improvements back to upstream before publishing independently
- See [open-source-contribution.md](open-source-contribution.md)

## Copilot Skill Naming Convention

### Convention

| Location | Pattern | Example |
|----------|---------|---------|
| Standalone repo | `skill-<name>` | `skill-secret-management` |
| npm package | `@<scope>/skill-<name>` | `@tyler.given/skill-secret-management` |
| Local directory basename | `<name>` | `secret-management/` (under `~/.copilot/skills/`, `~/.claude/skills/`, etc.) |
| SKILL.md `name` field | `<name>` | `secret-management` |
| Confluence page title | `Skill | <name>` | `Skill | secret-management` |

### Rules

- The `<name>` portion must be **consistent across ALL locations**
- Use **kebab-case** for names (lowercase, hyphens between words)
- The `skill-` prefix appears only on repos and npm packages — not in the SKILL.md name, local directory, or Confluence title
- The Confluence title uses the `Skill | ` prefix (pipe-delimited) for discoverability in search
- Use `skill-<name>` for standalone skill repos; in monorepos, apply the convention to each package directory and SKILL.md rather than the repo root
- Prefer capability-scoped names; use compound names only when the skill is intentionally one combined capability (e.g., `secret-management`, not `secret-management-and-rotation`)

### Why

Consistent naming enables automation (install scripts, skill discovery, updates), prevents confusion when referencing skills across contexts, and makes it possible to map between repo ↔ package ↔ local install ↔ docs by convention alone.

## See Also
- [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) — HumanLayer
- [12factor.net](https://12factor.net) — Original 12-Factor App (Heroku)
- [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — Anthropic
