import { Link2, Search, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { saveBlobAsMedia } from "@/lib/downloader";
import { deleteMediaBlob } from "@/lib/media-db";
import { useAppStore } from "@/lib/store";
import type { ExtractResult, MediaItem } from "@/lib/types";
import { uid } from "@/lib/utils";
import { normalizeUrl, toEmbedUrl, detectPlatform, mediaKindFromUrl, isDirectMediaUrl } from "@/lib/url-parse";
import { ExtractDialog } from "../extract-dialog";
import { MediaCard } from "../media-card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function LibraryView() {
  const library = useAppStore((s) => s.library);
  const addMedia = useAppStore((s) => s.addMedia);
  const removeMedia = useAppStore((s) => s.removeMedia);
  const playItem = useAppStore((s) => s.playItem);
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "video" | "audio">("all");
  const [url, setUrl] = useState("");
  const [extract, setExtract] = useState<ExtractResult | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState<MediaItem | null>(null);

  const items = useMemo(() => {
    const visible = library.filter((m) => !m.hidden);
    const byKind = filter === "all" ? visible : visible.filter((m) => m.kind === filter);
    const query = q.trim().toLowerCase();
    if (!query) return byKind;
    return byKind.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        (m.artist ?? "").toLowerCase().includes(query) ||
        (m.platform ?? "").toLowerCase().includes(query),
    );
  }, [library, filter, q]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    for (const file of [...files]) {
      const kind: MediaItem["kind"] = file.type.startsWith("audio") ? "audio" : "video";
      const item = await saveBlobAsMedia(file, {
        title: file.name.replace(/\.[^.]+$/, ""),
        kind,
        platform: "Device",
      });
      addMedia(item);
    }
  }

  async function addFromUrl() {
    const href = normalizeUrl(url);
    if (!href) return;
    setBusy(true);
    try {
      if (isDirectMediaUrl(href)) {
        const id = uid("media");
        addMedia({
          id,
          title: decodeURIComponent(href.split("/").pop()?.split("?")[0] ?? "Media"),
          kind: mediaKindFromUrl(href),
          source: "url",
          url: href,
          createdAt: Date.now(),
          platform: detectPlatform(href),
        });
        setUrl("");
        playItem(id);
        return;
      }
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: href }),
      });
      const data = (await res.json()) as ExtractResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not read that link");
      setExtract(data);
      setOpen(true);
      setUrl("");
    } catch {
      const id = uid("media");
      addMedia({
        id,
        title: href,
        kind: "video",
        source: "embed",
        url: href,
        createdAt: Date.now(),
        platform: detectPlatform(href),
        embedUrl: toEmbedUrl(href),
      });
      setUrl("");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: MediaItem) {
    if (item.blobId) await deleteMediaBlob(item.blobId).catch(() => undefined);
    removeMedia(item.id);
    setMenu(null);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-8">
      <header className="flex items-end justify-between gap-3 pt-6 pb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Library</h1>
          <p className="text-sm text-muted-foreground">{items.length} titles</p>
        </div>
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" />
          Import
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="video/*,audio/*"
          multiple
          className="hidden"
          onChange={(e) => void onFiles(e.target.files)}
        />
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search library"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {(["all", "video", "audio"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`h-9 rounded-md px-3 text-xs capitalize ${filter === f ? "bg-card shadow-[var(--shadow-border)]" : "text-muted-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void addFromUrl();
        }}
      >
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a video, audio, or page URL"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={busy || !url.trim()}>
          Add
        </Button>
      </form>

      {items.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-lg">Library is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">Import files from this device or paste a link.</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onPlay={() => playItem(item.id, items.map((m) => m.id))}
              onHold={() => setMenu(item)}
            />
          ))}
        </div>
      )}

      {menu ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
            <p className="font-display font-semibold">{menu.title}</p>
            <p className="mb-3 text-xs text-muted-foreground">Long-press options</p>
            <Button className="w-full" onClick={() => { playItem(menu.id); setMenu(null); }}>
              Play
            </Button>
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={() => {
                useAppStore.getState().updateMedia(menu.id, { hidden: true });
                setMenu(null);
              }}
            >
              Move to Hidden
            </Button>
            <Button variant="destructive" className="mt-2 w-full" onClick={() => void remove(menu)}>
              <Trash2 className="size-4" />
              Remove
            </Button>
            <Button variant="ghost" className="mt-2 w-full" onClick={() => setMenu(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <ExtractDialog open={open} onOpenChange={setOpen} result={extract} />
    </div>
  );
}
