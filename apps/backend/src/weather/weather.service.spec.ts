import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { of, throwError, lastValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { WeatherService } from './weather.service';
import { WeatherMapper } from './weather.mapper';
import { AppConfigService } from '../config/app-config.service';
import { MetricsService } from './metrics.service';
import { HourlyDto } from '@palmetto/shared';

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
  let mapper: { toWeatherDto: ReturnType<typeof vi.fn>; toForecastDtos: ReturnType<typeof vi.fn>; toHourlyDtos: ReturnType<typeof vi.fn> };
  let metrics: { recordCacheHit: ReturnType<typeof vi.fn>; recordCacheMiss: ReturnType<typeof vi.fn>; recordApiCall: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    httpService = { get: vi.fn() };
    cacheManager = { get: vi.fn().mockResolvedValue(null), set: vi.fn() };
    mapper = {
      toWeatherDto: vi.fn().mockReturnValue(mockWeatherDto),
      toForecastDtos: vi.fn().mockReturnValue(mockForecastDtos),
      toHourlyDtos: vi.fn(),
    };
    metrics = {
      recordCacheHit: vi.fn(),
      recordCacheMiss: vi.fn(),
      recordApiCall: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: HttpService, useValue: httpService },
        { provide: WeatherMapper, useValue: mapper },
        { provide: MetricsService, useValue: metrics },
        { provide: CACHE_MANAGER, useValue: cacheManager },
        {
          provide: AppConfigService,
          useValue: {
            apiKey: 'test-key',
            weatherTtlMs: 600_000,
            forecastTtlMs: 1_800_000,
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
      expect(metrics.recordCacheHit).toHaveBeenCalledOnce();
    });

    it('records a cache miss and API call on cold fetch', async () => {
      httpService.get.mockReturnValue(of({ data: {} }));
      await firstValueFrom(service.getWeather$('Austin', 'imperial'));
      expect(metrics.recordCacheMiss).toHaveBeenCalledOnce();
      expect(metrics.recordApiCall).toHaveBeenCalledOnce();
    });

    it('propagates AxiosError when fetch fails', async () => {
      httpService.get.mockReturnValue(throwError(() => new AxiosError('fail')));
      await expect(
        firstValueFrom(service.getWeather$('BadCity', 'imperial')),
      ).rejects.toBeInstanceOf(AxiosError);
    });

    it('propagates 401 Unauthorized from OpenWeather (invalid API key)', async () => {
      const error = new AxiosError('Unauthorized');
      error.response = { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config: {} as any };
      httpService.get.mockReturnValue(throwError(() => error));
      const rejected = await firstValueFrom(service.getWeather$('Austin', 'imperial')).catch((e) => e);
      expect(rejected).toBeInstanceOf(AxiosError);
      expect(rejected.response?.status).toBe(401);
    });

    it('propagates 429 Too Many Requests from OpenWeather (rate limited)', async () => {
      const error = new AxiosError('Too Many Requests');
      error.response = { status: 429, statusText: 'Too Many Requests', data: {}, headers: {}, config: {} as any };
      httpService.get.mockReturnValue(throwError(() => error));
      const rejected = await firstValueFrom(service.getWeather$('Austin', 'imperial')).catch((e) => e);
      expect(rejected).toBeInstanceOf(AxiosError);
      expect(rejected.response?.status).toBe(429);
    });

    it('propagates timeout error (ECONNABORTED)', async () => {
      const error = new AxiosError('timeout of 5000ms exceeded', 'ECONNABORTED');
      httpService.get.mockReturnValue(throwError(() => error));
      const rejected = await firstValueFrom(service.getWeather$('Austin', 'imperial')).catch((e) => e);
      expect(rejected).toBeInstanceOf(AxiosError);
      expect(rejected.code).toBe('ECONNABORTED');
    });

    it('uses lat/lon params when location looks like coordinates', async () => {
      httpService.get.mockReturnValue(of({ data: {} }));
      await firstValueFrom(service.getWeather$('30.27,-97.74', 'imperial'));
      const callParams = httpService.get.mock.calls[0][1].params;
      expect(callParams.lat).toBe('30.27');
      expect(callParams.lon).toBe('-97.74');
      expect(callParams.q).toBeUndefined();
    });

    it('uses q param for city name locations', async () => {
      httpService.get.mockReturnValue(of({ data: {} }));
      await firstValueFrom(service.getWeather$('Austin', 'imperial'));
      const callParams = httpService.get.mock.calls[0][1].params;
      expect(callParams.q).toBe('Austin');
      expect(callParams.lat).toBeUndefined();
    });
  });

  describe('getForecast$', () => {
    it('fetches forecast, maps it, and returns ForecastDto[]', async () => {
      httpService.get.mockReturnValue(of({ data: {} }));
      const result = await firstValueFrom(service.getForecast$('Austin', 'imperial'));
      expect(result).toEqual(mockForecastDtos);
      expect(mapper.toForecastDtos).toHaveBeenCalledOnce();
    });

    it('returns cached forecast when cache hits', async () => {
      cacheManager.get.mockResolvedValue(mockForecastDtos);
      const result = await firstValueFrom(service.getForecast$('Austin', 'imperial'));
      expect(result).toEqual(mockForecastDtos);
      expect(httpService.get).not.toHaveBeenCalled();
      expect(metrics.recordCacheHit).toHaveBeenCalledOnce();
    });

    it('propagates AxiosError when forecast fetch fails', async () => {
      httpService.get.mockReturnValue(throwError(() => new AxiosError('fail')));
      await expect(
        firstValueFrom(service.getForecast$('BadCity', 'imperial')),
      ).rejects.toBeInstanceOf(AxiosError);
    });

    it('propagates 401 when forecast fetch returns Unauthorized', async () => {
      const error = new AxiosError('Unauthorized');
      error.response = { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config: {} as any };
      httpService.get.mockReturnValue(throwError(() => error));
      const rejected = await firstValueFrom(service.getForecast$('Austin', 'imperial')).catch((e) => e);
      expect(rejected.response?.status).toBe(401);
    });
  });

  describe('getHourlyForecast$', () => {
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
    const rawForecastData = { list: [] };

    it('returns mapped HourlyDto[] on cache miss', async () => {
      cacheManager.get.mockResolvedValue(null);
      mapper.toHourlyDtos.mockReturnValue(mockHourly);
      httpService.get.mockReturnValue(of({ data: rawForecastData }));

      const result = await lastValueFrom(service.getHourlyForecast$('Austin, TX', 'imperial'));

      expect(mapper.toHourlyDtos).toHaveBeenCalledWith(rawForecastData);
      expect(result).toEqual(mockHourly);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'hourly:Austin, TX:imperial',
        mockHourly,
        1_800_000,
      );
    });

    it('returns cached HourlyDto[] on cache hit', async () => {
      cacheManager.get.mockResolvedValue(mockHourly);

      const result = await lastValueFrom(service.getHourlyForecast$('Austin, TX', 'imperial'));

      expect(mapper.toHourlyDtos).not.toHaveBeenCalled();
      expect(result).toEqual(mockHourly);
    });
  });
});
