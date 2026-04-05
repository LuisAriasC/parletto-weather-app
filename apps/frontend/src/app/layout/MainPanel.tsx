import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CloudSun } from 'lucide-react';
import { ErrorDto } from '@parletto/shared';
import { RootState, AppDispatch } from '../store';
import { CurrentWeather, ForecastPanel, useCurrentWeather } from '../../features/weather';
import { ErrorMessage, WeatherSkeleton } from '../../shared/components';
import { addSearch, updateSearchIcon } from '../../features/search';
import { LocationEntry } from '../app';

interface MainPanelProps {
  locationEntry: LocationEntry | null;
}

export function MainPanel({ locationEntry }: MainPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const units = useSelector((s: RootState) => s.settings.units);
  const weather = useCurrentWeather(locationEntry?.query ?? '', units);

  useEffect(() => {
    if (weather.data && locationEntry) {
      dispatch(addSearch({ label: locationEntry.label, query: locationEntry.query }));
      dispatch(updateSearchIcon({ query: locationEntry.query, icon: weather.data.conditionIcon }));
    }
  }, [weather.data, locationEntry, dispatch]);

  if (!locationEntry) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <CloudSun className="h-12 w-12 opacity-30" aria-hidden="true" />
        <p className="text-sm">Search for a city to get started.</p>
      </div>
    );
  }

  if (weather.isLoading) return (
    <div className="flex flex-col gap-6 p-6">
      <WeatherSkeleton />
    </div>
  );

  if (weather.isError) {
    return (
      <div className="p-6">
        <ErrorMessage
          error={weather.error as ErrorDto}
          onRetry={() => weather.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {weather.data
          ? `Weather loaded for ${weather.data.city}: ${Math.round(weather.data.temperature)}° ${weather.data.condition}`
          : ''}
      </div>
      {weather.data && <CurrentWeather data={weather.data} />}
      {locationEntry && <ForecastPanel location={locationEntry.query} units={units} />}
    </div>
  );
}
