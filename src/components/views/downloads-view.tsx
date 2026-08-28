import { Check, Download, LoaderCircle, Trash2, X } from "lucide-react";
import { formatBytes } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

export function DownloadsView() {
  const downloads = useAppStore((s) => s.downloads);
  const removeDownload = useAppStore((s) => s.removeDownload);
  const clearFinished = useAppStore((s) => s.clearFinishedDownloads);
  const playItem = useAppStore((s) => s.playItem);
  const setView = useAppStore((s) => s.setView);

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-8">
      <header className="flex items-end justify-between pt-6 pb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Downloads</h1>
          <p className="text-sm text-muted-foreground">Saved from the browser and links</p>
        </div>
        {downloads.length ? (
          <Button variant="ghost" size="sm" onClick={clearFinished}>
            Clear done
          </Button>
        ) : null}
      </header>

      {downloads.length === 0 ? (
        <div className="mt-16 text-center">
          <Download className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Open Browser, visit a page, and tap Download to save video or audio.
          </p>
          <Button className="mt-4" onClick={() => setView("browser")}>
            Open browser
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {downloads.map((d) => (
            <div key={d.id} className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-secondary">
                  {d.status === "downloading" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : d.status === "done" ? (
                    <Check className="size-4" />
                  ) : d.status === "error" ? (
                    <X className="size-4 text-destructive" />
                  ) : (
                    <Download className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.format ?? "Media"}
                    {d.bytes ? ` · ${formatBytes(d.bytes)}` : ""}
                    {d.totalBytes ? ` / ${formatBytes(d.totalBytes)}` : ""}
                  </p>
                  {d.status === "downloading" ? (
                    <Progress className="mt-2" value={Math.round(d.progress * 100)} />
                  ) : null}
                  {d.error ? <p className="mt-1 text-xs text-destructive">{d.error}</p> : null}
                </div>
                {d.mediaId ? (
                  <Button size="sm" variant="secondary" onClick={() => playItem(d.mediaId!)}>
                    Play
                  </Button>
                ) : (
                  <button
                    type="button"
                    className="flex size-9 items-center justify-center text-muted-foreground"
                    aria-label="Remove"
                    onClick={() => removeDownload(d.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
