export interface AppConfig {
  port: number;
  openWeather: {
    apiKey: string;
  };
  geoapify: {
    apiKey: string;
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
  },
  geoapify: {
    apiKey: process.env['GEOAPIFY_API_KEY'] ?? '',
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
