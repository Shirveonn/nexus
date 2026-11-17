import type { PaletteId } from "@/types/settings";

export interface Palette {
  id: PaletteId;
  name: string;
  description: string;
  scheme: "dark" | "light";
  /** Suggested accent when the palette is picked from a preset. */
  suggestedAccent: string;
  colors: {
    bg: string;
    sidebar: string;
    topbar: string;
    panel: string;
    panelAlt: string;
    surface: string;
    surfaceHover: string;
    line: string;
    text: string;
    textDim: string;
    muted: string;
    faint: string;
  };
}

export const palettes: Palette[] = [
  {
    id: "midnight",
    name: "Midnight",
    description: "The original NEXUS look",
    scheme: "dark",
    suggestedAccent: "#648cff",
    colors: {
      bg: "#090b12", sidebar: "rgba(12, 15, 24, 0.94)", topbar: "rgba(10, 13, 21, 0.5)",
      panel: "rgba(20, 26, 40, 0.94)", panelAlt: "rgba(15, 19, 30, 0.94)",
      surface: "#141927", surfaceHover: "#1a2132", line: "rgba(155, 170, 210, 0.11)",
      text: "#e9ecf5", textDim: "#9aa3b7", muted: "#858da4", faint: "#626b81"
    }
  },
  {
    id: "obsidian",
    name: "Obsidian",
    description: "Pure dark, high contrast",
    scheme: "dark",
    suggestedAccent: "#42d9d0",
    colors: {
      bg: "#050505", sidebar: "rgba(10, 10, 11, 0.96)", topbar: "rgba(8, 8, 9, 0.6)",
      panel: "rgba(19, 19, 21, 0.95)", panelAlt: "rgba(14, 14, 16, 0.95)",
      surface: "#161618", surfaceHover: "#1e1e21", line: "rgba(255, 255, 255, 0.08)",
      text: "#f2f2f3", textDim: "#a5a5ab", muted: "#8a8a91", faint: "#5d5d64"
    }
  },
  {
    id: "nebula",
    name: "Nebula",
    description: "Deep violet space tones",
    scheme: "dark",
    suggestedAccent: "#9b7bff",
    colors: {
      bg: "#0d0918", sidebar: "rgba(18, 12, 32, 0.94)", topbar: "rgba(15, 10, 27, 0.5)",
      panel: "rgba(30, 21, 50, 0.92)", panelAlt: "rgba(22, 15, 38, 0.92)",
      surface: "#1d1531", surfaceHover: "#261c40", line: "rgba(190, 160, 255, 0.12)",
      text: "#eee9fa", textDim: "#aea2c9", muted: "#9285b0", faint: "#6a5f86"
    }
  },
  {
    id: "forest",
    name: "Forest",
    description: "Calm dark greens",
    scheme: "dark",
    suggestedAccent: "#45d6a0",
    colors: {
      bg: "#07100d", sidebar: "rgba(10, 21, 17, 0.94)", topbar: "rgba(9, 18, 15, 0.5)",
      panel: "rgba(17, 33, 27, 0.93)", panelAlt: "rgba(12, 25, 20, 0.93)",
      surface: "#11231c", surfaceHover: "#173027", line: "rgba(140, 220, 180, 0.11)",
      text: "#e6f3ed", textDim: "#9db8ab", muted: "#82a193", faint: "#58756a"
    }
  },
  {
    id: "ember",
    name: "Ember",
    description: "Warm charcoal and coals",
    scheme: "dark",
    suggestedAccent: "#ff8a4c",
    colors: {
      bg: "#110a08", sidebar: "rgba(24, 15, 12, 0.94)", topbar: "rgba(20, 12, 10, 0.5)",
      panel: "rgba(36, 23, 19, 0.93)", panelAlt: "rgba(27, 17, 14, 0.93)",
      surface: "#24170f", surfaceHover: "#2f1f16", line: "rgba(255, 180, 140, 0.11)",
      text: "#f7ece6", textDim: "#c4aa9c", muted: "#a68b7d", faint: "#7a6255"
    }
  },
  {
    id: "daylight",
    name: "Daylight",
    description: "Bright and clean",
    scheme: "light",
    suggestedAccent: "#3c6cf0",
    colors: {
      bg: "#eef1f7", sidebar: "rgba(255, 255, 255, 0.92)", topbar: "rgba(255, 255, 255, 0.6)",
      panel: "rgba(255, 255, 255, 0.95)", panelAlt: "rgba(248, 250, 254, 0.95)",
      surface: "#f3f5fa", surfaceHover: "#e8ecf5", line: "rgba(30, 45, 90, 0.11)",
      text: "#141a2b", textDim: "#4a5470", muted: "#626c86", faint: "#8a93a8"
    }
  }
];

export const paletteById = (id: PaletteId): Palette => palettes.find(p => p.id === id) ?? palettes[0];

export const accentPresets: { label: string; color: string }[] = [
  { label: "Electric blue", color: "#648cff" },
  { label: "Violet", color: "#9b7bff" },
  { label: "Cyan", color: "#42d9d0" },
  { label: "Pink", color: "#f17ac4" },
  { label: "Mint", color: "#45d6a0" },
  { label: "Sunset", color: "#ff8a4c" },
  { label: "Gold", color: "#f5c542" },
  { label: "Crimson", color: "#ef4f5f" }
];
