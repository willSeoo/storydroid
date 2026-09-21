import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { PrivacyBadge, PrivacyMessage, PrivacySection } from './components/PrivacyNotice';
import { VideoPreview } from './components/VideoPreview';
import { VideoMetadataCard } from './components/VideoMetadataCard';
import { DiagnosisCard } from './components/DiagnosisCard';
import { ProcessingView } from './components/ProcessingView';
import { ResultView } from './components/ResultView';
import { ErrorView } from './components/ErrorView';
import { extractVideoMetadata } from './lib/metadata';
import { rehabilitateVideo, type EncodeOutcome } from './lib/ffmpegEngine';
import type { AppError, VideoMetadata } from './types';

type Stage = 'landing' | 'analyzing' | 'ready' | 'processing' | 'result' | 'error';

function App() {
  const [stage, setStage] = useState<Stage>('landing');
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<VideoMetadata | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<EncodeOutcome | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string | undefined>(undefined);
  const [error, setError] = useState<AppError | null>(null);

  const objectUrlsRef = useRef<string[]>([]);

  const trackUrl = useCallback((url: string) => {
    objectUrlsRef.current.push(url);
    return url;
  }, []);

  const revokeAllUrls = useCallback(() => {
    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    objectUrlsRef.current = [];
  }, []);

  useEffect(() => () => revokeAllUrls(), [revokeAllUrls]);

  const handleFileSelected = useCallback(
    async (selected: File) => {
      setFile(selected);
      setStage('analyzing');
      setError(null);
      const url = trackUrl(URL.createObjectURL(selected));
      setOriginalUrl(url);
      try {
        const extracted = await extractVideoMetadata(selected);
        setMeta(extracted);
        setStage('ready');
      } catch (err) {
        setError({
          title: 'The rehabilitation failed.',
          detail: err instanceof Error ? err.message : 'Could not read this video file. It may be corrupt or in an unsupported format.',
        });
        setStage('error');
      }
    },
    [trackUrl],
  );

  const handleBeginProcessing = useCallback(async () => {
    if (!file || !meta) return;
    setStage('processing');
    setProgress(0);
    setProgressMessage(undefined);
    try {
      const result = await rehabilitateVideo(file, meta, (fraction, message) => {
        setProgress(fraction);
        if (message) setProgressMessage(message);
      });
      const url = trackUrl(URL.createObjectURL(result.blob));
      setOptimizedUrl(url);
      setOutcome(result);
      setStage('result');
    } catch (err) {
      const anyErr = err as { detail?: string; message?: string };
      setError({
        title: anyErr?.message || 'The rehabilitation failed.',
        detail: anyErr?.detail || 'Something went wrong during processing. Try a different file or a smaller one.',
      });
      setStage('error');
    }
  }, [file, meta, trackUrl]);

  const handleDownload = useCallback(() => {
    if (!optimizedUrl) return;
    const a = document.createElement('a');
    a.href = optimizedUrl;
    a.download = `avrc_${(file?.name ?? 'video').replace(/\.[^.]+$/, '')}_instagram.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [optimizedUrl, file]);

  const handleReset = useCallback(() => {
    revokeAllUrls();
    setFile(null);
    setMeta(null);
    setOriginalUrl(null);
    setOptimizedUrl(null);
    setOutcome(null);
    setProgress(0);
    setError(null);
    setStage('landing');
  }, [revokeAllUrls]);

  const handleRetry = useCallback(() => {
    if (file) {
      handleFileSelected(file);
    } else {
      handleReset();
    }
  }, [file, handleFileSelected, handleReset]);

  return (
    <div className="min-h-screen pb-16">
      <Header />

      <main className="mx-auto max-w-3xl px-4 sm:px-6">
        {stage === 'landing' && (
          <div className="pt-6 sm:pt-10">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                Fix Your Android Video
                <br />
                Before Instagram Sees It
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-base text-black/55 sm:text-lg">
                Instagram doesn't hate Android.
                <br />
                It just has a complicated relationship with it.
              </p>
            </div>

            <div className="mt-8">
              <UploadZone onFileSelected={handleFileSelected} />
            </div>

            <div className="mt-4 flex justify-center">
              <PrivacyBadge />
            </div>

            <div className="mt-16">
              <PrivacySection />
            </div>

            <p className="mt-10 text-center text-xs text-black/30">
              No backend. No database. No account. Just your browser, doing its best.
            </p>
          </div>
        )}

        {stage === 'analyzing' && originalUrl && (
          <div className="pt-10 text-center">
            <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-black/40">
              Running intake exam...
            </p>
            <div className="mx-auto mt-6 max-w-xs">
              <VideoPreview src={originalUrl} />
            </div>
          </div>
        )}

        {stage === 'ready' && meta && originalUrl && (
          <div className="space-y-6 pt-6 sm:pt-10">
            <VideoPreview src={originalUrl} label="Original" />
            <VideoMetadataCard meta={meta} />
            <DiagnosisCard meta={meta} />

            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleBeginProcessing}
                className="w-full max-w-sm rounded-full bg-(--color-accent) py-4 text-center text-base font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.98] sm:text-lg"
              >
                Begin Treatment
              </button>
              <p className="max-w-sm text-center text-xs text-black/40">
                We'll convert this to 1080×1920, 30 FPS, H.264 + AAC — right here in your browser.
              </p>
              <PrivacyMessage />
            </div>
          </div>
        )}

        {stage === 'processing' && (
          <div className="pt-10">
            <ProcessingView progress={progress} currentMessage={progressMessage} />
          </div>
        )}

        {stage === 'result' && meta && outcome && originalUrl && optimizedUrl && (
          <div className="pt-6 sm:pt-10">
            <ResultView
              meta={meta}
              outcome={outcome}
              originalUrl={originalUrl}
              optimizedUrl={optimizedUrl}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>
        )}

        {stage === 'error' && error && (
          <div className="pt-10">
            <ErrorView error={error} onRetry={handleRetry} />
            <div className="mt-4 text-center">
              <button type="button" onClick={handleReset} className="text-sm text-black/40 underline underline-offset-4">
                Start over with a different file
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto mt-16 max-w-3xl px-4 text-center text-xs text-black/30 sm:px-6">
        Android Video Rehabilitation Center — not affiliated with Instagram, Meta, Android, or Google. Just a fan of
        all of them figuring out how to talk to each other.
      </footer>
    </div>
  );
}

export default App;
