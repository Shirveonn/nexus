import type { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { friendlyError } from "@/features/auth/validation";
import { supabase } from "@/lib/supabase";
import { useUi } from "@/store/uiStore";
import * as api from "./friendsApi";
import type { BlockedRow, FriendRow } from "./friendsApi";

/** How often we tell the server "I'm still here". */
export const HEARTBEAT_MS = 60_000;
/** Friends whose last heartbeat is older than this are shown as offline (e.g. their PC crashed). */
export const ONLINE_WINDOW_MS = 150_000;

/** Pure helper (unit-tested): is this friend online right now? */
export function isOnline(row: Pick<FriendRow, "online" | "last_seen_at">, serverNow: number): boolean {
  if (!row.online || !row.last_seen_at) return false;
  return serverNow - new Date(row.last_seen_at).getTime() < ONLINE_WINDOW_MS;
}

/** Online first, then most recently seen, then by name. */
export function sortFriends(rows: FriendRow[], serverNow: number): FriendRow[] {
  return [...rows].sort((a, b) => {
    const onlineDiff = Number(isOnline(b, serverNow)) - Number(isOnline(a, serverNow));
    if (onlineDiff) return onlineDiff;
    const seen = (r: FriendRow) => (r.last_seen_at ? new Date(r.last_seen_at).getTime() : 0);
    if (seen(b) !== seen(a)) return seen(b) - seen(a);
    return (a.display_name || a.username).localeCompare(b.display_name || b.username);
  });
}

interface FriendsState {
  rows: FriendRow[];
  blocked: BlockedRow[];
  loaded: boolean;
  error: string | null;
  appearOffline: boolean;
  /** server clock − local clock, so "online" doesn't depend on the PC's clock */
  clockOffset: number;
  /** re-render tick so "5 min ago" labels stay fresh */
  tick: number;

  start: (userId: string) => void;
  stop: () => void;
  reload: () => Promise<void>;
  reloadBlocked: () => Promise<void>;
  setAppearOffline: (hidden: boolean) => Promise<void>;
  serverNow: () => number;
}

let channel: RealtimeChannel | null = null;
let timers: ReturnType<typeof setInterval>[] = [];
let reloadTimer: ReturnType<typeof setTimeout> | undefined;
let currentUser: string | null = null;
let onUnload: (() => void) | null = null;

export const useFriends = create<FriendsState>()((set, get) => ({
  rows: [],
  blocked: [],
  loaded: false,
  error: null,
  appearOffline: false,
  clockOffset: 0,
  tick: 0,

  serverNow: () => Date.now() + get().clockOffset,

  start: userId => {
    if (!supabase || currentUser === userId) return;
    get().stop();
    currentUser = userId;

    const beat = async () => {
      try {
        const serverTime = await api.heartbeat();
        set({ clockOffset: new Date(serverTime).getTime() - Date.now() });
      } catch { /* offline: try again next time */ }
    };

    void beat();
    void get().reload();
    void get().reloadBlocked();
    void api.fetchOwnStatus(userId).then(s => set({ appearOffline: Boolean(s?.appear_offline) })).catch(() => undefined);

    timers = [
      setInterval(() => void beat(), HEARTBEAT_MS),
      setInterval(() => set(s => ({ tick: s.tick + 1 })), 30_000)
    ];

    // Live updates. Row Level Security on the server decides which rows we receive.
    const scheduleReload = (after?: () => void) => {
      clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => void get().reload().then(after), 250);
    };
    channel = supabase
      .channel(`friends:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, payload => {
        const row = payload.new as { id?: number; requester_id?: string; addressee_id?: string; status?: string };
        scheduleReload(() => {
          const toast = useUi.getState().toast;
          const match = get().rows.find(r => r.friendship_id === row.id);
          const name = match ? match.display_name || match.username : "Someone";
          if (payload.eventType === "INSERT" && row.addressee_id === userId) toast(`${name} sent you a friend request`, "info");
          if (payload.eventType === "UPDATE" && row.status === "accepted" && row.requester_id === userId) toast(`${name} accepted your friend request`, "success");
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_status" }, payload => {
        const s = payload.new as { user_id?: string; online?: boolean; last_seen_at?: string; appear_offline?: boolean };
        if (!s.user_id) return;
        if (s.user_id === userId) {
          set({ appearOffline: Boolean(s.appear_offline) });
          return;
        }
        set(state => ({
          rows: state.rows.map(r =>
            r.user_id === s.user_id && r.kind === "friend"
              ? { ...r, online: Boolean(s.online), last_seen_at: s.appear_offline ? r.last_seen_at : (s.last_seen_at ?? r.last_seen_at) }
              : r
          )
        }));
      })
      .subscribe();

    onUnload = () => void api.goOfflineOnExit();
    window.addEventListener("beforeunload", onUnload);
  },

  stop: () => {
    timers.forEach(clearInterval);
    timers = [];
    clearTimeout(reloadTimer);
    if (channel && supabase) void supabase.removeChannel(channel);
    channel = null;
    if (onUnload) window.removeEventListener("beforeunload", onUnload);
    onUnload = null;
    currentUser = null;
    set({ rows: [], blocked: [], loaded: false, error: null, appearOffline: false });
  },

  reload: async () => {
    try {
      const rows = await api.fetchOverview();
      if (currentUser) set({ rows, loaded: true, error: null });
    } catch (err) {
      set({ error: friendlyError(err), loaded: true });
    }
  },

  reloadBlocked: async () => {
    try {
      const blocked = await api.fetchBlocked();
      if (currentUser) set({ blocked });
    } catch { /* shown on the Blocked tab as empty */ }
  },

  setAppearOffline: async hidden => {
    const previous = get().appearOffline;
    set({ appearOffline: hidden });
    try {
      await api.setAppearOffline(hidden);
    } catch (err) {
      set({ appearOffline: previous });
      throw err;
    }
  }
}));

/** Selectors */
export const selectFriends = (s: FriendsState) => s.rows.filter(r => r.kind === "friend");
export const selectIncoming = (s: FriendsState) => s.rows.filter(r => r.kind === "incoming");
export const selectOutgoing = (s: FriendsState) => s.rows.filter(r => r.kind === "outgoing");

/**
 * Hooks for the lists. `useShallow` makes React re-render only when the list
 * actually changes (filtering creates a new array every time).
 */
export const useFriendList = () => useFriends(useShallow(selectFriends));
export const useIncoming = () => useFriends(useShallow(selectIncoming));
export const useOutgoing = () => useFriends(useShallow(selectOutgoing));
