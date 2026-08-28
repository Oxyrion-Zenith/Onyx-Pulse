import { EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { hashPin } from "@/lib/hash";
import { useAppStore } from "@/lib/store";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MediaCard } from "../media-card";

export function HiddenView() {
  const pinHash = useAppStore((s) => s.hiddenPinHash);
  const unlocked = useAppStore((s) => s.hiddenUnlocked);
  const setHash = useAppStore((s) => s.setHiddenPinHash);
  const setUnlocked = useAppStore((s) => s.setHiddenUnlocked);
  const library = useAppStore((s) => s.library);
  const playItem = useAppStore((s) => s.playItem);
  const updateMedia = useAppStore((s) => s.updateMedia);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hidden = library.filter((m) => m.hidden);

  async function submit() {
    if (pin.length < 4) {
      setError("Use at least 4 digits");
      return;
    }
    const hash = await hashPin(pin);
    if (!pinHash) {
      setHash(hash);
      setUnlocked(true);
      setPin("");
      setError(null);
      return;
    }
    if (hash !== pinHash) {
      setError("Incorrect PIN");
      return;
    }
    setUnlocked(true);
    setPin("");
    setError(null);
  }

  if (!unlocked) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col items-center px-5 pt-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-tile-hidden text-white">
          <Lock className="size-7" />
        </span>
        <h1 className="font-display mt-5 text-2xl font-semibold">Hidden</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pinHash ? "Enter your PIN to open the vault." : "Set a PIN to protect private titles."}
        </p>
        <Input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="PIN"
          className="mt-6 text-center tracking-[0.4em]"
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
        />
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        <Button className="mt-4 w-full" onClick={() => void submit()}>
          {pinHash ? "Unlock" : "Create PIN"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-8">
      <header className="flex items-end justify-between pt-6 pb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Hidden</h1>
          <p className="text-sm text-muted-foreground">{hidden.length} private titles</p>
        </div>
        <Button variant="outline" onClick={() => setUnlocked(false)}>
          Lock
        </Button>
      </header>
      {hidden.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <EyeOff className="size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Long-press a title in the library and choose Move to Hidden.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {hidden.map((item) => (
            <div key={item.id} className="relative">
              <MediaCard item={item} onPlay={() => playItem(item.id)} />
              <button
                type="button"
                className="mt-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => updateMedia(item.id, { hidden: false })}
              >
                Restore to library
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
