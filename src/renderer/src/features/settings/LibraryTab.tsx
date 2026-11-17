import { useState } from "react";
import { Download, FileUp, RotateCcw, Save, Trash2, TriangleAlert } from "lucide-react";
import { Panel, SettingRow, Toggle } from "@/components/ui/controls";
import { downloadJson, pickFile } from "@/lib/files";
import { useSettings } from "@/store/settingsStore";
import { useUi } from "@/store/uiStore";
import { themePresets } from "@/theme/presets";
import { createThemeFile, parseThemeFile, slugify } from "@/theme/themeFile";
import type { Appearance } from "@/types/settings";
import { ThemeSwatch } from "./ThemeSwatch";

const MAX_THEME_FILE_BYTES = 10 * 1024 * 1024;

export function LibraryTab() {
  const appearance = useSettings(s => s.appearance);
  const savedThemes = useSettings(s => s.savedThemes);
  const { applyAppearance, saveTheme, deleteTheme, resetAppearance, resetAll } = useSettings.getState();
  const toast = useUi(s => s.toast);
  const [name, setName] = useState("");
  const [includeImage, setIncludeImage] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);

  function exportTheme(themeName: string, look: Appearance) {
    const file = createThemeFile(themeName, look, includeImage);
    downloadJson(`nexus-theme-${slugify(file.name)}.json`, file);
  }

  async function importTheme() {
    const file = await pickFile(".json,application/json");
    if (!file) return;
    if (file.size > MAX_THEME_FILE_BYTES) return toast("That file is too large to be a theme.", "error");
    const result = parseThemeFile(await file.text());
    if (!result.ok) return toast(result.error, "error");
    saveTheme(result.theme.name, result.theme.appearance);
    applyAppearance(result.theme.appearance);
    toast(`Imported and applied “${result.theme.name}”`, "success");
  }

  function saveCurrent() {
    const theme = saveTheme(name || "My theme");
    setName("");
    toast(`Saved “${theme.name}”`, "success");
  }

  return (
    <>
      <Panel title="Your themes" description="Save the current look so you can switch back to it any time.">
        <div className="save-row">
          <input className="text-input" placeholder="Theme name" value={name} maxLength={40}
            onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveCurrent()} />
          <button className="primary-button" onClick={saveCurrent}><Save size={15} /> Save current look</button>
        </div>
        {savedThemes.length === 0 ? (
          <p className="hint">No saved themes yet. Save one above, or import a theme a friend sent you.</p>
        ) : (
          <div className="theme-grid">
            {savedThemes.map(t => (
              <div key={t.id} className="theme-card">
                <button className="theme-card__apply" onClick={() => { applyAppearance(t.appearance); toast(`Applied “${t.name}”`, "success"); }}>
                  <ThemeSwatch appearance={t.appearance} />
                  <strong>{t.name}</strong>
                </button>
                <div className="theme-card__actions">
                  <button className="icon-button" aria-label={`Export ${t.name}`} title="Export" onClick={() => exportTheme(t.name, t.appearance)}><Download size={14} /></button>
                  <button className="icon-button" aria-label={`Delete ${t.name}`} title="Delete" onClick={() => deleteTheme(t.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Built-in looks" description="Complete themes to start from. Applying one replaces your current look.">
        <div className="theme-grid">
          {themePresets.map(p => (
            <div key={p.id} className="theme-card">
              <button className="theme-card__apply" onClick={() => { applyAppearance(p.appearance); toast(`Applied “${p.name}”`, "success"); }}>
                <ThemeSwatch appearance={p.appearance} />
                <strong>{p.name}</strong>
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Share themes" description="Theme files are small .json files you can send to friends.">
        <SettingRow label="Include wallpaper image" hint="Uploaded images make the file larger.">
          <Toggle label="Include wallpaper image" checked={includeImage} onChange={setIncludeImage} />
        </SettingRow>
        <div className="button-row">
          <button className="primary-button" onClick={() => exportTheme("My NEXUS theme", appearance)}><Download size={15} /> Export current look</button>
          <button className="primary-button" onClick={importTheme}><FileUp size={15} /> Import theme file</button>
        </div>
      </Panel>

      <Panel title="Reset" description="Settings are saved on this PC only." className="danger-panel">
        <div className="button-row">
          <button className="subtle-button" onClick={() => { resetAppearance(); toast("Appearance reset", "info"); }}>
            <RotateCcw size={13} /> Reset appearance
          </button>
          {confirmReset ? (
            <>
              <span className="hint"><TriangleAlert size={13} /> This also deletes saved themes, layout and notes.</span>
              <button className="subtle-button danger" onClick={() => { resetAll(); setConfirmReset(false); toast("Everything reset", "info"); }}>Yes, reset everything</button>
              <button className="subtle-button" onClick={() => setConfirmReset(false)}>Cancel</button>
            </>
          ) : (
            <button className="subtle-button danger" onClick={() => setConfirmReset(true)}><Trash2 size={13} /> Reset everything</button>
          )}
        </div>
      </Panel>
    </>
  );
}
