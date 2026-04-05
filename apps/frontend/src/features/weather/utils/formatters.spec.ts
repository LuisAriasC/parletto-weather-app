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
