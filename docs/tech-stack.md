# Palmetto — Tech Stack & Development Conventions

## Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 24 (Alpine) | Runtime |
| NestJS | 10.x | Application framework |
| TypeScript | 5.x | Language |
| RxJS | 7.x | Async data flow (`HttpService` returns Observables) |
| Axios (via `@nestjs/axios`) | — | HTTP client for external APIs |
| `cache-manager` | — | In-memory caching with TTL |
| `@nestjs/throttler` | — | Rate limiting (100 req/min global, 100 req/min per endpoint) |
| `@nestjs/swagger` | — | Auto-generated API docs at `/api/docs` (non-production only) |
| `class-validator` / `class-transformer` | — | Request DTO validation |
| Vitest | 3.x | Test runner |
| `unplugin-swc` | — | SWC compiler for decorator metadata in tests |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| Vite | 8.x | Build tool and dev server |
| TypeScript | 5.x | Language |
| Redux Toolkit | — | Client-side state (theme, units, recents) |
| TanStack React Query | 5.x | Server state (weather data fetching, caching, refetching) |
| Axios | — | HTTP client (wrapped in RxJS `from()`) |
| RxJS | 7.x | Observable wrappers for API calls; consumed via `lastValueFrom()` |
| ShadCN UI | new-york | Accessible component primitives (Button, Input, Card, Badge, Skeleton) |
| Lucide React | — | Icon library used throughout the UI |
| `class-variance-authority` | — | Type-safe component variant management |
| `clsx` + `tailwind-merge` | — | Class merging utility (`cn()`) |
| Tailwind CSS | 4.x | Utility-first styling with CSS-native variable theming |
| PostCSS | — | CSS processing (`@tailwindcss/postcss` plugin) |
| Vitest | 3.x | Test runner |
| Testing Library | — | Component testing (`@testing-library/react`, `@testing-library/user-event`) |
| jsdom | 24.x | DOM environment for tests |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker | Containerization (multi-stage builds) |
| Docker Compose | Service orchestration (backend + frontend) |
| nginx (Alpine) | Reverse proxy, SPA routing, static asset serving, security headers |
| Nx | Monorepo build system, task caching, dependency graph |
| Playwright | E2E testing framework |

### Shared Library

| Technology | Purpose |
|------------|---------|
| TypeScript | Interface-only package — no runtime code, no classes |
| Path alias `@palmetto/shared` | Configured in `tsconfig.base.json` and each app's vitest config |

---

## Development Conventions

### Backend Conventions

**Module organization:** Each feature is a self-contained NestJS module (`WeatherModule`, `GeocodeModule`, `HealthModule`) with its own controller, service, and DTOs. Modules are imported into the root `AppModule`.

**Service pattern:** Services return RxJS Observables. The `HttpService.get()` call starts the pipeline, and operators like `switchMap`, `map`, `tap` transform the response. Controllers return the Observable directly — NestJS subscribes automatically.

**Caching:** Manual cache-aside pattern using `CACHE_MANAGER`. Before calling the external API, the service checks the cache. On a miss, it fetches, stores in cache, and returns. Cache keys follow `{type}:{location}:{units}` format.

**Error handling:** A `GlobalExceptionFilter` catches all unhandled exceptions and maps them to `ErrorDto`. Axios errors from external APIs are intercepted and re-thrown as appropriate `HttpException` types (400, 404, 502).

**Configuration:** A typed `AppConfigService` wraps `@nestjs/config` with getter-only properties. All config values (API keys, URLs, TTLs) flow through this service — no direct `process.env` access in feature code.

**Request tracing:** `RequestIdMiddleware` generates a unique ID per request for log correlation.

**Validation:** Incoming query parameters are validated using `class-validator` decorators on DTO classes (e.g., `GetWeatherQuery` with `@IsString()`, `@IsOptional()`).

**Rate limiting:** `ThrottlerGuard` is applied globally. Individual endpoints can override with `@Throttle()` or skip with `@SkipThrottle()`.

### Frontend Conventions

**Feature-based organization:** Code is organized into `features/search/` and `features/weather/`, each containing `components/`, `hooks/`, `services/`, and `store/` subfolders. Shared components live in `shared/components/`.

**Barrel exports:** Each feature has an `index.ts` that re-exports public API. Consumers import from the feature root (`../../features/search`), not from internal paths.

**State management split:**
- **Redux Toolkit** for client-only state: `themeSlice`, `settingsSlice`, `searchSlice`
- **React Query** for server state: weather, forecast, and geocode queries

**Data fetching pattern:** Services create RxJS Observables from Axios calls. React Query hooks consume them via `lastValueFrom()`. Query keys follow `['resource', ...params]` convention (e.g., `['weather', location, units]`).

**Component design:** Components receive typed props. Layout components (`Header`, `Sidebar`, `MainPanel`) compose feature components. No business logic in layout — it delegates to feature hooks and components.

**Styling:** ShadCN UI (new-york style) provides the component primitives. Tailwind CSS v4 handles all utility styling. The design system is driven by CSS custom properties defined in `index.css` using `@theme inline` — semantic tokens (`--background`, `--foreground`, `--primary`, `--muted-foreground`, etc.) are mapped to Tailwind color utilities so both ShadCN components and custom utility classes share the same palette. Dark mode toggles by adding/removing the `dark` class on `<html>`; the `@variant dark` declaration applies the `.dark` overrides. No `tailwind.config.js` — all configuration is in CSS. Lucide React provides icons. The `cn()` utility (`clsx` + `tailwind-merge`) handles conditional and overridable class composition in ShadCN components.

**Error boundaries:** `ErrorBoundary` wraps the app for uncaught React errors. `ErrorMessage` renders API errors with user-friendly messages mapped from status codes.

### Testing Conventions

**Unit tests:** Colocated with source files as `*.spec.ts` / `*.spec.tsx`. Each test file mirrors its source file.

**Backend tests:** Use `@nestjs/testing` to create testing modules with mocked dependencies. `unplugin-swc` is required for decorator metadata. `reflect-metadata` is imported in the test setup file.

**Frontend tests:** Use Testing Library for component tests. React Query tests wrap components in `QueryClientProvider` with `retry: false`. Redux-dependent tests provide a mock store.

**E2E tests:** Playwright tests in `e2e/tests/` run against the Docker stack (`http://localhost`). Tests use Playwright's locator API (`getByText`, `getByRole`, `getByPlaceholderText`).

**Test runner:** Vitest 3.x for both frontend and backend. Version pinned — v2.x lacks `getRelevantTestSpecifications` (needed by `@nx/vitest`), v4.x has ESM conflicts. jsdom pinned to 24.x to avoid CJS/ESM conflicts.

### Docker & Deployment Conventions

**Multi-stage builds:** Both Dockerfiles use a Node 24 Alpine builder stage and a minimal runtime stage (Node for backend, nginx for frontend).

**Compose networking:** Only the frontend container exposes a host port (80). The backend is internal-only — accessible via Docker's service DNS (`http://backend:3000`).

**nginx responsibilities:**
- Serves the React SPA with `try_files` fallback to `index.html`
- Proxies `/api/*` to the backend
- Sets security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Caches static assets for 1 year with immutable flag

**Health checks:** Docker Compose configures a health check on the backend (`GET /api/health`, 30s interval, 3 retries). The frontend `depends_on` the backend with `condition: service_healthy`.

### Git & Code Quality Conventions

**Linting:** ESLint configured per app via `@nx/eslint`. Run with `nx lint backend` / `nx lint frontend`.

**Commit style:** Conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`).

**Monorepo builds:** Nx caches build and test targets. Use `nx run-many --target=test --all` to run all tests. Use `nx affected` for incremental builds.

---

## Version Constraints

These versions are pinned for compatibility. Do not upgrade without verifying:

| Package | Pinned | Reason |
|---------|--------|--------|
| `vitest` | `^3.x` | v2.x lacks API needed by `@nx/vitest`; v4.x has ESM-only conflict |
| `jsdom` | `^24.x` | v29.x breaks via `@exodus/bytes` CJS/ESM conflict |
| `unplugin-swc` | any | Required for NestJS decorator metadata in Vitest |
