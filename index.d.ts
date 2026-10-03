/**
 * TypeScript definitions for rahad-all-downloader-v2
 * All-in-one social media video downloader
 */

export interface DownloaderMetadata {
  Author: string;
  message: string;
  Facebook: string;
}

/** Normalized response — same shape for every platform via `alldl(url)` */
export interface NormalizedData {
  title: string;
  videoUrl: string;
  source: string;
}

export interface NormalizedResult {
  metadata: DownloaderMetadata;
  data: NormalizedData;
}

/** Full platform response — via `alldl.tiktok(url)` etc. */
export interface PlatformData {
  title?: string;
  author?: string;
  thumbnail?: string | null;
  download?: unknown;
  stats?: unknown;
  [key: string]: unknown;
}

export interface PlatformResult {
  metadata: DownloaderMetadata;
  success: boolean;
  source: string;
  data: PlatformData;
}

export interface AllDLOptions {
  /** How many times to retry transient failures (with backoff). Default: 0 */
  retries?: number;
}

export interface DownloadProgress {
  done: number;
  total: number | null;
  percent: number | null;
}

export interface DownloadOptions extends AllDLOptions {
  /** Progress callback: { done, total, percent } */
  onProgress?: (p: DownloadProgress) => void;
}

export interface DownloadResult {
  path: string;
  bytes: number;
  title: string;
  source: string;
  videoUrl: string;
}

export interface BatchOptions extends AllDLOptions {
  /** Max concurrent requests. Default: 3 */
  concurrency?: number;
  /** Called when each item completes */
  onItem?: (item: BatchItem, index: number) => void;
}

export type BatchItem =
  | ({ success: true; url: string } & NormalizedResult)
  | { success: false; url: string; error: string };

export interface XOptions {
  /** Quality preference, e.g. '720p' — selects the closest quality at or below it */
  quality?: string;
}

/** Metadata-only result — via `alldl.info(url)` (no download) */
export interface InfoAuthor {
  name: string | null;
  url: string | null;
}

export interface InfoResult {
  /** Detected site: 'tiktok' | 'youtube' | 'vimeo' | 'facebook' | 'instagram' | 'pinterest' | 'dailymotion' | ... | 'unknown' */
  site: string;
  url: string;
  title: string | null;
  author: InfoAuthor;
  /** Seconds, or null when not available. TikTok thumbnails are signed CDN URLs — they expire */
  thumbnail: string | null;
  duration: number | null;
  description: string | null;
}

export interface InfoOptions {
  /** For Facebook/Instagram oEmbed: 'APP_ID|APP_SECRET' (user-supplied, never hardcode) */
  appToken?: string;
}

export interface AllDL {
  /** Auto-detect platform from URL → normalized `{ title, videoUrl, source }` */
  (url: string, opts?: AllDLOptions): Promise<NormalizedResult>;
  /**
   * Resolves and saves to disk as a file.
   * If `dest` is a folder, the filename is auto-generated from the title;
   * if it is a file path, that path is used as-is.
   */
  download(url: string, dest: string, opts?: DownloadOptions): Promise<DownloadResult>;
  /**
   * Batch many URLs at once — never throws.
   * Each item resolves to `{ success, ... }` or `{ success: false, error }`.
   */
  batch(urls: string[], opts?: BatchOptions): Promise<BatchItem[]>;
  /** TikTok — full data: no-watermark/watermark/music + stats */
  tiktok(url: string): Promise<PlatformResult>;
  /** Facebook — full data: HD/SD direct links */
  fb(url: string): Promise<PlatformResult>;
  /** Instagram — reels/posts/IGTV, no login needed */
  insta(url: string): Promise<PlatformResult>;
  /** Likee — direct video */
  likee(url: string): Promise<PlatformResult>;
  /** Threads — video & image extraction */
  threads(url: string): Promise<PlatformResult>;
  /** Pinterest — direct video */
  pinterest(url: string): Promise<PlatformResult>;
  /** YouTube — direct stream URL */
  youtube(url: string): Promise<PlatformResult>;
  /** CapCut — template video */
  capcut(url: string): Promise<PlatformResult>;
  /** Kwai — direct video */
  kwai(url: string): Promise<PlatformResult>;
  /** Dailymotion — HLS master stream */
  dailymotion(url: string): Promise<PlatformResult>;
  /** Vimeo — direct progressive MP4 */
  vimeo(url: string): Promise<PlatformResult>;
  /** X (Twitter) — multi-quality video & photo */
  x(url: string, opts?: XOptions): Promise<PlatformResult>;
  /** X (Twitter) — alias of `x` */
  twitter(url: string, opts?: XOptions): Promise<PlatformResult>;
  /** Snapchat — spotlight/stories video & photo */
  snapchat(url: string): Promise<PlatformResult>;
  /**
   * Metadata only — no download. Returns
   * `{ site, url, title, author:{name,url}, thumbnail, duration, description }`.
   * Unavailable fields are `null`, never fabricated data.
   * For Facebook/Instagram, pass `{ appToken: 'APP_ID|APP_SECRET' }`.
   */
  info(url: string, opts?: InfoOptions): Promise<InfoResult>;
}

export declare const alldl: AllDL;
