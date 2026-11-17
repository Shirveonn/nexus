import { PanelLeft } from "lucide-react";
import { Panel, Segmented, SettingRow, Toggle } from "@/components/ui/controls";
import { useSettings } from "@/store/settingsStore";
import type { SidebarPosition, SidebarSize, SidebarStyle } from "@/types/settings";

export function SidebarTab() {
  const sidebar = useSettings(s => s.appearance.sidebar);
  const setSidebar = useSettings(s => s.setSidebar);
  return (
    <Panel title="Sidebar" description="Changes apply instantly — look to the side." icon={<PanelLeft size={18} />}>
      <SettingRow label="Width" hint="Compact shows icons only.">
        <Segmented<SidebarSize> label="Sidebar width" value={sidebar.size} onChange={size => setSidebar({ size })}
          options={[{ value: "compact", label: "Compact" }, { value: "standard", label: "Standard" }, { value: "wide", label: "Wide" }]} />
      </SettingRow>
      <SettingRow label="Style" hint="Glass lets your wallpaper show through.">
        <Segmented<SidebarStyle> label="Sidebar style" value={sidebar.style} onChange={style => setSidebar({ style })}
          options={[{ value: "solid", label: "Solid" }, { value: "glass", label: "Glass" }, { value: "minimal", label: "Minimal" }]} />
      </SettingRow>
      <SettingRow label="Position">
        <Segmented<SidebarPosition> label="Sidebar position" value={sidebar.position} onChange={position => setSidebar({ position })}
          options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]} />
      </SettingRow>
      <SettingRow label="Section labels" hint="Show MAIN / EXPLORE / SYSTEM headings.">
        <Toggle label="Section labels" checked={sidebar.showGroupLabels} onChange={showGroupLabels => setSidebar({ showGroupLabels })} />
      </SettingRow>
    </Panel>
  );
}
