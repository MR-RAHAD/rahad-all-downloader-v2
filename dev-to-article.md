# Download Videos from 11 Platforms with One npm Package

If you have ever built a project that needs to download videos from social media, you know the pain: every platform has a different API, different quirks, and most solutions require logins, cookies, or API keys that break every few weeks.

**rahad-all-downloader-v2** solves this with a single function. Paste any social media link, get a direct download URL back. No login. No cookies. No API keys.

## Installation

```bash
npm install rahad-all-downloader-v2
```

Requires Node.js 16 or above. That is the entire setup.

## Usage

One function handles everything — it auto-detects the platform from the URL:

```js
const { alldl } = require('rahad-all-downloader-v2');

const result = await alldl('https://www.tiktok.com/@user/video/1234567890');

console.log(result.data.title);    // video title
console.log(result.data.videoUrl); // direct download link
console.log(result.data.source);   // "TikTok"
```

That is it. The same call works for all supported platforms.

## Supported Platforms

- TikTok (HD, no watermark, plus MP3 extraction)
- Facebook (HD & SD quality options)
- Instagram (Reels, Posts, IGTV — no login needed)
- Threads
- YouTube (automatic fallback across instances)
- X (Twitter)
- Snapchat (Spotlight & Stories)
- Pinterest
- Likee
- CapCut
- Kwai

## Need More Than a Download Link?

Every platform also has a dedicated method that returns rich metadata — thumbnails, duration, likes, and more:

```js
const tiktok    = await alldl.tiktok('TIKTOK_URL');
const instagram = await alldl.insta('INSTAGRAM_URL');
const youtube   = await alldl.youtube('YOUTUBE_URL');
// ... fb, threads, x, snapchat, pinterest, likee, capcut, kwai
```

## TypeScript and ESM

Full type definitions ship with the package, and native ESM works out of the box:

```ts
import { alldl } from 'rahad-all-downloader-v2';

const res = await alldl('https://vt.tiktok.com/XXXX/');
const url: string = res.data.videoUrl; // fully typed
```

## Why Developers Pick It

- **Zero setup** — no API keys, cookies, or logins
- **No watermarks** — clean HD videos straight from the source
- **Resilient** — parallel backend fallbacks keep it working when one source goes down
- **Lightweight** — minimal dependencies

## Links

- npm: https://www.npmjs.com/package/rahad-all-downloader-v2
- GitHub: https://github.com/MR-RAHAD/rahad-all-downloader-v2

If it saves you time, a star on GitHub is appreciated.
