import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppSettings,
  Bookmark,
  BrowserTab,
  DownloadItem,
  MediaItem,
  RepeatMode,
  StreamItem,
  ThemeId,
  ViewId,
  WidgetConfig,
} from "./types";
import { SAMPLE_LIBRARY, SAMPLE_STREAMS } from "./samples";
import { uid } from "./utils";

const defaultSettings: AppSettings = {
  autoplay: true,
  resumePlayback: true,
  searchEngine: "brave",
  defaultQuality: "auto",
  shields: true,
  reduceMotion: false,
  eqEnabled: false,
  eqPreset: "flat",
};

const defaultWidgets: WidgetConfig = {
  nowPlaying: true,
  continueWatching: true,
  quickConvert: true,
  downloads: true,
  liveRadio: true,
};

interface AppState {
  hydrated: boolean;
  view: ViewId;
  theme: ThemeId;
  library: MediaItem[];
  streams: StreamItem[];
  downloads: DownloadItem[];
  bookmarks: Bookmark[];
  history: Bookmark[];
  tabs: BrowserTab[];
  activeTabId: string;
  widgets: WidgetConfig;
  settings: AppSettings;
  hiddenPinHash: string | null;
  hiddenUnlocked: boolean;
  currentId: string | null;
  queue: string[];
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  rate: number;
  playing: boolean;
  playerOpen: boolean;
  seeded: boolean;

  setHydrated: () => void;
  setView: (view: ViewId) => void;
  setTheme: (theme: ThemeId) => void;
  addMedia: (item: MediaItem) => void;
  updateMedia: (id: string, patch: Partial<MediaItem>) => void;
  removeMedia: (id: string) => void;
  addStream: (item: StreamItem) => void;
  removeStream: (id: string) => void;
  addDownload: (item: DownloadItem) => void;
  updateDownload: (id: string, patch: Partial<DownloadItem>) => void;
  removeDownload: (id: string) => void;
  clearFinishedDownloads: () => void;
  addBookmark: (b: Bookmark) => void;
  removeBookmark: (id: string) => void;
  pushHistory: (b: Bookmark) => void;
  setTabs: (tabs: BrowserTab[]) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, patch: Partial<BrowserTab>) => void;
  setWidgets: (w: Partial<WidgetConfig>) => void;
  setSettings: (s: Partial<AppSettings>) => void;
  setHiddenPinHash: (hash: string | null) => void;
  setHiddenUnlocked: (v: boolean) => void;
  playItem: (id: string, queue?: string[]) => void;
  setPlaying: (v: boolean) => void;
  setPlayerOpen: (v: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (v: number) => void;
  setMuted: (v: boolean) => void;
  setRate: (v: number) => void;
  playNext: () => void;
  playPrev: () => void;
  seedIfNeeded: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      view: "home",
      theme: "onyx",
      library: [],
      streams: [],
      downloads: [],
      bookmarks: [
        {
          id: "bm_wiki",
          title: "Wikipedia",
          url: "https://en.wikipedia.org/wiki/Main_Page",
          createdAt: Date.now(),
        },
        {
          id: "bm_archive",
          title: "Internet Archive",
          url: "https://archive.org/",
          createdAt: Date.now(),
        },
        {
          id: "bm_brave",
          title: "Brave Search",
          url: "https://search.brave.com/",
          createdAt: Date.now(),
        },
      ],
      history: [],
      tabs: [{ id: "tab_home", url: "onyx://newtab", title: "New tab" }],
      activeTabId: "tab_home",
      widgets: defaultWidgets,
      settings: defaultSettings,
      hiddenPinHash: null,
      hiddenUnlocked: false,
      currentId: null,
      queue: [],
      shuffle: false,
      repeat: "off",
      volume: 0.85,
      muted: false,
      rate: 1,
      playing: false,
      playerOpen: false,
      seeded: false,

      setHydrated: () => set({ hydrated: true }),
      setView: (view) => set({ view, playerOpen: view === "player" }),
      setTheme: (theme) => set({ theme }),
      addMedia: (item) =>
        set((s) => ({ library: [item, ...s.library.filter((m) => m.id !== item.id)] })),
      updateMedia: (id, patch) =>
        set((s) => ({
          library: s.library.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      removeMedia: (id) =>
        set((s) => ({
          library: s.library.filter((m) => m.id !== id),
          queue: s.queue.filter((q) => q !== id),
          currentId: s.currentId === id ? null : s.currentId,
        })),
      addStream: (item) => set((s) => ({ streams: [item, ...s.streams] })),
      removeStream: (id) => set((s) => ({ streams: s.streams.filter((x) => x.id !== id) })),
      addDownload: (item) => set((s) => ({ downloads: [item, ...s.downloads] })),
      updateDownload: (id, patch) =>
        set((s) => ({
          downloads: s.downloads.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),
      removeDownload: (id) =>
        set((s) => ({ downloads: s.downloads.filter((d) => d.id !== id) })),
      clearFinishedDownloads: () =>
        set((s) => ({
          downloads: s.downloads.filter((d) => d.status === "downloading" || d.status === "queued"),
        })),
      addBookmark: (b) => set((s) => ({ bookmarks: [b, ...s.bookmarks] })),
      removeBookmark: (id) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
      pushHistory: (b) =>
        set((s) => ({
          history: [b, ...s.history.filter((h) => h.url !== b.url)].slice(0, 80),
        })),
      setTabs: (tabs) => set({ tabs }),
      setActiveTab: (id) => set({ activeTabId: id }),
      updateTab: (id, patch) =>
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      setWidgets: (w) => set((s) => ({ widgets: { ...s.widgets, ...w } })),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setHiddenPinHash: (hash) => set({ hiddenPinHash: hash }),
      setHiddenUnlocked: (v) => set({ hiddenUnlocked: v }),
      playItem: (id, queue) => {
        const lib = get().library;
        const item = lib.find((m) => m.id === id);
        const q =
          queue ??
          lib
            .filter((m) => !m.hidden && m.kind === item?.kind)
            .map((m) => m.id);
        set({
          currentId: id,
          queue: q.length ? q : [id],
          playing: true,
          playerOpen: true,
          view: "player",
        });
      },
      setPlaying: (v) => set({ playing: v }),
      setPlayerOpen: (v) => set({ playerOpen: v }),
      toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
      cycleRepeat: () =>
        set((s) => ({
          repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
        })),
      setVolume: (v) => set({ volume: v, muted: v === 0 ? true : false }),
      setMuted: (v) => set({ muted: v }),
      setRate: (v) => set({ rate: v }),
      playNext: () => {
        const { queue, currentId, shuffle, repeat } = get();
        if (!queue.length) return;
        const idx = queue.indexOf(currentId ?? "");
        if (repeat === "one" && currentId) {
          set({ playing: true });
          return;
        }
        let next: string | undefined;
        if (shuffle) {
          const rest = queue.filter((id) => id !== currentId);
          next = rest[Math.floor(Math.random() * rest.length)] ?? currentId ?? undefined;
        } else {
          next = queue[idx + 1];
          if (!next && repeat === "all") next = queue[0];
        }
        if (next) set({ currentId: next, playing: true, playerOpen: true, view: "player" });
        else set({ playing: false });
      },
      playPrev: () => {
        const { queue, currentId } = get();
        const idx = queue.indexOf(currentId ?? "");
        const prev = queue[idx - 1] ?? queue[0];
        if (prev) set({ currentId: prev, playing: true, playerOpen: true, view: "player" });
      },
      seedIfNeeded: () => {
        if (get().seeded) return;
        set({
          seeded: true,
          library: SAMPLE_LIBRARY,
          streams: SAMPLE_STREAMS,
        });
      },
    }),
    {
      name: "onyx-pulse",
      partialize: (s) => ({
        theme: s.theme,
        library: s.library,
        streams: s.streams,
        downloads: s.downloads.map((d) =>
          d.status === "downloading" ? { ...d, status: "error" as const, error: "Interrupted" } : d,
        ),
        bookmarks: s.bookmarks,
        history: s.history,
        widgets: s.widgets,
        settings: s.settings,
        hiddenPinHash: s.hiddenPinHash,
        volume: s.volume,
        muted: s.muted,
        rate: s.rate,
        shuffle: s.shuffle,
        repeat: s.repeat,
        seeded: s.seeded,
        currentId: s.currentId,
        queue: s.queue,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
        state?.seedIfNeeded();
      },
    },
  ),
);

export function newTab(url = "onyx://newtab"): BrowserTab {
  return { id: uid("tab"), url, title: url === "onyx://newtab" ? "New tab" : "Loading" };
}
