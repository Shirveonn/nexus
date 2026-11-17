import { execSync } from "node:child_process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Connection details for the LOCAL Supabase started with `npm run db:start`.
 * Read from `supabase status` so no keys are stored in the repo
 * (override with SUPABASE_TEST_URL / SUPABASE_TEST_PUBLISHABLE_KEY / SUPABASE_TEST_SECRET_KEY).
 */
function localStatus(): Record<string, string> {
  try {
    const out = execSync("npx supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return JSON.parse(out.slice(out.indexOf("{"))) as Record<string, string>;
  } catch {
    throw new Error("Local Supabase isn't running. Start it with `npm run db:start` (needs Docker).");
  }
}
const status = process.env.SUPABASE_TEST_SECRET_KEY ? {} : localStatus();

export const LOCAL_URL = process.env.SUPABASE_TEST_URL ?? status.API_URL;
export const LOCAL_PUBLISHABLE_KEY = process.env.SUPABASE_TEST_PUBLISHABLE_KEY ?? status.PUBLISHABLE_KEY;
const LOCAL_SECRET_KEY = process.env.SUPABASE_TEST_SECRET_KEY ?? status.SECRET_KEY;
const MAILPIT_URL = process.env.MAILPIT_URL ?? status.MAILPIT_URL ?? "http://127.0.0.1:54324";

if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(LOCAL_URL)) {
  throw new Error("Database tests only run against a LOCAL Supabase. They create and delete users.");
}

export type Client = SupabaseClient<Database>;

const options = { auth: { persistSession: false, autoRefreshToken: false } };

export const anonClient = (): Client => createClient<Database>(LOCAL_URL, LOCAL_PUBLISHABLE_KEY, options);
export const adminClient = (): Client => createClient<Database>(LOCAL_URL, LOCAL_SECRET_KEY, options);

let counter = 0;
export function uniqueName(prefix = "t"): string {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter}`.toLowerCase().slice(0, 20);
}

export const PASSWORD = "correct-horse-battery";

/** Creates a confirmed user through the admin API and returns a client signed in as them. */
export async function createUser(username = uniqueName()) {
  const email = `${uniqueName("u")}@example.test`;
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { username, display_name: `Display ${username}` }
  });
  if (error) throw error;
  const client = anonClient();
  const signIn = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signIn.error) throw signIn.error;
  return { client, id: data.user.id, email, username };
}

/** Reads the newest 6-digit code sent to `email` from the local Mailpit inbox. */
export async function latestCode(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
    const body = (await res.json()) as { messages: { ID: string; To: { Address: string }[] }[] };
    // Search matches substrings (a@x.test also matches new.a@x.test), so keep exact recipients only.
    const mine = (body.messages ?? []).filter(m => m.To.some(t => t.Address.toLowerCase() === email.toLowerCase()));
    if (mine.length) {
      const msg = await (await fetch(`${MAILPIT_URL}/api/v1/message/${mine[0].ID}`)).json() as { HTML: string; Text: string };
      const match = /(\d{6,10})/.exec(msg.Text || msg.HTML.replace(/<[^>]+>/g, " "));
      if (match) return match[1];
    }
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`No email arrived for ${email}`);
}

/** A tiny valid JPEG (1×1 px). */
export const TINY_JPEG = Uint8Array.from(atob(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
), c => c.charCodeAt(0));
