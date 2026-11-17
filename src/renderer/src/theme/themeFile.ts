import { isHexColor } from "@/lib/color";
import type {
  Appearance, BackgroundKind, BackgroundPresetId, PaletteId, SidebarPosition,
  SidebarSize, SidebarStyle, ThemeFile
} from "@/types/settings";
import { backgroundPresets } from "./backgrounds";
import { DEFAULT_APPEARANCE, UI_SCALE_MAX, UI_SCALE_MIN } from "./defaults";
import { palettes } from "./palettes";

/** Largest background image we accept in a theme file (data URL length, ~6 MB). */
export const MAX_IMAGE_DATA_URL_LENGTH = 8_000_000;
const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}
function num(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function isSafeImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_IMAGE_DATA_URL_LENGTH && IMAGE_DATA_URL.test(value);
}

/**
 * Turns untrusted input (an imported file, or old saved settings) into a valid Appearance.
 * Every field is checked against an allow-list or range; anything unknown falls back to defaults.
 * This matters because values like the accent color are injected into CSS.
 */
export function sanitizeAppearance(input: unknown, base: Appearance = DEFAULT_APPEARANCE): Appearance {
  const src = isObj(input) ? input : {};
  const bg = isObj(src.background) ? src.background : {};
  const sb = isObj(src.sidebar) ? src.sidebar : {};

  const image = isSafeImageDataUrl(bg.image) ? bg.image : null;
  let kind = pick<BackgroundKind>(bg.kind, ["none", "preset", "image"], base.background.kind);
  if (kind === "image" && !image) kind = "none";

  return {
    palette: pick<PaletteId>(src.palette, palettes.map(p => p.id), base.palette),
    accent: isHexColor(src.accent) ? src.accent.toLowerCase() : base.accent,
    background: {
      kind,
      preset: pick<BackgroundPresetId>(bg.preset, backgroundPresets.map(p => p.id), base.background.preset),
      image,
      dim: num(bg.dim, 0, 90, base.background.dim),
      blur: num(bg.blur, 0, 20, base.background.blur)
    },
    sidebar: {
      size: pick<SidebarSize>(sb.size, ["compact", "standard", "wide"], base.sidebar.size),
      style: pick<SidebarStyle>(sb.style, ["solid", "glass", "minimal"], base.sidebar.style),
      position: pick<SidebarPosition>(sb.position, ["left", "right"], base.sidebar.position),
      showGroupLabels: bool(sb.showGroupLabels, base.sidebar.showGroupLabels)
    },
    uiScale: num(src.uiScale, UI_SCALE_MIN, UI_SCALE_MAX, base.uiScale),
    reduceMotion: bool(src.reduceMotion, base.reduceMotion)
  };
}

export function createThemeFile(name: string, appearance: Appearance, includeImage: boolean): ThemeFile {
  const copy: Appearance = structuredClone(appearance);
  if (!includeImage && copy.background.kind === "image") {
    copy.background = { ...copy.background, kind: "none", image: null };
  } else if (!includeImage) {
    copy.background.image = null;
  }
  return { format: "nexus-theme", version: 1, name: cleanName(name), appearance: copy };
}

export function cleanName(name: unknown): string {
  const text = typeof name === "string" ? name.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 40) : "";
  return text || "Untitled theme";
}

export type ParseResult = { ok: true; theme: ThemeFile } | { ok: false; error: string };

export function parseThemeFile(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  if (!isObj(data) || data.format !== "nexus-theme") {
    return { ok: false, error: "That file isn't a NEXUS theme." };
  }
  if (data.version !== 1) {
    return { ok: false, error: "This theme was made with a newer version of NEXUS." };
  }
  if (!isObj(data.appearance)) {
    return { ok: false, error: "The theme file is missing its appearance settings." };
  }
  return {
    ok: true,
    theme: {
      format: "nexus-theme",
      version: 1,
      name: cleanName(data.name),
      appearance: sanitizeAppearance(data.appearance)
    }
  };
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "theme";
}
