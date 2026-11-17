import { useEffect, useMemo, useState } from "react";
import {
  Ban, Check, Clock, LogIn, Search, ServerOff, ShieldOff, Sparkles, UserCheck, UserMinus, UserPlus, UserRound, Users, X
} from "lucide-react";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { useAuth } from "@/features/auth/authStore";
import { friendlyError } from "@/features/auth/validation";
import { Avatar } from "@/features/profile/Avatar";
import { ProfileView } from "@/features/profile/ProfileView";
import { relativeTime } from "@/lib/time";
import { useUi } from "@/store/uiStore";
import * as api from "./friendsApi";
import type { FriendRow, Relationship, SearchRow } from "./friendsApi";
import { isOnline, sortFriends, useFriendList, useFriends, useIncoming, useOutgoing } from "./friendsStore";

type Tab = "friends" | "requests" | "add" | "blocked";

/** Runs a friend action, shows a toast, refreshes the lists. */
function useFriendAction() {
  const toast = useUi(s => s.toast);
  const reload = useFriends(s => s.reload);
  const reloadBlocked = useFriends(s => s.reloadBlocked);
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<unknown>, success?: string) => {
    setBusy(key);
    try {
      await fn();
      if (success) toast(success, "success");
      await Promise.all([reload(), reloadBlocked()]);
      return true;
    } catch (err) {
      toast(friendlyError(err), "error");
      return false;
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}

const nameOf = (r: { display_name: string | null; username: string }) => r.display_name || r.username;

export function friendStatusText(row: FriendRow, serverNow: number): string {
  if (isOnline(row, serverNow)) return "Online";
  if (row.last_seen_at) return `Last seen ${relativeTime(row.last_seen_at, serverNow)}`;
  return "Offline";
}

export function StatusAvatar({ row, size = 38, serverNow }: { row: FriendRow | SearchRow; size?: number; serverNow?: number }) {
  const showDot = "kind" in row && row.kind === "friend" && serverNow !== undefined;
  const online = showDot && isOnline(row as FriendRow, serverNow!);
  return (
    <span className="status-avatar" style={{ width: size, height: size }}>
      <Avatar profile={row} size={size} />
      {showDot && <i className={`presence-dot ${online ? "is-online" : ""}`} aria-label={online ? "Online" : "Offline"} />}
    </span>
  );
}

export function FriendsPage() {
  const status = useAuth(s => s.status);
  if (status !== "signedIn") return <SignedOutFriends />;
  return <FriendsHome />;
}

function SignedOutFriends() {
  const status = useAuth(s => s.status);
  const openSignIn = useAuth(s => s.openSignIn);
  const navigate = useUi(s => s.navigate);
  return (
    <div className="page-content placeholder-page">
      <div className="eyebrow"><Sparkles size={13} /> FRIENDS</div>
      <h1>Friends<span>.</span></h1>
      <section className="panel module-placeholder">
        <div className="empty-icon">{status === "unconfigured" ? <ServerOff size={22} /> : <Users size={22} />}</div>
        {status === "unconfigured" ? (
          <>
            <h3>Accounts aren't set up yet</h3>
            <p>Friends need online accounts. See Settings → Account for how to connect NEXUS to Supabase.</p>
            <button className="primary-button" onClick={() => navigate("Settings", "account")}>Open account settings</button>
          </>
        ) : (
          <>
            <h3>Sign in to add friends</h3>
            <p>Create a free account to send friend requests and see who's online.</p>
            <button className="primary-button" onClick={openSignIn}><LogIn size={15} /> Sign in or create account</button>
          </>
        )}
      </section>
    </div>
  );
}

function FriendsHome() {
  const friendsTab = useUi(s => s.friendsTab);
  const setTab = useUi(s => s.setFriendsTab);
  const friends = useFriendList();
  const incoming = useIncoming();
  const outgoing = useOutgoing();
  const blocked = useFriends(s => s.blocked);
  const serverNow = useFriends(s => s.serverNow);
  useFriends(s => s.tick);
  const onlineCount = friends.filter(f => isOnline(f, serverNow())).length;

  const tabs: { id: Tab; label: string; icon: typeof Users; badge?: number }[] = [
    { id: "friends", label: "Friends", icon: Users, badge: friends.length || undefined },
    { id: "requests", label: "Requests", icon: UserCheck, badge: incoming.length || undefined },
    { id: "add", label: "Add friend", icon: UserPlus },
    { id: "blocked", label: "Blocked", icon: Ban }
  ];

  return (
    <div className="page-content friends-page">
      <div className="welcome-row">
        <div>
          <div className="eyebrow"><Users size={13} /> YOUR CIRCLE</div>
          <h1>Friends<span>.</span></h1>
          <p>{friends.length === 0 ? "Add your friends to see when they're online." : `${onlineCount} online · ${friends.length} ${friends.length === 1 ? "friend" : "friends"}`}</p>
        </div>
        <button className="primary-button" onClick={() => setTab("add")}><UserPlus size={16} /> Add friend</button>
      </div>

      <div className="tabs" role="tablist" aria-label="Friends sections">
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={friendsTab === t.id} className={friendsTab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            <t.icon size={15} /> {t.label}
            {t.badge ? <span className={`tab-badge ${t.id === "requests" ? "is-alert" : ""}`}>{t.badge}</span> : null}
          </button>
        ))}
      </div>

      <div className="friends-body" role="tabpanel">
        {friendsTab === "friends" && <FriendsList friends={friends} />}
        {friendsTab === "requests" && <Requests incoming={incoming} outgoing={outgoing} />}
        {friendsTab === "add" && <AddFriend />}
        {friendsTab === "blocked" && <BlockedList blocked={blocked} />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Friends */

function FriendsList({ friends }: { friends: FriendRow[] }) {
  const loaded = useFriends(s => s.loaded);
  const error = useFriends(s => s.error);
  const serverNow = useFriends(s => s.serverNow)();
  const setTab = useUi(s => s.setFriendsTab);
  const [filter, setFilter] = useState("");
  const [viewing, setViewing] = useState<FriendRow | null>(null);

  const sorted = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = q ? friends.filter(f => f.username.includes(q) || (f.display_name ?? "").toLowerCase().includes(q)) : friends;
    return sortFriends(list, serverNow);
  }, [friends, filter, serverNow]);
  const online = sorted.filter(f => isOnline(f, serverNow));
  const offline = sorted.filter(f => !isOnline(f, serverNow));

  if (!loaded) return <div className="panel friends-empty"><span className="spinner" /> Loading friends…</div>;
  if (error && friends.length === 0) return <div className="panel friends-empty">{error}</div>;
  if (friends.length === 0) {
    return (
      <div className="panel friends-empty">
        <div className="empty-icon"><Users size={22} /></div>
        <strong>No friends yet</strong>
        <span>Search for your friends by their NEXUS username and send them a request.</span>
        <button className="primary-button" onClick={() => setTab("add")}><UserPlus size={15} /> Find friends</button>
      </div>
    );
  }

  return (
    <>
      {friends.length > 5 && (
        <label className="search-field">
          <Search size={15} />
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter friends" aria-label="Filter friends" />
        </label>
      )}
      {[{ title: "Online", rows: online }, { title: "Offline", rows: offline }].map(group => group.rows.length > 0 && (
        <section key={group.title} className="friend-group">
          <h4>{group.title} — {group.rows.length}</h4>
          <div className="friend-list">
            {group.rows.map(f => <FriendItem key={f.user_id} row={f} serverNow={serverNow} onOpen={() => setViewing(f)} />)}
          </div>
        </section>
      ))}
      {filter && sorted.length === 0 && <p className="hint">No friends match “{filter}”.</p>}
      <FriendProfileModal row={viewing} onClose={() => setViewing(null)} />
    </>
  );
}

function FriendItem({ row, serverNow, onOpen }: { row: FriendRow; serverNow: number; onOpen: () => void }) {
  const online = isOnline(row, serverNow);
  return (
    <button className="friend-item" onClick={onOpen}>
      <StatusAvatar row={row} serverNow={serverNow} />
      <span className="friend-item__text">
        <strong>{nameOf(row)}</strong>
        <small className={online ? "is-online" : ""}>{friendStatusText(row, serverNow)}</small>
      </span>
      <span className="friend-item__username">@{row.username}</span>
      <UserRound size={15} className="muted-icon" />
    </button>
  );
}

export function FriendProfileModal({ row, onClose }: { row: FriendRow | null; onClose: () => void }) {
  const serverNow = useFriends(s => s.serverNow)();
  const { busy, run } = useFriendAction();
  const [confirm, setConfirm] = useState<"remove" | "block" | null>(null);
  if (!row) return null;
  const name = nameOf(row);

  const doRemove = async () => {
    if (await run("remove", () => api.removeFriendship(row.user_id), `Removed ${name} from your friends`)) { setConfirm(null); onClose(); }
  };
  const doBlock = async () => {
    if (await run("block", () => api.blockUser(row.user_id), `Blocked ${name}`)) { setConfirm(null); onClose(); }
  };

  return (
    <>
      <Modal open={!confirm} onClose={onClose} title={`${name}'s profile`} width={420} className="profile-modal">
        <ProfileView
          profile={{ ...row, created_at: row.joined_at }}
          className="profile-card--modal"
          status={<i className={`presence-dot presence-dot--large ${isOnline(row, serverNow) ? "is-online" : ""}`} />}
          facts={<span><UserCheck size={13} /> Friends since {new Date(row.since).toLocaleDateString([], { month: "short", year: "numeric" })}</span>}
        >
          <div className={`profile-status ${isOnline(row, serverNow) ? "is-online" : ""}`}><i /> {friendStatusText(row, serverNow)}</div>
          <div className="button-row profile-modal__actions">
            <button className="subtle-button" onClick={() => setConfirm("remove")}><UserMinus size={14} /> Remove friend</button>
            <button className="subtle-button danger" onClick={() => setConfirm("block")}><Ban size={14} /> Block</button>
          </div>
        </ProfileView>
      </Modal>
      <ConfirmDialog open={confirm === "remove"} title={`Remove ${name}?`} message="You'll stop seeing each other's online status. You can send a new request later."
        confirmLabel="Remove friend" danger busy={busy === "remove"} onConfirm={doRemove} onCancel={() => setConfirm(null)} />
      <ConfirmDialog open={confirm === "block"} title={`Block ${name}?`} message="They'll be removed from your friends, can't send you requests, and won't be able to find or see your profile. They won't be told."
        confirmLabel="Block" danger busy={busy === "block"} onConfirm={doBlock} onCancel={() => setConfirm(null)} />
    </>
  );
}

/* --------------------------------------------------------------- Requests */

function Requests({ incoming, outgoing }: { incoming: FriendRow[]; outgoing: FriendRow[] }) {
  const { busy, run } = useFriendAction();
  const setTab = useUi(s => s.setFriendsTab);

  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <div className="panel friends-empty">
        <div className="empty-icon"><UserCheck size={22} /></div>
        <strong>No pending requests</strong>
        <span>Requests you send and receive show up here.</span>
        <button className="primary-button" onClick={() => setTab("add")}><UserPlus size={15} /> Add a friend</button>
      </div>
    );
  }

  return (
    <>
      {incoming.length > 0 && (
        <section className="friend-group">
          <h4>Received — {incoming.length}</h4>
          <div className="friend-list">
            {incoming.map(r => (
              <div key={r.friendship_id} className="friend-item is-static">
                <StatusAvatar row={r} />
                <span className="friend-item__text"><strong>{nameOf(r)}</strong><small>@{r.username} · {relativeTime(r.since)}</small></span>
                <div className="button-row">
                  <button className="solid-button small" disabled={busy !== null} onClick={() => void run(`a${r.friendship_id}`, () => api.respondToRequest(r.friendship_id, true), `You and ${nameOf(r)} are now friends`)}>
                    {busy === `a${r.friendship_id}` ? <span className="spinner" /> : <><Check size={14} /> Accept</>}
                  </button>
                  <button className="primary-button" disabled={busy !== null} onClick={() => void run(`d${r.friendship_id}`, () => api.respondToRequest(r.friendship_id, false))}>
                    <X size={14} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {outgoing.length > 0 && (
        <section className="friend-group">
          <h4>Sent — {outgoing.length}</h4>
          <div className="friend-list">
            {outgoing.map(r => (
              <div key={r.friendship_id} className="friend-item is-static">
                <StatusAvatar row={r} />
                <span className="friend-item__text"><strong>{nameOf(r)}</strong><small>@{r.username} · <Clock size={11} /> sent {relativeTime(r.since)}</small></span>
                <button className="primary-button" disabled={busy !== null} onClick={() => void run(`c${r.friendship_id}`, () => api.removeFriendship(r.user_id), "Request cancelled")}>
                  Cancel request
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ------------------------------------------------------------- Add friend */

function AddFriend() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { busy, run } = useFriendAction();
  const rows = useFriends(s => s.rows);
  const toast = useUi(s => s.toast);

  useEffect(() => {
    const q = query.trim().replace(/^@/, "");
    if (q.length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      api.searchUsers(q)
        .then(r => { if (!cancelled) { setResults(r); setError(null); } })
        .catch(err => { if (!cancelled) setError(friendlyError(err)); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  // Keep result buttons in sync with live changes (e.g. they accept while you're looking).
  const relationship = (r: SearchRow): Relationship => {
    const match = rows.find(x => x.user_id === r.id);
    if (match) return match.kind === "friend" ? "friends" : match.kind;
    return r.relationship === "blocked" ? "blocked" : "none";
  };

  const add = (r: SearchRow) =>
    void run(`s${r.id}`, async () => {
      const result = await api.sendRequest(r.id);
      toast(result === "accepted" ? `You and ${nameOf(r)} are now friends` : `Friend request sent to ${nameOf(r)}`, "success");
    });

  return (
    <div className="panel add-friend">
      <div className="panel-heading"><div><h3>Find friends</h3><p>Search by username or display name.</p></div></div>
      <label className="search-field large">
        <Search size={16} />
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. kenji" aria-label="Search users" maxLength={40} spellCheck={false} />
        {searching && <span className="spinner" />}
      </label>
      {error && <div className="form-error">{error}</div>}
      {results && results.length === 0 && !searching && <p className="hint">Nobody found for “{query.trim()}”. Check the spelling, or ask your friend for their username.</p>}
      {results && results.length > 0 && (
        <div className="friend-list">
          {results.map(r => {
            const rel = relationship(r);
            return (
              <div key={r.id} className="friend-item is-static">
                <StatusAvatar row={r} />
                <span className="friend-item__text"><strong>{nameOf(r)}</strong><small>@{r.username}</small></span>
                {rel === "none" && (
                  <button className="solid-button small" disabled={busy !== null} onClick={() => add(r)}>
                    {busy === `s${r.id}` ? <span className="spinner" /> : <><UserPlus size={14} /> Add friend</>}
                  </button>
                )}
                {rel === "incoming" && <button className="solid-button small" disabled={busy !== null} onClick={() => add(r)}><Check size={14} /> Accept request</button>}
                {rel === "outgoing" && <span className="pill"><Clock size={12} /> Request sent</span>}
                {rel === "friends" && <span className="pill is-good"><UserCheck size={12} /> Friends</span>}
                {rel === "blocked" && <span className="pill is-bad"><Ban size={12} /> Blocked</span>}
              </div>
            );
          })}
        </div>
      )}
      {!results && <p className="hint">Tip: your own username is on your profile. Share it with friends so they can add you.</p>}
    </div>
  );
}

/* ---------------------------------------------------------------- Blocked */

function BlockedList({ blocked }: { blocked: { user_id: string; username: string; display_name: string | null; avatar_path: string | null; profile_color: string | null; blocked_at: string }[] }) {
  const { busy, run } = useFriendAction();
  if (blocked.length === 0) {
    return (
      <div className="panel friends-empty">
        <div className="empty-icon"><ShieldOff size={22} /></div>
        <strong>Nobody blocked</strong>
        <span>If someone bothers you, open their profile and choose Block. They won't be told.</span>
      </div>
    );
  }
  return (
    <div className="friend-list">
      {blocked.map(b => (
        <div key={b.user_id} className="friend-item is-static">
          <Avatar profile={b} size={38} />
          <span className="friend-item__text"><strong>{nameOf(b)}</strong><small>@{b.username} · blocked {relativeTime(b.blocked_at)}</small></span>
          <button className="primary-button" disabled={busy !== null} onClick={() => void run(`u${b.user_id}`, () => api.unblockUser(b.user_id), `Unblocked ${nameOf(b)}`)}>
            Unblock
          </button>
        </div>
      ))}
    </div>
  );
}
