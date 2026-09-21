import { useEffect, useState } from 'react';
import { PROCESSING_MESSAGES } from '../lib/memeCopy';

interface ProcessingViewProps {
  progress: number; // 0..1
  currentMessage?: string;
}

export function ProcessingView({ progress, currentMessage }: ProcessingViewProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % PROCESSING_MESSAGES.length);
    }, 1700);
    return () => clearInterval(id);
  }, []);

  const pct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
  const message = currentMessage ?? PROCESSING_MESSAGES[messageIndex];

  return (
    <div className="rounded-2xl border border-(--color-line) bg-white p-8 text-center sm:p-12">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-accent)">
        Rehabilitation In Progress
      </p>

      <div className="mx-auto mt-6 h-4 w-full max-w-sm overflow-hidden rounded-full border border-(--color-ink) bg-(--color-paper-dim)">
        <div
          className="progress-stripes h-full transition-[width] duration-300 ease-out"
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-sm font-semibold text-black/60">{pct}%</p>

      <p key={message} className="caret mt-6 text-base font-medium text-black/70 sm:text-lg">
        {message}
      </p>

      <p className="mt-6 text-xs text-black/40">
        Processing speed depends on your device. Bigger phones with bigger dreams (and CPUs) will go faster.
      </p>
    </div>
  );
}
