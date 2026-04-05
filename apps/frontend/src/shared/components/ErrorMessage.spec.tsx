import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('shows "Location not found" for 404', () => {
    render(<ErrorMessage error={{ statusCode: 404, message: 'Not found', error: 'HttpException' }} />);
    expect(screen.getByText(/location not found/i)).toBeInTheDocument();
  });

  it('shows "Weather service unavailable" for 502', () => {
    render(<ErrorMessage error={{ statusCode: 502, message: 'Bad gateway', error: 'AxiosError' }} />);
    expect(screen.getByText(/weather service unavailable/i)).toBeInTheDocument();
  });

  it('shows "Something went wrong" for 500', () => {
    render(<ErrorMessage error={{ statusCode: 500, message: 'Internal error', error: 'Error' }} />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('shows "Invalid location" for 400', () => {
    render(<ErrorMessage error={{ statusCode: 400, message: 'Bad request', error: 'HttpException' }} />);
    expect(screen.getByText(/invalid location/i)).toBeInTheDocument();
  });

  it('does not show a Retry button when onRetry is not provided', () => {
    render(<ErrorMessage error={{ statusCode: 404, message: 'Not found', error: 'HttpException' }} />);
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('shows a Retry button and calls onRetry when clicked', async () => {
    const onRetry = vi.fn();
    render(
      <ErrorMessage error={{ statusCode: 404, message: 'Not found', error: 'HttpException' }} onRetry={onRetry} />,
    );
    const btn = screen.getByRole('button', { name: /retry/i });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
