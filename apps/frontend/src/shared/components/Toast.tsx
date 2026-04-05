import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../app/store';
import { removeToast } from '../store/toastSlice';

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
          className="pointer-events-auto flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          <span className="flex-1">{m.text}</span>
          <button
            type="button"
            onClick={() => dispatch(removeToast(m.id))}
            aria-label="Dismiss notification"
            className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
