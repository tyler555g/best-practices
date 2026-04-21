# Software Antipatterns

Performance antipatterns are common design and implementation mistakes that cause scalability and reliability issues in software systems. Recognizing these antipatterns helps teams avoid pitfalls and build more robust applications.

## Busy Database
- **Problem** — Offloading too much processing to the database.
- **Symptoms** — High database CPU, slow queries, application stalls.
- **Solution** — Move logic to the application layer, optimize queries, and scale out reads/writes.

## Busy Front End
- **Problem** — Moving resource-intensive tasks to background threads in the front end.
- **Symptoms** — UI freezes, high client CPU, poor responsiveness.
- **Solution** — Offload heavy work to backend services or use asynchronous processing.

## Chatty I/O
- **Problem** — Sending many small network requests instead of batching.
- **Symptoms** — High network latency, increased load, slow performance.
- **Solution** — Batch requests, use bulk APIs, and minimize round-trips.

## Extraneous Fetching
- **Problem** — Retrieving more data than needed.
- **Symptoms** — Unnecessary I/O, slow responses, wasted bandwidth.
- **Solution** — Fetch only required data, use projections, and filter at the source.

## Improper Instantiation
- **Problem** — Repeatedly creating and destroying shared objects.
- **Symptoms** — High memory/CPU usage, resource leaks, slow performance.
- **Solution** — Use object pooling or singleton patterns for reusable resources.

## Monolithic Persistence
- **Problem** — Using a single data store for all data types and workloads.
- **Symptoms** — Contention, slow queries, scaling bottlenecks.
- **Solution** — Separate data stores by access patterns and scale independently.

## No Caching
- **Problem** — Failing to cache frequently accessed data.
- **Symptoms** — Repeated database hits, slow responses, high load.
- **Solution** — Implement caching for hot data, use cache invalidation strategies.

## Noisy Neighbor
- **Problem** — One tenant or workload consumes disproportionate resources.
- **Symptoms** — Unpredictable performance, resource starvation for others.
- **Solution** — Isolate tenants, use quotas, and monitor resource usage.

## Retry Storm
- **Problem** — Excessive retries to a failing service.
- **Symptoms** — Cascading failures, increased load, degraded performance.
- **Solution** — Implement exponential backoff, circuit breakers, and cap retries.

## Synchronous I/O
- **Problem** — Blocking threads while waiting for I/O operations.
- **Symptoms** — Thread starvation, poor scalability, slow throughput.
- **Solution** — Use asynchronous I/O and non-blocking patterns.

## See Also
- [Performance Antipatterns](https://learn.microsoft.com/en-us/azure/architecture/antipatterns/) — Microsoft (CC BY 4.0)
