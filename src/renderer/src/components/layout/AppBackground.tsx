import { useSettings } from "@/store/settingsStore";
import { backgroundPresetById } from "@/theme/backgrounds";
import { isSafeImageDataUrl } from "@/theme/themeFile";

/** Fixed wallpaper layer behind the whole app. */
export function AppBackground() {
  const bg = useSettings(s => s.appearance.background);

  if (bg.kind === "none") return <div className="app-background app-background--default" aria-hidden />;

  const image =
    bg.kind === "image" && isSafeImageDataUrl(bg.image)
      ? `center / cover no-repeat url("${bg.image}")`
      : backgroundPresetById(bg.preset).css;

  return (
    <div className="app-background" aria-hidden>
      <div className="app-background__image" style={{ background: image, filter: bg.blur ? `blur(${bg.blur}px)` : undefined }} />
      <div className="app-background__dim" style={{ opacity: bg.dim / 100 }} />
    </div>
  );
}
