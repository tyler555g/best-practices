---
name: best-practices
description: Comprehensive knowledge base of human best practices across all domains — from engineering and medicine to personal finance and sustainability
tags: [best-practices, knowledge-base, standards, guidelines, ethics, sustainability]
---

# Best Practices Knowledge Base

A structured, browsable collection of best practices covering every major domain of human knowledge and activity.

## When to Use This Skill

Invoke this skill when:
- You need **established best practices** for a specific discipline or task
- You're making decisions about **process, methodology, or standards**
- You need to check whether an approach follows **industry or community standards**
- You're advising on **AI-human interaction**, **git workflows**, **open source**, or **sustainable practices**
- You want to ensure your output aligns with **ethical defaults and principles**

## Available Content

The knowledge base ships only populated domains. Currently available:

### technology_and_information/data_science_and_ai/
- `technology_and_information/data_science_and_ai/ai-agent-development.md` — AI agent development (12-Factor Agents, attribution, workflows)
- `technology_and_information/data_science_and_ai/ai-assisted-development.md` — AI-assisted development (governance, safety, tool access controls)
- `technology_and_information/data_science_and_ai/ai-human-interaction-defaults.md` — 10 universal AI-human interaction rules
- `technology_and_information/data_science_and_ai/context-engineering.md` — Context engineering (primitives, pipeline, design principles)

### technology_and_information/information_technology/
- `technology_and_information/information_technology/api-design.md` — API design best practices
- `technology_and_information/information_technology/auto-scaling.md` — Auto-scaling patterns
- `technology_and_information/information_technology/background-processing.md` — Background processing
- `technology_and_information/information_technology/caching.md` — Caching strategies
- `technology_and_information/information_technology/cloud-design-patterns.md` — Cloud design patterns
- `technology_and_information/information_technology/data-partitioning.md` — Data partitioning
- `technology_and_information/information_technology/devops.md` — DevOps practices
- `technology_and_information/information_technology/domain-driven-design.md` — Domain-driven design
- `technology_and_information/information_technology/git-workflow.md` — Git workflow and Conventional Commits
- `technology_and_information/information_technology/github_branch_protection.md` — GitHub branch protection and rulesets
- `technology_and_information/information_technology/http-standards.md` — HTTP standards
- `technology_and_information/information_technology/monitoring-and-observability.md` — Monitoring and observability
- `technology_and_information/information_technology/npm-package-development.md` — npm package development
- `technology_and_information/information_technology/open-source-contribution.md` — Open source contribution
- `technology_and_information/information_technology/resilience-and-fault-handling.md` — Resilience and fault handling
- `technology_and_information/information_technology/software-antipatterns.md` — Software performance antipatterns
- `technology_and_information/information_technology/software-architecture-styles.md` — Software architecture styles
- `technology_and_information/information_technology/software-design-principles.md` — Software design principles
- `technology_and_information/information_technology/twelve-factor-app.md` — The Twelve-Factor App

### technology_and_information/cybersecurity_and_privacy/
- `technology_and_information/cybersecurity_and_privacy/tls-and-authentication-standards.md` — TLS and authentication standards

### technology_and_information/telecommunications_and_networking/
- `technology_and_information/telecommunications_and_networking/dns-operations.md` — DNS operations
- `technology_and_information/telecommunications_and_networking/email-operations.md` — Email operations
- `technology_and_information/telecommunications_and_networking/internet-protocol-operations.md` — Internet protocol operations

### agents/
- `agents/rubber_duck_agent.md` — Rubber Duck Agent (Socratic PR reviewer)
- `agents/code_review_agent.md` — Code Review Agent (per-file-type checker)

### Root-level:
- `categories.md` — Comprehensive life best-practice categories taxonomy

## Navigation

Browse content using file paths relative to the package root:

```
# List all available content
ls technology_and_information/data_science_and_ai/
ls technology_and_information/information_technology/
ls agents/

# Read a specific best-practices document
cat technology_and_information/information_technology/git-workflow.md
cat technology_and_information/data_science_and_ai/context-engineering.md
cat agents/rubber_duck_agent.md
cat categories.md
```

## Full Structure

For the complete domain/subdirectory taxonomy (10 domains, ~100 subdisciplines), see **categories.md**.

For the comprehensive life-category taxonomy (20 categories, ~150 subcategories), see **categories.md**.

As domains are populated with content in future releases, they become available automatically via `npm update`.

## Key Principles

This knowledge base is built on:
1. **Accuracy over volume** — only established, well-sourced practices
2. **Practical over theoretical** — field guides, not textbooks
3. **Discipline-agnostic structure** — every domain follows the same organizational pattern
4. **Living content** — continuously expanded via feature branches and draft PRs
