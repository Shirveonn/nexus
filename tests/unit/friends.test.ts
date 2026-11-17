import { describe, expect, it } from "vitest";
import type { FriendRow } from "@/features/friends/friendsApi";
import { ONLINE_WINDOW_MS, isOnline, sortFriends } from "@/features/friends/friendsStore";
import { relativeTime } from "@/lib/time";

const NOW = Date.parse("2026-11-17T12:00:00Z");
const row = (username: string, online: boolean | null, secondsAgo: number | null, display_name: string | null = null): FriendRow => ({
  friendship_id: 1, kind: "friend", since: "2026-01-01T00:00:00Z", user_id: username, username, display_name,
  avatar_path: null, profile_color: null, bio: null, favorite_game: null, favorite_anime: null, joined_at: "2026-01-01T00:00:00Z",
  online, last_seen_at: secondsAgo === null ? null : new Date(NOW - secondsAgo * 1000).toISOString()
});

describe("isOnline", () => {
  it("needs the online flag AND a recent heartbeat", () => {
    expect(isOnline(row("a", true, 30), NOW)).toBe(true);
    expect(isOnline(row("a", false, 30), NOW)).toBe(false);
    expect(isOnline(row("a", true, ONLINE_WINDOW_MS / 1000 + 1), NOW)).toBe(false); // crashed / no heartbeat
    expect(isOnline(row("a", null, null), NOW)).toBe(false);
  });
});

describe("sortFriends", () => {
  it("puts online friends first, then most recently seen, then by name", () => {
    const sorted = sortFriends([row("zed", false, 9000), row("amy", true, 10), row("bob", false, 60), row("cat", null, null), row("abe", null, null)], NOW);
    expect(sorted.map(r => r.username)).toEqual(["amy", "bob", "zed", "abe", "cat"]);
  });
});

describe("relativeTime", () => {
  it.each([
    [10, "just now"], [5 * 60, "5 min ago"], [3 * 3600, "3 h ago"], [26 * 3600, "yesterday"], [4 * 86400, "4 days ago"]
  ])("%i seconds → %s", (seconds, text) => {
    expect(relativeTime(NOW - seconds * 1000, NOW)).toBe(text);
  });
  it("shows a date for older times and handles junk", () => {
    expect(relativeTime(NOW - 30 * 86400 * 1000, NOW)).toMatch(/Oct/);
    expect(relativeTime("nope", NOW)).toBe("");
  });
});
