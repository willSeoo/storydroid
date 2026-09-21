import type { VideoMetadata } from '../types';
import { classifyOrientation } from './metadata';

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** Generic reusable one-liners, used when nothing more specific applies. */
export const GENERIC_DIAGNOSES = [
  'Your video has been diagnosed with excessive resolution.',
  "Instagram is preparing to destroy this file. We're trying to negotiate.",
  'Your phone recorded a movie. Instagram requested a Story.',
  'Your video is fine. The upload pipeline is the problem.',
  'Extremely Android.',
  'A perfectly normal video, by a phone that does not understand restraint.',
];

export const PROCESSING_MESSAGES = [
  'Inspecting the pixels...',
  'Negotiating with Instagram...',
  'Removing unnecessary 4K suffering...',
  'Teaching your video how to behave...',
  'Converting HDR into something Instagram can understand...',
  'Compressing responsibly...',
  'Asking the GPU for emotional support...',
  'Arranging pixels into a socially acceptable format...',
  'Applying emotional support bitrate...',
  'The video is learning humility...',
  'Almost there...',
];

export const STATUS_MESSAGES = [
  '4K detected. Nobody asked for this.',
  '60 FPS? In this economy?',
  'HDR detected. We are contacting the authorities.',
  'HEVC detected. Instagram is pretending not to know you.',
  'Compressing without completely ruining everything.',
];

interface DiagnosisResult {
  headline: string;
  detail: string | null;
}

export function buildDiagnosis(meta: VideoMetadata): DiagnosisResult {
  const orientation = classifyOrientation(meta);
  const seed = seedFromString(meta.fileName + meta.fileSize);
  const isHuge = meta.width >= 3840 || meta.height >= 3840;
  const isHighFps = (meta.fps ?? 0) >= 50;
  const isHevc = meta.codec.includes('HEVC');
  const isHdr = meta.dynamicRange === 'HDR';

  // Highest-signal, most specific diagnosis wins.
  if (isHuge && isHighFps) {
    return {
      headline: 'Extremely Android.',
      detail: `${Math.round(meta.width)}×${Math.round(meta.height)} at ${meta.fps} FPS for a 1080×1920 Instagram Story. Bro really brought a cinema camera to a WhatsApp argument.`,
    };
  }
  if (isHdr && isHevc) {
    return {
      headline: 'HDR + HEVC detected.',
      detail: 'Your phone is very proud of this footage. Instagram, unfortunately, could not care less.',
    };
  }
  if (isHdr) {
    return {
      headline: 'HDR detected.',
      detail: 'We are contacting the authorities. Converting to SDR so Instagram stops guessing at your colors.',
    };
  }
  if (isHuge) {
    return {
      headline: `${Math.round(meta.width)}×${Math.round(meta.height)} detected.`,
      detail: 'Nobody asked for this. Downscaling to something a Story can actually hold.',
    };
  }
  if (isHighFps) {
    return {
      headline: `${meta.fps} FPS detected.`,
      detail: 'In this economy? Bringing it down to a reasonable 30.',
    };
  }
  if (isHevc) {
    return {
      headline: 'HEVC detected.',
      detail: 'Instagram is pretending not to know you. Converting to H.264, which it will suddenly recognize.',
    };
  }
  if (orientation === 'landscape') {
    return {
      headline: 'Wrong shape entirely.',
      detail: 'This video is lying down. Instagram Stories stand up. We will not crop your friends out to fix this.',
    };
  }
  if (orientation === 'square') {
    return {
      headline: 'A perfect square, and a perfectly wrong shape.',
      detail: 'Padding this out to 9:16 without losing anyone at the edges.',
    };
  }
  if (orientation === 'portrait-9x16') {
    return {
      headline: 'Already the right shape.',
      detail: "Suspicious. We'll still double check everything else.",
    };
  }
  return { headline: pick(GENERIC_DIAGNOSES, seed), detail: null };
}

export function randomProcessingMessage(seed: number): string {
  return pick(PROCESSING_MESSAGES, seed);
}
