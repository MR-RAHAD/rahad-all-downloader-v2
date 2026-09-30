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
  /** Transient fail hole kotobar abar try korbe (backoff soho). Default: 0 */
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
  /** Ekshathe koyta request cholbe. Default: 3 */
  concurrency?: number;
  /** Proti item sesh hole call hobe */
  onItem?: (item: BatchItem, index: number) => void;
}

export type BatchItem =
  | ({ success: true; url: string } & NormalizedResult)
  | { success: false; url: string; error: string };

export interface XOptions {
  /** Quality preference, jemon '720p' — er <= closest quality select hobe */
  quality?: string;
}

export interface AllDL {
  /** Auto-detect platform from URL → normalized `{ title, videoUrl, source }` */
  (url: string, opts?: AllDLOptions): Promise<NormalizedResult>;
  /**
   * Resolve + file hishebe disk e save kore.
   * `dest` folder hole filename auto (title theke), file path hole oitai use hobe.
   */
  download(url: string, dest: string, opts?: DownloadOptions): Promise<DownloadResult>;
  /**
   * Ekbare onek URL — kokhono throw kore na,
   * proti item `{ success, ... }` / `{ success: false, error }` akare ashe.
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
  /** X (Twitter) — multi-quality video & photo */
  x(url: string, opts?: XOptions): Promise<PlatformResult>;
  /** X (Twitter) — alias of `x` */
  twitter(url: string, opts?: XOptions): Promise<PlatformResult>;
  /** Snapchat — spotlight/stories video & photo */
  snapchat(url: string): Promise<PlatformResult>;
}

export declare const alldl: AllDL;
