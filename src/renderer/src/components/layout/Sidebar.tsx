import { ChevronDown, LogIn, Zap } from "lucide-react";
import { navGroups, navigation } from "@/app/navigation";
import { profileName, useAuth } from "@/features/auth/authStore";
import { Avatar } from "@/features/profile/Avatar";
import { useSettings } from "@/store/settingsStore";
import { useUi } from "@/store/uiStore";

export function Sidebar() {
  const { size, style, showGroupLabels } = useSettings(s => s.appearance.sidebar);
  const page = useUi(s => s.page);
  const navigate = useUi(s => s.navigate);
  const compact = size === "compact";

  return (
    <aside className={`sidebar sidebar--${size} sidebar--${style}`} aria-label="Main navigation">
      <div className="brand">
        <div className="brand-mark"><Zap size={19} fill="currentColor" /></div>
        {!compact && (
          <div>
            <div className="brand-name">NEXUS</div>
            <div className="brand-sub">YOUR DIGITAL SPACE</div>
          </div>
        )}
      </div>

      {!compact && (
        <button className="workspace-switch" title="Workspaces will arrive in a later version">
          <div className="workspace-icon">N</div>
          <span><strong>Personal space</strong><small>Friend group workspace</small></span>
          <ChevronDown size={15} />
        </button>
      )}

      <nav className="nav">
        {navGroups.map(group => (
          <div className="nav-group" key={group}>
            {showGroupLabels && !compact && <div className="nav-label">{group}</div>}
            {navigation.filter(item => item.group === group && !item.hidden).map(item => {
              const Icon = item.icon;
              const active = page === item.label;
              return (
                <button
                  key={item.label}
                  className={`nav-item ${active ? "active" : ""}`}
                  onClick={() => navigate(item.label)}
                  title={compact ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  {!compact && <span>{item.label}</span>}
                  {!compact && item.label === "Friends" && <span className="nav-count">0</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {!compact && <ConnectionStatus />}
        <UserCard compact={compact} />
      </div>
    </aside>
  );
}

function ConnectionStatus() {
  const status = useAuth(s => s.status);
  const label =
    status === "signedIn" ? "Online" :
    status === "unconfigured" ? "Offline mode" :
    status === "loading" ? "Connecting…" : "Guest mode";
  return (
    <div className="connection">
      <span className={`status-dot ${status === "signedIn" ? "" : "status-dot--idle"}`} /> {label}
      <span className="preview-tag">{status === "signedIn" ? "SYNCED" : "LOCAL"}</span>
    </div>
  );
}

function UserCard({ compact }: { compact: boolean }) {
  const status = useAuth(s => s.status);
  const profile = useAuth(s => s.profile);
  const openSignIn = useAuth(s => s.openSignIn);
  const navigate = useUi(s => s.navigate);
  const signedIn = status === "signedIn";

  const onClick = () => (signedIn ? navigate("Profile") : status === "unconfigured" ? navigate("Settings", "account") : openSignIn());

  return (
    <button className="user-card" onClick={onClick} title={signedIn ? "Your profile" : "Sign in"}>
      <Avatar profile={profile} />
      {!compact && (
        <>
          <span className="user-meta">
            <strong>{signedIn ? profileName(profile) : "Guest user"}</strong>
            <small>{signedIn ? (profile ? `@${profile.username}` : "Loading…") : "Not signed in"}</small>
          </span>
          {!signedIn && <LogIn size={16} className="muted-icon" />}
        </>
      )}
    </button>
  );
}
