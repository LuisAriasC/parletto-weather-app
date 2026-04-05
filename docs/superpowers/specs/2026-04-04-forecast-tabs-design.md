# Forecast Tabs Feature — Design Spec

**Date:** 2026-04-04
**Status:** Approved

---

## Goal

Replace the static `ForecastStrip` below the current weather card with a two-tab `ForecastPanel` that lets users switch between a 3-hour interval view and the existing 5-day daily view — all powered by the free-tier `/forecast` endpoint already in use.

---

## Background

The free OpenWeather tier exposes two endpoints:
- `GET /data/2.5/weather` — current weather (already used)
- `GET /data/2.5/forecast` — 40 slots at 3-hour intervals over 5 days (already used for daily aggregation)

The same `/forecast` response can power two distinct views:
1. **3-Hour tab** — raw 3-hour slots as rows (first 8 = 24h)
2. **5-Day tab** — daily aggregation (existing `ForecastStrip`)

No new API endpoints, no paid tier required.

---

## Architecture

### Data flow

```
OpenWeather /forecast
        │
        ├── WeatherMapper.toForecastDtos()  → ForecastDto[]  → 5-Day tab
        └── WeatherMapper.toHourlyDtos()   → HourlyDto[]    → 3-Hour tab
```

Both paths share:
- The same `GET /api/forecast` OpenWeather call
- The same cache key pattern (`forecast:location:units` / `hourly:location:units`)
- The same `GetWeatherQuery` validation DTO

### State management

Tab selection (`'3h' | '5d'`) is ephemeral UI state — `useState` in `ForecastPanel`. No Redux involvement.

---

## Shared DTO

**New file:** `libs/shared/src/types/hourly.dto.ts`

```typescript
export interface HourlyDto {
  time: string;        // ISO 8601
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionIcon: string;
  humidity: number;
  windSpeed: number;
  windDeg: number;
  pop: number;         // precipitation probability 0.0–1.0
}
```

**`libs/shared/src/index.ts`** — export `HourlyDto`.

---

## Backend Changes

### `weather.mapper.ts`

Extend `OpenWeatherForecastSlot` interface to include previously unmapped fields:

```typescript
export interface OpenWeatherForecastSlot {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    temp_max: number;
    temp_min: number;
    humidity: number;
    feels_like: number;   // NEW
  };
  wind: { speed: number; deg: number };  // deg NEW
  weather: Array<{ description: string; icon: string }>;
  pop?: number;           // NEW — precipitation probability
}
```

New mapper method:

```typescript
toHourlyDtos(raw: OpenWeatherForecastResponse): HourlyDto[] {
  return raw.list.map((slot) => ({
    time: new Date(slot.dt * 1000).toISOString(),
    temperature: slot.main.temp,
    feelsLike: slot.main.feels_like,
    condition: slot.weather[0]?.description ?? '',
    conditionIcon: slot.weather[0]?.icon ?? '',
    humidity: slot.main.humidity,
    windSpeed: slot.wind.speed,
    windDeg: slot.wind.deg,
    pop: slot.pop ?? 0,
  }));
}
```

### `weather.service.ts`

New method — same cache pattern, uses existing `forecastTtlMs`:

```typescript
getHourlyForecast$(location: string, units: Units): Observable<HourlyDto[]> {
  const cacheKey = `hourly:${location}:${units}`;
  return from(this.cache.get<HourlyDto[]>(cacheKey)).pipe(
    switchMap((cached) => {
      if (cached) {
        this.metrics.recordCacheHit();
        return of(cached);
      }
      this.metrics.recordCacheMiss();
      this.metrics.recordApiCall();
      return this.httpService
        .get<OpenWeatherForecastResponse>(`${this.appConfig.baseUrl}/forecast`, {
          params: { ...this.buildLocationParams(location), appid: this.appConfig.apiKey, units },
        })
        .pipe(
          map(({ data }) => this.mapper.toHourlyDtos(data)),
          tap((dtos) => this.cache.set(cacheKey, dtos, this.appConfig.forecastTtlMs)),
        );
    }),
  );
}
```

### `weather.controller.ts`

New endpoint:

```typescript
@Get('forecast/hourly')
@Throttle({ default: { ttl: 60_000, limit: 20 } })
@ApiOperation({ summary: 'Get 3-hour interval forecast (40 slots / 5 days)' })
@ApiQuery({ name: 'location', required: true })
@ApiQuery({ name: 'units', enum: ['imperial', 'metric'], required: false })
@ApiResponse({ status: 200, description: '40 slots at 3-hour intervals' })
@ApiResponse({ status: 400, description: 'Invalid or missing location' })
@ApiResponse({ status: 404, description: 'Location not found' })
@ApiResponse({ status: 502, description: 'Weather service unavailable' })
getHourlyForecast(@Query() query: GetWeatherQuery): Observable<HourlyDto[]> {
  return this.weatherService.getHourlyForecast$(query.location, query.units ?? 'imperial');
}
```

---

## Frontend Changes

### `features/weather/services/weather.service.ts`

Add method:

```typescript
getHourlyForecast$(location: string, units: Units): Observable<HourlyDto[]> {
  return from(
    axios.get<HourlyDto[]>(`${API_BASE}/forecast/hourly`, {
      params: { location, units },
    }),
  ).pipe(
    map((response) => response.data),
    catchError((err) => throwError(() => normalizeError(err))),
  );
}
```

### `features/weather/hooks/useHourlyForecast.ts`

New hook:

```typescript
export function useHourlyForecast(location: string, units: Units) {
  return useQuery<HourlyDto[], ErrorDto>({
    queryKey: ['forecast-hourly', location, units],
    queryFn: () => lastValueFrom(weatherService.getHourlyForecast$(location, units)),
    enabled: Boolean(location),
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
```

### `features/weather/components/HourlyStrip.tsx`

- Receives `data: HourlyDto[]`, `units: Units`
- Displays first 8 slots (24h) as rows; renders however many are available if fewer than 8
- Each row: `formatTime(slot.time)` | icon | condition | temperature+unit | pop% (hidden if 0) | wind speed+compass

### `features/weather/components/ForecastPanel.tsx`

- Props: `location: string`, `units: Units`
- State: `activeTab: '3h' | '5d'` (default `'3h'`)
- Calls `useHourlyForecast(location, units)` and `useForecast(location, units)` — React Query caches both
- Renders pill tab buttons: "3-Hour" | "5-Day"
- Active tab shows filled background; inactive shows outline/ghost style
- Tab content: `activeTab === '3h'` → `HourlyStrip` (or loading/error); `activeTab === '5d'` → `ForecastStrip` (or loading/error)
- Loading and error states are per-tab and independent

### `app/layout/MainPanel.tsx`

- Remove `useForecast` call and `ForecastStrip` import
- Replace `<ForecastStrip data={forecast.data} units={units} />` with `<ForecastPanel location={location} units={units} />`
- Remove `forecast.isLoading` and `forecast.isError` checks (now handled inside `ForecastPanel`)

### `features/weather/index.ts`

- Remove `ForecastStrip` export (internal to feature now)
- Add `ForecastPanel` export
- Add `useHourlyForecast` export

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Hourly fetch fails | 3-Hour tab shows `<ErrorMessage>`; 5-Day tab unaffected |
| Daily fetch fails | 5-Day tab shows `<ErrorMessage>`; 3-Hour tab unaffected |
| Either tab loading | `<LoadingSpinner>` shown in that tab's content area |

---

## Testing

### Backend unit tests

**`weather.mapper.spec.ts`** — extend `rawForecastResponse` slots with `feels_like`, `deg`, `pop`:
- `toHourlyDtos()` maps all fields from each slot
- `toHourlyDtos()` defaults `pop` to 0 when absent
- `toHourlyDtos()` returns all 40 slots (or all slots in fixture)

**`weather.service.spec.ts`**:
- `getHourlyForecast$()` returns mapped `HourlyDto[]` from cache miss
- `getHourlyForecast$()` returns cached data on cache hit

**`weather.controller.spec.ts`**:
- `GET /api/forecast/hourly` calls `weatherService.getHourlyForecast$()` and returns 200

### Frontend unit tests

**`HourlyStrip.spec.tsx`**:
- Renders exactly 8 rows when given 40 slots
- Each row displays time, condition, temperature
- Pop% is hidden when `pop === 0`
- Pop% is shown (e.g., "30%") when `pop > 0`
- Wind shows speed + compass direction

**`ForecastPanel.spec.tsx`**:
- Default active tab is "3-Hour"
- Clicking "5-Day" tab switches view
- "3-Hour" tab shows `HourlyStrip` content
- "5-Day" tab shows `ForecastStrip` content
- Shows `<LoadingSpinner>` while hourly data loads
- Shows `<ErrorMessage>` if hourly fetch errors

### E2E

Extend `e2e/tests/weather.spec.ts`:
- After searching a city, "3-Hour" tab button is visible
- "5-Day" tab button is visible
- "3-Hour" tab is active by default (content area shows time-based rows)
- Clicking "5-Day" switches to daily view

---

## Files Touched

| File | Action |
|---|---|
| `libs/shared/src/types/hourly.dto.ts` | Create |
| `libs/shared/src/index.ts` | Modify — export `HourlyDto` |
| `apps/backend/src/weather/weather.mapper.ts` | Modify — extend slot interface + `toHourlyDtos()` |
| `apps/backend/src/weather/weather.mapper.spec.ts` | Modify — extend fixture + 3 new tests |
| `apps/backend/src/weather/weather.service.ts` | Modify — add `getHourlyForecast$()` |
| `apps/backend/src/weather/weather.service.spec.ts` | Modify — 2 new tests |
| `apps/backend/src/weather/weather.controller.ts` | Modify — add `GET /api/forecast/hourly` |
| `apps/backend/src/weather/weather.controller.spec.ts` | Modify — 1 new test |
| `apps/frontend/src/features/weather/services/weather.service.ts` | Modify — add `getHourlyForecast$()` |
| `apps/frontend/src/features/weather/hooks/useHourlyForecast.ts` | Create |
| `apps/frontend/src/features/weather/components/HourlyStrip.tsx` | Create |
| `apps/frontend/src/features/weather/components/HourlyStrip.spec.tsx` | Create |
| `apps/frontend/src/features/weather/components/ForecastPanel.tsx` | Create |
| `apps/frontend/src/features/weather/components/ForecastPanel.spec.tsx` | Create |
| `apps/frontend/src/features/weather/index.ts` | Modify — swap ForecastStrip for ForecastPanel, add useHourlyForecast |
| `apps/frontend/src/app/layout/MainPanel.tsx` | Modify — use ForecastPanel |
| `e2e/tests/weather.spec.ts` | Modify — add tab interaction tests |
