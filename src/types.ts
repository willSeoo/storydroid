export type VideoContainer = 'mp4' | 'mov' | 'webm' | 'unknown';

export type DynamicRange = 'SDR' | 'HDR' | 'unknown';

export interface VideoMetadata {
  fileName: string;
  fileSize: number; // bytes
  container: VideoContainer;
  width: number;
  height: number;
  duration: number; // seconds
  fps: number | null;
  codec: string; // human readable e.g. "HEVC (H.265)", "H.264", "VP9"
  codecRaw: string | null; // raw fourcc / codec id
  dynamicRange: DynamicRange;
  hasAudio: boolean;
  aspectRatio: number; // width / height
  aspectRatioLabel: string; // e.g. "16:9"
  rotation: number; // degrees, from track matrix, 0/90/180/270
}

export type OrientationBucket = 'portrait-9x16' | 'portrait-other' | 'square' | 'landscape';

export interface EncodeTarget {
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
}

export interface FilterPlan {
  /** the ffmpeg -vf filtergraph string */
  filterComplex: string | null;
  simpleFilter: string | null;
  strategy: 'passthrough-scale' | 'blur-pad' | 'crop';
  usesFilterComplex: boolean;
}

export type ProcessingStage =
  | 'idle'
  | 'loading-engine'
  | 'analyzing'
  | 'encoding'
  | 'finalizing'
  | 'done'
  | 'error';

export interface ProcessingResult {
  blob: Blob;
  url: string;
  outMeta: {
    width: number;
    height: number;
    fps: number;
    codec: string;
    dynamicRange: DynamicRange;
    size: number;
  };
}

export interface AppError {
  title: string;
  detail: string;
}
