import { useMemo, type ReactNode } from "react";
import { CalendarDays, Clapperboard, Gamepad2 } from "lucide-react";
import { profileName } from "@/features/auth/authStore";
import { isHexColor } from "@/lib/color";
import { Avatar } from "./Avatar";

export interface ProfileLike {
  username: string;
  display_name: string | null;
  avatar_path: string | null;
  profile_color: string | null;
  bio: string | null;
  favorite_game: string | null;
  favorite_anime: string | null;
  created_at: string;
}

/** The profile card used for your own profile and for friends' profiles. */
export function ProfileView({ profile, avatarOverlay, status, facts, children, className = "" }: {
  profile: ProfileLike;
  /** e.g. the "change picture" button on your own profile */
  avatarOverlay?: ReactNode;
  /** e.g. an online dot */
  status?: ReactNode;
  facts?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const color = profile.profile_color && isHexColor(profile.profile_color) ? profile.profile_color : null;
  const joined = useMemo(() => new Date(profile.created_at).toLocaleDateString([], { month: "long", year: "numeric" }), [profile.created_at]);

  return (
    <section className={`panel profile-card ${className}`} style={color ? ({ "--profile-color": color } as React.CSSProperties) : undefined}>
      <div className="profile-card__banner" />
      <div className="profile-card__avatar">
        <Avatar profile={profile} size={96} />
        {status}
        {avatarOverlay}
      </div>
      <div className="profile-card__body">
        <h2>{profileName(profile)}</h2>
        <div className="profile-card__username">@{profile.username}</div>
        {profile.bio ? <p className="profile-card__bio">{profile.bio}</p> : <p className="profile-card__bio muted">No bio yet.</p>}
        <div className="profile-card__facts">
          {profile.favorite_game && <span><Gamepad2 size={13} /> {profile.favorite_game}</span>}
          {profile.favorite_anime && <span><Clapperboard size={13} /> {profile.favorite_anime}</span>}
          <span><CalendarDays size={13} /> Joined {joined}</span>
          {facts}
        </div>
        {children}
      </div>
    </section>
  );
}
