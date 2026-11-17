import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase, supabaseConfig } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type AuthStatus =
  | "unconfigured" // no Supabase settings in this build: guest-only
  | "loading"
  | "signedOut"
  | "signedIn";

const GUEST_KEY = "nexus-guest";
const readGuest = () => {
  try { return localStorage.getItem(GUEST_KEY) === "1"; } catch { return false; }
};
const writeGuest = (value: boolean) => {
  try { value ? localStorage.setItem(GUEST_KEY, "1") : localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
};

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileError: string | null;
  /** The user chose "Continue as guest" on the sign-in screen. */
  guest: boolean;
  /** Signed in with a recovery code but hasn't picked a new password yet. */
  pendingPasswordReset: boolean;

  init: () => () => void;
  loadProfile: () => Promise<void>;
  setProfile: (profile: Profile) => void;
  continueAsGuest: () => void;
  openSignIn: () => void;
  setPendingPasswordReset: (pending: boolean) => void;
  signOut: (scope?: "local" | "global") => Promise<void>;
}

let initialized = false;

export const useAuth = create<AuthState>()((set, get) => ({
  status: supabaseConfig.ok ? "loading" : "unconfigured",
  session: null,
  user: null,
  profile: null,
  profileError: null,
  guest: readGuest(),
  pendingPasswordReset: false,

  init: () => {
    if (!supabase || initialized) return () => {};
    initialized = true;

    const applySession = (session: Session | null) => {
      const previousUser = get().user?.id;
      set({
        session,
        user: session?.user ?? null,
        status: session ? "signedIn" : "signedOut",
        ...(session ? {} : { profile: null, profileError: null, pendingPasswordReset: false })
      });
      if (session && session.user.id !== previousUser) {
        // Don't call Supabase inside the auth callback itself (it can deadlock); defer it.
        setTimeout(() => void get().loadProfile(), 0);
      }
    };

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => applySession(session));
    return () => {
      data.subscription.unsubscribe();
      initialized = false;
    };
  },

  loadProfile: async () => {
    const user = get().user;
    if (!supabase || !user) return;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) set({ profileError: error.message });
    else if (!data) set({ profileError: "Your profile couldn't be found." });
    else set({ profile: data, profileError: null });
  },

  setProfile: profile => set({ profile }),

  continueAsGuest: () => {
    writeGuest(true);
    set({ guest: true });
  },

  openSignIn: () => {
    writeGuest(false);
    set({ guest: false });
  },

  setPendingPasswordReset: pendingPasswordReset => set({ pendingPasswordReset }),

  signOut: async (scope = "local") => {
    if (!supabase) return;
    writeGuest(false);
    set({ guest: false });
    const { error } = await supabase.auth.signOut({ scope });
    // Even if the server call fails (e.g. offline), make sure we're signed out locally.
    if (error) await supabase.auth.signOut({ scope: "local" });
  }
}));

/** Display helpers */
export function profileName(profile: Pick<Profile, "display_name" | "username"> | null): string {
  return profile?.display_name || profile?.username || "Guest";
}
