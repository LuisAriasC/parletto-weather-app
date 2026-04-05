import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchBar } from './SearchBar';

vi.mock('../hooks/useGeocodeSuggestions');
import { useGeocodeSuggestions } from '../hooks/useGeocodeSuggestions';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('SearchBar', () => {
  beforeEach(() => {
    vi.mocked(useGeocodeSuggestions).mockReturnValue({ data: [] } as any);
  });

  it('renders the search input', () => {
    render(<SearchBar onSearch={vi.fn()} />, { wrapper });
    expect(screen.getByPlaceholderText(/search city/i)).toBeInTheDocument();
  });

  it('calls onSearch with { label, query } when Enter is pressed with text', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText(/search city/i));
    await userEvent.type(screen.getByPlaceholderText(/search city/i), 'Austin, TX');
    await userEvent.keyboard('{Enter}');
    expect(onSearch).toHaveBeenCalledWith({ label: 'Austin, TX', query: 'Austin, TX' });
  });

  it('does not call onSearch when input is empty', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText(/search city/i));
    await userEvent.keyboard('{Enter}');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('shows validation message when submitted empty', async () => {
    render(<SearchBar onSearch={vi.fn()} />, { wrapper });
    await userEvent.click(screen.getByPlaceholderText(/search city/i));
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText(/please enter a city/i)).toBeInTheDocument();
  });
});
