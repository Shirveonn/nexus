import { LayoutGrid, Library, Palette, PanelLeft, Settings, Wallpaper } from "lucide-react";
import { useUi, type SettingsTab } from "@/store/uiStore";
import { BackgroundTab } from "./BackgroundTab";
import { DashboardTab } from "./DashboardTab";
import { LibraryTab } from "./LibraryTab";
import { SidebarTab } from "./SidebarTab";
import { ThemesTab } from "./ThemesTab";

const tabs: { id: SettingsTab; label: string; icon: typeof Palette; Component: () => JSX.Element }[] = [
  { id: "themes", label: "Theme", icon: Palette, Component: ThemesTab },
  { id: "background", label: "Background", icon: Wallpaper, Component: BackgroundTab },
  { id: "sidebar", label: "Sidebar", icon: PanelLeft, Component: SidebarTab },
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, Component: DashboardTab },
  { id: "library", label: "Saved & sharing", icon: Library, Component: LibraryTab }
];

export function SettingsPage() {
  const active = useUi(s => s.settingsTab);
  const setTab = useUi(s => s.setSettingsTab);
  const current = tabs.find(t => t.id === active) ?? tabs[0];

  return (
    <div className="page-content settings-page">
      <div className="eyebrow"><Settings size={13} /> PERSONALIZE</div>
      <h1>Make it <span>yours.</span></h1>
      <p className="page-intro">Tune the look and feel of your NEXUS workspace. Everything saves automatically.</p>

      <div className="tabs" role="tablist" aria-label="Settings sections">
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={t.id === current.id} className={t.id === current.id ? "active" : ""} onClick={() => setTab(t.id)}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="settings-stack" role="tabpanel">
        <current.Component />
      </div>
    </div>
  );
}
