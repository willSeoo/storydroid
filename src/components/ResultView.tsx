import type { VideoMetadata } from '../types';
import type { EncodeOutcome } from '../lib/ffmpegEngine';
import { BeforeAfter } from './BeforeAfter';
import { ToggleVideoPreview } from './VideoPreview';
import { formatBytes, percentChange } from '../lib/format';

interface ResultViewProps {
  meta: VideoMetadata;
  outcome: EncodeOutcome;
  originalUrl: string;
  optimizedUrl: string;
  onDownload: () => void;
  onReset: () => void;
}

export function ResultView({ meta, outcome, originalUrl, optimizedUrl, onDownload, onReset }: ResultViewProps) {
  const savings = percentChange(meta.fileSize, outcome.blob.size);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-mint)">
          Discharge Summary
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Your video has been rehabilitated.
        </h2>
        {savings > 0 && (
          <p className="mt-1 text-sm text-black/50">
            {savings}% smaller and considerably more Instagram-compliant.
          </p>
        )}
      </div>

      <ToggleVideoPreview originalSrc={originalUrl} optimizedSrc={optimizedUrl} />

      <BeforeAfter before={meta} after={outcome} />

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onDownload}
          className="w-full max-w-sm rounded-full bg-(--color-ink) py-4 text-center text-base font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.98] sm:text-lg"
        >
          DOWNLOAD THE NORMAL VERSION
        </button>
        <p className="text-xs text-black/40">{formatBytes(outcome.blob.size)} · MP4 · ready for Stories</p>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-semibold text-black/60 underline decoration-(--color-line) underline-offset-4 hover:text-black"
        >
          Optimize another video
        </button>
      </div>

      <p className="mx-auto max-w-sm text-center text-xs text-black/40">
        We cannot guarantee Instagram won't commit crimes against your bitrate.
      </p>
    </div>
  );
}
