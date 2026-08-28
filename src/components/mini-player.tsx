import { Pause, Play, SkipForward, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { usePlayer } from "./player-provider";

export function MiniPlayer() {
  const { current, toggle } = usePlayer();
  const playing = useAppStore((s) => s.playing);
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const playNext = useAppStore((s) => s.playNext);
  const setPlaying = useAppStore((s) => s.setPlaying);
  const setPlayerOpen = useAppStore((s) => s.setPlayerOpen);

  if (!current || view === "player") return null;

  return (
    <div className="border-t border-border bg-card/95 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => {
            setPlayerOpen(true);
            setView("player");
          }}
        >
          <div className="size-11 shrink-0 overflow-hidden rounded-md bg-secondary">
            {current.thumbnail ? (
              <img src={current.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                {current.kind === "audio" ? "A" : "V"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{current.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {current.artist ?? current.platform ?? "Now playing"}
            </p>
          </div>
        </button>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-label={playing ? "Pause" : "Play"}
          onClick={toggle}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
        </button>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-full text-foreground"
          aria-label="Next"
          onClick={playNext}
        >
          <SkipForward className="size-4" />
        </button>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-full text-muted-foreground"
          aria-label="Stop"
          onClick={() => {
            setPlaying(false);
            setPlayerOpen(false);
          }}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
