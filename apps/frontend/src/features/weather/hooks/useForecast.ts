import { useQuery } from '@tanstack/react-query';
import { lastValueFrom } from 'rxjs';
import { Units, ForecastDto, ErrorDto } from '@palmetto/shared';
import { weatherService } from '../services/weather.service';

export function useForecast(location: string, units: Units) {
  return useQuery<ForecastDto[], ErrorDto>({
    queryKey: ['forecast', location, units],
    queryFn: () => lastValueFrom(weatherService.getForecast$(location, units)),
    enabled: Boolean(location),
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
