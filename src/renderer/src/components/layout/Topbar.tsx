import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogIn, LogOut, Search, Settings, UserRound } from "lucide-react";
import { profileName, useAuth } from "@/features/auth/authStore";
import { Avatar } from "@/features/profile/Avatar";
import { useUi } from "@/store/uiStore";

export function Topbar() {
  const page = useUi(s => s.page);
  return (
    <header className="topbar">
      <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{page}</strong></div>
      <div className="top-actions">
        <div className="search" title="Search arrives in a later version"><Search size={15} /><span>Search NEXUS</span><kbd>Ctrl K</kbd></div>
        <button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button>
        <ProfileMenu />
      </div>
    </header>
  );
}

function ProfileMenu() {
  const status = useAuth(s => s.status);
  const profile = useAuth(s => s.profile);
  const signOut = useAuth(s => s.signOut);
  const openSignIn = useAuth(s => s.openSignIn);
  const navigate = useUi(s => s.navigate);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const signedIn = status === "signedIn";

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const go = (fn: () => void) => () => { setOpen(false); fn(); };

  return (
    <div className="menu-anchor" ref={ref}>
      <button className="profile-pill" onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open}>
        <Avatar profile={profile} size={24} className="small" />
        <span>{signedIn ? profileName(profile) : "Guest"}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="menu" role="menu">
          {signedIn ? (
            <>
              <div className="menu__header">
                <strong>{profileName(profile)}</strong>
                {profile && <small>@{profile.username}</small>}
              </div>
              <button role="menuitem" onClick={go(() => navigate("Profile"))}><UserRound size={15} /> Your profile</button>
              <button role="menuitem" onClick={go(() => navigate("Settings", "account"))}><Settings size={15} /> Account settings</button>
              <hr />
              <button role="menuitem" onClick={go(() => void signOut())}><LogOut size={15} /> Sign out</button>
            </>
          ) : (
            <>
              <div className="menu__header"><strong>Guest</strong><small>Not signed in</small></div>
              {status === "unconfigured" ? (
                <button role="menuitem" onClick={go(() => navigate("Settings", "account"))}><Settings size={15} /> Set up accounts</button>
              ) : (
                <button role="menuitem" onClick={go(openSignIn)}><LogIn size={15} /> Sign in or create account</button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
