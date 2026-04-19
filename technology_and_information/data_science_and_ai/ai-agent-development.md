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

## Open Source AI Projects

- Contribute improvements back to upstream before publishing independently
- See [open-source-contribution.md](open-source-contribution.md)

## See Also
- [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) — HumanLayer
- [12factor.net](https://12factor.net) — Original 12-Factor App (Heroku)
- [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — Anthropic
