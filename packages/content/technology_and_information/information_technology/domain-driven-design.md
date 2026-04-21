# Domain-Driven Design

**Domain-Driven Design (DDD)** — a software development approach that models complex business domains by aligning software structure with business knowledge. Introduced by Eric Evans (2003), DDD emphasizes creating a shared understanding between technical and business teams through collaborative modeling and explicit domain boundaries. Essential for systems where business complexity justifies the modeling overhead.

DDD applies most effectively when:
- **Business complexity is high** — complex rules, workflows, and domain logic
- **Domain expertise is critical** — business knowledge is a competitive advantage  
- **Long-term evolution** — the system needs to adapt as domain knowledge grows
- **Cross-functional collaboration** — technical and business teams work closely together

The approach centers on creating a **ubiquitous language** — a shared vocabulary between developers and domain experts — and organizing code around **bounded contexts** that reflect natural business boundaries.

## The Modeling Process

The **8-step DDD starter modeling process** provides a structured approach for applying DDD from business understanding to code implementation:

1. **Understand** — Align with business model, user needs, and organizational goals using Business Model Canvas and User Story Mapping
2. **Discover** — Explore the domain using collaborative techniques like EventStorming to identify business processes and events
3. **Decompose** — Break down the domain into smaller, manageable subdomains and identify core vs supporting areas
4. **Strategize** — Classify domains by business importance using Core Domain Charts to prioritize investment
5. **Connect** — Map relationships between contexts using Context Mapping patterns to understand dependencies
6. **Organize** — Align team structures with domain boundaries following Conway's Law principles  
7. **Define** — Design bounded contexts with clear interfaces using the Bounded Context Canvas
8. **Code** — Implement the domain model using tactical DDD patterns like aggregates, entities, and value objects

**Note:** This sequence is adaptable — real projects involve iterating between steps as understanding evolves.

## Strategic Design

### Bounded Contexts

**Bounded Context** — an explicit boundary around a domain model where terms and concepts have specific meaning. Each context maintains its own ubiquitous language and can implement different models for the same business concepts.

Key characteristics:
- **Name and Purpose** — clear identity and business responsibility
- **Strategic Classification** — core domain, supporting domain, or generic subdomain
- **Domain Roles** — behavioral patterns like analysis context, execution context, or gateway context
- **Communication Interfaces** — inbound and outbound messages with clear relationships
- **Ubiquitous Language** — domain-specific terminology and definitions
- **Business Decisions** — rules and policies enforced within the context

Use the **Bounded Context Canvas** to collaboratively design context boundaries, considering purpose, interfaces, dependencies, and internal language.

### Context Mapping Patterns

**Context Mapping** — visualization of relationships between bounded contexts using nine established patterns and three team relationship types.

#### Team Relationships
- **Upstream/Downstream** — upstream changes affect downstream, but not vice versa
- **Mutually Dependent** — changes in either context require coordinated delivery  
- **Free** — contexts operate independently with no significant coupling

#### Context Map Patterns
- **Open-Host Service** — standardized protocol for multiple downstream consumers
- **Conformist** — downstream adopts upstream model without translation
- **Anti-Corruption Layer** — translation layer protecting downstream from upstream changes
- **Shared Kernel** — carefully managed shared subset of domain model
- **Partnership** — coordinated development between mutually dependent contexts
- **Customer/Supplier** — formal relationship where upstream considers downstream needs
- **Published Language** — well-documented shared language for inter-context communication
- **Separate Ways** — contexts with no meaningful relationship operate independently
- **Big Ball of Mud** — legacy system with unclear boundaries to be contained

Choose patterns based on team relationships, business dependencies, and technical constraints.

### Core Domain Charts

**Core Domain Charts** — visualization technique plotting domain complexity against business differentiation to guide investment decisions.

**Complexity axis** considers:
- Essential domain complexity (difficult conceptual modeling)
- Accidental technical complexity (over-engineered solutions)
- Operational complexity (processes outside software)
- Scale requirements and specialist expertise needs

**Differentiation axis** evaluates:
- Competitive advantage potential
- Revenue generation capability  
- Market positioning importance
- Difficulty for competitors to replicate

**Classifications:**
- **Core Domain** — high complexity, high differentiation; deserves primary investment
- **Supporting Domain** — necessary but not differentiating; minimal viable solution
- **Generic Subdomain** — low differentiation; buy or use off-the-shelf solutions

## Tactical Design

### Aggregates

**Aggregate** — consistency boundary grouping related entities and value objects under a single root entity. Aggregates enforce business invariants and control concurrent access to domain objects.

Key design dimensions:
- **State Transitions** — explicit lifecycle states the aggregate passes through
- **Enforced Invariants** — business rules that must never be violated within the boundary
- **Corrective Policies** — compensating logic when invariants are relaxed across boundaries
- **Message Interface** — commands handled and events produced
- **Throughput Considerations** — command rate and client concurrency affecting conflict probability
- **Size Management** — event count and growth rate impacting performance

Use the **Aggregate Design Canvas** to balance consistency, performance, and complexity trade-offs.

### Entities and Value Objects

**Entity** — object with distinct identity that persists through state changes. Identity matters more than attributes.

**Value Object** — immutable object defined by its attributes rather than identity. Two value objects with same attributes are considered equal.

**Guidelines:**
- Prefer value objects when identity doesn't matter
- Use entities for concepts that change over time while maintaining identity
- Value objects can contain other value objects and reference entities by identity
- Design value objects as immutable to prevent shared state issues

### Domain Events

**Domain Events** — significant business occurrences that domain experts care about. Events enable loose coupling between aggregates and support eventual consistency patterns.

**Characteristics:**
- Named in past tense (OrderPlaced, PaymentProcessed)
- Contain relevant data for subscribers
- Immutable once published
- Enable temporal coupling between bounded contexts

Events facilitate **event sourcing** (storing events as primary state) and **CQRS** (command query responsibility segregation) patterns.

## Collaborative Modelling

### EventStorming

**EventStorming** — collaborative workshop technique using colored sticky notes to explore domain events and build shared understanding.

#### Three Formats:

**Big Picture EventStorming** (10-30+ people):
- **Domain Events** (orange) — business events in timeline order
- **Hotspots** (pink) — conflicts, questions, or pain points  
- **Opportunities** (green) — potential improvements
- **Actors** (small yellow) — people or roles triggering events
- **Systems** (wide pink) — technical systems involved
- **Pivotal Events** — most significant events in the flow
- **Swimlanes** — organizing by department or actor
- **Emerging Bounded Contexts** — natural boundary indicators

**Process Modelling EventStorming**:
- **Commands/Actions** (blue) — decisions or intents triggering events
- **Policies** (lilac) — business rules like "whenever X happens, do Y"
- **Query Models/Information** (green) — data needed for decisions
- **External Systems** — integration points and dependencies

**Software Design EventStorming**:
- **Constraints** (yellow) — business rules limiting command execution
- **Aggregates** (implied) — consistency boundaries around related events
- **Read Models** — projections supporting query requirements

### Other Techniques

**Domain Storytelling** — using pictographs to model business processes as stories with actors, work objects, and activities.

**Example Mapping** — structured conversation around concrete examples to discover rules and edge cases.

## Message Flow Design

**Domain Message Flow Modelling** — visualization of commands, events, and queries flowing between bounded contexts for specific scenarios.

**Message types:**
- **Commands** — requests to do something
- **Events** — notifications that something happened  
- **Queries** — requests for information

**Design principles:**
- Follow **Miller's Law** — limit to 5-9 messages per diagram
- Show message order and data contents
- Use separate or combined formats for message name and contents
- Model time-dependent messages explicitly (timeouts, schedules)
- Focus on inter-context communication, not internal flows

Effective for validating context boundaries and designing integration patterns.

## Anti-patterns

- **Big Ball of Mud** — no clear boundaries; mixed models and inconsistent language propagation
- **Anemic Domain Model** — entities with only getters/setters; all business logic relegated to services
- **Leaky Abstractions** — internal domain concepts exposed to external consumers, creating unwanted coupling
- **Over-sized Aggregates** — too many entities in one aggregate leading to performance and concurrency issues
- **Under-sized Aggregates** — excessive granularity splitting invariants across aggregate boundaries
- **Context Coupling** — shared databases or synchronous dependencies violating bounded context autonomy
- **Generic Subdomain Investment** — over-engineering non-differentiating capabilities
- **Premature Decomposition** — splitting into microservices before understanding domain boundaries

## Checklist

DDD adoption readiness assessment:

- [ ] **Business Complexity** — Does domain complexity justify modeling investment?
- [ ] **Domain Expert Access** — Are knowledgeable business stakeholders available for collaboration?
- [ ] **Team Commitment** — Is team willing to invest in domain learning and modeling sessions?
- [ ] **Long-term Focus** — Is this a system expected to evolve over multiple years?
- [ ] **Collaborative Culture** — Can technical and business teams work effectively together?
- [ ] **Learning Budget** — Is time allocated for iterative domain discovery and model refinement?
- [ ] **Bounded Context Viability** — Can team structure align with natural domain boundaries?
- [ ] **Technical Foundation** — Are patterns like dependency injection and automated testing established?
- [ ] **Stakeholder Buy-in** — Do decision-makers understand DDD requires upfront modeling investment?
- [ ] **Measurement Capability** — Can business impact of domain-aligned architecture be evaluated?

## See Also

- [Domain-Driven Design: Tackling Complexity in the Heart of Software](https://www.domainlanguage.com/ddd/) — Eric Evans (2003)
- [DDD Reference](https://domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) — Eric Evans
- [ddd-crew](https://github.com/ddd-crew) — Community modeling resources (CC BY 4.0)
- [EventStorming](https://www.eventstorming.com/) — Alberto Brandolini
- [Implementing Domain-Driven Design](https://vaughnvernon.co/?page_id=168) — Vaughn Vernon (2013)
- [Learning Domain-Driven Design](https://www.oreilly.com/library/view/learning-domain-driven-design/9781098100124/) — Vlad Khononov (2021)
- [Architecture Modernization](https://www.manning.com/books/architecture-modernization) — Nick Tune (2024)