export function isDirectMediaUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    return /\.(mp4|webm|mkv|mov|m4v|mp3|wav|flac|aac|ogg|opus|m4a|m3u8|mpd)(\?|$)/.test(path);
  } catch {
    return false;
  }
}

export function mediaKindFromUrl(url: string): "video" | "audio" {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  if (/\.(mp3|wav|flac|aac|ogg|opus|m4a)$/.test(path)) return "audio";
  return "video";
}

export function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url) || url.includes("m3u8");
}

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") {
        return parts[1] ?? null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function vimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("vimeo.com")) return null;
    const id = u.pathname.split("/").filter(Boolean).pop();
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function detectPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("youtube") || host === "youtu.be") return "YouTube";
    if (host.includes("vimeo")) return "Vimeo";
    if (host.includes("soundcloud")) return "SoundCloud";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("instagram")) return "Instagram";
    if (host === "x.com" || host.includes("twitter")) return "X";
    if (host.includes("reddit") || host === "v.redd.it") return "Reddit";
    if (host.includes("dailymotion")) return "Dailymotion";
    if (host.includes("twitch")) return "Twitch";
    if (host.includes("facebook") || host === "fb.watch") return "Facebook";
    if (host.includes("archive.org")) return "Internet Archive";
    if (host.includes("bandcamp")) return "Bandcamp";
    if (isDirectMediaUrl(url)) return "Direct";
    return host;
  } catch {
    return "Unknown";
  }
}

export function toEmbedUrl(url: string): string | undefined {
  const yt = youtubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1`;
  const vm = vimeoId(url);
  if (vm) return `https://player.vimeo.com/video/${vm}`;
  return undefined;
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes(" ") || !trimmed.includes(".")) {
    return braveSearchUrl(trimmed);
  }
  return `https://${trimmed}`;
}

export function braveSearchUrl(q: string, engine: "brave" | "duckduckgo" | "startpage" = "brave") {
  const query = encodeURIComponent(q);
  if (engine === "duckduckgo") return `https://duckduckgo.com/?q=${query}`;
  if (engine === "startpage") return `https://www.startpage.com/sp/search?query=${query}`;
  return `https://search.brave.com/search?q=${query}`;
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
