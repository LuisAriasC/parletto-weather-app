import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed wrapper around ConfigService — eliminates magic strings at call sites.
 * All consumers inject this instead of raw ConfigService.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get apiKey(): string {
    return this.config.getOrThrow<string>('openWeather.apiKey');
  }

  get weatherTtlMs(): number {
    return this.config.getOrThrow<number>('cache.weatherTtlSeconds') * 1000;
  }

  get forecastTtlMs(): number {
    return this.config.getOrThrow<number>('cache.forecastTtlSeconds') * 1000;
  }

  get geoapifyApiKey(): string {
    return this.config.getOrThrow<string>('geoapify.apiKey');
  }
}
