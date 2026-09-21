import type { DynamicRange, OrientationBucket, VideoContainer, VideoMetadata } from '../types';
import { codecFourccToLabel, isHdrTransfer, parseMp4 } from './mp4Parser';
import { parseWebm, webmCodecLabel } from './webmParser';

function detectContainer(bytes: Uint8Array): VideoContainer {
  // EBML header for Matroska/WebM
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return 'webm';
  }
  // ISO-BMFF (mp4/mov) — look for 'ftyp' at offset 4
  if (bytes.length > 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand.startsWith('qt')) return 'mov';
    return 'mp4';
  }
  return 'unknown';
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function aspectRatioLabel(width: number, height: number): string {
  if (!width || !height) return 'Unknown';
  const divisor = gcd(Math.round(width), Math.round(height));
  const w = Math.round(width) / divisor;
  const h = Math.round(height) / divisor;
  // Prefer familiar labels when close to a common ratio
  const ratio = width / height;
  const common: [number, string][] = [
    [9 / 16, '9:16'],
    [16 / 9, '16:9'],
    [1, '1:1'],
    [4 / 5, '4:5'],
    [3 / 4, '3:4'],
    [4 / 3, '4:3'],
  ];
  for (const [r, label] of common) {
    if (Math.abs(ratio - r) < 0.02) return label;
  }
  if (w <= 64 && h <= 64) return `${w}:${h}`;
  return `${ratio.toFixed(2)}:1`;
}

async function readVideoElementMeta(file: File): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.src = url;
    const cleanup = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => {
      const result = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      };
      cleanup();
      resolve(result);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('Could not read video metadata — this file may be corrupt or unsupported.'));
    };
  });
}

export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  const headerBuf = await file.slice(0, Math.min(file.size, 4_000_000)).arrayBuffer();
  const headerBytes = new Uint8Array(headerBuf);
  const container = detectContainer(headerBytes);

  // Reliable cross-browser baseline
  let elementMeta = { width: 0, height: 0, duration: 0 };
  try {
    elementMeta = await readVideoElementMeta(file);
  } catch {
    /* fall through — we'll rely on container parsing alone */
  }

  let width = elementMeta.width;
  let height = elementMeta.height;
  let duration = elementMeta.duration;
  let fps: number | null = null;
  let codecLabel = 'Unknown';
  let codecRaw: string | null = null;
  let dynamicRange: DynamicRange = 'unknown';
  let hasAudio = false;
  let rotation = 0;

  if (container === 'mp4' || container === 'mov') {
    try {
      // Box offsets can point past our 4MB header slice for large files with
      // trailing moov atoms, so fall back to reading the whole file only if needed.
      let parsed = parseMp4(headerBuf);
      if (parsed.tracks.every((t) => !t.handlerType)) {
        const fullBuf = await file.arrayBuffer();
        parsed = parseMp4(fullBuf);
      }
      const videoTrack = parsed.tracks.find((t) => t.handlerType === 'vide');
      const audioTrack = parsed.tracks.find((t) => t.handlerType === 'soun');
      hasAudio = !!audioTrack;

      if (videoTrack) {
        if (videoTrack.width && videoTrack.height) {
          width = videoTrack.width;
          height = videoTrack.height;
        }
        rotation = videoTrack.rotation;
        if (videoTrack.timescale && videoTrack.sampleCount && videoTrack.duration) {
          const trackDurationSec = videoTrack.duration / videoTrack.timescale;
          if (trackDurationSec > 0) fps = Math.round((videoTrack.sampleCount / trackDurationSec) * 100) / 100;
        }
        const { label, raw } = codecFourccToLabel(videoTrack.codec);
        codecLabel = label;
        codecRaw = raw;
        if (isHdrTransfer(videoTrack.hdrTransfer)) {
          dynamicRange = 'HDR';
        } else if (videoTrack.hdrTransfer !== null) {
          dynamicRange = 'SDR';
        }
      }
    } catch {
      /* keep whatever we already have from the video element */
    }
  } else if (container === 'webm') {
    try {
      const parsed = parseWebm(headerBuf);
      if (parsed.width) width = parsed.width;
      if (parsed.height) height = parsed.height;
      codecLabel = webmCodecLabel(parsed.codecId);
      codecRaw = parsed.codecId;
      dynamicRange = 'SDR'; // HDR WebM (VP9 Profile 2) is rare enough to not special-case here
    } catch {
      /* keep browser-derived values */
    }
  }

  // If rotation implies a 90/270 swap, the "displayed" dimensions are transposed
  const displayWidth = rotation === 90 || rotation === 270 ? height : width;
  const displayHeight = rotation === 90 || rotation === 270 ? width : height;

  const aspectRatio = displayHeight ? displayWidth / displayHeight : 0;

  return {
    fileName: file.name,
    fileSize: file.size,
    container,
    width: displayWidth || width,
    height: displayHeight || height,
    duration: duration || 0,
    fps,
    codec: codecLabel,
    codecRaw,
    dynamicRange,
    hasAudio,
    aspectRatio,
    aspectRatioLabel: aspectRatioLabel(displayWidth || width, displayHeight || height),
    rotation,
  };
}

export function classifyOrientation(meta: VideoMetadata): OrientationBucket {
  const target = 9 / 16;
  if (Math.abs(meta.aspectRatio - target) < 0.02) return 'portrait-9x16';
  if (Math.abs(meta.aspectRatio - 1) < 0.03) return 'square';
  if (meta.aspectRatio < 1) return 'portrait-other';
  return 'landscape';
}
