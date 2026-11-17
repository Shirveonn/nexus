import { LayoutGrid, RotateCcw } from "lucide-react";
import { Panel, Segmented, Toggle } from "@/components/ui/controls";
import { widgetDefinitions } from "@/features/dashboard/widgets";
import { useSettings } from "@/store/settingsStore";
import { useUi } from "@/store/uiStore";

export function DashboardTab() {
  const widgets = useSettings(s => s.widgets);
  const { setWidgetSpan, setWidgetVisible, resetLayout } = useSettings.getState();
  const navigate = useUi(s => s.navigate);
  const setEditing = useUi(s => s.setEditingLayout);

  return (
    <Panel
      title="Dashboard widgets"
      description="Choose which widgets appear on Home and how wide they are."
      actions={
        <div className="button-row">
          <button className="subtle-button" onClick={resetLayout}><RotateCcw size={13} /> Reset</button>
          <button className="primary-button" onClick={() => { navigate("Home"); setEditing(true); }}><LayoutGrid size={15} /> Arrange on dashboard</button>
        </div>
      }
    >
      <div className="widget-list">
        {widgets.map(w => {
          const def = widgetDefinitions[w.id];
          return (
            <div key={w.id} className={`widget-list__row ${w.visible ? "" : "is-hidden"}`}>
              <span className="quick-icon"><def.icon size={15} /></span>
              <div className="widget-list__text"><strong>{def.title}</strong><small>{def.description}</small></div>
              <Segmented<string> label={`${def.title} size`} value={String(w.span)} onChange={v => setWidgetSpan(w.id, Number(v))}
                options={[{ value: "1", label: "S" }, { value: "2", label: "M" }, { value: "3", label: "L" }, { value: "4", label: "XL" }]} />
              <Toggle label={`Show ${def.title}`} checked={w.visible} onChange={v => setWidgetVisible(w.id, v)} />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
