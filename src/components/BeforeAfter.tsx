import type { VideoMetadata } from '../types';
import type { EncodeOutcome } from '../lib/ffmpegEngine';
import { formatBytes } from '../lib/format';

interface BeforeAfterProps {
  before: VideoMetadata;
  after: EncodeOutcome;
}

function StatBlock({
  title,
  resolution,
  fps,
  color,
  codec,
  size,
}: {
  title: string;
  resolution: string;
  fps: string;
  color: string;
  codec: string;
  size: string;
}) {
  return (
    <div className="flex-1 rounded-xl bg-(--color-paper-dim) p-4 font-mono text-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-black/40">{title}</p>
      <p className="font-semibold">{resolution}</p>
      <p className="text-black/60">{fps} FPS</p>
      <p className="text-black/60">{color}</p>
      <p className="text-black/60">{codec}</p>
      <p className="mt-1 font-semibold text-(--color-ink)">{size}</p>
    </div>
  );
}

export function BeforeAfter({ before, after }: BeforeAfterProps) {
  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-stretch sm:gap-4">
      <StatBlock
        title="Before"
        resolution={`${Math.round(before.width)} × ${Math.round(before.height)}`}
        fps={before.fps ? String(before.fps) : '?'}
        color={before.dynamicRange === 'unknown' ? '—' : before.dynamicRange}
        codec={before.codec}
        size={formatBytes(before.fileSize)}
      />
      <div className="flex items-center justify-center py-1 text-2xl text-black/30 sm:rotate-0" aria-hidden="true">
        <span className="sm:hidden">↓</span>
        <span className="hidden sm:inline">→</span>
      </div>
      <StatBlock
        title="After"
        resolution={`${after.width} × ${after.height}`}
        fps={String(after.fps)}
        color={after.dynamicRange}
        codec={after.codec}
        size={formatBytes(after.blob.size)}
      />
    </div>
  );
}
