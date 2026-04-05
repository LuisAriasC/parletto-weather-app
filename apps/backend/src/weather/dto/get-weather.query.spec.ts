import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GetWeatherQuery } from './get-weather.query';

async function validateQuery(data: Record<string, unknown>) {
  return validate(plainToInstance(GetWeatherQuery, data));
}

describe('GetWeatherQuery', () => {
  describe('location', () => {
    it('accepts a plain city name', async () => {
      const errors = await validateQuery({ location: 'Austin' });
      expect(errors).toHaveLength(0);
    });

    it('accepts a city with country code', async () => {
      const errors = await validateQuery({ location: 'London,GB' });
      expect(errors).toHaveLength(0);
    });

    it('accepts lat,lon coordinates', async () => {
      const errors = await validateQuery({ location: '30.27,-97.74' });
      expect(errors).toHaveLength(0);
    });

    it('accepts a city name with spaces', async () => {
      const errors = await validateQuery({ location: 'New York' });
      expect(errors).toHaveLength(0);
    });

    it('rejects an empty location', async () => {
      const errors = await validateQuery({ location: '' });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a missing location', async () => {
      const errors = await validateQuery({});
      expect(errors.some((e) => e.property === 'location')).toBe(true);
    });

    it('rejects a location exceeding 100 characters', async () => {
      const errors = await validateQuery({ location: 'A'.repeat(101) });
      expect(errors.some((e) => e.property === 'location')).toBe(true);
    });

    it('rejects special characters outside the allowed set', async () => {
      const errors = await validateQuery({ location: '<script>alert(1)</script>' });
      expect(errors.some((e) => e.property === 'location')).toBe(true);
    });

    it('rejects SQL injection characters', async () => {
      const errors = await validateQuery({ location: "Austin'; DROP TABLE cities;--" });
      expect(errors.some((e) => e.property === 'location')).toBe(true);
    });
  });

  describe('units', () => {
    it('defaults to imperial when not provided', async () => {
      const query = plainToInstance(GetWeatherQuery, { location: 'Austin' });
      expect(query.units).toBe('imperial');
    });

    it('accepts imperial', async () => {
      const errors = await validateQuery({ location: 'Austin', units: 'imperial' });
      expect(errors).toHaveLength(0);
    });

    it('accepts metric', async () => {
      const errors = await validateQuery({ location: 'Austin', units: 'metric' });
      expect(errors).toHaveLength(0);
    });

    it('rejects an unknown units value', async () => {
      const errors = await validateQuery({ location: 'Austin', units: 'kelvin' });
      expect(errors.some((e) => e.property === 'units')).toBe(true);
    });
  });
});
