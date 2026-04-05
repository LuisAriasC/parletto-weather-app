import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { of } from 'rxjs';
import request from 'supertest';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { WeatherDto } from '@parletto/shared';

const mockWeather: WeatherDto = {
  city: 'Austin',
  country: 'US',
  temperature: 72,
  feelsLike: 75,
  humidity: 58,
  windSpeed: 12,
  windDeg: 180,
  windGust: null,
  uvIndex: 6,
  condition: 'clear sky',
  conditionIcon: '01d',
  high: 80,
  low: 65,
  visibility: 10000,
  pressure: 1013,
  cloudCoverage: 5,
  precipitation: 0,
  sunrise: new Date().toISOString(),
  sunset: new Date().toISOString(),
  units: 'imperial',
  updatedAt: new Date().toISOString(),
};

describe('Rate limit headers (integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
      controllers: [WeatherController],
      providers: [
        {
          provide: WeatherService,
          useValue: {
            getWeather$: vi.fn().mockReturnValue(of(mockWeather)),
            getForecast$: vi.fn().mockReturnValue(of([])),
            getHourlyForecast$: vi.fn().mockReturnValue(of([])),
          },
        },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(() => app.close());

  it('includes X-RateLimit-Limit header on weather response', async () => {
    const res = await request(app.getHttpServer())
      .get('/weather?location=Austin&units=imperial');

    expect(res.headers['x-ratelimit-limit']).toBe('100');
  });

  it('includes X-RateLimit-Remaining header on weather response', async () => {
    const res = await request(app.getHttpServer())
      .get('/weather?location=Austin&units=imperial');

    expect(res.headers['x-ratelimit-remaining']).toBe('99');
  });
});
