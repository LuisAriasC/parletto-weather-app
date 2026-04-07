import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HourlyStrip } from './HourlyStrip';
import { HourlyDto } from '@palmetto/shared';

function makeSlot(overrides: Partial<HourlyDto> = {}): HourlyDto {
  return {
    time: '2026-01-01T00:00:00.000Z',
    temperature: 70,
    feelsLike: 68,
    condition: 'clear sky',
    conditionIcon: '01d',
    humidity: 50,
    windSpeed: 10,
    windDeg: 180,
    pop: 0,
    ...overrides,
  };
}

function makeSlots(count: number): HourlyDto[] {
  return Array.from({ length: count }, (_, i) =>
    makeSlot({ time: new Date(Date.UTC(2026, 0, 1, i * 3)).toISOString() }),
  );
}

describe('HourlyStrip', () => {
  it('renders exactly 8 rows when given 40 slots', () => {
    render(<HourlyStrip data={makeSlots(40)} units="imperial" />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(9); // 1 header + 8 data
  });

  it('renders however many slots when fewer than 8 are provided', () => {
    render(<HourlyStrip data={makeSlots(3)} units="imperial" />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4); // 1 header + 3 data
  });

  it('renders condition text in each row', () => {
    render(<HourlyStrip data={makeSlots(1)} units="imperial" />);
    expect(screen.getByText(/clear sky/i)).toBeInTheDocument();
  });

  it('renders temperature with °F for imperial', () => {
    render(<HourlyStrip data={[makeSlot({ temperature: 72 })]} units="imperial" />);
    expect(screen.getByText(/72°F/)).toBeInTheDocument();
  });

  it('renders temperature with °C for metric', () => {
    render(<HourlyStrip data={[makeSlot({ temperature: 22 })]} units="metric" />);
    expect(screen.getByText(/22°C/)).toBeInTheDocument();
  });

  it('hides pop% when pop is 0', () => {
    render(<HourlyStrip data={[makeSlot({ pop: 0 })]} units="imperial" />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('shows pop% when pop is greater than 0', () => {
    render(<HourlyStrip data={[makeSlot({ pop: 0.3 })]} units="imperial" />);
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('shows wind speed with compass direction', () => {
    render(<HourlyStrip data={[makeSlot({ windSpeed: 10, windDeg: 180 })]} units="imperial" />);
    expect(screen.getByText(/10 mph S/)).toBeInTheDocument();
  });
});
