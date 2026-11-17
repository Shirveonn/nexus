import { useState, type FormEvent } from "react";
import { KeyRound, LogIn, LogOut, Mail, MonitorSmartphone, ServerOff, ShieldAlert, Trash2 } from "lucide-react";
import { Field, FormError, SubmitButton } from "@/components/ui/Field";
import { Panel, SettingRow } from "@/components/ui/controls";
import * as api from "@/features/auth/authApi";
import { useAuth } from "@/features/auth/authStore";
import { friendlyError, validateCode, validateEmail, validatePassword } from "@/features/auth/validation";
import { deleteAccount } from "@/features/profile/profileApi";
import { supabaseConfig } from "@/lib/supabase";
import { useUi } from "@/store/uiStore";

export function AccountTab() {
  const status = useAuth(s => s.status);
  const openSignIn = useAuth(s => s.openSignIn);

  if (status === "unconfigured") return <NotConfigured />;
  if (status !== "signedIn") {
    return (
      <Panel title="You're using NEXUS as a guest" description="Your themes and layout are saved on this PC. Sign in to get a profile and, soon, friends." icon={<LogIn size={18} />}>
        <div className="button-row panel-actions">
          <button className="primary-button" onClick={openSignIn}><LogIn size={15} /> Sign in or create account</button>
        </div>
      </Panel>
    );
  }
  return (
    <>
      <EmailPanel />
      <PasswordPanel />
      <SessionsPanel />
      <DeletePanel />
    </>
  );
}

function NotConfigured() {
  const secret = !supabaseConfig.ok && supabaseConfig.reason === "secret-key";
  return (
    <Panel title={secret ? "Unsafe server key detected" : "Online accounts aren't set up"} description={supabaseConfig.ok ? "" : supabaseConfig.message}
      icon={secret ? <ShieldAlert size={18} /> : <ServerOff size={18} />} className={secret ? "danger-panel" : ""}>
      <ol className="steps">
        <li>Create a free project at <strong>supabase.com</strong>.</li>
        <li>Follow <strong>docs/SUPABASE_SETUP.md</strong> in the NEXUS repo to create the database tables.</li>
        <li>Copy <strong>.env.example</strong> to <strong>.env</strong> and paste in your Project URL and <em>publishable</em> key.</li>
        <li>Restart <code>npm run dev</code>.</li>
      </ol>
    </Panel>
  );
}

function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}

type EmailStep = { step: "idle" } | { step: "new"; newEmail: string } | { step: "old"; newEmail: string };

function EmailPanel() {
  const user = useAuth(s => s.user);
  const toast = useUi(s => s.toast);
  const [state, setState] = useState<EmailStep>({ step: "idle" });
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const { busy, error, run } = useAction();
  const current = user?.email ?? "";

  const request = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (validateEmail(newEmail) || newEmail.trim().toLowerCase() === current.toLowerCase()) return;
    void run(async () => {
      await api.requestEmailChange(newEmail);
      setCode("");
      setTouched(false);
      setState({ step: "new", newEmail: newEmail.trim() });
    });
  };

  const confirm = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (state.step === "idle" || validateCode(code)) return;
    const target = state.newEmail;
    const codeEmail = state.step === "new" ? target : current;
    void run(async () => {
      const done = await api.confirmEmailChange(codeEmail, code, target);
      setCode("");
      setTouched(false);
      if (done) {
        toast("Email address updated", "success");
        setState({ step: "idle" });
        setNewEmail("");
      } else {
        setState({ step: "old", newEmail: target });
      }
    });
  };

  return (
    <Panel title="Email" description="Used to sign in and to reset your password." icon={<Mail size={18} />}>
      <SettingRow label="Current email"><span className="value-chip">{current}</span></SettingRow>
      {state.step === "idle" ? (
        <form className="inline-form" onSubmit={request} noValidate>
          <Field label="New email" type="email" value={newEmail} onChange={setNewEmail} autoComplete="email"
            error={touched ? (validateEmail(newEmail) ?? (newEmail.trim().toLowerCase() === current.toLowerCase() ? "That's already your email." : null)) : null} />
          <SubmitButton busy={busy}>Change email</SubmitButton>
        </form>
      ) : (
        <form className="inline-form" onSubmit={confirm} noValidate>
          <Field
            label={state.step === "new" ? `Code sent to ${state.newEmail}` : `Now the code sent to ${current}`}
            hint={state.step === "new" ? "For your security we also email your current address; you'll enter that code next." : "Almost done: confirm from your current address too."}
            value={code} onChange={v => setCode(v.replace(/\D/g, ""))} inputMode="numeric" maxLength={10} className="text-input code-input"
            error={touched ? validateCode(code) : null} autoFocus />
          <div className="button-row">
            <SubmitButton busy={busy}>Confirm</SubmitButton>
            <button type="button" className="subtle-button" onClick={() => setState({ step: "idle" })}>Cancel</button>
          </div>
        </form>
      )}
      <FormError message={error} />
    </Panel>
  );
}

function PasswordPanel() {
  const toast = useUi(s => s.toast);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const { busy, error, run } = useAction();
  const errors = {
    current: current ? null : "Enter your current password.",
    next: validatePassword(next),
    confirm: confirm !== next ? "Passwords don't match." : null
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    void run(async () => {
      await api.changePassword(current, next);
      setCurrent(""); setNext(""); setConfirm(""); setTouched(false);
      toast("Password changed", "success");
    });
  };

  return (
    <Panel title="Password" icon={<KeyRound size={18} />}>
      <form className="stack-form" onSubmit={submit} noValidate>
        <Field label="Current password" type="password" autoComplete="current-password" value={current} onChange={setCurrent} error={touched ? errors.current : null} />
        <div className="form-grid">
          <Field label="New password" type="password" autoComplete="new-password" value={next} onChange={setNext} error={touched ? errors.next : null} />
          <Field label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={setConfirm} error={touched ? errors.confirm : null} />
        </div>
        <FormError message={error} />
        <div className="button-row"><SubmitButton busy={busy}>Change password</SubmitButton></div>
      </form>
    </Panel>
  );
}

function SessionsPanel() {
  const signOut = useAuth(s => s.signOut);
  const [busy, setBusy] = useState(false);
  const run = async (scope: "local" | "global") => {
    setBusy(true);
    await signOut(scope);
    setBusy(false);
  };
  return (
    <Panel title="Signed-in devices" icon={<MonitorSmartphone size={18} />}>
      <SettingRow label="Sign out" hint="Sign out on this PC only.">
        <button className="primary-button" onClick={() => void run("local")} disabled={busy}><LogOut size={15} /> Sign out</button>
      </SettingRow>
      <SettingRow label="Sign out everywhere" hint="Use this if you signed in on a PC you don't trust.">
        <button className="primary-button" onClick={() => void run("global")} disabled={busy}><LogOut size={15} /> Sign out everywhere</button>
      </SettingRow>
    </Panel>
  );
}

function DeletePanel() {
  const profile = useAuth(s => s.profile);
  const toast = useUi(s => s.toast);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const { busy, error, run } = useAction();
  const username = profile?.username ?? "";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (typed.trim().toLowerCase() !== username) return;
    void run(async () => {
      await deleteAccount();
      toast("Your account has been deleted", "info");
    });
  };

  return (
    <Panel title="Delete account" description="Permanently deletes your account, profile and profile picture. This can't be undone." className="danger-panel" icon={<Trash2 size={18} />}>
      {!open ? (
        <div className="button-row panel-actions">
          <button className="subtle-button danger" onClick={() => setOpen(true)}><Trash2 size={13} /> Delete my account…</button>
        </div>
      ) : (
        <form className="stack-form" onSubmit={submit} noValidate>
          <Field label={`Type your username (${username}) to confirm`} value={typed} onChange={setTyped} autoFocus />
          <FormError message={error} />
          <div className="button-row">
            <button type="submit" className="danger-button" disabled={busy || typed.trim().toLowerCase() !== username}>
              {busy ? <span className="spinner" /> : "Delete forever"}
            </button>
            <button type="button" className="subtle-button" onClick={() => { setOpen(false); setTyped(""); }}>Cancel</button>
          </div>
        </form>
      )}
    </Panel>
  );
}
