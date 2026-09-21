// A minimal, dependency-free MP4/MOV "box" (atom) walker.
// It reads just enough of the ISO-BMFF structure to pull out the facts
// we need for a diagnosis card: dimensions, timescale/duration, sample
// timing (for fps), codec fourcc, HDR color params, audio track presence,
// and any rotation baked into the track matrix.
//
// This intentionally does NOT try to be a full demuxer. It walks boxes,
// recurses into known "container" boxes, and reads fields out of the
// handful of leaf boxes that matter.

interface TrackInfo {
  handlerType: string | null; // 'vide' | 'soun' | ...
  width: number;
  height: number;
  timescale: number;
  duration: number; // in track timescale units
  sampleCount: number;
  codec: string | null; // fourcc, e.g. 'avc1', 'hvc1', 'hev1'
  rotation: number;
  hdrTransfer: number | null; // colr transfer characteristics
  colorPrimaries: number | null;
}

export interface Mp4ParseResult {
  brand: string | null;
  tracks: TrackInfo[];
}

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, false);
}
function readU16(view: DataView, offset: number): number {
  return view.getUint16(offset, false);
}
function fourcc(view: DataView, offset: number): string {
  let s = '';
  for (let i = 0; i < 4; i++) s += String.fromCharCode(view.getUint8(offset + i));
  return s;
}

const CONTAINER_BOXES = new Set([
  'moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'udta', 'meta', 'dinf',
]);

export function parseMp4(buffer: ArrayBuffer): Mp4ParseResult {
  const view = new DataView(buffer);
  const tracks: TrackInfo[] = [];
  let brand: string | null = null;

  function walk(start: number, end: number, ctx: { track?: TrackInfo }) {
    let offset = start;
    while (offset + 8 <= end) {
      let size = readU32(view, offset);
      const type = fourcc(view, offset + 4);
      let headerSize = 8;
      if (size === 1) {
        // 64-bit extended size
        const hi = readU32(view, offset + 8);
        const lo = readU32(view, offset + 12);
        size = hi * 2 ** 32 + lo;
        headerSize = 16;
      } else if (size === 0) {
        size = end - offset; // extends to end of file
      }
      if (size < headerSize || offset + size > end + 8) break;

      const boxStart = offset + headerSize;
      const boxEnd = offset + size;

      if (type === 'ftyp' && !brand) {
        brand = fourcc(view, boxStart);
      } else if (type === 'trak') {
        const t: TrackInfo = {
          handlerType: null,
          width: 0,
          height: 0,
          timescale: 0,
          duration: 0,
          sampleCount: 0,
          codec: null,
          rotation: 0,
          hdrTransfer: null,
          colorPrimaries: null,
        };
        tracks.push(t);
        walk(boxStart, boxEnd, { track: t });
      } else if (CONTAINER_BOXES.has(type)) {
        walk(boxStart, boxEnd, ctx);
      } else if (type === 'tkhd' && ctx.track) {
        try {
          const version = view.getUint8(boxStart);
          const matrixOffset = version === 1 ? boxStart + 4 + 4 + 8 + 8 + 4 + 4 + 2 + 2 + 2 + 2 : boxStart + 4 + 4 + 4 + 4 + 4 + 4 + 2 + 2 + 2 + 2;
          // width/height are fixed-point 16.16 right after the 9-value matrix (36 bytes)
          const wOffset = matrixOffset + 36;
          const widthFixed = readU32(view, wOffset);
          const heightFixed = readU32(view, wOffset + 4);
          ctx.track.width = widthFixed / 65536;
          ctx.track.height = heightFixed / 65536;
          // rotation from matrix a,b,c,d (2.30 fixed point) at matrixOffset
          const a = view.getInt32(matrixOffset, false) / 65536;
          const b = view.getInt32(matrixOffset + 4, false) / 65536;
          const c = view.getInt32(matrixOffset + 8, false) / 65536;
          const dv = view.getInt32(matrixOffset + 12, false) / 65536;
          const rot = Math.round((Math.atan2(b, a) * 180) / Math.PI);
          ctx.track.rotation = ((rot % 360) + 360) % 360;
          void c;
          void dv;
        } catch {
          /* ignore malformed tkhd */
        }
      } else if (type === 'mdhd' && ctx.track) {
        try {
          const version = view.getUint8(boxStart);
          if (version === 1) {
            ctx.track.timescale = readU32(view, boxStart + 4 + 8 + 8);
            const hi = readU32(view, boxStart + 4 + 8 + 8 + 4);
            const lo = readU32(view, boxStart + 4 + 8 + 8 + 8);
            ctx.track.duration = hi * 2 ** 32 + lo;
          } else {
            ctx.track.timescale = readU32(view, boxStart + 4 + 4 + 4);
            ctx.track.duration = readU32(view, boxStart + 4 + 4 + 4 + 4);
          }
        } catch {
          /* ignore */
        }
      } else if (type === 'hdlr' && ctx.track) {
        try {
          ctx.track.handlerType = fourcc(view, boxStart + 8);
        } catch {
          /* ignore */
        }
      } else if (type === 'stsd' && ctx.track) {
        try {
          const entryCount = readU32(view, boxStart + 4);
          if (entryCount > 0) {
            const entryStart = boxStart + 8;
            const entrySize = readU32(view, entryStart);
            const entryFourcc = fourcc(view, entryStart + 4);
            ctx.track.codec = entryFourcc;
            // Video sample entries have a nested box list starting at offset 78 within the entry
            if (ctx.track.handlerType === 'vide') {
              const inner = entryStart + 78;
              const innerEnd = entryStart + entrySize;
              walk(inner, innerEnd, ctx);
            }
          }
        } catch {
          /* ignore */
        }
      } else if (type === 'colr' && ctx.track) {
        try {
          const colorType = fourcc(view, boxStart);
          if (colorType === 'nclx' || colorType === 'nclc') {
            ctx.track.colorPrimaries = readU16(view, boxStart + 4);
            ctx.track.hdrTransfer = readU16(view, boxStart + 6);
          }
        } catch {
          /* ignore */
        }
      } else if (type === 'stts' && ctx.track) {
        try {
          const entryCount = readU32(view, boxStart + 4);
          let total = 0;
          let p = boxStart + 8;
          for (let i = 0; i < entryCount && p + 8 <= boxEnd; i++) {
            const count = readU32(view, p);
            total += count;
            p += 8;
          }
          ctx.track.sampleCount = total;
        } catch {
          /* ignore */
        }
      }

      offset += size;
    }
  }

  walk(0, buffer.byteLength, {});
  return { brand, tracks };
}

export function codecFourccToLabel(fourccCode: string | null): { label: string; raw: string | null } {
  if (!fourccCode) return { label: 'Unknown', raw: null };
  const map: Record<string, string> = {
    avc1: 'H.264',
    avc3: 'H.264',
    hvc1: 'HEVC (H.265)',
    hev1: 'HEVC (H.265)',
    av01: 'AV1',
    mp4v: 'MPEG-4 Visual',
    vp09: 'VP9',
  };
  return { label: map[fourccCode] ?? fourccCode.toUpperCase(), raw: fourccCode };
}

// Transfer characteristic codes per ISO/IEC 23001-8. 16 = PQ (HDR10/HLG uses 18), 18 = HLG.
export function isHdrTransfer(transfer: number | null): boolean {
  if (transfer === null) return false;
  return transfer === 16 || transfer === 18;
}
