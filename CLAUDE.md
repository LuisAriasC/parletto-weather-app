# Parletto — Claude Code Guide

## Project Overview

Parletto is an Nx monorepo weather app with three packages:
- `apps/backend` — NestJS BFF proxy to OpenWeather API and GeoApify geocoding
- `apps/frontend` — React 19 + Vite + Redux Toolkit + React Query
- `libs/shared` — TypeScript interfaces and constants (no runtime logic)

## Key Commands

### Development
```bash
npm run start:backend       # nx serve backend (port 3000)
npm run start:frontend      # nx serve frontend (port 4200, proxies /api to :3000)
```

### Testing
```bash
npm test                    # nx run-many --target=test --all
nx test backend             # backend tests (vitest with unplugin-swc)
nx test frontend            # frontend tests (vitest + jsdom)
```

### E2E (requires running Docker stack)
```bash
cd e2e
npx playwright install chromium   # first time only
npx playwright test               # 15 tests against http://localhost
```

### Build & Docker
```bash
npm run build               # builds both apps via Nx
docker compose up --build   # full stack on http://localhost
```

### Linting
```bash
nx lint backend
nx lint frontend
```

## Architecture Decisions

### BFF Pattern
The backend is a Backend-for-Frontend: API keys (OpenWeather + GeoApify) live only in the server environment. The frontend never touches external APIs directly — all calls go through `/api/weather`, `/api/forecast`, `/api/forecast/hourly`, and `/api/geocode`.

### RxJS End-to-End
- Backend: `HttpService.get()` returns Observables; service pipelines use `switchMap`, `map`, `tap`, `of`, `from`
- Frontend: `axios` calls are wrapped in `from()` to produce Observables; React Query consumes them via `lastValueFrom()`

### State Management Split
- **Redux Toolkit** for client-only UI state: `themeSlice` (dark/light), `settingsSlice` (imperial/metric), `searchSlice` (recent searches as `{ label, query, icon? }` objects, max 5), `toastSlice` (transient error notifications)
- **React Query** for server state: `['weather', location, units]`, `['forecast', location, units]`, `['hourly', location, units]`, and `['geocode', query]` query keys

### Tailwind CSS v4
This project uses Tailwind v4 — the syntax is different from v3:
- CSS: `@import "tailwindcss"` (not `@tailwind base/components/utilities`)
- Dark mode: `@variant dark (&:where(.dark, .dark *))` in CSS
- PostCSS plugin: `@tailwindcss/postcss` (not `tailwindcss`)
- No `tailwind.config.js` — configuration is in CSS

## Critical Version Constraints

These versions were carefully chosen to avoid known incompatibilities:

| Package | Pinned to | Reason |
|---|---|---|
| `vitest` | `^3.x` | v2.x lacks `getRelevantTestSpecifications` (needed by `@nx/vitest`); v4.x has ESM-only conflict |
| `jsdom` | `^24.x` | v29.x breaks via `@exodus/bytes` CJS/ESM conflict |
| `unplugin-swc` | any | Required for NestJS decorator metadata in vitest |

**Do not upgrade vitest or jsdom without verifying compatibility.**

## Backend Test Setup

NestJS decorators require two things to work in vitest:

1. `apps/backend/vitest.config.ts` uses `unplugin-swc` with `decoratorMetadata: true`
2. `apps/backend/src/test-setup.ts` imports `reflect-metadata` before any test runs

Both are required. Removing either breaks DI in unit tests.

## Shared Library

`libs/shared` exports TypeScript interfaces and constants. Import path is `@parletto/shared`. This alias is configured in `tsconfig.base.json` and each app's vitest config.

Available exports: `WeatherDto`, `ForecastDto`, `HourlyDto`, `GeocodeSuggestionDto`, `ErrorDto`, `Units`, `OPENWEATHER_BASE_URL`, `GEOAPIFY_AUTOCOMPLETE_URL`

## Environment Variables

Copy `.env.example` to `.env` and fill in both `OPENWEATHER_API_KEY` and `GEOAPIFY_API_KEY` before running the backend or Docker stack. The frontend reads `VITE_API_BASE_URL` (defaults to `/api` in production, proxied to `:3000` in dev).

## File Layout

```
apps/
  backend/
    src/
      app/            # AppModule
      config/         # Typed config factory + AppConfigService
      common/
        filters/      # GlobalExceptionFilter
        middleware/    # RequestIdMiddleware
      health/         # GET /api/health (with cache metrics)
      weather/        # WeatherController, WeatherService, WeatherMapper, MetricsService, DTOs
      geocode/        # GeocodeController, GeocodeService, DTOs
    vitest.config.ts  # Custom vitest with unplugin-swc
  frontend/
    src/
      app/
        layout/       # Header, Sidebar, MainPanel
        store/        # Redux store setup
      features/
        search/
          components/ # SearchBar, AutocompleteInput, RecentLocations
          hooks/      # useGeocodeSuggestions
          services/   # geocodeService (RxJS)
          store/      # searchSlice ({ label, query, icon? } objects)
        weather/
          components/ # CurrentWeather, ForecastPanel, HourlyStrip, ForecastStrip, ForecastDay, StatTile
          hooks/      # useCurrentWeather, useForecast, useHourlyForecast
          services/   # weatherService (RxJS)
          utils/      # formatters (compass, visibility, pressure, precipitation, time)
      shared/
        components/   # ErrorBoundary, ErrorMessage (+ retry), LoadingSpinner, WeatherSkeleton, ForecastSkeleton, Toast
        store/        # themeSlice, settingsSlice, toastSlice
    nginx.conf        # SPA fallback + /api proxy + security headers
    Dockerfile        # Multi-stage: node builder → nginx
  backend/
    Dockerfile        # Multi-stage: node builder → node runtime
libs/
  shared/src/types/   # DTO interfaces + Units type
e2e/
  tests/              # Playwright specs (15 scenarios)
  playwright.config.ts
docs/
  project-overview.md
  tech-stack.md
  api-reference.md
  external-apis.md
  environment-variables.md
  requirements/       # Functional & non-functional requirements by feature area
docker-compose.yml
```

## nginx Proxy (Production)

In production, nginx serves the React SPA and proxies `/api/*` to `http://backend:3000/api/`. The frontend container depends on the backend container in Docker Compose. The backend is not exposed on any host port — only the frontend container exposes port 80. nginx also sets security headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.).

## Documentation

Comprehensive project documentation lives in `docs/`. See `docs/requirements/` for tracked functional and non-functional requirements with checkbox status. See `docs/api-reference.md` for the standalone REST endpoint reference.
