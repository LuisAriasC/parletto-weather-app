# Forecast Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `ForecastStrip` with a two-tab `ForecastPanel` that lets users switch between a 3-hour interval view and the existing 5-day daily view, powered by the existing free `/forecast` endpoint.

**Architecture:** The `/forecast` response already fetched for the 5-Day tab is also used raw for the 3-Hour tab — no new API calls. A new `toHourlyDtos()` mapper method returns all 40 slots; the frontend shows the first 8 (24h). Tab state lives in local `useState` inside `ForecastPanel`.

**Tech Stack:** NestJS + RxJS (backend), React 19 + React Query + Vitest + Testing Library (frontend), Playwright (E2E), TypeScript shared DTOs.

---

## File Map

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

---

### Task 1: Add HourlyDto to shared lib

**Files:**
- Create: `libs/shared/src/types/hourly.dto.ts`
- Modify: `libs/shared/src/index.ts`

- [ ] **Step 1: Create the DTO file**

```typescript
// libs/shared/src/types/hourly.dto.ts
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

- [ ] **Step 2: Export from shared index**

Open `libs/shared/src/index.ts` and add one line:

```typescript
export * from './types/units.type';
export * from './types/weather.dto';
export * from './types/forecast.dto';
export * from './types/error.dto';
export * from './types/hourly.dto';   // ADD THIS LINE
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p libs/shared/tsconfig.json
```

Expected: no output (success).

- [ ] **Step 4: Commit**

```bash
git add libs/shared/src/types/hourly.dto.ts libs/shared/src/index.ts
git commit -m "feat(shared): add HourlyDto interface"
```

---

### Task 2: Extend backend mapper with toHourlyDtos() (TDD)

**Files:**
- Modify: `apps/backend/src/weather/weather.mapper.ts`
- Modify: `apps/backend/src/weather/weather.mapper.spec.ts`

- [ ] **Step 1: Write the failing tests**

Open `apps/backend/src/weather/weather.mapper.spec.ts`. The file has a `rawForecastResponse` fixture and tests for `toForecastDtos`. Add `feels_like`, `deg`, and `pop` to every slot in `rawForecastResponse`, then add these 3 tests at the bottom of the existing `describe` block:

```typescript
// At the top of the file, update rawForecastResponse to add feels_like, deg, pop to each slot:
// main: { temp: ..., temp_max: ..., temp_min: ..., humidity: ..., feels_like: 288.0 },
// wind: { speed: ..., deg: 200 },
// pop: 0.3,

describe('toHourlyDtos', () => {
  it('maps all fields from each slot', () => {
    const result = mapper.toHourlyDtos(rawForecastResponse);
    const first = result[0];
    expect(first.time).toBe(new Date(rawForecastResponse.list[0].dt * 1000).toISOString());
    expect(first.temperature).toBe(rawForecastResponse.list[0].main.temp);
    expect(first.feelsLike).toBe(rawForecastResponse.list[0].main.feels_like);
    expect(first.condition).toBe(rawForecastResponse.list[0].weather[0].description);
    expect(first.conditionIcon).toBe(rawForecastResponse.list[0].weather[0].icon);
    expect(first.humidity).toBe(rawForecastResponse.list[0].main.humidity);
    expect(first.windSpeed).toBe(rawForecastResponse.list[0].wind.speed);
    expect(first.windDeg).toBe(rawForecastResponse.list[0].wind.deg);
    expect(first.pop).toBe(0.3);
  });

  it('defaults pop to 0 when absent', () => {
    const noPopResponse = {
      ...rawForecastResponse,
      list: rawForecastResponse.list.map((s) => {
        const { pop: _pop, ...rest } = s as any;
        return rest;
      }),
    };
    const result = mapper.toHourlyDtos(noPopResponse as any);
    expect(result[0].pop).toBe(0);
  });

  it('returns all slots in the fixture', () => {
    const result = mapper.toHourlyDtos(rawForecastResponse);
    expect(result).toHaveLength(rawForecastResponse.list.length);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
nx test backend -- weather.mapper.spec.ts
```

Expected: FAIL — `mapper.toHourlyDtos is not a function`

- [ ] **Step 3: Extend the mapper**

Open `apps/backend/src/weather/weather.mapper.ts`. First, extend `OpenWeatherForecastSlot`:

```typescript
export interface OpenWeatherForecastSlot {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    temp_max: number;
    temp_min: number;
    humidity: number;
    feels_like: number;   // ADD
  };
  wind: { speed: number; deg: number };  // deg ADD
  weather: Array<{ description: string; icon: string }>;
  pop?: number;           // ADD
}
```

Then add `toHourlyDtos()` method to the `WeatherMapper` class (after `toForecastDtos`):

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

Also add `HourlyDto` to the import from `@parletto/shared` at the top of the file.

- [ ] **Step 4: Run tests to verify they pass**

```bash
nx test backend -- weather.mapper.spec.ts
```

Expected: all mapper tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/weather/weather.mapper.ts apps/backend/src/weather/weather.mapper.spec.ts
git commit -m "feat(backend): add toHourlyDtos() mapper method"
```

---

### Task 3: Add backend service method + controller endpoint (TDD)

**Files:**
- Modify: `apps/backend/src/weather/weather.service.spec.ts`
- Modify: `apps/backend/src/weather/weather.service.ts`
- Modify: `apps/backend/src/weather/weather.controller.spec.ts`
- Modify: `apps/backend/src/weather/weather.controller.ts`

- [ ] **Step 1: Write failing service tests**

Open `apps/backend/src/weather/weather.service.spec.ts`. The file already has a `mapper` mock object — add `toHourlyDtos: vi.fn()` to it. Then add these 2 tests in a new `describe('getHourlyForecast$')` block:

```typescript
describe('getHourlyForecast$', () => {
  it('returns mapped HourlyDto[] on cache miss', async () => {
    const mockHourly: HourlyDto[] = [
      {
        time: '2026-01-01T00:00:00.000Z',
        temperature: 70,
        feelsLike: 68,
        condition: 'clear sky',
        conditionIcon: '01d',
        humidity: 50,
        windSpeed: 5,
        windDeg: 180,
        pop: 0,
      },
    ];
    cache.get.mockResolvedValue(null);
    mapper.toHourlyDtos.mockReturnValue(mockHourly);
    httpService.get.mockReturnValue(of({ data: rawForecastData }));

    const result = await lastValueFrom(service.getHourlyForecast$('Austin, TX', 'imperial'));

    expect(mapper.toHourlyDtos).toHaveBeenCalledWith(rawForecastData);
    expect(result).toEqual(mockHourly);
    expect(cache.set).toHaveBeenCalledWith(
      'hourly:Austin, TX:imperial',
      mockHourly,
      appConfig.forecastTtlMs,
    );
  });

  it('returns cached HourlyDto[] on cache hit', async () => {
    const cached: HourlyDto[] = [{ time: '2026-01-01T00:00:00.000Z', temperature: 70, feelsLike: 68, condition: 'clear sky', conditionIcon: '01d', humidity: 50, windSpeed: 5, windDeg: 180, pop: 0 }];
    cache.get.mockResolvedValue(cached);

    const result = await lastValueFrom(service.getHourlyForecast$('Austin, TX', 'imperial'));

    expect(mapper.toHourlyDtos).not.toHaveBeenCalled();
    expect(result).toEqual(cached);
  });
});
```

Add `HourlyDto` to the import from `@parletto/shared` at the top of the spec file.

- [ ] **Step 2: Write failing controller test**

Open `apps/backend/src/weather/weather.controller.spec.ts`. The mock service already has `getWeather` and `getForecast`. Add `getHourlyForecast: vi.fn()` to the service mock. Then add 1 test in a new `describe('GET /forecast/hourly')` block:

```typescript
describe('GET /forecast/hourly', () => {
  it('calls weatherService.getHourlyForecast$ and returns result', async () => {
    const mockHourly: HourlyDto[] = [];
    mockWeatherService.getHourlyForecast.mockReturnValue(of(mockHourly));

    const result = await lastValueFrom(
      controller.getHourlyForecast({ location: 'Austin, TX', units: 'imperial' }),
    );

    expect(mockWeatherService.getHourlyForecast).toHaveBeenCalledWith('Austin, TX', 'imperial');
    expect(result).toEqual(mockHourly);
  });
});
```

Add `HourlyDto` to the `@parletto/shared` import.

- [ ] **Step 3: Run tests to verify they fail**

```bash
nx test backend -- weather.service.spec.ts
nx test backend -- weather.controller.spec.ts
```

Expected: FAIL — method does not exist

- [ ] **Step 4: Add service method**

Open `apps/backend/src/weather/weather.service.ts`. Add `HourlyDto` to the `@parletto/shared` import. Add this method after `getForecast$`:

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

- [ ] **Step 5: Add controller endpoint**

Open `apps/backend/src/weather/weather.controller.ts`. Add `HourlyDto` to the `@parletto/shared` import. Add this method after `getForecast`:

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

- [ ] **Step 6: Run tests to verify they pass**

```bash
nx test backend -- weather.service.spec.ts
nx test backend -- weather.controller.spec.ts
```

Expected: all service + controller tests PASS

- [ ] **Step 7: Run full backend suite**

```bash
nx test backend
```

Expected: all backend tests PASS

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/weather/weather.service.ts apps/backend/src/weather/weather.service.spec.ts apps/backend/src/weather/weather.controller.ts apps/backend/src/weather/weather.controller.spec.ts
git commit -m "feat(backend): add GET /api/forecast/hourly endpoint"
```

---

### Task 4: Frontend service method + hook

**Files:**
- Modify: `apps/frontend/src/features/weather/services/weather.service.ts`
- Create: `apps/frontend/src/features/weather/hooks/useHourlyForecast.ts`

- [ ] **Step 1: Add service method**

Open `apps/frontend/src/features/weather/services/weather.service.ts`. Add `HourlyDto` to the `@parletto/shared` import. Add this method to the service object (after `getForecast$`):

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
},
```

- [ ] **Step 2: Create the hook**

```typescript
// apps/frontend/src/features/weather/hooks/useHourlyForecast.ts
import { lastValueFrom } from 'rxjs';
import { useQuery } from '@tanstack/react-query';
import { HourlyDto, ErrorDto, Units } from '@parletto/shared';
import { weatherService } from '../services/weather.service';

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

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p apps/frontend/tsconfig.json
```

Expected: no output (success).

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/features/weather/services/weather.service.ts apps/frontend/src/features/weather/hooks/useHourlyForecast.ts
git commit -m "feat(frontend): add getHourlyForecast$ service method and useHourlyForecast hook"
```

---

### Task 5: Create HourlyStrip component (TDD)

**Files:**
- Create: `apps/frontend/src/features/weather/components/HourlyStrip.spec.tsx`
- Create: `apps/frontend/src/features/weather/components/HourlyStrip.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/frontend/src/features/weather/components/HourlyStrip.spec.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HourlyStrip } from './HourlyStrip';
import { HourlyDto } from '@parletto/shared';

function makeSlot(overrides: Partial<HourlyDto> = {}): HourlyDto {
  return {
    time: '2026-01-01T00:00:00.000Z',
    temperature: 70,
    feelsLike: 68,
    condition: 'clear sky',
    conditionIcon: '01d',
    humidity: 50,
    windSpeed: 10,
    windDeg: 180,
    pop: 0,
    ...overrides,
  };
}

function makeSlots(count: number): HourlyDto[] {
  return Array.from({ length: count }, (_, i) =>
    makeSlot({ time: new Date(Date.UTC(2026, 0, 1, i * 3)).toISOString() }),
  );
}

describe('HourlyStrip', () => {
  it('renders exactly 8 rows when given 40 slots', () => {
    render(<HourlyStrip data={makeSlots(40)} units="imperial" />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(8);
  });

  it('renders however many slots when fewer than 8 are provided', () => {
    render(<HourlyStrip data={makeSlots(3)} units="imperial" />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
  });

  it('renders condition text in each row', () => {
    render(<HourlyStrip data={makeSlots(1)} units="imperial" />);
    expect(screen.getByText(/clear sky/i)).toBeInTheDocument();
  });

  it('renders temperature with °F for imperial', () => {
    render(<HourlyStrip data={[makeSlot({ temperature: 72 })]} units="imperial" />);
    expect(screen.getByText(/72°F/)).toBeInTheDocument();
  });

  it('renders temperature with °C for metric', () => {
    render(<HourlyStrip data={[makeSlot({ temperature: 22 })]} units="metric" />);
    expect(screen.getByText(/22°C/)).toBeInTheDocument();
  });

  it('hides pop% when pop is 0', () => {
    render(<HourlyStrip data={[makeSlot({ pop: 0 })]} units="imperial" />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('shows pop% when pop is greater than 0', () => {
    render(<HourlyStrip data={[makeSlot({ pop: 0.3 })]} units="imperial" />);
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('shows wind speed with compass direction', () => {
    render(<HourlyStrip data={[makeSlot({ windSpeed: 10, windDeg: 180 })]} units="imperial" />);
    expect(screen.getByText(/10 mph S/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
nx test frontend -- HourlyStrip.spec.tsx
```

Expected: FAIL — `Cannot find module './HourlyStrip'`

- [ ] **Step 3: Implement HourlyStrip**

```tsx
// apps/frontend/src/features/weather/components/HourlyStrip.tsx
import { HourlyDto, Units } from '@parletto/shared';
import { formatTime, degreesToCompass } from '../utils/formatters';

interface HourlyStripProps {
  data: HourlyDto[];
  units: Units;
}

export function HourlyStrip({ data, units }: HourlyStripProps) {
  const slots = data.slice(0, 8);
  const unitSymbol = units === 'imperial' ? '°F' : '°C';
  const speedUnit = units === 'imperial' ? 'mph' : 'm/s';

  return (
    <table className="w-full text-sm">
      <tbody>
        {slots.map((slot) => (
          <tr key={slot.time} role="row" className="border-b border-gray-100 dark:border-gray-700 last:border-0">
            <td className="py-2 pr-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {formatTime(slot.time)}
            </td>
            <td className="py-2 pr-3">
              <img
                src={`https://openweathermap.org/img/wn/${slot.conditionIcon}.png`}
                alt={slot.condition}
                className="h-8 w-8"
              />
            </td>
            <td className="py-2 pr-3 capitalize text-gray-700 dark:text-gray-300">
              {slot.condition}
            </td>
            <td className="py-2 pr-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
              {Math.round(slot.temperature)}{unitSymbol}
            </td>
            {slot.pop > 0 && (
              <td className="py-2 pr-3 text-blue-500 whitespace-nowrap">
                {Math.round(slot.pop * 100)}%
              </td>
            )}
            {slot.pop === 0 && <td className="py-2 pr-3" />}
            <td className="py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {Math.round(slot.windSpeed)} {speedUnit} {degreesToCompass(slot.windDeg)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
nx test frontend -- HourlyStrip.spec.tsx
```

Expected: all 8 HourlyStrip tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/weather/components/HourlyStrip.tsx apps/frontend/src/features/weather/components/HourlyStrip.spec.tsx
git commit -m "feat(frontend): add HourlyStrip component with TDD"
```

---

### Task 6: Create ForecastPanel component (TDD)

**Files:**
- Create: `apps/frontend/src/features/weather/components/ForecastPanel.spec.tsx`
- Create: `apps/frontend/src/features/weather/components/ForecastPanel.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/frontend/src/features/weather/components/ForecastPanel.spec.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ForecastPanel } from './ForecastPanel';
import { HourlyDto, ForecastDto } from '@parletto/shared';

vi.mock('../hooks/useHourlyForecast');
vi.mock('../hooks/useForecast');

import { useHourlyForecast } from '../hooks/useHourlyForecast';
import { useForecast } from '../hooks/useForecast';

const mockHourlySlot: HourlyDto = {
  time: '2026-01-01T00:00:00.000Z',
  temperature: 70,
  feelsLike: 68,
  condition: 'clear sky',
  conditionIcon: '01d',
  humidity: 50,
  windSpeed: 10,
  windDeg: 180,
  pop: 0,
};

const mockForecastDay: ForecastDto = {
  date: '2026-01-01',
  high: 75,
  low: 60,
  condition: 'sunny',
  conditionIcon: '01d',
};

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('ForecastPanel', () => {
  beforeEach(() => {
    vi.mocked(useHourlyForecast).mockReturnValue({
      data: [mockHourlySlot],
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useForecast).mockReturnValue({
      data: [mockForecastDay],
      isLoading: false,
      isError: false,
    } as any);
  });

  it('renders both tab buttons', () => {
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    expect(screen.getByRole('button', { name: '3-Hour' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5-Day' })).toBeInTheDocument();
  });

  it('defaults to the 3-Hour tab', () => {
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    expect(screen.getByRole('button', { name: '3-Hour' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '5-Day' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows HourlyStrip content when 3-Hour tab is active', () => {
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    expect(screen.getByText(/clear sky/i)).toBeInTheDocument();
  });

  it('switches to 5-Day tab when clicked and shows ForecastStrip content', async () => {
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '5-Day' }));
    expect(screen.getByText('5-Day Forecast')).toBeInTheDocument();
  });

  it('shows loading spinner in 3-Hour tab while hourly data loads', () => {
    vi.mocked(useHourlyForecast).mockReturnValue({ data: undefined, isLoading: true, isError: false } as any);
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('shows error message in 3-Hour tab when hourly fetch fails', () => {
    vi.mocked(useHourlyForecast).mockReturnValue({ data: undefined, isLoading: false, isError: true, error: { message: 'Failed' } } as any);
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
nx test frontend -- ForecastPanel.spec.tsx
```

Expected: FAIL — `Cannot find module './ForecastPanel'`

- [ ] **Step 3: Implement ForecastPanel**

```tsx
// apps/frontend/src/features/weather/components/ForecastPanel.tsx
import { useState } from 'react';
import { Units } from '@parletto/shared';
import { useHourlyForecast } from '../hooks/useHourlyForecast';
import { useForecast } from '../hooks/useForecast';
import { HourlyStrip } from './HourlyStrip';
import { ForecastStrip } from './ForecastStrip';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';

type Tab = '3h' | '5d';

interface ForecastPanelProps {
  location: string;
  units: Units;
}

export function ForecastPanel({ location, units }: ForecastPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('3h');
  const hourly = useHourlyForecast(location, units);
  const forecast = useForecast(location, units);

  const tabClass = (tab: Tab) =>
    `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
      activeTab === tab
        ? 'bg-blue-500 text-white'
        : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
    }`;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="mb-4 flex gap-2">
        <button
          className={tabClass('3h')}
          onClick={() => setActiveTab('3h')}
          aria-pressed={activeTab === '3h'}
        >
          3-Hour
        </button>
        <button
          className={tabClass('5d')}
          onClick={() => setActiveTab('5d')}
          aria-pressed={activeTab === '5d'}
        >
          5-Day
        </button>
      </div>

      {activeTab === '3h' && (
        <>
          {hourly.isLoading && <LoadingSpinner />}
          {hourly.isError && <ErrorMessage message={hourly.error?.message ?? 'Failed to load hourly forecast'} />}
          {hourly.data && <HourlyStrip data={hourly.data} units={units} />}
        </>
      )}

      {activeTab === '5d' && (
        <>
          {forecast.isLoading && <LoadingSpinner />}
          {forecast.isError && <ErrorMessage message={forecast.error?.message ?? 'Failed to load forecast'} />}
          {forecast.data && <ForecastStrip data={forecast.data} units={units} />}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
nx test frontend -- ForecastPanel.spec.tsx
```

Expected: all 6 ForecastPanel tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/weather/components/ForecastPanel.tsx apps/frontend/src/features/weather/components/ForecastPanel.spec.tsx
git commit -m "feat(frontend): add ForecastPanel with tab switching"
```

---

### Task 7: Wire up MainPanel + update barrel exports

**Files:**
- Modify: `apps/frontend/src/app/layout/MainPanel.tsx`
- Modify: `apps/frontend/src/features/weather/index.ts`

- [ ] **Step 1: Update MainPanel**

Open `apps/frontend/src/app/layout/MainPanel.tsx`. Make these changes:

1. Remove: `import { ForecastStrip, useCurrentWeather, useForecast } from '../../features/weather';`
2. Add: `import { ForecastPanel, useCurrentWeather } from '../../features/weather';`
3. Remove the `useForecast` call and `forecast` variable.
4. Remove `forecast.isLoading`, `forecast.isError` checks.
5. Replace `<ForecastStrip data={forecast.data} units={units} />` with `<ForecastPanel location={location} units={units} />`.

The result (showing the relevant section):
```tsx
import { ForecastPanel, useCurrentWeather } from '../../features/weather';

// ... inside component:
const weather = useCurrentWeather(location, units);
// (no useForecast call)

// ... in JSX (where ForecastStrip was):
{location && <ForecastPanel location={location} units={units} />}
```

- [ ] **Step 2: Update barrel exports**

Open `apps/frontend/src/features/weather/index.ts`. Replace its contents:

```typescript
export { CurrentWeather } from './components/CurrentWeather';
export { ForecastPanel } from './components/ForecastPanel';
export { useCurrentWeather } from './hooks/useCurrentWeather';
export { useForecast } from './hooks/useForecast';
export { useHourlyForecast } from './hooks/useHourlyForecast';
```

(ForecastStrip is removed from public API — it's now internal to ForecastPanel.)

- [ ] **Step 3: Run the full frontend test suite**

```bash
nx test frontend
```

Expected: all frontend tests PASS (no references to removed exports should be in tests — ForecastStrip is still used internally by ForecastPanel)

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p apps/frontend/tsconfig.json
```

Expected: no output (success).

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/layout/MainPanel.tsx apps/frontend/src/features/weather/index.ts
git commit -m "feat(frontend): wire ForecastPanel into MainPanel, update barrel exports"
```

---

### Task 8: E2E tests

**Files:**
- Modify: `e2e/tests/weather.spec.ts`

- [ ] **Step 1: Add tab interaction tests**

Open `e2e/tests/weather.spec.ts`. Add these 4 tests inside the existing `test.describe('Weather App')` block:

```typescript
test('3-Hour and 5-Day tab buttons are visible after search', async ({ page }) => {
  await page.fill('input[placeholder*="Search"]', 'Austin, TX');
  await page.press('input[placeholder*="Search"]', 'Enter');
  await expect(page.getByText(/Austin/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: '3-Hour' })).toBeVisible();
  await expect(page.getByRole('button', { name: '5-Day' })).toBeVisible();
});

test('3-Hour tab is active by default after search', async ({ page }) => {
  await page.fill('input[placeholder*="Search"]', 'Austin, TX');
  await page.press('input[placeholder*="Search"]', 'Enter');
  await expect(page.getByText(/Austin/i)).toBeVisible({ timeout: 10_000 });
  const threeHourBtn = page.getByRole('button', { name: '3-Hour' });
  await expect(threeHourBtn).toHaveAttribute('aria-pressed', 'true');
});

test('clicking 5-Day tab switches to daily forecast view', async ({ page }) => {
  await page.fill('input[placeholder*="Search"]', 'Austin, TX');
  await page.press('input[placeholder*="Search"]', 'Enter');
  await expect(page.getByText(/Austin/i)).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: '5-Day' }).click();
  await expect(page.getByText('5-Day Forecast')).toBeVisible({ timeout: 5_000 });
});

test('clicking back to 3-Hour tab switches view', async ({ page }) => {
  await page.fill('input[placeholder*="Search"]', 'Austin, TX');
  await page.press('input[placeholder*="Search"]', 'Enter');
  await expect(page.getByText(/Austin/i)).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: '5-Day' }).click();
  await expect(page.getByText('5-Day Forecast')).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: '3-Hour' }).click();
  const threeHourBtn = page.getByRole('button', { name: '3-Hour' });
  await expect(threeHourBtn).toHaveAttribute('aria-pressed', 'true');
});
```

- [ ] **Step 2: Run unit tests one final time**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/weather.spec.ts
git commit -m "test(e2e): add forecast tab interaction tests"
```

- [ ] **Step 4: Run E2E tests (requires Docker stack)**

```bash
docker compose up --build -d
cd e2e && npx playwright test
```

Expected: all Playwright tests PASS including the 4 new tab tests.

---

## Self-Review

**Spec coverage:**
- HourlyDto shared type → Task 1 ✓
- Mapper extension (`feels_like`, `deg`, `pop`) → Task 2 ✓
- `toHourlyDtos()` mapper method → Task 2 ✓
- `getHourlyForecast$()` service method + cache → Task 3 ✓
- `GET /api/forecast/hourly` endpoint → Task 3 ✓
- Frontend service `getHourlyForecast$()` → Task 4 ✓
- `useHourlyForecast` hook → Task 4 ✓
- `HourlyStrip` component (first 8 slots, all fields) → Task 5 ✓
- `ForecastPanel` with tab state → Task 6 ✓
- `ForecastPanel` loading/error per tab → Task 6 ✓
- `MainPanel` refactor → Task 7 ✓
- Barrel export update → Task 7 ✓
- E2E tab tests → Task 8 ✓

**Type consistency check:**
- `HourlyDto` defined in Task 1 with exact fields used in Tasks 2, 4, 5, 6 ✓
- `toHourlyDtos()` method name consistent across mapper, service, controller ✓
- `getHourlyForecast$()` name consistent across backend service, frontend service ✓
- `useHourlyForecast` name consistent across hook file, ForecastPanel, barrel ✓
- `ForecastPanel` exported in barrel (Task 7) and consumed in MainPanel (Task 7) ✓
- `aria-pressed` attribute on tab buttons matches E2E assertions ✓
- `aria-label="Loading"` on LoadingSpinner inner div matches spec test assertion ✓
