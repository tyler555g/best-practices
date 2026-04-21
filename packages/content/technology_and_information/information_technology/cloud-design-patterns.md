# Cloud Design Patterns

Cloud design patterns are reusable solutions to common problems in distributed, cloud-based systems. Use this reference to select patterns that improve reliability, scalability, and maintainability in your architecture.

## Reliability Patterns

### Circuit Breaker
- **Problem** — Prevents repeated failures when a service or resource is unavailable.
- **Solution** — Monitors for failures and, after a threshold, "opens" the circuit to block further calls until recovery.
- **When to Use** — To handle transient faults in remote calls.
- **When Not to Use** — For non-recoverable errors or when failures are rare.

### Retry
- **Problem** — Handles transient failures in remote calls.
- **Solution** — Automatically retries failed operations with configurable delay and backoff.
- **When to Use** — For operations likely to succeed if retried.
- **When Not to Use** — For non-idempotent operations or persistent failures.

### Compensating Transaction
- **Problem** — Need to undo steps in a multi-step operation if a failure occurs.
- **Solution** — Defines compensating actions to reverse completed steps.
- **When to Use** — In eventual consistency scenarios across distributed systems.
- **When Not to Use** — When strong consistency or atomic rollback is required.

### Saga
- **Problem** — Maintaining data consistency across distributed services without distributed transactions.
- **Solution** — Coordinates a sequence of local transactions with compensating actions for failures.
- **When to Use** — For long-running, multi-service workflows.
- **When Not to Use** — When strict ACID transactions are needed.

### Bulkhead
- **Problem** — Prevents a failure in one part of a system from cascading to others.
- **Solution** — Isolates resources into pools (bulkheads) to contain failures.
- **When to Use** — To protect critical services from resource exhaustion.
- **When Not to Use** — When resource isolation adds unnecessary complexity.

## Data Management Patterns

### CQRS
- **Problem** — Read and write workloads have different requirements.
- **Solution** — Separates read and write operations into distinct models.
- **When to Use** — For complex domains or high read/write scalability.
- **When Not to Use** — For simple CRUD applications.

### Event Sourcing
- **Problem** — Need to track changes to application state.
- **Solution** — Stores state as a sequence of events.
- **When to Use** — For auditability, temporal queries, or rebuilding state.
- **When Not to Use** — When event storage overhead is unjustified.

### Sharding
- **Problem** — Data store can't scale to meet demand.
- **Solution** — Splits data into horizontal partitions (shards).
- **When to Use** — For large datasets or high throughput.
- **When Not to Use** — For small or simple datasets.

### Cache-Aside
- **Problem** — Keeping cache and data store in sync.
- **Solution** — Loads data into cache on demand and updates/invalidate as needed.
- **When to Use** — For read-heavy workloads with infrequent updates.
- **When Not to Use** — For highly dynamic or sensitive data.

### Materialized View
- **Problem** — Queries are slow or complex due to data structure.
- **Solution** — Precomputes and stores query results for fast access.
- **When to Use** — For reporting, dashboards, or complex aggregations.
- **When Not to Use** — When source data changes too frequently.

## Messaging Patterns

### Publisher-Subscriber
- **Problem** — Need to broadcast events to multiple consumers without tight coupling.
- **Solution** — Uses a broker to distribute messages to subscribers asynchronously.
- **When to Use** — For event-driven architectures.
- **When Not to Use** — For direct, synchronous communication.

### Competing Consumers
- **Problem** — Single consumer can't handle message volume.
- **Solution** — Multiple consumers pull from a shared queue to balance load.
- **When to Use** — For scalable, parallel processing.
- **When Not to Use** — When message order is critical.

### Choreography
- **Problem** — Centralized workflow logic creates bottlenecks.
- **Solution** — Each service decides when and how to act based on events.
- **When to Use** — For decentralized, event-driven workflows.
- **When Not to Use** — When coordination logic is complex.

### Queue-Based Load Leveling
- **Problem** — Services are overwhelmed by bursty workloads.
- **Solution** — Uses a queue as a buffer to smooth load spikes.
- **When to Use** — For variable or unpredictable workloads.
- **When Not to Use** — When low latency is required.

## Migration Patterns

### Strangler Fig
- **Problem** — Risky, big-bang migrations from legacy systems.
- **Solution** — Incrementally replaces legacy functionality with new services behind a façade.
- **When to Use** — For gradual, low-risk migrations.
- **When Not to Use** — When interception of requests is impossible.

### Anti-Corruption Layer
- **Problem** — Integrating with legacy or external systems pollutes new designs.
- **Solution** — Introduces a translation layer to isolate models and logic.
- **When to Use** — For staged migrations or integrating with incompatible systems.
- **When Not to Use** — When systems are already compatible.

## Operational Patterns

### Sidecar
- **Problem** — Cross-cutting concerns (logging, monitoring) are hard to modularize.
- **Solution** — Deploys supporting features in a separate process/container alongside the main app.
- **When to Use** — For language-agnostic, isolated features.
- **When Not to Use** — For small apps or when overhead is prohibitive.

### Ambassador
- **Problem** — Legacy or hard-to-modify apps need enhanced connectivity features.
- **Solution** — Uses a proxy (ambassador) to handle network concerns on behalf of the app.
- **When to Use** — For offloading connectivity, security, or routing.
- **When Not to Use** — When latency is critical or features are language-specific.

### Deployment Stamps
- **Problem** — Single deployment can't scale or isolate tenants.
- **Solution** — Deploys multiple, independent "stamps" (instances) to scale and isolate workloads.
- **When to Use** — For multi-tenant, geo-distributed, or high-scale solutions.
- **When Not to Use** — For simple or single-tenant apps.

### Throttling
- **Problem** — Resource exhaustion from unbounded demand.
- **Solution** — Limits resource usage per user, tenant, or service to maintain SLOs.
- **When to Use** — For protecting shared resources and ensuring fairness.
- **When Not to Use** — When all requests must be served immediately.

## Pattern Selection Guide
| Category         | Pattern                | Use When                                      |
|------------------|-----------------------|------------------------------------------------|
| Reliability      | Circuit Breaker        | Prevent repeated failures in remote calls      |
| Reliability      | Retry                  | Handle transient faults                        |
| Reliability      | Compensating Transaction| Undo steps in multi-step operations           |
| Reliability      | Saga                   | Coordinate distributed transactions           |
| Reliability      | Bulkhead               | Isolate failures to protect critical services  |
| Data Management  | CQRS                   | Separate read/write models for scalability     |
| Data Management  | Event Sourcing         | Track state changes as events                  |
| Data Management  | Sharding               | Partition data for scale                       |
| Data Management  | Cache-Aside            | Load data into cache on demand                 |
| Data Management  | Materialized View      | Precompute query results                       |
| Messaging        | Publisher-Subscriber   | Broadcast events to many consumers             |
| Messaging        | Competing Consumers    | Scale out message processing                   |
| Messaging        | Choreography           | Decentralize workflow logic                    |
| Messaging        | Queue-Based Load Leveling| Buffer workloads with a queue                |
| Migration        | Strangler Fig          | Incrementally migrate legacy systems           |
| Migration        | Anti-Corruption Layer  | Isolate new code from legacy systems           |
| Operational      | Sidecar                | Modularize cross-cutting concerns              |
| Operational      | Ambassador             | Offload connectivity to a proxy                |
| Operational      | Deployment Stamps      | Scale/isolate with multiple deployments        |
| Operational      | Throttling             | Limit resource usage to protect SLOs           |

## See Also
- [Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/) — Microsoft (CC BY 4.0)
