import { Injectable, Inject, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { WeatherDto, ForecastDto, HourlyDto, Units, OPENWEATHER_BASE_URL } from '@palmetto/shared';
import {
  WeatherMapper,
  OpenWeatherCurrentResponse,
  OpenWeatherForecastResponse,
} from './weather.mapper';
import { AppConfigService } from '../config/app-config.service';
import { MetricsService } from './metrics.service';

/** Matches "19.4326,-99.1332" or "-33.8688, 151.2093" */
const COORD_RE = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;

@Injectable()
export class WeatherService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly mapper: WeatherMapper,
    private readonly appConfig: AppConfigService,
    private readonly metrics: MetricsService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.appConfig.apiKey) {
      this.logger.warn('OPENWEATHER_API_KEY is not set — all weather requests will fail with 401');
    } else {
      this.logger.log('WeatherService ready — API key is configured');
    }
  }

  getWeather$(location: string, units: Units): Observable<WeatherDto> {
    const cacheKey = `weather:${location}:${units}`;
    return from(this.cache.get<WeatherDto>(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached) {
          this.logger.debug(`Cache hit: ${cacheKey}`);
          this.metrics.recordCacheHit();
          return of(cached);
        }
        this.logger.debug(`Cache miss: ${cacheKey} — fetching from OpenWeather`);
        this.metrics.recordCacheMiss();
        this.metrics.recordApiCall();
        return this.httpService
          .get<OpenWeatherCurrentResponse>(`${OPENWEATHER_BASE_URL}/weather`, {
            params: { ...this.buildLocationParams(location), appid: this.appConfig.apiKey, units },
          })
          .pipe(
            map(({ data }) => this.mapper.toWeatherDto(data, units)),
            tap((dto) => {
              this.cache.set(cacheKey, dto, this.appConfig.weatherTtlMs);
              this.logger.debug(`Cached weather for ${location}`);
            }),
          );
      }),
    );
  }

  getForecast$(location: string, units: Units): Observable<ForecastDto[]> {
    const cacheKey = `forecast:${location}:${units}`;
    return from(this.cache.get<ForecastDto[]>(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached) {
          this.logger.debug(`Cache hit: ${cacheKey}`);
          this.metrics.recordCacheHit();
          return of(cached);
        }
        this.logger.debug(`Cache miss: ${cacheKey} — fetching from OpenWeather`);
        this.metrics.recordCacheMiss();
        this.metrics.recordApiCall();
        return this.httpService
          .get<OpenWeatherForecastResponse>(`${OPENWEATHER_BASE_URL}/forecast`, {
            params: { ...this.buildLocationParams(location), appid: this.appConfig.apiKey, units },
          })
          .pipe(
            map(({ data }) => this.mapper.toForecastDtos(data)),
            tap((dtos) => {
              this.cache.set(cacheKey, dtos, this.appConfig.forecastTtlMs);
              this.logger.debug(`Cached forecast for ${location}`);
            }),
          );
      }),
    );
  }

  getHourlyForecast$(location: string, units: Units): Observable<HourlyDto[]> {
    const cacheKey = `hourly:${location}:${units}`;
    return from(this.cache.get<HourlyDto[]>(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached) {
          this.metrics.recordCacheHit();
          return of(cached);
        }
        this.metrics.recordCacheMiss();
        this.metrics.recordApiCall();
        return this.httpService
          .get<OpenWeatherForecastResponse>(`${OPENWEATHER_BASE_URL}/forecast`, {
            params: { ...this.buildLocationParams(location), appid: this.appConfig.apiKey, units },
          })
          .pipe(
            map(({ data }) => this.mapper.toHourlyDtos(data)),
            tap((dtos) => this.cache.set(cacheKey, dtos, this.appConfig.forecastTtlMs)),
          );
      }),
    );
  }

  /**
   * Detects "lat,lon" format and returns the right OpenWeather query params.
   * City names → { q }; coordinates → { lat, lon }.
   */
  private buildLocationParams(location: string): Record<string, string> {
    const match = COORD_RE.exec(location);
    if (match) {
      return { lat: match[1], lon: match[2] };
    }
    return { q: location };
  }
}
