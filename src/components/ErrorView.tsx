import type { AppError } from '../types';

interface ErrorViewProps {
  error: AppError;
  onRetry: () => void;
}

export function ErrorView({ error, onRetry }: ErrorViewProps) {
  return (
    <div className="rounded-2xl border-2 border-(--color-accent) bg-(--color-accent-dim) p-6 text-center sm:p-8">
      <p className="text-lg font-bold text-(--color-ink) sm:text-xl">{error.title}</p>
      <p className="mx-auto mt-2 max-w-md font-mono text-sm text-black/60">{error.detail}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-full bg-(--color-ink) px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  );
}
