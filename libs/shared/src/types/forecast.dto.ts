export interface ForecastDto {
  date: string; // ISO 8601
  high: number;
  low: number;
  condition: string;
  conditionIcon: string;
  humidity: number;
  windSpeed: number;
}
