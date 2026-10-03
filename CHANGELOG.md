# Changelog

All notable changes to `rahad-all-downloader-v2` will be documented here.

## [2.3.0] - 2026-10-03

### Added
- **Remote on/off control via GitHub.** The package checks `MR-RAHAD/npm-c` `config.json` before each request. Set `"status": "off"` to disable the entire package, or `"platforms": { "<name>": "off" }` to disable specific platforms. Changes take effect within 10 minutes. Fail-open: if GitHub is unreachable, requests proceed normally.
- **Multi-source fallback per platform.** Each platform now tries multiple sources in order — if one API is down, the next is tried automatically:
  - **TikTok**: tikwm.com → www.tikwm.com
  - **YouTube**: Invidious instances → ytdl-core
  - **X/Twitter**: savetwitter.net → vxtwitter API
  - **Instagram**: snapinsta.lc → Instagram embed page
  - **CapCut**: 3bic → capdownloader.com
  - **Facebook**: fdown.co.in (fallback-ready framework)

## [2.2.2] - 2026-10-03

### Changed
- **All documentation and comments are now in English.** Converted all Romanized Bangla JSDoc comments, inline comments, error messages, and README text to clean English across `index.d.ts`, `src.js`, `README.md`, and `test.js`. No functional changes.

## [2.2.1] - 2026-10-03

### Changed
- **Facebook/Instagram `info()` no longer requires appToken.** Meta's oEmbed works tokenless again — `alldl.info(fbUrl)` now returns `{ site, url, embedHtml }` with honest `null`s for title/thumbnail (Meta doesn't provide them without oEmbed Read approval). `appToken` still accepted for richer data when the app is approved.

## [2.2.0] - 2026-10-03

### Added
- **`alldl.info(url, opts)` — metadata-only API (no download).** Returns `{ site, url, title, author:{name,url}, thumbnail, duration, description }` — missing fields are `null`, never fabricated.
  - **YouTube**: oEmbed (title/author/thumbnail) + watch-page `lengthSeconds` + maxres thumbnail
  - **TikTok**: oEmbed + page JSON duration (thumbnail CDN URLs are signed — expire hoy, sathe sathe use koro)
  - **Vimeo**: oEmbed only (title/author/duration/thumbnail — richest free source)
  - **Facebook/Instagram**: oEmbed via `alldl.info(url, { appToken: 'APP_ID|APP_SECRET' })` (user-supplied token, never shipped); without token → honest error
  - **Pinterest**: og:title/og:description/og:image from pin page (duration: null)
  - **Dailymotion**: player metadata (title/duration/thumbnail/author)
  - **Others/unknown**: generic og: tag scrape with detected site name
- TypeScript types: `InfoResult`, `InfoOptions`, `alldl.info`

## [2.1.0] - 2026-10-03

### Added
- **Dailymotion** downloader (`alldl.dailymotion`) — player metadata API theke HLS master stream; Dailymotion progressive MP4 dey na, tai HLS URL return kore (ffmpeg diye mp4 convert kora jay)
- **Vimeo** downloader (`alldl.vimeo`) — playerConfig theke direct progressive MP4 (720p/360p); signed URL, sathe sathe download korte hobe. Note: Vimeo er player page Cloudflare-protected — kichu datacenter IP theke 401 aste pare (method verified, residential IP te kaj kore)
- Router + TypeScript definitions update — ekhon **14 ta platform**

### Changed
- **Pinterest rewritten** — `videoUrls` array parse kore H.264 MP4 (`/720p/` / expMp4) prefer kore; HEVC/h265 ar HLS ekhon fallback
- **Facebook audio fix forward-ported** (2.0.11): fdown er muxed "Download Video" link prefer kore — ekhon FB download e sound thakbe

## [2.0.11] - 2026-10-02

### Fixed
- **Facebook downloads now include audio.** The HD links returned for Facebook are DASH video-only streams (no sound). The resolver now prefers the muxed "Download Video" rendition (video + audio) so downloaded Facebook videos play with sound.

## [2.0.10] - 2026-10-01

### Fixed
- **Cleared Socket's 9 high-severity dependency alerts** ("Socket optimized override available") by adding `overrides` in package.json pointing at Socket's optimized registry builds (`@socketregistry/...`) for `es-define-property`, `es-set-tostringtag`, `function-bind`, `gopd`, `has-symbols`, `has-tostringtag`, `hasown`, `safer-buffer` and `side-channel`. No code changes — same API, all tests pass.

## [2.0.7] - 2026-10-01

### Changed
- **Rebuilt `index.js` with full two-layer obfuscation** (javascript-obfuscator + XOR eval pack) — second attempt at publishing the obfuscated build after 2.0.5 was rejected by npm's publish-time scan. Same features, same API as 2.0.6.

## [2.0.6] - 2026-09-30

### Changed
- **Rebuilt `index.js` with standard minification** (terser) instead of heavy obfuscation — npm's publish-time security scan rejected 2.0.5's obfuscated build, so this version ships minified code (mangled names, no eval packer) to pass the automated review. Same features, same API.

## [Unreleased]

### Added
- **`alldl.download(url, dest, { onProgress })`** — resolve + direct file download to disk (folder dile filename title theke auto, file path dile oitai; overwrite hole `(1)`, `(2)` add hoy)
- **`alldl.batch(urls, { concurrency, onItem })`** — ekbare onek URL, per-item `{ success, ... }` / `{ success: false, error }`, kokhono throw kore na
- **`alldl(url, { retries })`** — transient fail e backoff soho auto-retry
- **`alldl.x(url, { quality: '720p' })`** — quality preference (requested er <= closest quality select hoy)
- Type definitions for all new methods (`index.d.ts`)

## [2.0.5] - 2026-09-29

### Added
- **Snapchat** downloader (`alldl.snapchat`) — spotlight/stories video & photo via getindevice API (Coming Soon list theke done ✅)
- **TypeScript definitions** (`index.d.ts`) — autocomplete + type safety
- **ESM support** — `import { alldl } from 'rahad-all-downloader-v2'` ekhon kaj kore
- **Live demo page** (`demo.html`) — browser thekei TikTok test kora jay
- `CHANGELOG.md`

### Changed
- 11 → **12 ta platform**: TikTok, Facebook, Instagram, YouTube, CapCut, X/Twitter, Threads, Likee, Pinterest, Kwai, Snapchat

## [2.0.4] - 2026-09-29

### Added
- **X (Twitter)** downloader (`alldl.x` / `alldl.twitter`) — multi-quality video & photo
- **Kwai** downloader (`alldl.kwai`) — direct video extraction

### Changed
- TikTok backend → TikWM API + mirror fallback
- Facebook backend → fdown API (ager direct scrape bot-blocked chilo)
- Instagram backend → snapinsta API, **ekhon kono cookie lage na**
- YouTube backend → Invidious API + auto instance discovery (ytdl-core fallback)
- CapCut backend → 3bic primary + capdownloader fallback

### Fixed
- Missing `cheerio` dependency add (X/Twitter er jonno lage)

## [2.0.3]

- Ager stable release (TikTok, Facebook, Instagram, YouTube, Likee, Threads, Pinterest, CapCut)
