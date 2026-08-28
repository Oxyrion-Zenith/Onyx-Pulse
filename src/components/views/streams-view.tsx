import { Plus, Radio, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { isHlsUrl, mediaKindFromUrl, toEmbedUrl, detectPlatform } from "@/lib/url-parse";
import { uid } from "@/lib/utils";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";

export function StreamsView() {
  const streams = useAppStore((s) => s.streams);
  const addStream = useAppStore((s) => s.addStream);
  const removeStream = useAppStore((s) => s.removeStream);
  const addMedia = useAppStore((s) => s.addMedia);
  const playItem = useAppStore((s) => s.playItem);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  function playStream(id: string) {
    const s = streams.find((x) => x.id === id);
    if (!s) return;
    const mediaId = `streammedia_${s.id}`;
    addMedia({
      id: mediaId,
      title: s.name,
      kind: s.kind === "audio" ? "audio" : "video",
      source: "url",
      url: s.url,
      createdAt: Date.now(),
      platform: detectPlatform(s.url),
      embedUrl: toEmbedUrl(s.url),
    });
    playItem(mediaId);
  }

  function create() {
    const href = url.trim();
    if (!href) return;
    const kind = isHlsUrl(href)
      ? "hls"
      : mediaKindFromUrl(href) === "audio"
        ? "audio"
        : toEmbedUrl(href)
          ? "embed"
          : "video";
    addStream({
      id: uid("stream"),
      name: name.trim() || "Untitled stream",
      url: href,
      kind,
      createdAt: Date.now(),
    });
    setName("");
    setUrl("");
    setOpen(false);
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-8">
      <header className="pt-6 pb-4">
        <h1 className="font-display text-2xl font-semibold text-primary">Streams</h1>
        <p className="text-sm text-muted-foreground">Live radio, HLS, and direct feeds</p>
      </header>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[168px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-transparent text-primary transition-colors hover:bg-secondary"
      >
        <Plus className="size-10" strokeWidth={1.5} />
        <span className="font-display text-lg text-foreground">New stream</span>
      </button>

      <div className="mt-5 space-y-3">
        {streams.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-[var(--shadow-border)]"
          >
            <button
              type="button"
              onClick={() => playStream(s.id)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
                <Radio className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{s.name}</span>
                <span className="block truncate text-xs text-muted-foreground uppercase">{s.kind}</span>
              </span>
            </button>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${s.name}`}
              onClick={() => removeStream(s.id)}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New stream</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… m3u8, mp3, mp4, or page"
            />
            <Button className="w-full" onClick={create} disabled={!url.trim()}>
              Add stream
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
