import { putMediaBlob } from "./media-db";
import { uid } from "./utils";
import type { MediaItem } from "./types";
import { mediaKindFromUrl } from "./url-parse";
import { proxyUrl } from "./play-src";

export async function fetchToBlob(
  url: string,
  onProgress?: (ratio: number, bytes: number, total?: number) => void,
): Promise<Blob> {
  const res = await fetch(proxyUrl(url));
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const total = Number(res.headers.get("content-length") ?? 0) || undefined;
  const type = res.headers.get("content-type") ?? "application/octet-stream";
  if (!res.body) {
    const buf = await res.arrayBuffer();
    onProgress?.(1, buf.byteLength, buf.byteLength);
    return new Blob([buf], { type });
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      onProgress?.(total ? received / total : 0.5, received, total);
    }
  }
  onProgress?.(1, received, total ?? received);
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  return new Blob([bytes], { type });
}

export async function saveBlobAsMedia(
  blob: Blob,
  meta: {
    title: string;
    artist?: string;
    kind?: MediaItem["kind"];
    thumbnail?: string;
    platform?: string;
    hidden?: boolean;
    sourceUrl?: string;
  },
): Promise<MediaItem> {
  const id = uid("media");
  const blobId = uid("blob");
  await putMediaBlob(blobId, blob);
  const kind =
    meta.kind ??
    (blob.type.startsWith("audio")
      ? "audio"
      : blob.type.startsWith("video")
        ? "video"
        : meta.sourceUrl
          ? mediaKindFromUrl(meta.sourceUrl)
          : "video");
  return {
    id,
    title: meta.title,
    artist: meta.artist,
    kind,
    source: "local",
    url: meta.sourceUrl ?? "",
    blobId,
    thumbnail: meta.thumbnail,
    createdAt: Date.now(),
    hidden: meta.hidden,
    platform: meta.platform,
    mime: blob.type,
    size: blob.size,
  };
}
