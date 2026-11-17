import { useEffect } from "react";
import { readableTextOn, shiftHue } from "@/lib/color";
import { useSettings } from "@/store/settingsStore";
import { paletteById } from "./palettes";

const toVar = (key: string) => `--${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`;

/** Pushes the current appearance into CSS custom properties on <html>. */
export function useApplyAppearance() {
  const appearance = useSettings(s => s.appearance);

  useEffect(() => {
    const root = document.documentElement;
    const palette = paletteById(appearance.palette);
    for (const [key, value] of Object.entries(palette.colors)) {
      root.style.setProperty(toVar(key), value);
    }
    root.style.setProperty("--accent", appearance.accent);
    root.style.setProperty("--accent-2", shiftHue(appearance.accent, 35));
    root.style.setProperty("--on-accent", readableTextOn(appearance.accent));
    root.dataset.scheme = palette.scheme;
    root.dataset.reduceMotion = String(appearance.reduceMotion);
    root.style.colorScheme = palette.scheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", palette.colors.bg);
  }, [appearance.palette, appearance.accent, appearance.reduceMotion]);

  useEffect(() => {
    if (window.nexus?.setZoomFactor) {
      window.nexus.setZoomFactor(appearance.uiScale);
    } else {
      // Browser preview fallback (no Electron preload available).
      (document.documentElement.style as CSSStyleDeclaration & { zoom: string }).zoom = String(appearance.uiScale);
    }
  }, [appearance.uiScale]);
}
