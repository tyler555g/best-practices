# Software Design Principles

Effective software design is grounded in principles that promote reliability, scalability, maintainability, and alignment with business needs. The following principles provide a durable foundation for building robust, adaptable systems in any environment.

## Build for Business Needs
- **Principle** — Design decisions must be justified by clear business requirements.
- **Recommendations** — Define objectives (RTO, RPO, MTO), document SLAs/SLOs, model applications around business domains, decompose workloads, plan for growth, and align costs with value.
- **Anti-pattern** — Designing for technology’s sake or over-engineering without business justification.

## Design for Evolution
- **Principle** — Systems must be able to change and evolve over time.
- **Recommendations** — Enforce loose coupling and high cohesion, encapsulate domain knowledge, use asynchronous messaging, expose versioned APIs, abstract infrastructure, and support independent deployments.
- **Anti-pattern** — Tightly coupled systems that resist change or require coordinated updates across many components.

## Design for Operations
- **Principle** — Applications should equip operations teams for deployment, monitoring, and incident response.
- **Recommendations** — Make all things observable, instrument for monitoring and root cause analysis, use distributed tracing, standardize logs/metrics, and automate management tasks.
- **Anti-pattern** — Opaque systems with poor logging, ad hoc operations, or manual, error-prone processes.

## Use Managed Services
- **Principle** — Prefer managed platforms and services over self-managed infrastructure when possible.
- **Recommendations** — Use platform services for compute, storage, messaging, and identity to reduce operational overhead and focus on business logic.
- **Anti-pattern** — Rebuilding commodity infrastructure or running undifferentiated heavy lifting in-house.

## Use an Identity Service
- **Principle** — Rely on a managed identity platform or proven identity service, not custom-built solutions.
- **Recommendations** — Avoid storing credentials, use industry-standard protocols (OAuth2, OIDC), adopt modern features (SSO, MFA, auditing), and focus on core business value.
- **Anti-pattern** — Building or running your own identity system, storing credentials, or lacking modern security features.

## Minimize Coordination
- **Principle** — Reduce coordination between components to improve scalability and reliability.
- **Recommendations** — Use decoupled, asynchronous communication, embrace eventual consistency, partition data/state, design idempotent operations, and use optimistic concurrency.
- **Anti-pattern** — Excessive locking, global transactions, or tightly coupled workflows that limit scale.

## Partition Around Limits
- **Principle** — Partition systems to work around compute, storage, and network limits.
- **Recommendations** — Partition databases, queues, and compute resources; design partition keys to avoid hotspots; partition at multiple levels.
- **Anti-pattern** — Centralized monoliths that hit scaling bottlenecks or create single points of failure.

## Make All Things Redundant
- **Principle** — Build redundancy into every critical path to avoid single points of failure.
- **Recommendations** — Use load balancers, replicas, multi-zone/region deployments, and test failover procedures.
- **Anti-pattern** — Relying on single instances or untested failover mechanisms.

## Design to Scale Out
- **Principle** — Design for horizontal scaling by adding/removing instances as demand changes.
- **Recommendations** — Avoid instance stickiness, identify bottlenecks, decompose workloads, use autoscaling, and design for graceful scale-in.
- **Anti-pattern** — Rigid architectures that require vertical scaling or manual intervention to handle load.

## Design for Self-Healing
- **Principle** — Systems should detect, respond to, and recover from failures automatically.
- **Recommendations** — Implement retries, health checks, circuit breakers, bulkheads, load leveling, failover, compensation, and chaos testing.
- **Anti-pattern** — Ignoring failure modes, lacking monitoring, or requiring manual recovery.

## See Also
- [Azure Architecture Center — Design Principles](https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/) — Microsoft (CC BY 4.0)
