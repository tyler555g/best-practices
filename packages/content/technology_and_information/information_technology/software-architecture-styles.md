# Software Architecture Styles

Architecture styles define the fundamental organization and interaction patterns of software systems. Choosing the right style is critical for aligning with business goals, scalability, and maintainability. Each style has unique strengths, trade-offs, and best-fit scenarios.

## N-tier
- **Description** — Divides applications into logical layers (presentation, business logic, data) and physical tiers, each with a specific responsibility.
- **When to Use** — Traditional business domains, migrating legacy systems, or when requirements are still evolving.
- **Benefits** — Familiar, portable, supports mixed environments, and requires minimal changes for migration.
- **Challenges** — Can limit agility, add latency, and complicate testing and monitoring.

## Web-Queue-Worker
- **Description** — Separates user-facing web front ends from background workers using asynchronous message queues.
- **When to Use** — Applications with simple domains and resource-intensive or long-running tasks.
- **Benefits** — Simple, clear separation of concerns, independent scaling, and straightforward deployment.
- **Challenges** — Risk of monolithic growth, hidden dependencies, and consistency issues if not carefully designed.

## Microservices
- **Description** — Decomposes applications into small, autonomous services, each owning its data and exposing APIs.
- **When to Use** — Complex domains needing frequent updates, independent deployments, and team autonomy.
- **Benefits** — Agility, independent scaling, fault isolation, technology diversity, and small focused teams.
- **Challenges** — Increased complexity, governance, data consistency, and operational overhead.

## Event-Driven
- **Description** — Uses event producers, consumers, and brokers for asynchronous, decoupled communication.
- **When to Use** — Real-time processing, IoT, high-volume streaming, or when decoupling is critical.
- **Benefits** — Scalability, fault isolation, real-time response, and independent evolution of components.
- **Challenges** — Eventual consistency, delivery guarantees, observability, and error handling.

## Big Data
- **Description** — Handles ingestion, processing, and analysis of massive or complex datasets using batch and real-time pipelines.
- **When to Use** — Predictive analytics, machine learning, IoT, or when traditional databases can’t scale.
- **Benefits** — Parallelism, elastic scale, interoperability, and support for diverse data types.
- **Challenges** — Specialized skills, security, orchestration, and cost management.

## Big Compute
- **Description** — Supports large-scale, compute-intensive workloads by distributing tasks across many cores or nodes.
- **When to Use** — Simulations, scientific computing, rendering, or any workload needing massive parallelism.
- **Benefits** — High performance, on-demand scaling, and access to specialized hardware.
- **Challenges** — Infrastructure management, diminishing returns for tightly coupled tasks, and scheduling complexity.

## Comparison Table
| Style            | Complexity | Scalability | Best For                        |
|------------------|-----------|------------|---------------------------------|
| N-tier           | Low       | Moderate   | Traditional business, migration |
| Web-Queue-Worker | Low       | High       | Simple + background jobs        |
| Microservices    | High      | High       | Complex, evolving domains       |
| Event-Driven     | High      | High       | Real-time, IoT, decoupling      |
| Big Data         | High      | High       | Analytics, ML, IoT              |
| Big Compute      | High      | High       | Simulations, HPC                |

## See Also
- [Azure Architecture Center — Architecture Styles](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/) — Microsoft (CC BY 4.0)
