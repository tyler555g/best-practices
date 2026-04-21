# AI-Assisted Development Best Practices

AI-assisted development leverages artificial intelligence tools to enhance coding, documentation, testing, and deployment workflows. This practice has evolved from simple code completion to sophisticated multi-agent systems that can understand context, follow complex instructions, and maintain consistency across large codebases.

The foundation of effective AI-assisted development rests on **six core primitives**: agents (specialized AI assistants), instructions (context-aware coding standards), skills (self-contained task modules), hooks (session automation), cookbook patterns (reusable solutions), and comprehensive documentation. These primitives work together to create governed, scalable, and maintainable development workflows.

Governance matters because AI agents have access to powerful tools—file systems, APIs, databases, deployment pipelines. Without proper controls, agents can cause unintended harm, leak sensitive data, or make irreversible changes. The patterns below establish safety boundaries while maximizing AI assistance benefits.

## Agent Safety and Governance

Safe AI-assisted development requires fail-closed policies, tool access controls, and comprehensive audit trails. These patterns prevent common security risks while enabling productive AI collaboration.

### Fail-Closed Policies

Always deny ambiguous or errored governance decisions rather than allowing them. This principle protects against edge cases where security checks malfunction.

**Implementation:**
- Define governance rules in configuration files (YAML/JSON), not hardcoded logic
- Return explicit deny when policy evaluation fails or times out
- Log all denial reasons with sufficient context for debugging

```yaml
# Good: Explicit policy with failure handling
agent_policy:
  name: code-reviewer
  default_action: deny
  on_error: deny
  allowed_tools: [read_file, analyze_code, create_comment]
  blocked_patterns: ["(?i)(password|api_key)\\s*[:=]"]
```

### Tool Access Controls

Agents should have the minimum tool access needed for their specific tasks. Use explicit allowlists rather than broad permissions.

**Core Principles:**
- **Allowlist-based**: Define specific tools agents can use
- **Capability separation**: Code reading agents shouldn't have write access
- **Rate limiting**: Prevent infinite loops and resource exhaustion
- **Human-in-the-loop**: Require approval for high-impact operations (deployment, data deletion, external communications)

```python
# Good: Governed tool with explicit policy
@require_policy("safe-file-operations")
@rate_limit(max_calls=10, per_window="1m")
async def read_file(path: str) -> str:
    if not is_safe_path(path):
        raise SecurityError("Path not in allowed directories")
    return await file_system.read(path)

# Bad: Unprotected tool with no governance
async def read_file(path: str) -> str:
    return open(path).read()
```

### Multi-Agent Trust Boundaries

In multi-agent workflows, each agent should have its own governance policy. When agents delegate to other agents, apply the most restrictive policy from the chain.

**Trust Management:**
- Track trust scores for agent delegates based on historical performance
- Degrade trust on failures, require ongoing good behavior for restoration
- Never allow inner agents broader permissions than outer agents
- Maintain audit trails across agent delegation chains

### Content Filtering and Output Validation

Scan all inputs and outputs for security threats, sensitive data, and policy violations.

**Input Filtering:**
- Check user prompts for data exfiltration attempts, prompt injection, privilege escalation
- Validate agent tool arguments for sensitive patterns (credentials, PII, SQL injection)
- Use updateable regex pattern lists that don't require code changes

**Output Validation:**
- Review generated code for security vulnerabilities before execution
- Check documentation outputs for sensitive information exposure
- Validate that agent responses align with stated capabilities

### Audit Logging

Maintain immutable audit trails for all agent actions and decisions.

**Required Log Fields:**
- Timestamp, agent ID, tool name, user ID, session ID
- Allow/deny decision with policy name and matched rules
- Tool arguments (sanitized to remove sensitive data)
- Session boundaries for correlation across agent interactions

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "agent_id": "code-reviewer-v2",
  "tool": "read_file",
  "decision": "allow",
  "policy": "safe-file-operations",
  "args_hash": "sha256:...",
  "session_id": "sess_abc123"
}
```

## Coding Standards as Code

Modern AI-assisted development treats coding standards as executable configuration rather than documentation. This approach enables consistent, context-aware guidance that scales across teams and projects.

### Context-Aware AI Instructions

Instructions should adapt to the specific file, framework, and project context rather than providing generic guidance.

**Instruction Structure:**
- **Scope definition**: Which files, patterns, or contexts the instruction applies to
- **Technology-specific rules**: Framework-specific patterns and anti-patterns
- **Decision trees**: Conditional logic based on project characteristics
- **Code examples**: Concrete before/after patterns for common scenarios

```yaml
---
name: "React Component Standards"
applyTo: "**/{components,pages}/**/*.{tsx,jsx}"
triggers: 
  - "when creating React components"
  - "when refactoring UI code"
description: "TypeScript React component patterns with accessibility focus"
---

# React Component Standards

## Component Definition Patterns

Use function components with TypeScript interfaces:
- Props interface should be exported for reuse
- Use `React.FC` sparingly, prefer explicit return types
- Implement forwardRef for components that need DOM access

```typescript
// Good: Explicit interface and return type
interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick: (event: React.MouseEvent) => void;
}

export function Button({ variant, children, onClick }: ButtonProps): JSX.Element {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
```

### File-Pattern Matching Rules

Instructions should target specific file patterns to avoid applying inappropriate guidance.

**Targeting Strategies:**
- **Glob patterns**: `**/*.test.ts` for test files, `src/components/**/*.tsx` for React components
- **Framework detection**: Different rules for Next.js vs. vanilla React
- **Directory-based scoping**: API route handlers vs. UI components
- **File content analysis**: Detect framework usage from imports

### Instruction Scoping and Layering

Layer instructions from general (organization-wide) to specific (file-level) with clear precedence rules.

**Hierarchy Example:**
1. **Organization level**: Security requirements, coding standards
2. **Team level**: Framework choices, testing patterns
3. **Project level**: Architecture decisions, specific libraries
4. **File level**: Component-specific patterns

```yaml
# Organization level: security-first
security:
  require_input_validation: true
  sanitize_user_content: "html_escape"
  
# Team level: React patterns
react:
  component_pattern: "function_components"
  testing_framework: "jest_rtl"
  
# Project level: accessibility focus
accessibility:
  enforce_aria_labels: true
  color_contrast_minimum: "WCAG_AA"
```

### Standards Configuration (YAML/Markdown-driven)

Make coding standards configurable and versionable through structured files rather than hardcoded agent behavior.

**Configuration Benefits:**
- **Version control**: Track changes to standards over time
- **Team collaboration**: Reviewable changes to coding practices
- **Environment adaptation**: Different rules for development vs. production
- **Automated enforcement**: CI/CD integration for standards compliance

## Agent Configuration

Effective agent configuration balances specialization with flexibility, enabling teams to create purpose-built AI assistants while maintaining governance and consistency.

### Role Definition and Specialization

Define clear agent roles with specific responsibilities and expertise domains.

**Specialization Patterns:**
- **Code Review Agent**: Security analysis, style enforcement, performance optimization
- **Architecture Agent**: System design, technology selection, integration patterns
- **Test Agent**: Test generation, coverage analysis, test maintenance
- **Documentation Agent**: API documentation, README generation, code comments

```yaml
agent:
  name: "security-reviewer"
  role: "Code security analysis and vulnerability detection"
  expertise:
    - "OWASP Top 10 compliance"
    - "Dependency vulnerability scanning"
    - "Authentication and authorization patterns"
  capabilities:
    - read_code
    - analyze_dependencies
    - generate_security_reports
  limitations:
    - "Cannot modify code directly"
    - "Cannot access production systems"
    - "Cannot approve deployment without human review"
```

### Tool Access Management

Configure agent tool access based on the principle of least privilege, granting only the minimum permissions required for the agent's role.

**Access Control Strategies:**
- **Read-only agents**: Code analysis, documentation review, architectural guidance
- **Read-write agents**: Code generation, refactoring, test creation (with approval workflows)
- **External integration agents**: API calls, database queries, deployment operations (high governance)

### Context Window Management

Optimize agent context usage to maintain performance while providing sufficient information for quality outputs.

**Context Optimization:**
- **Selective file loading**: Load only relevant files for the current task
- **Progressive disclosure**: Start with summaries, expand to details as needed
- **Context compression**: Summarize large codebases into architectural overviews
- **Session memory**: Maintain conversation context across interactions

### Multi-Agent Workflows

Design agent interactions for complex tasks that benefit from specialized expertise.

**Workflow Patterns:**
- **Sequential**: Architecture → Implementation → Testing → Documentation
- **Parallel**: Multiple agents analyzing different aspects simultaneously
- **Hierarchical**: Orchestrator agent coordinating specialist agents
- **Peer review**: Agents reviewing each other's outputs for quality assurance

## Skill Design Patterns

Skills represent reusable, self-contained capabilities that agents can invoke on-demand. Well-designed skills improve consistency and reduce context waste.

### Self-Contained Task Modules

Each skill should encapsulate a complete workflow with all necessary context and dependencies.

**Skill Structure:**
- **Clear trigger conditions**: When and why to use this skill
- **Complete instructions**: Step-by-step task guidance
- **Expected inputs/outputs**: Clear interfaces for skill invocation
- **Error handling**: Graceful degradation and failure modes

```markdown
# Skill: API Integration Analysis

## Trigger Conditions
- User requests API integration assessment
- Code review identifies external API usage
- Architecture review requires integration documentation

## Workflow
1. **Discovery**: Identify all API endpoints in codebase
2. **Security Analysis**: Check authentication, rate limiting, error handling
3. **Performance Review**: Analyze timeout settings, retry logic, circuit breakers
4. **Documentation**: Generate integration guide with examples

## Outputs
- Integration security assessment report
- Performance optimization recommendations
- Updated API documentation
- Monitoring and alerting suggestions
```

### Bundled Assets and Context

Skills may include supporting files that enhance their capabilities: reference documentation, code templates, configuration examples, or analysis scripts.

**Asset Types:**
- **Templates**: Boilerplate code for common patterns
- **Reference data**: API schemas, configuration examples
- **Helper scripts**: Automated analysis or generation tools
- **Documentation**: Detailed guidance and examples

### Trigger Patterns

Define clear conditions for when skills should be invoked to prevent overuse and ensure appropriate application.

**Trigger Categories:**
- **Explicit invocation**: User directly requests skill by name
- **Pattern recognition**: Automated detection based on file patterns or content
- **Workflow stages**: Specific points in development lifecycle
- **Problem domains**: Technical issues that benefit from specialized expertise

## Evaluation and Quality Control

Implement systematic quality control to improve AI assistance reliability and measure effectiveness over time.

### LLM-as-Judge Patterns

Use AI systems to evaluate other AI outputs, providing scalable quality assessment for code, documentation, and architectural decisions.

**Evaluation Dimensions:**
- **Correctness**: Does the code accomplish the intended task?
- **Security**: Are there vulnerabilities or unsafe patterns?
- **Performance**: Is the implementation efficient and scalable?
- **Maintainability**: Is the code readable and well-structured?

```python
# Example: Code quality evaluation
class CodeQualityEvaluator:
    def evaluate(self, code: str, requirements: str) -> EvaluationResult:
        return {
            "correctness": self._check_correctness(code, requirements),
            "security": self._security_scan(code),
            "performance": self._performance_analysis(code),
            "maintainability": self._maintainability_score(code)
        }
```

### Self-Critique Loops

Implement iterative improvement workflows where agents review and refine their own outputs.

**Self-Critique Process:**
1. **Initial generation**: Agent produces first version
2. **Self-review**: Agent evaluates output against requirements
3. **Gap identification**: Identify areas for improvement
4. **Refinement**: Generate improved version
5. **Validation**: Confirm improvements meet criteria

### Rubric-Based Evaluation

Develop standardized evaluation criteria for consistent quality assessment across different types of outputs.

**Quality Rubrics:**
- **Code Review Rubric**: Security, performance, style, documentation
- **Architecture Rubric**: Scalability, maintainability, technology fit
- **Documentation Rubric**: Accuracy, completeness, clarity, examples

## Session Automation (Hooks)

Hooks enable automated actions triggered by development lifecycle events, providing consistent governance and quality control without manual intervention.

### Session Lifecycle Events

Automate actions at key development workflow stages.

**Hook Types:**
- **Session start**: Environment setup, context loading, policy initialization
- **Code change**: Automatic analysis, security scanning, style checking
- **Pre-commit**: Final validation, test execution, documentation updates
- **Session end**: Cleanup, logging, artifact archival

```yaml
# Example: Pre-commit hook configuration
hooks:
  pre_commit:
    - name: "security_scan"
      command: "security-agent analyze --scope=staged"
      fail_on_error: true
    - name: "code_style"
      command: "style-agent format --check"
      fail_on_error: false
    - name: "update_docs"
      command: "doc-agent update --auto"
      fail_on_error: false
```

### Logging and Observability

Capture comprehensive session data for analysis, debugging, and compliance reporting.

**Logging Categories:**
- **User interactions**: Commands, requests, feedback
- **Agent decisions**: Tool usage, reasoning chains, error conditions
- **System performance**: Response times, resource usage, error rates
- **Quality metrics**: Success rates, user satisfaction, error patterns

### Governance Integration

Ensure hooks enforce organizational policies and security requirements consistently across all development sessions.

**Governance Hooks:**
- **Policy validation**: Verify agent configurations meet security requirements
- **Audit trail creation**: Log all high-privilege operations
- **Compliance checking**: Validate against regulatory requirements
- **Risk assessment**: Evaluate session activities for security risks

## Anti-patterns

Avoid these common pitfalls that reduce AI assistance effectiveness or introduce security risks.

### Blind Acceptance
**Problem**: Accepting AI outputs without human review, especially for critical changes.

**Solution**: Implement approval workflows for high-impact changes. Use draft pull requests, require human verification for deployment-related modifications, and maintain clear boundaries on what AI can execute autonomously.

### Context Waste
**Problem**: Loading irrelevant context into AI prompts, reducing performance and increasing costs.

**Solution**: Use selective context loading based on task requirements. Implement context summarization for large codebases. Create task-specific views of relevant information rather than full repository dumps.

### Over-Reliance
**Problem**: Delegating decision-making to AI for choices that require human judgment, business context, or ethical considerations.

**Solution**: Reserve strategic decisions, security trade-offs, and business logic choices for human review. Use AI for implementation assistance after humans establish requirements and constraints.

### Prompt Injection Blindness
**Problem**: Failing to validate and sanitize inputs to AI systems, allowing malicious prompts to modify agent behavior.

**Solution**: Implement input validation pipelines. Use structured prompts with clear boundaries between instructions and user content. Apply content filters to detect manipulation attempts.

### Vendor Lock-in
**Problem**: Coupling development workflows tightly to specific AI provider APIs, models, or proprietary formats.

**Solution**: Use abstraction layers for AI service interactions. Implement model-agnostic interfaces. Store agent configurations in vendor-neutral formats. Plan for model migration scenarios.

## Checklist

Evaluate AI-assisted development readiness with these essential criteria:

- [ ] **Agent Governance**: Tool access controls and audit logging in place
- [ ] **Fail-Safe Policies**: Default-deny policies with explicit allowlists
- [ ] **Context-Aware Instructions**: Coding standards that adapt to file patterns and frameworks
- [ ] **Role-Based Agent Design**: Specialized agents with clear responsibilities and limitations
- [ ] **Quality Control**: Evaluation frameworks and self-critique loops implemented
- [ ] **Security Validation**: Input sanitization and output review processes
- [ ] **Session Automation**: Hooks for lifecycle events and compliance checking
- [ ] **Documentation Standards**: Clear agent capabilities, limitations, and usage guidelines
- [ ] **Vendor Neutrality**: Abstraction layers to prevent platform lock-in
- [ ] **Human Oversight**: Approval workflows for high-impact operations

## See Also

- [awesome-copilot](https://github.com/github/awesome-copilot) — GitHub (patterns observed here, generalized above)
- [ai-human-interaction-defaults.md](ai-human-interaction-defaults.md) — Companion reference in this repo
- [ai-agent-development.md](ai-agent-development.md) — Companion reference in this repo
- [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — Anthropic
- [OWASP Agentic Security Initiative](https://owasp.org/www-project-agentic-security/) — Security framework for AI agent systems
- [Agent Skills Specification](https://agentskills.io/specification) — Standard for self-contained task modules
