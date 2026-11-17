/** Input rules for accounts and profiles. These mirror the database constraints. */

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const PASSWORD_MIN = 8;
export const LIMITS = { displayName: 32, bio: 160, favorite: 60 } as const;

/** Keep in sync with public.is_reserved_username() in the migration. */
export const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "nexus", "support", "moderator", "mod", "staff",
  "system", "root", "null", "undefined", "me", "settings", "help", "official"
]);

export const normalizeUsername = (value: string) => value.trim().toLowerCase();

/** Returns an error message, or null when valid. */
export function validateUsername(value: string): string | null {
  const name = normalizeUsername(value);
  if (name.length < 3) return "Usernames need at least 3 characters.";
  if (name.length > 20) return "Usernames can be at most 20 characters.";
  if (!USERNAME_PATTERN.test(name)) return "Use only letters, numbers and underscores.";
  if (RESERVED_USERNAMES.has(name)) return "That username is reserved.";
  return null;
}

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "That doesn't look like an email address.";
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (value.length > 72) return "Passwords can be at most 72 characters.";
  if (/^(.)\1+$/.test(value)) return "That password is too easy to guess.";
  return null;
}

export function validateDisplayName(value: string): string | null {
  const name = value.trim();
  if (!name) return "Enter a display name.";
  if (name.length > LIMITS.displayName) return `At most ${LIMITS.displayName} characters.`;
  return null;
}

export function validateCode(value: string): string | null {
  return /^\d{6,10}$/.test(value.trim()) ? null : "Enter the code from your email.";
}

/** Rough strength meter 0–4 for the sign-up form. */
export function passwordStrength(value: string): 0 | 1 | 2 | 3 | 4 {
  if (!value) return 0;
  let score = 0;
  if (value.length >= PASSWORD_MIN) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value) && /[^a-zA-Z0-9]/.test(value)) score++;
  return Math.min(4, Math.max(1, score)) as 1 | 2 | 3 | 4;
}

interface ErrorLike {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
}

/** Turns Supabase/Postgres errors into short, friendly messages. */
export function friendlyError(error: unknown): string {
  if (!error) return "Something went wrong.";
  const e = error as ErrorLike;
  const message = e.message ?? String(error);
  const code = e.code ?? "";

  if (e.name === "AuthRetryableFetchError" || /failed to fetch|fetch failed|network/i.test(message)) {
    return "Can't reach the NEXUS server. Check your internet connection.";
  }
  switch (code) {
    case "invalid_credentials": return "Wrong email or password.";
    case "email_not_confirmed": return "Confirm your email first. We've sent you a code.";
    case "user_already_exists":
    case "email_exists": return "An account with this email already exists.";
    case "weak_password": return `That password is too weak. Use at least ${PASSWORD_MIN} characters.`;
    case "same_password": return "Your new password must be different from the old one.";
    case "otp_expired": return "That code is wrong or has expired. Request a new one.";
    case "over_email_send_rate_limit": return "Too many emails sent. Wait a few minutes and try again.";
    case "over_request_rate_limit": return "Too many attempts. Wait a minute and try again.";
    case "signup_disabled": return "New sign-ups are turned off for this NEXUS server.";
    case "email_address_invalid": return "That email address can't be used.";
    case "23505": return "That username is already taken.";
    case "23514": return "Some of that information isn't allowed. Check the fields and try again.";
  }
  if (/database error saving new user/i.test(message)) return "That username was just taken. Pick another one.";
  if (/once every 7 days/i.test(message)) return "You can only change your username once every 7 days.";
  if (/payload too large|maximum allowed size/i.test(message)) return "That image is too large.";
  return message;
}
