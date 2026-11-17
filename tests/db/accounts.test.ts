import { describe, expect, it } from "vitest";
import { PASSWORD, TINY_JPEG, adminClient, anonClient, createUser, latestCode, uniqueName } from "./helpers";

describe("sign-up", () => {
  it("creates a profile with the chosen username (lower-cased)", async () => {
    const name = uniqueName("Kai_");
    const { client, id } = await createUser(name);
    const { data } = await client.from("profiles").select("*").eq("id", id).single();
    expect(data).toMatchObject({ id, username: name.toLowerCase(), display_name: `Display ${name}` });
  });

  it("falls back to a generated username when the requested one is invalid", async () => {
    const { client, id } = await createUser("no spaces allowed!");
    const { data } = await client.from("profiles").select("username").eq("id", id).single();
    expect(data?.username).toMatch(/^user_[0-9a-f]{10}$/);
  });

  it("refuses a username that is already taken", async () => {
    const { username } = await createUser();
    const { error } = await anonClient().auth.signUp({
      email: `${uniqueName()}@example.test`,
      password: PASSWORD,
      options: { data: { username } }
    });
    expect(error?.message).toMatch(/database error/i);
  });

  it("reports username availability to signed-out users", async () => {
    const { username } = await createUser();
    const anon = anonClient();
    expect((await anon.rpc("username_available", { name: username })).data).toBe(false);
    expect((await anon.rpc("username_available", { name: username.toUpperCase() })).data).toBe(false);
    expect((await anon.rpc("username_available", { name: uniqueName() })).data).toBe(true);
    expect((await anon.rpc("username_available", { name: "x" })).data).toBe(false);
  });

  it("works end-to-end with a 6-digit email code", async () => {
    const email = `${uniqueName()}@example.test`;
    const anon = anonClient();
    const { data, error } = await anon.auth.signUp({ email, password: PASSWORD, options: { data: { username: uniqueName() } } });
    expect(error).toBeNull();
    expect(data.session).toBeNull(); // must confirm first

    const blocked = await anon.auth.signInWithPassword({ email, password: PASSWORD });
    expect(blocked.error?.code).toBe("email_not_confirmed");

    const verified = await anon.auth.verifyOtp({ email, token: await latestCode(email), type: "email" });
    expect(verified.error).toBeNull();
    expect(verified.data.session?.user.email).toBe(email);
  });

  it("resets a forgotten password with a code", async () => {
    const { email } = await createUser();
    const anon = anonClient();
    expect((await anon.auth.resetPasswordForEmail(email)).error).toBeNull();
    const verified = await anon.auth.verifyOtp({ email, token: await latestCode(email), type: "recovery" });
    expect(verified.error).toBeNull();
    expect((await anon.auth.updateUser({ password: "a-brand-new-password" })).error).toBeNull();
    expect((await anonClient().auth.signInWithPassword({ email, password: "a-brand-new-password" })).error).toBeNull();
  });
});

describe("profile security (Row Level Security)", () => {
  it("hides profiles from signed-out visitors", async () => {
    await createUser();
    const { data } = await anonClient().from("profiles").select("id");
    expect(data).toEqual([]);
  });

  it("lets signed-in users see each other", async () => {
    const a = await createUser();
    const b = await createUser();
    const { data } = await a.client.from("profiles").select("username").eq("id", b.id).single();
    expect(data?.username).toBe(b.username);
  });

  it("lets users edit their own profile", async () => {
    const a = await createUser();
    const { error } = await a.client.from("profiles")
      .update({ display_name: "Neo", bio: "hi", profile_color: "#42d9d0", favorite_game: "Roblox", favorite_anime: "Frieren" })
      .eq("id", a.id);
    expect(error).toBeNull();
    const { data } = await a.client.from("profiles").select("display_name, updated_at, created_at").eq("id", a.id).single();
    expect(data?.display_name).toBe("Neo");
    expect(new Date(data!.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(data!.created_at).getTime());
  });

  it("silently ignores attempts to edit someone else's profile", async () => {
    const a = await createUser();
    const b = await createUser();
    const { data } = await a.client.from("profiles").update({ display_name: "hacked" }).eq("id", b.id).select();
    expect(data).toEqual([]);
    const check = await b.client.from("profiles").select("display_name").eq("id", b.id).single();
    expect(check.data?.display_name).not.toBe("hacked");
  });

  it("blocks changes to protected columns", async () => {
    const a = await createUser();
    const { error } = await a.client.from("profiles").update({ created_at: "2000-01-01T00:00:00Z" } as never).eq("id", a.id);
    expect(error?.message).toMatch(/permission denied/i);
  });

  it.each([
    ["a bad colour", { profile_color: "red" }],
    ["a long bio", { bio: "x".repeat(161) }],
    ["an empty display name", { display_name: "" }],
    ["an uppercase username", { username: "BIGNAME" }],
    ["an avatar in someone else's folder", { avatar_path: "00000000-0000-0000-0000-000000000000/a.jpg" }]
  ])("rejects %s", async (_label, patch) => {
    const a = await createUser();
    const { error } = await a.client.from("profiles").update(patch).eq("id", a.id);
    expect(error).not.toBeNull();
  });

  it("allows one username change per 7 days", async () => {
    const a = await createUser();
    const first = await a.client.from("profiles").update({ username: uniqueName("n") }).eq("id", a.id);
    expect(first.error).toBeNull();
    const second = await a.client.from("profiles").update({ username: uniqueName("m") }).eq("id", a.id);
    expect(second.error?.message).toMatch(/once every 7 days/);
  });
});

describe("avatars (Storage)", () => {
  it("lets users upload into their own folder and anyone view it", async () => {
    const a = await createUser();
    const path = `${a.id}/avatar.jpg`;
    const up = await a.client.storage.from("avatars").upload(path, TINY_JPEG, { contentType: "image/jpeg" });
    expect(up.error).toBeNull();
    expect((await a.client.from("profiles").update({ avatar_path: path }).eq("id", a.id)).error).toBeNull();
    const url = a.client.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const res = await fetch(url);
    expect(res.status).toBe(200);
  });

  it("blocks uploads into another user's folder", async () => {
    const a = await createUser();
    const b = await createUser();
    const { error } = await a.client.storage.from("avatars").upload(`${b.id}/evil.jpg`, TINY_JPEG, { contentType: "image/jpeg" });
    expect(error).not.toBeNull();
  });

  it("blocks non-image files and files over 1 MB", async () => {
    const a = await createUser();
    const html = await a.client.storage.from("avatars").upload(`${a.id}/x.html`, new TextEncoder().encode("<script>"), { contentType: "text/html" });
    expect(html.error).not.toBeNull();
    const big = await a.client.storage.from("avatars").upload(`${a.id}/big.jpg`, new Uint8Array(1_100_000), { contentType: "image/jpeg" });
    expect(big.error).not.toBeNull();
  });

  it("blocks deleting another user's avatar", async () => {
    const a = await createUser();
    const b = await createUser();
    await b.client.storage.from("avatars").upload(`${b.id}/keep.jpg`, TINY_JPEG, { contentType: "image/jpeg" });
    await a.client.storage.from("avatars").remove([`${b.id}/keep.jpg`]);
    const list = await b.client.storage.from("avatars").list(b.id);
    expect(list.data?.map(f => f.name)).toContain("keep.jpg");
  });
});

describe("account deletion", () => {
  it("deletes the signed-in user and their profile", async () => {
    const a = await createUser();
    const other = await createUser();
    expect((await a.client.rpc("delete_own_account")).error).toBeNull();
    const { data } = await other.client.from("profiles").select("id").eq("id", a.id);
    expect(data).toEqual([]);
    const admin = await adminClient().auth.admin.getUserById(a.id);
    expect(admin.data.user).toBeNull();
  });

  it("cannot be called while signed out", async () => {
    const { error } = await anonClient().rpc("delete_own_account");
    expect(error).not.toBeNull();
  });
});

describe("reserved usernames", () => {
  it("can't be claimed at sign-up or later", async () => {
    const anon = anonClient();
    expect((await anon.rpc("username_available", { name: "Admin" })).data).toBe(false);
    const { client, id } = await createUser("nexus");
    const { data } = await client.from("profiles").select("username").eq("id", id).single();
    expect(data?.username).toMatch(/^user_/);
    expect((await client.from("profiles").update({ username: "support" }).eq("id", id)).error).not.toBeNull();
  });
});
