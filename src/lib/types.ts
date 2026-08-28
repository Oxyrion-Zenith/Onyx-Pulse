export type ViewId =
  | "home"
  | "library"
  | "browser"
  | "streams"
  | "themes"
  | "convert"
  | "hidden"
  | "downloads"
  | "settings"
  | "transfer"
  | "widgets"
  | "player";

export type ThemeId = "onyx" | "ivory" | "slate" | "ember" | "forest" | "noir";

export type RepeatMode = "off" | "one" | "all";

export type MediaKind = "video" | "audio";

export type MediaSource = "local" | "url" | "embed" | "sample";

export interface MediaItem {
  id: string;
  title: string;
  artist?: string;
  kind: MediaKind;
  source: MediaSource;
  url: string;
  blobId?: string;
  thumbnail?: string;
  duration?: number;
  createdAt: number;
  hidden?: boolean;
  platform?: string;
  mime?: string;
  embedUrl?: string;
  size?: number;
}

export interface StreamItem {
  id: string;
  name: string;
  url: string;
  kind: "hls" | "audio" | "video" | "embed";
  artwork?: string;
  createdAt: number;
}

export interface DownloadItem {
  id: string;
  title: string;
  url: string;
  status: "queued" | "downloading" | "done" | "error";
  progress: number;
  error?: string;
  mediaId?: string;
  createdAt: number;
  bytes?: number;
  totalBytes?: number;
  format?: string;
}

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  loading?: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

export interface WidgetConfig {
  nowPlaying: boolean;
  continueWatching: boolean;
  quickConvert: boolean;
  downloads: boolean;
  liveRadio: boolean;
}

export interface EqBand {
  freq: number;
  gain: number;
}

export interface AppSettings {
  autoplay: boolean;
  resumePlayback: boolean;
  searchEngine: "brave" | "duckduckgo" | "startpage";
  defaultQuality: "auto" | "high" | "medium" | "audio";
  shields: boolean;
  reduceMotion: boolean;
  eqEnabled: boolean;
  eqPreset: "flat" | "bass" | "voice" | "treble" | "night";
}

export interface ExtractFormat {
  id: string;
  label: string;
  mime: string;
  quality?: string;
  url: string;
  hasAudio: boolean;
  hasVideo: boolean;
  bitrate?: number;
  contentLength?: number;
}

export interface ExtractResult {
  title: string;
  author?: string;
  thumbnail?: string;
  duration?: number;
  platform: string;
  pageUrl: string;
  embedUrl?: string;
  formats: ExtractFormat[];
  note?: string;
}
