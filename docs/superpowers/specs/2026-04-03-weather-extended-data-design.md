# Weather Extended Data Display — Design Spec

**Date:** 2026-04-03
**Status:** Approved

---

## Goal

Surface all meaningful data available from the OpenWeather `/weather` endpoint that is not currently displayed: visibility, wind direction, wind gust, pressure, cloud coverage, precipitation, sunrise, and sunset.

---

## Background

The current `WeatherDto` maps only a subset of the OpenWeather API response. The following fields are returned by the API but unused:

| API field | Description |
|---|---|
| `visibility` | Visibility in meters |
| `wind.deg` | Wind direction in degrees (0–360) |
| `wind.gust` | Wind gust speed (optional) |
| `main.pressure` | Atmospheric pressure in hPa |
| `clouds.all` | Cloud coverage percentage |
| `rain["1h"]` / `snow["1h"]` | Precipitation in mm/h (optional) |
| `sys.sunrise` | Sunrise Unix timestamp |
| `sys.sunset` | Sunset Unix timestamp |

---

## Architecture

The change flows through three layers in sequence: shared DTO → backend mapper → frontend display. No new API calls are needed. A new formatting utility is added to the frontend to keep the component clean and the logic testable.

---

## Data Layer

### `libs/shared/src/types/weather.dto.ts`

Add 8 new fields to `WeatherDto`:

```typescript
visibility: number;       // meters, raw
windDeg: number;          // 0–360°
windGust: number | null;  // null when absent in API response
pressure: number;         // hPa
cloudCoverage: number;    // 0–100%
precipitation: number;    // mm/h, 0 when absent
sunrise: string;          // ISO 8601
sunset: string;           // ISO 8601
```

### `apps/backend/src/weather/weather.mapper.ts`

**`OpenWeatherCurrentResponse` interface** — add raw API fields:

```typescript
visibility: number;
wind: { speed: number; deg: number; gust?: number };
clouds: { all: number };
rain?: { "1h"?: number };
snow?: { "1h"?: number };
sys: { country: string; sunrise: number; sunset: number };
```

**`toWeatherDto()` mapping** — new field assignments:

```typescript
visibility: raw.visibility,
windDeg: raw.wind.deg,
windGust: raw.wind.gust ?? null,
pressure: raw.main.pressure,
cloudCoverage: raw.clouds.all,
precipitation: raw.rain?.["1h"] ?? raw.snow?.["1h"] ?? 0,
sunrise: new Date(raw.sys.sunrise * 1000).toISOString(),
sunset: new Date(raw.sys.sunset * 1000).toISOString(),
```

---

## Formatting Helpers

**File:** `apps/frontend/src/features/weather/utils/formatters.ts`

Four pure, unit-tested functions:

### `degreesToCompass(deg: number): string`
Maps 0–360° to a 16-point compass label. Divides the circle into 22.5° segments.
- 0° / 360° → `"N"`, 90° → `"E"`, 180° → `"S"`, 270° → `"W"`, etc.

### `formatVisibility(meters: number, units: Units): string`
- Metric: `meters / 1000` → `"10 km"` (1 decimal if < 10)
- Imperial: `meters / 1609.34` → `"6.2 mi"` (1 decimal)

### `formatPressure(hpa: number, units: Units): string`
- Metric: `"1015 hPa"`
- Imperial: `hpa * 0.02953` → `"29.97 inHg"` (2 decimals)

### `formatPrecipitation(mm: number, units: Units): string`
- Metric: `"3.2 mm"`
- Imperial: `mm / 25.4` → `"0.13 in"` (2 decimals)

### `formatTime(isoString: string): string`
Uses `new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })` → `"6:23 AM"`

**Test file:** `apps/frontend/src/features/weather/utils/formatters.spec.ts`
Covers: compass boundary values (N, NE, S, W, NNW), metric/imperial visibility, metric/imperial pressure, time formatting.

---

## Component Changes

### `apps/frontend/src/features/weather/components/CurrentWeather.tsx`

The stat grid expands from 5 tiles to up to 13. Two tiles are conditionally rendered:
- **Gust** — hidden when `data.windGust` is `null`
- **Precipitation** — hidden when `data.precipitation === 0`

**Tile list:**

| Label | Value | Notes |
|---|---|---|
| Humidity | `64%` | existing |
| Wind | `0.6 m/s NNW` | speed + `degreesToCompass` |
| Gust | `1.2 m/s` | conditional |
| UV Index | `0` | existing |
| High | `27°C` | existing |
| Low | `24°C` | existing |
| Visibility | `10 km` | `formatVisibility` |
| Pressure | `1015 hPa` | `formatPressure` |
| Clouds | `100%` | |
| Precipitation | `3.2 mm` / `0.12 in` | conditional; imperial converts mm → inches |
| Sunrise | `6:23 AM` | `formatTime` |
| Sunset | `7:57 PM` | `formatTime` |

**Grid class:** change from `grid-cols-3 sm:grid-cols-5` to `grid-cols-3 sm:grid-cols-4`.

`StatTile` component is unchanged.

---

## Testing

### Unit tests

- `formatters.spec.ts` — all 4 formatting functions, boundary values, both unit modes
- `CurrentWeather.spec.tsx` — assert Gust tile hidden when `windGust: null`; assert Precipitation tile hidden when `precipitation: 0`; assert both visible with non-null/non-zero values
- `weather.mapper.spec.ts` (backend) — assert all 8 new fields are mapped correctly, including `windGust: null` when gust absent and `precipitation: 0` when neither rain nor snow present

### E2E tests

Extend `e2e/tests/` Playwright specs with assertions that after searching a city, the following labels appear in the DOM:
- `Visibility`
- `Pressure`
- `Sunrise`
- `Sunset`
- `Clouds`

---

## Files Touched

| File | Action |
|---|---|
| `libs/shared/src/types/weather.dto.ts` | Modify — add 8 fields |
| `apps/backend/src/weather/weather.mapper.ts` | Modify — extend interface + mapping |
| `apps/backend/src/weather/weather.mapper.spec.ts` | Modify — add mapping tests |
| `apps/frontend/src/features/weather/utils/formatters.ts` | Create |
| `apps/frontend/src/features/weather/utils/formatters.spec.ts` | Create |
| `apps/frontend/src/features/weather/components/CurrentWeather.tsx` | Modify — expand stat grid |
| `apps/frontend/src/features/weather/components/CurrentWeather.spec.tsx` | Modify — add conditional tile tests |
| `e2e/tests/` | Modify — add field visibility assertions |
