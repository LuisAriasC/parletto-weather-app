import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CurrentWeather } from './CurrentWeather';
import { WeatherDto } from '@parletto/shared';

const mockDto: WeatherDto = {
  city: 'Austin',
  country: 'US',
  temperature: 72,
  feelsLike: 75,
  humidity: 58,
  windSpeed: 12,
  windDeg: 270,
  windGust: 15,
  uvIndex: 6,
  condition: 'Partly Cloudy',
  conditionIcon: '02d',
  high: 78,
  low: 65,
  units: 'imperial',
  updatedAt: new Date().toISOString(),
  visibility: 16093,
  pressure: 1015,
  cloudCoverage: 75,
  precipitation: 3.16,
  sunrise: new Date('2026-01-15T12:00:00Z').toISOString(),
  sunset: new Date('2026-01-15T23:00:00Z').toISOString(),
};

describe('CurrentWeather', () => {
  it('renders city and country', () => {
    render(<CurrentWeather data={mockDto} />);
    expect(screen.getByText(/Austin/)).toBeInTheDocument();
    expect(screen.getByText(/US/)).toBeInTheDocument();
  });

  it('renders temperature with unit symbol', () => {
    render(<CurrentWeather data={mockDto} />);
    expect(screen.getByText(/72/)).toBeInTheDocument();
    expect(screen.getAllByText(/°F/).length).toBeGreaterThan(0);
  });

  it('renders condition text', () => {
    render(<CurrentWeather data={mockDto} />);
    expect(screen.getByText(/Partly Cloudy/i)).toBeInTheDocument();
  });

  it('renders all stat tiles', () => {
    render(<CurrentWeather data={mockDto} />);
    expect(screen.getByText(/58%/)).toBeInTheDocument();
    expect(screen.getByText(/12 mph/)).toBeInTheDocument();
  });

  it('renders metric unit symbol when units is metric', () => {
    render(<CurrentWeather data={{ ...mockDto, units: 'metric' }} />);
    expect(screen.getAllByText(/°C/).length).toBeGreaterThan(0);
  });

  it('renders extended stat tile labels', () => {
    render(<CurrentWeather data={mockDto} />);
    expect(screen.getByText('Visibility')).toBeInTheDocument();
    expect(screen.getByText('Pressure')).toBeInTheDocument();
    expect(screen.getByText('Clouds')).toBeInTheDocument();
    expect(screen.getByText('Sunrise')).toBeInTheDocument();
    expect(screen.getByText('Sunset')).toBeInTheDocument();
  });

  it('renders Gust tile when windGust is not null', () => {
    render(<CurrentWeather data={mockDto} />);
    expect(screen.getByText('Gust')).toBeInTheDocument();
  });

  it('hides Gust tile when windGust is null', () => {
    render(<CurrentWeather data={{ ...mockDto, windGust: null }} />);
    expect(screen.queryByText('Gust')).not.toBeInTheDocument();
  });

  it('renders Precip tile when precipitation > 0', () => {
    render(<CurrentWeather data={mockDto} />);
    expect(screen.getByText('Precip')).toBeInTheDocument();
  });

  it('hides Precip tile when precipitation is 0', () => {
    render(<CurrentWeather data={{ ...mockDto, precipitation: 0 }} />);
    expect(screen.queryByText('Precip')).not.toBeInTheDocument();
  });
});
