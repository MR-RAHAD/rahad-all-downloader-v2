/**
 * All-in-one downloader (alldl) — FIXED VERSION
 * - alldl(url)             => normalized response (same shape for all)
 * - alldl.fb(url) etc      => full platform response (metadata + success/source/data)
 *
 * Notes (fixed 2026-09-29):
 * - TikTok: tikwm primary + tikwm.com mirror fallback
 * - Facebook: NEW — fdown.co.in API (direct scrape bot-blocked chilo)
 * - Instagram: NEW — snapinsta.lc, kono cookie lage na (GitHub cookie dead chilo)
 * - CapCut: 3bic primary + capdownloader.com fallback
 * - YouTube: NEW — Invidious API + instance discovery (ytdl-core unstable chilo)
 * - X/Twitter: savetwitter.net (working, unchanged)
 * - Kwai: NEW — kwaivideosaver workers API
 * - Snapchat: NEW — getindevice API (token + download)
 * - Threads / Likee / Pinterest: unchanged
 * - Baki sob structure, metadata, helpers, router ager motoi ache
 */

const axios = require("axios");
const qs = require("qs");
const ytdl = require("@distube/ytdl-core");
const cheerio = require("cheerio");

const metadata = {
  Author: "Mohammad Rahad",
  message: "Any problem? Please contact me.",
  Facebook: "https://www.facebook.com/md.rahad.hosain18",
};

const CONFIG_URL =
  "https://raw.githubusercontent.com/MR-RAHAD/npm-c/refs/heads/main/config.json";

/* ---------------- Shared HTTP client ---------------- */
const http = axios.create({
  timeout: 20000,
  maxRedirects: 5,
  validateStatus: (s) => s >= 200 && s < 400, // 2xx + 3xx
});

/* ---------------- Cache + limiter (for remote config/cookie) ---------------- */
let _configCache = { value: null, exp: 0 };
let _cookieCache = { value: null, exp: 0 };
let _igLimiter = { windowStart: 0, count: 0 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function enforceLimiter(maxPerMin = 25) {
  const now = Date.now();
  if (now - _igLimiter.windowStart > 60_000) {
    _igLimiter.windowStart = now;
    _igLimiter.count = 0;
  }
  _igLimiter.count++;
  if (_igLimiter.count > maxPerMin) {
    throw new Error("Rate limit exceeded (client-side). Try again later.");
  }
}

async function getRemoteConfig() {
  const now = Date.now();
  if (_configCache.value && now < _configCache.exp) return _configCache.value;

  const { data } = await http.get(CONFIG_URL);
  _configCache = { value: data, exp: now + 10 * 60 * 1000 }; // 10 min
  return data;
}

/**
 * Cookie loader supports:
 * - plain "a=b; c=d" cookie string
 * - Netscape cookie file content
 */
async function getActiveCookie(manualCookie = "") {
  if (manualCookie && manualCookie.length > 20) return manualCookie.trim();

  const now = Date.now();
  if (_cookieCache.value && now < _cookieCache.exp) return _cookieCache.value;

  try {
    const config = await getRemoteConfig();
    if (!config?.status) throw new Error("Remote config disabled");
    if (!config?.cookie_url) throw new Error("cookie_url missing in config");

    const maxPerMin = config?.ig?.max_requests_per_minute ?? 25;
    const cooldown = config?.ig?.cooldown_ms ?? 1500;

    enforceLimiter(maxPerMin);
    if (cooldown > 0) await sleep(cooldown);

    const { data: remote } = await http.get(config.cookie_url);
    let raw = String(remote || "").trim().replace(/^"|"$/g, "");

    // Netscape cookie file -> Cookie header
    if (raw.startsWith("# Netscape HTTP Cookie File")) {
      const lines = raw.split(/\r?\n/);
      const cookies = [];
      for (const line of lines) {
        const l = line.trim();
        if (!l || l.startsWith("#")) continue;
        const parts = l.split("\t");
        if (parts.length < 7) continue;
        const name = parts[5];
        let value = parts.slice(6).join("\t");
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        value = value.replace(/\\054/g, ",");
        cookies.push(`${name}=${value}`);
      }
      const map = new Map();
      for (const c of cookies) {
        const [k, ...rest] = c.split("=");
        map.set(k, `${k}=${rest.join("=")}`);
      }
      raw = Array.from(map.values()).join("; ");
    }

    if (!/sessionid=/.test(raw) || !/csrftoken=/.test(raw)) return null;

    _cookieCache = { value: raw, exp: now + 20 * 60 * 1000 }; // 20 min
    return raw;
  } catch (err) {
    console.error("Instagram Cookie Error:", err.message);
    return null;
  }
}

/* ---------------- Helpers ---------------- */
const fixTikUrl = (path) =>
  !path ? null : path.startsWith("http") ? path : `https://www.tikwm.com${path}`;

const cleanUrl = (u) =>
  u ? u.replace(/\\u002F/g, "/").replace(/\\/g, "").replace(/&amp;/g, "&") : null;

/* ---------------- Facebook share resolver ---------------- */
async function resolveFacebookShareUrl(url) {
  if (!/facebook\.com\/share\/v\//.test(url)) return url;

  try {
    const { data: html, status } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (s) => s >= 200 && s < 500,
    });

    if (status >= 400 && !html) return url;

    const ogUrl =
      html.match(/<meta property="og:url" content="([^"]+)"/)?.[1] ||
      html.match(/rel="canonical" href="([^"]+)"/)?.[1] ||
      html.match(/"canonical":"([^"]+)"/)?.[1] ||
      null;

    if (ogUrl) return cleanUrl(ogUrl);

    const jsUrl =
      html.match(/location\.href="([^"]+)"/)?.[1] ||
      html.match(/window\.location="([^"]+)"/)?.[1] ||
      null;

    if (jsUrl) return cleanUrl(jsUrl);

    return url;
  } catch {
    return url;
  }
}

/* ---------------- CapCut (3bic + capdownloader fallback) ---------------- */
const capcut = async (url) => {
  try {
    const decodeUrl = (encodedPath) => {
      try {
        const base64Part = String(encodedPath).split("/").pop();
        return Buffer.from(base64Part, "base64").toString("utf-8");
      } catch {
        return null;
      }
    };

    const via3bic = async () => {
      const { data } = await http.post(
        "https://3bic.com/api/download",
        { url },
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
            Origin: "https://3bic.com",
            Referer: "https://3bic.com/",
          },
        }
      );
      if (!data?.originalVideoUrl) throw new Error("CapCut video data not found.");
      return {
        title: data.title || "CapCut Video",
        author: data.authorName || "Unknown",
        video: decodeUrl(data.originalVideoUrl),
      };
    };

    const viaCapDownloader = async () => {
      const { data } = await http.post(
        "https://capdownloader.com/api/video-data.php",
        qs.stringify({ url }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: "https://capdownloader.com/",
          },
        }
      );
      if (data?.error) throw new Error(data.error);
      const abs = (p) => (p && p.startsWith("/") ? "https://capdownloader.com" + p : p);
      const video = abs((data.medias || []).find((x) => x.extension === "mp4")?.url);
      if (!video) throw new Error("CapCut video data not found.");
      return { title: data.title || "CapCut Video", author: "Unknown", video };
    };

    let d = null;
    let lastErr = null;
    for (const fn of [via3bic, viaCapDownloader]) {
      try {
        d = await fn();
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!d) throw lastErr || new Error("CapCut video data not found.");

    return {
      success: true,
      source: "CapCut",
      data: {
        title: d.title,
        author: d.author,
        download: { video: d.video },
      },
    };
  } catch (e) {
    throw new Error("CapCut Error: " + e.message);
  }
};

/* ---------------- TikTok (tikwm + mirror fallback) ---------------- */
const tiktok = async (url) => {
  try {
    const endpoints = [
      `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`,
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
    ];

    let result = null;
    let lastErr = null;
    for (const ep of endpoints) {
      try {
        const { data } = await http.get(ep);
        if (data?.code === 0 && data?.data) {
          result = data;
          break;
        }
        throw new Error(data?.msg || "API error");
      } catch (e) {
        lastErr = e;
      }
    }

    const data = result?.data;
    if (!data) throw new Error("Video not found" + (lastErr ? ": " + lastErr.message : ""));

    return {
      success: true,
      source: "TikTok",
      data: {
        title: data.title,
        thumbnail: fixTikUrl(data.cover),
        owner: {
          username: data.author?.unique_id,
          nickname: data.author?.nickname,
          avatar: fixTikUrl(data.author?.avatar),
        },
        stats: {
          likes: data.digg_count,
          comments: data.comment_count,
          plays: data.play_count,
          shares: data.share_count,
        },
        download: {
          no_watermark: fixTikUrl(data.play),
          watermark: fixTikUrl(data.wmplay),
          music: fixTikUrl(data.music),
        },
      },
    };
  } catch (e) {
    throw new Error("TikTok Error: " + e.message);
  }
};

/* ---------------- Facebook (NEW: fdown.co.in API) ----------------
 * Ager direct facebook.com scrape bot-blocked chilo, tai ekhon
 * fdown.co.in API diye direct fbcdn link ana hoy.
 */
const fb = async (url) => {
  try {
    url = await resolveFacebookShareUrl(url);

    const { data } = await http.post(
      "https://fdown.co.in/ajax",
      { url },
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://fdown.co.in",
          Referer: "https://fdown.co.in/",
        },
      }
    );

    if (!data?.success) throw new Error(data?.message || "FB fetch failed");

    const links = data.links || {};
    const entries = Object.entries(links).filter(
      ([, v]) => typeof v === "string" && v.startsWith("http")
    );
    if (!entries.length) throw new Error("Video links not found");

    const qScore = (label) => {
      const m = String(label).match(/(\d{3,4})p/);
      // 2.0.11: fdown's "Download Video" link is the muxed (video+audio)
      // rendition — HD-labeled links are DASH video-only (no sound).
      return m ? parseInt(m[1], 10) : /download video/i.test(label) ? 1e5 : 0;
    };
    entries.sort((a, b) => qScore(b[0]) - qScore(a[0]));

    return {
      success: true,
      source: "Facebook",
      data: {
        title: data.title || "Facebook Video",
        thumbnail: data.thumbnail || null,
        download: {
          hd: cleanUrl(entries[0][1]),
          sd: cleanUrl(entries[entries.length - 1][1]),
        },
      },
    };
  } catch (e) {
    throw new Error("FB Error: " + e.message);
  }
};

/* ---------------- Instagram (NEW: no cookie needed) ----------------
 * Ager GitHub cookie system dead chilo, tai ekhon snapinsta.lc
 * API use kore — kono login/cookie lage na.
 */
const insta = async (url) => {
  try {
    const shortcode = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)?.[2];
    if (!shortcode) throw new Error("Invalid Instagram URL");

    // snapinsta majhe majhe transient fail kore, tai 2 bar retry
    let html = null;
    let lastErr = null;
    for (let attempt = 0; attempt < 2 && !html; attempt++) {
      try {
        const { data } = await http.post(
          "https://snapinsta.lc/process",
          qs.stringify({ q: url, scope: "home", lang: "en" }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Origin: "https://snapinsta.lc",
              Referer: "https://snapinsta.lc/",
            },
          }
        );
        if (typeof data === "string" && /data-media-src=/.test(data)) {
          html = data;
        } else {
          const msg =
            (data && typeof data === "object" && (data.mess || data.message)) ||
            "empty response";
          throw new Error(msg);
        }
      } catch (e) {
        lastErr = e;
        if (attempt === 0) await sleep(2000);
      }
    }

    if (!html)
      throw new Error(
        "Media not found (private/deleted hote pare)" +
          (lastErr ? ": " + lastErr.message : "")
      );

    const videos = [];
    const images = [];
    const seen = new Set();
    const re = /data-media-type="(video|image)"\s+data-media-src="([^"]+)"/gi;
    let m;
    while ((m = re.exec(html))) {
      const src = cleanUrl(m[2]);
      if (!src || seen.has(src)) continue;
      seen.add(src);
      (m[1] === "video" ? videos : images).push(src);
    }
    const poster = cleanUrl((html.match(/data-media-poster="([^"]+)"/) || [])[1]);

    if (!videos.length && !images.length) throw new Error("Media extract kora jayni");

    const isVideo = videos.length > 0;

    return {
      success: true,
      source: "Instagram",
      data: {
        shortcode,
        caption: "",
        owner: { username: null, profile_pic: null },
        download: {
          url: isVideo ? videos[0] : images[0],
          type: isVideo ? "video" : "image",
          thumbnail: poster,
        },
      },
    };
  } catch (e) {
    throw new Error("Insta Error: " + e.message);
  }
};

/* ---------------- Likee ---------------- */
const likee = async (url) => {
  try {
    const { data: html } = await http.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/04.1",
        Referer: "https://likee.video/",
      },
    });

    const videoMatch =
      html.match(/"video_url":"([^"]+)"/) || html.match(/"playUrl":"([^"]+)"/);
    const titleMatch =
      html.match(/"title":"([^"]+)"/) || html.match(/<title>(.*?)<\/title>/);
    const uploaderMatch =
      html.match(/"nick_name":"([^"]+)"/) || html.match(/"userName":"([^"]+)"/);

    if (!videoMatch) throw new Error("Likee Video not found.");

    return {
      success: true,
      source: "Likee",
      data: {
        title: titleMatch ? titleMatch[1].trim() : "Likee Video",
        uploader: uploaderMatch ? uploaderMatch[1] : "Unknown User",
        download: { video: cleanUrl(videoMatch[1]) },
      },
    };
  } catch (e) {
    throw new Error("Likee Error: " + e.message);
  }
};

/* ---------------- Threads (HTML + JSON endpoint fallback) ---------------- */
const threads = async (url) => {
  try {
    const UA =
      "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

    const fetchAny = async (u) =>
      axios.get(u, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://www.threads.net/",
        },
        timeout: 20000,
        maxRedirects: 5,
        validateStatus: (s) => s >= 200 && s < 500,
      });

    const clean = (u) => cleanUrl(u);

    const uniq = (arr) => {
      const s = new Set();
      return arr.filter((x) => x && !s.has(x) && (s.add(x), true));
    };

    // A) HTML
    const resHtml = await fetchAny(url);
    const html = String(resHtml.data || "");
    const status = resHtml.status;
    if (status >= 400) throw new Error(`Threads blocked/invalid request (HTTP ${status})`);

    const lower = html.toLowerCase();

    const title =
      html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] ||
      html.match(/<title[^>]*>([^<]+)<\/title>/)?.[1] ||
      "Threads Post";

    const thumb =
      html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ||
      html.match(/"image_versions2":.*?,"url":"([^"]+)"/)?.[1] ||
      null;

    const directVideo =
      html.match(/"video_versions":\[\{"type":\d+,"url":"([^"]+)"/)?.[1] ||
      html.match(/<meta property="og:video" content="([^"]+)"/)?.[1] ||
      html.match(/"video_url":"([^"]+)"/)?.[1] ||
      html.match(/"playbackUrl":"([^"]+)"/)?.[1] ||
      html.match(/"progressive_url":"([^"]+)"/)?.[1] ||
      null;

    if (directVideo) {
      return {
        success: true,
        source: "Threads",
        data: { title, thumbnail: clean(thumb), download: { video: clean(directVideo) } },
      };
    }

    // B) JSON endpoint: ?__a=1&__d=dis
    const u = new URL(url);
    u.searchParams.set("__a", "1");
    u.searchParams.set("__d", "dis");

    const resJson = await axios.get(u.toString(), {
      headers: {
        "User-Agent": UA,
        Accept: "application/json,text/plain,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.threads.net/",
      },
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: (s) => s >= 200 && s < 500,
    });

    if (resJson.status < 400) {
      const blob = JSON.stringify(resJson.data);

      const mp4s = [];
      const mp4Re = /https?:\/\/[^"\\]+\.mp4[^"\\]*/g;
      let m;
      while ((m = mp4Re.exec(blob)) !== null) mp4s.push(clean(m[0]));

      const imgs = [];
      const imgRe = /https?:\/\/[^"\\]+\.(jpg|jpeg|png|webp)[^"\\]*/g;
      while ((m = imgRe.exec(blob)) !== null) imgs.push(clean(m[0]));

      const mp4U = uniq(mp4s);
      const imgU = uniq(imgs);

      if (mp4U.length) {
        return {
          success: true,
          source: "Threads",
          data: {
            title,
            thumbnail: clean(thumb) || imgU[0] || null,
            download: { video: mp4U[0] },
            extra: { mp4: mp4U.slice(0, 10) },
          },
        };
      }

      if (imgU.length) {
        return {
          success: true,
          source: "Threads",
          data: {
            title,
            thumbnail: clean(thumb) || imgU[0] || null,
            download: { video: null },
            images: imgU.slice(0, 20),
          },
        };
      }
    }

    // C) last-resort scan HTML
    const mp4s = [];
    const mp4Re = /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g;
    let m;
    while ((m = mp4Re.exec(html)) !== null) mp4s.push(clean(m[0]));

    const imgs = [];
    const imgRe = /https?:\/\/[^"'\s]+\.(jpg|jpeg|png|webp)[^"'\s]*/g;
    while ((m = imgRe.exec(html)) !== null) imgs.push(clean(m[0]));

    const mp4U = uniq(mp4s);
    const imgU = uniq(imgs);

    if (mp4U.length) {
      return {
        success: true,
        source: "Threads",
        data: {
          title,
          thumbnail: clean(thumb) || imgU[0] || null,
          download: { video: mp4U[0] },
          extra: { mp4: mp4U.slice(0, 10) },
        },
      };
    }

    if (imgU.length) {
      return {
        success: true,
        source: "Threads",
        data: {
          title,
          thumbnail: clean(thumb) || imgU[0] || null,
          download: { video: null },
          images: imgU.slice(0, 20),
        },
      };
    }

    if (
      lower.includes("please wait") ||
      lower.includes("challenge") ||
      lower.includes("login") ||
      lower.includes("log in") ||
      lower.includes("sign up")
    ) {
      throw new Error(
        "Threads blocked this environment (login/challenge gate). Try from a normal device/IP or use an authenticated approach."
      );
    }

    throw new Error("Threads media not found (layout changed or restricted).");
  } catch (e) {
    throw new Error("Threads Error: " + e.message);
  }
};

/* ---------------- Pinterest ----------------
 * 2.1.0: rewritten — parse the "videos":{"videoUrls":[...]} array from the
 * pin page SSR HTML. Prefer an H.264 MP4 (/720p/ or expMp4) over HEVC/h265
 * variants; HLS (.m3u8) only as last resort.
 */
const pinterest = async (url) => {
  try {
    const { data: html } = await http.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    // Broad: v1.pinimg.com/videos URLs in ANY markup shape.
    // Pinterest er SSR markup region/IP onujayi bodlay — specific JSON key te
    // nirbhor na kore sob video URL tule ana hoy, tarpor best ta bacha hoy.
    const raw = html.match(/https:\/\/v1\.pinimg\.com\/videos\/[^"\\\s]+/g) || [];
    const urls = [...new Set(raw.map((u) => u.replace(/\\\//g, "/")))];

    if (!urls.length)
      throw new Error(
        "Pinterest Error: page te kono video URL pelam na (image/private/deleted pin hote pare, or Pinterest khali page dise — residential IP te try koro)"
      );

    const mp4h264 =
      urls.find((u) => /\.mp4($|\?)/.test(u) && /\/720p\/|expMp4/i.test(u)) ||
      urls.find((u) => /\.mp4($|\?)/.test(u) && !/hevc|h265/i.test(u)) ||
      urls.find((u) => /\.mp4($|\?)/.test(u));
    const finalUrl = cleanUrl(mp4h264 || urls[0]);
    const isHls = /\.m3u8($|\?)/.test(finalUrl || "");

    const titleMatch =
      html.match(/og:title" content="([^"]+)"/) || html.match(/<title>(.*?)<\/title>/);

    return {
      success: true,
      source: "Pinterest",
      data: {
        title: titleMatch ? titleMatch[1].trim() : "Pinterest Pin",
        download: { video: finalUrl, type: isHls ? "hls" : "mp4" },
      },
    };
  } catch (e) {
    throw new Error("Pinterest Error: " + e.message);
  }
};

/* ---------------- Dailymotion (2.1.0) ----------------
 * Player metadata endpoint theke HLS master URL ana hoy.
 * Dailymotion progressive MP4 dey na — tai HLS URL return kore
 * (ffmpeg diye mp4 te convert kora jay). Signed ?sec= per-request,
 * tai link sathe sathe use korte hobe, cache kora jabe na.
 */
const dailymotion = async (url) => {
  try {
    const id =
      url.match(/dailymotion\.com\/(?:video|embed\/video)\/([A-Za-z0-9]+)/)?.[1] ||
      url.match(/dai\.ly\/([A-Za-z0-9]+)/)?.[1];
    if (!id) throw new Error("Invalid Dailymotion URL");

    const { data } = await http.get(
      `https://www.dailymotion.com/player/metadata/video/${id}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      }
    );

    if (data?.error)
      throw new Error(data.error.title || "Video unavailable (deleted/private/DM005)");

    const hlsUrl = data?.qualities?.auto?.[0]?.url;
    if (!hlsUrl) throw new Error("No playable stream found");

    const thumbs = data?.posters || {};
    const thumbnail =
      thumbs["1280"] || thumbs["720"] || thumbs["480"] || data?.thumbnail_480_url || null;

    return {
      success: true,
      source: "Dailymotion",
      data: {
        title: data?.title || "Dailymotion Video",
        thumbnail: thumbnail ? cleanUrl(thumbnail) : null,
        download: {
          video: cleanUrl(hlsUrl),
          type: "hls",
          note: "Dailymotion sudhu HLS stream dey — mp4 chaile ffmpeg diye convert koro; link signed, sathe sathe download koro",
        },
      },
    };
  } catch (e) {
    throw new Error("Dailymotion Error: " + e.message);
  }
};

/* ---------------- Vimeo (2.1.0) ----------------
 * Page HTML -> twitter:player meta -> player page -> window.playerConfig
 * -> request.files.progressive[] theke direct MP4.
 * URL gulo signed (exp+hmac) — sathe sathe download korte hobe.
 */
const vimeo = async (url) => {
  try {
    const id = url.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d+)/)?.[1];
    if (!id) throw new Error("Invalid Vimeo URL");

    const UA =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
    const headers = {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://vimeo.com/",
    };

    const { data: pageHtml } = await http.get(`https://vimeo.com/${id}`, { headers });
    const playerMeta =
      pageHtml.match(/<meta[^>]+name="twitter:player"[^>]+content="([^"]+)"/) ||
      pageHtml.match(/<meta[^>]+content="([^"]+)"[^>]+name="twitter:player"/);
    const playerUrl = playerMeta ? playerMeta[1].replace(/&amp;/g, "&") : `https://player.vimeo.com/video/${id}`;

    const { data: playerHtml } = await http.get(playerUrl, {
      headers: {
        ...headers,
        Referer: `https://vimeo.com/${id}`,
        "Sec-Fetch-Dest": "iframe",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-site",
      },
    });

    // window.playerConfig = {...}; — brace matching (JSON e nested brace thake)
    const startKey = "window.playerConfig";
    const si = playerHtml.indexOf(startKey);
    if (si === -1) throw new Error("Player config not found (private/geo-blocked hote pare)");
    let sj = playerHtml.indexOf("{", si);
    let depth = 0, sk = sj, inStr = false, esc = false;
    for (sk = sj; sk < playerHtml.length; sk++) {
      const c = playerHtml[sk];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
      } else {
        if (c === '"') inStr = true;
        else if (c === "{") depth++;
        else if (c === "}") { depth--; if (depth === 0) break; }
      }
    }
    let cfg;
    try {
      cfg = JSON.parse(playerHtml.slice(sj, sk + 1));
    } catch {
      throw new Error("Player config parse failed");
    }

    const progressive = cfg?.request?.files?.progressive || [];
    if (!progressive.length)
      throw new Error("Progressive MP4 not available for this video");

    const sorted = [...progressive].sort((a, b) => (b.width || 0) - (a.width || 0));
    const best = sorted[0];
    const thumbs = cfg?.video?.thumbs || {};

    return {
      success: true,
      source: "Vimeo",
      data: {
        title: cfg?.video?.title || "Vimeo Video",
        thumbnail: thumbs["1280"] || thumbs["640"] || null,
        download: {
          video: cleanUrl(best.url),
          type: "mp4",
          quality: best.quality || `${best.width}p`,
          note: "Signed URL — sathe sathe download koro, kichukhon por expire hoye jabe",
        },
      },
    };
  } catch (e) {
    const msg = /401/.test(e.message)
      ? "Vimeo blocked this request (Cloudflare bot check) — residential IP theke try koro"
      : e.message;
    throw new Error("Vimeo Error: " + msg);
  }
};

/* ---------------- Kwai ---------------- */
const kwai = async (url) => {
  try {
    const { data } = await http.post(
      "https://kwaivideosaver.storeetsy72.workers.dev/api/public/fetch-video",
      { url },
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://kwaivideosaver.storeetsy72.workers.dev",
        },
      }
    );

    if (!data?.success) throw new Error("Kwai fetch failed");
    const d = data.data || {};
    if (!d.videoUrl) throw new Error("Kwai video not found.");

    return {
      success: true,
      source: "Kwai",
      data: {
        title: d.title || "Kwai Video",
        author: d.author || "Unknown",
        thumbnail: d.thumbnail || null,
        download: {
          video: d.videoUrl,
          audio: d.audioUrl || null,
          photo: d.photoUrl || null,
        },
      },
    };
  } catch (e) {
    throw new Error("Kwai Error: " + e.message);
  }
};

/* ---------------- Snapchat (NEW: getindevice API) ---------------- */
const snapchat = async (url) => {
  try {
    const baseHeaders = {
      Origin: "https://getindevice.com",
      Referer: "https://getindevice.com/snapchat-downloader/",
    };

    const { data: tData } = await http.get(
      `https://getindevice.com/api/token/?_t=${Date.now()}`,
      { headers: baseHeaders }
    );
    const token = tData?.token;
    if (!token) throw new Error("Snapchat token fetch failed.");

    const { data: json } = await http.post(
      "https://getindevice.com/api/download/",
      { url },
      { headers: { ...baseHeaders, "x-request-token": token } }
    );

    const videos = (json.videos || [])
      .filter((v) => v.url)
      .map((v) => ({
        quality: v.quality || "HD",
        url: v.url,
      }));
    // snapcode SVG profile QR — asol media na, tai bad
    const photos = (json.photos || [])
      .filter((p) => {
        const fmt = (p.format || "").toLowerCase();
        const q = (p.quality || "").toLowerCase();
        return fmt !== "svg" && !q.includes("snapcode");
      })
      .map((p) => (typeof p === "string" ? p : p.url))
      .filter(Boolean);

    if (!videos.length && !photos.length)
      throw new Error("Snapchat media not found (private/deleted hote pare).");

    return {
      success: true,
      source: "Snapchat",
      data: {
        title: json.title || json.author || "Snapchat Video",
        author: json.author || json.authorUsername || null,
        thumbnail: json.thumbnail || photos[0] || null,
        download: {
          video: videos[0]?.url || null,
          videos,
          photos,
        },
      },
    };
  } catch (e) {
    throw new Error("Snapchat Error: " + e.message);
  }
};

/* ---------------- YouTube (NEW: Invidious API + instance fallback) ----------------
 * ytdl-core YouTube change holei venge jeto, tai ekhon Invidious
 * public API use kore — kono npm dependency lage na.
 */
const youtube = async (url) => {
  try {
    const id =
      url.match(
        /(?:youtube\.com\/(?:watch\?[^#]*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
      )?.[1] || (/^[A-Za-z0-9_-]{11}$/.test(url.trim()) ? url.trim() : null);
    if (!id) throw new Error("Video ID ber kora jayni");

    const fetchFrom = async (base) => {
      const { data } = await http.get(`${base}/api/v1/videos/${id}`, { timeout: 25000 });
      return data;
    };

    const bases = ["https://invidious.f5.si"];
    try {
      const { data: list } = await http.get("https://api.invidious.io/instances.json", {
        timeout: 15000,
      });
      const healthy = (Array.isArray(list) ? list : [])
        .filter((x) => x[1]?.api === true)
        .map((x) => "https://" + x[0])
        .slice(0, 3);
      bases.push(...healthy);
    } catch {
      /* discovery fail hole primary diyei try hobe */
    }

    let info = null;
    let lastErr = null;
    for (const b of [...new Set(bases)]) {
      try {
        info = await fetchFrom(b);
        break;
      } catch (e) {
        lastErr = e;
      }
    }

    // NEW primary: Invidious — kaj korle ekhan thekei return
    if (info) {
      const vids = (info.adaptiveFormats || [])
        .filter((f) => f.type?.startsWith("video/"))
        .sort((a, b) => (b.height || 0) - (a.height || 0));
      const progressive = (info.formatStreams || []).slice(-1)[0];
      const best = progressive?.url || vids[0]?.url;
      if (!best) throw new Error("No suitable format found.");

      const thumbs = info.videoThumbnails || [];

      return {
        success: true,
        source: "YouTube",
        data: {
          title: info.title,
          thumbnail: thumbs[thumbs.length - 1]?.url || thumbs[0]?.url || null,
          uploader: info.author || "Unknown",
          download: { video: best },
        },
      };
    }

    // FALLBACK: ager ytdl-core code (dependency te achei)
    try {
      const ytInfo = await ytdl.getInfo(url);
      const format =
        ytdl.chooseFormat(ytInfo.formats, {
          filter: "audioandvideo",
          quality: "highest",
        }) || ytdl.chooseFormat(ytInfo.formats, { quality: "highest" });
      if (!format?.url) throw new Error("No suitable format found.");
      return {
        success: true,
        source: "YouTube",
        data: {
          title: ytInfo.videoDetails.title,
          thumbnail:
            ytInfo.videoDetails.thumbnails?.[ytInfo.videoDetails.thumbnails.length - 1]?.url ||
            null,
          uploader: ytInfo.videoDetails.author?.name || "Unknown",
          download: { video: format.url },
        },
      };
    } catch (e) {
      throw new Error(
        "Invidious fail (" + (lastErr?.message || "") + ") + ytdl fail (" + e.message + ")"
      );
    }
  } catch (e) {
    throw new Error("YouTube Error: " + e.message);
  }
};

/* ---------------- X/Twitter (savetwitter.net) ---------------- */
const twitterDownloader = async (tweetUrl, opts = {}) => {
  if (!tweetUrl) throw new Error("Tweet URL is required");

  const endpoint = "https://savetwitter.net/api/ajaxSearch";

  const form = new URLSearchParams({
    q: String(tweetUrl).trim(),
    lang: "en",
    cftoken: "",
  });

  const { data } = await axios.post(endpoint, form.toString(), {
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      origin: "https://savetwitter.net",
      referer: "https://savetwitter.net/en",
      "x-requested-with": "XMLHttpRequest",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      accept: "application/json, text/plain, */*",
    },
    timeout: 15000,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 500,
  });

  const payload = typeof data === "string" ? JSON.parse(data) : data;

  if (!payload || payload.status !== "ok" || !payload.data) {
    throw new Error(payload?.mess || payload?.message || "Failed to fetch X media");
  }

  const $ = cheerio.load(payload.data);

  const tweetId = $("#TwitterId").val() || null;
  const title = $(".tw-middle h3").first().text().trim() || null;
  const duration = $(".tw-middle p").first().text().trim() || null;
  const thumbnail =
    $(".thumbnail img").attr("src") || $(".download-items__thumb img").attr("src") || null;

  const videos = [];
  const images = [];

  $(".tw-button-dl").each((_, el) => {
    const href = $(el).attr("href");
    const text = ($(el).text() || "").trim();
    if (!href) return;

    if (/MP4/i.test(text) || /\.mp4(\?|$)/i.test(href)) {
      const qualityMatch = text.match(/(\d{3,4})p/i);
      videos.push({ quality: qualityMatch ? `${qualityMatch[1]}p` : "unknown", url: href });
      return;
    }

    if (/image|photo|jpg|jpeg|png/i.test(text) || /\.(jpg|jpeg|png)(\?|$)/i.test(href)) {
      images.push({ url: href });
    }
  });

  $(".photo-list img").each((_, img) => {
    const src = $(img).attr("src");
    if (src) images.push({ url: src });
  });

  const uniq = (arr) => {
    const seen = new Set();
    return arr.filter((x) => x?.url && !seen.has(x.url) && (seen.add(x.url), true));
  };

  const videosU0 = uniq(videos);
  const imagesU = uniq(images);

  videosU0.sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0));

  // NEW: quality preference, e.g. alldl.x(url, { quality: '720p' })
  // requested quality er <= closest ta ke best banay
  let videosU = videosU0;
  const wantQ = parseInt(String(opts.quality || ""), 10);
  if (wantQ > 0) {
    const fit = videosU0.filter((v) => (parseInt(v.quality) || 0) <= wantQ);
    if (fit.length) {
      const rest = videosU0.filter((v) => !fit.includes(v));
      videosU = fit.concat(rest);
    }
  }

  return {
    success: true,
    source: "X",
    data: {
      type: videosU.length ? "video" : imagesU.length ? "photo" : "unknown",
      tweetId,
      title,
      duration,
      thumbnail,
      videos: videosU,
      images: imagesU,
      download: { best: videosU[0]?.url || imagesU[0]?.url || null },
    },
  };
};

/* ---------------- Normalizer ---------------- */
function pickVideoUrl(result) {
  const d = result?.data || {};
  const dl = d.download || {};
  return (
    dl.best ||
    dl.no_watermark ||
    dl.hd ||
    dl.sd ||
    dl.url ||
    dl.video ||
    d.videoUrl ||
    d.videos?.[0]?.url ||
    d.images?.[0]?.url ||
    d.images?.[0] ||
    null
  );
}

function pickTitle(result) {
  const d = result?.data || {};
  return d.title || d.caption || "Social Media Video";
}

/* ================= info(url, opts) — metadata only, no download (2.2.0) =================
 * Returns: { site, url, title, author:{name,url}, thumbnail, duration (seconds|null), description }
 * Missing fields → null, never fabricated.
 * Facebook/Instagram oEmbed needs an app token: alldl.info(url, { appToken: 'ID|SECRET' })
 * (user-supplied, never shipped). Without it → honest error.
 * NOTE: TikTok thumbnail CDN URLs are signed and expire — fetch/use promptly.
 */
const infoShape = (site, url, f = {}) => ({
  site,
  url,
  title: f.title ?? null,
  author: { name: f.authorName ?? null, url: f.authorUrl ?? null },
  thumbnail: f.thumbnail ?? null,
  duration: f.duration ?? null,
  description: f.description ?? null,
  ...(f.embedHtml ? { embedHtml: f.embedHtml } : {}),
});

const ogScrape = async (url) => {
  const { data: html } = await http.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: 25000,
  });
  const meta = (prop) => {
    const m =
      html.match(new RegExp(`<meta[^>]+property="${prop}"[^>]+content="([^"]+)"`)) ||
      html.match(new RegExp(`<meta[^>]+content="([^"]+)"[^>]+property="${prop}"`));
    return m ? m[1].replace(/&amp;/g, "&") : null;
  };
  const titleTag = html.match(/<title>([^<]{1,200})<\/title>/);
  return {
    html,
    title: meta("og:title") || (titleTag ? titleTag[1].trim() : null),
    description: meta("og:description"),
    thumbnail: meta("og:image"),
  };
};

const infoYouTube = async (url) => {
  const { data: oe } = await http.get(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    { timeout: 20000 }
  );
  let duration = null;
  let thumbnail = oe.thumbnail_url || null;
  try {
    const { html } = await ogScrape(url);
    const len = html.match(/"lengthSeconds":"(\d+)"/);
    if (len) duration = parseInt(len[1], 10);
    const maxres = html.match(/<meta property="og:image" content="([^"]*maxresdefault[^"]*)"/);
    if (maxres) thumbnail = maxres[1];
  } catch {
    /* watch-page bot-walled hole duration null thakbe — honest */
  }
  return infoShape("youtube", url, {
    title: oe.title,
    authorName: oe.author_name,
    authorUrl: oe.author_url,
    thumbnail,
    duration,
  });
};

const infoTikTok = async (url) => {
  const { data: oe } = await http.get(
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
    { timeout: 20000 }
  );
  let duration = null;
  try {
    const vid = url.match(/\/video\/(\d+)/)?.[1];
    const { data: html } = await http.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 25000,
    });
    if (vid) {
      const idx = html.indexOf(`"id":"${vid}"`);
      if (idx !== -1) {
        const slice = html.slice(idx, idx + 4000);
        const dm = slice.match(/"duration":(\d+)/);
        if (dm) duration = parseInt(dm[1], 10);
      }
    }
    if (duration === null) {
      const dm = html.match(/"duration":(\d+)/);
      if (dm) duration = parseInt(dm[1], 10);
    }
  } catch {
    /* page-wall hole duration null — honest */
  }
  return infoShape("tiktok", url, {
    title: oe.title,
    authorName: oe.author_name,
    authorUrl: oe.author_url,
    thumbnail: oe.thumbnail_url, // NOTE: TikTok CDN URL signed — expire hoy, sathe sathe use koro
    duration,
    description: oe.title,
  });
};

const infoVimeo = async (url) => {
  const { data: oe } = await http.get(
    `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
    { timeout: 20000 }
  );
  return infoShape("vimeo", url, {
    title: oe.title,
    authorName: oe.author_name,
    authorUrl: oe.author_url,
    thumbnail: oe.thumbnail_url,
    duration: typeof oe.duration === "number" ? oe.duration : null,
    description: oe.description || null,
  });
};

const infoMetaOembed = async (site, url, appToken) => {
  // Meta oEmbed ekhon token CHARAO kaj kore (verified 2026-10-03) — kintu shudhu
  // embed HTML + validation dey, title/author/thumbnail dey na.
  // appToken thakle (oEmbed Read approved app) richer data er try kora hoy.
  const kinds = site === "facebook" ? ["oembed_video", "oembed_post"] : ["oembed_post", "oembed_video"];
  const get = async (k, token) => {
    const u =
      `https://graph.facebook.com/v21.0/${k}?url=${encodeURIComponent(url)}` +
      (token ? `&access_token=${encodeURIComponent(token)}` : "");
    const { data: oe } = await http.get(u, { timeout: 20000 });
    if (!oe || oe.error) throw new Error(oe?.error?.message || "oEmbed error");
    return oe;
  };
  let tokenless = null;
  let lastErr = null;
  for (const k of kinds) {
    try {
      tokenless = await get(k);
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (appToken) {
    for (const k of kinds) {
      try {
        const oe = await get(k, appToken);
        if (oe.title || oe.author_name || oe.thumbnail_url) {
          return infoShape(site, url, {
            title: oe.title || null,
            authorName: oe.author_name || null,
            authorUrl: oe.author_url || null,
            thumbnail: oe.thumbnail_url || null,
            embedHtml: oe.html || null,
          });
        }
      } catch (e) {
        lastErr = e;
      }
    }
  }
  if (tokenless) {
    return infoShape(site, url, {
      title: null,
      authorName: null,
      authorUrl: null,
      thumbnail: null,
      embedHtml: tokenless.html || null,
      description:
        "Tokenless oEmbed: URL valid, kintu Meta title/thumbnail dey na (oEmbed Read approval lage)",
    });
  }
  throw new Error(
    `Meta oEmbed failed: ${lastErr?.response?.data?.error?.message || lastErr?.message || "unknown"}`
  );
};

const infoPinterest = async (url) => {
  const { title, description, thumbnail } = await ogScrape(url);
  return infoShape("pinterest", url, { title, description, thumbnail, duration: null });
};

const infoDailymotion = async (url) => {
  const id =
    url.match(/dailymotion\.com\/(?:video|embed\/video)\/([A-Za-z0-9]+)/)?.[1] ||
    url.match(/dai\.ly\/([A-Za-z0-9]+)/)?.[1];
  if (!id) throw new Error("Dailymotion video ID ber kora jayni");
  const { data: md } = await http.get(`https://www.dailymotion.com/player/metadata/video/${id}`, {
    timeout: 20000,
  });
  const thumbs = md.thumbnails || {};
  const tkeys = Object.keys(thumbs)
    .map((k) => parseInt(k, 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => b - a);
  return infoShape("dailymotion", url, {
    title: md.title || null,
    authorName: md.owner?.screenname || null,
    thumbnail: tkeys.length ? thumbs[String(tkeys[0])] : null,
    duration: typeof md.duration === "number" ? md.duration : null,
  });
};

const detectInfoSite = (url) => {
  if (/tiktok\.com/.test(url)) return "tiktok";
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/vimeo\.com/.test(url)) return "vimeo";
  if (/facebook\.com|fb\.watch/.test(url)) return "facebook";
  if (/instagram\.com/.test(url)) return "instagram";
  if (/pinterest\.com|pin\.it/.test(url)) return "pinterest";
  if (/dailymotion\.com|dai\.ly/.test(url)) return "dailymotion";
  if (/likee\.video|l\.likee/.test(url)) return "likee";
  if (/threads\.net|threads\.com/.test(url)) return "threads";
  if (/capcut\.com/.test(url)) return "capcut";
  if (/kwai\.com|kuaishou\.com|kwai-video\.com/.test(url)) return "kwai";
  if (/snapchat\.com/.test(url)) return "snapchat";
  if (/x\.com|twitter\.com/.test(url)) return "x";
  return "unknown";
};

const info = async (url, opts = {}) => {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url.trim()))
    throw new Error("Invalid URL: " + String(url).slice(0, 80));
  const site = detectInfoSite(url);
  try {
    switch (site) {
      case "youtube":
        return await infoYouTube(url);
      case "tiktok":
        return await infoTikTok(url);
      case "vimeo":
        return await infoVimeo(url);
      case "facebook":
      case "instagram":
        return await infoMetaOembed(site, url, opts.appToken);
      case "pinterest":
        return await infoPinterest(url);
      case "dailymotion":
        return await infoDailymotion(url);
      default: {
        // baki site + unknown: generic og: scrape, site name soho
        const { title, description, thumbnail } = await ogScrape(url);
        return infoShape(site, url, { title, description, thumbnail, duration: null });
      }
    }
  } catch (e) {
    if (/needs an app token/.test(e.message)) throw e;
    throw new Error(`info() failed for ${site}: ${e.message}`);
  }
};

/* ---------------- Router ---------------- */
const alldl = async (url) => {
  let result;

  if (/tiktok\.com/.test(url)) result = await tiktok(url);
  else if (/facebook\.com|fb\.watch|share\/v\//.test(url)) result = await fb(url);
  else if (/instagram\.com/.test(url)) result = await insta(url);
  else if (/likee\.video|l\.likee/.test(url)) result = await likee(url);
  else if (/threads\.net|threads\.com/.test(url)) result = await threads(url);
  else if (/pinterest\.com|pin\.it/.test(url)) result = await pinterest(url);
  else if (/youtube\.com|youtu\.be/.test(url)) result = await youtube(url);
  else if (/capcut\.com/.test(url)) result = await capcut(url);
  else if (/kwai\.com|kuaishou\.com|kwai-video\.com/.test(url)) result = await kwai(url);
  else if (/snapchat\.com/.test(url)) result = await snapchat(url);
  else if (/dailymotion\.com|dai\.ly/.test(url)) result = await dailymotion(url);
  else if (/vimeo\.com/.test(url)) result = await vimeo(url);
  else if (/x\.com|twitter\.com/.test(url)) result = await twitterDownloader(url);
  else throw new Error("Platform not supported: " + url);

  return {
    metadata,
    data: {
      title: pickTitle(result),
      videoUrl: pickVideoUrl(result),
      source: result.source,
    },
  };
};

/* ---------------- Full responses ---------------- */
const withMeta = async (fn, url, opts) => {
  const res = await fn(url, opts);
  return { metadata, ...res };
};

alldl.tiktok = (url) => withMeta(tiktok, url);
alldl.fb = (url) => withMeta(fb, url);
alldl.insta = (url) => withMeta(insta, url);
alldl.likee = (url) => withMeta(likee, url);
alldl.threads = (url) => withMeta(threads, url);
alldl.pinterest = (url) => withMeta(pinterest, url);
alldl.youtube = (url) => withMeta(youtube, url);
alldl.capcut = (url) => withMeta(capcut, url);
alldl.kwai = (url) => withMeta(kwai, url);
alldl.snapchat = (url) => withMeta(snapchat, url);
alldl.dailymotion = (url) => withMeta(dailymotion, url);
alldl.vimeo = (url) => withMeta(vimeo, url);

alldl.x = (url, opts) => withMeta(twitterDownloader, url, opts);
alldl.twitter = (url, opts) => withMeta(twitterDownloader, url, opts);
alldl.info = (url, opts) => info(url, opts);

/* ================= UPGRADES (2026-09-30) =================
 * - alldl(url, { retries })                    → transient fail e auto-retry (backoff)
 * - alldl.download(url, dest, { onProgress })  → file hishebe save kore disk e
 * - alldl.batch(urls, { concurrency, onItem })  → ekbare onek URL, per-item result
 * - alldl.x(url, { quality: '720p' })          → quality preference (opore)
 */
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");

function sanitizeFilename(name) {
  const s = String(name || "video")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  return s || "video";
}

function extFromUrl(u) {
  try {
    const m = new URL(u).pathname.match(/\.([a-z0-9]{2,4})$/i);
    return m ? "." + m[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

function extFromType(ct) {
  const t = String(ct || "").split(";")[0].trim().toLowerCase();
  const map = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return map[t] || null;
}

async function streamToFile(fileUrl, finalPath, onProgress) {
  const res = await axios({
    url: fileUrl,
    method: "GET",
    responseType: "stream",
    timeout: 120000,
    maxRedirects: 5,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    validateStatus: (s) => s >= 200 && s < 400,
  });
  const total = parseInt(res.headers["content-length"] || "0", 10) || null;
  let done = 0;
  await fsp.mkdir(path.dirname(finalPath), { recursive: true });
  await new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(finalPath);
    res.data.on("data", (chunk) => {
      done += chunk.length;
      if (onProgress) {
        try {
          onProgress({
            done,
            total,
            percent: total ? Math.round((done / total) * 100) : null,
          });
        } catch {}
      }
    });
    res.data.on("error", reject);
    ws.on("error", reject);
    ws.on("finish", resolve);
    res.data.pipe(ws);
  });
  return done;
}

/* --- options wrapper: alldl(url, { retries }) --- */
const _alldlCore = alldl;
async function alldlWithOpts(url, opts = {}) {
  const retries = Math.max(0, (opts.retries | 0) || 0);
  let lastErr = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await _alldlCore(url);
    } catch (e) {
      lastErr = e;
      if (i < retries) await sleep(1000 * (i + 1)); // backoff: 1s, 2s, ...
    }
  }
  throw lastErr;
}

/* --- alldl.download(url, dest, { onProgress, retries }) --- */
alldlWithOpts.download = async (url, dest, opts = {}) => {
  if (!url) throw new Error("URL is required");
  if (!dest) throw new Error("Destination path is required");

  const resolved = await alldlWithOpts(url, opts);
  const fileUrl = resolved.data.videoUrl;
  if (!fileUrl) throw new Error("No downloadable media found: " + url);

  let ext = extFromUrl(fileUrl);
  if (!ext) {
    try {
      const head = await axios.head(fileUrl, {
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (s) => s >= 200 && s < 400,
      });
      ext = extFromType(head.headers["content-type"]);
    } catch {
      /* HEAD support na korle URL ext / default use hobe */
    }
  }
  ext = ext || ".mp4";

  const base = sanitizeFilename(resolved.data.title);
  let finalPath;
  try {
    const st = fs.existsSync(dest) ? fs.statSync(dest) : null;
    if (dest.endsWith(path.sep) || (st && st.isDirectory())) {
      finalPath = path.join(dest, base + ext);
    } else if (path.extname(dest)) {
      finalPath = dest;
    } else {
      finalPath = path.join(dest, base + ext);
    }
  } catch {
    finalPath = path.join(dest, base + ext);
  }

  // overwrite na kore (1), (2)... add kore
  let p = finalPath;
  let n = 1;
  while (fs.existsSync(p)) {
    p = path.join(path.dirname(finalPath), `${base} (${n})${ext}`);
    n++;
  }
  finalPath = p;

  const bytes = await streamToFile(fileUrl, finalPath, opts.onProgress);

  return {
    path: finalPath,
    bytes,
    title: resolved.data.title,
    source: resolved.data.source,
    videoUrl: fileUrl,
  };
};

/* --- alldl.batch(urls, { concurrency, onItem, retries }) --- */
alldlWithOpts.batch = async (urls, opts = {}) => {
  if (!Array.isArray(urls)) throw new Error("urls must be an array");
  const concurrency = Math.max(1, opts.concurrency | 0 || 3);
  const results = new Array(urls.length);
  let i = 0;

  async function worker() {
    while (i < urls.length) {
      const idx = i++;
      try {
        const data = await alldlWithOpts(urls[idx], opts);
        results[idx] = { success: true, url: urls[idx], ...data };
      } catch (e) {
        results[idx] = { success: false, url: urls[idx], error: e.message };
      }
      if (opts.onItem) {
        try {
          opts.onItem(results[idx], idx);
        } catch {}
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, urls.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
};

// platform methods + download/batch soho export
Object.assign(alldlWithOpts, alldl);
alldlWithOpts.download = alldlWithOpts.download;
alldlWithOpts.batch = alldlWithOpts.batch;

module.exports = { alldl: alldlWithOpts };
