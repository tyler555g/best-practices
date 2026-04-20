# Context Engineering

Context engineering is the discipline of designing, building, and maintaining the complete information environment an LLM operates within. It goes beyond what you type into a prompt — it encompasses everything the model can see, how that information is selected, and what is deliberately kept out.

---

## 1. Origin and Definition

### 1.1 How the Term Emerged

On June 19, 2025, Shopify CEO Tobi Lütke [tweeted](https://glasp.co/articles/context-engineering) that he preferred the term "context engineering" over "prompt engineering" — arguing that the real skill was not writing clever prompts but architecting the entire information environment around the model. Within days, Andrej Karpathy [amplified the idea](https://unrollnow.com/status/1937902205765607626) with a hardware analogy that stuck: the LLM is the CPU, the context window is RAM, and RAG is the filesystem. His [YC keynote](https://www.ycombinator.com/library/MW-andrej-karpathy-software-is-changing-again) framed this as "Software 3.0" — a paradigm where natural-language context replaces much of traditional code.

[Simon Willison](https://simonwillison.net/2025/Jun/27/context-engineering/) then formalized the working definition that the community converged on: *"the delicate art and science of filling the context window with just the right information for the next step."* [Philipp Schmid](https://www.philschmid.de/context-engineering) decomposed it into seven components and declared that "the new skill in AI is not prompting — it's context engineering." [Harrison Chase at LangChain](https://www.langchain.com/blog/the-rise-of-context-engineering) operationalized it into a pipeline framework and crystallized the insight that had been nagging practitioners for months: *"Most LLM failures are context failures, not model failures."*

As [Drew Breunig observed](https://www.dbreunig.com/2025/07/24/why-the-term-context-engineering-matters.html), the term matters because bigger context windows didn't solve the curation problem — more space just made the *selection* problem harder.

### 1.2 Defining Context Engineering

A consensus definition, synthesized across sources:

> **Context engineering** is the systematic design of the information pipeline that assembles, selects, compresses, and isolates the right context for each step an LLM takes — encompassing instructions, retrieval, memory, tools, and the architecture that connects them.

The boundary with prompt engineering is one of scope: **prompt engineering ⊂ context engineering**. Prompt engineering is writing good prompts. Context engineering is designing the *system* that assembles the right context at the right time — of which the prompt is one component among many. [Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) demonstrated this concretely, reporting a 54% benchmark improvement from context curation alone, with no change to the underlying model.

### 1.3 Why It Matters Now

- [Gartner](https://www.gartner.com/en/articles/context-engineering) declared 2026 the "Year of Context," identifying CE as the engineering competency replacing prompt engineering in enterprise AI strategy.
- [Forrester](https://www.forrester.com/blogs/2025-the-year-context-became-king-and-how-developers-are-wielding-it/) reported 3–10× task success improvement from context architecture versus prompt optimization alone.
- Academic research caught up rapidly: [Mei et al.](https://arxiv.org/abs/2507.13334) published a 166-page survey with over 1,400 references establishing a formal taxonomy. The [ACE framework](https://arxiv.org/abs/2510.04618) from Stanford and SambaNova demonstrated self-improving agents through context curation. A [128-paper meta-review](https://doi.org/10.32604/cmc.2025.074081) cataloged 37 defense strategies and identified architectural data/instruction separation as the key unsolved challenge.

---

## 2. The Canonical Pipeline: Write → Select → Compress → Isolate

The four-stage pipeline — introduced by [LangChain](https://www.langchain.com/blog/context-engineering-for-agents) and [Redis](https://redis.io/blog/context-engineering-best-practices-for-an-emerging-discipline/) — provides the mental model for all context engineering work. Each stage has a distinct purpose, a primary security concern, and characteristic anti-patterns.

### 2.1 Write

Authoring context artifacts: instructions, rules, skills, prompt templates. These are the "source code" of your context system.

- **What**: Create well-structured, purpose-specific context documents
- **Security**: Authored context is your trust anchor. Treat it as production code — review in PRs, version in Git, restrict write access. If an attacker can modify authored context, all downstream behavior is compromised.
- **Anti-pattern**: Monolithic mega-prompts that try to cover every scenario in a single document. Decompose instead.

### 2.2 Select

Choosing which context to load for a given task. This is where retrieval (RAG), routing, and progressive disclosure live.

- **What**: Retrieve only the information needed for the current step
- **Security**: Selection is an injection surface. Retrieved content — from search indexes, databases, or user-supplied documents — is untrusted by default. Validate and isolate before inclusion. A [multi-institution benchmark](https://arxiv.org/abs/2511.15759) showed that multi-layer defense reduces RAG injection success from 73.2% to 8.7%.
- **Anti-pattern**: Loading the entire knowledge base into context "just in case." Progressive disclosure — metadata first, full content on demand — is the default pattern.

### 2.3 Compress

Reducing token consumption while preserving signal. Summarization, deduplication, structured output formatting.

- **What**: Distill verbose content into dense, high-signal representations
- **Security**: Compression can drop safety-critical context. Never compress security constraints, policy boundaries, or trust markers. Compressed content should retain its trust classification.
- **Anti-pattern**: Using raw conversation history as context. As the [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) framework notes (Factor 3), custom context formats outperform standard message arrays because they let you control what signal is preserved.

### 2.4 Isolate

Separating concerns so that context from one source cannot contaminate another. The architectural foundation of secure context engineering.

- **What**: Scope context to roles, tasks, or trust boundaries
- **Security**: Isolation enforces least-privilege. Untrusted tool output belongs in a separate channel from system instructions. This is the primary structural defense against prompt injection — the [CMC meta-review](https://doi.org/10.32604/cmc.2025.074081) identified architectural data/instruction separation as the most promising, and most difficult, open problem. A [dual-agent defense pattern](https://doi.org/10.3390/app16010085) places a validator agent between retrieval and generation as an output-level firewall.
- **Anti-pattern**: Concatenating user input, tool output, and system instructions into a single undifferentiated string.

---

## 3. Context Primitives Taxonomy

The building blocks of any context system. Each primitive has a distinct loading pattern, security posture, and use case. Descriptions here are tool-agnostic; concrete tool mappings appear in [§7](#7-tool-landscape-reference).

| # | Primitive | Loads | Security Posture | Use When |
|---|-----------|-------|-----------------|----------|
| 1 | **Instructions** | Always; injected at session start | Trust root — if compromised, all behavior is compromised. Version-control and review like production code. | Behavior must be consistent across all tasks |
| 2 | **Rules Files** | Triggered by file path or glob pattern | Treat as executable code during review — rules in untrusted repos can alter agent behavior. | Different parts of a project need different conventions |
| 3 | **Prompt Templates** | On explicit invocation | Templates with user-interpolated variables are injection vectors — sanitize inputs, use structured parameter passing. | Repeatable workflows (code review, commit messages, test generation) |
| 4 | **Skills** | Progressive disclosure — metadata always, body when relevant, resources on demand | Skills declare capabilities; the host enforces boundaries. A skill should never escalate its own privileges. | A capability must be portable across tools and contexts |
| 5 | **Memory** | Short-term: within session. Long-term: cross-session, retrieved on demand | Memory is a persistence channel — poisoned memories propagate across sessions. Validate, expire, and audit. | Agent must learn from past interactions or maintain continuity |
| 6 | **RAG** | Query-triggered; results injected as context | The #1 injection surface in production. Retrieved content is untrusted. Apply input sanitization, output validation, and content isolation. | Knowledge changes frequently or is too large to fit in context |
| 7 | **Tools / Function Calling** | Definitions always present; results injected per invocation | Highest-privilege primitive — executes real actions. Sandbox execution, validate parameters, enforce allowlists. Use container isolation ([ToolHive](https://github.com/stacklok/toolhive)) for untrusted servers. | Agent must take actions or access live data |
| 8 | **MCP** | Server discovery at session start; resources/tools enumerated on demand | External processes — apply zero-trust: authenticate, authorize, sandbox, audit. See [OWASP LLM Top 10](https://github.com/OWASP/www-project-top-10-for-large-language-model-applications). | Tool/resource access must work across multiple AI tools |
| 9 | **Hooks** | Event-driven; execute outside the model's context window | Most dangerous primitive — runs arbitrary code with agent permissions. Audit, sign, and restrict to trusted authors only. | Enforcement (linting, validation, policy) and side effects (logging, metrics) |
| 10 | **Agents** | Spawned on demand with purpose-built context windows | Sub-agents inherit trust from parent but should receive *less* context, not more. Apply least-privilege per agent. | Task decomposes into independent subtasks with different context needs |

### Primitive Details

**Instructions** are the "constitution" of the agent — persistent behavioral rules that apply to every interaction. They set the tone, define constraints, and establish the trust root. Because instructions are loaded unconditionally, they occupy permanent space in the context window; keep them focused on behaviors that genuinely apply everywhere. Every tool has a mechanism for them (see [ai-human-interaction-defaults.md](ai-human-interaction-defaults.md) for a cross-tool mapping). [Google's system instruction guidance](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/system-instructions) recommends one agent per system instruction set; when you need divergent behaviors, use separate agents rather than conditional logic within a single instruction block.

**Rules files** provide project- or directory-scoped overrides — more granular than global instructions. They allow a monorepo to carry different conventions for its frontend, backend, and infrastructure code without polluting each other's context. The key security consideration is that rules files in third-party or untrusted repositories can alter agent behavior just as effectively as code changes. During code review, treat added or modified rules files with the same scrutiny you would give a new dependency. Cursor's `.mdc` format, for example, uses YAML frontmatter with glob patterns to scope rules to specific file types — a useful pattern, but one that means a malicious `.mdc` file can silently change how the agent handles targeted files.

**Prompt templates** are reusable, parameterized structures for common tasks. They standardize how the model is asked to perform repeatable work, reducing variance and improving auditability. The primary risk is injection through template variables: if a user-supplied value is interpolated directly into a prompt template without sanitization, it becomes an injection vector. Use structured parameter passing (typed fields, not string concatenation) wherever possible. [Grok's open-source Jinja2 templates](https://github.com/xai-org/grok-prompts) demonstrate the pattern of separating template structure from runtime parameters.

**Skills** ([Agent Skills specification](https://agentskills.io/specification)) are the emerging open standard for cross-tool knowledge units, backed by Microsoft, OpenAI, and Google through the [AAIF](https://github.com/agentskills/agentskills). A SKILL.md file teaches an agent *how* to perform a specific capability using a three-tier progressive disclosure pattern: Tier 1 (metadata/description) is always loaded, Tier 2 (full body) when the skill is relevant, Tier 3 (resources) on explicit demand. This pattern minimizes token cost while maximizing capability. [F5's analysis](https://www.f5.com/company/blog/agent-skills-an-emerging-open-standard) notes that skills are the fastest-standardized interface in AI tooling — a reflection of how urgently the ecosystem needs portable context units. The security model is declarative: a skill states what it can do; the host decides what it is *allowed* to do.

**Memory** comes in two forms. Short-term memory is the conversation buffer within a session — it grows automatically as the conversation progresses and is typically managed by the provider via truncation or compaction. Long-term memory persists across sessions — stored externally and retrieved on demand. [Google's AI Agents course](https://github.com/neurontist/Google-AI-Agents-Intensive-2025/blob/main/Context%20Engineering%3A%20Sessions%20%26%20Memory.md) identifies three pillars for stateful agents: context, sessions, and memory. Both memory channels are targets for poisoning: a malicious user who can write to long-term memory can influence all future sessions. Expiration policies, provenance tracking, and periodic audit are essential. Claude Code caps auto-memory at 25 KB and stores it alongside human-written `CLAUDE.md` files — a practical example of separating human-authored from machine-authored memory.

**RAG (Retrieval-Augmented Generation)** bridges static knowledge and live data by retrieving external content at inference time. It is also the most studied attack surface in production LLM systems. The [RAG injection benchmark](https://arxiv.org/abs/2511.15759) showed that without explicit defenses, injection success rates exceed 73%. Multi-layer defense — input sanitization, content isolation, output validation — is not optional. [Sundeep Teki's framework](https://www.sundeepteki.org/blog/context-engineering-a-framework-for-robust-generative-ai-systems) positions RAG within a broader architecture that includes agentic retrieval and memory management, emphasizing that retrieval quality depends as much on the indexing pipeline as on the query.

**Tools and function calling** let the model invoke external capabilities: APIs, databases, file systems. [OpenAI's structured outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) and strict-mode function calling have made tool interfaces more reliable, but the security burden remains: tools execute real actions, and a compromised tool call can cause irreversible harm. [Anthropic's programmatic tool use pattern](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling) — where the model writes code to orchestrate tools rather than calling them directly — can reduce token consumption and improve reliability, but introduces its own risks: generated code must be sandboxed. Container isolation tools like [ToolHive](https://github.com/stacklok/toolhive) and [Greywall](https://github.com/GreyhavenHQ/greywall) provide runtime sandboxing for untrusted tool servers.

**MCP (Model Context Protocol)** is the universal interop layer connecting models to tools, resources, and prompts via a standardized protocol. It exposes three primitive types: Tools (actions the model can invoke), Resources (data the model can read), and Prompts (reusable prompt templates served by the server). The [2026 roadmap](https://a2a-mcp.org/blog/mcp-2026-roadmap) prioritizes stateless transports, agent-to-agent delegation, governance, and enterprise features. MCP is [converging](https://zylos.ai/research/2026-03-26-agent-interoperability-protocols-mcp-a2a-acp-convergence) with A2A and ACP under the Linux Foundation. Because MCP servers are external processes, they require zero-trust treatment: authenticate connections, authorize operations, sandbox execution, and audit all activity.

**Hooks** are lifecycle event handlers — code that runs at specific points (pre-tool-use, post-tool-use, session start, session stop). They execute outside the model's context window, making them invisible to the model but powerful for enforcement and side effects. Claude Code's hook system supports [self-evolving memory via Obsidian integration](https://www.mindstudio.ai/blog/self-evolving-claude-code-memory-obsidian-hooks) — an example of using hooks to build persistent knowledge graphs. Because hooks run arbitrary code with agent permissions, they demand the same rigor as any production deployment pipeline: review, sign, and restrict authorship.

**Agents** (sub-agents / orchestration) delegate subtasks to specialized agents, each with a scoped context window. [Anthropic's agent taxonomy](https://www.anthropic.com/engineering/building-effective-agents) defines a progression from augmented LLMs through workflows (chain, route, parallelize, orchestrate) to fully autonomous agents. The key principle: each sub-agent should receive the *minimum* context required for its specific subtask. A code-review agent does not need deployment credentials. A documentation agent does not need database access. Least-privilege scoping at the agent level is the most effective way to limit blast radius in multi-agent systems.

---

## 4. Failure Modes

When context engineering goes wrong, the symptoms are often subtle — the model doesn't crash, it just starts producing subtly wrong, inconsistent, or dangerous output. [Willison's failure modes catalog](https://simonwillison.net/2025/Jun/29/how-to-fix-your-context/) and [Kubiya's operational metrics](https://www.kubiya.ai/blog/context-engineering-best-practices) identify five recurring patterns:

| Failure Mode | Symptom | Root Cause | Remedy |
|---|---|---|---|
| **Context Rot** | Agent degrades over time; once-reliable workflows start failing | Stale instructions, outdated memory, accumulated noise | Freshness policies, expiration timestamps, CI testing of context artifacts |
| **Context Poisoning** | Agent produces harmful or factually wrong output | Malicious content injected via retrieved context, memory, or tool output | Input validation, content isolation, multi-layer defense, audit trails |
| **Context Distraction** | Agent loses focus; addresses irrelevant details; misses the actual task | Too much context loaded; signal drowned in noise | Aggressive selection, compression, progressive disclosure — less is more |
| **Context Confusion** | Agent contradicts itself or misinterprets instructions mid-task | Conflicting context from multiple sources without clear precedence | Priority ordering, isolation between sources, explicit conflict resolution rules |
| **Context Clash** | Rules from different scopes directly contradict each other | Layered rules without a precedence hierarchy | Explicit scope hierarchy with "most specific wins" or "last writer wins" policy |

Most failures trace back to two root causes: **violating isolation** (mixing trusted and untrusted content) or **overloading selection** (loading too much context). The remedy is almost always the same: decompose into smaller, scoped units. As [LangChain](https://www.langchain.com/blog/the-rise-of-context-engineering) puts it: if your agent is failing, the first question should be "what's in its context window?" — not "which model should I use?"

---

## 5. Design Principles

Six imperatives that guide context engineering practice. Each applies regardless of tool, framework, or model.

### 5.1 Decompose Relentlessly

Break monolithic context into composable, right-sized units. Each unit should have a single responsibility and a clear scope. Smaller units are easier to test, version, review, scope, and secure. Decomposition is the #1 structural defense against injection — an attacker who compromises one unit cannot reach another. In practice, this means: one rules file per concern, not one mega-file per project. One skill per capability, not one skill per team. One agent per subtask, not one agent that does everything. The [TOOL.md standard](https://github.com/AetharaAI/TOOL_STANDARD) demonstrates the payoff: a two-tier lazy-loading structure that achieves 90%+ token reduction compared to monolithic tool documentation.

### 5.2 Load Lazily, Discard Eagerly

Only load context when needed. Remove it when its purpose is served. Progressive disclosure is the default: load metadata first, full content when relevant, resources on explicit demand. Every token has a cost — latency, money, attention. [Anthropic's prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) reduces cost by 90% on cache hits, but only if the cached context is stable; thrashing context defeats caching. Unused context is worse than absent context because it actively dilutes signal and increases the risk of distraction failures ([§4](#4-failure-modes)).

### 5.3 Treat Context as Code

Version context artifacts in Git. Review changes in pull requests. Test in CI (see [§9](#9-context-as-code-operationalizing-ce)). Roll back on failure. Apply semantic diffing where possible — detect *intent* changes, not just text edits. Context controls agent behavior as directly as code does — unreviewed context changes are unreviewed behavior changes. This is a direct application of the principle that governs all AI-assisted development: the human reviews everything before it ships (see [ai-human-interaction-defaults.md](ai-human-interaction-defaults.md)). The [harness engineering](https://ai.gopubby.com/harness-engineering-what-every-ai-engineer-needs-to-know-in-2026-0ab649e5686a) movement extends this further, treating YAML/JSON context configuration as first-class deployment artifacts with their own CI/CD pipelines.

### 5.4 Separate Data from Instructions

Never mix untrusted content (user input, tool output, retrieved documents) with trusted instructions (system prompts, rules, policies). This is the architectural foundation of injection defense. When data and instructions share a channel, the model cannot reliably distinguish between them — and an attacker can craft data that the model interprets as instructions. The [ACL defense paper](https://aclanthology.org/2025.acl-long.897.pdf) by Chen et al. explores "attack-as-defense" strategies that overwrite injected instructions with originals, but the consensus remains that architectural separation is more robust than runtime detection. Use separate message roles, structured input fields, or distinct context slots to maintain the boundary.

### 5.5 Scope to Least Privilege

Each context unit — agent, tool, skill, memory store — should have access to the minimum information needed for its task. Over-privileged context is the AI equivalent of running as root. A sub-agent that only needs to format dates should not have access to the database schema. A skill that generates commit messages should not see API credentials. Limit blast radius.

### 5.6 Measure and Monitor

Track context freshness, relevance, cost per token, and failure rates. [Kubiya](https://www.kubiya.ai/blog/context-engineering-best-practices) identifies four operational metrics: freshness (when was this context last validated?), relevance (does the agent actually use it?), cost (tokens consumed per context unit), and error rate (how often does this context contribute to failures?). Context quality degrades silently — without metrics, you won't know until the agent fails. CE is an operational discipline, not a one-time design task.

---

## 6. Multi-Framework Reference Models

Multiple published frameworks describe how to structure context. They converge more than they differ — presenting complementary perspectives on the same underlying discipline.

| Framework | Author | Key Contribution | Components |
|---|---|---|---|
| [**7 Components**](https://www.philschmid.de/context-engineering) | Philipp Schmid | Exhaustive input taxonomy | Instructions, User Prompts, State/History, Long-Term Memory, RAG, Tools, Structured Outputs |
| [**5 Layers**](https://atlan.com/know/context-engineering-framework/) | Atlan | Trust-ordered stack | Instructions → Retrieval → Memory → Tool Output → Governed Data |
| [**W/S/C/I Pipeline**](https://redis.io/blog/context-engineering-best-practices-for-an-emerging-discipline/) | Redis / LangChain | Operational process model | Write → Select → Compress → Isolate |
| [**ACE Framework**](https://arxiv.org/abs/2510.04618) | Stanford / SambaNova | Self-improving agents | Generator → Reflector → Curator (delta updates; +10.6% AppWorld, 86.9% latency reduction) |
| [**12-Factor Agents**](https://github.com/humanlayer/12-factor-agents) | HumanLayer | Application architecture | 12 factors; Factor 3 = "Own Your Context Window" |
| [**Building Effective Agents**](https://www.anthropic.com/engineering/building-effective-agents) | Anthropic | Pattern catalog | Augmented LLMs → Workflows (chain, route, parallelize, orchestrate) → Agents |
| [**Agent Skills**](https://agentskills.io/specification) | agentskills.io / AAIF | Cross-tool interop standard | SKILL.md: metadata + body + resources; progressive disclosure |

### Synthesis

These frameworks agree on the fundamentals:

- Context is **multi-layered** with clear trust boundaries between layers
- **Selection and retrieval** is the hardest operational problem
- **Decomposition and isolation** are the primary mechanisms for both quality and security
- The system must be **testable and versionable** — context-as-code is the consensus practice
- **Start simple**: [Anthropic](https://www.anthropic.com/engineering/building-effective-agents) and [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) both emphasize beginning with the simplest approach that works and layering complexity only when needed

The difference between frameworks is primarily one of *perspective*: Schmid taxonomizes inputs, Atlan orders by trust, Redis/LangChain describe process, ACE adds self-improvement loops, and Anthropic catalogs architectural patterns. A practitioner benefits from knowing all of them.

---

## 7. Tool Landscape Reference

The primitives from [§3](#3-context-primitives-taxonomy) map to concrete implementations across major AI coding tools. This table captures the state of support as of mid-2026 — the landscape is moving fast.

### 7.1 Context Primitive Support Matrix

| Primitive | Copilot | Claude Code | Cursor | Cline | Continue | Aider | Windsurf |
|---|---|---|---|---|---|---|---|
| **Instructions** | `copilot-instructions.md` | `CLAUDE.md` | `.cursorrules` / `.mdc` | `.clinerules/` | `config.json` | `.aider.conf.yml` | `.windsurfrules` |
| **Rules (scoped)** | `*.instructions.md` (glob) | `CLAUDE.md` (nested) | `.mdc` (frontmatter globs) | `.clinerules/` (dir) | — | `read:` files | — |
| **Prompt Templates** | `.prompt.md` | — | — | — | — | — | — |
| **Skills** | `SKILL.md` | — | — | — | — | — | — |
| **Agents** | `.agent.md` | — | — | — | — | — | — |
| **Memory** | — | Auto-memory (25 KB cap) | — | `memory_bank/` | — | — | Cascade memory |
| **MCP** | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ (partial) |
| **Hooks** | — | PreToolUse, PostToolUse, Stop, SessionStart | — | — | — | — | — |
| **RAG** | via MCP | via MCP | via MCP / `@`-providers | via MCP | `@`-providers + MCP | repo-map (tree-sitter) | — |

**Reading the matrix**: A dash (—) means the tool has no native support for that primitive. "via MCP" means the capability is available through MCP servers rather than a built-in mechanism. Tools with broad primitive coverage (Copilot, Claude Code) offer the richest context engineering surface; tools with narrow coverage (Aider, Windsurf) are effective for focused workflows but require MCP or external tooling for advanced CE.

### 7.2 MCP Convergence

Five of seven major coding tools now support MCP natively. The protocol is [converging](https://zylos.ai/research/2026-03-26-agent-interoperability-protocols-mcp-a2a-acp-convergence) with A2A (agent-to-agent) and ACP (Agent Communication Protocol) under the Linux Foundation, with combined SDK downloads exceeding 100 million per month. The [2026 roadmap](https://a2a-mcp.org/blog/mcp-2026-roadmap) prioritizes four areas: stateless transports, agent delegation, governance frameworks, and enterprise features.

For practitioners, MCP's significance is that it makes context primitives **portable**. A tool definition written as an MCP server works in Copilot, Claude Code, Cursor, Cline, and Continue without modification. This reduces vendor lock-in and allows teams to standardize their context infrastructure once and deploy it everywhere. Security remains the primary concern: the [awesome-mcp-security](https://github.com/Puliczek/awesome-mcp-security) repository curates MCP-specific security resources, and container-based sandboxing via [ToolHive](https://github.com/stacklok/toolhive) is the recommended baseline for production deployments.

---

## 8. Getting Started: A Decision Framework

### 8.1 Decision Tree

```
Start here:
│
├─ Do you need consistent behavior across ALL tasks?
│  → Instructions (§3, row 1)
│
├─ Do different parts of your project need different rules?
│  → Rules Files (§3, row 2)
│
├─ Do you repeat the same workflow frequently?
│  → Prompt Templates (§3, row 3)
│
├─ Do you need a portable capability that works across tools?
│  → Skills (§3, row 4)
│
├─ Does the agent need to remember across sessions?
│  → Memory (§3, row 5)
│
├─ Does the agent need access to large or frequently changing knowledge?
│  → RAG (§3, row 6)
│
├─ Does the agent need to take actions or access live data?
│  → Tools / Function Calling (§3, row 7)
│
├─ Do you need tool access that works across multiple AI tools?
│  → MCP (§3, row 8)
│
├─ Do you need to enforce policy or run side effects at lifecycle events?
│  → Hooks (§3, row 9)
│
└─ Does the task decompose into independent subtasks?
   → Sub-Agents (§3, row 10)
```

### 8.2 Start Simple, Layer Up

[Anthropic's](https://www.anthropic.com/engineering/building-effective-agents) core advice applies universally: **start with the simplest approach that works.**

1. **Start**: System instructions + rules files. Zero infrastructure. Version in Git. This alone solves most consistency problems.
2. **Add retrieval**: RAG or MCP when the agent's knowledge needs exceed what fits in context — documentation, codebases, knowledge bases.
3. **Add tools**: When the agent must take actions — run commands, query APIs, modify files.
4. **Add memory**: When continuity across sessions matters — learned preferences, project history, accumulated decisions.
5. **Add orchestration**: When tasks require multiple specialized agents with different context needs. This is the most complex layer — add it last.

Each layer adds capability and complexity. Resist the temptation to jump to multi-agent orchestration before you've exhausted what instructions and retrieval can do. The [Four-Lanes framework](https://github.com/DominicParosh/four-lanes) provides a structured comparison of MCP vs RAG vs Agents vs A2A for teams deciding which layer to add next.

---

## 9. Context-as-Code: Operationalizing CE

Context artifacts deserve the same operational rigor as production code. They control agent behavior just as directly — and unreviewed changes carry the same risk.

### 9.1 Version Control

- All context artifacts — instructions, rules, skills, prompt templates, agent definitions — live in Git alongside the code they govern
- Changes go through pull request review. Context changes are behavior changes; they should be reviewed with the same scrutiny as code changes
- Use semantic diffing where possible to detect *intent* changes, not just text edits
- This pattern is documented in detail by [AppScale](https://appscale.blog/en/blog/context-engineering-beyond-prompt-engineering-2026) and practiced in the [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) community

### 9.2 CI/CD Testing

- Use [Promptfoo](https://promptfoo.dev) or equivalent to regression-test context changes before they reach production
- Test for three dimensions: **expected behavior** (does the agent still do what it should?), **injection resistance** (can adversarial inputs break isolation?), and **performance** (latency and token count within budget?)
- Gate deployments on context test pass — a failing context test is a failing build

### 9.3 Observability

Track four metrics to catch degradation early:

- **Freshness**: When was this context artifact last validated? Stale context is the leading cause of context rot.
- **Relevance**: Does the agent actually use this context? Unused context wastes tokens and dilutes signal.
- **Cost**: Tokens consumed per context unit. Compression and progressive disclosure reduce this.
- **Failure rate**: How often does this context artifact contribute to agent errors? Correlate failures with specific context units to identify which artifacts need revision.

Alert on thresholds — especially freshness. Context rot is silent and cumulative; by the time a human notices, the agent may have been degrading for weeks.

---

## 10. See Also

- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic
- [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) — HumanLayer
- [Agent Skills Specification](https://agentskills.io/specification) — AAIF
- [A Survey of Context Engineering for LLMs](https://arxiv.org/abs/2507.13334) — Mei et al.
- [MCP 2026 Roadmap](https://a2a-mcp.org/blog/mcp-2026-roadmap) — MCP Community
- [OWASP Top 10 for LLM Applications](https://github.com/OWASP/www-project-top-10-for-large-language-model-applications) — OWASP
- [ai-agent-development.md](ai-agent-development.md) — sibling document
- [ai-human-interaction-defaults.md](ai-human-interaction-defaults.md) — sibling document

---

*Reference: [`tyler555g/best-practices`](https://github.com/tyler555g/best-practices)*
