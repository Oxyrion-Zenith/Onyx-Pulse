import { youtubeId, vimeoId, detectPlatform, isDirectMediaUrl, toEmbedUrl } from "./url-parse";
import type { ExtractFormat, ExtractResult } from "./types";

const PRIVATE =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|::1|\[::1\])/;
const PRIVATE_HOST = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|::1)$/i;

export function assertPublicHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed");
  }
  if (PRIVATE_HOST.test(url.hostname) || PRIVATE.test(url.hostname)) {
    throw new Error("That address is not allowed");
  }
  return url;
}

export const BROWSER_UA =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 Brave/126";

const TRACKER_HOSTS = [
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "facebook.net",
  "scorecardresearch.com",
  "adservice.google.com",
  "googlesyndication.com",
  "hotjar.com",
  "segment.io",
  "mixpanel.com",
];

export function isTrackerUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return TRACKER_HOSTS.some((t) => host === t || host.endsWith(`.${t}`));
  } catch {
    return false;
  }
}

export async function fetchUpstream(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const target = assertPublicHttpUrl(url);
  const headers = new Headers(init.headers);
  if (!headers.has("user-agent")) headers.set("user-agent", BROWSER_UA);
  if (!headers.has("accept")) {
    headers.set("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    return await fetch(target.toString(), {
      ...init,
      headers,
      redirect: "follow",
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

function rewriteM3u8(text: string, playlistUrl: string): string {
  const base = new URL(playlistUrl);
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_, uri: string) => {
          const abs = new URL(uri, base).toString();
          return `URI="/api/media?url=${encodeURIComponent(abs)}"`;
        });
      }
      const abs = new URL(trimmed, base).toString();
      return `/api/media?url=${encodeURIComponent(abs)}`;
    })
    .join("\n");
}

export async function proxyMedia(url: string): Promise<Response> {
  const res = await fetchUpstream(url, {
    headers: { accept: "*/*" },
  });
  const type = res.headers.get("content-type") ?? "application/octet-stream";
  const headers = new Headers();
  headers.set("content-type", type);
  const len = res.headers.get("content-length");
  if (len) headers.set("content-length", len);
  headers.set("cache-control", "private, max-age=120");
  headers.set("access-control-allow-origin", "*");

  if (/mpegurl|m3u8|application\/vnd\.apple\.mpegurl/i.test(type) || url.includes(".m3u8")) {
    const text = await res.text();
    const rewritten = rewriteM3u8(text, res.url || url);
    headers.set("content-type", "application/vnd.apple.mpegurl");
    headers.delete("content-length");
    return new Response(rewritten, { status: 200, headers });
  }

  return new Response(res.body, { status: res.status, headers });
}

function pickThumb(thumbs: unknown): string | undefined {
  if (!Array.isArray(thumbs) || !thumbs.length) return undefined;
  const last = thumbs[thumbs.length - 1] as { url?: string };
  return last?.url;
}

async function extractYouTube(id: string, pageUrl: string): Promise<ExtractResult> {
  const body = {
    context: {
      client: {
        clientName: "ANDROID",
        clientVersion: "19.28.35",
        androidSdkVersion: 34,
        hl: "en",
        gl: "US",
      },
    },
    videoId: id,
    contentCheckOk: true,
    racyCheckOk: true,
  };

  let data: Record<string, unknown> = {};
  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "com.google.android.youtube/19.28.35 (Linux; U; Android 14) gzip",
        "x-youtube-client-name": "3",
        "x-youtube-client-version": "19.28.35",
      },
      body: JSON.stringify(body),
    });
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }

  const details = (data.videoDetails ?? {}) as {
    title?: string;
    author?: string;
    lengthSeconds?: string;
    thumbnail?: { thumbnails?: { url: string }[] };
  };
  const streaming = (data.streamingData ?? {}) as {
    formats?: Record<string, unknown>[];
    adaptiveFormats?: Record<string, unknown>[];
  };

  const raw = [...(streaming.formats ?? []), ...(streaming.adaptiveFormats ?? [])];
  const formats: ExtractFormat[] = raw
    .map((f, i) => {
      const mime = String(f.mimeType ?? "video/mp4");
      const url = typeof f.url === "string" ? f.url : "";
      const quality = String(f.qualityLabel ?? f.audioQuality ?? "");
      return {
        id: String(f.itag ?? i),
        label: quality
          ? `${quality} · ${mime.split(";")[0]}`
          : mime.split(";")[0] ?? "media",
        mime,
        quality,
        url,
        hasAudio: mime.includes("audio") || f.audioChannels != null,
        hasVideo: mime.includes("video"),
        bitrate: typeof f.bitrate === "number" ? f.bitrate : undefined,
        contentLength: f.contentLength ? Number(f.contentLength) : undefined,
      };
    })
    .filter((f) => f.url);

  let title = details.title;
  let author = details.author;
  let thumbnail = pickThumb(details.thumbnail?.thumbnails);
  let duration = details.lengthSeconds ? Number(details.lengthSeconds) : undefined;

  if (!title) {
    try {
      const oe = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(pageUrl)}&format=json`,
      );
      if (oe.ok) {
        const j = (await oe.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
        title = j.title ?? title;
        author = j.author_name ?? author;
        thumbnail = j.thumbnail_url ?? thumbnail;
      }
    } catch {
      /* ignore */
    }
  }

  const combined = formats.filter((f) => f.hasAudio && f.hasVideo);
  const audioOnly = formats.filter((f) => f.hasAudio && !f.hasVideo);
  const ordered = [...combined, ...audioOnly, ...formats.filter((f) => !combined.includes(f) && !audioOnly.includes(f))];

  return {
    title: title ?? "YouTube video",
    author,
    thumbnail,
    duration,
    platform: "YouTube",
    pageUrl,
    embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
    formats: ordered,
    note: ordered.length
      ? undefined
      : "YouTube did not return a direct file. You can still play it in the library via the embedded player.",
  };
}

async function extractVimeo(id: string, pageUrl: string): Promise<ExtractResult> {
  let title = "Vimeo video";
  let author: string | undefined;
  let thumbnail: string | undefined;
  const formats: ExtractFormat[] = [];
  try {
    const cfg = await fetch(`https://player.vimeo.com/video/${id}/config`, {
      headers: { "user-agent": BROWSER_UA },
    });
    if (cfg.ok) {
      const j = (await cfg.json()) as {
        video?: { title?: string; owner?: { name?: string }; thumbs?: Record<string, string> };
        request?: { files?: { progressive?: { quality: string; url: string; mime?: string }[] } };
      };
      title = j.video?.title ?? title;
      author = j.video?.owner?.name;
      thumbnail = j.video?.thumbs?.base ?? Object.values(j.video?.thumbs ?? {})[0];
      for (const p of j.request?.files?.progressive ?? []) {
        formats.push({
          id: p.quality,
          label: `${p.quality} · mp4`,
          mime: p.mime ?? "video/mp4",
          quality: p.quality,
          url: p.url,
          hasAudio: true,
          hasVideo: true,
        });
      }
    }
  } catch {
    /* ignore */
  }
  return {
    title,
    author,
    thumbnail,
    platform: "Vimeo",
    pageUrl,
    embedUrl: `https://player.vimeo.com/video/${id}`,
    formats,
  };
}

function absUrl(maybe: string, base: string): string | null {
  try {
    return new URL(maybe, base).toString();
  } catch {
    return null;
  }
}

async function extractGeneric(pageUrl: string): Promise<ExtractResult> {
  const platform = detectPlatform(pageUrl);
  if (isDirectMediaUrl(pageUrl)) {
    const name = decodeURIComponent(pageUrl.split("/").pop()?.split("?")[0] ?? "Media");
    const isAudio = /\.(mp3|wav|flac|aac|ogg|opus|m4a)(\?|$)/i.test(pageUrl);
    return {
      title: name,
      platform,
      pageUrl,
      formats: [
        {
          id: "direct",
          label: isAudio ? "Audio file" : "Video file",
          mime: isAudio ? "audio/*" : "video/*",
          url: pageUrl,
          hasAudio: true,
          hasVideo: !isAudio,
        },
      ],
    };
  }

  const res = await fetchUpstream(pageUrl);
  const type = res.headers.get("content-type") ?? "";
  if (/video|audio|mpegurl|ogg|webm|mp4/i.test(type) && !/html/i.test(type)) {
    const name = decodeURIComponent(pageUrl.split("/").pop()?.split("?")[0] ?? "Media");
    return {
      title: name,
      platform,
      pageUrl,
      formats: [
        {
          id: "direct",
          label: type.split(";")[0] ?? "Media",
          mime: type,
          url: res.url || pageUrl,
          hasAudio: /audio/i.test(type),
          hasVideo: /video/i.test(type),
        },
      ],
    };
  }

  const html = (await res.text()).slice(0, 1_500_000);
  const finalUrl = res.url || pageUrl;
  const formats: ExtractFormat[] = [];
  const seen = new Set<string>();

  const push = (raw: string, label: string, mime = "video/mp4") => {
    const url = absUrl(raw.replace(/&/g, "&"), finalUrl);
    if (!url || seen.has(url)) return;
    if (!/^https?:/i.test(url)) return;
    seen.add(url);
    const isAudio = /audio|\.mp3|\.m4a|\.ogg|\.flac|\.wav/i.test(url + mime);
    const isHls = /\.m3u8/i.test(url);
    formats.push({
      id: `src_${formats.length}`,
      label: isHls ? `${label} · HLS` : label,
      mime: isHls ? "application/vnd.apple.mpegurl" : mime,
      url,
      hasAudio: true,
      hasVideo: !isAudio,
    });
  };

  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1];
  const ogVideo =
    html.match(/<meta[^>]+property=["']og:video(?::url)?["'][^>]+content=["']([^"']+)/i)?.[1] ??
    html.match(/<meta[^>]+property=["']og:audio["'][^>]+content=["']([^"']+)/i)?.[1];
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)?.[1];
  const titleTag = html.match(/<title[^>]*>([^<]+)/i)?.[1];
  const twitterPlayer = html.match(
    /<meta[^>]+name=["']twitter:player:stream["'][^>]+content=["']([^"']+)/i,
  )?.[1];

  if (ogVideo) push(ogVideo, "Open Graph", "video/mp4");
  if (twitterPlayer) push(twitterPlayer, "Stream", "video/mp4");

  const sourceRe = /<(?:source|video|audio)[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = sourceRe.exec(html))) {
    const src = m[1];
    if (src) push(src, "Page source");
  }

  const fileRe =
    /https?:\/\/[^\s"'<>]+?\.(?:mp4|webm|m3u8|mp3|m4a|aac|ogg|wav|flac)(?:\?[^\s"'<>]*)?/gi;
  while ((m = fileRe.exec(html))) {
    if (m[0]) push(m[0], "Linked file");
  }

  const jsonLd = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of jsonLd) {
    try {
      const data = JSON.parse(block[1] ?? "null") as Record<string, unknown> | Record<string, unknown>[];
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        const content = node.contentUrl ?? node.embedUrl ?? (node as { url?: string }).url;
        if (typeof content === "string") push(content, "Structured data");
      }
    } catch {
      /* ignore */
    }
  }

  return {
    title: decodeHtml(ogTitle || titleTag || hostnameTitle(finalUrl)),
    thumbnail: ogImage ? absUrl(ogImage, finalUrl) ?? undefined : undefined,
    platform,
    pageUrl: finalUrl,
    embedUrl: toEmbedUrl(finalUrl),
    formats,
    note: formats.length
      ? undefined
      : "No direct media file was found on this page. You can still save it as a playable link.",
  };
}

function decodeHtml(s: string): string {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function hostnameTitle(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Media";
  }
}

export async function extractMedia(pageUrl: string): Promise<ExtractResult> {
  const url = assertPublicHttpUrl(pageUrl).toString();
  const yt = youtubeId(url);
  if (yt) return extractYouTube(yt, url);
  const vm = vimeoId(url);
  if (vm) return extractVimeo(vm, url);
  return extractGeneric(url);
}

const TRACKER_RE = new RegExp(
  `(google-analytics\\.com|googletagmanager\\.com|doubleclick\\.net|facebook\\.net|scorecardresearch\\.com|googlesyndication\\.com|hotjar\\.com)`,
  "i",
);

export async function browsePage(pageUrl: string, shields: boolean): Promise<Response> {
  const res = await fetchUpstream(pageUrl);
  const type = res.headers.get("content-type") ?? "text/html";
  if (!/html/i.test(type)) {
    const headers = new Headers();
    headers.set("content-type", type);
    const len = res.headers.get("content-length");
    if (len) headers.set("content-length", len);
    headers.set("x-frame-options", "ALLOWALL");
    headers.set("content-security-policy", "frame-ancestors *");
    return new Response(res.body, { status: res.status, headers });
  }

  let html = await res.text();
  const finalUrl = res.url || pageUrl;
  const origin = new URL(finalUrl);

  html = html.replace(/<meta[^>]+http-equiv=["']refresh["'][^>]*>/gi, "");
  html = html.replace(/<base[^>]*>/i, "");

  if (shields) {
    html = html.replace(
      /<script[^>]+src=["'][^"']+["'][^>]*>\s*<\/script>/gi,
      (tag) => (TRACKER_RE.test(tag) ? "" : tag),
    );
  }

  const interceptor = `<base href="${origin.href}">
<script>
(function(){
  try {
    Object.defineProperty(window, 'top', { get: function(){ return window.self; } });
    Object.defineProperty(window, 'parent', { get: function(){ return window.self; } });
  } catch (e) {}
  function proxied(u){
    try {
      var abs = new URL(u, ${JSON.stringify(origin.href)}).toString();
      if (abs.indexOf('/api/browse') !== -1) return abs;
      return '/api/browse?url=' + encodeURIComponent(abs);
    } catch(e) { return u; }
  }
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a || !a.href) return;
    if (a.target === '_blank') return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return;
    e.preventDefault();
    location.href = proxied(a.href);
  }, true);
  document.addEventListener('submit', function(e){
    var form = e.target;
    if (!form || !form.action) return;
    try {
      var action = form.getAttribute('action') || ${JSON.stringify(origin.href)};
      form.setAttribute('action', proxied(action));
    } catch (err) {}
  }, true);
  window.addEventListener('load', function(){
    try {
      parent.postMessage({ type: 'onyx-browse', title: document.title, url: ${JSON.stringify(finalUrl)} }, '*');
    } catch (e) {}
  });
})();
</script>`;

  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (h) => `${h}\n${interceptor}`);
  } else {
    html = interceptor + html;
  }

  const headers = new Headers();
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("content-security-policy", "frame-ancestors *");
  headers.set("x-frame-options", "ALLOWALL");
  headers.set("cache-control", "private, max-age=30");
  return new Response(html, { status: 200, headers });
}
