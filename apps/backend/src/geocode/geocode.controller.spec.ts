import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { of, lastValueFrom } from 'rxjs';
import { GeocodeController } from './geocode.controller';
import { GeocodeService } from './geocode.service';
import { GeocodeSuggestionDto } from '@palmetto/shared';

const mockSuggestions: GeocodeSuggestionDto[] = [
  { placeId: 'abc123', label: 'Austin, Texas, United States', lat: 30.2672, lon: -97.7431 },
];

describe('GeocodeController', () => {
  let controller: GeocodeController;
  let service: { getSuggestions$: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = { getSuggestions$: vi.fn().mockReturnValue(of(mockSuggestions)) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeocodeController],
      providers: [{ provide: GeocodeService, useValue: service }],
    }).compile();

    controller = module.get(GeocodeController);
  });

  it('calls getSuggestions$ with q and returns the observable result', async () => {
    const result = await lastValueFrom(controller.getSuggestions({ q: 'Austin' }));
    expect(service.getSuggestions$).toHaveBeenCalledWith('Austin');
    expect(result).toEqual(mockSuggestions);
  });
});
