# Data Partitioning Best Practices

Partitioning data is essential for scalability, performance, and maintainability in distributed systems. This guide summarizes key strategies and considerations for effective data partitioning.

## Partitioning Strategies

### Horizontal Partitioning (Sharding)
- Distribute rows across partitions based on a partition key (e.g., customer ID).
- Enables scaling out by spreading data and load across multiple storage nodes.
- Choose partition keys that ensure even data and access distribution.
- Avoid cross-partition operations when possible.

### Vertical Partitioning
- Split data by columns, grouping frequently accessed fields together.
- Store different groups in separate tables, collections, or data structures.
- Useful for optimizing access patterns and reducing I/O.

### Functional Partitioning
- Divide data by business function or domain (e.g., orders vs. customers).
- Supports modularity and independent scaling of subsystems.
- Enables clear ownership and isolation between domains.

## Design Considerations
- Select partition keys based on access patterns and scalability needs.
- Avoid hotspots by hashing keys or distributing high-traffic data.
- Replicate reference data across partitions to minimize cross-partition joins.
- Ensure transactional boundaries align with partition boundaries.
- Plan for rebalancing and repartitioning as data grows.
- Monitor partition sizes and performance regularly.

## See Also
- [Database sharding patterns — Microsoft (CC BY 4.0)](https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding)
- [Consistent hashing (Wikipedia)](https://en.wikipedia.org/wiki/Consistent_hashing)
- [CAP theorem — Brewer's conjecture](https://people.eecs.berkeley.edu/~brewer/cs262b-2004/PODC-keynote.pdf)
- [API design best practices](api-design.md)
