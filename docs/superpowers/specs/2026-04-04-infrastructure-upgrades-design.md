# Infrastructure Upgrades Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement rate limit response headers, gzip compression, Docker Compose staging/production profiles with logging volume, and a GitHub Actions CI pipeline for automated unit + E2E tests.

**Architecture:** All changes are additive and non-breaking. The backend gains a custom ThrottlerGuard subclass that emits standard rate limit headers. nginx gains gzip directives and a commented-out TLS placeholder. Docker Compose gains named profiles and a backend log volume. GitHub Actions gets a two-job workflow (unit tests → E2E tests).

**Tech Stack:** NestJS `@nestjs/throttler`, nginx alpine, Docker Compose v2 profiles, GitHub Actions

---

## Out of Scope (explicitly removed)

- Redis cache store — in-memory cache is sufficient for single-instance deployment
- Cache invalidation endpoint — removed as unnecessary complexity
- HTTPS/TLS active termination — nginx config placeholder only (no cert generation)
- Performance benchmark CI gates — performance targets removed from requirements entirely
- Retry logic / circuit breaker — current graceful degradation is sufficient
- brotli compression — requires custom nginx build, not worth the complexity

---

## Section 1: Rate Limiting Headers

### What

Every response that passes through the NestJS ThrottlerGuard gets three new headers:

| Header | Value | When |
|---|---|---|
| `X-RateLimit-Limit` | Configured limit for the matched throttler (20 or 30) | All responses |
| `X-RateLimit-Remaining` | Limit minus current hit count (floored at 0) | All responses |
| `Retry-After` | Seconds until the current window resets | 429 responses only |

### How

Create `apps/backend/src/common/guards/custom-throttler.guard.ts` that extends `ThrottlerGuard` from `@nestjs/throttler`.

Override `handleRequest`:
- Call `super.handleRequest(...)` to get the throttler result
- Read `limit` and `ttl` from the matched throttler config
- Compute `remaining = Math.max(0, limit - hitCount)`
- Compute `retryAfter = Math.ceil(ttl / 1000)` (ttl is in ms)
- Set headers on `response` via `response.setHeader(...)`

Override `throwThrottlingException`:
- Set `Retry-After` header before calling `super.throwThrottlingException(...)`

Register the custom guard as `APP_GUARD` in `AppModule`, replacing the existing `ThrottlerGuard`.

### Files

- **Create**: `apps/backend/src/common/guards/custom-throttler.guard.ts`
- **Modify**: `apps/backend/src/app/app.module.ts` — swap `ThrottlerGuard` for `CustomThrottlerGuard`
- **Test**: `apps/backend/src/common/guards/custom-throttler.guard.spec.ts`

---

## Section 2: nginx — gzip + TLS Placeholder

### gzip

Add to `apps/frontend/nginx.conf` inside the `http` context (or `server` block if there is no explicit `http` block):

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1000;
gzip_proxied any;
gzip_types
  text/plain
  text/css
  text/html
  application/javascript
  application/json
  application/xml
  image/svg+xml;
```

`gzip_vary on` ensures CDN/proxy layers cache both compressed and uncompressed versions separately via `Vary: Accept-Encoding`.

`gzip_min_length 1000` skips compressing responses under 1KB — compression overhead exceeds benefit for tiny payloads.

### TLS Placeholder

Add a commented-out `server` block after the existing one:

```nginx
# HTTPS termination — uncomment and fill in cert paths for production TLS
# server {
#   listen 443 ssl;
#   server_name _;
#
#   ssl_certificate     /etc/nginx/certs/cert.pem;
#   ssl_certificate_key /etc/nginx/certs/key.pem;
#   ssl_dhparam         /etc/nginx/certs/dhparam.pem;
#
#   ssl_protocols       TLSv1.2 TLSv1.3;
#   ssl_ciphers         HIGH:!aNULL:!MD5;
#   ssl_prefer_server_ciphers on;
#
#   # Copy the location blocks from the HTTP server above
# }
```

### Files

- **Modify**: `apps/frontend/nginx.conf`

---

## Section 3: Docker — Profiles, Logging Volume, and Staging CI

### Docker Compose Profiles

Two profiles added to `docker-compose.yml`:

**`prod`** — production configuration:
- `NODE_ENV=production`
- Logging volume mounted

**`staging`** — staging/CI configuration:
- `NODE_ENV=staging`
- Logging volume mounted
- Same images as prod (no code differences)

Both profiles read `.env` from the project root (standard Docker Compose behavior — no `--env-file` override needed). Running `docker compose up` without a `--profile` flag starts no services — explicit profile required.

**Important:** This changes the existing `docker compose up --build` command. README must be updated to use `docker compose --profile prod up --build` for production and `docker compose --profile staging up --build` for staging/CI.

### Logging Volume

```yaml
volumes:
  backend-logs:

services:
  backend:
    volumes:
      - backend-logs:/app/logs
```

NestJS logs to stdout by default and Docker captures it. The named volume mounts `/app/logs` so that if structured file logging is added later, the data persists across container restarts. No code change to the backend is needed.

### Files

- **Modify**: `docker-compose.yml`
- **Modify**: `README.md` — update `docker compose up` commands to use `--profile prod` / `--profile staging`

---

## Section 4: GitHub Actions CI

### Workflow: `.github/workflows/ci.yml`

**Triggers:** `push` to `main`, `pull_request` to `main`

**Job 1: `unit-tests`**
- Runs on `ubuntu-latest`
- Steps:
  1. Checkout
  2. Setup Node 20
  3. `npm ci`
  4. `npm test` (runs `nx run-many --target=test --all`)

**Job 2: `e2e-tests`**
- `needs: unit-tests` (only runs if unit tests pass)
- Runs on `ubuntu-latest`
- Steps:
  1. Checkout
  2. Setup Node 20
  3. `npm ci`
  4. Write `.env` file from GitHub secrets (`OPENWEATHER_API_KEY`, `GEOAPIFY_API_KEY`)
  5. `docker compose --profile staging up --build -d`
  6. Wait for backend health: poll `http://localhost/api/health` until 200 (max 60s)
  7. `cd e2e && npx playwright install chromium --with-deps`
  8. `npx playwright test`
  9. `docker compose --profile staging down` (always runs — `if: always()`)
  10. Upload Playwright report as artifact on failure

**Secrets required** (documented in README):
- `OPENWEATHER_API_KEY`
- `GEOAPIFY_API_KEY`

### Files

- **Create**: `.github/workflows/ci.yml`
- **Modify**: `README.md` — add CI badge + secrets setup instructions

---

## Requirements Mapping

| Requirement | Implemented by |
|---|---|
| `Retry-After` on 429 | `CustomThrottlerGuard.throwThrottlingException` |
| `X-RateLimit-Remaining`, `X-RateLimit-Limit` | `CustomThrottlerGuard.handleRequest` |
| gzip compression | nginx `gzip on` directives |
| HTTPS/TLS termination | nginx commented placeholder |
| Docker logging volume | `backend-logs` named volume in `docker-compose.yml` |
| Docker staging profile | `staging` profile in `docker-compose.yml` |
| Automated unit test CI | GitHub Actions `unit-tests` job |
| Automated E2E CI | GitHub Actions `e2e-tests` job |
| Performance targets | **Removed from requirements** |
| Redis, cache invalidation, retry, circuit breaker | **Out of scope** |
