# Weather Extended Data Display — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface all available OpenWeather API fields (visibility, wind direction/gust, pressure, clouds, precipitation, sunrise, sunset) through the full stack: shared DTO → backend mapper → frontend stat grid.

**Architecture:** Add 8 fields to `WeatherDto`, extend the backend mapper to populate them, create a `formatters.ts` utility with 5 pure functions for display conversion, and expand `CurrentWeather` with a 12-tile grid (2 tiles conditional). Two conditional tiles: Gust (hidden when `windGust` is null) and Precip (hidden when `precipitation === 0`).

**Tech Stack:** TypeScript interfaces (shared lib), NestJS mapper (backend), Vitest + Testing Library (unit tests), Playwright (e2e).

---

## File Map

| File | Action |
|---|---|
| `libs/shared/src/types/weather.dto.ts` | Modify — add 8 fields |
| `apps/backend/src/weather/weather.mapper.ts` | Modify — extend interface + mapping |
| `apps/backend/src/weather/weather.mapper.spec.ts` | Modify — extend fixture + add 4 tests |
| `apps/frontend/src/features/weather/utils/formatters.ts` | Create — 5 pure formatting functions |
| `apps/frontend/src/features/weather/utils/formatters.spec.ts` | Create — unit tests for all formatters |
| `apps/frontend/src/features/weather/components/CurrentWeather.tsx` | Modify — expand stat grid |
| `apps/frontend/src/features/weather/components/CurrentWeather.spec.tsx` | Modify — update mockDto + add 5 tests |
| `e2e/tests/weather.spec.ts` | Modify — add extended data tile assertions |

---

## Task 1: Extend WeatherDto

**Files:**
- Modify: `libs/shared/src/types/weather.dto.ts`

This is a pure TypeScript change. No runtime code. The TypeScript compiler will surface any consumer that is now missing fields.

- [ ] **Step 1: Update the DTO**

Replace the entire file content:

```typescript
import { Units } from './units.type';

export interface WeatherDto {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDeg: number;
  windGust: number | null;
  uvIndex: number;
  condition: string;
  conditionIcon: string;
  high: number;
  low: number;
  visibility: number;      // meters, raw
  pressure: number;        // hPa
  cloudCoverage: number;   // 0–100%
  precipitation: number;   // mm/h, 0 when absent
  sunrise: string;         // ISO 8601
  sunset: string;          // ISO 8601
  units: Units;
  updatedAt: string;       // ISO 8601
}
```

- [ ] **Step 2: Verify TypeScript compilation catches missing fields**

Run: `npx tsc --noEmit -p apps/backend/tsconfig.json`

Expected: errors mentioning `windDeg`, `windGust`, `visibility`, `pressure`, `cloudCoverage`, `precipitation`, `sunrise`, `sunset` not present in the mapper's return object. This is expected — Task 2 fixes them.

- [ ] **Step 3: Commit**

```bash
git add libs/shared/src/types/weather.dto.ts
git commit -m "feat(shared): add extended weather fields to WeatherDto"
```

---

## Task 2: Extend Backend Mapper (TDD)

**Files:**
- Modify: `apps/backend/src/weather/weather.mapper.spec.ts`
- Modify: `apps/backend/src/weather/weather.mapper.ts`

- [ ] **Step 1: Extend the test fixture**

In `weather.mapper.spec.ts`, replace `rawCurrentResponse` with:

```typescript
const rawCurrentResponse = {
  name: 'Austin',
  sys: { country: 'US', sunrise: 1700000000, sunset: 1700040000 },
  main: {
    temp: 72,
    feels_like: 75,
    humidity: 58,
    temp_max: 78,
    temp_min: 65,
    pressure: 1015,
  },
  wind: { speed: 12, deg: 270, gust: 15 },
  weather: [{ description: 'partly cloudy', icon: '02d' }],
  uvi: 6,
  dt: 1700000000,
  visibility: 10000,
  clouds: { all: 75 },
  rain: { '1h': 3.16 },
};
```

- [ ] **Step 2: Write the failing tests**

Add these 4 tests inside `describe('toWeatherDto', ...)` in `weather.mapper.spec.ts`:

```typescript
it('maps all new extended fields', () => {
  const dto = mapper.toWeatherDto(rawCurrentResponse as any, 'imperial');
  expect(dto.visibility).toBe(10000);
  expect(dto.windDeg).toBe(270);
  expect(dto.windGust).toBe(15);
  expect(dto.pressure).toBe(1015);
  expect(dto.cloudCoverage).toBe(75);
  expect(dto.precipitation).toBe(3.16);
  expect(dto.sunrise).toBe(new Date(1700000000 * 1000).toISOString());
  expect(dto.sunset).toBe(new Date(1700040000 * 1000).toISOString());
});

it('sets windGust to null when gust is absent from API response', () => {
  const raw = { ...rawCurrentResponse, wind: { speed: 12, deg: 270 } };
  const dto = mapper.toWeatherDto(raw as any, 'imperial');
  expect(dto.windGust).toBeNull();
});

it('sets precipitation to 0 when neither rain nor snow is present', () => {
  const { rain, ...rawWithoutRain } = rawCurrentResponse;
  const dto = mapper.toWeatherDto(rawWithoutRain as any, 'imperial');
  expect(dto.precipitation).toBe(0);
});

it('uses snow["1h"] for precipitation when rain is absent', () => {
  const { rain, ...rawWithoutRain } = rawCurrentResponse;
  const rawWithSnow = { ...rawWithoutRain, snow: { '1h': 1.5 } };
  const dto = mapper.toWeatherDto(rawWithSnow as any, 'imperial');
  expect(dto.precipitation).toBe(1.5);
});
```

- [ ] **Step 3: Run tests to confirm they fail**

Run: `nx test backend --testFile=weather.mapper.spec.ts`

Expected: FAIL — `dto.windDeg` and other new fields are undefined.

- [ ] **Step 4: Update the mapper interface**

In `weather.mapper.ts`, replace the `OpenWeatherCurrentResponse` interface:

```typescript
export interface OpenWeatherCurrentResponse {
  name: string;
  sys: { country: string; sunrise: number; sunset: number };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_max: number;
    temp_min: number;
    pressure: number;
  };
  wind: { speed: number; deg: number; gust?: number };
  weather: Array<{ description: string; icon: string }>;
  uvi?: number;
  dt: number;
  visibility: number;
  clouds: { all: number };
  rain?: { '1h'?: number };
  snow?: { '1h'?: number };
}
```

- [ ] **Step 5: Update toWeatherDto mapping**

Replace the `toWeatherDto` method body:

```typescript
toWeatherDto(raw: OpenWeatherCurrentResponse, units: Units): WeatherDto {
  return {
    city: raw.name,
    country: raw.sys.country,
    temperature: raw.main.temp,
    feelsLike: raw.main.feels_like,
    humidity: raw.main.humidity,
    windSpeed: raw.wind.speed,
    windDeg: raw.wind.deg,
    windGust: raw.wind.gust ?? null,
    uvIndex: raw.uvi ?? 0,
    condition: raw.weather[0]?.description ?? '',
    conditionIcon: raw.weather[0]?.icon ?? '',
    high: raw.main.temp_max,
    low: raw.main.temp_min,
    units,
    updatedAt: new Date(raw.dt * 1000).toISOString(),
    visibility: raw.visibility,
    pressure: raw.main.pressure,
    cloudCoverage: raw.clouds.all,
    precipitation: raw.rain?.['1h'] ?? raw.snow?.['1h'] ?? 0,
    sunrise: new Date(raw.sys.sunrise * 1000).toISOString(),
    sunset: new Date(raw.sys.sunset * 1000).toISOString(),
  };
}
```

- [ ] **Step 6: Run tests to confirm they pass**

Run: `nx test backend`

Expected: 17 tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/weather/weather.mapper.ts apps/backend/src/weather/weather.mapper.spec.ts
git commit -m "feat(backend): map extended weather fields in WeatherMapper"
```

---

## Task 3: Create Formatting Utilities (TDD)

**Files:**
- Create: `apps/frontend/src/features/weather/utils/formatters.spec.ts`
- Create: `apps/frontend/src/features/weather/utils/formatters.ts`

The `utils/` directory does not exist yet — it will be created when you write these files.

- [ ] **Step 1: Write the failing tests**

Create `apps/frontend/src/features/weather/utils/formatters.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  degreesToCompass,
  formatVisibility,
  formatPressure,
  formatPrecipitation,
  formatTime,
} from './formatters';

describe('degreesToCompass', () => {
  it('maps 0° to N', () => expect(degreesToCompass(0)).toBe('N'));
  it('maps 360° to N', () => expect(degreesToCompass(360)).toBe('N'));
  it('maps 90° to E', () => expect(degreesToCompass(90)).toBe('E'));
  it('maps 180° to S', () => expect(degreesToCompass(180)).toBe('S'));
  it('maps 270° to W', () => expect(degreesToCompass(270)).toBe('W'));
  it('maps 315° to NW', () => expect(degreesToCompass(315)).toBe('NW'));
  it('maps 337.5° to NNW', () => expect(degreesToCompass(337.5)).toBe('NNW'));
  it('maps 349° to N (rounds up to 360)', () => expect(degreesToCompass(349)).toBe('N'));
  it('handles negative degrees (−45° → NW)', () => expect(degreesToCompass(-45)).toBe('NW'));
});

describe('formatVisibility', () => {
  it('formats 10000m as "10 km" in metric', () =>
    expect(formatVisibility(10000, 'metric')).toBe('10 km'));
  it('formats 5000m as "5.0 km" in metric (< 10 shows 1 decimal)', () =>
    expect(formatVisibility(5000, 'metric')).toBe('5.0 km'));
  it('formats 1609m as "1.0 mi" in imperial', () =>
    expect(formatVisibility(1609, 'imperial')).toBe('1.0 mi'));
  it('formats 16093m as "10.0 mi" in imperial', () =>
    expect(formatVisibility(16093, 'imperial')).toBe('10.0 mi'));
});

describe('formatPressure', () => {
  it('formats 1015 hPa as "1015 hPa" in metric', () =>
    expect(formatPressure(1015, 'metric')).toBe('1015 hPa'));
  it('formats 1013 hPa as "29.91 inHg" in imperial', () =>
    expect(formatPressure(1013, 'imperial')).toBe('29.91 inHg'));
});

describe('formatPrecipitation', () => {
  it('formats 3.16 mm as "3.2 mm" in metric', () =>
    expect(formatPrecipitation(3.16, 'metric')).toBe('3.2 mm'));
  it('formats 25.4 mm as "1.00 in" in imperial', () =>
    expect(formatPrecipitation(25.4, 'imperial')).toBe('1.00 in'));
});

describe('formatTime', () => {
  it('returns a time string matching HH:MM pattern', () => {
    const result = formatTime(new Date('2026-01-15T06:23:00Z').toISOString());
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

Run: `nx test frontend --testFile=formatters.spec.ts`

Expected: FAIL — module `./formatters` not found.

- [ ] **Step 3: Implement the formatters**

Create `apps/frontend/src/features/weather/utils/formatters.ts`:

```typescript
import { Units } from '@parletto/shared';

const COMPASS_POINTS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

export function degreesToCompass(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS_POINTS[index];
}

export function formatVisibility(meters: number, units: Units): string {
  if (units === 'imperial') {
    return `${(meters / 1609.34).toFixed(1)} mi`;
  }
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export function formatPressure(hpa: number, units: Units): string {
  if (units === 'imperial') {
    return `${(hpa * 0.02953).toFixed(2)} inHg`;
  }
  return `${hpa} hPa`;
}

export function formatPrecipitation(mm: number, units: Units): string {
  if (units === 'imperial') {
    return `${(mm / 25.4).toFixed(2)} in`;
  }
  return `${mm.toFixed(1)} mm`;
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `nx test frontend --testFile=formatters.spec.ts`

Expected: 13 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/weather/utils/formatters.ts apps/frontend/src/features/weather/utils/formatters.spec.ts
git commit -m "feat(frontend): add weather formatting utility functions"
```

---

## Task 4: Update CurrentWeather Component (TDD)

**Files:**
- Modify: `apps/frontend/src/features/weather/components/CurrentWeather.spec.tsx`
- Modify: `apps/frontend/src/features/weather/components/CurrentWeather.tsx`

- [ ] **Step 1: Update the mock DTO in the spec**

In `CurrentWeather.spec.tsx`, replace the `mockDto` constant:

```typescript
const mockDto: WeatherDto = {
  city: 'Austin',
  country: 'US',
  temperature: 72,
  feelsLike: 75,
  humidity: 58,
  windSpeed: 12,
  windDeg: 270,
  windGust: 15,
  uvIndex: 6,
  condition: 'Partly Cloudy',
  conditionIcon: '02d',
  high: 78,
  low: 65,
  units: 'imperial',
  updatedAt: new Date().toISOString(),
  visibility: 16093,
  pressure: 1015,
  cloudCoverage: 75,
  precipitation: 3.16,
  sunrise: new Date('2026-01-15T12:00:00Z').toISOString(),
  sunset: new Date('2026-01-15T23:00:00Z').toISOString(),
};
```

- [ ] **Step 2: Write the failing tests**

Add these 5 tests to `CurrentWeather.spec.tsx` inside the `describe('CurrentWeather', ...)` block:

```typescript
it('renders extended stat tile labels', () => {
  render(<CurrentWeather data={mockDto} />);
  expect(screen.getByText('Visibility')).toBeInTheDocument();
  expect(screen.getByText('Pressure')).toBeInTheDocument();
  expect(screen.getByText('Clouds')).toBeInTheDocument();
  expect(screen.getByText('Sunrise')).toBeInTheDocument();
  expect(screen.getByText('Sunset')).toBeInTheDocument();
});

it('renders Gust tile when windGust is not null', () => {
  render(<CurrentWeather data={mockDto} />);
  expect(screen.getByText('Gust')).toBeInTheDocument();
});

it('hides Gust tile when windGust is null', () => {
  render(<CurrentWeather data={{ ...mockDto, windGust: null }} />);
  expect(screen.queryByText('Gust')).not.toBeInTheDocument();
});

it('renders Precip tile when precipitation > 0', () => {
  render(<CurrentWeather data={mockDto} />);
  expect(screen.getByText('Precip')).toBeInTheDocument();
});

it('hides Precip tile when precipitation is 0', () => {
  render(<CurrentWeather data={{ ...mockDto, precipitation: 0 }} />);
  expect(screen.queryByText('Precip')).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Run to confirm they fail**

Run: `nx test frontend --testFile=CurrentWeather.spec.tsx`

Expected: FAIL — TypeScript errors (missing new DTO fields on mockDto) and missing tile labels.

- [ ] **Step 4: Update CurrentWeather component**

Replace the entire content of `apps/frontend/src/features/weather/components/CurrentWeather.tsx`:

```typescript
import { WeatherDto } from '@parletto/shared';
import { StatTile } from './StatTile';
import {
  degreesToCompass,
  formatVisibility,
  formatPressure,
  formatPrecipitation,
  formatTime,
} from '../utils/formatters';

interface CurrentWeatherProps {
  data: WeatherDto;
}

export function CurrentWeather({ data }: CurrentWeatherProps) {
  const unitSymbol = data.units === 'imperial' ? '°F' : '°C';
  const speedUnit = data.units === 'imperial' ? 'mph' : 'm/s';

  return (
    <div className="rounded-xl bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm dark:from-gray-800 dark:to-gray-900">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {data.city}, {data.country}
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-6xl font-light text-gray-900 dark:text-white">
              {Math.round(data.temperature)}
            </span>
            <span className="text-2xl text-gray-400">{unitSymbol}</span>
          </div>
          <p className="mt-1 text-sm capitalize text-gray-500 dark:text-gray-400">
            {data.condition}
          </p>
          <p className="text-xs text-gray-400">
            Feels like {Math.round(data.feelsLike)}{unitSymbol}
          </p>
        </div>
        <img
          src={`https://openweathermap.org/img/wn/${data.conditionIcon}@2x.png`}
          alt={data.condition}
          className="h-16 w-16"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <StatTile label="Humidity" value={`${data.humidity}%`} />
        <StatTile
          label="Wind"
          value={`${Math.round(data.windSpeed)} ${speedUnit} ${degreesToCompass(data.windDeg)}`}
        />
        {data.windGust !== null && (
          <StatTile label="Gust" value={`${Math.round(data.windGust)} ${speedUnit}`} />
        )}
        <StatTile label="UV Index" value={String(data.uvIndex)} />
        <StatTile label="High" value={`${Math.round(data.high)}${unitSymbol}`} />
        <StatTile label="Low" value={`${Math.round(data.low)}${unitSymbol}`} />
        <StatTile label="Visibility" value={formatVisibility(data.visibility, data.units)} />
        <StatTile label="Pressure" value={formatPressure(data.pressure, data.units)} />
        <StatTile label="Clouds" value={`${data.cloudCoverage}%`} />
        {data.precipitation > 0 && (
          <StatTile label="Precip" value={formatPrecipitation(data.precipitation, data.units)} />
        )}
        <StatTile label="Sunrise" value={formatTime(data.sunrise)} />
        <StatTile label="Sunset" value={formatTime(data.sunset)} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run full frontend test suite**

Run: `nx test frontend`

Expected: 33 tests pass (28 existing + 5 new).

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/features/weather/components/CurrentWeather.tsx apps/frontend/src/features/weather/components/CurrentWeather.spec.tsx
git commit -m "feat(frontend): expand weather card with extended stat tiles"
```

---

## Task 5: Extend E2E Tests

**Files:**
- Modify: `e2e/tests/weather.spec.ts`

> **Prerequisites:** The Docker stack must be running (`docker compose up --build`) and `OPENWEATHER_API_KEY` must be set in `.env` before running these tests.

- [ ] **Step 1: Add the extended data test**

Add this test inside `test.describe('Weather App', ...)` in `e2e/tests/weather.spec.ts`:

```typescript
test('extended weather data tiles are visible after search', async ({ page }) => {
  await page.fill('input[placeholder*="Search"]', 'Austin, TX');
  await page.press('input[placeholder*="Search"]', 'Enter');

  // Wait for weather card to load
  await expect(page.getByText(/Austin/i)).toBeVisible({ timeout: 10_000 });

  // Assert extended stat tile labels are present
  await expect(page.getByText('Visibility')).toBeVisible();
  await expect(page.getByText('Pressure')).toBeVisible();
  await expect(page.getByText('Clouds')).toBeVisible();
  await expect(page.getByText('Sunrise')).toBeVisible();
  await expect(page.getByText('Sunset')).toBeVisible();
});
```

- [ ] **Step 2: Run the e2e suite**

```bash
cd e2e
npx playwright test
```

Expected: 7 tests pass (6 existing + 1 new).

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/weather.spec.ts
git commit -m "test(e2e): assert extended weather data tiles visible after search"
```

---

## Verification

Run the full test suite to confirm nothing regressed:

```bash
npm test
```

Expected output:
- **Backend:** 21 tests (17 existing + 4 new mapper tests)
- **Frontend:** 46 tests (28 existing + 5 new `CurrentWeather` tests + 13 new formatter tests)
- **Total: 67 tests**
