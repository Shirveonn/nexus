/**
 * Checks the Supabase settings baked into the app at build time.
 * Kept separate from the client so it can be unit-tested.
 */

export type ConfigCheck =
  | { ok: true; url: string; key: string }
  | { ok: false; reason: "missing" | "bad-url" | "secret-key"; message: string };

function decodeJwtRole(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function checkSupabaseConfig(rawUrl: string | undefined, rawKey: string | undefined): ConfigCheck {
  const url = rawUrl?.trim() ?? "";
  const key = rawKey?.trim() ?? "";
  if (!url || !key) {
    return { ok: false, reason: "missing", message: "Online accounts aren't set up in this build yet." };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: "bad-url", message: "The Supabase URL in .env isn't a valid web address." };
  }
  const isLocal = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  if (parsed.protocol !== "https:" && !(isLocal && parsed.protocol === "http:")) {
    return { ok: false, reason: "bad-url", message: "The Supabase URL must start with https://" };
  }

  // A secret/service-role key bypasses all security rules and must never ship inside the app.
  if (key.startsWith("sb_secret_") || decodeJwtRole(key) === "service_role") {
    return {
      ok: false,
      reason: "secret-key",
      message: "This build contains a Supabase SECRET key. Replace it with the publishable (anon) key and rotate the secret key in Supabase now."
    };
  }

  return { ok: true, url: url.replace(/\/+$/, ""), key };
}
