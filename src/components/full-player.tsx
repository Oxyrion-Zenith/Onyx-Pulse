import {
  ChevronDown,
  FastForward,
  Maximize,
  Pause,
  PictureInPicture2,
  Play,
  Repeat,
  Repeat1,
  Rewind,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { formatTime } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { usePlayer } from "./player-provider";
import { Visualizer } from "./visualizer";

export function FullPlayer() {
  const { videoRef, current, currentTime, duration, buffered, embedUrl, waiting, error, seek, toggle } =
    usePlayer();
  const playing = useAppStore((s) => s.playing);
  const shuffle = useAppStore((s) => s.shuffle);
  const repeat = useAppStore((s) => s.repeat);
  const volume = useAppStore((s) => s.volume);
  const muted = useAppStore((s) => s.muted);
  const rate = useAppStore((s) => s.rate);
  const setView = useAppStore((s) => s.setView);
  const playNext = useAppStore((s) => s.playNext);
  const playPrev = useAppStore((s) => s.playPrev);
  const toggleShuffle = useAppStore((s) => s.toggleShuffle);
  const cycleRepeat = useAppStore((s) => s.cycleRepeat);
  const setVolume = useAppStore((s) => s.setVolume);
  const setMuted = useAppStore((s) => s.setMuted);
  const setRate = useAppStore((s) => s.setRate);
  const setPlayerOpen = useAppStore((s) => s.setPlayerOpen);

  const isVideo = current?.kind === "video" && !embedUrl;

  if (!current) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-display text-xl">Nothing is playing</p>
        <p className="text-sm text-muted-foreground">Open the library and pick a title.</p>
        <Button onClick={() => setView("library")}>Go to library</Button>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className="relative z-30 flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-2 bg-gradient-to-b from-background via-background/90 to-transparent px-3 pt-3 pb-8">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close player"
          onClick={() => {
            setPlayerOpen(false);
            setView("library");
          }}
        >
          <ChevronDown className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold">{current.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {current.artist ?? current.platform ?? "Onyx Pulse"}
          </p>
        </div>
        <select
          className="h-9 rounded-md bg-secondary px-2 text-xs"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          aria-label="Playback speed"
        >
          {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((r) => (
            <option key={r} value={r}>
              {r}×
            </option>
          ))}
        </select>
      </header>

      <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center px-4">
        {embedUrl ? (
          <iframe
            title={current.title}
            src={embedUrl}
            className="aspect-video w-full rounded-xl bg-black shadow-[var(--shadow-border)]"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : isVideo ? (
          <div className="aspect-video w-full" />
        ) : (
          <div className="flex h-full w-full max-w-lg flex-col items-center justify-center gap-6">
            <div className="relative size-56 overflow-hidden rounded-2xl bg-secondary shadow-[var(--shadow-border)]">
              {current.thumbnail ? (
                <img src={current.thumbnail} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-subtle">
                  <span className="font-display text-5xl text-muted-foreground">
                    {current.title.slice(0, 1)}
                  </span>
                </div>
              )}
            </div>
            <Visualizer className="h-24 w-full" />
          </div>
        )}
        {waiting && !embedUrl ? (
          <p className="absolute bottom-2 text-xs text-muted-foreground">Loading…</p>
        ) : null}
        {error ? <p className="absolute bottom-2 text-xs text-destructive">{error}</p> : null}
      </div>

      <div className="bg-gradient-to-t from-background via-background/95 to-transparent px-5 pt-8 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-2">
            <div className="relative h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="absolute inset-y-0 left-0 bg-foreground/20"
                style={{ width: `${bufferedPct}%` }}
              />
            </div>
            <Slider
              className="-mt-1.5"
              min={0}
              max={1000}
              step={1}
              value={[progress * 10]}
              onValueChange={([v]) => seek(((v ?? 0) / 1000) * (duration || 0))}
              aria-label="Seek"
            />
            <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Shuffle"
              onClick={toggleShuffle}
              className={shuffle ? "text-primary" : "text-muted-foreground"}
            >
              <Shuffle className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Previous" onClick={playPrev}>
              <SkipBack className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back 10 seconds"
              onClick={() => seek(currentTime - 10)}
            >
              <Rewind className="size-5" />
            </Button>
            <Button
              size="icon"
              className="size-14 rounded-full"
              aria-label={playing ? "Pause" : "Play"}
              onClick={toggle}
            >
              {playing ? <Pause className="size-6" /> : <Play className="size-6 translate-x-px" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Forward 10 seconds"
              onClick={() => seek(currentTime + 10)}
            >
              <FastForward className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Next" onClick={playNext}>
              <SkipForward className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Repeat"
              onClick={cycleRepeat}
              className={repeat === "off" ? "text-muted-foreground" : "text-primary"}
            >
              {repeat === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={() => setMuted(!muted)}
            >
              {muted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </Button>
            <Slider
              min={0}
              max={100}
              value={[muted ? 0 : volume * 100]}
              onValueChange={([v]) => setVolume((v ?? 0) / 100)}
              aria-label="Volume"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Picture in picture"
              onClick={() => {
                const v = videoRef.current;
                if (v && document.pictureInPictureEnabled) void v.requestPictureInPicture();
              }}
            >
              <PictureInPicture2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Fullscreen"
              onClick={() => {
                const v = videoRef.current;
                if (!v) return;
                if (document.fullscreenElement) void document.exitFullscreen();
                else void v.requestFullscreen();
              }}
            >
              <Maximize className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
