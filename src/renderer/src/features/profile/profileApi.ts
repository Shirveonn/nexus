import { requireSupabase, supabase } from "@/lib/supabase";
import { squareImage } from "@/lib/files";
import { useAuth, type Profile, type ProfileUpdate } from "@/features/auth/authStore";

const BUCKET = "avatars";

/** Public URL for an avatar stored in Supabase Storage. */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path || !supabase) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function updateProfile(patch: ProfileUpdate): Promise<Profile> {
  const user = useAuth.getState().user;
  if (!user) throw new Error("Not signed in.");
  const { data, error } = await requireSupabase().from("profiles").update(patch).eq("id", user.id).select("*").single();
  if (error) throw error;
  useAuth.getState().setProfile(data);
  return data;
}

/** Crops to a 256×256 square, uploads it, points the profile at it and removes the old file. */
export async function uploadAvatar(file: File): Promise<Profile> {
  const { user, profile } = useAuth.getState();
  if (!user) throw new Error("Not signed in.");
  const blob = await squareImage(file, 256);
  const path = `${user.id}/${Date.now()}.jpg`;
  const storage = requireSupabase().storage.from(BUCKET);
  const { error } = await storage.upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
  if (error) throw error;
  try {
    const updated = await updateProfile({ avatar_path: path });
    if (profile?.avatar_path) await storage.remove([profile.avatar_path]);
    return updated;
  } catch (err) {
    await storage.remove([path]);
    throw err;
  }
}

export async function removeAvatar(): Promise<Profile> {
  const old = useAuth.getState().profile?.avatar_path;
  const updated = await updateProfile({ avatar_path: null });
  if (old) await requireSupabase().storage.from(BUCKET).remove([old]);
  return updated;
}

/** Permanently deletes the signed-in user's avatar files, profile and account. */
export async function deleteAccount() {
  const supabase = requireSupabase();
  const user = useAuth.getState().user;
  if (!user) throw new Error("Not signed in.");
  const { data: files } = await supabase.storage.from(BUCKET).list(user.id);
  if (files?.length) await supabase.storage.from(BUCKET).remove(files.map(f => `${user.id}/${f.name}`));
  const { error } = await supabase.rpc("delete_own_account");
  if (error) throw error;
  await supabase.auth.signOut({ scope: "local" });
}
