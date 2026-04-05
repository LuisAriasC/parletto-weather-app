import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Units } from '@parletto/shared';
import { useHourlyForecast } from '../hooks/useHourlyForecast';
import { useForecast } from '../hooks/useForecast';
import { HourlyStrip } from './HourlyStrip';
import { ForecastStrip } from './ForecastStrip';
import { ForecastSkeleton } from '../../../shared/components/ForecastSkeleton';
import { addToast } from '../../../shared/store/toastSlice';
import { AppDispatch } from '../../../app/store';

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

  const tabClass = (tab: Tab) =>
    `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
      activeTab === tab
        ? 'bg-blue-500 text-white'
        : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
    }`;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="mb-4 flex gap-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            className={tabClass(tab)}
            onClick={() => setActiveTab(tab)}
            onKeyDown={(e) => handleTabKeyDown(e, tab)}
            aria-pressed={activeTab === tab}
            aria-selected={activeTab === tab}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {activeTab === '3h' && (
        <>
          {hourly.isLoading && <ForecastSkeleton />}
          {hourly.isError && (
            <p className="text-sm text-gray-400 dark:text-gray-500">
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
            <p className="text-sm text-gray-400 dark:text-gray-500">
              5-day forecast unavailable.
            </p>
          )}
          {forecast.data && <ForecastStrip data={forecast.data} units={units} />}
        </>
      )}
    </div>
  );
}
