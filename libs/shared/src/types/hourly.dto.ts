export interface HourlyDto {
  time: string;        // ISO 8601
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionIcon: string;
  humidity: number;
  windSpeed: number;
  windDeg: number;
  pop: number;         // precipitation probability 0.0–1.0
}
