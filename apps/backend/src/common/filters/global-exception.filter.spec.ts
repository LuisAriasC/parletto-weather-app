import { describe, it, expect, vi } from 'vitest';
import { GlobalExceptionFilter } from './global-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';

function makeMockContext(mockJson: ReturnType<typeof vi.fn>) {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: vi.fn().mockReturnThis(),
        json: mockJson,
      }),
    }),
  } as any;
}

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  it('maps HttpException to its own status code and message', () => {
    const mockJson = vi.fn();
    filter.catch(
      new HttpException('Not Found', HttpStatus.NOT_FOUND),
      makeMockContext(mockJson),
    );
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Not Found',
      error: 'HttpException',
    });
  });

  it('maps AxiosError 404 from OpenWeather to 404', () => {
    const mockJson = vi.fn();
    const axiosError = new AxiosError('city not found');
    axiosError.response = { status: 404 } as any;
    filter.catch(axiosError, makeMockContext(mockJson));
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Location not found',
      error: 'AxiosError',
    });
  });

  it('maps AxiosError non-404 to 502', () => {
    const mockJson = vi.fn();
    const axiosError = new AxiosError('upstream error');
    axiosError.response = { status: 500 } as any;
    filter.catch(axiosError, makeMockContext(mockJson));
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 502,
      message: 'Weather service unavailable',
      error: 'AxiosError',
    });
  });

  it('maps unknown errors to 500', () => {
    const mockJson = vi.fn();
    filter.catch(new Error('something broke'), makeMockContext(mockJson));
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      error: 'InternalServerError',
    });
  });
});
