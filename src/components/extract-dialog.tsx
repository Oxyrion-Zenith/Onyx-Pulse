import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { fetchToBlob, saveBlobAsMedia } from "@/lib/downloader";
import { formatBytes } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { ExtractFormat, ExtractResult } from "@/lib/types";
import { uid } from "@/lib/utils";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

export function ExtractDialog({
  open,
  onOpenChange,
  result,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  result: ExtractResult | null;
}) {
  const addMedia = useAppStore((s) => s.addMedia);
  const addDownload = useAppStore((s) => s.addDownload);
  const updateDownload = useAppStore((s) => s.updateDownload);
  const playItem = useAppStore((s) => s.playItem);
  const [busy, setBusy] = useState<string | null>(null);

  if (!result) return null;
  const data = result;

  async function saveFormat(fmt: ExtractFormat) {
    const dlId = uid("dl");
    setBusy(fmt.id);
    addDownload({
      id: dlId,
      title: data.title,
      url: fmt.url,
      status: "downloading",
      progress: 0,
      createdAt: Date.now(),
      format: fmt.label,
    });
    try {
      const blob = await fetchToBlob(fmt.url, (ratio, bytes, total) => {
        updateDownload(dlId, { progress: ratio, bytes, totalBytes: total });
      });
      const item = await saveBlobAsMedia(blob, {
        title: data.title,
        artist: data.author,
        kind: fmt.hasVideo ? "video" : "audio",
        thumbnail: data.thumbnail,
        platform: data.platform,
        sourceUrl: data.pageUrl,
      });
      addMedia(item);
      updateDownload(dlId, { status: "done", progress: 1, mediaId: item.id });
      onOpenChange(false);
      playItem(item.id);
    } catch (err) {
      updateDownload(dlId, {
        status: "error",
        error: err instanceof Error ? err.message : "Download failed",
      });
    } finally {
      setBusy(null);
    }
  }

  function saveAsLink() {
    const id = uid("media");
    addMedia({
      id,
      title: data.title,
      artist: data.author,
      kind: "video",
      source: "embed",
      url: data.pageUrl,
      thumbnail: data.thumbnail,
      duration: data.duration,
      createdAt: Date.now(),
      platform: data.platform,
      embedUrl: data.embedUrl,
    });
    onOpenChange(false);
    playItem(id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="pr-6">{data.title}</DialogTitle>
          <DialogDescription>
            {data.author ? `${data.author} · ` : ""}
            {data.platform}
          </DialogDescription>
        </DialogHeader>
        {data.thumbnail ? (
          <img
            src={data.thumbnail}
            alt=""
            className="mb-3 aspect-video w-full rounded-lg object-cover"
          />
        ) : null}
        {data.note ? <p className="mb-3 text-xs text-muted-foreground">{data.note}</p> : null}
        <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
          {data.formats.map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              disabled={busy !== null}
              onClick={() => void saveFormat(fmt)}
              className="flex items-center justify-between rounded-lg bg-secondary px-3 py-3 text-left text-sm hover:bg-subtle disabled:opacity-50"
            >
              <span className="min-w-0 truncate">{fmt.label}</span>
              <span className="ml-3 flex items-center gap-2 text-xs text-muted-foreground">
                {fmt.contentLength ? formatBytes(fmt.contentLength) : null}
                {busy === fmt.id ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
              </span>
            </button>
          ))}
        </div>
        {data.embedUrl || data.pageUrl ? (
          <Button variant="outline" className="mt-3 w-full" onClick={saveAsLink}>
            Save as playable link
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
