import { describe, it, expect } from 'vitest';
import { WeatherMapper } from './weather.mapper';
import { HourlyDto } from '@parletto/shared';

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

const rawForecastResponse = {
  list: [
    {
      dt: 1700000000,
      dt_txt: '2024-01-15 12:00:00',
      main: { temp: 72, temp_max: 78, temp_min: 65, humidity: 58, feels_like: 70 },
      wind: { speed: 12, deg: 200 },
      weather: [{ description: 'partly cloudy', icon: '02d' }],
      pop: 0.3,
    },
    {
      dt: 1700010800,
      dt_txt: '2024-01-15 15:00:00',
      main: { temp: 75, temp_max: 80, temp_min: 66, humidity: 55, feels_like: 73 },
      wind: { speed: 10, deg: 180 },
      weather: [{ description: 'clear sky', icon: '01d' }],
      pop: 0,
    },
    {
      dt: 1700100000,
      dt_txt: '2024-01-16 12:00:00',
      main: { temp: 60, temp_max: 65, temp_min: 55, humidity: 70, feels_like: 57 },
      wind: { speed: 8, deg: 90 },
      weather: [{ description: 'rain', icon: '10d' }],
      pop: 0.8,
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
      // Day 1 has two slots: '02d' appears once, '01d' once — first seen wins on tie
      expect(dtos[0].conditionIcon).toBe('02d');
    });
  });

  describe('toHourlyDtos', () => {
    it('maps all fields from each slot', () => {
      const result = mapper.toHourlyDtos(rawForecastResponse as any);
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
      const result = mapper.toHourlyDtos(rawForecastResponse as any);
      expect(result).toHaveLength(rawForecastResponse.list.length);
    });
  });
});
