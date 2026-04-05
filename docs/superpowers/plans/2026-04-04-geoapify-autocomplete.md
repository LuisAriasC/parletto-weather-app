# GeoApify Autocomplete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GeoApify-powered autocomplete dropdown to the search input so users can pick a location by name and weather is fetched by precise coordinates.

**Architecture:** GeoApify calls are proxied through the NestJS BFF (consistent with the OpenWeather BFF pattern) via a new `GET /api/geocode?q=...` endpoint. The frontend `AutocompleteInput` component debounces user input and renders a dropdown; on selection it passes `{ label, query: "lat,lon" }` up to `SearchBar` → `Sidebar`. The `searchSlice` is updated to store `{ label, query }` objects so recents display human-readable names while searching by coordinates.

**Tech Stack:** NestJS + `@nestjs/axios` (backend), React 19 + React Query + Tailwind v4 (frontend), Vitest + Testing Library + Playwright (tests).

---

## File Map

### New files
- `libs/shared/src/types/geocode.dto.ts` — `GeocodeSuggestionDto` interface
- `apps/backend/src/geocode/geocode.service.ts` — proxies GeoApify, returns `GeocodeSuggestionDto[]`
- `apps/backend/src/geocode/geocode.service.spec.ts` — unit tests
- `apps/backend/src/geocode/geocode.controller.ts` — `GET /api/geocode?q=...`
- `apps/backend/src/geocode/geocode.controller.spec.ts` — unit tests
- `apps/backend/src/geocode/geocode.module.ts` — NestJS module
- `apps/backend/src/geocode/dto/get-geocode.query.ts` — validated query DTO
- `apps/frontend/src/features/search/services/geocode.service.ts` — axios wrapper returning Observable
- `apps/frontend/src/features/search/hooks/useGeocodeSuggestions.ts` — React Query hook
- `apps/frontend/src/features/search/components/AutocompleteInput.tsx` — input + dropdown + keyboard nav
- `apps/frontend/src/features/search/components/AutocompleteInput.spec.tsx` — unit tests
- `apps/frontend/src/features/search/components/RecentLocations.spec.tsx` — new spec for updated component

### Modified files
- `libs/shared/src/index.ts` — export `GeocodeSuggestionDto`
- `apps/backend/src/config/configuration.ts` — add `geoapify.apiKey`
- `apps/backend/src/config/app-config.service.ts` — add `geoapifyApiKey` getter
- `apps/backend/src/app/app.module.ts` — import `GeocodeModule`
- `.env.example` — add `GEOAPIFY_API_KEY`
- `.env` — add `GEOAPIFY_API_KEY`
- `apps/frontend/src/features/search/store/searchSlice.ts` — `recents: RecentSearch[]` (was `string[]`)
- `apps/frontend/src/features/search/store/searchSlice.spec.ts` — updated tests
- `apps/frontend/src/features/search/components/RecentLocations.tsx` — uses `RecentSearch` objects
- `apps/frontend/src/features/search/components/SearchBar.tsx` — composes `AutocompleteInput`
- `apps/frontend/src/features/search/components/SearchBar.spec.tsx` — updated tests
- `apps/frontend/src/features/search/index.ts` — export `RecentSearch` type, `useGeocodeSuggestions`
- `apps/frontend/src/app/layout/Sidebar.tsx` — updated `handleSelect` signature
- `e2e/tests/weather.spec.ts` — add 4 autocomplete E2E tests

---

## Task 1: Add `GeocodeSuggestionDto` to shared lib

**Files:**
- Create: `libs/shared/src/types/geocode.dto.ts`
- Modify: `libs/shared/src/index.ts`

- [ ] **Step 1: Create the DTO file**

```typescript
// libs/shared/src/types/geocode.dto.ts
export interface GeocodeSuggestionDto {
  placeId: string;
  label: string;
  lat: number;
  lon: number;
}
```

- [ ] **Step 2: Export from the shared index**

Replace the contents of `libs/shared/src/index.ts`:
```typescript
export * from './types/units.type';
export * from './types/weather.dto';
export * from './types/forecast.dto';
export * from './types/error.dto';
export * from './types/hourly.dto';
export * from './types/geocode.dto';
```

- [ ] **Step 3: Verify no breakage**

Run: `npm test`
Expected: all tests pass (no new tests yet, just confirming type exports compile)

- [ ] **Step 4: Commit**

```bash
git add libs/shared/src/types/geocode.dto.ts libs/shared/src/index.ts
git commit -m "feat(shared): add GeocodeSuggestionDto interface"
```

---

## Task 2: Extend backend config for GeoApify API key

**Files:**
- Modify: `.env.example`
- Modify: `.env`
- Modify: `apps/backend/src/config/configuration.ts`
- Modify: `apps/backend/src/config/app-config.service.ts`

- [ ] **Step 1: Add key to `.env.example`**

Append to `.env.example`:
```
# GeoApify Geocoding API — get a free key at https://www.geoapify.com/
GEOAPIFY_API_KEY=your_geoapify_api_key_here
```

- [ ] **Step 2: Add key to `.env`**

Append to `.env` (use your real key):
```
GEOAPIFY_API_KEY=your_actual_geoapify_api_key_here
```

- [ ] **Step 3: Extend `AppConfig` and `configuration`**

Replace `apps/backend/src/config/configuration.ts`:
```typescript
export interface AppConfig {
  port: number;
  openWeather: {
    apiKey: string;
    baseUrl: string;
  };
  geoapify: {
    apiKey: string;
  };
  cache: {
    weatherTtlSeconds: number;
    forecastTtlSeconds: number;
  };
}

export const configuration = (): AppConfig => ({
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  openWeather: {
    apiKey: process.env['OPENWEATHER_API_KEY'] ?? '',
    baseUrl:
      process.env['OPENWEATHER_BASE_URL'] ??
      'https://api.openweathermap.org/data/2.5',
  },
  geoapify: {
    apiKey: process.env['GEOAPIFY_API_KEY'] ?? '',
  },
  cache: {
    weatherTtlSeconds: parseInt(
      process.env['WEATHER_CACHE_TTL_SECONDS'] ?? '600',
      10,
    ),
    forecastTtlSeconds: parseInt(
      process.env['FORECAST_CACHE_TTL_SECONDS'] ?? '1800',
      10,
    ),
  },
});
```

- [ ] **Step 4: Add `geoapifyApiKey` getter to `AppConfigService`**

Replace `apps/backend/src/config/app-config.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get apiKey(): string {
    return this.config.getOrThrow<string>('openWeather.apiKey');
  }

  get baseUrl(): string {
    return this.config.getOrThrow<string>('openWeather.baseUrl');
  }

  get weatherTtlMs(): number {
    return this.config.getOrThrow<number>('cache.weatherTtlSeconds') * 1000;
  }

  get forecastTtlMs(): number {
    return this.config.getOrThrow<number>('cache.forecastTtlSeconds') * 1000;
  }

  get geoapifyApiKey(): string {
    return this.config.getOrThrow<string>('geoapify.apiKey');
  }
}
```

- [ ] **Step 5: Run backend tests to verify config compiles**

Run: `nx test backend`
Expected: all 17 tests pass

- [ ] **Step 6: Commit**

```bash
git add .env.example apps/backend/src/config/configuration.ts apps/backend/src/config/app-config.service.ts
git commit -m "feat(backend): add GeoApify API key to config"
```

---

## Task 3: Create `GeocodeService` (TDD)

**Files:**
- Create: `apps/backend/src/geocode/geocode.service.spec.ts`
- Create: `apps/backend/src/geocode/geocode.service.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/backend/src/geocode/geocode.service.spec.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError, lastValueFrom } from 'rxjs';
import { GeocodeService } from './geocode.service';
import { AppConfigService } from '../config/app-config.service';

const mockGeoApifyResponse = {
  features: [
    {
      properties: {
        place_id: 'abc123',
        formatted: 'Austin, Texas, United States',
        lat: 30.2672,
        lon: -97.7431,
      },
    },
    {
      properties: {
        place_id: 'def456',
        formatted: 'Austin, Minnesota, United States',
        lat: 43.6666,
        lon: -92.9746,
      },
    },
  ],
};

describe('GeocodeService', () => {
  let service: GeocodeService;
  let httpService: { get: ReturnType<typeof vi.fn> };
  let appConfig: { geoapifyApiKey: string };

  beforeEach(async () => {
    httpService = { get: vi.fn() };
    appConfig = { geoapifyApiKey: 'test-key' };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodeService,
        { provide: HttpService, useValue: httpService },
        { provide: AppConfigService, useValue: appConfig },
      ],
    }).compile();

    service = module.get(GeocodeService);
  });

  it('calls GeoApify autocomplete URL with text, limit, and apiKey', async () => {
    httpService.get.mockReturnValue(of({ data: mockGeoApifyResponse }));
    await lastValueFrom(service.getSuggestions$('Austin'));
    expect(httpService.get).toHaveBeenCalledWith(
      'https://api.geoapify.com/v1/geocode/autocomplete',
      { params: { text: 'Austin', limit: 5, apiKey: 'test-key' } },
    );
  });

  it('maps GeoApify features to GeocodeSuggestionDto[]', async () => {
    httpService.get.mockReturnValue(of({ data: mockGeoApifyResponse }));
    const result = await lastValueFrom(service.getSuggestions$('Austin'));
    expect(result).toEqual([
      { placeId: 'abc123', label: 'Austin, Texas, United States', lat: 30.2672, lon: -97.7431 },
      { placeId: 'def456', label: 'Austin, Minnesota, United States', lat: 43.6666, lon: -92.9746 },
    ]);
  });

  it('returns empty array when features list is empty', async () => {
    httpService.get.mockReturnValue(of({ data: { features: [] } }));
    const result = await lastValueFrom(service.getSuggestions$('xyz'));
    expect(result).toEqual([]);
  });

  it('returns empty array when HTTP request throws', async () => {
    httpService.get.mockReturnValue(throwError(() => new Error('Network error')));
    const result = await lastValueFrom(service.getSuggestions$('Austin'));
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `nx test backend`
Expected: FAIL — `GeocodeService` not found

- [ ] **Step 3: Implement `GeocodeService`**

Create `apps/backend/src/geocode/geocode.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { GeocodeSuggestionDto } from '@parletto/shared';
import { AppConfigService } from '../config/app-config.service';

interface GeoApifyFeature {
  properties: {
    place_id: string;
    formatted: string;
    lat: number;
    lon: number;
  };
}

interface GeoApifyResponse {
  features: GeoApifyFeature[];
}

@Injectable()
export class GeocodeService {
  private static readonly GEOAPIFY_URL =
    'https://api.geoapify.com/v1/geocode/autocomplete';

  constructor(
    private readonly httpService: HttpService,
    private readonly appConfig: AppConfigService,
  ) {}

  getSuggestions$(query: string): Observable<GeocodeSuggestionDto[]> {
    return this.httpService
      .get<GeoApifyResponse>(GeocodeService.GEOAPIFY_URL, {
        params: { text: query, limit: 5, apiKey: this.appConfig.geoapifyApiKey },
      })
      .pipe(
        map(({ data }) =>
          data.features.map((f) => ({
            placeId: f.properties.place_id,
            label: f.properties.formatted,
            lat: f.properties.lat,
            lon: f.properties.lon,
          })),
        ),
        catchError(() => of([])),
      );
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `nx test backend`
Expected: 4 new tests pass (17 + 4 = 21 total backend tests)

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/geocode/geocode.service.ts apps/backend/src/geocode/geocode.service.spec.ts
git commit -m "feat(backend): add GeocodeService proxying GeoApify autocomplete"
```

---

## Task 4: Create `GeocodeController`, query DTO, `GeocodeModule`, wire into `AppModule` (TDD)

**Files:**
- Create: `apps/backend/src/geocode/dto/get-geocode.query.ts`
- Create: `apps/backend/src/geocode/geocode.controller.spec.ts`
- Create: `apps/backend/src/geocode/geocode.controller.ts`
- Create: `apps/backend/src/geocode/geocode.module.ts`
- Modify: `apps/backend/src/app/app.module.ts`

- [ ] **Step 1: Create the validated query DTO**

Create `apps/backend/src/geocode/dto/get-geocode.query.ts`:
```typescript
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class GetGeocodeQuery {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  q!: string;
}
```

- [ ] **Step 2: Write the failing controller test**

Create `apps/backend/src/geocode/geocode.controller.spec.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { of, lastValueFrom } from 'rxjs';
import { GeocodeController } from './geocode.controller';
import { GeocodeService } from './geocode.service';
import { GeocodeSuggestionDto } from '@parletto/shared';

const mockSuggestions: GeocodeSuggestionDto[] = [
  { placeId: 'abc123', label: 'Austin, Texas, United States', lat: 30.2672, lon: -97.7431 },
];

describe('GeocodeController', () => {
  let controller: GeocodeController;
  let service: { getSuggestions$: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = { getSuggestions$: vi.fn().mockReturnValue(of(mockSuggestions)) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeocodeController],
      providers: [{ provide: GeocodeService, useValue: service }],
    }).compile();

    controller = module.get(GeocodeController);
  });

  it('calls getSuggestions$ with q and returns the observable result', async () => {
    const result = await lastValueFrom(controller.getSuggestions({ q: 'Austin' }));
    expect(service.getSuggestions$).toHaveBeenCalledWith('Austin');
    expect(result).toEqual(mockSuggestions);
  });
});
```

- [ ] **Step 3: Run test to confirm it fails**

Run: `nx test backend`
Expected: FAIL — `GeocodeController` not found

- [ ] **Step 4: Implement `GeocodeController`**

Create `apps/backend/src/geocode/geocode.controller.ts`:
```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { GeocodeSuggestionDto } from '@parletto/shared';
import { GeocodeService } from './geocode.service';
import { GetGeocodeQuery } from './dto/get-geocode.query';

@Controller()
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get('geocode')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  getSuggestions(@Query() query: GetGeocodeQuery): Observable<GeocodeSuggestionDto[]> {
    return this.geocodeService.getSuggestions$(query.q);
  }
}
```

- [ ] **Step 5: Create `GeocodeModule`**

Create `apps/backend/src/geocode/geocode.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeocodeController } from './geocode.controller';
import { GeocodeService } from './geocode.service';
import { AppConfigService } from '../config/app-config.service';

@Module({
  imports: [HttpModule],
  controllers: [GeocodeController],
  providers: [GeocodeService, AppConfigService],
})
export class GeocodeModule {}
```

- [ ] **Step 6: Wire `GeocodeModule` into `AppModule`**

Replace `apps/backend/src/app/app.module.ts`:
```typescript
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { configuration } from '../config/configuration';
import { AppConfigService } from '../config/app-config.service';
import { WeatherModule } from '../weather/weather.module';
import { GeocodeModule } from '../geocode/geocode.module';
import { HealthController } from '../health/health.controller';
import { RequestIdMiddleware } from '../common/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    CacheModule.register({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    WeatherModule,
    GeocodeModule,
  ],
  controllers: [HealthController],
  providers: [
    AppConfigService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
```

- [ ] **Step 7: Run all backend tests**

Run: `nx test backend`
Expected: all tests pass (21 + 1 = 22 total)

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/geocode/ apps/backend/src/app/app.module.ts
git commit -m "feat(backend): add GeocodeController and GeocodeModule for GET /api/geocode"
```

---

## Task 5: Add frontend geocode service and `useGeocodeSuggestions` hook

**Files:**
- Create: `apps/frontend/src/features/search/services/geocode.service.ts`
- Create: `apps/frontend/src/features/search/hooks/useGeocodeSuggestions.ts`

No TDD here — the service is a thin axios wrapper (integration-tested via E2E) and the hook is tested indirectly through `AutocompleteInput` specs. This follows the same pattern as `useHourlyForecast`, which has no dedicated spec.

- [ ] **Step 1: Create the frontend geocode service**

Create `apps/frontend/src/features/search/services/geocode.service.ts`:
```typescript
import axios from 'axios';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GeocodeSuggestionDto } from '@parletto/shared';

const API_BASE = import.meta.env['VITE_API_BASE_URL'] ?? '/api';

export const geocodeService = {
  getSuggestions$(query: string): Observable<GeocodeSuggestionDto[]> {
    return from(
      axios.get<GeocodeSuggestionDto[]>(`${API_BASE}/geocode`, {
        params: { q: query },
      }),
    ).pipe(map((response) => response.data));
  },
};
```

- [ ] **Step 2: Create the React Query hook**

Create `apps/frontend/src/features/search/hooks/useGeocodeSuggestions.ts`:
```typescript
import { lastValueFrom } from 'rxjs';
import { useQuery } from '@tanstack/react-query';
import { GeocodeSuggestionDto, ErrorDto } from '@parletto/shared';
import { geocodeService } from '../services/geocode.service';

export function useGeocodeSuggestions(query: string) {
  return useQuery<GeocodeSuggestionDto[], ErrorDto>({
    queryKey: ['geocode', query],
    queryFn: () => lastValueFrom(geocodeService.getSuggestions$(query)),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });
}
```

- [ ] **Step 3: Run frontend tests to verify no breakage**

Run: `nx test frontend`
Expected: all existing tests pass (no new tests yet)

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/features/search/services/geocode.service.ts apps/frontend/src/features/search/hooks/useGeocodeSuggestions.ts
git commit -m "feat(frontend): add geocodeService and useGeocodeSuggestions hook"
```

---

## Task 6: Update `searchSlice` to store `{ label, query }` objects (TDD)

**Files:**
- Modify: `apps/frontend/src/features/search/store/searchSlice.spec.ts`
- Modify: `apps/frontend/src/features/search/store/searchSlice.ts`

- [ ] **Step 1: Rewrite the failing tests**

Replace `apps/frontend/src/features/search/store/searchSlice.spec.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import searchReducer, { addSearch, clearSearch } from './searchSlice';

describe('searchSlice', () => {
  it('has empty array as initial state', () => {
    expect(searchReducer(undefined, { type: '@@INIT' })).toEqual({ recents: [] });
  });

  it('adds a new { label, query } search to the front', () => {
    const state = searchReducer(
      { recents: [] },
      addSearch({ label: 'Austin, Texas, United States', query: '30.2672,-97.7431' }),
    );
    expect(state.recents[0]).toEqual({ label: 'Austin, Texas, United States', query: '30.2672,-97.7431' });
  });

  it('deduplicates by query — moves existing entry to front', () => {
    const initial = {
      recents: [
        { label: 'Austin, Texas, United States', query: '30.2672,-97.7431' },
        { label: 'New York City, New York, United States', query: '40.7128,-74.0060' },
      ],
    };
    const state = searchReducer(
      initial,
      addSearch({ label: 'New York City, New York, United States', query: '40.7128,-74.0060' }),
    );
    expect(state.recents).toEqual([
      { label: 'New York City, New York, United States', query: '40.7128,-74.0060' },
      { label: 'Austin, Texas, United States', query: '30.2672,-97.7431' },
    ]);
  });

  it('caps history at 5 entries', () => {
    const initial = {
      recents: [
        { label: 'a', query: 'qa' },
        { label: 'b', query: 'qb' },
        { label: 'c', query: 'qc' },
        { label: 'd', query: 'qd' },
        { label: 'e', query: 'qe' },
      ],
    };
    const state = searchReducer(initial, addSearch({ label: 'f', query: 'qf' }));
    expect(state.recents).toHaveLength(5);
    expect(state.recents[0]).toEqual({ label: 'f', query: 'qf' });
  });

  it('clears all recents', () => {
    const state = searchReducer(
      { recents: [{ label: 'Austin', query: '30.2672,-97.7431' }] },
      clearSearch(),
    );
    expect(state.recents).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `nx test frontend`
Expected: FAIL — type mismatch (recents is still `string[]`)

- [ ] **Step 3: Update the slice**

Replace `apps/frontend/src/features/search/store/searchSlice.ts`:
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RecentSearch {
  label: string;
  query: string;
}

interface SearchState {
  recents: RecentSearch[];
}

const saved = typeof window !== 'undefined'
  ? (JSON.parse(localStorage.getItem('recents') ?? '[]') as RecentSearch[])
  : [];

const searchSlice = createSlice({
  name: 'search',
  initialState: { recents: saved } as SearchState,
  reducers: {
    addSearch: (state, action: PayloadAction<RecentSearch>) => {
      const filtered = state.recents.filter((r) => r.query !== action.payload.query);
      state.recents = [action.payload, ...filtered].slice(0, 5);
    },
    clearSearch: (state) => {
      state.recents = [];
    },
  },
});

export const { addSearch, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `nx test frontend`
Expected: the 5 slice tests pass (other tests may fail due to type changes — that's fine, they'll be fixed in later tasks)

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/search/store/searchSlice.ts apps/frontend/src/features/search/store/searchSlice.spec.ts
git commit -m "feat(frontend): update searchSlice to store RecentSearch { label, query } objects"
```

---

## Task 7: Update `RecentLocations` to use `RecentSearch` objects (TDD)

**Files:**
- Create: `apps/frontend/src/features/search/components/RecentLocations.spec.tsx`
- Modify: `apps/frontend/src/features/search/components/RecentLocations.tsx`

- [ ] **Step 1: Write the failing tests**

Create `apps/frontend/src/features/search/components/RecentLocations.spec.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecentLocations } from './RecentLocations';

const recents = [
  { label: 'Austin, Texas, United States', query: '30.2672,-97.7431' },
  { label: 'New York City, New York, United States', query: '40.7128,-74.0060' },
];

describe('RecentLocations', () => {
  it('renders nothing when recents is empty', () => {
    const { container } = render(<RecentLocations recents={[]} onSelect={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a button with the label text for each recent', () => {
    render(<RecentLocations recents={recents} onSelect={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Austin, Texas, United States' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New York City, New York, United States' }),
    ).toBeInTheDocument();
  });

  it('calls onSelect with the full RecentSearch item (not just label) when clicked', async () => {
    const onSelect = vi.fn();
    render(<RecentLocations recents={recents} onSelect={onSelect} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Austin, Texas, United States' }),
    );
    expect(onSelect).toHaveBeenCalledWith({
      label: 'Austin, Texas, United States',
      query: '30.2672,-97.7431',
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `nx test frontend`
Expected: FAIL — `RecentLocations` still uses `string[]`

- [ ] **Step 3: Update `RecentLocations`**

Replace `apps/frontend/src/features/search/components/RecentLocations.tsx`:
```typescript
import { RecentSearch } from '../store/searchSlice';

interface RecentLocationsProps {
  recents: RecentSearch[];
  onSelect: (item: RecentSearch) => void;
}

export function RecentLocations({ recents, onSelect }: RecentLocationsProps) {
  if (recents.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        Recent
      </p>
      <ul className="space-y-1">
        {recents.map((item) => (
          <li key={item.query}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="w-full rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `nx test frontend`
Expected: the 3 `RecentLocations` tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/search/components/RecentLocations.tsx apps/frontend/src/features/search/components/RecentLocations.spec.tsx
git commit -m "feat(frontend): update RecentLocations to render RecentSearch label and call onSelect with full item"
```

---

## Task 8: Create `AutocompleteInput` component (TDD)

**Files:**
- Create: `apps/frontend/src/features/search/components/AutocompleteInput.spec.tsx`
- Create: `apps/frontend/src/features/search/components/AutocompleteInput.tsx`

- [ ] **Step 1: Write the failing tests**

Create `apps/frontend/src/features/search/components/AutocompleteInput.spec.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AutocompleteInput } from './AutocompleteInput';

vi.mock('../hooks/useGeocodeSuggestions');
import { useGeocodeSuggestions } from '../hooks/useGeocodeSuggestions';

const mockSuggestions = [
  { placeId: 'abc123', label: 'Austin, Texas, United States', lat: 30.2672, lon: -97.7431 },
  { placeId: 'def456', label: 'Austin, Minnesota, United States', lat: 43.6666, lon: -92.9746 },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('AutocompleteInput', () => {
  beforeEach(() => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);
  });

  it('renders the input with the given placeholder', () => {
    render(<AutocompleteInput onSelect={vi.fn()} placeholder="Search city..." />, { wrapper });
    expect(screen.getByPlaceholderText('Search city...')).toBeInTheDocument();
  });

  it('does not show dropdown when suggestions list is empty', () => {
    render(<AutocompleteInput onSelect={vi.fn()} placeholder="Search city..." />, { wrapper });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows dropdown with suggestions when hook returns data and input is focused', async () => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: mockSuggestions } as any);
    render(<AutocompleteInput onSelect={vi.fn()} placeholder="Search city..." />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText('Search city...'));
    await userEvent.type(screen.getByPlaceholderText('Search city...'), 'Aus');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Austin, Texas, United States')).toBeInTheDocument();
    expect(screen.getByText('Austin, Minnesota, United States')).toBeInTheDocument();
  });

  it('calls onSelect with label and "lat,lon" query when a suggestion is clicked', async () => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: mockSuggestions } as any);
    const onSelect = vi.fn();
    render(<AutocompleteInput onSelect={onSelect} placeholder="Search city..." />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText('Search city...'));
    await userEvent.type(screen.getByPlaceholderText('Search city...'), 'Aus');
    await userEvent.click(screen.getByText('Austin, Texas, United States'));
    expect(onSelect).toHaveBeenCalledWith({
      label: 'Austin, Texas, United States',
      query: '30.2672,-97.7431',
    });
  });

  it('pressing Escape closes the dropdown without calling onSelect', async () => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: mockSuggestions } as any);
    const onSelect = vi.fn();
    render(<AutocompleteInput onSelect={onSelect} placeholder="Search city..." />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText('Search city...'));
    await userEvent.type(screen.getByPlaceholderText('Search city...'), 'Aus');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('ArrowDown + Enter selects the highlighted suggestion', async () => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: mockSuggestions } as any);
    const onSelect = vi.fn();
    render(<AutocompleteInput onSelect={onSelect} placeholder="Search city..." />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText('Search city...'));
    await userEvent.type(screen.getByPlaceholderText('Search city...'), 'Aus');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith({
      label: 'Austin, Texas, United States',
      query: '30.2672,-97.7431',
    });
  });

  it('pressing Enter without navigating calls onSelect with free-text label and query', async () => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: mockSuggestions } as any);
    const onSelect = vi.fn();
    render(<AutocompleteInput onSelect={onSelect} placeholder="Search city..." />, { wrapper });
    const input = screen.getByPlaceholderText('Search city...');
    await userEvent.type(input, 'Austin');
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith({ label: 'Austin', query: 'Austin' });
  });

  it('pressing Enter on empty input calls onSelect with empty label and query', async () => {
    const onSelect = vi.fn();
    render(<AutocompleteInput onSelect={onSelect} placeholder="Search city..." />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText('Search city...'));
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith({ label: '', query: '' });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `nx test frontend`
Expected: FAIL — `AutocompleteInput` not found

- [ ] **Step 3: Implement `AutocompleteInput`**

Create `apps/frontend/src/features/search/components/AutocompleteInput.tsx`:
```typescript
import { useState, useEffect } from 'react';
import { GeocodeSuggestionDto } from '@parletto/shared';
import { useGeocodeSuggestions } from '../hooks/useGeocodeSuggestions';

export interface AutocompleteSelection {
  label: string;
  query: string;
}

interface AutocompleteInputProps {
  onSelect: (selection: AutocompleteSelection) => void;
  placeholder?: string;
}

export function AutocompleteInput({ onSelect, placeholder }: AutocompleteInputProps) {
  const [value, setValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(value), 300);
    return () => clearTimeout(t);
  }, [value]);

  const { data: suggestions = [] } = useGeocodeSuggestions(debouncedQuery);
  const showDropdown = open && suggestions.length > 0;

  function selectSuggestion(s: GeocodeSuggestionDto) {
    setValue(s.label);
    setOpen(false);
    setHighlightedIndex(-1);
    onSelect({ label: s.label, query: `${s.lat},${s.lon}` });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && highlightedIndex >= 0) {
        selectSuggestion(suggestions[highlightedIndex]);
      } else {
        setOpen(false);
        onSelect({ label: value, query: value });
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlightedIndex(-1);
    }
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setHighlightedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
      />
      {showDropdown && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              role="option"
              aria-selected={i === highlightedIndex}
              onMouseDown={() => selectSuggestion(s)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === highlightedIndex
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

Note: `onMouseDown` is used (not `onClick`) on list items so the click registers before the input's `onBlur` fires. The `onBlur` uses a 150ms delay to allow `onMouseDown` to execute first.

- [ ] **Step 4: Run tests to confirm they pass**

Run: `nx test frontend`
Expected: all 8 `AutocompleteInput` tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/search/components/AutocompleteInput.tsx apps/frontend/src/features/search/components/AutocompleteInput.spec.tsx
git commit -m "feat(frontend): add AutocompleteInput component with GeoApify dropdown and keyboard nav"
```

---

## Task 9: Update `SearchBar` to compose `AutocompleteInput` (TDD)

**Files:**
- Modify: `apps/frontend/src/features/search/components/SearchBar.spec.tsx`
- Modify: `apps/frontend/src/features/search/components/SearchBar.tsx`

- [ ] **Step 1: Rewrite the failing tests**

Replace `apps/frontend/src/features/search/components/SearchBar.spec.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchBar } from './SearchBar';

vi.mock('../hooks/useGeocodeSuggestions');
import { useGeocodeSuggestions } from '../hooks/useGeocodeSuggestions';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('SearchBar', () => {
  beforeEach(() => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: [] } as any);
  });

  it('renders the search input', () => {
    render(<SearchBar onSearch={vi.fn()} />, { wrapper });
    expect(screen.getByPlaceholderText(/search city/i)).toBeInTheDocument();
  });

  it('calls onSearch with { label, query } when Enter is pressed with text', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText(/search city/i));
    await userEvent.type(screen.getByPlaceholderText(/search city/i), 'Austin, TX');
    await userEvent.keyboard('{Enter}');
    expect(onSearch).toHaveBeenCalledWith({ label: 'Austin, TX', query: 'Austin, TX' });
  });

  it('does not call onSearch when input is empty', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText(/search city/i));
    await userEvent.keyboard('{Enter}');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('shows validation message when submitted empty', async () => {
    render(<SearchBar onSearch={vi.fn()} />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText(/search city/i));
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText(/please enter a city/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `nx test frontend`
Expected: FAIL — `SearchBar` still uses old form/input pattern

- [ ] **Step 3: Update `SearchBar`**

Replace `apps/frontend/src/features/search/components/SearchBar.tsx`:
```typescript
import { useState } from 'react';
import { AutocompleteInput, AutocompleteSelection } from './AutocompleteInput';

interface SearchBarProps {
  onSearch: (selection: AutocompleteSelection) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [error, setError] = useState('');

  function handleSelect(sel: AutocompleteSelection) {
    if (!sel.label.trim()) {
      setError('Please enter a city name.');
      return;
    }
    setError('');
    onSearch(sel);
  }

  return (
    <div className="w-full">
      <AutocompleteInput onSelect={handleSelect} placeholder="Search city or zip..." />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `nx test frontend`
Expected: all 4 `SearchBar` tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/search/components/SearchBar.tsx apps/frontend/src/features/search/components/SearchBar.spec.tsx
git commit -m "feat(frontend): update SearchBar to compose AutocompleteInput"
```

---

## Task 10: Update `Sidebar` and barrel exports

**Files:**
- Modify: `apps/frontend/src/app/layout/Sidebar.tsx`
- Modify: `apps/frontend/src/features/search/index.ts`

- [ ] **Step 1: Update `Sidebar`**

Replace `apps/frontend/src/app/layout/Sidebar.tsx`:
```typescript
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { SearchBar, RecentLocations, addSearch } from '../../features/search';
import { RecentSearch } from '../../features/search/store/searchSlice';
import { AutocompleteSelection } from '../../features/search/components/AutocompleteInput';

interface SidebarProps {
  onLocationSelect: (location: string) => void;
}

export function Sidebar({ onLocationSelect }: SidebarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const recents = useSelector((s: RootState) => s.search.recents);

  function handleSelect({ label, query }: AutocompleteSelection | RecentSearch) {
    dispatch(addSearch({ label, query }));
    onLocationSelect(query);
  }

  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <SearchBar onSearch={handleSelect} />
      <RecentLocations recents={recents} onSelect={handleSelect} />
    </aside>
  );
}
```

- [ ] **Step 2: Update the barrel exports**

Replace `apps/frontend/src/features/search/index.ts`:
```typescript
export { SearchBar } from './components/SearchBar';
export { RecentLocations } from './components/RecentLocations';
export { addSearch, clearSearch } from './store/searchSlice';
export { default as searchReducer } from './store/searchSlice';
export type { RecentSearch } from './store/searchSlice';
export { useGeocodeSuggestions } from './hooks/useGeocodeSuggestions';
```

- [ ] **Step 3: Run all frontend tests**

Run: `nx test frontend`
Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/layout/Sidebar.tsx apps/frontend/src/features/search/index.ts
git commit -m "feat(frontend): wire Sidebar to handle RecentSearch and AutocompleteSelection uniformly"
```

---

## Task 11: E2E tests

**Files:**
- Modify: `e2e/tests/weather.spec.ts`

These tests require the full Docker stack running with a valid `GEOAPIFY_API_KEY` in `.env`.

- [ ] **Step 1: Add autocomplete E2E tests**

Append the following tests inside the existing `test.describe('Weather App', ...)` block in `e2e/tests/weather.spec.ts`:

```typescript
  test('typing 3 characters shows autocomplete dropdown', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Aus');
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 });
  });

  test('selecting autocomplete suggestion loads weather card', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Aus');
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('option').first().click();
    await expect(page.getByText(/°F|°C/)).toBeVisible({ timeout: 10_000 });
  });

  test('selected autocomplete location appears in recents with human-readable label', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 });
    const firstOption = page.getByRole('option').first();
    const labelText = await firstOption.textContent();
    await firstOption.click();
    await expect(page.getByText(/°F|°C/)).toBeVisible({ timeout: 10_000 });
    // Recents button shows human-readable name, not coordinates
    await expect(page.getByRole('button', { name: labelText! })).toBeVisible();
    expect(labelText).not.toMatch(/^-?\d+\.?\d*,-?\d+\.?\d*$/);
  });

  test('pressing Escape closes dropdown without triggering a search', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Aus');
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 });
    await page.press('input[placeholder*="Search"]', 'Escape');
    await expect(page.getByRole('listbox')).not.toBeVisible();
    await expect(page.getByText(/°F|°C/)).not.toBeVisible();
  });
```

- [ ] **Step 2: Start the Docker stack**

```bash
docker compose up --build
```

Expected: stack starts, frontend at http://localhost

- [ ] **Step 3: Run all E2E tests**

```bash
cd e2e
npx playwright test
```

Expected: all tests pass (existing 11 + 4 new = 15 total)

- [ ] **Step 4: Stop Docker and commit**

```bash
docker compose down

git add e2e/tests/weather.spec.ts
git commit -m "test(e2e): add Playwright tests for GeoApify autocomplete dropdown"
```

---

## Self-Review

**Spec coverage:**
- ✅ `GeocodeSuggestionDto` shared type — Task 1
- ✅ `.env.example` / `.env` with `GEOAPIFY_API_KEY` — Task 2
- ✅ Backend config extension (`geoapify.apiKey`) — Task 2
- ✅ `GeocodeService` proxies GeoApify, returns empty on error — Task 3
- ✅ `GET /api/geocode?q=...` endpoint, throttled — Task 4
- ✅ `GeocodeModule` imported into `AppModule` — Task 4
- ✅ Frontend geocode service (axios Observable) — Task 5
- ✅ `useGeocodeSuggestions` hook (enabled ≥ 2 chars, retry: 0, staleTime 5m) — Task 5
- ✅ `searchSlice` stores `{ label, query }[]`, dedupes by `query` — Task 6
- ✅ `RecentLocations` renders `label`, calls `onSelect` with full item — Task 7
- ✅ `AutocompleteInput` — dropdown, keyboard nav, onMouseDown, Esc, free-text fallback — Task 8
- ✅ `SearchBar` validates empty, composes `AutocompleteInput` — Task 9
- ✅ `Sidebar` dispatches `{ label, query }`, passes `query` to weather fetch — Task 10
- ✅ E2E: dropdown shows, click triggers weather, label in recents, Esc closes — Task 11

**Type consistency:**
- `AutocompleteSelection = { label: string; query: string }` — defined in Task 8, used in Tasks 9, 10
- `RecentSearch = { label: string; query: string }` — defined in Task 6, used in Tasks 7, 10
- Both have the same shape so `handleSelect` in Sidebar accepts either
- `GeocodeSuggestionDto` — defined in Task 1, used throughout Tasks 3–8
