import { describe, expect, it } from "vitest";
import { createUser } from "./helpers";

type User = Awaited<ReturnType<typeof createUser>>;

async function befriend(a: User, b: User) {
  expect((await a.client.rpc("send_friend_request", { target: b.id })).data).toBe("sent");
  const { data } = await b.client.rpc("friends_overview");
  const req = data!.find(r => r.user_id === a.id)!;
  expect((await b.client.rpc("respond_friend_request", { request_id: req.friendship_id, accept: true })).error).toBeNull();
}

const overview = async (u: User) => (await u.client.rpc("friends_overview")).data ?? [];

describe("friend requests", () => {
  it("send → shows as outgoing/incoming → accept → friends", async () => {
    const a = await createUser();
    const b = await createUser();
    expect((await a.client.rpc("send_friend_request", { target: b.id })).data).toBe("sent");
    expect((await overview(a)).map(r => [r.kind, r.username])).toEqual([["outgoing", b.username]]);
    const incoming = (await overview(b))[0];
    expect(incoming).toMatchObject({ kind: "incoming", username: a.username, online: null, last_seen_at: null });

    await b.client.rpc("respond_friend_request", { request_id: incoming.friendship_id, accept: true });
    expect((await overview(a))[0].kind).toBe("friend");
    expect((await overview(b))[0].kind).toBe("friend");
  });

  it("decline removes the request", async () => {
    const a = await createUser();
    const b = await createUser();
    await a.client.rpc("send_friend_request", { target: b.id });
    const req = (await overview(b))[0];
    await b.client.rpc("respond_friend_request", { request_id: req.friendship_id, accept: false });
    expect(await overview(a)).toEqual([]);
    expect(await overview(b)).toEqual([]);
  });

  it("only the receiver can accept", async () => {
    const a = await createUser();
    const b = await createUser();
    const c = await createUser();
    await a.client.rpc("send_friend_request", { target: b.id });
    const req = (await overview(a))[0];
    expect((await a.client.rpc("respond_friend_request", { request_id: req.friendship_id, accept: true })).error?.message).toMatch(/no longer exists/);
    expect((await c.client.rpc("respond_friend_request", { request_id: req.friendship_id, accept: true })).error).not.toBeNull();
    expect((await overview(b))[0].kind).toBe("incoming");
  });

  it("a request back to someone who asked first accepts it", async () => {
    const a = await createUser();
    const b = await createUser();
    await a.client.rpc("send_friend_request", { target: b.id });
    expect((await b.client.rpc("send_friend_request", { target: a.id })).data).toBe("accepted");
    expect((await overview(a))[0].kind).toBe("friend");
  });

  it("rejects duplicates, self-requests and unknown users", async () => {
    const a = await createUser();
    const b = await createUser();
    await a.client.rpc("send_friend_request", { target: b.id });
    expect((await a.client.rpc("send_friend_request", { target: b.id })).error?.message).toMatch(/already sent/);
    expect((await a.client.rpc("send_friend_request", { target: a.id })).error?.message).toMatch(/yourself/);
    expect((await a.client.rpc("send_friend_request", { target: "00000000-0000-0000-0000-000000000000" })).error?.message).toMatch(/doesn't exist/);
  });

  it("cancel and unfriend both remove the relationship", async () => {
    const a = await createUser();
    const b = await createUser();
    await a.client.rpc("send_friend_request", { target: b.id });
    await a.client.rpc("remove_friendship", { other: b.id });
    expect(await overview(b)).toEqual([]);
    await befriend(a, b);
    await b.client.rpc("remove_friendship", { other: a.id });
    expect(await overview(a)).toEqual([]);
  });

  it("can't be written directly, only through the functions", async () => {
    const a = await createUser();
    const b = await createUser();
    const insert = await a.client.from("friendships").insert({ requester_id: a.id, addressee_id: b.id, status: "accepted" });
    expect(insert.error).not.toBeNull();
    await a.client.rpc("send_friend_request", { target: b.id });
    const update = await a.client.from("friendships").update({ status: "accepted" }).eq("requester_id", a.id).select();
    expect(update.data ?? []).toEqual([]);
    expect((await overview(b))[0].kind).toBe("incoming");
  });

  it("is private to the two people involved", async () => {
    const a = await createUser();
    const b = await createUser();
    const c = await createUser();
    await befriend(a, b);
    expect((await c.client.from("friendships").select("*")).data).toEqual([]);
    expect(await overview(c)).toEqual([]);
  });
});

describe("search", () => {
  it("finds people by username prefix or display name and shows the relationship", async () => {
    const a = await createUser();
    const b = await createUser();
    await a.client.rpc("send_friend_request", { target: b.id });
    const { data } = await a.client.rpc("search_users", { query: b.username.slice(0, 6) });
    expect(data?.find(r => r.id === b.id)?.relationship).toBe("outgoing");
    const back = await b.client.rpc("search_users", { query: `display ${a.username}` });
    expect(back.data?.[0]).toMatchObject({ id: a.id, relationship: "incoming" });
  });

  it("never returns yourself, and treats % and _ literally", async () => {
    const a = await createUser();
    const self = await a.client.rpc("search_users", { query: a.username });
    expect(self.data?.some(r => r.id === a.id)).toBe(false);
    expect((await a.client.rpc("search_users", { query: "%%" })).data).toEqual([]);
    expect((await a.client.rpc("search_users", { query: "a" })).data).toEqual([]);
  });
});

describe("blocking", () => {
  it("removes the friendship and stops new requests both ways", async () => {
    const a = await createUser();
    const b = await createUser();
    await befriend(a, b);
    await a.client.rpc("block_user", { target: b.id });
    expect(await overview(a)).toEqual([]);
    expect((await b.client.rpc("send_friend_request", { target: a.id })).error?.message).toMatch(/can't send/);
    expect((await a.client.rpc("send_friend_request", { target: b.id })).error?.message).toMatch(/can't send/);
  });

  it("hides each other's profiles and search results", async () => {
    const a = await createUser();
    const b = await createUser();
    await a.client.rpc("block_user", { target: b.id });
    expect((await b.client.from("profiles").select("id").eq("id", a.id)).data).toEqual([]);
    expect((await b.client.rpc("search_users", { query: a.username })).data).toEqual([]);
    const fromBlocker = await a.client.rpc("search_users", { query: b.username });
    expect(fromBlocker.data?.[0]?.relationship).toBe("blocked");
  });

  it("only the blocker sees the block, and can undo it", async () => {
    const a = await createUser();
    const b = await createUser();
    await a.client.rpc("block_user", { target: b.id });
    expect((await a.client.rpc("blocked_users")).data?.map(r => r.user_id)).toEqual([b.id]);
    expect((await b.client.from("blocks").select("*")).data).toEqual([]);
    await a.client.rpc("unblock_user", { target: b.id });
    expect((await b.client.from("profiles").select("id").eq("id", a.id)).data).toHaveLength(1);
  });
});

describe("online status", () => {
  it("friends see it, strangers don't", async () => {
    const a = await createUser();
    const b = await createUser();
    const c = await createUser();
    await befriend(a, b);
    await b.client.rpc("heartbeat");
    const row = (await overview(a))[0];
    expect(row.online).toBe(true);
    expect(row.last_seen_at).not.toBeNull();
    expect((await c.client.from("user_status").select("*").eq("user_id", b.id)).data).toEqual([]);
    expect((await a.client.from("user_status").select("online").eq("user_id", b.id)).data).toEqual([{ online: true }]);
  });

  it("go_offline and appear-offline hide you", async () => {
    const a = await createUser();
    const b = await createUser();
    await befriend(a, b);
    await b.client.rpc("heartbeat");
    await b.client.rpc("go_offline");
    expect((await overview(a))[0].online).toBe(false);

    await b.client.rpc("set_appear_offline", { hidden: true });
    await b.client.rpc("heartbeat");
    expect((await overview(a))[0].online).toBe(false);
    await b.client.rpc("set_appear_offline", { hidden: false });
    expect((await overview(a))[0].online).toBe(true);
  });

  it("can't be faked by writing the table directly", async () => {
    const a = await createUser();
    const res = await a.client.from("user_status").upsert({ user_id: a.id, online: true, last_seen_at: "2099-01-01T00:00:00Z" });
    expect(res.error).not.toBeNull();
  });

  it("pushes live updates to friends through Realtime", { timeout: 20000 }, async () => {
    const a = await createUser();
    const b = await createUser();
    await befriend(a, b);
    await b.client.rpc("heartbeat");

    // Realtime takes a moment to start streaming after SUBSCRIBED, so keep nudging until the event lands.
    let nudger: ReturnType<typeof setInterval> | undefined;
    const received = new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("no realtime event")), 15000);
      const channel = a.client.channel(`test-${a.id}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "user_status" }, payload => {
          if ((payload.new as { online?: boolean }).online !== false) return;
          clearTimeout(timer);
          clearInterval(nudger);
          resolve(payload.new);
          void a.client.removeChannel(channel);
        })
        .subscribe(status => {
          if (status === "SUBSCRIBED") {
            nudger = setInterval(() => void b.client.rpc("heartbeat").then(() => b.client.rpc("go_offline")), 1000);
          }
        });
    });
    expect(await received).toMatchObject({ user_id: b.id, online: false });
  });
});
