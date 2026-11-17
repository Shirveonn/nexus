import { ChevronDown, CircleHelp, Zap } from "lucide-react";
import { navGroups, navigation } from "@/app/navigation";
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
        <button className="workspace-switch" title="Workspaces arrive with accounts in 0.3.0">
          <div className="workspace-icon">N</div>
          <span><strong>Personal space</strong><small>Friend group workspace</small></span>
          <ChevronDown size={15} />
        </button>
      )}

      <nav className="nav">
        {navGroups.map(group => (
          <div className="nav-group" key={group}>
            {showGroupLabels && !compact && <div className="nav-label">{group}</div>}
            {navigation.filter(item => item.group === group).map(item => {
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
        {!compact && (
          <div className="connection"><span className="status-dot" /> Local preview <span className="preview-tag">DEMO</span></div>
        )}
        <div className="user-card">
          <div className="avatar">N</div>
          {!compact && (
            <>
              <div className="user-meta"><strong>Guest user</strong><small>Not signed in</small></div>
              <button className="icon-button" aria-label="Help"><CircleHelp size={17} /></button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
