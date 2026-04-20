# Resilience and Fault Handling

Building resilient systems requires anticipating and handling faults gracefully. This guide outlines best practices for retry strategies, fault handling patterns, and robust system design.

## Retry Strategies

### Exponential Backoff
- Increase wait time between retries exponentially after each failure.
- Add random jitter to avoid synchronized retries (retry storms).
- Use for transient errors like network timeouts or throttling.

### Circuit Breaker
- Prevent repeated failures by "opening" the circuit after a threshold of errors.
- Allow periodic tests to check if the service has recovered.
- Protects downstream systems from overload.

### Retry Policies
- Define maximum retry count and total timeout.
- Avoid infinite retries; use budgets to limit aggregate retry load.
- Log and monitor retry attempts and failures.

## Fault Handling Patterns

### Graceful Degradation
- Provide reduced functionality when dependencies fail, rather than total outage.
- Inform users of limited service and recover automatically when possible.

### Bulkhead Isolation
- Isolate components or resources to prevent failures from cascading.
- Use separate pools, queues, or containers for critical workloads.

### Timeout Management
- Set appropriate timeouts for all external calls.
- Balance between responsiveness and allowing for recovery.
- Combine with retries and circuit breakers for robust handling.

## See Also
- Retry pattern
- Circuit Breaker pattern
- Chaos engineering
- [Data partitioning best practices](data-partitioning.md)
