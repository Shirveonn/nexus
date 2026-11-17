import { useEffect, useState } from "react";
import { Check, Monitor, Palette, Pipette } from "lucide-react";
import { Panel, SettingRow, Slider, Toggle } from "@/components/ui/controls";
import { isHexColor } from "@/lib/color";
import { useSettings } from "@/store/settingsStore";
import { UI_SCALE_MAX, UI_SCALE_MIN } from "@/theme/defaults";
import { accentPresets, palettes } from "@/theme/palettes";

export function ThemesTab() {
  const appearance = useSettings(s => s.appearance);
  const setAppearance = useSettings(s => s.setAppearance);
  const [hexDraft, setHexDraft] = useState(appearance.accent);

  useEffect(() => setHexDraft(appearance.accent), [appearance.accent]);

  const commitHex = (value: string) => {
    const v = value.trim().startsWith("#") ? value.trim() : `#${value.trim()}`;
    if (isHexColor(v)) setAppearance({ accent: v.toLowerCase() });
    else setHexDraft(appearance.accent);
  };
  const isCustom = !accentPresets.some(a => a.color === appearance.accent);

  return (
    <>
      <Panel title="Color theme" description="The base colors for backgrounds, panels and text." icon={<Palette size={18} />}>
        <div className="palette-grid">
          {palettes.map(p => (
            <button
              key={p.id}
              className={`palette-card ${appearance.palette === p.id ? "selected" : ""}`}
              onClick={() => setAppearance({ palette: p.id })}
              aria-pressed={appearance.palette === p.id}
            >
              <div className="palette-card__preview" style={{ background: p.colors.bg }}>
                <span style={{ background: p.colors.sidebar }} />
                <span style={{ background: p.colors.panel, borderColor: p.colors.line }}>
                  <i style={{ background: p.colors.text }} /><i style={{ background: p.colors.muted }} /><i style={{ background: appearance.accent }} />
                </span>
              </div>
              <div className="palette-card__meta">
                <strong>{p.name}</strong><small>{p.description}</small>
              </div>
              {appearance.palette === p.id && <Check size={15} className="palette-card__check" />}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Accent color" description="Used for highlights, buttons and glows throughout NEXUS." icon={<Pipette size={18} />}>
        <div className="accent-row">
          {accentPresets.map(a => (
            <button
              key={a.color}
              className={`accent-swatch ${appearance.accent === a.color ? "selected" : ""}`}
              style={{ background: a.color, color: a.color }}
              title={a.label}
              aria-label={a.label}
              aria-pressed={appearance.accent === a.color}
              onClick={() => setAppearance({ accent: a.color })}
            />
          ))}
          <label className={`accent-custom ${isCustom ? "selected" : ""}`} title="Pick any color">
            <input type="color" value={appearance.accent} onChange={e => setAppearance({ accent: e.target.value })} aria-label="Custom accent color" />
            <span style={{ background: appearance.accent }} />
            Custom
          </label>
          <input
            className="text-input hex-input"
            value={hexDraft}
            onChange={e => setHexDraft(e.target.value)}
            onBlur={e => commitHex(e.target.value)}
            onKeyDown={e => e.key === "Enter" && commitHex((e.target as HTMLInputElement).value)}
            aria-label="Accent hex code"
            maxLength={7}
            spellCheck={false}
          />
        </div>
      </Panel>

      <Panel title="Interface" description="Size and motion." icon={<Monitor size={18} />}>
        <SettingRow label="Interface scale" hint="Make everything bigger or smaller.">
          <Slider label="Interface scale" min={UI_SCALE_MIN} max={UI_SCALE_MAX} step={0.05} value={appearance.uiScale}
            onChange={uiScale => setAppearance({ uiScale })} format={v => `${Math.round(v * 100)}%`} />
        </SettingRow>
        <SettingRow label="Reduce motion" hint="Turn off spinning and glowing animations.">
          <Toggle label="Reduce motion" checked={appearance.reduceMotion} onChange={reduceMotion => setAppearance({ reduceMotion })} />
        </SettingRow>
      </Panel>
    </>
  );
}
