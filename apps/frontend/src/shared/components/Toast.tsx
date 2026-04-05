import { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../app/store';
import { removeToast } from '../store/toastSlice';
import { Button } from '@/components/ui/button';

const AUTO_DISMISS_MS = 4000;

export function Toast() {
  const dispatch = useDispatch<AppDispatch>();
  const messages = useSelector((s: RootState) => s.toast.messages);

  useEffect(() => {
    if (messages.length === 0) return;
    const timers = messages.map((m) =>
      setTimeout(() => dispatch(removeToast(m.id)), AUTO_DISMISS_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [messages, dispatch]);

  if (messages.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {messages.map((m) => (
        <div
          key={m.id}
          role="alert"
          className="pointer-events-auto flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-lg backdrop-blur-sm"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="flex-1">{m.text}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => dispatch(removeToast(m.id))}
            aria-label="Dismiss notification"
            className="h-6 w-6 text-destructive hover:bg-destructive/20 hover:text-destructive"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      ))}
    </div>
  );
}
