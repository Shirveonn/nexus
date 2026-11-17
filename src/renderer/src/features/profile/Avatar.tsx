import { useState } from "react";
import type { Profile } from "@/features/auth/authStore";
import { isHexColor } from "@/lib/color";
import { avatarUrl } from "./profileApi";

type AvatarProfile = Pick<Profile, "username" | "display_name" | "avatar_path" | "profile_color"> | null;

/** Profile picture, or initials on the user's profile color when there's no picture. */
export function Avatar({ profile, size = 31, className = "" }: { profile: AvatarProfile; size?: number; className?: string }) {
  const url = avatarUrl(profile?.avatar_path);
  const [failed, setFailed] = useState<string | null>(null);
  const name = profile?.display_name || profile?.username || "N";
  const initial = name.trim().charAt(0).toUpperCase() || "N";
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.4),
    borderRadius: Math.round(size * 0.29),
    ...(profile?.profile_color && isHexColor(profile.profile_color) ? { background: `linear-gradient(145deg, color-mix(in srgb, ${profile.profile_color} 45%, #1d2235), ${profile.profile_color})` } : {})
  };

  return (
    <div className={`avatar ${className}`} style={style} aria-hidden>
      {url && failed !== url ? <img src={url} alt="" onError={() => setFailed(url)} draggable={false} /> : initial}
    </div>
  );
}
