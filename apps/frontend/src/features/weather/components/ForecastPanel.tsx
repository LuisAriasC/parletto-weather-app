import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Units } from '@palmetto/shared';
import { useHourlyForecast } from '../hooks/useHourlyForecast';
import { useForecast } from '../hooks/useForecast';
import { HourlyStrip } from './HourlyStrip';
import { ForecastStrip } from './ForecastStrip';
import { ForecastSkeleton } from '../../../shared/components/ForecastSkeleton';
import { addToast } from '../../../shared/store/toastSlice';
import { AppDispatch } from '../../../app/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Tab = '3h' | '5d';

interface ForecastPanelProps {
  location: string;
  units: Units;
}

export function ForecastPanel({ location, units }: ForecastPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<Tab>('3h');
  const hourly = useHourlyForecast(location, units);
  const forecast = useForecast(location, units);

  useEffect(() => {
    if (hourly.isError) {
      dispatch(addToast('Could not load hourly forecast. Please try again.'));
    }
  }, [hourly.isError, dispatch]);

  useEffect(() => {
    if (forecast.isError) {
      dispatch(addToast('Could not load 5-day forecast. Please try again.'));
    }
  }, [forecast.isError, dispatch]);

  const tabs: Tab[] = ['3h', '5d'];
  const tabLabels: Record<Tab, string> = { '3h': 'Next 24h', '5d': '5-Day' };

  function handleTabKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, tab: Tab) {
    const idx = tabs.indexOf(tab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTab(tabs[(idx + 1) % tabs.length]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-4 flex gap-2" role="tablist">
          {tabs.map((tab) => (
            <Button
              key={tab}
              role="tab"
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab)}
              onKeyDown={(e) => handleTabKeyDown(e, tab)}
              aria-pressed={activeTab === tab}
              aria-selected={activeTab === tab}
              className={cn('rounded-full', activeTab !== tab && 'text-muted-foreground')}
            >
              {tabLabels[tab]}
            </Button>
          ))}
        </div>

        {activeTab === '3h' && (
          <>
            {hourly.isLoading && <ForecastSkeleton />}
            {hourly.isError && (
              <p className="text-sm text-muted-foreground">
                Hourly forecast unavailable.
              </p>
            )}
            {hourly.data && <HourlyStrip data={hourly.data} units={units} />}
          </>
        )}

        {activeTab === '5d' && (
          <>
            {forecast.isLoading && <ForecastSkeleton />}
            {forecast.isError && (
              <p className="text-sm text-muted-foreground">
                5-day forecast unavailable.
              </p>
            )}
            {forecast.data && <ForecastStrip data={forecast.data} units={units} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}
