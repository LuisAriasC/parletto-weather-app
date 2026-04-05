import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import App from './app';

function renderWithProviders() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>,
  );
}

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = renderWithProviders();
    expect(baseElement).toBeTruthy();
  });

  it('should render the search input', () => {
    const { getByPlaceholderText } = renderWithProviders();
    expect(getByPlaceholderText(/search city/i)).toBeTruthy();
  });
});
