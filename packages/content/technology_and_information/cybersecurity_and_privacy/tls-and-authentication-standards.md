# TLS and Authentication Standards

Transport Layer Security (TLS) and authentication protocols are critical foundations for secure communications. This guide synthesizes IETF best current practices for TLS deployment, JSON Web Token (JWT) security, and OAuth 2.0 protection to provide actionable guidance for practitioners.

## TLS Configuration

### Protocol Versions

**Required Protocols:**
- **TLS 1.2**: MUST be supported for broad compatibility
- **TLS 1.3**: SHOULD be supported and MUST be preferred when available

**Prohibited Protocols:**
- SSL 2.0, SSL 3.0: MUST NOT be negotiated (fundamentally insecure)
- TLS 1.0, TLS 1.1: MUST NOT be negotiated (deprecated per BCP 195 / RFC 9325)

**Version Selection Strategy:**
- Implementations MUST prefer TLS 1.3 over earlier versions
- New transport protocols MUST use only TLS 1.3
- Application protocols SHOULD support both TLS 1.2 and 1.3 for broad interoperability

### Cipher Suite Selection

**TLS 1.2 Recommended Cipher Suites:**
- `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256`
- `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA256`
- `TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256`
- `TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA256`

**Key Requirements:**
- MUST provide forward secrecy (ECDHE key exchange)
- MUST use AEAD algorithms (GCM mode)
- MUST NOT use static RSA key exchange
- MUST NOT use CBC mode ciphers (vulnerable to padding attacks)

**TLS 1.3 Cipher Suites:**
- TLS 1.3 automatically provides secure cipher suites
- No configuration typically required

### Certificate Validation

**Hostname Verification:**
- MUST validate server certificates against expected hostname
- MUST check Subject Alternative Name (SAN) extension
- SHOULD implement certificate pinning where appropriate

**Certificate Chain Validation:**
- MUST verify complete certificate chain to trusted root
- MUST check certificate validity periods
- SHOULD implement certificate revocation checking (OCSP)

### Forward Secrecy

**Requirements:**
- MUST use ephemeral key exchange (ECDHE, DHE)
- MUST NOT reuse Diffie-Hellman exponents
- Public key length: minimum 2048 bits for RSA, 256 bits for ECDSA

## OAuth 2.0 Security

OAuth 2.0 provides authorization frameworks but requires careful implementation to maintain security. These practices are based on BCP 240 / RFC 9700.

### Authorization Code Flow with PKCE

**PKCE Requirements:**
- Public clients MUST use PKCE (Proof Key for Code Exchange)
- Confidential clients SHOULD use PKCE for additional protection
- MUST use S256 code challenge method (SHA256)
- MUST NOT use plain text PKCE challenges

**Redirect URI Validation:**
- Authorization servers MUST use exact string matching for redirect URIs
- MUST NOT allow open redirectors
- Native apps MAY use localhost with dynamic ports

### Deprecated Flows

**Implicit Grant:**
- SHOULD NOT be used for new applications
- Authorization code flow with PKCE provides better security
- If used, MUST implement additional security measures

**Resource Owner Password Credentials (ROPC):**
- SHOULD NOT be used except in legacy scenarios
- Presents significant security risks
- Authorization code flow is preferred alternative

### Token Security

**Token Binding and Constraint:**
- Access tokens SHOULD be sender-constrained when possible
- Refresh tokens MUST be bound to specific clients
- SHOULD implement token rotation for refresh tokens

**Token Storage:**
- Tokens MUST be stored securely on clients
- MUST use secure storage mechanisms (keychain, encrypted storage)
- MUST NOT store in plain text

**Token Scope Restriction:**
- Access tokens SHOULD be limited to minimum required scope
- SHOULD implement audience restriction
- MUST validate token scope on resource servers

## JWT Best Practices

JSON Web Tokens require careful handling to prevent common vulnerabilities. These recommendations are based on BCP 225 / RFC 8725.

### Algorithm Verification

**Algorithm Selection:**
- Libraries MUST enable callers to specify supported algorithms
- MUST reject "none" algorithm unless explicitly allowed
- SHOULD prefer asymmetric algorithms (RS256, ES256) over symmetric (HS256)

**Key-Algorithm Binding:**
- Each key MUST be used with exactly one algorithm
- MUST verify "alg" header matches expected algorithm
- MUST prevent algorithm confusion attacks (RS256/HS256 confusion)

### Claim Validation

**Critical Claims:**
- `iss` (issuer): MUST validate that keys belong to claimed issuer
- `aud` (audience): MUST validate when token used by multiple parties
- `exp` (expiration): MUST check token has not expired
- `nbf` (not before): SHOULD validate if present
- `iat` (issued at): SHOULD validate for reasonableness

**Validation Process:**
- MUST validate ALL cryptographic operations before accepting token
- MUST reject tokens if any validation fails
- SHOULD implement clock skew tolerance for time-based claims

### Key Management

**Entropy Requirements:**
- Cryptographic keys MUST have sufficient entropy
- MUST NOT use human-memorable passwords as HMAC keys
- SHOULD use proper key derivation functions when needed

**Key Distribution:**
- Use secure key distribution mechanisms — prefer JWK Sets served from a preconfigured, trusted issuer URL
- Avoid `x5u` header-based key distribution by default; accepting key material from URLs in the JWT header can enable key-injection attacks unless you strictly allowlist and validate the source. Only enable with strong trust controls.
- MUST validate key sources to prevent injection attacks
- SHOULD implement key rotation capabilities

**Algorithm-Specific Recommendations:**
- ECDSA: SHOULD use deterministic signatures (RFC 6979) to prevent nonce reuse
- RSA: MUST use minimum 2048-bit keys, SHOULD avoid PKCS#1 v1.5

## See Also

- **Standards:** RFC 8446 (TLS 1.3), RFC 7636 (PKCE), RFC 7519 (JWT)
- **Security Guides:** OWASP TLS Configuration Cheat Sheet, Mozilla SSL Configuration Generator
- **Tools:** SSL Labs SSL Test, oauth.net security guidelines
- **Implementation:** Let's Encrypt for certificates, Auth0 and Okta developer guides