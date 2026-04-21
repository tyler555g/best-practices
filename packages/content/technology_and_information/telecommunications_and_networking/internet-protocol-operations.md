# Internet Protocol Operations

Internet Protocol (IP) operations form the foundation of global internet connectivity. This guide covers essential operational practices for network security, routing protection, and infrastructure management based on IETF best current practices.

## Network Ingress Filtering (BCP 38)

Source address spoofing enables various denial-of-service attacks and obscures attack origins. Network ingress filtering provides a fundamental defense mechanism based on BCP 38 / RFC 2827.

### Source Address Spoofing

**Attack Pattern:**
- Attackers forge source IP addresses in packet headers
- Makes attack traffic appear to originate from different sources
- Complicates victim response and attack attribution
- Enables reflection and amplification attacks

**Common Spoofing Scenarios:**
- TCP SYN floods with unreachable source addresses
- UDP floods targeting broadcast amplification services
- ICMP floods using forged source addresses
- Reflection attacks against innocent third parties

### Filtering Technique

**Basic Filtering Principle:**
- Accept only packets with source addresses from legitimately advertised prefixes
- Reject packets claiming to originate from outside aggregated announcements
- Apply filters at network ingress points (customer-facing interfaces)

**Implementation Methods:**

**Access Control Lists (ACLs):**
```
# Example Cisco IOS configuration
access-list 100 permit ip 192.0.2.0 0.0.0.255 any
access-list 100 deny ip any any log
interface Serial0/0
 ip access-group 100 in
```

**Route-Based Filtering:**
```
# Example using routing table verification
if (source_prefix not in customer_routes):
    drop_packet()
```

**Reverse Path Forwarding (RPF):**
- Verify packet source address matches return path
- Automatic filtering based on routing table state
- Available in strict and loose modes

### Deployment Considerations

**Network Topology Factors:**
- Single-homed networks: Straightforward implementation
- Multi-homed networks: Requires coordination between providers
- Transit providers: Filter customer prefixes, not transit traffic
- Internet exchanges: May implement broad filtering policies

**Operational Requirements:**
- Coordinate with upstream providers for proper route advertisements
- Update filters when customer prefixes change
- Monitor filter effectiveness and false positives
- Document filtering policies and procedures

**Performance Impact:**
- Hardware-based filtering typically has minimal performance impact
- Software-based filtering may require capacity planning
- Consider filter complexity and rule optimization
- Monitor CPU utilization on filtering devices

## Multihomed Networks (BCP 84)

Multihomed networks connect to multiple ISPs for redundancy and performance. Additional considerations apply for ingress filtering in these environments based on BCP 84 / RFC 3704.

### Enhanced Filtering Approaches

**Feasible Path Validation:**
- Verify source addresses could have arrived via the receiving interface
- Accounts for multiple valid paths in multihomed scenarios
- More complex than simple prefix matching

**Loose Mode RPF:**
- Packet accepted if source address reachable via any interface
- Less strict than traditional RPF but handles asymmetric routing
- Balances security with operational flexibility

### Provider Coordination

**Route Advertisement Consistency:**
- Ensure all upstream providers receive same route announcements
- Coordinate filtering policies with all providers
- Document multihoming configuration and policies
- Plan for provider failures and route convergence

## Traffic Engineering and Filtering

### BGP Security Considerations

**Route Origin Validation (ROV):**
- Implement RPKI-based route origin validation
- Reject routes not authorized by legitimate origin AS
- Deploy incrementally with monitoring for false positives

**AS Path Validation:**
- Monitor for unexpected AS paths
- Implement basic AS path filtering policies
- Consider ASPA (AS Path Authorization) when available

### DDoS Mitigation Integration

**Upstream Coordination:**
- Establish DDoS mitigation procedures with upstream providers
- Implement rate limiting and traffic shaping policies
- Consider blackhole routing for severe attacks

**Monitoring and Response:**
- Deploy network monitoring for attack detection
- Implement automated response systems where appropriate
- Maintain incident response procedures

## IPv6 Considerations

### IPv6 Ingress Filtering

**Address Space Characteristics:**
- Larger address space reduces effectiveness of random spoofing
- Provider-assigned prefixes typically well-defined
- Consider unique local addresses (ULA) in filtering policies

**Transition Mechanisms:**
- Filter 6to4 and Teredo traffic appropriately
- Consider dual-stack deployment implications
- Monitor for IPv6-specific attack vectors

### IPv6-Specific Attacks

**Extension Header Filtering:**
- Filter packets with excessive extension headers
- Implement hop-by-hop options filtering
- Consider ICMPv6 filtering policies

## Implementation Guidelines

### Deployment Strategy

**Phased Implementation:**
1. **Planning Phase**: Assess network topology and requirements
2. **Testing Phase**: Deploy in test environment with monitoring
3. **Pilot Deployment**: Implement on subset of interfaces
4. **Full Deployment**: Roll out to all appropriate interfaces
5. **Monitoring Phase**: Continuous monitoring and optimization

**Documentation Requirements:**
- Network topology and filtering points
- Filtering policies and configurations
- Emergency procedures and contact information
- Regular review and update procedures

### Monitoring and Maintenance

**Performance Metrics:**
- Packet filtering rates and dropped packets
- False positive detection and resolution
- Network performance impact assessment
- Security incident correlation

**Regular Review:**
- Update filters for network topology changes
- Review effectiveness against current threat landscape
- Coordinate with industry best practices evolution
- Participate in operational security communities

## Limitations and Considerations

### Technical Limitations

**Asymmetric Routing:**
- May cause legitimate traffic to be filtered
- Requires careful configuration in complex topologies
- Consider using loose RPF mode where appropriate

**Mobile and Dynamic Addressing:**
- DHCP and mobile networks present challenges
- Consider dynamic filtering updates where necessary
- Balance security with operational flexibility

### Operational Challenges

**Administrative Overhead:**
- Requires ongoing maintenance and updates
- Coordination with multiple administrative domains
- Training and documentation requirements

**Limited Effectiveness:**
- Does not prevent attacks from valid address space
- Attackers may adapt to use legitimate prefixes
- Must be part of comprehensive security strategy

## See Also

- **Core Standards:** [RFC 2827 / BCP 38](https://www.rfc-editor.org/rfc/rfc2827) (Network Ingress Filtering), [RFC 3704 / BCP 84](https://www.rfc-editor.org/rfc/rfc3704) (Ingress Filtering for Multihomed Networks), [RFC 8704](https://www.rfc-editor.org/rfc/rfc8704) (Enhanced Feasible-Path uRPF)
- **RPKI Resources:** [RFC 6480](https://www.rfc-editor.org/rfc/rfc6480) (RPKI Architecture), [RFC 8210](https://www.rfc-editor.org/rfc/rfc8210) (RPKI Router Protocol)
- **Operational Guides:** [MANRS](https://www.manrs.org/) (Mutually Agreed Norms for Routing Security)
- **Communities:** [NANOG](https://www.nanog.org/), [RIPE NCC](https://www.ripe.net/)
