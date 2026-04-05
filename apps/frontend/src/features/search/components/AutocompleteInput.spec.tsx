import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AutocompleteInput } from './AutocompleteInput';

vi.mock('../hooks/useGeocodeSuggestions');
import { useGeocodeSuggestions } from '../hooks/useGeocodeSuggestions';

const mockSuggestions = [
  { placeId: 'abc123', label: 'Austin, Texas, United States', lat: 30.2672, lon: -97.7431 },
  { placeId: 'def456', label: 'Austin, Minnesota, United States', lat: 43.6666, lon: -92.9746 },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('AutocompleteInput', () => {
  beforeEach(() => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);
  });

  it('renders the input with the given placeholder', () => {
    render(<AutocompleteInput onSelect={vi.fn()} placeholder="Search city..." />, { wrapper });
    expect(screen.getByPlaceholderText('Search city...')).toBeInTheDocument();
  });

  it('does not show dropdown when suggestions list is empty', () => {
    render(<AutocompleteInput onSelect={vi.fn()} placeholder="Search city..." />, { wrapper });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows dropdown with suggestions when hook returns data and input is focused', async () => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: mockSuggestions } as any);
    render(<AutocompleteInput onSelect={vi.fn()} placeholder="Search city..." />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText('Search city...'));
    await userEvent.type(screen.getByPlaceholderText('Search city...'), 'Aus');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Austin, Texas, United States')).toBeInTheDocument();
    expect(screen.getByText('Austin, Minnesota, United States')).toBeInTheDocument();
  });

  it('calls onSelect with label and "lat,lon" query when a suggestion is clicked', async () => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: mockSuggestions } as any);
    const onSelect = vi.fn();
    render(<AutocompleteInput onSelect={onSelect} placeholder="Search city..." />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText('Search city...'));
    await userEvent.type(screen.getByPlaceholderText('Search city...'), 'Aus');
    await userEvent.click(screen.getByText('Austin, Texas, United States'));
    expect(onSelect).toHaveBeenCalledWith({
      label: 'Austin, Texas, United States',
      query: '30.2672,-97.7431',
    });
  });

  it('pressing Escape closes the dropdown without calling onSelect', async () => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: mockSuggestions } as any);
    const onSelect = vi.fn();
    render(<AutocompleteInput onSelect={onSelect} placeholder="Search city..." />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText('Search city...'));
    await userEvent.type(screen.getByPlaceholderText('Search city...'), 'Aus');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('ArrowDown + Enter selects the highlighted suggestion', async () => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: mockSuggestions } as any);
    const onSelect = vi.fn();
    render(<AutocompleteInput onSelect={onSelect} placeholder="Search city..." />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText('Search city...'));
    await userEvent.type(screen.getByPlaceholderText('Search city...'), 'Aus');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith({
      label: 'Austin, Texas, United States',
      query: '30.2672,-97.7431',
    });
  });

  it('pressing Enter without navigating calls onSelect with free-text label and query', async () => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: mockSuggestions } as any);
    const onSelect = vi.fn();
    render(<AutocompleteInput onSelect={onSelect} placeholder="Search city..." />, { wrapper });
    const input = screen.getByPlaceholderText('Search city...');
    await userEvent.type(input, 'Austin');
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith({ label: 'Austin', query: 'Austin' });
  });

  it('pressing Enter on empty input calls onSelect with empty label and query', async () => {
    const onSelect = vi.fn();
    render(<AutocompleteInput onSelect={onSelect} placeholder="Search city..." />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText('Search city...'));
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith({ label: '', query: '' });
  });

  it('shows a loading indicator in the dropdown while suggestions are being fetched', async () => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: [], isLoading: true } as any);
    render(<AutocompleteInput onSelect={vi.fn()} placeholder="Search city..." />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText('Search city...'));
    await userEvent.type(screen.getByPlaceholderText('Search city...'), 'Aus');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows "No results found" when query has 3+ chars and suggestions are empty', async () => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: [], isLoading: false } as any);
    render(<AutocompleteInput onSelect={vi.fn()} placeholder="Search city..." />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText('Search city...'));
    await userEvent.type(screen.getByPlaceholderText('Search city...'), 'zzz');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });
});
