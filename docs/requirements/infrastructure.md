# Infrastructure Requirements

## Functional Requirements

### Backend (BFF)
- [x] Backend proxies all external API calls — frontend never contacts OpenWeather or GeoApify directly
- [x] API keys are stored in environment variables and never exposed to the frontend
- [x] Configuration is typed through `AppConfigService` — no direct `process.env` access in feature code
- [x] Request ID middleware generates unique IDs for log correlation

### Caching
- [x] Current weather responses are cached for 10 minutes (configurable via `WEATHER_CACHE_TTL_SECONDS`)
- [x] Forecast responses are cached for 30 minutes (configurable via `FORECAST_CACHE_TTL_SECONDS`)
- [x] Cache keys include location and units (e.g., `weather:Austin:imperial`)
- [x] Cache is in-memory using NestJS `cache-manager`
- [ ] Add Redis as an external cache store for multi-instance deployments
- [ ] Add cache invalidation endpoint for manual cache clearing

### Rate Limiting
- [x] Global rate limit: 30 requests per 60 seconds per IP
- [x] Per-endpoint override: 20 requests per 60 seconds for weather/forecast/geocode
- [x] Health endpoint is exempt from rate limiting
- [x] Return `Retry-After` header on 429 responses
- [x] Add rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Limit`) to all responses

### Health Monitoring
- [x] `GET /api/health` returns server status, uptime, and timestamp
- [x] Response includes `apiKeyConfigured` flag
- [x] Response includes cache metrics (hits, misses, API calls, hit rate)
- [ ] Add external API reachability check (ping OpenWeather, GeoApify)
- [ ] Integrate with uptime monitoring service

### Error Handling
- [x] `GlobalExceptionFilter` catches all unhandled exceptions
- [x] Axios errors from external APIs are mapped to appropriate HTTP status codes
- [x] All error responses follow the `ErrorDto` format (`statusCode`, `message`, `error`)
- [x] 400-level errors logged as warnings; 500-level as errors

### Docker & Deployment
- [x] Multi-stage Docker builds for both frontend and backend (Node 20 Alpine)
- [x] Frontend served by nginx with SPA fallback routing
- [x] Backend runs as internal service — not exposed to host network
- [x] Docker Compose orchestrates both services with health check dependency
- [x] Backend health check: `GET /api/health` every 30s with 3 retries
- [x] Add Docker volume for persistent logging
- [x] Add Docker Compose profiles for staging vs. production configuration

### nginx Security
- [x] Server tokens disabled
- [x] `X-Content-Type-Options: nosniff`
- [x] `X-Frame-Options: DENY`
- [x] `Referrer-Policy: no-referrer`
- [x] `Permissions-Policy: geolocation=(), microphone=()`
- [x] Content Security Policy (CSP) configured
- [x] Static assets cached for 1 year with immutable flag
- [x] Proxy headers (`X-Real-IP`, `X-Forwarded-For`) set for client IP tracking
- [x] Add HTTPS/TLS termination
- [x] Add gzip/brotli compression for responses

### Shared Library
- [x] `@parletto/shared` exports TypeScript interfaces only (no runtime code)
- [x] Path alias configured in `tsconfig.base.json` and vitest configs
- [x] DTOs: `WeatherDto`, `ForecastDto`, `HourlyDto`, `GeocodeSuggestionDto`, `ErrorDto`, `Units`

## Non-Functional Requirements

### Performance
- [x] Backend caching reduces external API calls by 70%+ (measured via health metrics)
- [x] Frontend uses React Query with stale times (5 min weather, 15 min forecast) to avoid redundant requests
- [x] Static assets served with immutable cache headers (1 year)

### Reliability
- [x] Geocode endpoint returns empty array on GeoApify failure (graceful degradation)
- [x] Frontend `ErrorBoundary` catches uncaught React errors
- [x] Docker health checks restart unhealthy backend containers
- [ ] Add retry logic for transient external API failures (with exponential backoff)
- [ ] Add circuit breaker for external API calls

### Testing
- [x] Backend unit tests cover controllers, services, mappers, and filters
- [x] Frontend unit tests cover components, hooks, store slices, and utilities
- [x] E2E tests (Playwright) cover 15 core user workflows
- [x] Test runner: Vitest 3.x for both frontend and backend
- [ ] Target: >80% code coverage for both frontend and backend
- [ ] Add API contract tests between frontend and backend

### Security
- [x] API keys never reach the frontend
- [x] nginx security headers configured (CSP, X-Frame-Options, etc.)
- [x] Input validation on all endpoints (class-validator)
- [x] CORS restricted to allowed origins
- [ ] Add API key rotation strategy documentation
- [ ] Add dependency vulnerability scanning to CI pipeline

### Observability
- [x] Request ID middleware for log correlation
- [x] Cache hit/miss metrics exposed via health endpoint
- [ ] Add structured logging (JSON format) for log aggregation
- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Add Prometheus metrics endpoint
