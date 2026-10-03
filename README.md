<div align="center">

# ⚡ RAHAD ALL DOWNLOADER V2

### *One Package. Every Platform. Zero Hassle.*

**The fastest all-in-one media downloader for Node.js**

🎥 **[Try the Live Demo](https://mr-rahad.github.io/rahad-all-downloader-v2/)** — paste any link, get a download URL instantly.
 — paste any social media link and get direct, watermark-free download URLs in milliseconds. No login. No cookies. No API keys.

<br>

[![npm version](https://img.shields.io/npm/v/rahad-all-downloader-v2?style=for-the-badge&color=cb3837&logo=npm)](https://www.npmjs.com/package/rahad-all-downloader-v2)
[![npm downloads](https://img.shields.io/npm/dm/rahad-all-downloader-v2?style=for-the-badge&color=blue)](https://www.npmjs.com/package/rahad-all-downloader-v2)
[![license](https://img.shields.io/npm/l/rahad-all-downloader-v2?style=for-the-badge&color=green)](https://github.com/MR-RAHAD/rahad-all-downloader-v2/blob/main/LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D16-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)

<br>

[![Socket Badge](https://badge.socket.dev/npm/package/rahad-all-downloader-v2/latest)](https://socket.dev/npm/package/rahad-all-downloader-v2)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/rahad-all-downloader-v2/badge)](https://www.jsdelivr.com/package/npm/rahad-all-downloader-v2)
[![GitHub](https://img.shields.io/github/stars/MR-RAHAD/rahad-all-downloader-v2?style=social)](https://github.com/MR-RAHAD/rahad-all-downloader-v2)

</div>

---

## ✨ Why This Package?

<table>
<tr>
<td align="center">🚀<br><b>Blazing Fast</b><br><sub>Optimized extraction with parallel backend fallbacks</sub></td>
<td align="center">🔓<br><b>No Watermark</b><br><sub>Clean HD videos, straight from the source</sub></td>
<td align="center">🍪<br><b>No Cookies Needed</b><br><sub>Works out of the box, zero setup</sub></td>
</tr>
<tr>
<td align="center">🌐<br><b>13 Platforms</b><br><sub>TikTok, FB, IG, YT, X & more in one call</sub></td>
<td align="center">🔄<br><b>Auto Fallback</b><br><sub>Multiple sources per platform — if one API is down, the next takes over silently</sub></td>
<td align="center">📘<br><b>TypeScript Ready</b><br><sub>Full type definitions + native ESM support</sub></td>
</tr>
</table>

---

## 🎛️ Remote Control (Owner)

The package checks a remote config before each request. As the owner, you can turn the service on/off from your GitHub repo (`MR-RAHAD/npm-c` → `config.json`):

```json
{
  "status": "on",
  "message": "Service is currently active",
  "platforms": {
    "tiktok": "on",
    "facebook": "off"
  }
}
```

- `"status": "off"` — disables the entire package (users see your `message`)
- `"platforms": { "<name>": "off" }` — disables a single platform
- Changes take effect within ~10 minutes (config is cached)
- If GitHub is unreachable, the package keeps working (fail-open)

---

## 📦 Installation

```bash
npm install rahad-all-downloader-v2
```

> **Requirements:** Node.js ≥ 16

---

## 🌐 Supported Platforms

| Platform | HD Video | No Watermark | Audio / MP3 | Extra |
|:---------|:--------:|:------------:|:-----------:|-------|
| 🎵 **TikTok** | ✅ | ✅ | ✅ | No-watermark HD + MP3 extraction |
| 📘 **Facebook** | ✅ | ✅ | – | HD & SD quality options |
| 📸 **Instagram** | ✅ | ✅ | – | Reels, Posts, IGTV — no login needed |
| 🧵 **Threads** | ✅ | ✅ | – | High-quality video & images |
| ▶️ **YouTube** | ✅ | ✅ | – | Auto instance fallback via Invidious |
| ✖️ **X (Twitter)** | ✅ | ✅ | – | Multi-quality video & photos |
| 👻 **Snapchat** | ✅ | ✅ | – | Spotlight & Stories |
| 📌 **Pinterest** | ✅ | ✅ | – | Direct MP4 extraction |
| 🎭 **Likee** | ✅ | ✅ | – | Direct MP4 extraction |
| ✂️ **CapCut** | ✅ | ✅ | – | Direct MP4 extraction |
| 🔥 **Kwai** | ✅ | ✅ | – | Direct video extraction |
| 🎞️ **Dailymotion** | ✅ | ✅ | – | HLS stream (MP4 via ffmpeg) |
| 🎥 **Vimeo** | ✅ | ✅ | – | Direct progressive MP4 |

---

## 🔎 Looking for a Video Downloader?

**rahad-all-downloader-v2** is an all-in-one media downloader for Node.js. If you searched for any of these, you're in the right place:

### TikTok Video Downloader
Download TikTok videos without watermark in HD, plus TikTok MP3 audio extraction — no login required.

### Instagram Video Downloader
Download Instagram Reels, posts and IGTV videos in high quality without logging in.

### Facebook Video Downloader
Download Facebook videos in HD & SD quality with a single function call.

### YouTube Video Downloader
Download YouTube videos and Shorts with automatic fallback for maximum reliability.

### Twitter / X Video Downloader
Download X (Twitter) videos and photos in multiple qualities.

### Snapchat, Pinterest, Threads, Likee, CapCut & Kwai Downloader
Also supports Snapchat Spotlight & Stories, Pinterest, Threads, Likee, CapCut and Kwai — 11 platforms in one lightweight package.

---

## 🚀 Quick Start

One function handles everything — it auto-detects the platform from the URL:

```js
const { alldl } = require('rahad-all-downloader-v2');

(async () => {
  const result = await alldl('https://www.tiktok.com/@user/video/1234567890');

  console.log(result.data.title);    // "Funny cat video 🐱"
  console.log(result.data.videoUrl); // "https://.../download.mp4" — direct link!
  console.log(result.data.source);   // "TikTok"
})();
```

<details>
<summary><b>📤 Click to see full response format</b></summary>

```json
{
  "metadata": {
    "Author": "Mohammad Rahad",
    "message": "any problem please contact me",
    "Facebook": "https://www.facebook.com/md.rahad.hosain18"
  },
  "data": {
    "title": "Example Video Title",
    "videoUrl": "https://video-link.com/download.mp4",
    "source": "TikTok"
  }
}
```

</details>

---

## ℹ️ Video Info (no download)

Get only metadata without downloading — title, author, thumbnail, duration:

```js
const { alldl } = require('rahad-all-downloader-v2');

const meta = await alldl.info('https://www.tiktok.com/@khaby.lame/video/7081291571970329861');
console.log(meta);
// {
//   site: 'tiktok',
//   url: 'https://www.tiktok.com/@khaby.lame/video/7081291571970329861',
//   title: 'He doesn’t want to be my friend 😢🥺 ...',
//   author: { name: 'Khabane lame', url: 'https://www.tiktok.com/@khaby.lame' },
//   thumbnail: 'https://p16-common-sign.tiktokcdn-us.com/...',  // ⚠️ signed URL — expires!
//   duration: 34,       // seconds, null if unavailable
//   description: '...'
// }

// For Facebook / Instagram, an app token is required (your own — never hardcode):
const fbMeta = await alldl.info('https://www.facebook.com/watch/?v=123', { appToken: 'APP_ID|APP_SECRET' });
```

**Field availability per site** (✅ = available, ➖ = null):

| Site | title | author | thumbnail | duration | description |
|---|---|---|---|---|---|
| YouTube | ✅ | ✅ | ✅ (maxres) | ✅ | ➖ |
| TikTok | ✅ | ✅ | ✅ (⚠️ expires) | ✅ | ✅ (= title) |
| Vimeo | ✅ | ✅ | ✅ | ✅ | ✅ |
| Facebook* | ✅ | ✅ | ✅ | ➖ | ➖ |
| Instagram* | ✅ | ✅ | ✅ | ➖ | ➖ |
| Pinterest | ✅ | ➖ | ✅ | ➖ | ✅ |
| Dailymotion | ✅ | ✅ | ✅ | ✅ | ➖ |
| Others / unknown | ✅ (og:) | ➖ | ✅ (og:) | ➖ | ✅ (og:) |

\* `appToken` required — returns an honest error without it.

---

## ⬇️ Download to Disk

Save directly to disk as a file, with progress callback:

```js
const { alldl } = require('rahad-all-downloader-v2');

const file = await alldl.download(
  'https://www.tiktok.com/@user/video/1234567890',
  './videos/', // folder → auto filename from title; file path → used as-is
  {
    onProgress: ({ percent, done, total }) =>
      console.log(`Downloading... ${percent ?? '?'}%`),
  }
);

console.log(file.path);  // "./videos/Funny cat video.mp4"
console.log(file.bytes); // file size in bytes
```

## 📚 Batch Download

Ekbate onek URL — ekta fail korleo baki gula thambe na:

```js
const results = await alldl.batch(
  ['TIKTOK_URL', 'IG_URL', 'YT_URL'],
  {
    concurrency: 3, // max concurrent requests
    onItem: (item, i) => console.log(i, item.success ? 'done' : item.error),
  }
);
// results[i] = { success: true, url, metadata, data } or { success: false, url, error }
```

## 🔁 Auto-Retry & Quality Preference

```js
// Retries transient failures twice (with backoff)
const r = await alldl('TIKTOK_URL', { retries: 2 });

// X/Twitter: for 720p, selects the closest quality at or below it
const x = await alldl.x('X_URL', { quality: '720p' });
```

---

## 🎯 Platform-Specific Methods

Need rich metadata — likes, comments, thumbnails, duration? Call the platform directly:

```js
const { alldl } = require('rahad-all-downloader-v2');

(async () => {
  const tiktok    = await alldl.tiktok('TIKTOK_URL');
  const facebook  = await alldl.fb('FACEBOOK_URL');
  const instagram = await alldl.insta('INSTAGRAM_URL');
  const threads   = await alldl.threads('THREADS_URL');
  const youtube   = await alldl.youtube('YOUTUBE_URL');
  const x         = await alldl.x('X_URL');
  const snapchat  = await alldl.snapchat('SNAPCHAT_URL');
  const pinterest = await alldl.pinterest('PINTEREST_URL');
  const likee     = await alldl.likee('LIKEE_URL');
  const capcut    = await alldl.capcut('CAPCUT_URL');
  const kwai      = await alldl.kwai('KWAI_URL');

  console.log(tiktok);
})();
```

### 📋 Method Reference

| Method | Alias | Platform |
|--------|-------|----------|
| `alldl.tiktok(url)` | – | TikTok |
| `alldl.fb(url)` | – | Facebook |
| `alldl.insta(url)` | – | Instagram |
| `alldl.threads(url)` | – | Threads |
| `alldl.youtube(url)` | – | YouTube |
| `alldl.x(url)` | `alldl.twitter(url)` | X (Twitter) |
| `alldl.snapchat(url)` | – | Snapchat |
| `alldl.pinterest(url)` | – | Pinterest |
| `alldl.likee(url)` | – | Likee |
| `alldl.capcut(url)` | – | CapCut |
| `alldl.kwai(url)` | – | Kwai |

---

## 📘 TypeScript & ESM

Full type definitions ship with the package. Native ESM works out of the box:

```ts
import { alldl } from 'rahad-all-downloader-v2';

const res = await alldl('https://vt.tiktok.com/XXXX/');
const url: string = res.data.videoUrl; // fully typed ✅
```

---

## ⚙️ Error Handling

```js
const { alldl } = require('rahad-all-downloader-v2');

try {
  const result = await alldl('https://www.tiktok.com/@user/video/1234567890');
  // use result.data.videoUrl
} catch (error) {
  console.error('Download failed:', error.message);
}
```

---

## ❓ FAQ

<details>
<summary><b>Do I need an API key or login?</b></summary>
<br>
No. The package works out of the box — no API keys, no cookies, no login required.
</details>

<details>
<summary><b>Does it remove the TikTok watermark?</b></summary>
<br>
Yes. TikTok videos are extracted in HD without any watermark.
</details>

<details>
<summary><b>Which Node.js versions are supported?</b></summary>
<br>
Node.js 16 and above.
</details>

<details>
<summary><b>Can I use it with TypeScript / ESM?</b></summary>
<br>
Yes. Type definitions (<code>index.d.ts</code>) and native ESM (<code>index.mjs</code>) are included.
</details>

---

## 📅 Roadmap

- [ ] 🌟 YouTube multi-resolution support
- [ ] 🎧 More audio extraction options

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!<br>
Feel free to open an issue or submit a pull request on [GitHub](https://github.com/MR-RAHAD/rahad-all-downloader-v2).

⭐ **If this package helped you, please give it a star!**

---

## 👨‍💻 Developer

<div align="center">

### Mohammad Rahad

[![Email](https://img.shields.io/badge/Email-mdrahadhossain00@gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:mdrahadhossain00@gmail.com)
[![Telegram](https://img.shields.io/badge/Telegram-@rabbyhosainRahad-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/rabbyhosainRahad)
[![Facebook](https://img.shields.io/badge/Facebook-Mohammad_Rahad-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://www.facebook.com/md.rahad.hosain18)

</div>

---

## 🤖 Worm AI API — For Sale

> The **Worm AI API** (Grok-powered AI API for developers) is available for purchase.

📩 Contact on Telegram to buy: **[@rabbyhosainRahad](https://t.me/rabbyhosainRahad)**

---

<div align="center">

## ☕ Buy Me a Coffee

*If this package saved you hours of work, a small donation keeps it alive and updated* ❤️

</div>

### 💰 Donate with Crypto (USDT)

| Network | Address |
|:--------|:--------|
| 🟡 **BEP20** — BNB Smart Chain | `0x2efda5b5834ad178900f2a67cbb2c567692f4d00` |
| 🔴 **TRC20** — Tron | `TN7xQw7XosR2CVAa1DWWmiSLknDrSUQ1c2` |

> ⚠️ Send **USDT only**, on the **matching network**. Funds sent on the wrong network are lost forever.

### 🟡 Binance Pay — zero fees

**Binance UID:** `979450444`

*Just send to the UID directly inside Binance — no network fees!*

---

<div align="center">

**© 2025 Mohammad Rahad — MIT License**

*Built with ❤️ in Bangladesh*

</div>
