import { lastValueFrom } from 'rxjs';
import { useQuery } from '@tanstack/react-query';
import { GeocodeSuggestionDto, ErrorDto } from '@parletto/shared';
import { geocodeService } from '../services/geocode.service';

export function useGeocodeSuggestions(query: string) {
  return useQuery<GeocodeSuggestionDto[], ErrorDto>({
    queryKey: ['geocode', query],
    queryFn: () => lastValueFrom(geocodeService.getSuggestions$(query)),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });
}
