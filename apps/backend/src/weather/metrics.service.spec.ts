import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  it('starts with all counters at zero and hit rate of 0', () => {
    expect(service.getMetrics()).toEqual({
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      cacheHitRate: 0,
    });
  });

  describe('recordCacheHit', () => {
    it('increments cacheHits by 1', () => {
      service.recordCacheHit();
      expect(service.getMetrics().cacheHits).toBe(1);
    });

    it('increments cacheHits on each call', () => {
      service.recordCacheHit();
      service.recordCacheHit();
      service.recordCacheHit();
      expect(service.getMetrics().cacheHits).toBe(3);
    });
  });

  describe('recordCacheMiss', () => {
    it('increments cacheMisses by 1', () => {
      service.recordCacheMiss();
      expect(service.getMetrics().cacheMisses).toBe(1);
    });

    it('increments cacheMisses on each call', () => {
      service.recordCacheMiss();
      service.recordCacheMiss();
      expect(service.getMetrics().cacheMisses).toBe(2);
    });
  });

  describe('recordApiCall', () => {
    it('increments apiCalls by 1', () => {
      service.recordApiCall();
      expect(service.getMetrics().apiCalls).toBe(1);
    });

    it('increments apiCalls on each call', () => {
      service.recordApiCall();
      service.recordApiCall();
      expect(service.getMetrics().apiCalls).toBe(2);
    });
  });

  describe('getMetrics — cacheHitRate', () => {
    it('returns 0 when no requests have been made (avoids division by zero)', () => {
      expect(service.getMetrics().cacheHitRate).toBe(0);
    });

    it('returns 100 when all requests are cache hits', () => {
      service.recordCacheHit();
      service.recordCacheHit();
      expect(service.getMetrics().cacheHitRate).toBe(100);
    });

    it('returns 0 when all requests are cache misses', () => {
      service.recordCacheMiss();
      service.recordCacheMiss();
      expect(service.getMetrics().cacheHitRate).toBe(0);
    });

    it('returns 50 for equal hits and misses', () => {
      service.recordCacheHit();
      service.recordCacheMiss();
      expect(service.getMetrics().cacheHitRate).toBe(50);
    });

    it('rounds hit rate to the nearest integer (2 hits, 1 miss → 67%)', () => {
      service.recordCacheHit();
      service.recordCacheHit();
      service.recordCacheMiss();
      expect(service.getMetrics().cacheHitRate).toBe(67);
    });

    it('apiCalls counter does not affect hit rate calculation', () => {
      service.recordCacheHit();
      service.recordApiCall();
      service.recordApiCall();
      // total for rate = hits + misses = 1 + 0 = 1 → 100%
      expect(service.getMetrics().cacheHitRate).toBe(100);
    });
  });

  describe('getMetrics — full snapshot', () => {
    it('returns all counters together', () => {
      service.recordCacheHit();
      service.recordCacheMiss();
      service.recordApiCall();
      expect(service.getMetrics()).toEqual({
        cacheHits: 1,
        cacheMisses: 1,
        apiCalls: 1,
        cacheHitRate: 50,
      });
    });
  });
});
