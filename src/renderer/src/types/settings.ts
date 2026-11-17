/** Shapes for everything the user can customize. Persisted locally and shared via theme files. */

export type PaletteId = "midnight" | "obsidian" | "nebula" | "forest" | "ember" | "daylight";

export type BackgroundPresetId = "aurora" | "sunset" | "deep-sea" | "synthwave" | "grid" | "mono";

export type BackgroundKind = "none" | "preset" | "image";

export interface BackgroundSettings {
  kind: BackgroundKind;
  preset: BackgroundPresetId;
  /** A `data:image/...` URL. Remote URLs are never stored. */
  image: string | null;
  /** 0–90: how much the background is darkened/lightened behind the UI. */
  dim: number;
  /** 0–20 px blur. */
  blur: number;
}

export type SidebarSize = "compact" | "standard" | "wide";
export type SidebarStyle = "solid" | "glass" | "minimal";
export type SidebarPosition = "left" | "right";

export interface SidebarSettings {
  size: SidebarSize;
  style: SidebarStyle;
  position: SidebarPosition;
  showGroupLabels: boolean;
}

export interface Appearance {
  palette: PaletteId;
  /** `#rrggbb` */
  accent: string;
  background: BackgroundSettings;
  sidebar: SidebarSettings;
  /** 0.8–1.3 interface zoom. */
  uiScale: number;
  reduceMotion: boolean;
}

export type WidgetId = "hero" | "stats" | "friends" | "quick" | "activity" | "clock" | "notes";
export type WidgetSpan = 1 | 2 | 3 | 4;

export interface WidgetLayout {
  id: WidgetId;
  span: WidgetSpan;
  visible: boolean;
}

export interface SavedTheme {
  id: string;
  name: string;
  appearance: Appearance;
  createdAt: number;
}

/** The JSON file format used for importing/exporting themes. */
export interface ThemeFile {
  format: "nexus-theme";
  version: 1;
  name: string;
  appearance: Appearance;
}
