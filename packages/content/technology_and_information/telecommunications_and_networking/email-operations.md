# Email Operations Best Practices

Email remains a critical business communication platform that requires robust security and operational practices. This guide synthesizes IETF standards for email authentication, transport security, and operational excellence to protect against spoofing, phishing, and eavesdropping attacks.

## Sender Authentication

Email authentication prevents spoofing and enables recipients to verify message legitimacy. Implement all three core authentication mechanisms for comprehensive protection.

### SPF (RFC 7208)

Sender Policy Framework (SPF) authorizes IP addresses permitted to send email for a domain.

**SPF Record Structure:**
```
v=spf1 include:_spf.google.com include:mailgun.org ip4:192.0.2.100 ~all
```

**SPF Mechanisms:**
- `include:domain`: Include another domain's SPF policy
- `ip4:address/prefix`: Authorize specific IPv4 addresses
- `ip6:address/prefix`: Authorize specific IPv6 addresses
- `a:domain`: Authorize A record addresses
- `mx:domain`: Authorize MX record addresses

**SPF Qualifiers:**
- `+` (pass): Explicitly authorize mechanism
- `-` (fail): Explicitly deny mechanism  
- `~` (soft fail): Discourage but don't reject
- `?` (neutral): No statement about authorization

**SPF Best Practices:**
- Start with `~all` (soft fail) for testing, progress to `-all` (hard fail)
- Limit DNS lookups to 10 or fewer (RFC requirement)
- Use `include:` for third-party services rather than IP addresses
- Monitor SPF alignment failures in DMARC reports
- Keep records concise to avoid DNS limitations

### DKIM (RFC 6376)

DomainKeys Identified Mail (DKIM) provides cryptographic signatures for email messages.

**DKIM Signature Header:**
```
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com;
  s=selector1; h=from:to:subject:date; b=base64signature
```

**Key DKIM Parameters:**
- `v=1`: DKIM version
- `a=rsa-sha256`: Signature algorithm (RSA with SHA-256)
- `c=relaxed/relaxed`: Canonicalization (header/body)
- `d=domain`: Signing domain
- `s=selector`: Key selector for DNS lookup
- `h=headers`: Signed header fields
- `b=signature`: Cryptographic signature

**DKIM Implementation:**
- Use 2048-bit RSA keys minimum (4096-bit preferred for new deployments)
- Sign essential headers: From, To, Subject, Date, Message-ID
- Implement key rotation (annually or bi-annually)
- Use multiple selectors for operational flexibility
- Monitor signature validation rates

**DNS Key Record Format:**
```
selector1._domainkey.example.com. TXT "v=DKIM1; k=rsa; p=MIIBIjANB..."
```

### DMARC (RFC 7489)

Domain-based Message Authentication, Reporting, and Conformance (DMARC) coordinates SPF and DKIM results with policy enforcement.

**DMARC Record Structure:**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@example.com; 
ruf=mailto:dmarc-failures@example.com; sp=reject; adkim=s; aspf=s
```

**DMARC Policy Options:**
- `p=none`: Monitor only (no enforcement action)
- `p=quarantine`: Mark suspicious messages (spam folder)
- `p=reject`: Reject failing messages entirely

**DMARC Parameters:**
- `rua=email`: Aggregate report destination
- `ruf=email`: Forensic report destination (detailed failures)
- `sp=policy`: Subdomain policy (if different from main domain)
- `adkim=s/r`: DKIM alignment (strict/relaxed)
- `aspf=s/r`: SPF alignment (strict/relaxed)
- `pct=percentage`: Percentage of messages to apply policy

**DMARC Deployment Strategy:**
1. **Monitor Phase**: Deploy with `p=none` to collect data
2. **Analysis Phase**: Review reports for legitimate vs. malicious traffic
3. **Quarantine Phase**: Implement `p=quarantine` for suspicious messages
4. **Reject Phase**: Full protection with `p=reject`

**Alignment Requirements:**
- **SPF Alignment**: Return-Path domain matches From domain
- **DKIM Alignment**: Signing domain matches From domain
- **Relaxed Alignment**: Organizational domain matching (example.com ≈ mail.example.com)
- **Strict Alignment**: Exact domain matching required

## Transport Security

Email transport security protects messages in transit using encryption and secure protocols.

### MTA-STS (RFC 8461)

Mail Transfer Agent Strict Transport Security enforces secure SMTP connections.

**MTA-STS Policy Publication:**
1. **DNS TXT Record:**
```
_mta-sts.example.com. TXT "v=STSv1; id=20231201T120000"
```

2. **HTTPS Policy File** (at https://mta-sts.example.com/.well-known/mta-sts.txt):
```
version: STSv1
mode: enforce
mx: mail.example.com
max_age: 86400
```

**MTA-STS Policy Modes:**
- `none`: Policy explicitly disabled; no enforcement or reporting
- `testing`: Report violations but don't enforce
- `enforce`: Reject mail if secure delivery impossible

**MTA-STS Implementation:**
- Deploy valid TLS certificates for mail servers
- Configure policy with appropriate MX records
- Monitor policy violations through TLS reporting
- Use reasonable max_age values (start with 1 day)

### Cleartext Deprecation (RFC 8314)

Modern email systems should eliminate cleartext transmission and authentication.

**Secure Protocol Requirements:**
- **SMTP Submission**: Use port 587 with STARTTLS or port 465 with implicit TLS
- **IMAP Access**: Use port 993 (IMAPS) or port 143 with STARTTLS
- **POP Access**: Use port 995 (POP3S) or port 110 with STARTTLS

**Legacy Protocol Restrictions:**
- Disable cleartext authentication over non-TLS connections
- Require STARTTLS for SMTP submission and email access
- Consider disabling legacy ports (25, 143, 110) for client access
- Implement secure authentication mechanisms (PLAIN, LOGIN over TLS)

**TLS Configuration:**
- Use TLS 1.2 minimum, prefer TLS 1.3
- Configure strong cipher suites
- Implement proper certificate validation
- Support Perfect Forward Secrecy

### SMTP TLS Reporting (RFC 8460)

TLS reporting provides visibility into email transport security.

**TLSRPT DNS Record:**
```
_smtp._tls.example.com. TXT "v=TLSRPTv1; rua=mailto:tlsrpt@example.com"
```

**Report Analysis:**
- Monitor TLS negotiation success rates
- Identify certificate validation failures
- Track policy violations and delivery issues
- Use reports to improve transport security configuration

## Operational Excellence

### Email Infrastructure Security

**Server Hardening:**
- Keep mail server software updated with security patches
- Configure minimal services on mail servers
- Implement proper access controls and authentication
- Use dedicated mail server infrastructure when possible

**Network Security:**
- Deploy mail server behind appropriate firewalls
- Implement rate limiting and connection controls
- Monitor for unusual traffic patterns
- Consider geographic restrictions for administrative access

### Monitoring and Alerting

**Authentication Metrics:**
- SPF, DKIM, and DMARC pass rates
- Authentication failure trends and sources
- Report processing and analysis
- Policy effectiveness measurement

**Transport Security Metrics:**
- TLS adoption rates for inbound and outbound mail
- Certificate validation success rates
- Secure connection establishment rates
- Protocol downgrade attempts

### Anti-Abuse Measures

**Spam and Abuse Prevention:**
- Implement reputation monitoring for IP addresses and domains
- Deploy content filtering and rate limiting
- Monitor blacklist status and remediation
- Maintain abuse reporting and response procedures

**Incident Response:**
- Develop procedures for authentication failures
- Plan for certificate expiration and renewal
- Establish communication channels for abuse reports
- Document escalation procedures for security incidents

### Compliance and Reporting

**DMARC Report Processing:**
- Automate aggregate report collection and analysis
- Track authentication trends and policy effectiveness
- Identify legitimate sources requiring authentication fixes
- Monitor for new unauthorized sending sources

**Regulatory Compliance:**
- Consider data retention requirements for email security logs
- Implement appropriate privacy protections for email metadata
- Document email security policies and procedures
- Maintain incident response and breach notification procedures

## See Also

- **Core Standards:** RFC 7208 (SPF), RFC 6376 (DKIM), RFC 7489 (DMARC), RFC 8461 (MTA-STS)
- **Security Standards:** RFC 8314 (Cleartext Deprecation), RFC 8460 (TLS Reporting)
- **Implementation Guides:** M3AAWG best practices, Anti-Phishing Working Group resources
- **Tools:** DMARC analyzers, SPF record validators, DKIM signature testers
- **Organizations:** M3AAWG (Messaging Anti-Abuse Working Group), APWG (Anti-Phishing Working Group)
- **Testing:** MX Toolbox, DMARC Analyzer, Mail-tester.com for comprehensive validation