import {
  ArrowLeft,
  ArrowRight,
  Download,
  Plus,
  RotateCw,
  Shield,
  ShieldOff,
  Star,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppStore, newTab } from "@/lib/store";
import type { ExtractResult } from "@/lib/types";
import { braveSearchUrl, hostnameOf, normalizeUrl } from "@/lib/url-parse";
import { uid } from "@/lib/utils";
import { ExtractDialog } from "../extract-dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const SPEED_DIAL = [
  { title: "Brave Search", url: "https://search.brave.com/" },
  { title: "Wikipedia", url: "https://en.wikipedia.org/wiki/Main_Page" },
  { title: "Internet Archive", url: "https://archive.org/" },
  { title: "MDN", url: "https://developer.mozilla.org/" },
  { title: "BBC", url: "https://www.bbc.com/" },
  { title: "Open Library", url: "https://openlibrary.org/" },
];

const SEARCH_HOSTS = new Set([
  "search.brave.com",
  "duckduckgo.com",
  "www.duckduckgo.com",
  "startpage.com",
  "www.startpage.com",
]);

function isSearchUrl(href: string): boolean {
  try {
    return SEARCH_HOSTS.has(new URL(href).hostname);
  } catch {
    return false;
  }
}

export function BrowserView() {
  const tabs = useAppStore((s) => s.tabs);
  const activeTabId = useAppStore((s) => s.activeTabId);
  const setTabs = useAppStore((s) => s.setTabs);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const updateTab = useAppStore((s) => s.updateTab);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const addBookmark = useAppStore((s) => s.addBookmark);
  const pushHistory = useAppStore((s) => s.pushHistory);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

  const tab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const [draft, setDraft] = useState(tab?.url === "onyx://newtab" ? "" : (tab?.url ?? ""));
  const [extract, setExtract] = useState<ExtractResult | null>(null);
  const [open, setOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [historyStack, setHistoryStack] = useState<string[]>(["onyx://newtab"]);
  const [histIndex, setHistIndex] = useState(0);

  useEffect(() => {
    if (!tab) return;
    setDraft(tab.url === "onyx://newtab" ? "" : tab.url);
  }, [tab?.id, tab?.url]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const data = e.data as { type?: string; title?: string; url?: string };
      if (data?.type !== "onyx-browse" || !tab) return;
      if (data.title) updateTab(tab.id, { title: data.title, loading: false });
      if (data.url) {
        updateTab(tab.id, { url: data.url });
        pushHistory({ id: uid("hist"), title: data.title ?? data.url, url: data.url, createdAt: Date.now() });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [tab, updateTab, pushHistory]);

  const frameSrc = useMemo(() => {
    if (!tab || tab.url === "onyx://newtab") return null;
    const shields = settings.shields ? "1" : "0";
    return `/api/browse?url=${encodeURIComponent(tab.url)}&shields=${shields}`;
  }, [tab, settings.shields]);

  function navigate(raw: string, push = true) {
    if (!tab) return;
    const href = normalizeUrl(raw) || braveSearchUrl(raw, settings.searchEngine);

    if (isSearchUrl(href)) {
      // Search engines are JS-heavy and don't render through the in-app proxy —
      // open them in the device's real browser instead.
      window.open(href, "_blank", "noopener,noreferrer");
      pushHistory({ id: uid("hist"), title: `Search: ${raw}`, url: href, createdAt: Date.now() });
      setDraft("");
      return;
    }

    updateTab(tab.id, { url: href, title: hostnameOf(href), loading: true });
    if (push) {
      const next = [...historyStack.slice(0, histIndex + 1), href];
      setHistoryStack(next);
      setHistIndex(next.length - 1);
    }
    pushHistory({ id: uid("hist"), title: hostnameOf(href), url: href, createdAt: Date.now() });
  }

  function goBack() {
    if (histIndex <= 0) return;
    const next = histIndex - 1;
    setHistIndex(next);
    const url = historyStack[next];
    if (url && tab) updateTab(tab.id, { url, title: hostnameOf(url) });
  }

  function goForward() {
    if (histIndex >= historyStack.length - 1) return;
    const next = histIndex + 1;
    setHistIndex(next);
    const url = historyStack[next];
    if (url && tab) updateTab(tab.id, { url, title: hostnameOf(url) });
  }

  async function downloadCurrent() {
    if (!tab || tab.url === "onyx://newtab") return;
    setExtracting(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: tab.url }),
      });
      const data = (await res.json()) as ExtractResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No media found");
      setExtract(data);
      setOpen(true);
    } catch (err) {
      setExtract({
        title: tab.title || tab.url,
        platform: hostnameOf(tab.url),
        pageUrl: tab.url,
        formats: [],
        note: err instanceof Error ? err.message : "No downloadable media on this page.",
      });
      setOpen(true);
    } finally {
      setExtracting(false);
    }
  }

  function bookmarkCurrent() {
    if (!tab || tab.url === "onyx://newtab") return;
    addBookmark({ id: uid("bm"), title: tab.title, url: tab.url, createdAt: Date.now() });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 pt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex h-9 max-w-[11rem] items-center gap-2 rounded-t-lg px-3 text-xs ${
              t.id === activeTabId ? "bg-card" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <span className="truncate">{t.title || "Tab"}</span>
            {tabs.length > 1 ? (
              <span
                role="button"
                tabIndex={0}
                className="rounded p-0.5 hover:bg-subtle"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = tabs.filter((x) => x.id !== t.id);
                  setTabs(next);
                  if (t.id === activeTabId && next[0]) setActiveTab(next[0].id);
                }}
              >
                <X className="size-3" />
              </span>
            ) : null}
          </button>
        ))}
        <button
          type="button"
          className="mb-1 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
          aria-label="New tab"
          onClick={() => {
            const t = newTab();
            setTabs([...tabs, t]);
            setActiveTab(t.id);
          }}
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 bg-card px-2 py-2">
        <Button variant="ghost" size="icon-sm" aria-label="Back" onClick={goBack} disabled={histIndex <= 0}>
          <ArrowLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Forward"
          onClick={goForward}
          disabled={histIndex >= historyStack.length - 1}
        >
          <ArrowRight className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Reload"
          onClick={() => tab && tab.url !== "onyx://newtab" && updateTab(tab.id, { url: tab.url })}
        >
          <RotateCw className="size-4" />
        </Button>
        <form
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-secondary px-3"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(draft);
          }}
        >
          <button
            type="button"
            className="text-primary"
            aria-label={settings.shields ? "Shields on" : "Shields off"}
            onClick={() => setSettings({ shields: !settings.shields })}
          >
            {settings.shields ? <Shield className="size-4" /> : <ShieldOff className="size-4" />}
          </button>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Enter a site address (search opens in your browser)"
            className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </form>
        <Button variant="ghost" size="icon-sm" aria-label="Bookmark" onClick={bookmarkCurrent}>
          <Star className="size-4" />
        </Button>
        <Button
          size="sm"
          onClick={() => void downloadCurrent()}
          disabled={extracting || tab?.url === "onyx://newtab"}
        >
          <Download className="size-4" />
          <span className="hidden sm:inline">Download</span>
        </Button>
      </div>

      <div className="relative min-h-0 flex-1 bg-background">
        {frameSrc ? (
          <iframe
            key={frameSrc}
            title={tab?.title ?? "Browser"}
            src={frameSrc}
            className="h-full w-full bg-background"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <NewTab
            engine={settings.searchEngine}
            bookmarks={bookmarks}
            onGo={(u) => navigate(u)}
          />
        )}
      </div>

      <ExtractDialog open={open} onOpenChange={setOpen} result={extract} />
    </div>
  );
}

function NewTab({
  engine,
  bookmarks,
  onGo,
}: {
  engine: "brave" | "duckduckgo" | "startpage";
  bookmarks: { id: string; title: string; url: string }[];
  onGo: (url: string) => void;
}) {
  const [q, setQ] = useState("");
  return (
    <div className="mx-auto flex h-full max-w-lg flex-col items-center px-5 pt-12">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Shield className="size-8" strokeWidth={1.6} />
      </div>
      <h2 className="font-display text-2xl font-semibold">Onyx Browser</h2>
      <p className="mt-1 text-sm text-muted-foreground">Search opens in your device browser · static pages load here</p>
      <form
        className="mt-6 w-full"
        onSubmit={(e) => {
          e.preventDefault();
          onGo(q.trim() ? braveSearchUrl(q, engine) : "https://search.brave.com/");
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the web with Brave"
          className="h-12 rounded-full px-5"
        />
      </form>
      <div className="mt-8 grid w-full grid-cols-3 gap-3">
        {SPEED_DIAL.map((s) => (
          <button
            key={s.url}
            type="button"
            onClick={() => onGo(s.url)}
            className="rounded-xl bg-card px-2 py-4 text-center text-xs shadow-[var(--shadow-border)]"
          >
            {s.title}
          </button>
        ))}
      </div>
      {bookmarks.length ? (
        <div className="mt-8 w-full">
          <p className="mb-2 text-xs tracking-wide text-muted-foreground uppercase">Bookmarks</p>
          <div className="flex flex-col gap-1">
            {bookmarks.slice(0, 8).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onGo(b.url)}
                className="truncate rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary"
              >
                {b.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
    }
