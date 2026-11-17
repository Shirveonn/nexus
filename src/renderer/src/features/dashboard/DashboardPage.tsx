import { Check, LayoutGrid, Palette, Plus, RotateCcw, Sparkles } from "lucide-react";
import { profileName, useAuth } from "@/features/auth/authStore";
import { useSettings } from "@/store/settingsStore";
import { useUi } from "@/store/uiStore";
import { WidgetFrame } from "./WidgetFrame";
import { widgetDefinitions } from "./widgets";

export function DashboardPage() {
  const widgets = useSettings(s => s.widgets);
  const setWidgetVisible = useSettings(s => s.setWidgetVisible);
  const resetLayout = useSettings(s => s.resetLayout);
  const editing = useUi(s => s.editingLayout);
  const setEditing = useUi(s => s.setEditingLayout);
  const navigate = useUi(s => s.navigate);

  const profile = useAuth(s => s.profile);
  const hidden = widgets.filter(w => !w.visible);

  return (
    <div className="page-content">
      <section className="welcome-row">
        <div>
          <div className="eyebrow"><Sparkles size={13} /> YOUR SPACE. YOUR RULES.</div>
          {profile ? <h1>Welcome back, <span>{profileName(profile)}.</span></h1> : <h1>Welcome to <span>NEXUS.</span></h1>}
          <p>Your gaming world, connected in one place.</p>
        </div>
        <div className="button-row">
          <button className={`primary-button ${editing ? "is-active" : ""}`} onClick={() => setEditing(!editing)}>
            {editing ? <><Check size={16} /> Done</> : <><LayoutGrid size={16} /> Edit layout</>}
          </button>
          <button className="primary-button" onClick={() => navigate("Settings", "themes")}><Palette size={16} /> Customize space</button>
        </div>
      </section>

      {editing && (
        <div className="edit-banner">
          <div>
            <strong>Editing layout</strong>
            <span>Drag widgets to rearrange them. Drag the right edge or pick S / M / L / XL to resize.</span>
          </div>
          <button className="subtle-button" onClick={resetLayout}><RotateCcw size={13} /> Reset layout</button>
        </div>
      )}

      {editing && hidden.length > 0 && (
        <div className="widget-tray">
          <span>Hidden widgets</span>
          {hidden.map(w => {
            const def = widgetDefinitions[w.id];
            return (
              <button key={w.id} className="chip" onClick={() => setWidgetVisible(w.id, true)}>
                <Plus size={13} /> {def.title}
              </button>
            );
          })}
        </div>
      )}

      <div className="widget-grid">
        {widgets.map((w, index) => w.visible && <WidgetFrame key={w.id} layout={w} index={index} editing={editing} />)}
      </div>

      {!editing && widgets.every(w => !w.visible) && (
        <div className="panel empty-state">
          <strong>Your dashboard is empty</strong>
          <span>Click “Edit layout” to add widgets back.</span>
        </div>
      )}
    </div>
  );
}
