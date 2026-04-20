# DevOps Best Practices

DevOps is a philosophy and set of practices that emphasize culture, automation, measurement, and sharing (CALMS). The goal is to enable the continuous delivery of value to users with high reliability and rapid feedback.

## Culture and Collaboration
### Shared Ownership
- **Empower teams to own delivery end-to-end** — Developers, operations, and QA share responsibility for outcomes, not just their siloed tasks.
- **Foster psychological safety** — Encourage open communication and learning from failures without blame.

### Blameless Post-Mortems
- **Analyze incidents without finger-pointing** — Focus on systemic improvements, not individual fault.
- **Document and share learnings** — Make post-mortem results accessible to prevent recurrence.

### Cross-Functional Teams
- **Include all roles needed for delivery** — Developers, testers, operations, and security collaborate from planning through production.
- **Break down silos** — Use shared goals and metrics to align priorities.

## Continuous Integration
### Trunk-Based Development
- **Work in short-lived branches or directly on main** — Reduce merge conflicts and integration pain.
- **Integrate changes frequently** — Merge to mainline at least daily.

### Build Automation
- **Automate builds and tests on every commit** — Ensure rapid feedback and early defect detection.
- **Fail fast** — Stop the pipeline on errors to prevent broken code from progressing.

### Code Quality Gates
- **Enforce code reviews and automated checks** — Use static analysis, linting, and peer review before merging.
- **Require tests to pass before integration** — Maintain a healthy mainline.

## Continuous Delivery and Deployment
### Deployment Pipelines
- **Automate the path from commit to production** — Use pipelines to build, test, and deploy consistently.
- **Promote artifacts through environments** — Use the same artifact for all stages to ensure consistency.

### Immutable Artifacts
- **Build once, deploy many** — Artifacts are never modified after creation; deployments are repeatable.

### Progressive Rollouts (Canary, Blue-Green, Feature Flags)
- **Release changes gradually** — Limit blast radius and monitor impact before full rollout.
- **Use feature flags for safe toggling** — Decouple deployment from release.

### Rollback Strategies
- **Automate rollbacks** — Enable rapid recovery from failed deployments.
- **Keep rollback procedures tested and documented** — Practice regularly.

## Infrastructure as Code
### Declarative Configuration
- **Describe infrastructure in code** — Use declarative files for reproducibility and review.

### Version-Controlled Infrastructure
- **Store infrastructure code in Git repositories** — Enable traceability, peer review, and rollback.

### Environment Parity
- **Align dev, test, and prod environments** — Minimize drift to reduce surprises in production.

## Testing Strategies
### Testing Pyramid (Unit, Integration, E2E)
- **Prioritize fast, reliable unit tests** — Form the base of the pyramid.
- **Add integration and end-to-end tests** — Cover system interactions and user flows.

### Shift-Left Testing
- **Test early and often** — Integrate testing into development, not just pre-release.

### Chaos Engineering and Fault Injection
- **Inject failures to test resilience** — Simulate outages and validate recovery mechanisms.

### Performance and Load Testing
- **Validate against real-world usage patterns** — Test for scalability and reliability under load.

## Monitoring and Feedback Loops
### DORA Metrics (Deployment Frequency, Lead Time, MTTR, Change Failure Rate)
- **Track key performance indicators** — Use metrics to drive improvement and benchmark progress.

### Observability Integration
- **Instrument applications and infrastructure** — Collect logs, metrics, and traces for visibility.

### Alerting and On-Call
- **Set actionable alerts** — Minimize noise and ensure rapid response to real issues.
- **Rotate on-call duties** — Distribute operational load fairly.

## Security in the Pipeline (DevSecOps)
### Static Analysis (SAST)
- **Scan code for vulnerabilities on every commit** — Integrate into CI pipelines.

### Dependency Scanning (SCA)
- **Monitor third-party libraries for risks** — Automate checks for known vulnerabilities.

### Secrets Management
- **Never store secrets in code** — Use secure vaults and inject secrets at runtime.

### Supply Chain Security
- **Verify provenance of dependencies and artifacts** — Use signed packages and checksums.

## Anti-patterns
- **Manual Snowflake Servers** — Hand-configured environments that can't be reproduced
- **Long-Lived Feature Branches** — Diverging branches that create merge pain
- **Deployment Fear** — Infrequent deploys due to lack of confidence in pipeline
- **Alert Fatigue** — Too many noisy alerts drowning real signals
- **Testing in Production Only** — No pre-production validation

## Checklist
- **Is your build and deployment fully automated?**
- **Are all infrastructure changes managed as code?**
- **Do you use trunk-based development with frequent integration?**
- **Are all code changes peer-reviewed and tested before merging?**
- **Is there a clear rollback strategy for failed deployments?**
- **Are environments (dev, test, prod) consistent and reproducible?**
- **Do you track DORA metrics and act on them?**
- **Are security scans integrated into your CI/CD pipeline?**
- **Is monitoring and alerting actionable and tied to business outcomes?**
- **Are post-mortems blameless and shared across teams?**

## See Also
- [Azure Architecture Center — DevOps](https://learn.microsoft.com/en-us/azure/architecture/guide/devops/devops-start-here) — Microsoft (CC BY 4.0)
- [DevOps Checklist](https://learn.microsoft.com/en-us/azure/architecture/checklist/dev-ops) — Microsoft (CC BY 4.0)
- [Accelerate](https://itrevolution.com/product/accelerate/) — Nicole Forsgren, Jez Humble, Gene Kim
- [The Phoenix Project](https://itrevolution.com/product/the-phoenix-project/) — Gene Kim, Kevin Behr, George Spafford
- [Site Reliability Engineering](https://sre.google/sre-book/table-of-contents/) — Google
