import {
  ChevronRight,
  Download,
  EyeOff,
  FolderInput,
  Image as ImageIcon,
  LayoutGrid,
  Music4,
  Settings,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { ViewId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePlayer } from "../player-provider";
import { Visualizer } from "../visualizer";

const tiles: {
  id: ViewId;
  title: string;
  tone: string;
  icon: typeof ImageIcon;
}[] = [
  { id: "themes", title: "Themes", tone: "bg-tile-themes text-white", icon: ImageIcon },
  { id: "convert", title: "Video to MP3", tone: "bg-tile-convert text-white", icon: Music4 },
  { id: "hidden", title: "Hidden", tone: "bg-tile-hidden text-white", icon: EyeOff },
  { id: "downloads", title: "Downloads", tone: "bg-tile-downloads text-white", icon: Download },
];

const rows: { id: ViewId; title: string; icon: typeof Settings }[] = [
  { id: "settings", title: "Settings", icon: Settings },
  { id: "transfer", title: "File Transfer", icon: FolderInput },
  { id: "widgets", title: "Widgets", icon: LayoutGrid },
];

export function HomeView() {
  const setView = useAppStore((s) => s.setView);
  const widgets = useAppStore((s) => s.widgets);
  const library = useAppStore((s) => s.library);
  const downloads = useAppStore((s) => s.downloads);
  const streams = useAppStore((s) => s.streams);
  const playItem = useAppStore((s) => s.playItem);
  const { current } = usePlayer();
  const playing = useAppStore((s) => s.playing);

  const recent = library.filter((m) => !m.hidden).slice(0, 4);
  const activeDl = downloads.filter((d) => d.status === "downloading");

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-8">
      <header className="pt-6 pb-5">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Player & Browser</p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">Onyx Pulse</h1>
      </header>

      {widgets.nowPlaying && current ? (
        <button
          type="button"
          onClick={() => setView("player")}
          className="mb-5 flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-[var(--shadow-border)]"
        >
          <div className="size-14 overflow-hidden rounded-xl bg-subtle">
            {current.thumbnail ? (
              <img src={current.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Now playing</p>
            <p className="truncate font-medium">{current.title}</p>
            {playing ? <Visualizer className="mt-1 h-6 w-full" /> : null}
          </div>
        </button>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => setView(tile.id)}
              className={cn(
                "relative flex min-h-[132px] flex-col items-start justify-between overflow-hidden rounded-2xl p-4 text-left transition-transform duration-200 active:scale-[0.98]",
                tile.tone,
              )}
            >
              <span className="font-display text-lg font-semibold">{tile.title}</span>
              <span className="absolute right-3 bottom-3 flex size-14 items-center justify-center rounded-xl bg-white/20">
                <Icon className="size-7" strokeWidth={1.75} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-1">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => setView(row.id)}
              className="flex h-14 w-full items-center gap-4 rounded-xl px-1 text-left hover:bg-secondary"
            >
              <span className="flex size-11 items-center justify-center rounded-lg text-foreground">
                <Icon className="size-6" strokeWidth={1.6} />
              </span>
              <span className="flex-1 font-display text-lg">{row.title}</span>
              <ChevronRight className="size-5 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {widgets.continueWatching && recent.length ? (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Continue
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recent.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => playItem(item.id)}
                className="w-36 shrink-0 text-left"
              >
                <div className="aspect-video overflow-hidden rounded-lg bg-subtle">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      {item.title.slice(0, 1)}
                    </div>
                  )}
                </div>
                <p className="mt-1.5 truncate text-xs">{item.title}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {widgets.downloads && activeDl.length ? (
        <section className="mt-6 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs text-muted-foreground uppercase">Active downloads</p>
          {activeDl.map((d) => (
            <p key={d.id} className="mt-1 truncate text-sm">
              {d.title} · {Math.round(d.progress * 100)}%
            </p>
          ))}
        </section>
      ) : null}

      {widgets.liveRadio && streams[0] ? (
        <button
          type="button"
          onClick={() => setView("streams")}
          className="mt-4 w-full rounded-2xl bg-card p-4 text-left shadow-[var(--shadow-border)]"
        >
          <p className="text-xs text-muted-foreground uppercase">Live radio</p>
          <p className="font-display text-lg">{streams[0].name}</p>
        </button>
      ) : null}
    </div>
  );
}
