// Very small EBML scanner for WebM files. WebM is a subset of Matroska.
// We don't implement a full EBML reader; we just scan for the handful of
// element IDs we care about (CodecID, PixelWidth, PixelHeight) using their
// known byte signatures. Good enough for a "best effort" diagnosis card —
// full accuracy isn't required since ffmpeg does the real work later.

export interface WebmParseResult {
  codecId: string | null;
  width: number | null;
  height: number | null;
}

const ID_CODEC_ID = [0x86];
const ID_PIXEL_WIDTH = [0xb0];
const ID_PIXEL_HEIGHT = [0xba];

function matchesId(bytes: Uint8Array, offset: number, id: number[]): boolean {
  for (let i = 0; i < id.length; i++) {
    if (bytes[offset + i] !== id[i]) return false;
  }
  return true;
}

function readVint(bytes: Uint8Array, offset: number): { value: number; length: number } {
  const first = bytes[offset];
  let length = 1;
  let mask = 0x80;
  while (length <= 8 && !(first & mask)) {
    mask >>= 1;
    length++;
  }
  let value = first & (mask - 1);
  for (let i = 1; i < length; i++) {
    value = value * 256 + bytes[offset + i];
  }
  return { value, length };
}

export function parseWebm(buffer: ArrayBuffer): WebmParseResult {
  const bytes = new Uint8Array(buffer);
  const result: WebmParseResult = { codecId: null, width: null, height: null };
  const limit = Math.min(bytes.length, 2_000_000); // scan first ~2MB, headers live near the top

  for (let i = 0; i < limit - 8; i++) {
    if (matchesId(bytes, i, ID_CODEC_ID) && !result.codecId) {
      try {
        const { value: size, length: sizeLen } = readVint(bytes, i + 1);
        if (size > 0 && size < 64) {
          const strStart = i + 1 + sizeLen;
          let s = '';
          for (let j = 0; j < size; j++) {
            const c = bytes[strStart + j];
            if (c === 0) break;
            s += String.fromCharCode(c);
          }
          if (/^[A-Z0-9_/.]+$/.test(s)) result.codecId = s;
        }
      } catch {
        /* ignore */
      }
    }
    if (matchesId(bytes, i, ID_PIXEL_WIDTH) && result.width === null) {
      const parsed = readUint(bytes, i + 1);
      if (parsed !== null) result.width = parsed;
    }
    if (matchesId(bytes, i, ID_PIXEL_HEIGHT) && result.height === null) {
      const parsed = readUint(bytes, i + 1);
      if (parsed !== null) result.height = parsed;
    }
    if (result.codecId && result.width && result.height) break;
  }

  return result;
}

function readUint(bytes: Uint8Array, offset: number): number | null {
  try {
    const { value: size, length: sizeLen } = readVint(bytes, offset);
    if (size <= 0 || size > 8) return null;
    const start = offset + sizeLen;
    let value = 0;
    for (let i = 0; i < size; i++) value = value * 256 + bytes[start + i];
    if (value <= 0 || value > 20000) return null; // sanity bound for a pixel dimension
    return value;
  } catch {
    return null;
  }
}

export function webmCodecLabel(codecId: string | null): string {
  if (!codecId) return 'Unknown';
  if (codecId.includes('VP9')) return 'VP9';
  if (codecId.includes('VP8')) return 'VP8';
  if (codecId.includes('AV1')) return 'AV1';
  return codecId;
}
