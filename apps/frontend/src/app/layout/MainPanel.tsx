import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ErrorDto } from '@parletto/shared';
import { RootState, AppDispatch } from '../store';
import { CurrentWeather, ForecastPanel, useCurrentWeather } from '../../features/weather';
import { ErrorMessage, WeatherSkeleton } from '../../shared/components';
import { updateSearchIcon } from '../../features/search';

interface MainPanelProps {
  location: string;
}

export function MainPanel({ location }: MainPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const units = useSelector((s: RootState) => s.settings.units);
  const weather = useCurrentWeather(location, units);

  useEffect(() => {
    if (weather.data && location) {
      dispatch(updateSearchIcon({ query: location, icon: weather.data.conditionIcon }));
    }
  }, [weather.data, location, dispatch]);

  if (!location) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center text-gray-400 dark:text-gray-600">
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
      {location && <ForecastPanel location={location} units={units} />}
    </div>
  );
}
