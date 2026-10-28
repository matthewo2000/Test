# Apex Roads — local development copy

This is a locally runnable copy of your existing Apex Roads Next.js prototype. The original files are preserved separately in the upload; this folder arranges them into the standard Next.js App Router structure.

## Requirements
- Node.js 20 or newer
- npm

## Run locally
1. Open a terminal in this folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Optional: copy `.env.example` to `.env.local` and add your YouTube Data API v3 key as `YOUTUBE_API_KEY=...`. Without a key, the app still runs but live video results are disabled.
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000 in your browser.

## Test a production build locally
```bash
npm run build
npm run start
```
Then open http://localhost:3000.

## Existing features retained
- MapLibre map with dark CARTO tiles
- Existing 11 curated road entries
- Road search/filter and detail panel
- YouTube search endpoint and video overlay

## Notes
- Road pins are approximate, not verified road geometries yet.
- Keep `.env.local` private and never commit API keys.
- New road lines/GPX tracks should be added incrementally after you confirm the local copy runs.
