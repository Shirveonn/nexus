import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { checkSupabaseConfig } from "./supabaseConfig";

export type NexusClient = SupabaseClient<Database>;

export const supabaseConfig = checkSupabaseConfig(
  import.meta.env.RENDERER_VITE_SUPABASE_URL,
  import.meta.env.RENDERER_VITE_SUPABASE_PUBLISHABLE_KEY
);

/** `null` when accounts aren't configured; the app then runs in guest-only mode. */
export const supabase: NexusClient | null = supabaseConfig.ok
  ? createClient<Database>(supabaseConfig.url, supabaseConfig.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // desktop app: no redirects, we use 6-digit codes
        storageKey: "nexus-auth"
      }
    })
  : null;

if (!supabaseConfig.ok && supabaseConfig.reason !== "missing") {
  console.error(`[NEXUS] ${supabaseConfig.message}`);
}

export function requireSupabase(): NexusClient {
  if (!supabase) throw new Error("Online accounts aren't set up in this build.");
  return supabase;
}
