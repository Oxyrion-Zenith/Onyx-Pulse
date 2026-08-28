import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { saveBlobAsMedia } from "@/lib/downloader";
import { getMediaBlob } from "@/lib/media-db";
import { useAppStore } from "@/lib/store";
import { Button } from "../ui/button";

export function TransferView() {
  const library = useAppStore((s) => s.library);
  const addMedia = useAppStore((s) => s.addMedia);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const visible = library.filter((m) => !m.hidden);

  async function exportAll() {
    setStatus("Preparing files…");
    const payload = {
      exportedAt: Date.now(),
      items: visible.map((m) => ({
        title: m.title,
        artist: m.artist,
        kind: m.kind,
        url: m.url,
        platform: m.platform,
        embedUrl: m.embedUrl,
        thumbnail: m.thumbnail,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "onyx-pulse-library.json";
    a.click();
    setStatus("Library list exported. Local files can be sent one by one below.");
  }

  async function sendOne(id: string) {
    const item = library.find((m) => m.id === id);
    if (!item) return;
    if (item.blobId) {
      const blob = await getMediaBlob(item.blobId);
      if (blob) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${item.title}.${item.kind === "audio" ? "mp3" : "mp4"}`;
        a.click();
        return;
      }
    }
    if (item.url) window.open(item.url, "_blank");
  }

  async function receive(files: FileList | null) {
    if (!files?.length) return;
    let n = 0;
    for (const file of [...files]) {
      if (file.name.endsWith(".json")) {
        try {
          const data = JSON.parse(await file.text()) as {
            items?: { title: string; url?: string; kind?: "video" | "audio"; embedUrl?: string }[];
          };
          for (const it of data.items ?? []) {
            if (!it.url && !it.embedUrl) continue;
            addMedia({
              id: `imp_${Math.random().toString(36).slice(2)}`,
              title: it.title,
              kind: it.kind ?? "video",
              source: "url",
              url: it.url ?? "",
              embedUrl: it.embedUrl,
              createdAt: Date.now(),
              platform: "Imported",
            });
            n += 1;
          }
        } catch {
          /* ignore */
        }
        continue;
      }
      const item = await saveBlobAsMedia(file, {
        title: file.name.replace(/\.[^.]+$/, ""),
        kind: file.type.startsWith("audio") ? "audio" : "video",
        platform: "Received",
      });
      addMedia(item);
      n += 1;
    }
    setStatus(`Added ${n} item${n === 1 ? "" : "s"} to the library.`);
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-8">
      <header className="pt-6 pb-4">
        <h1 className="font-display text-2xl font-semibold">File Transfer</h1>
        <p className="text-sm text-muted-foreground">Send titles out or receive files into the library</p>
      </header>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => void exportAll()}
          className="flex items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-[var(--shadow-border)]"
        >
          <span className="flex size-12 items-center justify-center rounded-xl bg-secondary">
            <Download className="size-5" />
          </span>
          <span>
            <span className="block font-medium">Export library list</span>
            <span className="block text-xs text-muted-foreground">JSON catalog you can import later</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-[var(--shadow-border)]"
        >
          <span className="flex size-12 items-center justify-center rounded-xl bg-secondary">
            <Upload className="size-5" />
          </span>
          <span>
            <span className="block font-medium">Receive files</span>
            <span className="block text-xs text-muted-foreground">Videos, audio, or an exported list</span>
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => void receive(e.target.files)}
        />
      </div>

      {status ? <p className="mt-4 text-sm text-muted-foreground">{status}</p> : null}

      <h2 className="mt-8 mb-2 font-display text-sm tracking-wide text-muted-foreground uppercase">
        Send a title
      </h2>
      <div className="space-y-1">
        {visible.slice(0, 20).map((m) => (
          <div key={m.id} className="flex items-center gap-2 rounded-xl px-1 py-2">
            <span className="min-w-0 flex-1 truncate text-sm">{m.title}</span>
            <Button size="sm" variant="secondary" onClick={() => void sendOne(m.id)}>
              Send
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
