import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import toastReducer from '../../../shared/store/toastSlice';
import { ForecastPanel } from './ForecastPanel';
import { HourlyDto, ForecastDto } from '@parletto/shared';

vi.mock('../hooks/useHourlyForecast');
vi.mock('../hooks/useForecast');

import { useHourlyForecast } from '../hooks/useHourlyForecast';
import { useForecast } from '../hooks/useForecast';

const mockHourlySlot: HourlyDto = {
  time: '2026-01-01T00:00:00.000Z',
  temperature: 70,
  feelsLike: 68,
  condition: 'clear sky',
  conditionIcon: '01d',
  humidity: 50,
  windSpeed: 10,
  windDeg: 180,
  pop: 0,
};

const mockForecastDay: ForecastDto = {
  date: '2026-01-01',
  high: 75,
  low: 60,
  condition: 'sunny',
  conditionIcon: '01d',
  humidity: 50,
  windSpeed: 10,
};

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = configureStore({ reducer: { toast: toastReducer } });
  return (
    <Provider store={store}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </Provider>
  );
}

describe('ForecastPanel', () => {
  beforeEach(() => {
    vi.mocked(useHourlyForecast).mockReturnValue({
      data: [mockHourlySlot],
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useForecast).mockReturnValue({
      data: [mockForecastDay],
      isLoading: false,
      isError: false,
    } as any);
  });

  it('renders both tab buttons', () => {
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    expect(screen.getByRole('tab', { name: 'Next 24h' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '5-Day' })).toBeInTheDocument();
  });

  it('defaults to the Next 24h tab', () => {
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    expect(screen.getByRole('tab', { name: 'Next 24h' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('tab', { name: '5-Day' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows HourlyStrip content when Next 24h tab is active', () => {
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    expect(screen.getByText(/clear sky/i)).toBeInTheDocument();
  });

  it('switches to 5-Day tab when clicked and shows ForecastStrip content', async () => {
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    await userEvent.click(screen.getByRole('tab', { name: '5-Day' }));
    expect(screen.getByText('5-Day Forecast')).toBeInTheDocument();
  });

  it('shows loading skeleton in Next 24h tab while hourly data loads', () => {
    vi.mocked(useHourlyForecast).mockReturnValue({ data: undefined, isLoading: true, isError: false } as any);
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    expect(screen.getByLabelText('Loading forecast')).toBeInTheDocument();
  });

  it('shows fallback text in Next 24h tab when hourly fetch fails', () => {
    vi.mocked(useHourlyForecast).mockReturnValue({ data: undefined, isLoading: false, isError: true, error: { message: 'Failed' } } as any);
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    expect(screen.getByText(/hourly forecast unavailable/i)).toBeInTheDocument();
  });

  it('switches tabs with ArrowRight keyboard navigation', async () => {
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    const nextTab = screen.getByRole('tab', { name: 'Next 24h' });
    nextTab.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: '5-Day' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches tabs with ArrowLeft keyboard navigation', async () => {
    render(<ForecastPanel location="Austin, TX" units="imperial" />, { wrapper });
    const fiveDayTab = screen.getByRole('tab', { name: '5-Day' });
    fiveDayTab.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Next 24h' })).toHaveAttribute('aria-selected', 'true');
  });
});
