import { LoaderCircle, Music4, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { convertToAudio, downloadBlob } from "@/lib/audio-convert";
import { saveBlobAsMedia } from "@/lib/downloader";
import { getMediaBlob } from "@/lib/media-db";
import { useAppStore } from "@/lib/store";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

export function ConvertView() {
  const library = useAppStore((s) => s.library);
  const addMedia = useAppStore((s) => s.addMedia);
  const playItem = useAppStore((s) => s.playItem);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | Blob | null>(null);
  const [label, setLabel] = useState<string>("");
  const [format, setFormat] = useState<"mp3" | "wav">("mp3");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videos = library.filter((m) => m.kind === "video" && !m.hidden);

  async function pickLibrary(id: string) {
    const item = library.find((m) => m.id === id);
    if (!item) return;
    setError(null);
    if (item.blobId) {
      const blob = await getMediaBlob(item.blobId);
      if (blob) {
        setFile(blob);
        setLabel(item.title);
        return;
      }
    }
    if (item.url) {
      try {
        const res = await fetch(`/api/media?url=${encodeURIComponent(item.url)}`);
        if (!res.ok) throw new Error("Could not fetch video");
        setFile(await res.blob());
        setLabel(item.title);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load that video");
      }
    }
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const out = await convertToAudio(file, format, setProgress);
      const base = (label || "audio").replace(/\.[^.]+$/, "");
      downloadBlob(out.blob, `${base}.${out.ext}`);
      const item = await saveBlobAsMedia(out.blob, {
        title: `${base}`,
        kind: "audio",
        platform: "Converted",
      });
      addMedia(item);
      playItem(item.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not decode audio from this file. Try another video.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-8">
      <header className="pt-6 pb-4">
        <h1 className="font-display text-2xl font-semibold">Video to MP3</h1>
        <p className="text-sm text-muted-foreground">Extract audio from any video on this device</p>
      </header>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex min-h-[180px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-4 text-center"
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-tile-convert text-white">
          <Music4 className="size-7" />
        </span>
        <span className="font-medium">{label || "Drop or choose a video"}</span>
        <span className="text-xs text-muted-foreground">MP4, WebM, MOV, MKV</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="video/*,audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setFile(f);
          setLabel(f.name);
          setError(null);
        }}
      />

      {videos.length ? (
        <div className="mt-5">
          <p className="mb-2 text-xs tracking-wide text-muted-foreground uppercase">From library</p>
          <div className="flex gap-2 overflow-x-auto">
            {videos.slice(0, 12).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => void pickLibrary(v.id)}
                className="w-28 shrink-0 text-left"
              >
                <div className="aspect-video overflow-hidden rounded-lg bg-subtle">
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <p className="mt-1 truncate text-[11px]">{v.title}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex gap-2">
        {(["mp3", "wav"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFormat(f)}
            className={`h-11 flex-1 rounded-lg text-sm uppercase ${
              format === f ? "bg-primary text-primary-foreground" : "bg-secondary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {busy ? <Progress className="mt-4" value={Math.round(progress * 100)} /> : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <Button className="mt-4 w-full" disabled={!file || busy} onClick={() => void run()}>
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {busy ? "Converting…" : `Extract ${format.toUpperCase()}`}
      </Button>
    </div>
  );
}
