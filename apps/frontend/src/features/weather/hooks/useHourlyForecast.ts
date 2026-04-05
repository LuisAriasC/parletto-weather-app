import { lastValueFrom } from 'rxjs';
import { useQuery } from '@tanstack/react-query';
import { HourlyDto, ErrorDto, Units } from '@parletto/shared';
import { weatherService } from '../services/weather.service';

export function useHourlyForecast(location: string, units: Units) {
  return useQuery<HourlyDto[], ErrorDto>({
    queryKey: ['forecast-hourly', location, units],
    queryFn: () => lastValueFrom(weatherService.getHourlyForecast$(location, units)),
    enabled: Boolean(location),
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
