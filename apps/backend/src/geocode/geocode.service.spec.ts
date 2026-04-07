import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError, lastValueFrom } from 'rxjs';
import { GEOAPIFY_AUTOCOMPLETE_URL } from '@palmetto/shared';
import { GeocodeService } from './geocode.service';
import { AppConfigService } from '../config/app-config.service';

const mockGeoApifyResponse = {
  features: [
    {
      properties: {
        place_id: 'abc123',
        formatted: 'Austin, Texas, United States',
        lat: 30.2672,
        lon: -97.7431,
      },
    },
    {
      properties: {
        place_id: 'def456',
        formatted: 'Austin, Minnesota, United States',
        lat: 43.6666,
        lon: -92.9746,
      },
    },
  ],
};

describe('GeocodeService', () => {
  let service: GeocodeService;
  let httpService: { get: ReturnType<typeof vi.fn> };
  let appConfig: { geoapifyApiKey: string };

  beforeEach(async () => {
    httpService = { get: vi.fn() };
    appConfig = { geoapifyApiKey: 'test-key' };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodeService,
        { provide: HttpService, useValue: httpService },
        { provide: AppConfigService, useValue: appConfig },
      ],
    }).compile();

    service = module.get(GeocodeService);
  });

  it('calls GeoApify autocomplete URL with text, limit, and apiKey', async () => {
    httpService.get.mockReturnValue(of({ data: mockGeoApifyResponse }));
    await lastValueFrom(service.getSuggestions$('Austin'));
    expect(httpService.get).toHaveBeenCalledWith(
      GEOAPIFY_AUTOCOMPLETE_URL,
      { params: { text: 'Austin', limit: 5, apiKey: 'test-key' } },
    );
  });

  it('maps GeoApify features to GeocodeSuggestionDto[]', async () => {
    httpService.get.mockReturnValue(of({ data: mockGeoApifyResponse }));
    const result = await lastValueFrom(service.getSuggestions$('Austin'));
    expect(result).toEqual([
      { placeId: 'abc123', label: 'Austin, Texas, United States', lat: 30.2672, lon: -97.7431 },
      { placeId: 'def456', label: 'Austin, Minnesota, United States', lat: 43.6666, lon: -92.9746 },
    ]);
  });

  it('returns empty array when features list is empty', async () => {
    httpService.get.mockReturnValue(of({ data: { features: [] } }));
    const result = await lastValueFrom(service.getSuggestions$('xyz'));
    expect(result).toEqual([]);
  });

  it('returns empty array when HTTP request throws', async () => {
    httpService.get.mockReturnValue(throwError(() => new Error('Network error')));
    const result = await lastValueFrom(service.getSuggestions$('Austin'));
    expect(result).toEqual([]);
  });

  it('returns empty array when response is missing the features key (malformed JSON)', async () => {
    httpService.get.mockReturnValue(of({ data: {} }));
    const result = await lastValueFrom(service.getSuggestions$('Austin'));
    expect(result).toEqual([]);
  });
});
