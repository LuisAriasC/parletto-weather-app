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
