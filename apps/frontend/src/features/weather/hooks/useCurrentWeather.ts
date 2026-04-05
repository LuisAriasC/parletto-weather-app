import { useQuery } from '@tanstack/react-query';
import { lastValueFrom } from 'rxjs';
import { Units, WeatherDto, ErrorDto } from '@parletto/shared';
import { weatherService } from '../services/weather.service';

export function useCurrentWeather(location: string, units: Units) {
  return useQuery<WeatherDto, ErrorDto>({
    queryKey: ['weather', location, units],
    queryFn: () => lastValueFrom(weatherService.getWeather$(location, units)),
    enabled: Boolean(location),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
