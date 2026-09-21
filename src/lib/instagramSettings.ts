import type { EncodeTarget, FilterPlan, VideoMetadata } from '../types';
import { classifyOrientation } from './metadata';

export const TARGET_WIDTH = 1080;
export const TARGET_HEIGHT = 1920;
export const TARGET_FPS = 30;

export function buildEncodeTarget(meta: VideoMetadata): EncodeTarget {
  // Longer clips need a lower ceiling to stay in a sane file-size range;
  // short clips can afford a richer bitrate.
  let videoBitrateKbps = 6000;
  if (meta.duration > 30) videoBitrateKbps = 4500;
  if (meta.duration > 60) videoBitrateKbps = 3500;

  return {
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    fps: TARGET_FPS,
    videoCodec: 'H.264',
    audioCodec: 'AAC',
    videoBitrateKbps,
    audioBitrateKbps: 128,
  };
}

/**
 * Decide how to fit the source frame into 1080x1920.
 * - Already ~9:16: scale + tiny pad only (no meaningful crop).
 * - Everything else: blurred, filled background behind a fully-visible,
 *   centered copy of the original frame. Nothing gets cut off.
 */
export function buildFilterPlan(meta: VideoMetadata): FilterPlan {
  const orientation = classifyOrientation(meta);

  if (orientation === 'portrait-9x16') {
    const simple = `scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=decrease,pad=${TARGET_WIDTH}:${TARGET_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=yuv420p`;
    return { filterComplex: null, simpleFilter: simple, strategy: 'passthrough-scale', usesFilterComplex: false };
  }

  const filterComplex =
    `[0:v]split=2[bg][fg];` +
    `[bg]scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=increase,` +
    `crop=${TARGET_WIDTH}:${TARGET_HEIGHT},gblur=sigma=25,eq=brightness=-0.05[bgblur];` +
    `[fg]scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=decrease[fgfit];` +
    `[bgblur][fgfit]overlay=(W-w)/2:(H-h)/2,setsar=1,format=yuv420p[outv]`;

  return { filterComplex, simpleFilter: null, strategy: 'blur-pad', usesFilterComplex: true };
}

/** A simpler, filter-light fallback used if the blurred-background graph fails on this device. */
export function buildFallbackFilter(): string {
  return `scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=decrease,pad=${TARGET_WIDTH}:${TARGET_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=yuv420p`;
}
