import { AppBackground } from "@/components/layout/AppBackground";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Toaster } from "@/components/ui/Toaster";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { PlaceholderPage } from "@/features/placeholder/PlaceholderPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { useSettings } from "@/store/settingsStore";
import { useUi } from "@/store/uiStore";
import { useApplyAppearance } from "@/theme/useApplyAppearance";

export function App() {
  useApplyAppearance();
  const page = useUi(s => s.page);
  const sidebar = useSettings(s => s.appearance.sidebar);
  const hasWallpaper = useSettings(s => s.appearance.background.kind !== "none");

  return (
    <div className={`app sidebar-${sidebar.position} ${hasWallpaper ? "has-wallpaper" : ""}`}>
      <AppBackground />
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="main-scroll">
          {page === "Home" ? <DashboardPage /> : page === "Settings" ? <SettingsPage /> : <PlaceholderPage page={page} />}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
