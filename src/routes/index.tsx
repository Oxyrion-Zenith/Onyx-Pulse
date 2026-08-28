import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PlayerProvider } from "@/components/player-provider";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
  pendingComponent: Splash,
});

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
      <p className="font-display text-2xl font-semibold">Onyx Pulse</p>
    </div>
  );
}

function Home() {
  return (
    <PlayerProvider>
      <AppShell />
    </PlayerProvider>
  );
}
