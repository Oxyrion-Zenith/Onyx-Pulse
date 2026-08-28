import { useAppStore } from "@/lib/store";
import type { WidgetConfig } from "@/lib/types";
import { Switch } from "../ui/switch";

const ITEMS: { key: keyof WidgetConfig; title: string; hint: string }[] = [
  { key: "nowPlaying", title: "Now playing", hint: "Show the current title on Home" },
  { key: "continueWatching", title: "Continue", hint: "Recent library strip on Home" },
  { key: "quickConvert", title: "Quick convert", hint: "Reserved for Home shortcuts" },
  { key: "downloads", title: "Downloads", hint: "Active download progress on Home" },
  { key: "liveRadio", title: "Live radio", hint: "Pin the first stream on Home" },
];

export function WidgetsView() {
  const widgets = useAppStore((s) => s.widgets);
  const setWidgets = useAppStore((s) => s.setWidgets);

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-8">
      <header className="pt-6 pb-4">
        <h1 className="font-display text-2xl font-semibold">Widgets</h1>
        <p className="text-sm text-muted-foreground">Choose what appears on the home screen</p>
      </header>
      <div className="rounded-2xl bg-card px-4 shadow-[var(--shadow-border)]">
        {ITEMS.map((item, i) => (
          <div key={item.key}>
            {i > 0 ? <div className="h-px bg-border" /> : null}
            <label className="flex items-center justify-between gap-4 py-4">
              <span>
                <span className="block text-sm font-medium">{item.title}</span>
                <span className="block text-xs text-muted-foreground">{item.hint}</span>
              </span>
              <Switch
                checked={widgets[item.key]}
                onCheckedChange={(v) => setWidgets({ [item.key]: v })}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
