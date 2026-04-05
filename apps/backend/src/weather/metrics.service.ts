import { Injectable } from '@nestjs/common';

export interface WeatherMetrics {
  cacheHits: number;
  cacheMisses: number;
  apiCalls: number;
  cacheHitRate: number;
}

/**
 * In-memory counters for weather service cache efficiency.
 * Exported from WeatherModule so the health endpoint can surface them.
 */
@Injectable()
export class MetricsService {
  private cacheHits = 0;
  private cacheMisses = 0;
  private apiCalls = 0;

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  recordApiCall(): void {
    this.apiCalls++;
  }

  getMetrics(): WeatherMetrics {
    const total = this.cacheHits + this.cacheMisses;
    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      apiCalls: this.apiCalls,
      cacheHitRate: total > 0 ? Math.round((this.cacheHits / total) * 100) : 0,
    };
  }
}
