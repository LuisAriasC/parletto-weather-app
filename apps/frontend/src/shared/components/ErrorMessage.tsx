import { AlertCircle, RefreshCw } from 'lucide-react';
import { ErrorDto } from '@palmetto/shared';
import { Button } from '@/components/ui/button';

const MESSAGE_MAP: Record<number, string> = {
  400: 'Invalid location. Please check the city name and try again.',
  404: 'Location not found. Try a different city or check the spelling.',
  502: 'Weather service unavailable. Please try again in a moment.',
  500: 'Something went wrong on our end. Please try again.',
};

interface ErrorMessageProps {
  error: ErrorDto;
  onRetry?: () => void;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const message = MESSAGE_MAP[error.statusCode] ?? MESSAGE_MAP[500];
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p>{message}</p>
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
