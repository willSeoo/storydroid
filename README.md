# Android Video Rehabilitation Center (AVRC)

> Your Android video isn't bad. Instagram just doesn't understand it.

A client-side Instagram Story video optimizer. Upload an Android-recorded
video, get back a rehabilitated 1080×1920 / 30 FPS / H.264 / AAC MP4 —
entirely processed in your browser. Nothing is ever uploaded anywhere.

## Tech stack

- React + Vite + TypeScript
- Tailwind CSS v4
- [`@ffmpeg/ffmpeg`](https://github.com/ffmpegwasm/ffmpeg.wasm) (ffmpeg.wasm) for local video transcoding
- No backend, no database, no auth

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL. Drop in a video and click **Begin Treatment**.

## Building for production

```bash
npm run build
```

Outputs a fully static site to `dist/`. Deploy `dist/` to any static host —
Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3, etc. No server-side
configuration is required.

**Note on the ffmpeg engine:** the app lazily downloads the ffmpeg.wasm
core (`ffmpeg-core.js` / `ffmpeg-core.wasm`, ~30 MB) from a CDN
(`unpkg.com`) the first time someone clicks "Begin Treatment," then caches
it in the browser. This is the *processing engine*, not user data — the
uploaded video itself never leaves the device. If you'd rather self-host
the engine (e.g. for stricter CSPs or offline use), copy the two core
files into `public/ffmpeg-core/` and update `CORE_BASE_URL` in
`src/lib/ffmpegEngine.ts` to point at `/ffmpeg-core`.

This build intentionally uses the **single-threaded** ffmpeg core, so it
works on any static host without `Cross-Origin-Opener-Policy` /
`Cross-Origin-Embedder-Policy` headers. If you want multi-threaded (faster)
encoding, switch to `@ffmpeg/core-mt` and make sure your host sends those
two headers.

## How it decides what to do

1. **Metadata extraction** (`src/lib/metadata.ts`, `mp4Parser.ts`,
   `webmParser.ts`) reads container boxes directly — no ffmpeg needed —
   to get resolution, fps, codec, HDR signaling, audio presence, and
   rotation for the diagnosis card, *before* the (large) ffmpeg engine is
   ever downloaded.
2. **Filter plan** (`src/lib/instagramSettings.ts`) decides how to fit the
   source frame into 1080×1920:
   - Already ~9:16 → scale + minimal pad (no unnecessary crop).
   - Anything else (landscape, square, odd aspect) → a blurred, filled
     background behind a fully-visible, centered copy of the original
     frame. Nothing gets cropped out.
3. **Encoding** (`src/lib/ffmpegEngine.ts`) runs the transcode with a
   bitrate scaled to clip length, H.264 + AAC, `+faststart` for instant
   playback, and a graceful fallback to a simpler filter graph if the
   primary one fails on a given device.

## Known limitations / honest caveats

- **HDR → SDR** is currently a straightforward re-encode to `yuv420p`
  without a dedicated PQ/HLG tone-mapping pass (which needs `libzimg`
  filters that aren't guaranteed to be present in every ffmpeg.wasm core
  build). This reliably strips the HDR signaling that breaks Instagram's
  player, but very bright HDR footage may look slightly different than a
  true tone-mapped conversion. A `zscale`/`tonemap` pass can be added in
  `ffmpegEngine.ts` if your core build supports it.
- **FPS detection for WebM** files isn't attempted (Matroska doesn't store
  a simple constant frame rate the way MP4 does); the diagnosis card will
  show "Unknown" for FPS on WebM uploads, but encoding still works fine.
- Processing large/long videos in a wasm-based encoder is slower than
  native ffmpeg — this is a browser limitation, not a bug. The UI is
  built to stay responsive throughout (progress events, no UI freezing).

## Project structure

```
src/
  types.ts                    shared types
  lib/
    mp4Parser.ts               ISO-BMFF box walker (no ffmpeg needed)
    webmParser.ts               minimal EBML scanner
    metadata.ts                 orchestrates metadata extraction
    memeCopy.ts                 reusable diagnosis / status copy
    instagramSettings.ts        target output + filter graph logic
    ffmpegEngine.ts             ffmpeg.wasm loading + transcoding
    format.ts                   byte/duration formatting
  components/
    Logo.tsx, Header.tsx
    UploadZone.tsx
    PrivacyNotice.tsx
    VideoPreview.tsx
    VideoMetadataCard.tsx       "Patient Information"
    DiagnosisCard.tsx
    ProcessingView.tsx
    BeforeAfter.tsx
    ResultView.tsx
    ErrorView.tsx
    MemeMessage.tsx
  App.tsx                      state machine tying it together
```

## License

Do whatever you want with it.
