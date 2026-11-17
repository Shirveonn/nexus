import { useEffect } from "react";
import { Zap } from "lucide-react";
import { AppBackground } from "@/components/layout/AppBackground";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Toaster } from "@/components/ui/Toaster";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { useAuth } from "@/features/auth/authStore";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { PlaceholderPage } from "@/features/placeholder/PlaceholderPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { useSettings } from "@/store/settingsStore";
import { useUi } from "@/store/uiStore";
import { useApplyAppearance } from "@/theme/useApplyAppearance";

export function App() {
  useApplyAppearance();
  const initAuth = useAuth(s => s.init);
  const status = useAuth(s => s.status);
  const guest = useAuth(s => s.guest);
  const pendingReset = useAuth(s => s.pendingPasswordReset);
  const page = useUi(s => s.page);
  const navigate = useUi(s => s.navigate);
  const sidebar = useSettings(s => s.appearance.sidebar);
  const hasWallpaper = useSettings(s => s.appearance.background.kind !== "none");

  useEffect(() => initAuth(), [initAuth]);

  // After signing out, the next sign-in should start on the dashboard.
  useEffect(() => {
    if (status === "signedOut") navigate("Home");
  }, [status, navigate]);

  const showAuth = pendingReset || (status === "signedOut" && !guest);

  return (
    <div className={`app sidebar-${sidebar.position} ${hasWallpaper ? "has-wallpaper" : ""}`}>
      <AppBackground />
      {status === "loading" ? (
        <div className="splash"><div className="brand-mark"><Zap size={22} fill="currentColor" /></div><span className="spinner" /></div>
      ) : showAuth ? (
        <AuthScreen />
      ) : (
        <>
          <Sidebar />
          <main className="main">
            <Topbar />
            <div className="main-scroll">
              {page === "Home" ? <DashboardPage />
                : page === "Settings" ? <SettingsPage />
                : page === "Profile" ? <ProfilePage />
                : <PlaceholderPage page={page} />}
            </div>
          </main>
        </>
      )}
      <Toaster />
    </div>
  );
}
