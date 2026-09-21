import { useCallback, useRef, useState } from 'react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
}

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];

export function UploadZone({ onFileSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!file.type.startsWith('video/') && !ACCEPTED_TYPES.includes(file.type)) {
        // Still allow it through — some browsers report empty mime types for
        // valid video files — the engine will complain loudly if it's really wrong.
      }
      onFileSelected(file);
    },
    [onFileSelected],
  );

  return (
    <div
      className={`tape relative rounded-2xl border-2 border-dashed p-8 sm:p-14 text-center transition-colors cursor-pointer select-none ${
        isDragging ? 'border-(--color-accent) bg-(--color-accent-dim)' : 'border-(--color-line) bg-white hover:bg-(--color-paper-dim)'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      aria-label="Upload a video"
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-(--color-ink) sm:h-16 sm:w-16">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 16V4M12 4L7 9M12 4l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <p className="text-lg font-bold tracking-tight sm:text-2xl">DROP THE EVIDENCE HERE</p>
      <p className="mt-2 text-sm text-black/50">
        MP4, MOV, WebM
        <br />
        Maximum size determined by browser/device capability.
      </p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-(--color-ink) px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Rehabilitate My Video
      </button>
    </div>
  );
}
