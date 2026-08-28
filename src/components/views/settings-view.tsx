import { useAppStore } from "@/lib/store";
import type { AppSettings } from "@/lib/types";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";

export function SettingsView() {
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const setView = useAppStore((s) => s.setView);

  function row(label: string, hint: string, key: keyof AppSettings, on: boolean) {
    return (
      <label className="flex items-center justify-between gap-4 py-3">
        <span>
          <span className="block text-sm font-medium">{label}</span>
          <span className="block text-xs text-muted-foreground">{hint}</span>
        </span>
        <Switch checked={on} onCheckedChange={(v) => setSettings({ [key]: v })} />
      </label>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-8">
      <header className="pt-6 pb-4">
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Playback, browser, and equalizer</p>
      </header>

      <section className="rounded-2xl bg-card px-4 shadow-[var(--shadow-border)]">
        {row("Autoplay", "Start the next title when one ends", "autoplay", settings.autoplay)}
        <div className="h-px bg-border" />
        {row("Resume", "Remember place in a title", "resumePlayback", settings.resumePlayback)}
        <div className="h-px bg-border" />
        {row("Brave Shields", "Strip known trackers in the browser", "shields", settings.shields)}
        <div className="h-px bg-border" />
        {row("Equalizer", "Apply the selected tone shape", "eqEnabled", settings.eqEnabled)}
      </section>

      <section className="mt-5">
        <p className="mb-2 text-xs tracking-wide text-muted-foreground uppercase">Search engine</p>
        <div className="grid grid-cols-3 gap-2">
          {(["brave", "duckduckgo", "startpage"] as const).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setSettings({ searchEngine: e })}
              className={`h-11 rounded-lg text-xs capitalize ${
                settings.searchEngine === e ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              {e === "duckduckgo" ? "DuckDuckGo" : e === "startpage" ? "Startpage" : "Brave"}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <p className="mb-2 text-xs tracking-wide text-muted-foreground uppercase">Equalizer preset</p>
        <div className="grid grid-cols-3 gap-2">
          {(["flat", "bass", "voice", "treble", "night"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSettings({ eqPreset: p, eqEnabled: true })}
              className={`h-11 rounded-lg text-xs capitalize ${
                settings.eqPreset === p ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <Button variant="outline" className="mt-6 w-full" onClick={() => setView("themes")}>
        Open themes
      </Button>
      <p className="mt-8 text-center text-xs text-muted-foreground">Onyx Pulse · Video & audio player</p>
    </div>
  );
}
