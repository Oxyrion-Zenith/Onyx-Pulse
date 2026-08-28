import { Check } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { ThemeId } from "@/lib/types";
import { cn } from "@/lib/utils";

const THEMES: { id: ThemeId; name: string; desc: string; swatch: string[] }[] = [
  { id: "onyx", name: "Onyx", desc: "Mineral dark, stone accent", swatch: ["#09090b", "#121214", "#d4d0c8"] },
  { id: "ivory", name: "Ivory", desc: "Paper light, ink type", swatch: ["#f3f1ec", "#fffcf7", "#2a2926"] },
  { id: "slate", name: "Slate", desc: "Cool night blue-gray", swatch: ["#0c1016", "#141a22", "#b7c4d4"] },
  { id: "ember", name: "Ember", desc: "Warm dark, copper accent", swatch: ["#120e0c", "#1c1612", "#e0703c"] },
  { id: "forest", name: "Forest", desc: "Deep green mineral", swatch: ["#0c120f", "#141c18", "#8fbfa4"] },
  { id: "noir", name: "Noir", desc: "True black, high contrast", swatch: ["#000000", "#0d0d0d", "#f5f5f5"] },
];

export function ThemesView() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-8">
      <header className="pt-6 pb-4">
        <h1 className="font-display text-2xl font-semibold">Themes</h1>
        <p className="text-sm text-muted-foreground">Appearance for the whole app</p>
      </header>
      <div className="grid gap-3">
        {THEMES.map((t) => {
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-[var(--shadow-border)]",
                active && "ring-1 ring-primary",
              )}
            >
              <span className="flex overflow-hidden rounded-lg">
                {t.swatch.map((c) => (
                  <span key={c} className="h-12 w-7" style={{ background: c }} />
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg">{t.name}</span>
                <span className="block text-sm text-muted-foreground">{t.desc}</span>
              </span>
              {active ? <Check className="size-5 text-primary" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
