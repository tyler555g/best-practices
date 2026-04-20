# The Twelve-Factor App

The Twelve-Factor App is a methodology for building software-as-a-service (SaaS) applications that are robust, portable, and scalable. Originally authored by Adam Wiggins at Heroku, it distills best practices for cloud-native app design into twelve key principles. The methodology aims to minimize fragility, foster maintainable growth, and reduce operational friction. As cloud platforms, containers, and orchestration tools like Docker and Kubernetes have evolved, the twelve-factor approach remains a durable foundation, with v2 efforts modernizing examples for today’s environments.

## The Twelve Factors

### I. Codebase
- **Principle** — One codebase tracked in revision control, many deploys
- **Rationale** — Ensures a single source of truth, enabling consistent deployments and collaboration.
- **Modern Context** — Container images and GitOps reinforce the single-repo-per-app model; monorepos must still maintain clear app boundaries.
- **Common Violations** — Multiple codebases per app, shared code without libraries, or deploying from untracked sources.

### II. Dependencies
- **Principle** — Explicitly declare and isolate dependencies
- **Rationale** — Prevents “works on my machine” issues and ensures deterministic builds.
- **Modern Context** — Dependency managers (npm, pip, etc.) and containerization (Dockerfiles) make isolation standard; avoid relying on system packages.
- **Common Violations** — Implicit dependencies, missing manifests, or reliance on system-installed tools.

### III. Config
- **Principle** — Store config in the environment
- **Rationale** — Cleanly separates code from configuration, enabling safe open-sourcing and flexible deployments.
- **Modern Context** — Use environment variables, secrets managers, and config maps; avoid hardcoded or grouped “environments.”
- **Common Violations** — Credentials or config in code, checked-in config files, or grouping config by environment.

### IV. Backing Services
- **Principle** — Treat backing services as attached resources
- **Rationale** — Enables easy swapping of services (databases, queues) without code changes, supporting portability and resilience.
- **Modern Context** — Service discovery, cloud-managed databases, and third-party APIs are all “attached resources.”
- **Common Violations** — Hardcoded service locations, tightly coupled local services, or code that distinguishes local vs. third-party resources.

### V. Build, Release, Run
- **Principle** — Strictly separate build and run stages
- **Rationale** — Ensures repeatable, auditable deployments and enables rollbacks.
- **Modern Context** — CI/CD pipelines, immutable container images, and release management tools reinforce this separation.
- **Common Violations** — Modifying code at runtime, mutable releases, or mixing build and run logic.

### VI. Processes
- **Principle** — Execute the app as one or more stateless processes
- **Rationale** — Statelessness enables scaling, resilience, and portability.
- **Modern Context** — Stateless microservices, serverless functions, and ephemeral containers embody this principle.
- **Common Violations** — Sticky sessions, local file storage for state, or reliance on in-memory persistence.

### VII. Port Binding
- **Principle** — Export services via port binding
- **Rationale** — Makes the app self-contained and platform-agnostic, supporting flexible deployment and composition.
- **Modern Context** — Apps bind to ports in containers; service meshes and ingress controllers route traffic.
- **Common Violations** — Relying on injected web servers, not exposing a port, or requiring external process managers.

### VIII. Concurrency
- **Principle** — Scale out via the process model
- **Rationale** — Enables horizontal scaling and workload partitioning.
- **Modern Context** — Orchestrators (Kubernetes, Nomad) and process managers (systemd, Foreman) manage process formation and scaling.
- **Common Violations** — Monolithic “uberprocesses,” lack of process types, or manual scaling.

### IX. Disposability
- **Principle** — Maximize robustness with fast startup and graceful shutdown
- **Rationale** — Supports rapid scaling, zero-downtime deploys, and resilience to failure.
- **Modern Context** — Containers and serverless functions are designed for disposability; readiness/liveness probes enforce it.
- **Common Violations** — Slow startup, failure to handle SIGTERM, or loss of in-flight work on shutdown.

### X. Dev/prod Parity
- **Principle** — Keep development, staging, and production as similar as possible
- **Rationale** — Reduces bugs, accelerates delivery, and enables continuous deployment.
- **Modern Context** — Use the same backing services, container images, and automation across all environments.
- **Common Violations** — Divergent stacks, different service types, or long gaps between code and deploy.

### XI. Logs
- **Principle** — Treat logs as event streams
- **Rationale** — Decouples log generation from storage and analysis, enabling flexible observability.
- **Modern Context** — Write logs to stdout/stderr; use log routers, aggregators, and observability platforms.
- **Common Violations** — Writing to local log files, log rotation in app code, or mixing logs with business logic.

### XII. Admin Processes
- **Principle** — Run admin/management tasks as one-off processes
- **Rationale** — Ensures consistency and safety for ad hoc tasks (migrations, scripts) by running them in the same environment as the app.
- **Modern Context** — Use one-off containers, jobs, or remote shells for admin tasks; automate where possible.
- **Common Violations** — Running admin tasks on production servers outside the app context, or using stale code/config.

## Quick Compliance Checklist

| #  | Factor         | Check                                                                 |
|----|----------------|-----------------------------------------------------------------------|
| I  | Codebase       | Single repo per app; deploy from same codebase to all environments    |
| II | Dependencies   | All dependencies declared and isolated; no reliance on system packages|
| III| Config         | All config in environment variables; no secrets in code               |
| IV | Backing Svcs   | All services treated as attachable resources; referenced via config   |
| V  | Build/Release/Run | Build, release, and run stages are strictly separated             |
| VI | Processes      | App runs as stateless processes; no local state                      |
| VII| Port Binding   | App exports services via port binding; self-contained                 |
| VIII| Concurrency   | App scales out via process model; process types defined              |
| IX | Disposability  | Fast startup/shutdown; robust to sudden termination                  |
| X  | Dev/Prod Parity| Dev, staging, prod as similar as possible; same services, tools      |
| XI | Logs           | Logs treated as event streams; output to stdout/stderr               |
| XII| Admin Procs    | Admin tasks run as one-off processes in app environment              |

## Anti-patterns Summary

- Multiple codebases per app or shared code without libraries
- Implicit or undeclared dependencies; reliance on system tools
- Config or secrets in code or checked-in files
- Hardcoded service locations or tightly coupled resources
- Mutable releases or runtime code changes
- Sticky sessions or local state persistence
- Relying on injected web servers or not binding to a port
- Monolithic processes or lack of process types
- Slow startup, unhandled shutdown, or loss of in-flight work
- Divergent dev/prod environments or long deploy gaps
- Writing logs to files or mixing logs with app logic
- Running admin tasks outside the app context or with stale code

## See Also
- [The Twelve-Factor App](https://12factor.net/) — Original methodology
- [twelve-factor/twelve-factor](https://github.com/twelve-factor/twelve-factor) — Source repository (CC BY 4.0)
- [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) — Dex Horthy / HumanLayer (applying 12-factor to LLM agents)

*Originally authored by Adam Wiggins. Licensed under CC BY 4.0.*
