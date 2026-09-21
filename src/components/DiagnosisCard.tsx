import type { VideoMetadata } from '../types';
import { buildDiagnosis } from '../lib/memeCopy';

export function DiagnosisCard({ meta }: { meta: VideoMetadata }) {
  const diagnosis = buildDiagnosis(meta);

  return (
    <div className="rounded-2xl border-2 border-(--color-ink) bg-white p-5 sm:p-6">
      <span className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent)">
        Diagnosis
      </span>
      <p className="mt-2 text-xl font-bold leading-snug tracking-tight sm:text-2xl">{diagnosis.headline}</p>
      {diagnosis.detail && <p className="mt-2 text-sm leading-relaxed text-black/60">{diagnosis.detail}</p>}
    </div>
  );
}
