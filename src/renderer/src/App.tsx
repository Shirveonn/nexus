import { useState } from "react";
import {
  Activity, Bell, ChevronDown, CircleHelp, Clapperboard, Gamepad2,
  Gauge, Home, MessageSquare, Monitor, Palette, Plus, Search,
  Settings, ShieldCheck, Sparkles, Trophy, Users, Zap
} from "lucide-react";

type Page = "Home" | "Friends" | "Gaming" | "Arcade" | "Anime" | "Community" | "PC Center" | "Settings";
type Accent = "blue" | "violet" | "cyan" | "pink";

const navigation: { label: Page; icon: typeof Home; group: string }[] = [
  { label: "Home", icon: Home, group: "MAIN" },
  { label: "Friends", icon: Users, group: "MAIN" },
  { label: "Gaming", icon: Gamepad2, group: "MAIN" },
  { label: "Arcade", icon: Trophy, group: "MAIN" },
  { label: "Anime", icon: Clapperboard, group: "EXPLORE" },
  { label: "Community", icon: MessageSquare, group: "EXPLORE" },
  { label: "PC Center", icon: Monitor, group: "EXPLORE" },
  { label: "Settings", icon: Settings, group: "SYSTEM" }
];

const accents: { id: Accent; label: string; color: string }[] = [
  { id: "blue", label: "Electric blue", color: "#648cff" },
  { id: "violet", label: "Violet", color: "#9b7bff" },
  { id: "cyan", label: "Cyan", color: "#42d9d0" },
  { id: "pink", label: "Pink", color: "#f17ac4" }
];

function App() {
  const [page, setPage] = useState<Page>("Home");
  const [accent, setAccent] = useState<Accent>("blue");
  const [showThemes, setShowThemes] = useState(false);

  return (
    <div className={`app accent-${accent}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Zap size={19} fill="currentColor" /></div>
          <div><div className="brand-name">NEXUS</div><div className="brand-sub">YOUR DIGITAL SPACE</div></div>
        </div>

        <button className="workspace-switch">
          <div className="workspace-icon">N</div>
          <span><strong>Personal space</strong><small>Friend group workspace</small></span>
          <ChevronDown size={15} />
        </button>

        {["MAIN", "EXPLORE", "SYSTEM"].map(group => (
          <div className="nav-group" key={group}>
            <div className="nav-label">{group}</div>
            {navigation.filter(item => item.group === group).map(item => {
              const Icon = item.icon;
              return (
                <button key={item.label} className={`nav-item ${page === item.label ? "active" : ""}`} onClick={() => setPage(item.label)}>
                  <Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>
                  {item.label === "Friends" && <span className="nav-count">0</span>}
                </button>
              );
            })}
          </div>
        ))}

        <div className="sidebar-bottom">
          <div className="connection"><span className="status-dot" /> Local preview <span className="preview-tag">DEMO</span></div>
          <div className="user-card">
            <div className="avatar">N</div>
            <div className="user-meta"><strong>Guest user</strong><small>Not signed in</small></div>
            <button className="icon-button" aria-label="Help"><CircleHelp size={17} /></button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{page}</strong></div>
          <div className="top-actions">
            <div className="search"><Search size={15} /><span>Search NEXUS</span><kbd>⌘ K</kbd></div>
            <button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button>
            <button className="profile-pill"><div className="avatar small">N</div><span>Guest</span><ChevronDown size={14} /></button>
          </div>
        </header>

        {page === "Home" ? (
          <div className="page-content">
            <section className="welcome-row">
              <div>
                <div className="eyebrow"><Sparkles size={13} /> YOUR SPACE. YOUR RULES.</div>
                <h1>Welcome to <span>NEXUS.</span></h1>
                <p>Your gaming world, connected in one place.</p>
              </div>
              <button className="primary-button" onClick={() => setPage("Settings")}><Palette size={16} /> Customize space</button>
            </section>

            <section className="hero-card">
              <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
              <div className="hero-content">
                <div className="hero-chip"><span className="live-dot" /> VERSION 0.1.0 · FIRST LOOK</div>
                <h2>Everything you love.<br /><span>One connected space.</span></h2>
                <p>NEXUS is just getting started. Make it yours, bring your friends, and build your own corner of the internet.</p>
                <button className="hero-button" onClick={() => setPage("Friends")}>Explore NEXUS <span>↗</span></button>
              </div>
              <div className="hero-graphic">
                <div className="graphic-ring ring-a" /><div className="graphic-ring ring-b" />
                <div className="graphic-core"><Zap size={43} fill="currentColor" /></div>
                <div className="orbit-dot dot-a" /><div className="orbit-dot dot-b" /><div className="orbit-dot dot-c" />
              </div>
              <div className="hero-grid" />
            </section>

            <div className="section-heading"><div><h3>Your overview</h3><p>Your NEXUS space at a glance</p></div><span className="updated-label"><Activity size={13} /> LOCAL PREVIEW</span></div>
            <section className="stats-grid">
              <Stat icon={<Users />} label="Friends online" value="—" note="Connect accounts to begin" />
              <Stat icon={<Gamepad2 />} label="Games tracked" value="0" note="Your library starts here" />
              <Stat icon={<Trophy />} label="Achievements" value="0" note="Plenty to unlock" />
              <Stat icon={<Gauge />} label="System status" value="Ready" note="Desktop preview running" />
            </section>

            <div className="lower-grid">
              <section className="panel quick-panel">
                <div className="panel-heading"><div><h3>Quick access</h3><p>Jump back into your space</p></div><button className="subtle-button">View all</button></div>
                <div className="quick-grid">
                  <Quick icon={<Users />} title="Find your friends" text="Build your circle" onClick={() => setPage("Friends")} />
                  <Quick icon={<Gamepad2 />} title="Game library" text="Keep games together" onClick={() => setPage("Gaming")} />
                  <Quick icon={<Clapperboard />} title="Anime tracker" text="Track what you watch" onClick={() => setPage("Anime")} />
                  <Quick icon={<Trophy />} title="Arcade" text="Compete with friends" onClick={() => setPage("Arcade")} />
                </div>
              </section>
              <section className="panel activity-panel">
                <div className="panel-heading"><div><h3>Recent activity</h3><p>What's happening in your space</p></div><Activity size={17} className="muted-icon" /></div>
                <div className="empty-state"><div className="empty-icon"><Activity size={20} /></div><strong>It's quiet in here</strong><span>Friend activity will appear here once accounts are connected.</span></div>
              </section>
            </div>
          </div>
        ) : page === "Settings" ? (
          <div className="page-content settings-page">
            <div className="eyebrow"><Settings size={13} /> PERSONALIZE</div>
            <h1>Make it <span>yours.</span></h1>
            <p className="page-intro">Tune the look and feel of your NEXUS workspace.</p>
            <section className="panel settings-panel">
              <div className="panel-heading"><div><h3>Accent color</h3><p>Choose the color used throughout the interface.</p></div><Palette size={18} className="muted-icon" /></div>
              <div className="theme-options">{accents.map(item => <button key={item.id} className={`theme-option ${accent === item.id ? "selected" : ""}`} onClick={() => setAccent(item.id)}><span style={{ background: item.color }} /><span>{item.label}</span>{accent === item.id && <span className="check">✓</span>}</button>)}</div>
            </section>
            <section className="panel settings-panel">
              <div className="panel-heading"><div><h3>Workspace appearance</h3><p>More layout and background controls are coming.</p></div></div>
              <div className="coming-row"><Sparkles size={17} /><div><strong>Custom backgrounds and widgets</strong><small>Planned for a future version</small></div><span className="coming-tag">COMING SOON</span></div>
            </section>
          </div>
        ) : (
          <div className="page-content placeholder-page">
            <div className="eyebrow"><Sparkles size={13} /> NEXUS MODULE</div>
            <h1>{page}<span>.</span></h1>
            <p className="page-intro">This module is part of the NEXUS roadmap.</p>
            <section className="panel module-placeholder"><div className="empty-icon"><ShieldCheck size={22} /></div><h3>Under construction</h3><p>We're building this section step by step. The foundation is in place.</p><button className="primary-button" onClick={() => setPage("Home")}>Back to dashboard</button></section>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span></div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}
function Quick({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return <button className="quick-item" onClick={onClick}><span className="quick-icon">{icon}</span><span><strong>{title}</strong><small>{text}</small></span><Plus size={15} className="quick-plus" /></button>;
}

export default App;