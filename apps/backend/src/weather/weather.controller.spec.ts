import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { of, lastValueFrom } from 'rxjs';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { HourlyDto } from '@parletto/shared';

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
  let service: { getWeather$: ReturnType<typeof vi.fn>; getForecast$: ReturnType<typeof vi.fn>; getHourlyForecast$: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = {
      getWeather$: vi.fn().mockReturnValue(of(mockWeatherDto)),
      getForecast$: vi.fn().mockReturnValue(of(mockForecastDtos)),
      getHourlyForecast$: vi.fn(),
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
      expect(service.getWeather$).toHaveBeenCalledWith('Austin', 'imperial');
    });
  });

  describe('getForecast', () => {
    it('returns ForecastDto[] observable from service', async () => {
      const result = controller.getForecast({ location: 'Austin', units: 'imperial' });
      expect(result).toBeDefined();
      expect(service.getForecast$).toHaveBeenCalledWith('Austin', 'imperial');
    });
  });

  describe('getHourlyForecast', () => {
    it('calls weatherService.getHourlyForecast$ and returns result', async () => {
      const mockHourly: HourlyDto[] = [];
      service.getHourlyForecast$.mockReturnValue(of(mockHourly));

      const result = await lastValueFrom(
        controller.getHourlyForecast({ location: 'Austin, TX', units: 'imperial' }),
      );

      expect(service.getHourlyForecast$).toHaveBeenCalledWith('Austin, TX', 'imperial');
      expect(result).toEqual(mockHourly);
    });
  });
});
