# Weather App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality full-stack weather app with an Nx monorepo, NestJS BFF proxy, React/Vite frontend, RxJS end-to-end, and Docker Compose serving the frontend via nginx on port 80.

**Architecture:** NestJS proxies all OpenWeather API calls so the API key never reaches the browser. The frontend uses Redux Toolkit for client state and React Query (via RxJS Observables converted with `lastValueFrom`) for server state. nginx serves the production-built frontend and proxies `/api/*` to the NestJS container — one origin, no CORS.

**Tech Stack:** Nx monorepo · NestJS + `@nestjs/axios` · React 18 + Vite · TypeScript · RxJS · Redux Toolkit · React Query · Tailwind CSS · Vitest · React Testing Library · Playwright · Docker Compose · nginx

---

## File Map

```
palmetto/
├── apps/
│   ├── backend/src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   │   └── configuration.ts
│   │   ├── weather/
│   │   │   ├── weather.module.ts
│   │   │   ├── weather.controller.ts
│   │   │   ├── weather.controller.spec.ts
│   │   │   ├── weather.service.ts
│   │   │   ├── weather.service.spec.ts
│   │   │   ├── weather.mapper.ts
│   │   │   ├── weather.mapper.spec.ts
│   │   │   └── dto/
│   │   │       └── get-weather.query.ts
│   │   └── common/
│   │       └── filters/
│   │           ├── global-exception.filter.ts
│   │           └── global-exception.filter.spec.ts
│   │   Dockerfile
│   │
│   └── frontend/src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── providers/
│       │   └── ThemeProvider.tsx
│       ├── store/
│       │   ├── index.ts
│       │   ├── themeSlice.ts
│       │   ├── themeSlice.spec.ts
│       │   ├── settingsSlice.ts
│       │   ├── settingsSlice.spec.ts
│       │   ├── searchSlice.ts
│       │   └── searchSlice.spec.ts
│       ├── services/
│       │   └── weather.service.ts
│       ├── hooks/
│       │   ├── useCurrentWeather.ts
│       │   └── useForecast.ts
│       ├── components/
│       │   ├── common/
│       │   │   ├── ErrorBoundary.tsx
│       │   │   ├── ErrorMessage.tsx
│       │   │   ├── ErrorMessage.spec.tsx
│       │   │   └── LoadingSpinner.tsx
│       │   ├── search/
│       │   │   ├── SearchBar.tsx
│       │   │   ├── SearchBar.spec.tsx
│       │   │   └── RecentLocations.tsx
│       │   ├── weather/
│       │   │   ├── CurrentWeather.tsx
│       │   │   ├── CurrentWeather.spec.tsx
│       │   │   ├── StatTile.tsx
│       │   │   ├── ForecastStrip.tsx
│       │   │   └── ForecastDay.tsx
│       │   └── layout/
│       │       ├── Header.tsx
│       │       ├── Sidebar.tsx
│       │       └── MainPanel.tsx
│       ├── index.css
│       Dockerfile
│       nginx.conf
│
├── libs/
│   └── shared/src/
│       ├── index.ts
│       └── types/
│           ├── weather.dto.ts
│           ├── forecast.dto.ts
│           ├── error.dto.ts
│           └── units.type.ts
├── e2e/
│   ├── playwright.config.ts
│   └── tests/
│       └── weather.spec.ts
├── docker-compose.yml
└── .env.example
```

---

## Task 1: Initialize Nx Workspace

**Files:**
- Create: `package.json`, `nx.json`, `tsconfig.base.json`, `apps/`, `libs/`

- [ ] **Step 1: Create Nx workspace from Desktop (parent directory)**

Run from `~/Desktop` (NOT inside palmetto):
```bash
npx create-nx-workspace@latest palmetto \
  --preset=ts \
  --pm=npm \
  --nxCloud=skip
cd palmetto
```

- [ ] **Step 2: Install Nx plugins for React, NestJS, and JS lib**

```bash
npm install -D @nx/react @nx/nest @nx/js @nx/vite vitest @vitest/ui jsdom
```

- [ ] **Step 3: Generate the NestJS backend app**

```bash
npx nx g @nx/nest:app backend --unitTestRunner=vitest --e2eTestRunner=none
```

Expected: `apps/backend/` created with NestJS scaffold.

- [ ] **Step 4: Generate the React frontend app**

```bash
npx nx g @nx/react:app frontend \
  --bundler=vite \
  --style=none \
  --unitTestRunner=vitest \
  --e2eTestRunner=none \
  --routing=false
```

Expected: `apps/frontend/` created with React/Vite scaffold.

- [ ] **Step 5: Generate the shared types library**

```bash
npx nx g @nx/js:lib shared \
  --unitTestRunner=none \
  --bundler=none \
  --directory=libs/shared
```

Expected: `libs/shared/` created.

- [ ] **Step 6: Install application dependencies**

```bash
npm install \
  @nestjs/axios @nestjs/config @nestjs/cache-manager @nestjs/swagger \
  axios rxjs class-validator class-transformer cache-manager \
  @reduxjs/toolkit react-redux @tanstack/react-query \
  tailwindcss postcss autoprefixer
```

- [ ] **Step 7: Install dev dependencies**

```bash
npm install -D \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  @playwright/test \
  @types/node
```

- [ ] **Step 8: Initialize Tailwind in the frontend app**

```bash
cd apps/frontend
npx tailwindcss init -p
```

- [ ] **Step 9: Verify workspace builds**

```bash
cd ../..
npx nx run-many --target=build --all --skip-nx-cache
```

Expected: Both apps build without errors (may have empty output — that's fine at this stage).

- [ ] **Step 10: Move existing docs into the workspace and commit**

```bash
# If docs/ existed before nx init, it's already here. If not, create:
mkdir -p docs/superpowers/plans docs/superpowers/specs
git add .
git commit -m "chore: initialize Nx monorepo with backend, frontend, and shared lib"
```

---

## Task 2: Shared Types Library

**Files:**
- Create: `libs/shared/src/types/units.type.ts`
- Create: `libs/shared/src/types/weather.dto.ts`
- Create: `libs/shared/src/types/forecast.dto.ts`
- Create: `libs/shared/src/types/error.dto.ts`
- Modify: `libs/shared/src/index.ts`

- [ ] **Step 1: Create Units type**

`libs/shared/src/types/units.type.ts`:
```typescript
export type Units = 'imperial' | 'metric';
```

- [ ] **Step 2: Create WeatherDto**

`libs/shared/src/types/weather.dto.ts`:
```typescript
import { Units } from './units.type';

export interface WeatherDto {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  condition: string;
  conditionIcon: string;
  high: number;
  low: number;
  units: Units;
  updatedAt: string; // ISO 8601
}
```

- [ ] **Step 3: Create ForecastDto**

`libs/shared/src/types/forecast.dto.ts`:
```typescript
export interface ForecastDto {
  date: string; // ISO 8601
  high: number;
  low: number;
  condition: string;
  conditionIcon: string;
  humidity: number;
  windSpeed: number;
}
```

- [ ] **Step 4: Create ErrorDto**

`libs/shared/src/types/error.dto.ts`:
```typescript
export interface ErrorDto {
  statusCode: number;
  message: string;
  error: string;
}
```

- [ ] **Step 5: Export everything from the library index**

`libs/shared/src/index.ts`:
```typescript
export * from './types/units.type';
export * from './types/weather.dto';
export * from './types/forecast.dto';
export * from './types/error.dto';
```

- [ ] **Step 6: Verify tsconfig.base.json has the path alias (Nx sets this up — confirm it exists)**

`tsconfig.base.json` should contain:
```json
{
  "compilerOptions": {
    "paths": {
      "@palmetto/shared": ["libs/shared/src/index.ts"]
    }
  }
}
```

If missing, add it manually.

- [ ] **Step 7: Commit**

```bash
git add libs/shared/
git commit -m "feat(shared): add shared DTOs and types for weather, forecast, error, and units"
```

---

## Task 3: Backend Configuration Module

**Files:**
- Create: `apps/backend/src/config/configuration.ts`
- Modify: `apps/backend/src/app.module.ts`
- Create: `apps/backend/.env.example`

- [ ] **Step 1: Create typed configuration factory**

`apps/backend/src/config/configuration.ts`:
```typescript
export interface AppConfig {
  port: number;
  openWeather: {
    apiKey: string;
    baseUrl: string;
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

- [ ] **Step 2: Create .env.example for backend**

`apps/backend/.env.example`:
```env
OPENWEATHER_API_KEY=your_openweather_api_key_here
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5
WEATHER_CACHE_TTL_SECONDS=600
FORECAST_CACHE_TTL_SECONDS=1800
PORT=3000
```

- [ ] **Step 3: Update app.module.ts with ConfigModule and CacheModule**

`apps/backend/src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { configuration } from './config/configuration';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    WeatherModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/config/ apps/backend/src/app.module.ts apps/backend/.env.example
git commit -m "feat(backend): add typed configuration module and CacheModule"
```

---

## Task 4: GlobalExceptionFilter (TDD)

**Files:**
- Create: `apps/backend/src/common/filters/global-exception.filter.ts`
- Create: `apps/backend/src/common/filters/global-exception.filter.spec.ts`

- [ ] **Step 1: Write the failing tests**

`apps/backend/src/common/filters/global-exception.filter.spec.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { GlobalExceptionFilter } from './global-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';

function makeMockContext(mockJson: ReturnType<typeof vi.fn>) {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: vi.fn().mockReturnThis(),
        json: mockJson,
      }),
    }),
  } as any;
}

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  it('maps HttpException to its own status code and message', () => {
    const mockJson = vi.fn();
    filter.catch(
      new HttpException('Not Found', HttpStatus.NOT_FOUND),
      makeMockContext(mockJson),
    );
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Not Found',
      error: 'HttpException',
    });
  });

  it('maps AxiosError 404 from OpenWeather to 404', () => {
    const mockJson = vi.fn();
    const axiosError = new AxiosError('city not found');
    axiosError.response = { status: 404 } as any;
    filter.catch(axiosError, makeMockContext(mockJson));
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Location not found',
      error: 'AxiosError',
    });
  });

  it('maps AxiosError non-404 to 502', () => {
    const mockJson = vi.fn();
    const axiosError = new AxiosError('upstream error');
    axiosError.response = { status: 500 } as any;
    filter.catch(axiosError, makeMockContext(mockJson));
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 502,
      message: 'Weather service unavailable',
      error: 'AxiosError',
    });
  });

  it('maps unknown errors to 500', () => {
    const mockJson = vi.fn();
    filter.catch(new Error('something broke'), makeMockContext(mockJson));
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Error',
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx nx test backend --testFile=src/common/filters/global-exception.filter.spec.ts
```

Expected: FAIL — `GlobalExceptionFilter` not found.

- [ ] **Step 3: Implement GlobalExceptionFilter**

`apps/backend/src/common/filters/global-exception.filter.ts`:
```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { Response } from 'express';
import { ErrorDto } from '@palmetto/shared';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const errorDto = this.toErrorDto(exception);
    response.status(errorDto.statusCode).json(errorDto);
  }

  private toErrorDto(exception: unknown): ErrorDto {
    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        message:
          typeof exception.getResponse() === 'string'
            ? exception.getResponse() as string
            : exception.message,
        error: 'HttpException',
      };
    }

    if (exception instanceof AxiosError) {
      const upstreamStatus = exception.response?.status;
      if (upstreamStatus === 404) {
        return { statusCode: 404, message: 'Location not found', error: 'AxiosError' };
      }
      return { statusCode: 502, message: 'Weather service unavailable', error: 'AxiosError' };
    }

    const name = exception instanceof Error ? exception.constructor.name : 'Error';
    return { statusCode: 500, message: 'Internal server error', error: name };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx nx test backend --testFile=src/common/filters/global-exception.filter.spec.ts
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/common/
git commit -m "feat(backend): add GlobalExceptionFilter with error normalization"
```

---

## Task 5: WeatherMapper (TDD)

**Files:**
- Create: `apps/backend/src/weather/weather.mapper.ts`
- Create: `apps/backend/src/weather/weather.mapper.spec.ts`

The mapper converts OpenWeather's raw API responses into clean DTOs.

- [ ] **Step 1: Write the failing tests**

`apps/backend/src/weather/weather.mapper.spec.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { WeatherMapper } from './weather.mapper';

const rawCurrentResponse = {
  name: 'Austin',
  sys: { country: 'US', sunrise: 1700000000, sunset: 1700040000 },
  main: {
    temp: 72,
    feels_like: 75,
    humidity: 58,
    temp_max: 78,
    temp_min: 65,
  },
  wind: { speed: 12 },
  weather: [{ description: 'partly cloudy', icon: '02d' }],
  uvi: 6,
  dt: 1700000000,
};

const rawForecastResponse = {
  list: [
    {
      dt: 1700000000,
      dt_txt: '2024-01-15 12:00:00',
      main: { temp: 72, temp_max: 78, temp_min: 65, humidity: 58 },
      wind: { speed: 12 },
      weather: [{ description: 'partly cloudy', icon: '02d' }],
    },
    {
      dt: 1700010800,
      dt_txt: '2024-01-15 15:00:00',
      main: { temp: 75, temp_max: 80, temp_min: 66, humidity: 55 },
      wind: { speed: 10 },
      weather: [{ description: 'clear sky', icon: '01d' }],
    },
    {
      dt: 1700100000,
      dt_txt: '2024-01-16 12:00:00',
      main: { temp: 60, temp_max: 65, temp_min: 55, humidity: 70 },
      wind: { speed: 8 },
      weather: [{ description: 'rain', icon: '10d' }],
    },
  ],
};

describe('WeatherMapper', () => {
  const mapper = new WeatherMapper();

  describe('toWeatherDto', () => {
    it('maps city, country, temperature and condition correctly', () => {
      const dto = mapper.toWeatherDto(rawCurrentResponse as any, 'imperial');
      expect(dto.city).toBe('Austin');
      expect(dto.country).toBe('US');
      expect(dto.temperature).toBe(72);
      expect(dto.feelsLike).toBe(75);
      expect(dto.humidity).toBe(58);
      expect(dto.windSpeed).toBe(12);
      expect(dto.condition).toBe('partly cloudy');
      expect(dto.conditionIcon).toBe('02d');
      expect(dto.high).toBe(78);
      expect(dto.low).toBe(65);
      expect(dto.units).toBe('imperial');
    });

    it('sets updatedAt as ISO 8601 string', () => {
      const dto = mapper.toWeatherDto(rawCurrentResponse as any, 'imperial');
      expect(() => new Date(dto.updatedAt)).not.toThrow();
    });
  });

  describe('toForecastDtos', () => {
    it('aggregates 3-hour slots into daily entries', () => {
      const dtos = mapper.toForecastDtos(rawForecastResponse as any);
      expect(dtos).toHaveLength(2); // 2 distinct days in the test data
    });

    it('picks the max temp_max as the daily high', () => {
      const dtos = mapper.toForecastDtos(rawForecastResponse as any);
      expect(dtos[0].high).toBe(80); // max of 78 and 80
    });

    it('picks the min temp_min as the daily low', () => {
      const dtos = mapper.toForecastDtos(rawForecastResponse as any);
      expect(dtos[0].low).toBe(65); // min of 65 and 66
    });

    it('uses the most frequent condition icon as dominant condition', () => {
      const dtos = mapper.toForecastDtos(rawForecastResponse as any);
      // Day 1 has two slots: '02d' appears twice, '01d' once
      expect(dtos[0].conditionIcon).toBe('02d');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx nx test backend --testFile=src/weather/weather.mapper.spec.ts
```

Expected: FAIL — `WeatherMapper` not found.

- [ ] **Step 3: Define OpenWeather raw response interfaces and implement WeatherMapper**

`apps/backend/src/weather/weather.mapper.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { WeatherDto, ForecastDto, Units } from '@palmetto/shared';

export interface OpenWeatherCurrentResponse {
  name: string;
  sys: { country: string };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_max: number;
    temp_min: number;
  };
  wind: { speed: number };
  weather: Array<{ description: string; icon: string }>;
  uvi?: number;
  dt: number;
}

export interface OpenWeatherForecastSlot {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    temp_max: number;
    temp_min: number;
    humidity: number;
  };
  wind: { speed: number };
  weather: Array<{ description: string; icon: string }>;
}

export interface OpenWeatherForecastResponse {
  list: OpenWeatherForecastSlot[];
}

@Injectable()
export class WeatherMapper {
  toWeatherDto(raw: OpenWeatherCurrentResponse, units: Units): WeatherDto {
    return {
      city: raw.name,
      country: raw.sys.country,
      temperature: raw.main.temp,
      feelsLike: raw.main.feels_like,
      humidity: raw.main.humidity,
      windSpeed: raw.wind.speed,
      uvIndex: raw.uvi ?? 0,
      condition: raw.weather[0]?.description ?? '',
      conditionIcon: raw.weather[0]?.icon ?? '',
      high: raw.main.temp_max,
      low: raw.main.temp_min,
      units,
      updatedAt: new Date(raw.dt * 1000).toISOString(),
    };
  }

  toForecastDtos(raw: OpenWeatherForecastResponse): ForecastDto[] {
    const byDay = new Map<string, OpenWeatherForecastSlot[]>();

    for (const slot of raw.list) {
      const day = slot.dt_txt.split(' ')[0]; // 'YYYY-MM-DD'
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(slot);
    }

    return Array.from(byDay.entries())
      .slice(0, 5)
      .map(([day, slots]) => ({
        date: new Date(day).toISOString(),
        high: Math.max(...slots.map((s) => s.main.temp_max)),
        low: Math.min(...slots.map((s) => s.main.temp_min)),
        condition: this.dominantCondition(slots).description,
        conditionIcon: this.dominantCondition(slots).icon,
        humidity: Math.round(
          slots.reduce((sum, s) => sum + s.main.humidity, 0) / slots.length,
        ),
        windSpeed: Math.round(
          slots.reduce((sum, s) => sum + s.wind.speed, 0) / slots.length,
        ),
      }));
  }

  private dominantCondition(
    slots: OpenWeatherForecastSlot[],
  ): { description: string; icon: string } {
    const counts = new Map<string, number>();
    for (const slot of slots) {
      const icon = slot.weather[0]?.icon ?? '';
      counts.set(icon, (counts.get(icon) ?? 0) + 1);
    }
    const dominantIcon = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const dominantSlot = slots.find((s) => s.weather[0]?.icon === dominantIcon)!;
    return {
      description: dominantSlot.weather[0]?.description ?? '',
      icon: dominantIcon,
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx nx test backend --testFile=src/weather/weather.mapper.spec.ts
```

Expected: PASS — 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/weather/weather.mapper.ts apps/backend/src/weather/weather.mapper.spec.ts
git commit -m "feat(backend): add WeatherMapper with current and forecast aggregation"
```

---

## Task 6: WeatherService with RxJS (TDD)

**Files:**
- Create: `apps/backend/src/weather/weather.service.ts`
- Create: `apps/backend/src/weather/weather.service.spec.ts`
- Create: `apps/backend/src/weather/dto/get-weather.query.ts`

- [ ] **Step 1: Create query DTO with validation**

`apps/backend/src/weather/dto/get-weather.query.ts`:
```typescript
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Units } from '@palmetto/shared';

export class GetWeatherQuery {
  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsOptional()
  @IsIn(['imperial', 'metric'])
  units?: Units = 'imperial';
}
```

- [ ] **Step 2: Write the failing tests**

`apps/backend/src/weather/weather.service.spec.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { WeatherService } from './weather.service';
import { WeatherMapper } from './weather.mapper';

const mockWeatherDto = {
  city: 'Austin',
  country: 'US',
  temperature: 72,
  feelsLike: 75,
  humidity: 58,
  windSpeed: 12,
  uvIndex: 6,
  condition: 'partly cloudy',
  conditionIcon: '02d',
  high: 78,
  low: 65,
  units: 'imperial' as const,
  updatedAt: new Date().toISOString(),
};

const mockForecastDtos = [
  {
    date: new Date().toISOString(),
    high: 78,
    low: 65,
    condition: 'partly cloudy',
    conditionIcon: '02d',
    humidity: 58,
    windSpeed: 12,
  },
];

describe('WeatherService', () => {
  let service: WeatherService;
  let httpService: { get: ReturnType<typeof vi.fn> };
  let cacheManager: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };
  let mapper: { toWeatherDto: ReturnType<typeof vi.fn>; toForecastDtos: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    httpService = { get: vi.fn() };
    cacheManager = { get: vi.fn().mockResolvedValue(null), set: vi.fn() };
    mapper = {
      toWeatherDto: vi.fn().mockReturnValue(mockWeatherDto),
      toForecastDtos: vi.fn().mockReturnValue(mockForecastDtos),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: HttpService, useValue: httpService },
        { provide: WeatherMapper, useValue: mapper },
        { provide: CACHE_MANAGER, useValue: cacheManager },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              const config: Record<string, unknown> = {
                'openWeather.apiKey': 'test-key',
                'openWeather.baseUrl': 'https://api.openweathermap.org/data/2.5',
                'cache.weatherTtlSeconds': 600,
                'cache.forecastTtlSeconds': 1800,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get(WeatherService);
  });

  describe('getWeather$', () => {
    it('fetches weather, maps it, and returns WeatherDto', async () => {
      httpService.get.mockReturnValue(of({ data: {} }));
      const result = await firstValueFrom(service.getWeather$('Austin', 'imperial'));
      expect(result).toEqual(mockWeatherDto);
      expect(mapper.toWeatherDto).toHaveBeenCalledOnce();
    });

    it('returns cached value when cache hits', async () => {
      cacheManager.get.mockResolvedValue(mockWeatherDto);
      const result = await firstValueFrom(service.getWeather$('Austin', 'imperial'));
      expect(result).toEqual(mockWeatherDto);
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('propagates AxiosError when fetch fails', async () => {
      httpService.get.mockReturnValue(throwError(() => new AxiosError('fail')));
      await expect(
        firstValueFrom(service.getWeather$('BadCity', 'imperial')),
      ).rejects.toBeInstanceOf(AxiosError);
    });
  });

  describe('getForecast$', () => {
    it('fetches forecast, maps it, and returns ForecastDto[]', async () => {
      httpService.get.mockReturnValue(of({ data: {} }));
      const result = await firstValueFrom(service.getForecast$('Austin', 'imperial'));
      expect(result).toEqual(mockForecastDtos);
      expect(mapper.toForecastDtos).toHaveBeenCalledOnce();
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx nx test backend --testFile=src/weather/weather.service.spec.ts
```

Expected: FAIL — `WeatherService` not found.

- [ ] **Step 4: Implement WeatherService**

`apps/backend/src/weather/weather.service.ts`:
```typescript
import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { WeatherDto, ForecastDto, Units } from '@palmetto/shared';
import {
  WeatherMapper,
  OpenWeatherCurrentResponse,
  OpenWeatherForecastResponse,
} from './weather.mapper';

@Injectable()
export class WeatherService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly weatherTtl: number;
  private readonly forecastTtl: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly mapper: WeatherMapper,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    this.apiKey = this.config.get<string>('openWeather.apiKey')!;
    this.baseUrl = this.config.get<string>('openWeather.baseUrl')!;
    this.weatherTtl = this.config.get<number>('cache.weatherTtlSeconds')! * 1000;
    this.forecastTtl = this.config.get<number>('cache.forecastTtlSeconds')! * 1000;
  }

  getWeather$(location: string, units: Units): Observable<WeatherDto> {
    const cacheKey = `weather:${location}:${units}`;
    return from(this.cache.get<WeatherDto>(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached) return of(cached);
        return this.httpService
          .get<OpenWeatherCurrentResponse>(`${this.baseUrl}/weather`, {
            params: { q: location, appid: this.apiKey, units },
          })
          .pipe(
            map(({ data }) => this.mapper.toWeatherDto(data, units)),
            tap((dto) => this.cache.set(cacheKey, dto, this.weatherTtl)),
          );
      }),
    );
  }

  getForecast$(location: string, units: Units): Observable<ForecastDto[]> {
    const cacheKey = `forecast:${location}:${units}`;
    return from(this.cache.get<ForecastDto[]>(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached) return of(cached);
        return this.httpService
          .get<OpenWeatherForecastResponse>(`${this.baseUrl}/forecast`, {
            params: { q: location, appid: this.apiKey, units },
          })
          .pipe(
            map(({ data }) => this.mapper.toForecastDtos(data)),
            tap((dtos) => this.cache.set(cacheKey, dtos, this.forecastTtl)),
          );
      }),
    );
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx nx test backend --testFile=src/weather/weather.service.spec.ts
```

Expected: PASS — 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/weather/weather.service.ts \
         apps/backend/src/weather/weather.service.spec.ts \
         apps/backend/src/weather/dto/
git commit -m "feat(backend): add WeatherService with RxJS Observable pipelines and caching"
```

---

## Task 7: WeatherController + Swagger (TDD)

**Files:**
- Create: `apps/backend/src/weather/weather.controller.ts`
- Create: `apps/backend/src/weather/weather.controller.spec.ts`
- Create: `apps/backend/src/weather/weather.module.ts`

- [ ] **Step 1: Write the failing tests**

`apps/backend/src/weather/weather.controller.spec.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

const mockWeatherDto = {
  city: 'Austin', country: 'US', temperature: 72, feelsLike: 75,
  humidity: 58, windSpeed: 12, uvIndex: 6, condition: 'partly cloudy',
  conditionIcon: '02d', high: 78, low: 65, units: 'imperial' as const,
  updatedAt: new Date().toISOString(),
};

const mockForecastDtos = [
  { date: new Date().toISOString(), high: 78, low: 65,
    condition: 'partly cloudy', conditionIcon: '02d', humidity: 58, windSpeed: 12 },
];

describe('WeatherController', () => {
  let controller: WeatherController;
  let service: { getWeather$: ReturnType<typeof vi.fn>; getForecast$: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = {
      getWeather$: vi.fn().mockReturnValue(of(mockWeatherDto)),
      getForecast$: vi.fn().mockReturnValue(of(mockForecastDtos)),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [{ provide: WeatherService, useValue: service }],
    }).compile();

    controller = module.get(WeatherController);
  });

  describe('getWeather', () => {
    it('returns WeatherDto observable from service', async () => {
      const result = controller.getWeather({ location: 'Austin', units: 'imperial' });
      expect(result).toBeDefined();
      expect(service.getWeather$).toHaveBeenCalledWith('Austin', 'imperial');
    });

    it('calls service with default units when not provided', () => {
      controller.getWeather({ location: 'Austin', units: undefined as any });
      expect(service.getWeather$).toHaveBeenCalledWith('Austin', undefined);
    });
  });

  describe('getForecast', () => {
    it('returns ForecastDto[] observable from service', async () => {
      const result = controller.getForecast({ location: 'Austin', units: 'imperial' });
      expect(result).toBeDefined();
      expect(service.getForecast$).toHaveBeenCalledWith('Austin', 'imperial');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx nx test backend --testFile=src/weather/weather.controller.spec.ts
```

Expected: FAIL — `WeatherController` not found.

- [ ] **Step 3: Implement WeatherController**

`apps/backend/src/weather/weather.controller.ts`:
```typescript
import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { WeatherDto, ForecastDto } from '@palmetto/shared';
import { WeatherService } from './weather.service';
import { GetWeatherQuery } from './dto/get-weather.query';

@ApiTags('weather')
@Controller()
@UseInterceptors(CacheInterceptor)
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('weather')
  @ApiOperation({ summary: 'Get current weather for a location' })
  @ApiQuery({ name: 'location', description: 'City name or lat,lon', required: true })
  @ApiQuery({ name: 'units', enum: ['imperial', 'metric'], required: false })
  @ApiResponse({ status: 200, description: 'Current weather data' })
  @ApiResponse({ status: 400, description: 'Invalid or missing location' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 502, description: 'Weather service unavailable' })
  getWeather(@Query() query: GetWeatherQuery): Observable<WeatherDto> {
    return this.weatherService.getWeather$(query.location, query.units ?? 'imperial');
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Get 5-day forecast for a location' })
  @ApiQuery({ name: 'location', description: 'City name or lat,lon', required: true })
  @ApiQuery({ name: 'units', enum: ['imperial', 'metric'], required: false })
  @ApiResponse({ status: 200, description: '5-day daily forecast' })
  @ApiResponse({ status: 400, description: 'Invalid or missing location' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 502, description: 'Weather service unavailable' })
  getForecast(@Query() query: GetWeatherQuery): Observable<ForecastDto[]> {
    return this.weatherService.getForecast$(query.location, query.units ?? 'imperial');
  }
}
```

- [ ] **Step 4: Create WeatherModule**

`apps/backend/src/weather/weather.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { WeatherMapper } from './weather.mapper';

@Module({
  imports: [HttpModule],
  controllers: [WeatherController],
  providers: [WeatherService, WeatherMapper],
})
export class WeatherModule {}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx nx test backend --testFile=src/weather/weather.controller.spec.ts
```

Expected: PASS — 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/weather/
git commit -m "feat(backend): add WeatherController with Swagger decorators and WeatherModule"
```

---

## Task 8: Backend Bootstrap (main.ts)

**Files:**
- Modify: `apps/backend/src/main.ts`

- [ ] **Step 1: Update main.ts with Swagger, validation pipe, and global filter**

`apps/backend/src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Palmetto Weather API')
    .setDescription('BFF proxy for OpenWeather — current conditions and 5-day forecast')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  console.log(`Backend running at http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
```

- [ ] **Step 2: Start the backend locally to verify it boots**

```bash
cp apps/backend/.env.example apps/backend/.env
# Edit .env and add your real OPENWEATHER_API_KEY
npx nx serve backend
```

Expected: Console shows `Backend running at http://localhost:3000` and `Swagger docs at http://localhost:3000/api/docs`.

Open `http://localhost:3000/api/docs` — Swagger UI should load with weather and forecast endpoints.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/main.ts
git commit -m "feat(backend): bootstrap NestJS with Swagger, validation pipe, and global filter"
```

---

## Task 9: Backend Dockerfile

**Files:**
- Create: `apps/backend/Dockerfile`

- [ ] **Step 1: Create backend Dockerfile**

`apps/backend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY nx.json tsconfig.base.json ./
COPY apps/backend ./apps/backend
COPY libs ./libs
RUN npm ci --ignore-scripts
RUN npx nx build backend --prod

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/backend ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "main.js"]
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/Dockerfile
git commit -m "feat(backend): add production Dockerfile"
```

---

## Task 10: Frontend Redux Store (TDD)

**Files:**
- Create: `apps/frontend/src/store/themeSlice.ts`
- Create: `apps/frontend/src/store/themeSlice.spec.ts`
- Create: `apps/frontend/src/store/settingsSlice.ts`
- Create: `apps/frontend/src/store/settingsSlice.spec.ts`
- Create: `apps/frontend/src/store/searchSlice.ts`
- Create: `apps/frontend/src/store/searchSlice.spec.ts`
- Create: `apps/frontend/src/store/index.ts`

- [ ] **Step 1: Write failing tests for themeSlice**

`apps/frontend/src/store/themeSlice.spec.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import themeReducer, { toggleTheme, setTheme } from './themeSlice';

describe('themeSlice', () => {
  it('has light as initial state', () => {
    expect(themeReducer(undefined, { type: '@@INIT' })).toBe('light');
  });

  it('toggles from light to dark', () => {
    expect(themeReducer('light', toggleTheme())).toBe('dark');
  });

  it('toggles from dark to light', () => {
    expect(themeReducer('dark', toggleTheme())).toBe('light');
  });

  it('sets theme explicitly', () => {
    expect(themeReducer('light', setTheme('dark'))).toBe('dark');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx nx test frontend --testFile=src/store/themeSlice.spec.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement themeSlice**

`apps/frontend/src/store/themeSlice.ts`:
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark';

const savedTheme = (localStorage.getItem('theme') as Theme) ?? 'light';

const themeSlice = createSlice({
  name: 'theme',
  initialState: savedTheme as Theme,
  reducers: {
    toggleTheme: (state) => (state === 'light' ? 'dark' : 'light'),
    setTheme: (_state, action: PayloadAction<Theme>) => action.payload,
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx nx test frontend --testFile=src/store/themeSlice.spec.ts
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Write failing tests for settingsSlice**

`apps/frontend/src/store/settingsSlice.spec.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import settingsReducer, { setUnits, toggleUnits } from './settingsSlice';

describe('settingsSlice', () => {
  it('has imperial as initial state', () => {
    expect(settingsReducer(undefined, { type: '@@INIT' })).toEqual({ units: 'imperial' });
  });

  it('toggles units from imperial to metric', () => {
    expect(settingsReducer({ units: 'imperial' }, toggleUnits())).toEqual({ units: 'metric' });
  });

  it('toggles units from metric to imperial', () => {
    expect(settingsReducer({ units: 'metric' }, toggleUnits())).toEqual({ units: 'imperial' });
  });

  it('sets units explicitly', () => {
    expect(settingsReducer({ units: 'imperial' }, setUnits('metric'))).toEqual({ units: 'metric' });
  });
});
```

- [ ] **Step 6: Implement settingsSlice**

`apps/frontend/src/store/settingsSlice.ts`:
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Units } from '@palmetto/shared';

interface SettingsState {
  units: Units;
}

const saved = localStorage.getItem('units') as Units | null;

const settingsSlice = createSlice({
  name: 'settings',
  initialState: { units: (saved ?? 'imperial') as Units } as SettingsState,
  reducers: {
    toggleUnits: (state) => {
      state.units = state.units === 'imperial' ? 'metric' : 'imperial';
    },
    setUnits: (state, action: PayloadAction<Units>) => {
      state.units = action.payload;
    },
  },
});

export const { toggleUnits, setUnits } = settingsSlice.actions;
export default settingsSlice.reducer;
```

- [ ] **Step 7: Run test to verify it passes**

```bash
npx nx test frontend --testFile=src/store/settingsSlice.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Write failing tests for searchSlice**

`apps/frontend/src/store/searchSlice.spec.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import searchReducer, { addSearch, clearSearch } from './searchSlice';

describe('searchSlice', () => {
  it('has empty array as initial state', () => {
    expect(searchReducer(undefined, { type: '@@INIT' })).toEqual({ recents: [] });
  });

  it('adds a new search to the front', () => {
    const state = searchReducer({ recents: [] }, addSearch('Austin, TX'));
    expect(state.recents[0]).toBe('Austin, TX');
  });

  it('deduplicates entries — moves existing to front', () => {
    const state = searchReducer({ recents: ['Austin, TX', 'New York'] }, addSearch('New York'));
    expect(state.recents).toEqual(['New York', 'Austin, TX']);
  });

  it('caps history at 5 entries', () => {
    const initial = { recents: ['a', 'b', 'c', 'd', 'e'] };
    const state = searchReducer(initial, addSearch('f'));
    expect(state.recents).toHaveLength(5);
    expect(state.recents[0]).toBe('f');
  });

  it('clears all recents', () => {
    const state = searchReducer({ recents: ['Austin'] }, clearSearch());
    expect(state.recents).toEqual([]);
  });
});
```

- [ ] **Step 9: Implement searchSlice**

`apps/frontend/src/store/searchSlice.ts`:
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SearchState {
  recents: string[];
}

const saved = JSON.parse(localStorage.getItem('recents') ?? '[]') as string[];

const searchSlice = createSlice({
  name: 'search',
  initialState: { recents: saved } as SearchState,
  reducers: {
    addSearch: (state, action: PayloadAction<string>) => {
      const filtered = state.recents.filter((r) => r !== action.payload);
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

- [ ] **Step 10: Run test to verify it passes**

```bash
npx nx test frontend --testFile=src/store/searchSlice.spec.ts
```

Expected: PASS.

- [ ] **Step 11: Wire up the store with localStorage persistence**

`apps/frontend/src/store/index.ts`:
```typescript
import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import settingsReducer from './settingsSlice';
import searchReducer from './searchSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    settings: settingsReducer,
    search: searchReducer,
  },
});

// Persist relevant slices to localStorage on every state change
store.subscribe(() => {
  const state = store.getState();
  localStorage.setItem('theme', state.theme);
  localStorage.setItem('units', state.settings.units);
  localStorage.setItem('recents', JSON.stringify(state.search.recents));
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

- [ ] **Step 12: Commit**

```bash
git add apps/frontend/src/store/
git commit -m "feat(frontend): add Redux store with themeSlice, settingsSlice, searchSlice"
```

---

## Task 11: Frontend RxJS Weather Service

**Files:**
- Create: `apps/frontend/src/services/weather.service.ts`

- [ ] **Step 1: Create weather service returning Observables**

`apps/frontend/src/services/weather.service.ts`:
```typescript
import axios, { AxiosError } from 'axios';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { WeatherDto, ForecastDto, Units, ErrorDto } from '@palmetto/shared';

const API_BASE = import.meta.env['VITE_API_BASE_URL'] ?? '/api';

function normalizeError(err: unknown): ErrorDto {
  if (err instanceof AxiosError && err.response) {
    return err.response.data as ErrorDto;
  }
  return { statusCode: 500, message: 'Unexpected error', error: 'Error' };
}

export const weatherService = {
  getWeather$(location: string, units: Units): Observable<WeatherDto> {
    return from(
      axios.get<WeatherDto>(`${API_BASE}/weather`, {
        params: { location, units },
      }),
    ).pipe(
      map((response) => response.data),
      catchError((err) => throwError(() => normalizeError(err))),
    );
  },

  getForecast$(location: string, units: Units): Observable<ForecastDto[]> {
    return from(
      axios.get<ForecastDto[]>(`${API_BASE}/forecast`, {
        params: { location, units },
      }),
    ).pipe(
      map((response) => response.data),
      catchError((err) => throwError(() => normalizeError(err))),
    );
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/services/
git commit -m "feat(frontend): add RxJS weather service using axios Observables"
```

---

## Task 12: React Query Hooks

**Files:**
- Create: `apps/frontend/src/hooks/useCurrentWeather.ts`
- Create: `apps/frontend/src/hooks/useForecast.ts`

- [ ] **Step 1: Create useCurrentWeather hook**

`apps/frontend/src/hooks/useCurrentWeather.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import { lastValueFrom } from 'rxjs';
import { Units, WeatherDto, ErrorDto } from '@palmetto/shared';
import { weatherService } from '../services/weather.service';

export function useCurrentWeather(location: string, units: Units) {
  return useQuery<WeatherDto, ErrorDto>({
    queryKey: ['weather', location, units],
    queryFn: () => lastValueFrom(weatherService.getWeather$(location, units)),
    enabled: Boolean(location),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
```

- [ ] **Step 2: Create useForecast hook**

`apps/frontend/src/hooks/useForecast.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import { lastValueFrom } from 'rxjs';
import { Units, ForecastDto, ErrorDto } from '@palmetto/shared';
import { weatherService } from '../services/weather.service';

export function useForecast(location: string, units: Units) {
  return useQuery<ForecastDto[], ErrorDto>({
    queryKey: ['forecast', location, units],
    queryFn: () => lastValueFrom(weatherService.getForecast$(location, units)),
    enabled: Boolean(location),
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/hooks/
git commit -m "feat(frontend): add useCurrentWeather and useForecast React Query hooks"
```

---

## Task 13: Common UI Components (TDD)

**Files:**
- Create: `apps/frontend/src/components/common/ErrorBoundary.tsx`
- Create: `apps/frontend/src/components/common/ErrorMessage.tsx`
- Create: `apps/frontend/src/components/common/ErrorMessage.spec.tsx`
- Create: `apps/frontend/src/components/common/LoadingSpinner.tsx`

- [ ] **Step 1: Write failing tests for ErrorMessage**

`apps/frontend/src/components/common/ErrorMessage.spec.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('shows "Location not found" for 404', () => {
    render(<ErrorMessage error={{ statusCode: 404, message: 'Not found', error: 'HttpException' }} />);
    expect(screen.getByText(/location not found/i)).toBeInTheDocument();
  });

  it('shows "Weather service unavailable" for 502', () => {
    render(<ErrorMessage error={{ statusCode: 502, message: 'Bad gateway', error: 'AxiosError' }} />);
    expect(screen.getByText(/weather service unavailable/i)).toBeInTheDocument();
  });

  it('shows "Something went wrong" for 500', () => {
    render(<ErrorMessage error={{ statusCode: 500, message: 'Internal error', error: 'Error' }} />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('shows "Invalid location" for 400', () => {
    render(<ErrorMessage error={{ statusCode: 400, message: 'Bad request', error: 'HttpException' }} />);
    expect(screen.getByText(/invalid location/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx nx test frontend --testFile=src/components/common/ErrorMessage.spec.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement ErrorMessage**

`apps/frontend/src/components/common/ErrorMessage.tsx`:
```typescript
import { ErrorDto } from '@palmetto/shared';

const MESSAGE_MAP: Record<number, string> = {
  400: 'Invalid location. Please check the city name and try again.',
  404: 'Location not found. Try a different city or check the spelling.',
  502: 'Weather service unavailable. Please try again in a moment.',
  500: 'Something went wrong on our end. Please try again.',
};

interface ErrorMessageProps {
  error: ErrorDto;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  const message = MESSAGE_MAP[error.statusCode] ?? MESSAGE_MAP[500];
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
    >
      {message}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx nx test frontend --testFile=src/components/common/ErrorMessage.spec.tsx
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Implement ErrorBoundary**

`apps/frontend/src/components/common/ErrorBoundary.tsx`:
```typescript
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Something went wrong. Please refresh the page.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 6: Implement LoadingSpinner**

`apps/frontend/src/components/common/LoadingSpinner.tsx`:
```typescript
export function LoadingSpinner() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 dark:border-gray-600 dark:border-t-blue-400"
        aria-label="Loading"
      />
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/components/common/
git commit -m "feat(frontend): add ErrorBoundary, ErrorMessage, and LoadingSpinner components"
```

---

## Task 14: Search Components (TDD)

**Files:**
- Create: `apps/frontend/src/components/search/SearchBar.tsx`
- Create: `apps/frontend/src/components/search/SearchBar.spec.tsx`
- Create: `apps/frontend/src/components/search/RecentLocations.tsx`

- [ ] **Step 1: Write failing tests for SearchBar**

`apps/frontend/src/components/search/SearchBar.spec.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders the search input', () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText(/search city/i)).toBeInTheDocument();
  });

  it('calls onSearch with the input value on form submit', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText(/search city/i);
    fireEvent.change(input, { target: { value: 'Austin, TX' } });
    fireEvent.submit(input.closest('form')!);
    expect(onSearch).toHaveBeenCalledWith('Austin, TX');
  });

  it('does not call onSearch when input is empty', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    fireEvent.submit(screen.getByPlaceholderText(/search city/i).closest('form')!);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('shows validation message when submitted empty', () => {
    render(<SearchBar onSearch={vi.fn()} />);
    fireEvent.submit(screen.getByPlaceholderText(/search city/i).closest('form')!);
    expect(screen.getByText(/please enter a city/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx nx test frontend --testFile=src/components/search/SearchBar.spec.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement SearchBar**

`apps/frontend/src/components/search/SearchBar.tsx`:
```typescript
import { FormEvent, useState } from 'react';

interface SearchBarProps {
  onSearch: (location: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      setError('Please enter a city name.');
      return;
    }
    setError('');
    onSearch(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(''); }}
        placeholder="Search city or zip..."
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </form>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx nx test frontend --testFile=src/components/search/SearchBar.spec.tsx
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Implement RecentLocations**

`apps/frontend/src/components/search/RecentLocations.tsx`:
```typescript
interface RecentLocationsProps {
  recents: string[];
  onSelect: (location: string) => void;
}

export function RecentLocations({ recents, onSelect }: RecentLocationsProps) {
  if (recents.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        Recent
      </p>
      <ul className="space-y-1">
        {recents.map((location) => (
          <li key={location}>
            <button
              type="button"
              onClick={() => onSelect(location)}
              className="w-full rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {location}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/components/search/
git commit -m "feat(frontend): add SearchBar with validation and RecentLocations components"
```

---

## Task 15: Weather Display Components (TDD)

**Files:**
- Create: `apps/frontend/src/components/weather/StatTile.tsx`
- Create: `apps/frontend/src/components/weather/ForecastDay.tsx`
- Create: `apps/frontend/src/components/weather/ForecastStrip.tsx`
- Create: `apps/frontend/src/components/weather/CurrentWeather.tsx`
- Create: `apps/frontend/src/components/weather/CurrentWeather.spec.tsx`

- [ ] **Step 1: Write failing tests for CurrentWeather**

`apps/frontend/src/components/weather/CurrentWeather.spec.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CurrentWeather } from './CurrentWeather';
import { WeatherDto } from '@palmetto/shared';

const mockDto: WeatherDto = {
  city: 'Austin', country: 'US', temperature: 72, feelsLike: 75,
  humidity: 58, windSpeed: 12, uvIndex: 6, condition: 'Partly Cloudy',
  conditionIcon: '02d', high: 78, low: 65, units: 'imperial',
  updatedAt: new Date().toISOString(),
};

describe('CurrentWeather', () => {
  it('renders city and country', () => {
    render(<CurrentWeather data={mockDto} />);
    expect(screen.getByText(/Austin/)).toBeInTheDocument();
    expect(screen.getByText(/US/)).toBeInTheDocument();
  });

  it('renders temperature with unit symbol', () => {
    render(<CurrentWeather data={mockDto} />);
    expect(screen.getByText(/72/)).toBeInTheDocument();
    expect(screen.getByText(/°F/)).toBeInTheDocument();
  });

  it('renders condition text', () => {
    render(<CurrentWeather data={mockDto} />);
    expect(screen.getByText(/Partly Cloudy/i)).toBeInTheDocument();
  });

  it('renders all stat tiles', () => {
    render(<CurrentWeather data={mockDto} />);
    expect(screen.getByText(/58%/)).toBeInTheDocument();  // humidity
    expect(screen.getByText(/12 mph/)).toBeInTheDocument(); // wind
  });

  it('renders metric unit symbol when units is metric', () => {
    render(<CurrentWeather data={{ ...mockDto, units: 'metric' }} />);
    expect(screen.getByText(/°C/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx nx test frontend --testFile=src/components/weather/CurrentWeather.spec.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement StatTile**

`apps/frontend/src/components/weather/StatTile.tsx`:
```typescript
interface StatTileProps {
  label: string;
  value: string;
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2 text-center dark:bg-gray-700">
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
```

- [ ] **Step 4: Implement CurrentWeather**

`apps/frontend/src/components/weather/CurrentWeather.tsx`:
```typescript
import { WeatherDto } from '@palmetto/shared';
import { StatTile } from './StatTile';

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

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        <StatTile label="Humidity" value={`${data.humidity}%`} />
        <StatTile label="Wind" value={`${Math.round(data.windSpeed)} ${speedUnit}`} />
        <StatTile label="UV Index" value={String(data.uvIndex)} />
        <StatTile label="High" value={`${Math.round(data.high)}${unitSymbol}`} />
        <StatTile label="Low" value={`${Math.round(data.low)}${unitSymbol}`} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx nx test frontend --testFile=src/components/weather/CurrentWeather.spec.tsx
```

Expected: PASS — 5 tests pass.

- [ ] **Step 6: Implement ForecastDay**

`apps/frontend/src/components/weather/ForecastDay.tsx`:
```typescript
import { ForecastDto } from '@palmetto/shared';
import { Units } from '@palmetto/shared';

interface ForecastDayProps {
  data: ForecastDto;
  units: Units;
}

export function ForecastDay({ data, units }: ForecastDayProps) {
  const unitSymbol = units === 'imperial' ? '°F' : '°C';
  const dayLabel = new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-100 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{dayLabel}</span>
      <img
        src={`https://openweathermap.org/img/wn/${data.conditionIcon}.png`}
        alt={data.condition}
        className="h-10 w-10"
      />
      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {Math.round(data.high)}{unitSymbol}
      </span>
      <span className="text-xs text-gray-400">
        {Math.round(data.low)}{unitSymbol}
      </span>
    </div>
  );
}
```

- [ ] **Step 7: Implement ForecastStrip**

`apps/frontend/src/components/weather/ForecastStrip.tsx`:
```typescript
import { ForecastDto, Units } from '@palmetto/shared';
import { ForecastDay } from './ForecastDay';

interface ForecastStripProps {
  data: ForecastDto[];
  units: Units;
}

export function ForecastStrip({ data, units }: ForecastStripProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        5-Day Forecast
      </p>
      <div className="grid grid-cols-5 gap-2">
        {data.map((day) => (
          <ForecastDay key={day.date} data={day} units={units} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add apps/frontend/src/components/weather/
git commit -m "feat(frontend): add CurrentWeather, StatTile, ForecastStrip, ForecastDay components"
```

---

## Task 16: Layout Components

**Files:**
- Create: `apps/frontend/src/components/layout/Header.tsx`
- Create: `apps/frontend/src/components/layout/Sidebar.tsx`
- Create: `apps/frontend/src/components/layout/MainPanel.tsx`

- [ ] **Step 1: Implement Header**

`apps/frontend/src/components/layout/Header.tsx`:
```typescript
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { toggleTheme } from '../../store/themeSlice';
import { toggleUnits } from '../../store/settingsSlice';

export function Header() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector((s: RootState) => s.theme);
  const units = useSelector((s: RootState) => s.settings.units);

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-700">
      <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
        Palmetto
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => dispatch(toggleUnits())}
          className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Toggle temperature units"
        >
          {units === 'imperial' ? '°F' : '°C'}
        </button>
        <button
          type="button"
          onClick={() => dispatch(toggleTheme())}
          className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Implement Sidebar**

`apps/frontend/src/components/layout/Sidebar.tsx`:
```typescript
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { addSearch } from '../../store/searchSlice';
import { SearchBar } from '../search/SearchBar';
import { RecentLocations } from '../search/RecentLocations';

interface SidebarProps {
  onLocationSelect: (location: string) => void;
}

export function Sidebar({ onLocationSelect }: SidebarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const recents = useSelector((s: RootState) => s.search.recents);

  function handleSearch(location: string) {
    dispatch(addSearch(location));
    onLocationSelect(location);
  }

  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-200 p-4 dark:border-gray-700">
      <SearchBar onSearch={handleSearch} />
      <RecentLocations recents={recents} onSelect={handleSearch} />
    </aside>
  );
}
```

- [ ] **Step 3: Implement MainPanel**

`apps/frontend/src/components/layout/MainPanel.tsx`:
```typescript
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useCurrentWeather } from '../../hooks/useCurrentWeather';
import { useForecast } from '../../hooks/useForecast';
import { CurrentWeather } from '../weather/CurrentWeather';
import { ForecastStrip } from '../weather/ForecastStrip';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { ErrorDto } from '@palmetto/shared';

interface MainPanelProps {
  location: string;
}

export function MainPanel({ location }: MainPanelProps) {
  const units = useSelector((s: RootState) => s.settings.units);
  const weather = useCurrentWeather(location, units);
  const forecast = useForecast(location, units);

  if (!location) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center text-gray-400 dark:text-gray-600">
        <p className="text-sm">Search for a city to get started.</p>
      </div>
    );
  }

  if (weather.isLoading || forecast.isLoading) return <LoadingSpinner />;

  if (weather.isError) {
    return <ErrorMessage error={weather.error as ErrorDto} />;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {weather.data && <CurrentWeather data={weather.data} />}
      {forecast.data && <ForecastStrip data={forecast.data} units={units} />}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/components/layout/
git commit -m "feat(frontend): add Header, Sidebar, and MainPanel layout components"
```

---

## Task 17: App Root & ThemeProvider

**Files:**
- Create: `apps/frontend/src/providers/ThemeProvider.tsx`
- Modify: `apps/frontend/src/App.tsx`
- Modify: `apps/frontend/src/main.tsx`
- Create: `apps/frontend/src/index.css`
- Modify: `apps/frontend/vite.config.ts`
- Create: `apps/frontend/tailwind.config.js`

- [ ] **Step 1: Update Tailwind config for dark mode and content paths**

`apps/frontend/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 2: Create global CSS with Tailwind directives**

`apps/frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
}

body {
  @apply bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100;
}
```

- [ ] **Step 3: Implement ThemeProvider**

`apps/frontend/src/providers/ThemeProvider.tsx`:
```typescript
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSelector((s: RootState) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return <>{children}</>;
}
```

- [ ] **Step 4: Implement App.tsx**

`apps/frontend/src/App.tsx`:
```typescript
import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MainPanel } from './components/layout/MainPanel';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export function App() {
  const [location, setLocation] = useState('');

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onLocationSelect={setLocation} />
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <MainPanel location={location} />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implement main.tsx**

`apps/frontend/src/main.tsx`:
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import { ThemeProvider } from './providers/ThemeProvider';
import { App } from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const root = document.getElementById('root')!;
createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
```

- [ ] **Step 6: Update vite.config.ts with dev proxy**

`apps/frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

Vite picks up `postcss.config.js` automatically — no Tailwind plugin import needed.

- [ ] **Step 7: Run the frontend locally to verify the full UI**

```bash
# Terminal 1: start backend
npx nx serve backend

# Terminal 2: start frontend
npx nx serve frontend
```

Open `http://localhost:4200`, search for a city — current weather and forecast should render.

- [ ] **Step 8: Commit**

```bash
git add apps/frontend/src/
git add apps/frontend/tailwind.config.js apps/frontend/vite.config.ts
git commit -m "feat(frontend): wire up App, ThemeProvider, Redux, React Query, and Tailwind dark mode"
```

---

## Task 18: Frontend Dockerfile + nginx

**Files:**
- Create: `apps/frontend/nginx.conf`
- Create: `apps/frontend/Dockerfile`

- [ ] **Step 1: Create nginx config**

`apps/frontend/nginx.conf`:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Proxy API requests to backend container
    location /api/ {
        proxy_pass http://backend:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA fallback — all non-asset routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

- [ ] **Step 2: Create multi-stage frontend Dockerfile**

`apps/frontend/Dockerfile`:
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY nx.json tsconfig.base.json ./
COPY apps/frontend ./apps/frontend
COPY libs ./libs
RUN npm ci --ignore-scripts
RUN npx nx build frontend --prod

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist/apps/frontend /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/Dockerfile apps/frontend/nginx.conf
git commit -m "feat(frontend): add multi-stage Dockerfile and nginx config for production serving"
```

---

## Task 19: Docker Compose & Environment Files

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Create docker-compose.yml**

`docker-compose.yml`:
```yaml
version: '3.9'

services:
  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    env_file:
      - .env
    environment:
      PORT: 3000
    expose:
      - "3000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
```

- [ ] **Step 2: Add health check endpoint to NestJS**

Add to `apps/backend/src/app.module.ts` after the WeatherModule import — add a simple controller inline in main.ts for the health check:

`apps/backend/src/main.ts` — add health route before `app.listen`:
```typescript
// Add this import at the top:
import { Controller, Get } from '@nestjs/common';

// Add this class before bootstrap():
@Controller('health')
class HealthController {
  @Get()
  check() { return { status: 'ok' }; }
}
```

Then register it in `app.module.ts` controllers:
```typescript
// In AppModule:
controllers: [HealthController],
```

Actually, to keep it clean, create a dedicated file:

`apps/backend/src/health/health.controller.ts`:
```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
```

Update `app.module.ts` to include it:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { configuration } from './config/configuration';
import { WeatherModule } from './weather/weather.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    CacheModule.register({ isGlobal: true }),
    WeatherModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 3: Create root .env.example**

`.env.example`:
```env
# OpenWeather API — get a free key at https://openweathermap.org/api
OPENWEATHER_API_KEY=your_openweather_api_key_here

# OpenWeather base URL (no trailing slash)
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5

# Cache TTLs in seconds
WEATHER_CACHE_TTL_SECONDS=600
FORECAST_CACHE_TTL_SECONDS=1800

# NestJS port (used inside Docker container)
PORT=3000
```

- [ ] **Step 4: Build and start the full stack with Docker Compose**

```bash
cp .env.example .env
# Edit .env — set your OPENWEATHER_API_KEY
docker compose up --build
```

Expected: Both containers start. Open `http://localhost` — the app loads. Open `http://localhost/api/docs` — Swagger UI loads.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml .env.example apps/backend/src/health/ apps/backend/src/app.module.ts
git commit -m "feat: add Docker Compose, health endpoint, and .env.example"
```

---

## Task 20: Playwright E2E Tests

**Files:**
- Create: `e2e/playwright.config.ts`
- Create: `e2e/tests/weather.spec.ts`

- [ ] **Step 1: Create Playwright config**

`e2e/playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

- [ ] **Step 2: Write E2E test suite**

`e2e/tests/weather.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Weather App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('search valid city shows weather card', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin, TX');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/Austin/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/°F|°C/)).toBeVisible();
  });

  test('search invalid city shows error message', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'xyznotacity12345');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(
      page.getByRole('alert'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('empty search shows validation message', async ({ page }) => {
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/please enter a city/i)).toBeVisible();
  });

  test('toggle units switches between °F and °C', async ({ page }) => {
    // Search first to have a temperature visible
    await page.fill('input[placeholder*="Search"]', 'Austin, TX');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/°F/)).toBeVisible({ timeout: 10_000 });

    await page.click('button[aria-label*="Toggle temperature"]');
    await expect(page.getByText(/°C/)).toBeVisible();
  });

  test('toggle dark mode applies dark class to html', async ({ page }) => {
    await page.click('button[aria-label*="dark mode"]');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('recent search appears in sidebar after search', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin, TX');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/Austin, TX/)).toBeVisible({ timeout: 10_000 });
    // After search, recent should appear in sidebar list
    const recentButtons = page.getByRole('button', { name: 'Austin, TX' });
    await expect(recentButtons.first()).toBeVisible();
  });
});
```

- [ ] **Step 3: Install Playwright browsers**

```bash
npx playwright install chromium
```

- [ ] **Step 4: Run E2E tests against the Docker Compose stack**

Make sure Docker Compose is running (`docker compose up`), then:

```bash
cd e2e
npx playwright test
```

Expected: All 6 tests pass. If any fail, check the trace files in `test-results/`.

- [ ] **Step 5: Commit**

```bash
cd ..
git add e2e/
git commit -m "test(e2e): add Playwright E2E tests for all 6 user scenarios"
```

---

## Final Checklist

- [ ] `docker compose up --build` starts both containers without errors
- [ ] `http://localhost` serves the weather app
- [ ] `http://localhost/api/docs` shows interactive Swagger UI
- [ ] Search a city → weather data renders
- [ ] Search invalid city → friendly error message shown
- [ ] Dark mode toggle works
- [ ] °F/°C toggle works
- [ ] Recent searches persist on page refresh (localStorage)
- [ ] `npx nx run-many --target=test --all` — all unit tests pass
- [ ] `cd e2e && npx playwright test` — all E2E tests pass
