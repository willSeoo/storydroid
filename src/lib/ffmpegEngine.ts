import type { DynamicRange, VideoMetadata } from '../types';
import { buildEncodeTarget, buildFallbackFilter, buildFilterPlan } from './instagramSettings';

// Single-threaded ffmpeg core: no cross-origin-isolation headers required,
// so this works on any static host. Pulled from a CDN and cached by the
// browser as a blob URL — the video itself never goes near this CDN.
const CORE_BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';

export type ProgressHandler = (fraction: number, message?: string) => void;

let ffmpegInstance: import('@ffmpeg/ffmpeg').FFmpeg | null = null;
let loadPromise: Promise<void> | null = null;

export class RehabError extends Error {
  detail: string;
  constructor(title: string, detail: string) {
    super(title);
    this.detail = detail;
  }
}

async function getFfmpeg(onLoadProgress?: (fraction: number) => void) {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { toBlobURL } = await import('@ffmpeg/util');

  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
  }
  const ffmpeg = ffmpegInstance;

  if (!ffmpeg.loaded) {
    if (!loadPromise) {
      loadPromise = (async () => {
        onLoadProgress?.(0.05);
        const [coreURL, wasmURL] = await Promise.all([
          toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
          toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
        ]);
        onLoadProgress?.(0.5);
        await ffmpeg.load({ coreURL, wasmURL });
        onLoadProgress?.(1);
      })().catch((err) => {
        loadPromise = null; // allow retry on next call
        throw new RehabError(
          'The rehabilitation engine would not start.',
          err instanceof Error ? err.message : 'Could not load the FFmpeg WebAssembly engine, likely a network or browser support issue.',
        );
      });
    }
    await loadPromise;
  }

  return ffmpeg;
}

function safeName(ext: string): string {
  return `work_input.${ext.replace(/[^a-z0-9]/gi, '') || 'mp4'}`;
}

export interface EncodeOutcome {
  blob: Blob;
  width: number;
  height: number;
  fps: number;
  codec: string;
  dynamicRange: DynamicRange;
}

export async function rehabilitateVideo(
  file: File,
  meta: VideoMetadata,
  onProgress: ProgressHandler,
): Promise<EncodeOutcome> {
  onProgress(0, 'Waking up the rehabilitation engine...');
  const ffmpeg = await getFfmpeg((f) => onProgress(f * 0.25, 'Downloading the rehabilitation engine...'));

  const { fetchFile } = await import('@ffmpeg/util');

  const inputExt = meta.container === 'unknown' ? (file.name.split('.').pop() ?? 'mp4') : meta.container;
  const inputName = safeName(inputExt);
  const outputName = 'output.mp4';

  let lastReportedProgress = 0.25;
  const progressListener = ({ progress }: { progress: number }) => {
    if (!Number.isFinite(progress) || progress < 0) return;
    const clamped = Math.min(Math.max(progress, 0), 1);
    lastReportedProgress = 0.25 + clamped * 0.7;
    onProgress(lastReportedProgress);
  };
  ffmpeg.on('progress', progressListener);

  try {
    onProgress(0.25, 'Feeding the video into the machine...');
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const target = buildEncodeTarget(meta);
    const plan = buildFilterPlan(meta);

    const baseArgs = ['-i', inputName];
    const codecArgs = [
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-profile:v', 'high',
      '-pix_fmt', 'yuv420p',
      '-r', String(target.fps),
      '-b:v', `${target.videoBitrateKbps}k`,
      '-maxrate', `${Math.round(target.videoBitrateKbps * 1.3)}k`,
      '-bufsize', `${target.videoBitrateKbps * 2}k`,
      '-movflags', '+faststart',
    ];
    const audioArgs = meta.hasAudio
      ? ['-c:a', 'aac', '-b:a', `${target.audioBitrateKbps}k`, '-ar', '44100']
      : ['-an'];

    async function attempt(filterArgs: string[]): Promise<void> {
      await ffmpeg.exec([...baseArgs, ...filterArgs, ...codecArgs, ...audioArgs, '-y', outputName]);
    }

    try {
      if (plan.usesFilterComplex && plan.filterComplex) {
        onProgress(0.28, 'Building the blurred stage backdrop...');
        await attempt(['-filter_complex', plan.filterComplex, '-map', '[outv]', '-map', '0:a?']);
      } else if (plan.simpleFilter) {
        await attempt(['-vf', plan.simpleFilter]);
      } else {
        await attempt(['-vf', buildFallbackFilter()]);
      }
    } catch (firstErr) {
      // Retry once with the simplest possible filter graph — covers devices/cores
      // where the blur/overlay filter chain isn't available or runs out of memory.
      onProgress(lastReportedProgress, 'That approach did not work. Trying a simpler one...');
      try {
        await attempt(['-vf', buildFallbackFilter()]);
      } catch (secondErr) {
        throw new RehabError(
          'The rehabilitation failed.',
          describeFfmpegError(secondErr ?? firstErr),
        );
      }
    }

    onProgress(0.96, 'Wrapping things up...');
    const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
    const bytes = new Uint8Array(data.length);
    bytes.set(data);
    const blob = new Blob([bytes.buffer], { type: 'video/mp4' });

    await cleanupFiles(ffmpeg, [inputName, outputName]);

    onProgress(1, 'Done.');
    return {
      blob,
      width: target.width,
      height: target.height,
      fps: target.fps,
      codec: 'H.264',
      dynamicRange: 'SDR',
    };
  } catch (err) {
    await cleanupFiles(ffmpeg, [inputName, outputName]);
    if (err instanceof RehabError) throw err;
    throw new RehabError('The rehabilitation failed.', describeFfmpegError(err));
  } finally {
    ffmpeg.off('progress', progressListener);
  }
}

async function cleanupFiles(ffmpeg: import('@ffmpeg/ffmpeg').FFmpeg, names: string[]) {
  for (const name of names) {
    try {
      await ffmpeg.deleteFile(name);
    } catch {
      /* file may not exist — fine */
    }
  }
}

function describeFfmpegError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/memory/i.test(message) || /out of memory/i.test(message)) {
    return 'Your browser ran out of memory while processing this video. Try a shorter or lower-resolution file, or close a few tabs.';
  }
  if (/network|fetch/i.test(message)) {
    return 'The rehabilitation engine could not be downloaded. Check your connection and try again.';
  }
  if (message) return message;
  return 'An unknown error occurred inside the video engine. Try a different file.';
}

export function terminateEngine() {
  if (ffmpegInstance?.loaded) {
    try {
      ffmpegInstance.terminate();
    } catch {
      /* ignore */
    }
  }
  ffmpegInstance = null;
  loadPromise = null;
}
