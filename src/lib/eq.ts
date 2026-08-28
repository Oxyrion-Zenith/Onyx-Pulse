import type { AppSettings } from "./types";

export const EQ_FREQUENCIES = [60, 170, 350, 1000, 3500, 10000] as const;

export const EQ_PRESETS: Record<AppSettings["eqPreset"], number[]> = {
  flat: [0, 0, 0, 0, 0, 0],
  bass: [6, 4, 1, 0, -1, -2],
  voice: [-2, -1, 2, 4, 3, 0],
  treble: [-2, -1, 0, 1, 4, 6],
  night: [2, 1, 0, 0, -2, -4],
};
