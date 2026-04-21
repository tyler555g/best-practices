---
mode: agent
description: Create a new best-practices content document for the knowledge base
---

# Create Best Practice Document

Create a new best-practices document for the `{{domain}}/{{subdomain}}/` directory on the topic of **{{topic}}**.

## Requirements

1. **File location**: `packages/content/{{domain}}/{{subdomain}}/{{filename}}.md`
2. **File naming**: Use kebab-case, lowercase (e.g., `cloud-design-patterns.md`)
3. **No YAML frontmatter** — start directly with an H1 heading

## Content Structure

Follow this progressive disclosure pattern (headers → bullets → tables → references):

```
# Topic Name

One-paragraph overview defining the topic and why it matters.

---

## Core Principles / Fundamentals
(Establish the foundation — what every practitioner must know)

## Patterns / Standards / Methodologies
(Proven approaches — tables, bullet lists, code examples where applicable)

## Anti-Patterns / Common Mistakes
(What NOT to do and why — use ❌/✅ markers where helpful)

## See Also
(Cross-references to sibling docs using relative links + external authoritative sources)
```

## Content Guidelines

- Write for a **knowledgeable generalist** — assume intelligence, not prior expertise
- Prefer **concise, scannable** content: headers, bullets, tables
- **Cite sources** — reference standards bodies, research, or authoritative publications with links
- **Avoid opinion** — if something is contested, present the range of views
- Focus on **timeless fundamentals** over trends (note emerging topics where relevant)
- Cross-reference sibling docs with **relative links** (e.g., `[git-workflow.md](./git-workflow.md)`)

## Sources to Consult

{{#if sources}}
Use these sources as primary references:
{{sources}}
{{else}}
Research authoritative sources for this topic. Prioritize:
- Standards bodies (IETF, IEEE, W3C, OWASP, etc.)
- Canonical texts and their authors
- Peer-reviewed research
- Established industry frameworks
{{/if}}

## After Creating

1. Verify the file follows the structure above
2. Check that all cross-references resolve to existing files
3. Note: SKILL.md and agent mappings may need updating separately
