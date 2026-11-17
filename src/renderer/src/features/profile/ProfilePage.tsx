import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Camera, Clapperboard, Gamepad2, LogIn, Sparkles, Trash2, UserRound } from "lucide-react";
import { Field, FormError, SubmitButton } from "@/components/ui/Field";
import { Panel } from "@/components/ui/controls";
import { isUsernameAvailable } from "@/features/auth/authApi";
import { profileName, useAuth, type Profile } from "@/features/auth/authStore";
import { LIMITS, friendlyError, normalizeUsername, validateDisplayName, validateUsername } from "@/features/auth/validation";
import { isHexColor } from "@/lib/color";
import { pickFile } from "@/lib/files";
import { useUi } from "@/store/uiStore";
import { accentPresets } from "@/theme/palettes";
import { Avatar } from "./Avatar";
import { removeAvatar, updateProfile, uploadAvatar } from "./profileApi";

export function ProfilePage() {
  const status = useAuth(s => s.status);
  const profile = useAuth(s => s.profile);
  const profileError = useAuth(s => s.profileError);
  const loadProfile = useAuth(s => s.loadProfile);

  if (status !== "signedIn") return <SignedOutProfile />;

  return (
    <div className="page-content profile-page">
      <div className="eyebrow"><UserRound size={13} /> YOUR PROFILE</div>
      {profile ? (
        <div className="profile-layout">
          <ProfileCard profile={profile} />
          <EditProfileForm key={profile.updated_at} profile={profile} />
        </div>
      ) : profileError ? (
        <Panel title="Couldn't load your profile" description={profileError}>
          <button className="primary-button" onClick={() => void loadProfile()}>Try again</button>
        </Panel>
      ) : (
        <div className="panel profile-loading"><span className="spinner" /> Loading your profile…</div>
      )}
    </div>
  );
}

function SignedOutProfile() {
  const status = useAuth(s => s.status);
  const openSignIn = useAuth(s => s.openSignIn);
  const navigate = useUi(s => s.navigate);
  return (
    <div className="page-content placeholder-page">
      <div className="eyebrow"><Sparkles size={13} /> PROFILE</div>
      <h1>Your profile<span>.</span></h1>
      <section className="panel module-placeholder">
        <div className="empty-icon"><UserRound size={22} /></div>
        {status === "unconfigured" ? (
          <>
            <h3>Accounts aren't set up yet</h3>
            <p>This build of NEXUS isn't connected to a server. See Settings → Account for how to set it up.</p>
            <button className="primary-button" onClick={() => navigate("Settings", "account")}>Open account settings</button>
          </>
        ) : (
          <>
            <h3>You're browsing as a guest</h3>
            <p>Create a free account to get a profile, a username and (soon) friends.</p>
            <button className="primary-button" onClick={openSignIn}><LogIn size={15} /> Sign in or create account</button>
          </>
        )}
      </section>
    </div>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  const toast = useUi(s => s.toast);
  const [busy, setBusy] = useState(false);
  const color = profile.profile_color && isHexColor(profile.profile_color) ? profile.profile_color : null;
  const joined = useMemo(() => new Date(profile.created_at).toLocaleDateString([], { month: "long", year: "numeric" }), [profile.created_at]);

  const changeAvatar = async () => {
    const file = await pickFile("image/png,image/jpeg,image/webp,image/gif");
    if (!file) return;
    setBusy(true);
    try {
      await uploadAvatar(file);
      toast("Profile picture updated", "success");
    } catch (err) {
      toast(friendlyError(err), "error");
    } finally {
      setBusy(false);
    }
  };
  const clearAvatar = async () => {
    setBusy(true);
    try {
      await removeAvatar();
      toast("Profile picture removed", "info");
    } catch (err) {
      toast(friendlyError(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel profile-card" style={color ? ({ "--profile-color": color } as React.CSSProperties) : undefined}>
      <div className="profile-card__banner" />
      <div className="profile-card__avatar">
        <Avatar profile={profile} size={96} />
        <button className="profile-card__camera" onClick={changeAvatar} disabled={busy} aria-label="Change profile picture" title="Change profile picture">
          {busy ? <span className="spinner" /> : <Camera size={15} />}
        </button>
      </div>
      <div className="profile-card__body">
        <h2>{profileName(profile)}</h2>
        <div className="profile-card__username">@{profile.username}</div>
        {profile.bio ? <p className="profile-card__bio">{profile.bio}</p> : <p className="profile-card__bio muted">No bio yet.</p>}
        <div className="profile-card__facts">
          {profile.favorite_game && <span><Gamepad2 size={13} /> {profile.favorite_game}</span>}
          {profile.favorite_anime && <span><Clapperboard size={13} /> {profile.favorite_anime}</span>}
          <span><CalendarDays size={13} /> Joined {joined}</span>
        </div>
        {profile.avatar_path && (
          <button className="subtle-button danger" onClick={clearAvatar} disabled={busy}><Trash2 size={13} /> Remove picture</button>
        )}
      </div>
    </section>
  );
}

function EditProfileForm({ profile }: { profile: Profile }) {
  const toast = useUi(s => s.toast);
  const [form, setForm] = useState({
    username: profile.username,
    display_name: profile.display_name ?? "",
    bio: profile.bio ?? "",
    favorite_game: profile.favorite_game ?? "",
    favorite_anime: profile.favorite_anime ?? "",
    profile_color: profile.profile_color ?? ""
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taken, setTaken] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm(f => ({ ...f, [key]: value }));

  const usernameChanged = normalizeUsername(form.username) !== profile.username;
  const cooldownUntil = profile.username_changed_at ? new Date(new Date(profile.username_changed_at).getTime() + 7 * 864e5) : null;
  const onCooldown = cooldownUntil !== null && cooldownUntil > new Date();

  useEffect(() => {
    setTaken(false);
    if (!usernameChanged || validateUsername(form.username)) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      isUsernameAvailable(form.username).then(ok => !cancelled && setTaken(!ok)).catch(() => undefined);
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.username, usernameChanged]);

  const errors = {
    username: usernameChanged ? (validateUsername(form.username) ?? (taken ? "That username is taken." : null)) : null,
    display_name: validateDisplayName(form.display_name),
    profile_color: form.profile_color && !isHexColor(form.profile_color) ? "Pick a color." : null
  };
  const dirty =
    usernameChanged ||
    form.display_name.trim() !== (profile.display_name ?? "") ||
    form.bio.trim() !== (profile.bio ?? "") ||
    form.favorite_game.trim() !== (profile.favorite_game ?? "") ||
    form.favorite_anime.trim() !== (profile.favorite_anime ?? "") ||
    (form.profile_color || null) !== profile.profile_color;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (Object.values(errors).some(Boolean)) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile({
        ...(usernameChanged ? { username: normalizeUsername(form.username) } : {}),
        display_name: form.display_name.trim(),
        bio: form.bio.trim() || null,
        favorite_game: form.favorite_game.trim() || null,
        favorite_anime: form.favorite_anime.trim() || null,
        profile_color: form.profile_color || null
      });
      toast("Profile saved", "success");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel profile-form" onSubmit={submit} noValidate>
      <div className="panel-heading"><div><h3>Edit profile</h3><p>Everyone you add as a friend will see this.</p></div></div>
      <div className="form-grid">
        <Field label="Display name" value={form.display_name} onChange={set("display_name")} maxLength={LIMITS.displayName} error={errors.display_name} />
        <Field label="Username" value={form.username} onChange={v => set("username")(v.replace(/\s/g, ""))} maxLength={20}
          disabled={onCooldown && !usernameChanged}
          error={errors.username}
          hint={onCooldown ? `You can change it again on ${cooldownUntil!.toLocaleDateString()}.` : "You can change your username once every 7 days."} />
      </div>
      <Field label="Bio" multiline value={form.bio} onChange={set("bio")} maxLength={LIMITS.bio}
        placeholder="A little about you…" aside={<small className="counter">{form.bio.length}/{LIMITS.bio}</small>} />
      <div className="form-grid">
        <Field label="Favourite game" value={form.favorite_game} onChange={set("favorite_game")} maxLength={LIMITS.favorite} placeholder="e.g. Minecraft" />
        <Field label="Favourite anime" value={form.favorite_anime} onChange={set("favorite_anime")} maxLength={LIMITS.favorite} placeholder="e.g. One Piece" />
      </div>
      <div className="field">
        <span className="field__label"><span>Profile color</span></span>
        <div className="accent-row compact">
          <button type="button" className={`accent-swatch none ${!form.profile_color ? "selected" : ""}`} onClick={() => set("profile_color")("")} aria-label="No profile color" title="Default" />
          {accentPresets.map(a => (
            <button type="button" key={a.color} className={`accent-swatch ${form.profile_color === a.color ? "selected" : ""}`}
              style={{ background: a.color, color: a.color }} aria-label={a.label} title={a.label} onClick={() => set("profile_color")(a.color)} />
          ))}
          <label className={`accent-custom ${form.profile_color && !accentPresets.some(a => a.color === form.profile_color) ? "selected" : ""}`}>
            <input type="color" value={form.profile_color || "#648cff"} onChange={e => set("profile_color")(e.target.value.toLowerCase())} aria-label="Custom profile color" />
            <span />Custom
          </label>
        </div>
      </div>
      <FormError message={error} />
      <div className="button-row form-actions">
        <SubmitButton busy={busy} disabled={!dirty}>Save profile</SubmitButton>
      </div>
    </form>
  );
}
