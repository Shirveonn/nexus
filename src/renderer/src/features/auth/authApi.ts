import { requireSupabase } from "@/lib/supabase";
import { useAuth } from "./authStore";
import { normalizeUsername } from "./validation";

/**
 * All account actions. Each one throws on failure; screens show
 * `friendlyError(error)` to the user.
 */

export async function signIn(email: string, password: string) {
  const { error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

/** Returns true when the account is ready immediately (email confirmation turned off). */
export async function signUp(input: { email: string; password: string; username: string; displayName: string }): Promise<boolean> {
  const { data, error } = await requireSupabase().auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: { data: { username: normalizeUsername(input.username), display_name: input.displayName.trim() } }
  });
  if (error) throw error;
  return Boolean(data.session);
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await requireSupabase().rpc("username_available", { name: normalizeUsername(username) });
  if (error) throw error;
  return data === true;
}

export async function verifySignupCode(email: string, code: string) {
  const { error } = await requireSupabase().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
  if (error) throw error;
}

export async function resendSignupCode(email: string) {
  const { error } = await requireSupabase().auth.resend({ type: "signup", email: email.trim() });
  if (error) throw error;
}

export async function sendPasswordResetCode(email: string) {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim());
  if (error) throw error;
}

/** Signs in with the recovery code; the user must then choose a new password. */
export async function verifyResetCode(email: string, code: string) {
  useAuth.getState().setPendingPasswordReset(true);
  const { error } = await requireSupabase().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "recovery" });
  if (error) {
    useAuth.getState().setPendingPasswordReset(false);
    throw error;
  }
}

export async function setNewPassword(password: string) {
  const { error } = await requireSupabase().auth.updateUser({ password });
  if (error) throw error;
  useAuth.getState().setPendingPasswordReset(false);
}

/** Re-checks the current password before changing it, so an unlocked PC isn't enough to take over an account. */
export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = requireSupabase();
  const email = useAuth.getState().user?.email;
  if (!email) throw new Error("Not signed in.");
  const check = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (check.error) throw check.error.code === "invalid_credentials" ? new Error("Your current password is wrong.") : check.error;
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function requestEmailChange(newEmail: string) {
  const { error } = await requireSupabase().auth.updateUser({ email: newEmail.trim() });
  if (error) throw error;
}

/**
 * Confirms an email change. With "secure email change" on (the Supabase default), codes are
 * sent to BOTH addresses and both must be entered. Returns true once the change is complete.
 */
export async function confirmEmailChange(email: string, code: string, newEmail: string): Promise<boolean> {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email_change" });
  if (error) throw error;
  const { data } = await supabase.auth.getUser();
  return data.user?.email?.toLowerCase() === newEmail.trim().toLowerCase();
}
