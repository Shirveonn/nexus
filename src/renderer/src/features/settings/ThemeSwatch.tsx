import { backgroundPresetById } from "@/theme/backgrounds";
import { paletteById } from "@/theme/palettes";
import type { Appearance } from "@/types/settings";

/** A tiny visual preview of a complete appearance (wallpaper, sidebar, panels, accent). */
export function ThemeSwatch({ appearance }: { appearance: Appearance }) {
  const p = paletteById(appearance.palette);
  const bg = appearance.background;
  const wallpaper =
    bg.kind === "image" && bg.image ? `center / cover url("${bg.image}")`
    : bg.kind === "preset" ? backgroundPresetById(bg.preset).css
    : p.colors.bg;
  const sidebarLeft = appearance.sidebar.position === "left";

  return (
    <div className="theme-swatch" style={{ background: wallpaper }} aria-hidden>
      <div className="theme-swatch__sidebar" style={{ background: p.colors.sidebar, [sidebarLeft ? "left" : "right"]: 0 }}>
        <i style={{ background: appearance.accent }} />
      </div>
      <div className="theme-swatch__body" style={{ [sidebarLeft ? "left" : "right"]: "30%" }}>
        <div style={{ background: p.colors.panel, borderColor: p.colors.line }}><i style={{ background: appearance.accent }} /></div>
        <div style={{ background: p.colors.panel, borderColor: p.colors.line }} />
      </div>
    </div>
  );
}
