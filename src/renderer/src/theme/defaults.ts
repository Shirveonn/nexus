import type { Appearance, WidgetLayout } from "@/types/settings";

export const DEFAULT_APPEARANCE: Appearance = {
  palette: "midnight",
  accent: "#648cff",
  background: { kind: "none", preset: "aurora", image: null, dim: 45, blur: 0 },
  sidebar: { size: "standard", style: "solid", position: "left", showGroupLabels: true },
  uiScale: 1,
  reduceMotion: false
};

export const DEFAULT_WIDGETS: WidgetLayout[] = [
  { id: "hero", span: 4, visible: true },
  { id: "stats", span: 4, visible: true },
  { id: "quick", span: 2, visible: true },
  { id: "activity", span: 2, visible: true },
  { id: "clock", span: 1, visible: false },
  { id: "notes", span: 2, visible: false }
];

export const UI_SCALE_MIN = 0.8;
export const UI_SCALE_MAX = 1.3;
