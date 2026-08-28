import {
  ChevronLeft,
  Compass,
  FolderOpen,
  House,
  Radio,
} from "lucide-react";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { ViewId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FullPlayer } from "./full-player";
import { MiniPlayer } from "./mini-player";
import { BrowserView } from "./views/browser-view";
import { ConvertView } from "./views/convert-view";
import { DownloadsView } from "./views/downloads-view";
import { HiddenView } from "./views/hidden-view";
import { HomeView } from "./views/home-view";
import { LibraryView } from "./views/library-view";
import { SettingsView } from "./views/settings-view";
import { StreamsView } from "./views/streams-view";
import { ThemesView } from "./views/themes-view";
import { TransferView } from "./views/transfer-view";
import { WidgetsView } from "./views/widgets-view";

const NAV: { id: ViewId; label: string; icon: typeof House }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "library", label: "Library", icon: FolderOpen },
  { id: "browser", label: "Browser", icon: Compass },
  { id: "streams", label: "Streams", icon: Radio },
];

const NESTED: ViewId[] = [
  "themes",
  "convert",
  "hidden",
  "downloads",
  "settings",
  "transfer",
  "widgets",
];

export function AppShell() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const theme = useAppStore((s) => s.theme);
  const seedIfNeeded = useAppStore((s) => s.seedIfNeeded);
  const current = useAppStore((s) => s.currentId);

  useEffect(() => {
    seedIfNeeded();
  }, [seedIfNeeded]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const showNav = view !== "player";

  return (
    <div className="atmosphere flex min-h-dvh flex-col bg-background text-foreground">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col md:flex-row">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border px-3 py-6 md:flex">
          <p className="font-display px-2 text-lg font-semibold">Onyx Pulse</p>
          <p className="px-2 text-[11px] text-muted-foreground">Player · Brave browser</p>
          <nav className="mt-6 flex flex-col gap-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = view === item.id || (item.id === "library" && view === "player");
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-sm",
                    active ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-secondary/60",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {NESTED.includes(view) ? (
            <button
              type="button"
              onClick={() => setView("home")}
              className="flex h-12 shrink-0 items-center gap-1 px-4 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              Home
            </button>
          ) : null}
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {view === "home" && <HomeView />}
            {view === "library" && <LibraryView />}
            {view === "browser" && <BrowserView />}
            {view === "streams" && <StreamsView />}
            {view === "themes" && <ThemesView />}
            {view === "convert" && <ConvertView />}
            {view === "hidden" && <HiddenView />}
            {view === "downloads" && <DownloadsView />}
            {view === "settings" && <SettingsView />}
            {view === "transfer" && <TransferView />}
            {view === "widgets" && <WidgetsView />}
            {view === "player" && <FullPlayer />}
          </main>
          <MiniPlayer />
          {showNav ? (
            <nav className="grid grid-cols-4 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] md:hidden">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setView(item.id)}
                    className={cn(
                      "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px]",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2.2 : 1.7} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
