# Weather App — Design Spec

**Date:** 2026-04-02
**Stack:** Nx Monorepo · NestJS · React/Vite · TypeScript · RxJS · Redux Toolkit · React Query · Tailwind CSS · Playwright · Vitest · Docker Compose

---

## 1. Overview

A production-quality weather application that accepts a location input and displays current conditions plus a 5-day forecast. The backend proxies all calls to the OpenWeather API so the API key never reaches the browser. Business logic (response normalization, data aggregation, caching) lives in the NestJS service layer. The frontend is a Clean & Minimal UI with dark/light mode, a sidebar for search history, and modular components designed for incremental expansion.

---

## 2. Repository Structure

Nx monorepo with a flat apps + libs layout:

```
palmetto/
├── apps/
│   ├── frontend/          # React + Vite + TypeScript
│   └── backend/           # NestJS + TypeScript
├── libs/
│   └── shared/            # DTOs and types imported by both apps
├── e2e/                   # Playwright end-to-end tests
├── docker-compose.yml
├── .env.example
├── nx.json
└── tsconfig.base.json
```

`libs/shared` is the single source of truth for the data contract between frontend and backend. Neither app defines its own response types independently.

---

## 3. Architecture

### Pattern: NestJS Backend-for-Frontend (BFF) Proxy

All weather data requests flow through NestJS. The frontend never calls OpenWeather directly. The API key is a server-side environment variable only.

```
Browser → nginx:80 → NestJS:3000 → OpenWeather API
```

nginx serves the static frontend bundle AND proxies `/api/*` to the NestJS container. This eliminates CORS entirely — the browser talks to one origin.

### Docker Compose Services

| Service | Image | Port | Purpose |
|---|---|---|---|
| frontend | multi-stage (node → nginx:alpine) | 80 | Serves Vite production build |
| backend | node:20-alpine | 3000 | NestJS API server |

**Frontend Dockerfile — multi-stage:**
- Stage 1: `node:20-alpine` — runs `nx build frontend`, outputs to `dist/`
- Stage 2: `nginx:alpine` — copies `dist/` and serves on port 80, proxies `/api/*` to backend:3000

### RxJS Throughout

No `async/await` is used anywhere in the application. All asynchronous operations use RxJS Observables.

- **Backend:** `HttpService` (from `@nestjs/axios`) returns `Observable<AxiosResponse<T>>`. Service methods return `Observable<WeatherDto>` using `map`, `catchError`, and `switchMap`. Controllers return Observables directly — NestJS subscribes internally.
- **Frontend:** API service functions return `Observable<T>` using `from(axios(...))`. React Query's `queryFn` converts with `lastValueFrom(observable$)` — preserving React Query's caching and error handling while keeping the data layer fully Observable.

---

## 4. Backend Design (apps/backend)

### Module Structure

```
src/
├── weather/
│   ├── weather.module.ts
│   ├── weather.controller.ts      # GET /api/weather, GET /api/forecast
│   ├── weather.service.ts         # Observable pipelines, business logic
│   ├── weather.mapper.ts          # Raw OpenWeather response → DTO
│   └── weather.controller.spec.ts
├── common/
│   └── filters/
│       └── global-exception.filter.ts   # Normalizes all errors → ErrorDto
├── config/
│   └── configuration.ts           # Typed env config via @nestjs/config
└── main.ts                        # Bootstrap, Swagger setup
```

### API Endpoints

#### `GET /api/weather`

| Param | Type | Required | Description |
|---|---|---|---|
| `location` | string | yes | City name or "lat,lon" |
| `units` | `"imperial" \| "metric"` | no | Default: `imperial` |

Returns `WeatherDto`.

#### `GET /api/forecast`

| Param | Type | Required | Description |
|---|---|---|---|
| `location` | string | yes | City name or "lat,lon" |
| `units` | `"imperial" \| "metric"` | no | Default: `imperial` |

Returns `ForecastDto[]` — 5 daily entries aggregated from OpenWeather's 3-hour interval data.

#### Error shape (all endpoints)

Returns `ErrorDto` for every failure:

| Status | Cause |
|---|---|
| 400 | Missing or invalid `location` param |
| 404 | Location not found by OpenWeather |
| 502 | OpenWeather upstream error |
| 500 | Unexpected internal error |

### Business Logic in WeatherService

- **Response normalization:** OpenWeather's raw nested JSON is mapped to clean flat DTOs via `weather.mapper.ts`.
- **Forecast aggregation:** OpenWeather returns 3-hour interval data for 5 days (~40 entries). The service aggregates these into one entry per day: daily high (max temp), daily low (min temp), dominant condition (most frequent across slots).
- **Unit handling:** The `units` query param is forwarded to OpenWeather and reflected in the DTO — no server-side conversion needed.
- **Caching:** NestJS `CacheModule` with in-memory store. TTL is configurable via env vars:
  - `WEATHER_CACHE_TTL_SECONDS` (default: 600 — 10 minutes)
  - `FORECAST_CACHE_TTL_SECONDS` (default: 1800 — 30 minutes)
  - Cache key: `location:units`. Upgrading to Redis is a one-line config change.

### Swagger

Served at `/api/docs` via `@nestjs/swagger`. All DTOs decorated with `@ApiProperty`. Interactive — usable without a separate HTTP client.

---

## 5. Shared Library (libs/shared)

TypeScript types imported by both `apps/frontend` and `apps/backend`. No runtime code — types only.

```ts
// WeatherDto
{
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  condition: string;
  conditionIcon: string;  // OpenWeather icon code
  high: number;
  low: number;
  units: 'imperial' | 'metric';
  updatedAt: string;       // ISO 8601
}

// ForecastDto
{
  date: string;            // ISO 8601
  high: number;
  low: number;
  condition: string;
  conditionIcon: string;
  humidity: number;
  windSpeed: number;
}

// ErrorDto
{
  statusCode: number;
  message: string;
  error: string;
}

// Units enum
type Units = 'imperial' | 'metric';
```

---

## 6. Frontend Design (apps/frontend)

### UI: Clean & Minimal — Dark/Light Mode

Tailwind CSS with the `class` dark mode strategy. A `ThemeProvider` (backed by `themeSlice` in Redux) toggles a `dark` class on `<html>`. All components use Tailwind's `dark:` variant — no separate stylesheets.

### Layout: Split with Sidebar

```
┌──────────────────────────────────────────┐
│  Header: Logo · °F/°C toggle · 🌙 toggle │
├───────────────┬──────────────────────────┤
│  Sidebar      │  Main Panel              │
│               │                          │
│  SearchBar    │  CurrentWeather          │
│               │  (city, temp, condition, │
│  Recent       │   stats grid)            │
│  Locations    │                          │
│  (from Redux) │  ForecastStrip           │
│               │  (5 days)                │
│               │                          │
│               │  ErrorMessage            │
│               │  (when query fails)      │
└───────────────┴──────────────────────────┘
```

Desktop-first. On mobile, the sidebar collapses above the main panel (stacked layout).

### Component Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainPanel.tsx
│   ├── weather/
│   │   ├── CurrentWeather.tsx
│   │   ├── StatTile.tsx          # Wind, humidity, UV, feels-like, high/low
│   │   ├── ForecastStrip.tsx
│   │   └── ForecastDay.tsx
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   └── RecentLocations.tsx
│   └── common/
│       ├── ErrorMessage.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── store/
│   ├── index.ts
│   ├── themeSlice.ts             # dark | light
│   ├── settingsSlice.ts          # imperial | metric
│   └── searchSlice.ts            # recent locations (max 5)
├── services/
│   └── weather.service.ts        # Returns Observables
├── hooks/
│   ├── useCurrentWeather.ts      # React Query + lastValueFrom()
│   └── useForecast.ts            # React Query + lastValueFrom()
└── providers/
    └── ThemeProvider.tsx
```

### State Management

**Redux Toolkit** owns client/UI state:

| Slice | State | Persisted |
|---|---|---|
| `themeSlice` | `'dark' \| 'light'` | localStorage |
| `settingsSlice` | `'imperial' \| 'metric'` | localStorage |
| `searchSlice` | `string[]` (max 5 recent) | localStorage |

**React Query** owns server state:

| Hook | Query key | Source |
|---|---|---|
| `useCurrentWeather(location, units)` | `['weather', location, units]` | `GET /api/weather` |
| `useForecast(location, units)` | `['forecast', location, units]` | `GET /api/forecast` |

### Error Handling (Frontend)

- React Query exposes `isError` + `error` per query — `ErrorMessage` renders a user-friendly string based on `statusCode`.
- `ErrorBoundary` wraps the main panel — catches unexpected render crashes and shows a fallback instead of a blank screen.
- No raw error objects or status codes are ever shown to the user.

---

## 7. Testing Strategy

### Vitest — Unit Tests

**Backend:**
- `WeatherService` — mock `HttpService`, verify transform logic and aggregation
- `WeatherController` — mock service, verify routing and query param validation
- `GlobalExceptionFilter` — verify each error code mapping

**Frontend:**
- Components with React Testing Library — render, interaction, error/loading states
- Redux slices — reducer logic for theme, settings, search history
- Custom hooks — mock React Query, verify Observable-to-Promise conversion

### Playwright — E2E Tests

Runs against the full Docker Compose stack:

| Scenario | Assertion |
|---|---|
| Search valid city | Weather card renders with city name and temperature |
| Search invalid city | Error message displayed, no crash |
| Toggle °F/°C | Temperature value updates |
| Toggle dark mode | `dark` class applied to `<html>` |
| Click recent location | Weather loads for that location |
| Submit empty search | Inline validation message shown |

---

## 8. Environment Variables

### Backend (`apps/backend/.env`)

```env
OPENWEATHER_API_KEY=your_key_here
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5
WEATHER_CACHE_TTL_SECONDS=600
FORECAST_CACHE_TTL_SECONDS=1800
PORT=3000
```

### Frontend (`apps/frontend/.env`)

```env
VITE_API_BASE_URL=/api
```

In Docker, nginx serves the frontend and proxies `/api/*` to the backend container — the relative `/api` path works out of the box. For local development without Docker, configure Vite's `server.proxy` in `vite.config.ts` to forward `/api` requests to `http://localhost:3000`.

Root `.env.example` documents all variables with no working values.

---

## 9. Production-Ready Considerations

- **API key security:** Key is server-side only, never in the browser bundle.
- **Caching:** Reduces OpenWeather API calls, configurable TTL. Redis-upgradeable.
- **nginx production serving:** Static files served by nginx:alpine — no dev server in production.
- **Docker Compose:** Single command (`docker compose up`) to run the full stack.
- **Swagger:** Interactive API docs at `/api/docs` — no external tool needed to explore the API.
- **Typed end-to-end:** `libs/shared` ensures frontend and backend share the same DTO types — no drift.
- **Error normalization:** Every failure returns a consistent `ErrorDto` — predictable for clients.
- **Graceful degradation:** Error boundaries and React Query error states prevent blank screens.
- **Configurable via env:** Cache TTLs, API URL, port — no hardcoded values.

---

## 10. Setup (Single Command)

```bash
cp .env.example .env
# add your OPENWEATHER_API_KEY to .env
docker compose up
```

- Frontend: http://localhost
- API docs: http://localhost/api/docs
- Backend direct: http://localhost:3000
