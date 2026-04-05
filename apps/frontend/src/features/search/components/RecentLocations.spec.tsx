import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecentLocations } from './RecentLocations';

const recents = [
  { label: 'Austin, Texas, United States', query: '30.2672,-97.7431' },
  { label: 'New York City, New York, United States', query: '40.7128,-74.0060' },
];

describe('RecentLocations', () => {
  it('renders nothing when recents is empty', () => {
    const { container } = render(
      <RecentLocations recents={[]} onSelect={vi.fn()} onClear={vi.fn()} onRemove={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a button with the label text for each recent', () => {
    render(<RecentLocations recents={recents} onSelect={vi.fn()} onClear={vi.fn()} onRemove={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Austin, Texas, United States' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New York City, New York, United States' }),
    ).toBeInTheDocument();
  });

  it('calls onSelect with the full RecentSearch item when clicked', async () => {
    const onSelect = vi.fn();
    render(<RecentLocations recents={recents} onSelect={onSelect} onClear={vi.fn()} onRemove={vi.fn()} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Austin, Texas, United States' }),
    );
    expect(onSelect).toHaveBeenCalledWith({
      label: 'Austin, Texas, United States',
      query: '30.2672,-97.7431',
    });
  });

  it('calls onRemove with the query when the remove button is clicked', async () => {
    const onRemove = vi.fn();
    render(<RecentLocations recents={recents} onSelect={vi.fn()} onClear={vi.fn()} onRemove={onRemove} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Austin, Texas, United States from recent searches' }),
    );
    expect(onRemove).toHaveBeenCalledWith('30.2672,-97.7431');
  });

  it('calls onClear when the Clear button is clicked', async () => {
    const onClear = vi.fn();
    render(<RecentLocations recents={recents} onSelect={vi.fn()} onClear={onClear} onRemove={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear search history' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('shows weather icon when item has an icon field', () => {
    const recentsWithIcon = [
      { label: 'Austin, Texas, United States', query: '30.2672,-97.7431', icon: '01d' },
    ];
    const { container } = render(<RecentLocations recents={recentsWithIcon} onSelect={vi.fn()} onClear={vi.fn()} onRemove={vi.fn()} />);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('01d');
  });

  it('shows no icon when item has no icon field', () => {
    const { container } = render(<RecentLocations recents={recents} onSelect={vi.fn()} onClear={vi.fn()} onRemove={vi.fn()} />);
    expect(container.querySelector('img')).toBeNull();
  });
});
