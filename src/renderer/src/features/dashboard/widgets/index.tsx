import { useEffect, useState, type ReactNode } from "react";
import {
  Activity, Clapperboard, Clock, Gamepad2, Gauge, LayoutDashboard, LogIn, NotebookPen, Plus, Trophy, UserPlus, Users, Zap, type LucideIcon
} from "lucide-react";
import { useAuth } from "@/features/auth/authStore";
import { FriendProfileModal, StatusAvatar, friendStatusText } from "@/features/friends/FriendsPage";
import type { FriendRow } from "@/features/friends/friendsApi";
import { isOnline, selectIncoming, sortFriends, useFriendList, useFriends } from "@/features/friends/friendsStore";
import { useSettings } from "@/store/settingsStore";
import { useUi } from "@/store/uiStore";
import type { WidgetId } from "@/types/settings";

export interface WidgetDefinition {
  id: WidgetId;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Whether the widget draws its own panel chrome (the hero does). */
  bare?: boolean;
  Component: () => ReactNode;
}

function HeroWidget() {
  const navigate = useUi(s => s.navigate);
  const version = window.nexus?.appVersion ?? "dev";
  return (
    <section className="hero-card">
      <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
      <div className="hero-content">
        <div className="hero-chip"><span className="live-dot" /> VERSION {version} · MAKE IT YOURS</div>
        <h2>Everything you love.<br /><span>One connected space.</span></h2>
        <p>NEXUS is just getting started. Make it yours, bring your friends, and build your own corner of the internet.</p>
        <button className="hero-button" onClick={() => navigate("Settings", "themes")}>Customize NEXUS <span>↗</span></button>
      </div>
      <div className="hero-graphic">
        <div className="graphic-ring ring-a" /><div className="graphic-ring ring-b" />
        <div className="graphic-core"><Zap size={43} fill="currentColor" /></div>
        <div className="orbit-dot dot-a" /><div className="orbit-dot dot-b" /><div className="orbit-dot dot-c" />
      </div>
      <div className="hero-grid" />
    </section>
  );
}

function Stat({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="stat-card">
      <div className="stat-top"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span></div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  );
}

function StatsWidget() {
  const signedIn = useAuth(s => s.status === "signedIn");
  const friends = useFriendList();
  const serverNow = useFriends(s => s.serverNow)();
  useFriends(s => s.tick);
  const online = friends.filter(f => isOnline(f, serverNow)).length;
  return (
    <div className="stats-grid">
      {signedIn
        ? <Stat icon={<Users />} label="Friends online" value={String(online)} note={friends.length ? `of ${friends.length} ${friends.length === 1 ? "friend" : "friends"}` : "Add friends to begin"} />
        : <Stat icon={<Users />} label="Friends online" value="—" note="Sign in to see friends" />}
      <Stat icon={<Gamepad2 />} label="Games tracked" value="0" note="Your library starts here" />
      <Stat icon={<Trophy />} label="Achievements" value="0" note="Plenty to unlock" />
      <Stat icon={<Gauge />} label="System status" value="Ready" note="Desktop preview running" />
    </div>
  );
}

function QuickAccessWidget() {
  const navigate = useUi(s => s.navigate);
  const items = [
    { icon: <Users />, title: "Find your friends", text: "Build your circle", page: "Friends" as const },
    { icon: <Gamepad2 />, title: "Game library", text: "Keep games together", page: "Gaming" as const },
    { icon: <Clapperboard />, title: "Anime tracker", text: "Track what you watch", page: "Anime" as const },
    { icon: <Trophy />, title: "Arcade", text: "Compete with friends", page: "Arcade" as const }
  ];
  return (
    <div className="quick-grid">
      {items.map(i => (
        <button key={i.title} className="quick-item" onClick={() => navigate(i.page)}>
          <span className="quick-icon">{i.icon}</span>
          <span><strong>{i.title}</strong><small>{i.text}</small></span>
          <Plus size={15} className="quick-plus" />
        </button>
      ))}
    </div>
  );
}

/** "Who's around": online friends first, then the most recently active. */
function FriendsWidget() {
  const status = useAuth(s => s.status);
  const openSignIn = useAuth(s => s.openSignIn);
  const navigate = useUi(s => s.navigate);
  const setFriendsTab = useUi(s => s.setFriendsTab);
  const friends = useFriendList();
  const incoming = useFriends(s => selectIncoming(s).length);
  const loaded = useFriends(s => s.loaded);
  const serverNow = useFriends(s => s.serverNow)();
  useFriends(s => s.tick);
  const [viewing, setViewing] = useState<FriendRow | null>(null);

  if (status !== "signedIn") {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Users size={20} /></div>
        <strong>See who's online</strong>
        <span>Sign in to add friends and see when they're around.</span>
        {status !== "unconfigured" && <button className="subtle-button" onClick={openSignIn}><LogIn size={13} /> Sign in</button>}
      </div>
    );
  }
  const goFriends = (tab: "friends" | "requests" | "add") => { setFriendsTab(tab); navigate("Friends"); };
  if (loaded && friends.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><UserPlus size={20} /></div>
        <strong>No friends yet</strong>
        <span>{incoming ? `You have ${incoming} friend request${incoming === 1 ? "" : "s"} waiting.` : "Find your friends by username."}</span>
        <button className="subtle-button" onClick={() => goFriends(incoming ? "requests" : "add")}>{incoming ? "View requests" : "Add friends"}</button>
      </div>
    );
  }
  const top = sortFriends(friends, serverNow).slice(0, 6);
  return (
    <div className="friends-widget">
      {incoming > 0 && (
        <button className="friends-widget__alert" onClick={() => goFriends("requests")}>
          <UserPlus size={14} /> {incoming} new friend request{incoming === 1 ? "" : "s"}
        </button>
      )}
      {top.map(f => (
        <button key={f.user_id} className="friends-widget__row" onClick={() => setViewing(f)}>
          <StatusAvatar row={f} size={30} serverNow={serverNow} />
          <span><strong>{f.display_name || f.username}</strong><small className={isOnline(f, serverNow) ? "is-online" : ""}>{friendStatusText(f, serverNow)}</small></span>
        </button>
      ))}
      {friends.length > top.length && <button className="subtle-button" onClick={() => goFriends("friends")}>View all {friends.length} friends</button>}
      <FriendProfileModal row={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function ActivityWidget() {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Activity size={20} /></div>
      <strong>It's quiet in here</strong>
      <span>Friend activity will appear here once accounts are connected.</span>
    </div>
  );
}

function ClockWidget() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="clock">
      <div className="clock__time">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      <div className="clock__date">{now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</div>
    </div>
  );
}

function NotesWidget() {
  const notes = useSettings(s => s.notes);
  const setNotes = useSettings(s => s.setNotes);
  return (
    <textarea
      className="notes"
      value={notes}
      onChange={e => setNotes(e.target.value)}
      placeholder="Game night plans, anime to watch, things to remember…"
      aria-label="Notes"
    />
  );
}

export const widgetDefinitions: Record<WidgetId, WidgetDefinition> = {
  hero: { id: "hero", title: "Welcome banner", description: "The NEXUS hero card", icon: LayoutDashboard, bare: true, Component: HeroWidget },
  stats: { id: "stats", title: "Your overview", description: "Your NEXUS space at a glance", icon: Gauge, Component: StatsWidget },
  friends: { id: "friends", title: "Friends", description: "Who's around right now", icon: Users, Component: FriendsWidget },
  quick: { id: "quick", title: "Quick access", description: "Jump back into your space", icon: Zap, Component: QuickAccessWidget },
  activity: { id: "activity", title: "Recent activity", description: "What's happening in your space", icon: Activity, Component: ActivityWidget },
  clock: { id: "clock", title: "Clock", description: "Local time and date", icon: Clock, Component: ClockWidget },
  notes: { id: "notes", title: "Notes", description: "Saved on this PC", icon: NotebookPen, Component: NotesWidget }
};
