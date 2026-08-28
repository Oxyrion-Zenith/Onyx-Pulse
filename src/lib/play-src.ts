import { getMediaBlob } from "./media-db";
import type { MediaItem } from "./types";
import { isHlsUrl } from "./url-parse";

export function proxyUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("/")) return url;
  return `/api/media?url=${encodeURIComponent(url)}`;
}

export async function resolvePlayable(item: MediaItem): Promise<{
  src: string | null;
  embed: string | null;
  hls: boolean;
  objectUrl?: string;
}> {
  if (item.embedUrl && !item.url && !item.blobId) {
    return { src: null, embed: item.embedUrl, hls: false };
  }
  if (item.blobId) {
    const blob = await getMediaBlob(item.blobId);
    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      return { src: objectUrl, embed: null, hls: blob.type.includes("mpegurl"), objectUrl };
    }
  }
  if (item.url) {
    return {
      src: proxyUrl(item.url),
      embed: item.embedUrl ?? null,
      hls: isHlsUrl(item.url),
    };
  }
  if (item.embedUrl) return { src: null, embed: item.embedUrl, hls: false };
  return { src: null, embed: null, hls: false };
}
