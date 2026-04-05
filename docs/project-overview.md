# Parletto — Project Overview

## What is Parletto?

Parletto is a full-stack weather application that lets users search for cities worldwide and view current weather conditions, hourly forecasts, and 5-day daily forecasts. It follows a Backend-for-Frontend (BFF) architecture where the React frontend never communicates directly with third-party APIs — all external calls are proxied through a NestJS backend.

## Key Features

### City Search with Autocomplete
Users type a city name into the search bar and receive real-time autocomplete suggestions powered by GeoApify. Suggestions appear after 3 characters with a 300ms debounce. Users can navigate suggestions with keyboard (Arrow keys, Enter, Escape) or click to select. Selecting a suggestion triggers a weather lookup using precise coordinates.

### Current Weather Display
After selecting a city, the main panel shows a detailed weather card with:
- Temperature and "feels like" temperature
- Weather condition with icon (e.g., sunny, cloudy, rain)
- Stat tiles: Humidity, Wind speed and direction, Wind gust, UV Index, High/Low, Visibility, Pressure, Cloud coverage, Precipitation, Sunrise, and Sunset times

### Hourly Forecast (Next 24h)
A tab view showing the next 8 three-hour forecast slots with temperature, rain probability, and wind speed for each slot.

### 5-Day Daily Forecast
A tab view showing 5 forecast cards, each with the day name, weather icon, high temperature, and low temperature.

### Unit Toggle
Users can switch between Imperial (°F, mph, inHg) and Metric (°C, m/s, hPa) units. The preference persists across sessions via localStorage.

### Dark Mode
A theme toggle in the header switches between light and dark mode. The preference persists across sessions.

### Recent Searches
The sidebar keeps a history of the last 5 searched locations. Clicking a recent search re-fetches its weather data. A "Clear" button removes all history. Recents persist across sessions via localStorage.

### Health Monitoring
A `/api/health` endpoint exposes uptime, API key status, and cache performance metrics (hit rate, misses, API calls).

## Architecture at a Glance

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│   Browser    │────▶│   nginx     │────▶│  NestJS Backend  │
│  React SPA   │◀────│  (port 80)  │◀────│   (port 3000)    │
└─────────────┘     └─────────────┘     └────────┬─────────┘
                                                  │
                                        ┌─────────▼─────────┐
                                        │  OpenWeather API   │
                                        │  GeoApify API      │
                                        └───────────────────┘
```

- **Frontend** — React 19 SPA served by nginx. All `/api/*` requests are reverse-proxied to the backend.
- **Backend** — NestJS BFF that holds API keys, applies caching and rate limiting, and transforms external API responses into typed DTOs.
- **Shared Library** — TypeScript interfaces (`WeatherDto`, `ForecastDto`, `HourlyDto`, `GeocodeSuggestionDto`, `ErrorDto`, `Units`) shared between frontend and backend for end-to-end type safety.

## Monorepo Structure

Parletto is an [Nx](https://nx.dev) monorepo with three packages:

| Package | Path | Purpose |
|---------|------|---------|
| Backend | `apps/backend/` | NestJS BFF proxy |
| Frontend | `apps/frontend/` | React + Vite SPA |
| Shared | `libs/shared/` | TypeScript DTO interfaces (no runtime code) |

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| BFF proxy pattern | API keys stay server-side; frontend never touches third-party APIs directly |
| GeoApify for geocoding | Chosen for its generous free tier and autocomplete-optimized endpoint |
| RxJS end-to-end | Backend uses NestJS `HttpService` (Observables natively); frontend wraps axios in `from()` for consistency |
| Redux for UI state, React Query for server state | Clean separation — Redux handles theme/units/recents; React Query handles caching, refetching, and staleness for API data |
| Tailwind CSS v4 | Utility-first styling with CSS-native configuration (no `tailwind.config.js`) |
| In-memory caching | Weather data cached 10 min, forecasts cached 30 min on the backend to reduce API calls |
| localStorage persistence | Theme, units, and recent searches survive page reloads without a database |
