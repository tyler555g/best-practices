# Caching

Caching improves system performance and scalability by storing frequently accessed data closer to the application. Use caching to reduce latency, offload backend systems, and increase throughput. Monitor cache-hit ratio to evaluate effectiveness.

## Caching Strategies

### Cache-Aside (Lazy Loading)
Application loads data into the cache on demand. If data is not present, it is fetched from the source and added to the cache. Use for read-heavy workloads with infrequent updates.

### Read-Through
Cache transparently loads data from the source when a cache miss occurs. The application always interacts with the cache, which manages data retrieval.

### Write-Through
Writes are made to the cache and immediately persisted to the underlying data store. Ensures consistency but may introduce write latency.

### Write-Behind (Write-Back)
Writes are made to the cache and asynchronously persisted to the data store. Improves write performance but risks data loss if the cache fails before persistence.

## Cache Invalidation

Implement expiration policies and explicit invalidation to prevent stale data. Use time-to-live (TTL), event-based, or manual invalidation strategies. Ensure clients do not serve outdated data.

## Distributed Caching

Use distributed caches to share data across multiple application instances. Partition and replicate data for scalability and high availability. Monitor for consistency and handle network partitions gracefully.

## Local (In-Memory) Caching

Store frequently accessed data in memory within the application process. Provides low latency but is limited by available memory and may lead to data inconsistency across instances.

## Anti-patterns

Avoid using the cache as the sole source of truth. Do not cache highly volatile or sensitive data without strong invalidation. Prevent cache stampedes by using locking or request coalescing.

## See Also
- [Original Microsoft source — Microsoft (CC BY 4.0)](https://github.com/MicrosoftDocs/architecture-center/blob/main/docs/best-practices/caching-content.md)
