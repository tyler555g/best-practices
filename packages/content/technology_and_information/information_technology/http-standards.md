# HTTP Standards and Best Practices

HTTP serves as the foundation for modern web applications and APIs. This guide synthesizes IETF best current practices for building robust, secure, and interoperable HTTP-based protocols and services, based on BCP 56 / RFC 9205 and related standards.

## When to Use HTTP as a Substrate

HTTP is well-suited for application protocols when you need:
- **Ubiquitous Infrastructure**: Leverage existing HTTP servers, clients, and intermediaries
- **Rich Semantics**: Benefit from HTTP's method, status code, and header field semantics
- **Ecosystem Benefits**: Utilize web browsers, proxies, CDNs, and load balancers
- **Standard Features**: Authentication, caching, content negotiation, compression

**Criteria for HTTP Usage:**
- Uses standard ports (80, 443) or URI schemes (http, https)
- Uses HTTP ALPN protocol IDs (http/1.1, h2, h3)
- Makes registrations in HTTP IANA registries

**When NOT to Use HTTP:**
- Need for application-specific transport modifications
- Custom connection handling requirements
- Non-interoperable protocol extensions

## HTTP Method Usage

### Standard Method Semantics

**GET:**
- MUST be safe (no side effects) and idempotent
- SHOULD support conditional requests (If-Modified-Since, ETag)
- MUST NOT have request body semantics

**POST:**
- Used for non-idempotent operations and data processing
- Response status depends on operation result
- MAY be cacheable with explicit cache directives

**PUT:**
- MUST be idempotent (repeated requests have same effect)
- Used for creating or replacing entire resources
- SHOULD support conditional requests

**DELETE:**
- MUST be idempotent
- Removes resource or marks for deletion
- 404 responses for already-deleted resources are acceptable

**PATCH:**
- Used for partial resource modifications
- NOT necessarily idempotent
- SHOULD describe change semantics in request body

### Method Selection Guidelines

- Use GET for retrieval operations
- Use POST for non-idempotent operations, form submissions
- Use PUT for complete resource replacement
- Use DELETE for resource removal
- Use PATCH for partial updates
- MUST NOT redefine existing method semantics

## Status Code Design

### Common Status Codes

**Success (2xx):**
- `200 OK`: Successful GET, PUT, or PATCH
- `201 Created`: Resource successfully created
- `202 Accepted`: Request accepted for asynchronous processing
- `204 No Content`: Successful operation with no response body

**Client Error (4xx):**
- `400 Bad Request`: Malformed request syntax
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Request conflicts with current state
- `422 Unprocessable Entity`: Well-formed but semantically incorrect

**Server Error (5xx):**
- `500 Internal Server Error`: Unexpected server condition
- `502 Bad Gateway`: Invalid response from upstream
- `503 Service Unavailable`: Temporary server overload

### Status Code Guidelines

- Use appropriate status code ranges (2xx, 3xx, 4xx, 5xx)
- Provide meaningful response bodies for error conditions
- Consider using more specific status codes when appropriate
- MUST NOT redefine existing status code semantics

## Caching Strategy

### Cache Control

**Cache-Control Headers:**
- `public`: Response may be cached by any cache
- `private`: Response may be cached by user agents only
- `no-cache`: Must revalidate with origin server
- `no-store`: MUST NOT store response
- `max-age`: Maximum time to consider fresh (seconds)

**Conditional Requests:**
- Use ETags for content-based validation
- Use Last-Modified for time-based validation
- Support If-None-Match and If-Modified-Since headers

### Caching Best Practices

- Set appropriate Cache-Control headers
- Use ETags for dynamic content validation
- Implement conditional request handling
- Consider cache invalidation strategies
- Use Vary header for content negotiation

## Authentication over HTTP

### HTTP Authentication Schemes

**Bearer Token (OAuth 2.0):**
```
Authorization: Bearer <access-token>
```

**Basic Authentication:**
```
Authorization: Basic <base64-credentials>
```
- MUST only be used over HTTPS
- Consider for simple use cases

**Custom Schemes:**
- Should follow HTTP authentication framework
- Register with IANA if widely applicable
- Document security considerations

### Authentication Guidelines

- Use standard HTTP authentication mechanisms
- Prefer bearer tokens over basic authentication
- Always use HTTPS for authentication
- Implement proper token validation
- Consider authentication caching implications

## URI Design Principles

### URI Structure and Ownership

**Server Authority:**
- Server owns its URI namespace
- Avoid hardcoding specific URI paths in specifications
- Use link discovery instead of static URI templates

**Design Principles:**
- URIs should be opaque to clients
- Use descriptive but stable URI patterns
- Consider URI length limitations
- Implement proper encoding for special characters

### Link-Based Navigation

**Benefits of Link Usage:**
- Enables flexible server deployment
- Supports versioning and extensibility
- Allows service composition
- Provides natural cache invalidation

**Implementation:**
- Use link headers or embedded links in response bodies
- Implement link relation types for semantic meaning
- Support URI template standards when appropriate

### URI Stability

**Stability Requirements:**
- Published URIs should remain stable over time
- Implement proper redirect strategies for URI changes
- Consider backward compatibility in URI evolution
- Document URI lifecycle policies

## See Also

- **HTTP Specifications:** RFC 9110 (HTTP Semantics), RFC 9112 (HTTP/1.1), RFC 9113 (HTTP/2)
- **Authentication:** RFC 7617 (Basic), RFC 6750 (Bearer Token), RFC 9110 §11 (HTTP Authentication, supersedes RFC 7235)
- **Caching:** RFC 9111 (HTTP Caching, supersedes RFC 7234), Mozilla HTTP Caching Guide
- **URI Design:** BCP 190 / RFC 8820 (URI Design and Ownership)
- **Security:** OWASP REST Security Cheat Sheet, HTTP security headers guide
- **Tools:** HTTP status code reference, curl documentation, Postman API testing