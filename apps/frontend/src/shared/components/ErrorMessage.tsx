import { ErrorDto } from '@parletto/shared';

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
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-md border border-red-300 px-3 py-1 text-xs font-medium hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
        >
          Retry
        </button>
      )}
    </div>
  );
}
