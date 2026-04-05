# Parletto Weather App

A full-stack weather application built as an Nx monorepo. Features a NestJS Backend-for-Frontend (BFF) that proxies the OpenWeather and GeoApify APIs, and a React frontend with autocomplete search, hourly and 5-day forecasts, dark mode, unit toggling, and recent search history.

## Stack

| Layer      | Technology                                                                           |
|------------|--------------------------------------------------------------------------------------|
| Monorepo   | Nx                                                                                   |
| Backend    | NestJS, RxJS, `@nestjs/axios`, `cache-manager`, `@nestjs/throttler`                  |
| Frontend   | React 19, Vite, Redux Toolkit, TanStack React Query v5                               |
| UI         | ShadCN UI (new-york style), Tailwind CSS v4, Lucide React, `class-variance-authority` |
| Shared     | TypeScript interfaces (`libs/shared`)                                                |
| Testing    | Vitest 3, Testing Library, Playwright                                                |
| Production | Docker Compose (nginx + Node)                                                        |

## Features

- **City search with autocomplete** — type 3+ characters to get real-time suggestions from GeoApify, with keyboard navigation (Arrow keys, Enter, Escape), loading indicator, and "No results found" message
- **Current weather card** — temperature, feels like, humidity, wind (speed + compass direction), UV index, visibility, pressure, cloud coverage, precipitation, sunrise/sunset
- **Hourly forecast** — next 24 hours in 3-hour intervals with temperature, rain probability, and wind
- **5-day daily forecast** — cards with high/low temperatures, condition icons, and day labels; tabs support Arrow Left/Right keyboard navigation
- **Unit toggle** — switch between Imperial (°F, mph, inHg) and Metric (°C, m/s, hPa), persisted to localStorage
- **Dark mode** — toggle with persistence to localStorage
- **Recent search history** — last 5 locations with individual remove (✕) and clear-all button, weather icon per entry, persisted to localStorage
- **Skeleton loading** — animated placeholder cards for weather and forecast sections while data loads
- **Toast notifications** — transient error toasts for forecast failures that auto-dismiss after 4 seconds
- **Retry button** — weather card errors include a Retry button to re-fetch
- **Mobile-responsive sidebar** — hamburger menu in the header toggles sidebar on small screens
- **WCAG 2.1 AA accessibility** — `role="tab"` keyboard nav, `aria-live` region for weather updates, visible focus indicators (`focus-visible` ring), per-item remove `aria-label`s
- **Server-side API keys** — OpenWeather and GeoApify keys never sent to the browser
- **Caching** — weather data cached 10 min, forecasts cached 30 min on the backend
- **Rate limiting** — 100 req/min global, 100 req/min per weather/forecast/geocode endpoint
- **Health monitoring** — `/api/health` endpoint with cache metrics (hit rate, misses, API calls)

## Prerequisites

- Node.js 24+ (use `nvm use 24` if you have nvm; a `.nvmrc` is provided)
- Docker and Docker Compose (for production / E2E testing)
- An [OpenWeather API key](https://openweathermap.org/api) (free tier works)
- A [GeoApify API key](https://www.geoapify.com) (free tier — 3,000 req/day)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your API keys:

```
OPENWEATHER_API_KEY=your_openweather_key_here
GEOAPIFY_API_KEY=your_geoapify_key_here
```

### 3. Run in development

Start the backend and frontend in separate terminals:

```bash
npm run start:backend    # NestJS on http://localhost:3000
npm run start:frontend   # React on http://localhost:4200
```

The Vite dev server proxies `/api/*` requests to the backend automatically.

### 4. Run with Docker

**Production:**
```bash
docker compose --profile prod up --build
```

**Staging (same images, used by CI):**
```bash
docker compose --profile staging up --build
```

The app is available at **http://localhost**.

## API Endpoints

| Endpoint                                                  | Description                           |
|-----------------------------------------------------------|---------------------------------------|
| `GET /api/health`                                         | Health check with cache metrics       |
| `GET /api/weather?location=Austin&units=imperial`         | Current weather                       |
| `GET /api/forecast?location=Austin&units=metric`          | 5-day daily forecast                  |
| `GET /api/forecast/hourly?location=Austin&units=imperial` | 3-hour interval forecast (40 slots)   |
| `GET /api/geocode?q=Aus`                                  | Autocomplete city suggestions (max 5) |

`location` accepts a city name (`Austin`) or coordinates (`30.27,-97.74`). `units` accepts `imperial` (°F) or `metric` (°C), defaults to `imperial`.

For full request/response documentation, see [`docs/api-reference.md`](docs/api-reference.md).

## Running Tests

### Unit + Integration Tests

```bash
npm test                  # all projects
npx nx test backend       # backend only
npx nx test frontend      # frontend only
```

### E2E Tests (Playwright)

E2E tests run against the full Docker stack:

```bash
# 1. Start the stack
docker compose --profile staging up --build -d

# 2. Install browsers (first time only)
cd e2e && npx playwright install chromium

# 3. Run tests
npx playwright test
```

33 E2E scenarios covered:
- Search valid city shows weather card
- Search invalid city shows error alert
- Empty search shows validation message
- Unit toggle switches between °F and °C
- Dark mode toggle applies `.dark` class
- Extended weather data tiles (Visibility, Pressure, Clouds, Sunrise, Sunset)
- Recent search appears in sidebar
- Forecast tab buttons (Next 24h, 5-Day) visible after search
- Next 24h tab active by default
- 5-Day tab switches to daily forecast view
- Switching back to Next 24h tab
- Autocomplete dropdown appears after 3 characters
- Selecting autocomplete suggestion loads weather
- Selected location appears in recents with human-readable label
- Pressing Escape closes dropdown without searching
- ArrowDown highlights first autocomplete option
- ArrowDown then Enter loads weather for highlighted option
- Autocomplete shows "No results found" for unmatched query
- Remove individual recent search
- Clear all recent searches
- Clicking a recent search loads weather for that location
- Recent searches persist after page reload
- Unit preference persists after page reload
- Dark mode persists after page reload
- Hourly forecast strip shows Time column header
- 5-Day forecast cards show temperature values
- ArrowRight keyboard navigation switches from Next 24h to 5-Day tab
- Last searched location is restored automatically after page reload
- Clear button appears in search input after typing
- Clear button removes text from search input
- Search input clears after selecting an autocomplete suggestion
- Search input clears after pressing Enter to search
- Invalid city is not added to recent searches

## CI

GitHub Actions runs on every push to `main` and on all pull requests:

1. **Unit tests** — `npm test` against Node 24
2. **E2E tests** — builds the Docker staging stack, runs all 33 Playwright scenarios, tears down

To enable E2E tests in CI, add these repository secrets in **GitHub → Settings → Secrets and variables → Actions**:
- `OPENWEATHER_API_KEY`
- `GEOAPIFY_API_KEY`

## Project Structure

```
parletto/
├── apps/
│   ├── backend/                    # NestJS BFF
│   │   └── src/
│   │       ├── app/                # AppModule
│   │       ├── config/             # Typed config + AppConfigService
│   │       ├── common/             # GlobalExceptionFilter, RequestIdMiddleware
│   │       ├── health/             # Health endpoint with cache metrics
│   │       ├── weather/            # Weather controller, service, mapper, metrics
│   │       └── geocode/            # Geocode controller + service (GeoApify)
│   └── frontend/                   # React SPA
│       ├── components.json         # ShadCN configuration
│       └── src/
│           ├── components/ui/      # ShadCN primitives: Button, Input, Card, Badge, Skeleton
│           ├── lib/                # cn() utility (clsx + tailwind-merge)
│           ├── app/layout/         # Header (hamburger), Sidebar (responsive), MainPanel
│           ├── app/store/          # Redux store setup (theme, settings, search, toast)
│           ├── features/search/    # SearchBar, AutocompleteInput, RecentLocations, searchSlice
│           ├── features/weather/   # CurrentWeather, ForecastPanel (keyboard tabs), HourlyStrip, ForecastStrip, StatTile
│           └── shared/             # ErrorBoundary, ErrorMessage, WeatherSkeleton, ForecastSkeleton, Toast, themeSlice, settingsSlice, toastSlice
├── libs/
│   └── shared/                     # Shared TypeScript interfaces (WeatherDto, ForecastDto, HourlyDto, etc.)
├── docs/                           # Project documentation
│   ├── project-overview.md         # Features, architecture, design decisions
│   ├── tech-stack.md               # Stack details + development conventions
│   ├── api-reference.md            # Standalone REST endpoint reference
│   ├── external-apis.md            # OpenWeather + GeoApify integration docs
│   ├── environment-variables.md    # Env vars by stage (dev, staging, production)
│   └── requirements/               # Tracked requirements with checkbox status
├── e2e/                            # Playwright E2E tests (33 scenarios)
├── docker-compose.yml
└── .env.example
```

## Architecture

### Backend-for-Frontend (BFF)

The NestJS backend proxies all external API calls. API keys never reach the frontend. Responses are cached server-side to reduce external API usage.

```
Browser → nginx → NestJS BFF → OpenWeather API
                      ↕              GeoApify API
                cache-manager
```

### State Management

- **Redux Toolkit** handles UI state: dark/light theme (`themeSlice`), imperial/metric units (`settingsSlice`), recent search history as `{ label, query, icon? }` objects (`searchSlice`), and transient error toasts (`toastSlice`). Theme, units, and recents persist to `localStorage`.
- **React Query** manages server state. Query keys include location and units so re-fetches happen automatically when units are toggled.

### RxJS

RxJS Observables are used end-to-end:
- Backend: `HttpService` returns Observables; service methods compose pipelines with `switchMap`, `map`, `tap`
- Frontend: `axios` calls are wrapped in `from()` then consumed by React Query via `lastValueFrom()`

## Environment Variables

| Variable                     | Default | Description                                    |
|------------------------------|---------|------------------------------------------------|
| `OPENWEATHER_API_KEY`        |    —    | **Required.** Free key from openweathermap.org |
| `GEOAPIFY_API_KEY`           |    —    | **Required.** Free key from geoapify.com       |
| `WEATHER_CACHE_TTL_SECONDS`  |  `600`  | Current weather cache duration (10 min)        |
| `FORECAST_CACHE_TTL_SECONDS` |  `1800` | Forecast cache duration (30 min)               |
| `PORT`                       |  `3000` | NestJS port (inside Docker)                    |
| `VITE_API_BASE_URL`          |  `/api` | Frontend API base path                         |

For stage-specific configurations (development, staging, production), see [`docs/environment-variables.md`](docs/environment-variables.md).

## Documentation

Detailed documentation lives in the [`docs/`](docs/) folder:

- **[Project Overview](docs/project-overview.md)** — Features, architecture diagram, design decisions
- **[Tech Stack](docs/tech-stack.md)** — Full stack reference + development conventions
- **[API Reference](docs/api-reference.md)** — Standalone REST endpoint documentation
- **[External APIs](docs/external-apis.md)** — OpenWeather and GeoApify integration details
- **[Environment Variables](docs/environment-variables.md)** — Configuration per stage
- **[Requirements](docs/requirements/index.md)** — Tracked functional and non-functional requirements

## Development Notes

- The backend vitest config uses `unplugin-swc` to enable NestJS decorator metadata. Do not switch to the default esbuild transformer.
- Tailwind CSS v4 is used — there is no `tailwind.config.js`. Dark mode variants are declared in CSS using `@variant dark`.
- `vitest` is pinned to `^3.x` and `jsdom` to `^24.x` due to known incompatibilities with newer versions.
- GeoApify was chosen for geocode autocomplete because of its generous free tier (3,000 req/day, no credit card required).
