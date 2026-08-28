import Hls from "hls.js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EQ_FREQUENCIES, EQ_PRESETS } from "@/lib/eq";
import { resolvePlayable } from "@/lib/play-src";
import { useAppStore } from "@/lib/store";
import type { MediaItem } from "@/lib/types";

interface PlayerApi {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  analyser: AnalyserNode | null;
  current: MediaItem | null;
  currentTime: number;
  duration: number;
  buffered: number;
  embedUrl: string | null;
  waiting: boolean;
  error: string | null;
  seek: (t: number) => void;
  toggle: () => void;
}

const PlayerContext = createContext<PlayerApi | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const audioRef = useRef<{
    ctx: AudioContext;
    analyser: AnalyserNode;
    filters: BiquadFilterNode[];
  } | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentId = useAppStore((s) => s.currentId);
  const library = useAppStore((s) => s.library);
  const playing = useAppStore((s) => s.playing);
  const volume = useAppStore((s) => s.volume);
  const muted = useAppStore((s) => s.muted);
  const rate = useAppStore((s) => s.rate);
  const settings = useAppStore((s) => s.settings);
  const view = useAppStore((s) => s.view);
  const playNext = useAppStore((s) => s.playNext);
  const setPlaying = useAppStore((s) => s.setPlaying);
  const updateMedia = useAppStore((s) => s.updateMedia);

  const current = useMemo(
    () => library.find((m) => m.id === currentId) ?? null,
    [library, currentId],
  );

  const theater = view === "player" && current?.kind === "video" && !embedUrl;

  const ensureGraph = useCallback(() => {
    const video = videoRef.current;
    if (!video || audioRef.current) return audioRef.current;
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(video);
      const filters = EQ_FREQUENCIES.map((freq) => {
        const f = ctx.createBiquadFilter();
        f.type = "peaking";
        f.frequency.value = freq;
        f.Q.value = 1;
        f.gain.value = 0;
        return f;
      });
      const node: AnalyserNode = ctx.createAnalyser();
      node.fftSize = 256;
      node.smoothingTimeConstant = 0.82;
      let prev: AudioNode = source;
      for (const f of filters) {
        prev.connect(f);
        prev = f;
      }
      prev.connect(node);
      node.connect(ctx.destination);
      audioRef.current = { ctx, analyser: node, filters };
      setAnalyser(node);
    } catch {
      /* media element source can fail on tainted media */
    }
    return audioRef.current;
  }, []);

  useEffect(() => {
    const graph = audioRef.current;
    if (!graph) return;
    const gains = settings.eqEnabled ? EQ_PRESETS[settings.eqPreset] : EQ_PRESETS.flat;
    graph.filters.forEach((f, i) => {
      f.gain.value = gains[i] ?? 0;
    });
  }, [settings.eqEnabled, settings.eqPreset]);

  useEffect(() => {
    const media = videoRef.current;
    if (!media) return;
    let cancelled = false;

    async function load(el: HTMLVideoElement) {
      setError(null);
      setEmbedUrl(null);
      setWaiting(true);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (!current) {
        el.removeAttribute("src");
        el.load();
        setWaiting(false);
        return;
      }
      try {
        const resolved = await resolvePlayable(current);
        if (cancelled) {
          if (resolved.objectUrl) URL.revokeObjectURL(resolved.objectUrl);
          return;
        }
        if (resolved.objectUrl) objectUrlRef.current = resolved.objectUrl;
        if (resolved.embed && !resolved.src) {
          setEmbedUrl(resolved.embed);
          setWaiting(false);
          setPlaying(false);
          return;
        }
        if (!resolved.src) {
          setError("Nothing to play");
          setWaiting(false);
          return;
        }
        el.crossOrigin = "anonymous";
        if (resolved.hls && Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, maxBufferLength: 30 });
          hls.loadSource(resolved.src);
          hls.attachMedia(el);
          hlsRef.current = hls;
        } else {
          el.src = resolved.src;
        }
        ensureGraph();
        if (useAppStore.getState().playing) {
          await audioRef.current?.ctx.resume();
          await el.play().catch(() => setPlaying(false));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load media");
          if (current.embedUrl) setEmbedUrl(current.embedUrl);
        }
      } finally {
        if (!cancelled) setWaiting(false);
      }
    }

    void load(media);
    return () => {
      cancelled = true;
    };
  }, [current, ensureGraph, setPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = muted;
    video.playbackRate = rate;
  }, [volume, muted, rate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || embedUrl) return;
    if (playing) {
      void audioRef.current?.ctx.resume();
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, [playing, embedUrl, setPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => setCurrentTime(video.currentTime);
    const onDur = () => {
      setDuration(video.duration || 0);
      if (current && Number.isFinite(video.duration) && video.duration > 0) {
        updateMedia(current.id, { duration: video.duration });
      }
    };
    const onProg = () => {
      try {
        if (video.buffered.length) setBuffered(video.buffered.end(video.buffered.length - 1));
      } catch {
        /* ignore */
      }
    };
    const onEnd = () => playNext();
    const onWait = () => setWaiting(true);
    const onPlay = () => {
      setWaiting(false);
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    const onErr = () => setError("Playback failed");
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("durationchange", onDur);
    video.addEventListener("progress", onProg);
    video.addEventListener("ended", onEnd);
    video.addEventListener("waiting", onWait);
    video.addEventListener("playing", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onErr);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("durationchange", onDur);
      video.removeEventListener("progress", onProg);
      video.removeEventListener("ended", onEnd);
      video.removeEventListener("waiting", onWait);
      video.removeEventListener("playing", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onErr);
    };
  }, [current, playNext, setPlaying, updateMedia]);

  const seek = useCallback((t: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(t)) return;
    video.currentTime = Math.max(0, t);
    setCurrentTime(video.currentTime);
  }, []);

  const toggle = useCallback(() => {
    const next = !useAppStore.getState().playing;
    setPlaying(next);
  }, [setPlaying]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "ArrowRight") {
        seek(currentTime + 10);
      } else if (e.code === "ArrowLeft") {
        seek(currentTime - 10);
      } else if (e.key === "m" || e.key === "M") {
        useAppStore.getState().setMuted(!useAppStore.getState().muted);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentTime, seek, toggle]);

  const api = useMemo<PlayerApi>(
    () => ({
      videoRef,
      analyser,
      current,
      currentTime,
      duration,
      buffered,
      embedUrl,
      waiting,
      error,
      seek,
      toggle,
    }),
    [analyser, current, currentTime, duration, buffered, embedUrl, waiting, error, seek, toggle],
  );

  return (
    <PlayerContext.Provider value={api}>
      <video
        ref={videoRef}
        playsInline
        controls={false}
        preload="metadata"
        className={
          theater
            ? "pointer-events-none fixed inset-0 z-20 h-full w-full bg-black object-contain"
            : "pointer-events-none fixed top-0 left-0 z-0 h-px w-px opacity-0"
        }
      />
      {children}
    </PlayerContext.Provider>
  );
}
