import { useState } from 'react';

interface VideoPreviewProps {
  src: string;
  label?: string;
}

export function VideoPreview({ src, label }: VideoPreviewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-(--color-line) bg-black">
      <div className="relative mx-auto aspect-[9/16] max-h-[70vh] w-full max-w-xs bg-black">
        <video src={src} controls playsInline className="h-full w-full object-contain" />
        {label && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

interface ToggleVideoPreviewProps {
  originalSrc: string;
  optimizedSrc: string;
}

export function ToggleVideoPreview({ originalSrc, optimizedSrc }: ToggleVideoPreviewProps) {
  const [showOptimized, setShowOptimized] = useState(true);

  return (
    <div>
      <div className="mb-3 flex justify-center gap-2">
        {(['optimized', 'original'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setShowOptimized(mode === 'optimized')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              (mode === 'optimized') === showOptimized
                ? 'bg-(--color-ink) text-white'
                : 'bg-(--color-paper-dim) text-black/60 hover:bg-(--color-line)'
            }`}
          >
            {mode === 'optimized' ? 'Instagram-ready' : 'Original'}
          </button>
        ))}
      </div>
      <VideoPreview src={showOptimized ? optimizedSrc : originalSrc} label={showOptimized ? 'Instagram-ready' : 'Original'} />
    </div>
  );
}
