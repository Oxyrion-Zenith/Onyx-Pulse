import { Clock, Play } from "lucide-react";
import { formatTime } from "@/lib/format";
import type { MediaItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MediaCard({
  item,
  onPlay,
  onHold,
}: {
  item: MediaItem;
  onPlay: () => void;
  onHold?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      onContextMenu={(e) => {
        if (!onHold) return;
        e.preventDefault();
        onHold();
      }}
      className="group flex flex-col overflow-hidden rounded-xl bg-card text-left shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-200 hover:shadow-[var(--shadow-border-hover)]"
    >
      <div className="relative aspect-video overflow-hidden bg-subtle">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-2xl text-muted-foreground">
            {item.title.slice(0, 1)}
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Play className="size-4 translate-x-px" />
          </span>
        </span>
        {item.duration ? (
          <span className="absolute right-2 bottom-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] tabular-nums text-white">
            {formatTime(item.duration)}
          </span>
        ) : null}
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className={cn("truncate text-xs text-muted-foreground")}>
          {item.artist ?? item.platform ?? (item.kind === "audio" ? "Audio" : "Video")}
        </p>
      </div>
    </button>
  );
}

export function MediaRow({ item, onPlay }: { item: MediaItem; onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-secondary"
    >
      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-subtle">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            {item.kind === "audio" ? "A" : "V"}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">{item.artist ?? item.platform}</p>
      </div>
      {item.duration ? (
        <span className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
          <Clock className="size-3" />
          {formatTime(item.duration)}
        </span>
      ) : null}
    </button>
  );
}
