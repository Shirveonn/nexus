import { requireSupabase, supabase, supabaseConfig } from "@/lib/supabase";

/*
 * Row shapes returned by the database functions. Written by hand because the generated
 * types can't tell which returned columns may be null.
 */
export interface FriendRow {
  friendship_id: number;
  kind: "friend" | "incoming" | "outgoing";
  since: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_path: string | null;
  profile_color: string | null;
  bio: string | null;
  favorite_game: string | null;
  favorite_anime: string | null;
  joined_at: string;
  /** null unless you're friends */
  online: boolean | null;
  last_seen_at: string | null;
}

export interface BlockedRow {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_path: string | null;
  profile_color: string | null;
  blocked_at: string;
}

export type Relationship = "none" | "friends" | "outgoing" | "incoming" | "blocked";

export interface SearchRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_path: string | null;
  profile_color: string | null;
  relationship: Relationship;
}

/** Every call throws on failure; screens show friendlyError(error). */
async function rpc<T>(promise: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

export const fetchOverview = async () => ((await rpc(requireSupabase().rpc("friends_overview"))) ?? []) as unknown as FriendRow[];
export const fetchBlocked = async () => ((await rpc(requireSupabase().rpc("blocked_users"))) ?? []) as unknown as BlockedRow[];
export const searchUsers = async (query: string) => ((await rpc(requireSupabase().rpc("search_users", { query }))) ?? []) as unknown as SearchRow[];
export const sendRequest = (target: string) => rpc(requireSupabase().rpc("send_friend_request", { target })) as Promise<"sent" | "accepted">;
export const respondToRequest = (requestId: number, accept: boolean) =>
  rpc(requireSupabase().rpc("respond_friend_request", { request_id: requestId, accept }));
export const removeFriendship = (other: string) => rpc(requireSupabase().rpc("remove_friendship", { other }));
export const blockUser = (target: string) => rpc(requireSupabase().rpc("block_user", { target }));
export const unblockUser = (target: string) => rpc(requireSupabase().rpc("unblock_user", { target }));
export const heartbeat = async () => String(await rpc(requireSupabase().rpc("heartbeat")));
export const goOffline = () => rpc(requireSupabase().rpc("go_offline"));
export const setAppearOffline = (hidden: boolean) => rpc(requireSupabase().rpc("set_appear_offline", { hidden }));

export async function fetchOwnStatus(userId: string) {
  const { data, error } = await requireSupabase().from("user_status").select("appear_offline").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Marks you offline while the window is closing. Uses a keep-alive request,
 * which the browser engine finishes even after the page is gone.
 */
export async function goOfflineOnExit() {
  if (!supabase || !supabaseConfig.ok) return;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  void fetch(`${supabaseConfig.url}/rest/v1/rpc/go_offline`, {
    method: "POST",
    keepalive: true,
    headers: { apikey: supabaseConfig.key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}"
  }).catch(() => undefined);
}
