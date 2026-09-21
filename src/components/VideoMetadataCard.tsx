import { useState } from 'react';
import type { VideoMetadata } from '../types';
import { formatBytes, formatDuration } from '../lib/format';

interface VideoMetadataCardProps {
  meta: VideoMetadata;
  defaultCollapsed?: boolean;
}

export function VideoMetadataCard({ meta, defaultCollapsed = true }: VideoMetadataCardProps) {
  const [open, setOpen] = useState(!defaultCollapsed);

  const rows: [string, string][] = [
    ['Resolution', `${Math.round(meta.width)} × ${Math.round(meta.height)}`],
    ['FPS', meta.fps ? String(meta.fps) : 'Unknown'],
    ['Format', meta.codec],
    ['Color', meta.dynamicRange === 'unknown' ? 'Unknown' : meta.dynamicRange],
    ['Aspect Ratio', meta.aspectRatioLabel],
    ['Duration', formatDuration(meta.duration)],
    ['Audio', meta.hasAudio ? 'Present' : 'None'],
    ['File Size', formatBytes(meta.fileSize)],
  ];

  return (
    <div className="tape rounded-2xl border border-(--color-line) bg-white p-5 sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-black/50">
          Patient Information
        </span>
        <span className="text-xs text-black/40 sm:hidden">{open ? 'Hide' : 'Show'}</span>
      </button>

      <div className={`${open ? 'mt-4 grid' : 'hidden sm:mt-4 sm:grid'} grid-cols-2 gap-x-6 gap-y-2 font-mono text-sm`}>
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-2 border-b border-dashed border-(--color-line) py-1.5">
            <span className="text-black/45">{label}</span>
            <span className="text-right font-semibold text-(--color-ink)">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
