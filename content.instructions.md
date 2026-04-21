# Content Instructions
<!-- Scope: packages/content/**/*.md -->

## Content Guidelines

- Write for a **knowledgeable generalist** — assume intelligence, not prior expertise
- Prefer **concise, scannable** content: headers, bullets, tables
- Cite standards bodies, research, or authoritative sources
- Avoid opinion — present the range of views if contested

## File Naming

- Use **kebab-case** for new files (e.g., `ai-agent-development.md`, `git-workflow.md`)
- Be descriptive and specific
- Legacy exception: `information_technology/github_branch_protection.md` uses underscores; keep existing references accurate but do not use underscores in new files

## What Belongs in Each Subdirectory

- **Core principles** — foundational rules and values of the discipline
- **Standards & frameworks** — established industry or academic standards
- **Common patterns** — proven approaches and methodologies
- **Anti-patterns** — what NOT to do, and why
- **Checklists** — actionable step-by-step references
- **Glossary** — key terminology defined clearly

## Scope Boundaries

- **In scope**: Established best practices, standards, frameworks, principles, methodologies
- **Out of scope**: News, current events, product reviews, marketing content, pure theory with no practical application

## Format Requirements

- No YAML frontmatter on regular content docs; `SKILL.md` and `categories.md` are explicit exceptions that require metadata frontmatter
- Cross-reference sibling docs with relative links
- Use markdown headers for structure
- Include code examples where applicable

## Content Structure

Each domain (`packages/content/{domain}/`) should contain focused, actionable content that answers: **"What does good look like here?"**