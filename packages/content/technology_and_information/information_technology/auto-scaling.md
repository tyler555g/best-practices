# Auto-Scaling

Auto-scaling dynamically adjusts resources to balance cost and performance. It enables systems to handle variable workloads efficiently, scaling out during demand spikes and scaling in to save costs during low usage.

## Scaling Types

### Horizontal Scaling (Scale Out/In)
Add or remove instances of resources to meet demand. Preferred for stateless workloads and cloud-native architectures. Enables high availability and fault tolerance.

### Vertical Scaling (Scale Up/Down)
Increase or decrease the capacity of a single resource (e.g., CPU, memory). Useful for legacy or monolithic systems but may require downtime and has physical limits.

## Metrics-Based Scaling

Trigger scaling actions based on real-time metrics such as CPU usage, memory, queue length, or custom business KPIs. Use aggregated metrics to avoid rapid oscillation (flapping).

## Scheduled Scaling

Adjust resources based on predictable workload patterns (e.g., business hours, seasonal peaks). Combine with metrics-based scaling for optimal results.

## Scaling Strategies

Design applications to be stateless and loosely coupled. Use message queues to decouple components. Set safe minimum and maximum resource limits. Test scaling policies under load.

## Anti-patterns

Avoid manual scaling for dynamic workloads. Do not assume scaling is instantaneous. Prevent resource thrashing by setting appropriate thresholds and cooldown periods.

## See Also
- [Original Microsoft source — Microsoft (CC BY 4.0)](https://github.com/MicrosoftDocs/architecture-center/blob/main/docs/best-practices/auto-scaling.md)
