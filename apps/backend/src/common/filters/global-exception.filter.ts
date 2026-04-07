import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { Response } from 'express';
import { ErrorDto } from '@palmetto/shared';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const errorDto = this.toErrorDto(exception);

    if (errorDto.statusCode >= 500) {
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    } else if (errorDto.statusCode >= 400) {
      this.logger.warn(`${errorDto.statusCode} ${errorDto.error}: ${errorDto.message}`);
    }

    response.status(errorDto.statusCode).json(errorDto);
  }

  private toErrorDto(exception: unknown): ErrorDto {
    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        message:
          typeof exception.getResponse() === 'string'
            ? (exception.getResponse() as string)
            : exception.message,
        error: 'HttpException',
      };
    }

    if (exception instanceof AxiosError) {
      const upstreamStatus = exception.response?.status;
      if (upstreamStatus === 404) {
        return { statusCode: 404, message: 'Location not found', error: 'AxiosError' };
      }
      return { statusCode: 502, message: 'Weather service unavailable', error: 'AxiosError' };
    }

    return { statusCode: 500, message: 'Internal server error', error: 'InternalServerError' };
  }
}
