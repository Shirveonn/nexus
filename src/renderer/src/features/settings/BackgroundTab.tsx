import { useState } from "react";
import { ImagePlus, Trash2, Wallpaper } from "lucide-react";
import { Panel, Segmented, SettingRow, Slider } from "@/components/ui/controls";
import { imageFileToDataUrl, pickFile } from "@/lib/files";
import { useSettings } from "@/store/settingsStore";
import { useUi } from "@/store/uiStore";
import { backgroundPresets } from "@/theme/backgrounds";
import type { BackgroundKind } from "@/types/settings";

export function BackgroundTab() {
  const bg = useSettings(s => s.appearance.background);
  const setBackground = useSettings(s => s.setBackground);
  const toast = useUi(s => s.toast);
  const [loading, setLoading] = useState(false);

  async function chooseImage() {
    const file = await pickFile("image/png,image/jpeg,image/webp,image/gif");
    if (!file) return;
    setLoading(true);
    try {
      const image = await imageFileToDataUrl(file);
      setBackground({ kind: "image", image });
      toast("Wallpaper updated", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "That image couldn't be used.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Panel title="Wallpaper" description="Shown behind the whole app." icon={<Wallpaper size={18} />}>
        <SettingRow label="Background type">
          <Segmented<BackgroundKind>
            label="Background type"
            value={bg.kind}
            onChange={kind => (kind === "image" && !bg.image ? void chooseImage() : setBackground({ kind }))}
            options={[{ value: "none", label: "Default" }, { value: "preset", label: "Gradient" }, { value: "image", label: "Your image" }]}
          />
        </SettingRow>

        <div className="wallpaper-grid">
          {backgroundPresets.map(p => (
            <button
              key={p.id}
              className={`wallpaper-card ${bg.kind === "preset" && bg.preset === p.id ? "selected" : ""}`}
              onClick={() => setBackground({ kind: "preset", preset: p.id })}
            >
              <span style={{ background: p.css }} />
              {p.name}
            </button>
          ))}
          <button className={`wallpaper-card wallpaper-card--upload ${bg.kind === "image" ? "selected" : ""}`} onClick={chooseImage} disabled={loading}>
            <span style={bg.image ? { background: `center / cover url("${bg.image}")` } : undefined}>
              {!bg.image && <ImagePlus size={20} />}
            </span>
            {loading ? "Loading…" : bg.image ? "Change image" : "Upload image"}
          </button>
        </div>

        {bg.image && (
          <button className="subtle-button danger" onClick={() => setBackground({ image: null, kind: bg.kind === "image" ? "none" : bg.kind })}>
            <Trash2 size={13} /> Remove uploaded image
          </button>
        )}
      </Panel>

      <Panel title="Adjustments" description="Keep text readable on busy wallpapers.">
        <SettingRow label="Dim" hint="Darken the wallpaper behind panels.">
          <Slider label="Dim" min={0} max={90} value={bg.dim} onChange={dim => setBackground({ dim })} format={v => `${v}%`} />
        </SettingRow>
        <SettingRow label="Blur" hint="Soften the wallpaper.">
          <Slider label="Blur" min={0} max={20} value={bg.blur} onChange={blur => setBackground({ blur })} format={v => `${v}px`} />
        </SettingRow>
        {bg.kind === "none" && <p className="hint">Dim and blur apply when a gradient or image wallpaper is selected.</p>}
      </Panel>
    </>
  );
}
