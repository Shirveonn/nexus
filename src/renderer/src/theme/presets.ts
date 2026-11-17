import type { Appearance } from "@/types/settings";
import { DEFAULT_APPEARANCE } from "./defaults";

const base = DEFAULT_APPEARANCE;

/** Complete one-click looks shown in Settings → Library. */
export const themePresets: { id: string; name: string; appearance: Appearance }[] = [
  { id: "classic", name: "Classic NEXUS", appearance: base },
  {
    id: "synthwave",
    name: "Synthwave",
    appearance: { ...base, palette: "nebula", accent: "#f17ac4", background: { ...base.background, kind: "preset", preset: "synthwave", dim: 35 }, sidebar: { ...base.sidebar, style: "glass" } }
  },
  {
    id: "aurora",
    name: "Aurora",
    appearance: { ...base, palette: "midnight", accent: "#42d9d0", background: { ...base.background, kind: "preset", preset: "aurora", dim: 30 }, sidebar: { ...base.sidebar, style: "glass" } }
  },
  {
    id: "campfire",
    name: "Campfire",
    appearance: { ...base, palette: "ember", accent: "#ff8a4c", background: { ...base.background, kind: "preset", preset: "sunset", dim: 55 } }
  },
  {
    id: "forest",
    name: "Forest",
    appearance: { ...base, palette: "forest", accent: "#45d6a0" }
  },
  {
    id: "stealth",
    name: "Stealth",
    appearance: { ...base, palette: "obsidian", accent: "#f2f2f3", sidebar: { ...base.sidebar, size: "compact", style: "minimal" } }
  },
  {
    id: "daylight",
    name: "Daylight",
    appearance: { ...base, palette: "daylight", accent: "#3c6cf0" }
  }
];
