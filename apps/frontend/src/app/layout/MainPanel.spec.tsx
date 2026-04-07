import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainPanel } from './MainPanel';
import searchReducer from '../../features/search/store/searchSlice';
import settingsReducer from '../../shared/store/settingsSlice';
import toastReducer from '../../shared/store/toastSlice';
import themeReducer from '../../shared/store/themeSlice';
import { WeatherDto } from '@palmetto/shared';

vi.mock('../../features/weather/hooks/useCurrentWeather');
vi.mock('../../features/weather/hooks/useHourlyForecast', () => ({
  useHourlyForecast: () => ({ data: null, isLoading: false, isError: false }),
}));
vi.mock('../../features/weather/hooks/useForecast', () => ({
  useForecast: () => ({ data: null, isLoading: false, isError: false }),
}));

import { useCurrentWeather } from '../../features/weather/hooks/useCurrentWeather';

const mockWeather: WeatherDto = {
  city: 'Austin',
  country: 'US',
  temperature: 72,
  feelsLike: 70,
  humidity: 50,
  windSpeed: 10,
  windDeg: 180,
  windGust: null,
  uvIndex: 5,
  condition: 'Clear',
  conditionIcon: '01d',
  high: 80,
  low: 65,
  units: 'imperial',
  updatedAt: new Date().toISOString(),
  visibility: 16000,
  pressure: 1013,
  cloudCoverage: 0,
  precipitation: 0,
  sunrise: new Date().toISOString(),
  sunset: new Date().toISOString(),
};

function makeStore() {
  return configureStore({
    reducer: {
      search: searchReducer,
      settings: settingsReducer,
      toast: toastReducer,
      theme: themeReducer,
    },
  });
}

function renderPanel(
  locationEntry: { label: string; query: string } | null,
  store = makeStore(),
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MainPanel locationEntry={locationEntry} />
      </QueryClientProvider>
    </Provider>,
  );
  return store;
}

describe('MainPanel — recent search gating', () => {
  beforeEach(() => {
    vi.mocked(useCurrentWeather).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
  });

  it('adds location to recents when weather loads successfully', async () => {
    vi.mocked(useCurrentWeather).mockReturnValue({
      data: mockWeather,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const store = renderPanel({ label: 'Austin, TX', query: 'Austin' });

    await waitFor(() => {
      expect(store.getState().search.recents).toHaveLength(1);
      expect(store.getState().search.recents[0].label).toBe('Austin, TX');
      expect(store.getState().search.recents[0].query).toBe('Austin');
    });
  });

  it('does not add location to recents when weather fetch returns an error', async () => {
    vi.mocked(useCurrentWeather).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { statusCode: 404, message: 'Not found' },
      refetch: vi.fn(),
    } as any);

    const store = renderPanel({ label: 'xyznotacity', query: 'xyznotacity' });

    await waitFor(() => {
      screen.getByRole('alert');
    });
    expect(store.getState().search.recents).toHaveLength(0);
  });

  it('does not add location to recents while weather is still loading', () => {
    vi.mocked(useCurrentWeather).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const store = renderPanel({ label: 'Austin, TX', query: 'Austin' });

    expect(store.getState().search.recents).toHaveLength(0);
  });
});
