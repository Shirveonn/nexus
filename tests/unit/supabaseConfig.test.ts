import { describe, expect, it } from "vitest";
import { checkSupabaseConfig } from "@/lib/supabaseConfig";

const jwt = (role: string) => `x.${btoa(JSON.stringify({ role })).replace(/=+$/, "")}.y`;

describe("checkSupabaseConfig", () => {
  it("is 'missing' when nothing is set", () => {
    expect(checkSupabaseConfig(undefined, undefined)).toMatchObject({ ok: false, reason: "missing" });
    expect(checkSupabaseConfig("https://a.supabase.co", "")).toMatchObject({ ok: false, reason: "missing" });
  });
  it("accepts https and local http", () => {
    expect(checkSupabaseConfig("https://abc.supabase.co/", "sb_publishable_123")).toEqual({ ok: true, url: "https://abc.supabase.co", key: "sb_publishable_123" });
    expect(checkSupabaseConfig("http://127.0.0.1:54321", jwt("anon")).ok).toBe(true);
  });
  it("rejects plain http to remote servers and junk URLs", () => {
    expect(checkSupabaseConfig("http://abc.supabase.co", "sb_publishable_1")).toMatchObject({ ok: false, reason: "bad-url" });
    expect(checkSupabaseConfig("not a url", "sb_publishable_1")).toMatchObject({ ok: false, reason: "bad-url" });
  });
  it("refuses secret / service-role keys", () => {
    expect(checkSupabaseConfig("https://abc.supabase.co", "sb_secret_abc")).toMatchObject({ ok: false, reason: "secret-key" });
    expect(checkSupabaseConfig("https://abc.supabase.co", jwt("service_role"))).toMatchObject({ ok: false, reason: "secret-key" });
  });
});
