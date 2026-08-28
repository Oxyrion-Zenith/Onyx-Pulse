import { useEffect, useRef } from "react";
import { usePlayer } from "./player-provider";
import { useAppStore } from "@/lib/store";

export function Visualizer({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyser } = usePlayer();
  const playing = useAppStore((s) => s.playing);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : new Uint8Array(64);

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      if (analyser && playing) analyser.getByteFrequencyData(data);
      else data.fill(playing ? 40 : 12);
      const bars = 48;
      const gap = 3;
      const bw = (width - gap * (bars - 1)) / bars;
      const step = Math.max(1, Math.floor(data.length / bars));
      for (let i = 0; i < bars; i++) {
        const v = data[i * step] ?? 0;
        const h = Math.max(4, (v / 255) * height * 0.85);
        const x = i * (bw + gap);
        const y = (height - h) / 2;
        ctx.globalAlpha = 0.35 + (v / 255) * 0.65;
        ctx.fillStyle = getComputedStyle(canvas).color;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, h, 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [analyser, playing]);

  return <canvas ref={canvasRef} className={`text-primary ${className}`} />;
}
