<h3 align="center">
<p align="center">
<img src="https://img.shields.io/badge/WELCOME%20TO-RAHAD%20ALL%20DOWNLOADER%20V2-green?colorA=%23ff0000&colorB=%23017e40&style=flat-square">
</p>
</h3>

<p align="center">
<a href="https://git.io/typing-svg">
<img src="https://readme-typing-svg.herokuapp.com?font=Neuton&size=25&color=30FF40&background=000000&center=true&vCenter=true&width=450&height=60&lines=Hello+World%2C+I'm+Mohammad-Rahad+Here+🤙;IT'S+NOT+JUST+A+NAME+BRO+🥱;IT'S+A+BRAND+🔥;RAHAD-ALL-DOWNLOADER-V2+🥀;Thanks+My+All+Friends+🤙+🥰" alt="Typing SVG" />
</a>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/rahad-all-downloader-v2">
<img alt="npm version" src="https://img.shields.io/npm/v/rahad-all-downloader-v2.svg?style=flat-square">
</a>
<img alt="github version" src="https://img.shields.io/github/package-json/v/MR-RAHAD/rahad-all-downloader-v2?label=github&style=flat-square">
<a href="https://www.npmjs.com/package/rahad-all-downloader-v2">
<img src="https://img.shields.io/npm/dm/rahad-all-downloader-v2.svg?style=flat-square" alt="npm downloads">
</a>
</p>

<p align="center">
<a href="https://socket.dev/npm/package/rahad-all-downloader-v2">
<img src="https://socket.dev/api/badge/npm/package/rahad-all-downloader-v2" alt="Socket Badge">
</a>
<a href="https://www.jsdelivr.com/package/npm/rahad-all-downloader-v2">
<img src="https://data.jsdelivr.com/v1/package/npm/rahad-all-downloader-v2/badge" alt="jsDelivr">
</a>
</p>

---

## 🛠 Installation

You can install **rahad-all-downloader-v2** using npm:

```bash
npm install rahad-all-downloader-v2
```
---

## 🚀 Features & Platforms

This package supports high-speed media extraction from the following platforms:

- ✅ **TikTok** – Download HD videos without watermark & MP3
- ✅ **Facebook** – Fetch both HD and SD video links
- ✅ **Instagram** – Reels, Posts, IGTV (Auto Cookie Support)
- ✅ **Threads** – High quality video & image extraction
- ✅ **YouTube** – Video & audio powered by `@distube/ytdl-core`
- ✅ **Pinterest & Likee & capcut** – Direct MP4 media extraction

---

## 💡 Usage Example (Universal)

```js
const { alldl } = require('rahad-all-downloader-v2');

const videoUrl = 'https://www.facebook.com/...'; //support url tiktok, Instagram,  Facebook, likee, threats, capcut, YouTube, pinterest
const manualCookie = ''; // if Instagram video downloader error then add your Instagram account cookie

async function downloadMedia() {
  try {
    const result = await alldl(videoUrl, manualCookie);
    console.log(result);
  } catch (error) {
    console.error(error.message);
  }
}

downloadMedia();
```
---

## 📤 Output Example

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
    "source": "Facebook"
  }
}
```

---

## 🔹 Platform Specific (Full Data)
​If you need full details (likes, comments, thumbnails, etc.), call the platform methods directly.

```js
const { alldl } = require('rahad-all-downloader-v2');

(async () => {

  // TikTok
  const tiktok = await alldl.tiktok("TIKTOK_URL");
  console.log(tiktok);

  // Facebook
  const facebook = await alldl.fb("FB_URL");
  console.log(facebook);

  // Likee
  const likee = await alldl.likee("LIKEE_URL");
  console.log(likee);

  // YouTube
  const youtube = await alldl.youtube("YOUTUBE_URL");
  console.log(youtube);

  // Instagram (cookie optional)
  const insta = await alldl.insta("INSTA_URL", "OPTIONAL_COOKIE");
  console.log(insta);
  
    // Capcut
  const capcut = await alldl.capcut("CAPCUT_URL");
  console.log(capcut);

})();
```
### Supported Methods

- `alldl.tiktok(url)`
- `alldl.fb(url)`
- `alldl.insta(url, cookie?)`
- `alldl.likee(url)`
- `alldl.youtube(url)`
- `alldl.threads(url)`
- `alldl.pinterest(url)`
- `alldl.capcut(url)`

---

## 🍪 Cookie Management (Instagram & Threads)

- Login to Instagram on PC Browser
- Open **Developer Tools (F12)**
- Go to **Network Tab**
- Refresh page
- Copy cookie from request headers
- Use it as second parameter if auto cookie fails

---

## 📅 Coming Soon

- 🌟 Snapchat Video Downloader  
- 🌟 Twitter (X) Media Extractor  
- 🌟 YouTube Multi Resolution Support  

---

## 🤝 Contributing

Contributions are welcome.  
Feel free to submit issues or pull requests.

Facebook:  
👉 https://www.facebook.com/md.rahad.hosain18

---

## 👨‍💻 Developer Information

**Name:** Mohammad Rahad  
**Religion:** Islam  
**Permanent Address:** Dhaka  
**Current Address:** Shahrasti, Chandpur  
**Gender:** Male  
**Age:** 20  
**Relationship:** Single  

**Email:** mdrahadhossain00@gmail.com  
**Telegram:** https://t.me/rabbyhosainRahad  

---

© Copyright 2025 Mohammad Rahad
