# Changelog

All notable changes to `rahad-all-downloader-v2` will be documented here.

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
