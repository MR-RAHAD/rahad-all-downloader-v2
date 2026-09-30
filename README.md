<h1 align="center">⚡ Rahad All Downloader V2</h1>

<p align="center">
  <strong>Blazing-fast, dependency-light, all-in-one media downloader for 12 social platforms.</strong><br>
  One function. Any link. Direct download URLs — no watermark, no login, no cookies.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/rahad-all-downloader-v2">
    <img alt="npm version" src="https://img.shields.io/npm/v/rahad-all-downloader-v2.svg?style=flat-square&color=cb3837">
  </a>
  <a href="https://www.npmjs.com/package/rahad-all-downloader-v2">
    <img src="https://img.shields.io/npm/dm/rahad-all-downloader-v2.svg?style=flat-square" alt="npm downloads">
  </a>
  <img alt="license" src="https://img.shields.io/npm/l/rahad-all-downloader-v2.svg?style=flat-square">
  <img alt="node" src="https://img.shields.io/badge/node-%3E%3D16-339933?style=flat-square&logo=node.js">
  <a href="https://socket.dev/npm/package/rahad-all-downloader-v2">
    <img src="https://socket.dev/api/badge/npm/package/rahad-all-downloader-v2" alt="Socket Badge">
  </a>
  <a href="https://www.jsdelivr.com/package/npm/rahad-all-downloader-v2">
    <img src="https://data.jsdelivr.com/v1/package/npm/rahad-all-downloader-v2/badge" alt="jsDelivr">
  </a>
</p>

---

## 📦 Installation

```bash
npm install rahad-all-downloader-v2
```

---

## 🌐 Supported Platforms

| Platform | Watermark-Free | Audio / MP3 | Notes |
|----------|:---:|:---:|-------|
| **TikTok** | ✅ | ✅ | HD video, no watermark, MP3 extraction |
| **Facebook** | ✅ | – | HD & SD video links |
| **Instagram** | ✅ | – | Reels, Posts, IGTV — no cookie required |
| **Threads** | ✅ | – | High-quality video & image extraction |
| **YouTube** | ✅ | – | Via Invidious API with automatic instance fallback |
| **X (Twitter)** | ✅ | – | Multi-quality video & photo extraction |
| **Snapchat** | ✅ | – | Spotlight & Stories video/photo extraction |
| **Pinterest** | ✅ | – | Direct MP4 media extraction |
| **Likee** | ✅ | – | Direct MP4 media extraction |
| **CapCut** | ✅ | – | Direct MP4 media extraction |
| **Kwai** | ✅ | – | Direct video extraction |

---

## 🚀 Quick Start

Pass any supported link to `alldl()` — it auto-detects the platform:

```js
const { alldl } = require('rahad-all-downloader-v2');

(async () => {
  const result = await alldl('https://www.tiktok.com/@user/video/1234567890');
  console.log(result.data.videoUrl); // direct download link
})();
```

### Response Format

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

---

## 🎯 Platform-Specific Methods

For full metadata (likes, comments, thumbnails, duration), call the platform methods directly:

```js
const { alldl } = require('rahad-all-downloader-v2');

(async () => {
  const tiktok   = await alldl.tiktok('TIKTOK_URL');
  const facebook = await alldl.fb('FB_URL');
  const insta    = await alldl.insta('INSTAGRAM_URL');
  const threads  = await alldl.threads('THREADS_URL');
  const youtube  = await alldl.youtube('YOUTUBE_URL');
  const x        = await alldl.x('X_URL');
  const snapchat = await alldl.snapchat('SNAPCHAT_URL');
  const pinterest= await alldl.pinterest('PINTEREST_URL');
  const likee    = await alldl.likee('LIKEE_URL');
  const capcut   = await alldl.capcut('CAPCUT_URL');
  const kwai     = await alldl.kwai('KWAI_URL');
})();
```

### Available Methods

| Method | Alias |
|--------|-------|
| `alldl.tiktok(url)` | – |
| `alldl.fb(url)` | – |
| `alldl.insta(url)` | – |
| `alldl.threads(url)` | – |
| `alldl.youtube(url)` | – |
| `alldl.x(url)` | `alldl.twitter(url)` |
| `alldl.snapchat(url)` | – |
| `alldl.pinterest(url)` | – |
| `alldl.likee(url)` | – |
| `alldl.capcut(url)` | – |
| `alldl.kwai(url)` | – |

---

## 📘 TypeScript & ESM Support

Full TypeScript definitions are included, and native ESM is supported out of the box:

```ts
import { alldl } from 'rahad-all-downloader-v2';

const res = await alldl('https://vt.tiktok.com/XXXX/');
console.log(res.data.videoUrl); // string — direct download link
```

---

## ⚙️ Error Handling

```js
const { alldl } = require('rahad-all-downloader-v2');

try {
  const result = await alldl('https://www.tiktok.com/@user/video/1234567890');
  console.log(result);
} catch (error) {
  console.error('Download failed:', error.message);
}
```

---

## 📅 Roadmap

- 🌟 YouTube multi-resolution support

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.  
Feel free to open an issue or submit a pull request on [GitHub](https://github.com/MR-RAHAD/rahad-all-downloader-v2).

---

## 👨‍💻 Developer

**Mohammad Rahad**

- 📧 Email: mdrahadhossain00@gmail.com
- 💬 Telegram: [@rabbyhosainRahad](https://t.me/rabbyhosainRahad)
- 👍 Facebook: [md.rahad.hosain18](https://www.facebook.com/md.rahad.hosain18)

---

## 🤖 Worm AI API — For Sale

The **Worm AI API** script (Grok-powered AI API) is available for purchase.  
To buy, contact me on Telegram: [@rabbyhosainRahad](https://t.me/rabbyhosainRahad)

---

<p align="center">© 2025 Mohammad Rahad — MIT License</p>
