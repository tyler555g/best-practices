# API Design Best Practices

Designing robust, scalable, and maintainable APIs is essential for modern software systems. This guide distills best practices for RESTful API design and implementation, focusing on clarity, consistency, and resilience.

## RESTful API Design

### Resource Naming
- Use nouns for resources (e.g., `/orders`), not verbs.
- Use plural nouns for collections (e.g., `/customers`).
- Keep URIs simple and hierarchical; avoid deep nesting.
- Expose relationships via links in responses, not complex URIs.

### HTTP Methods
- Use standard HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- Align method semantics with resource type (e.g., `GET /orders/1` retrieves, `DELETE /orders/1` removes).
- Ensure `PUT` and `DELETE` are idempotent.

### Status Codes
- Return appropriate HTTP status codes:
  - `200 OK`: Successful retrieval or update
  - `201 Created`: Resource created
  - `204 No Content`: Successful operation, no body
  - `400 Bad Request`: Invalid input
  - `404 Not Found`: Resource missing
  - `409 Conflict`: State conflict
  - `415 Unsupported Media Type`: Invalid format
- Use `Location` header for newly created resources.

### Versioning
- Plan for change: support versioning via URI, query string, header, or media type.
- URI versioning (`/v1/orders`) is simple but can clutter endpoints.
- Header or media type versioning is more flexible but requires client/server coordination.

### Pagination
- Paginate large collections using `limit` and `offset` query parameters.
- Impose sensible defaults and maximums to prevent abuse.
- Return metadata (e.g., total count, next page link) when possible.

### Filtering and Sorting
- Allow filtering via query parameters (e.g., `/orders?status=shipped`).
- Support sorting (e.g., `/orders?sort=price`).
- Validate and sanitize all filter/sort inputs.

## API Implementation

### Error Handling
- Return clear, actionable error messages with appropriate status codes.
- Distinguish between client (4xx) and server (5xx) errors.
- Avoid leaking sensitive information in error responses.
- Log errors consistently for monitoring and debugging.

### Idempotency
- Ensure `PUT`, `DELETE`, and safe `POST` operations are idempotent.
- Use idempotency keys or resource identifiers to prevent duplicate processing.

### Content Negotiation
- Support multiple formats (e.g., JSON, XML) via the `Accept` header.
- Default to a widely supported format (typically JSON).
- Return `406 Not Acceptable` if the requested format is unsupported.

## See Also
- OpenAPI Specification (OAS)
- Richardson Maturity Model
- API security best practices
- [API implementation best practices](api-implementation.md)
- [Data partitioning best practices](data-partitioning.md)
