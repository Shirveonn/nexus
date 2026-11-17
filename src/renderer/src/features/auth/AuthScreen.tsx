import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Gamepad2, Clapperboard, MailCheck, Palette, Users, Zap } from "lucide-react";
import { Field, FormError, SubmitButton } from "@/components/ui/Field";
import { useUi } from "@/store/uiStore";
import * as api from "./authApi";
import { useAuth } from "./authStore";
import {
  LIMITS, friendlyError, normalizeUsername, passwordStrength, validateCode, validateDisplayName,
  validateEmail, validatePassword, validateUsername
} from "./validation";

type View =
  | { name: "signIn" }
  | { name: "signUp" }
  | { name: "verify"; email: string }
  | { name: "forgot" }
  | { name: "reset"; email: string };

/** Full-screen sign-in / sign-up shown when accounts are configured and nobody is signed in. */
export function AuthScreen() {
  const pendingReset = useAuth(s => s.pendingPasswordReset);
  const [view, setView] = useState<View>({ name: "signIn" });
  const [email, setEmail] = useState("");

  return (
    <div className="auth-screen">
      <section className="auth-hero" aria-hidden>
        <div className="auth-hero__glow" />
        <div className="brand">
          <div className="brand-mark"><Zap size={19} fill="currentColor" /></div>
          <div><div className="brand-name">NEXUS</div><div className="brand-sub">YOUR DIGITAL SPACE</div></div>
        </div>
        <div className="auth-hero__copy">
          <h1>Your friends.<br /><span>Your space.</span></h1>
          <p>One account for everything in NEXUS: your profile, your friends, and soon chat, games and more.</p>
          <ul>
            <li><Users size={15} /> Add friends and see who's online</li>
            <li><Gamepad2 size={15} /> Share your game library</li>
            <li><Clapperboard size={15} /> Track anime together</li>
            <li><Palette size={15} /> Keep your own look and themes</li>
          </ul>
        </div>
        <small>NEXUS · made by and for our friend group</small>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          {pendingReset ? (
            <NewPasswordForm />
          ) : view.name === "signIn" ? (
            <SignInForm email={email} setEmail={setEmail} go={setView} />
          ) : view.name === "signUp" ? (
            <SignUpForm email={email} setEmail={setEmail} go={setView} />
          ) : view.name === "verify" ? (
            <VerifyForm email={view.email} go={setView} />
          ) : view.name === "forgot" ? (
            <ForgotForm email={email} setEmail={setEmail} go={setView} />
          ) : (
            <ResetCodeForm email={view.email} go={setView} />
          )}
        </div>
      </section>
    </div>
  );
}

type Go = (view: View) => void;

function useSubmit() {
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
  return { busy, error, setError, run };
}

function Heading({ title, text, onBack }: { title: string; text?: string; onBack?: () => void }) {
  return (
    <header className="auth-heading">
      {onBack && <button type="button" className="subtle-button auth-back" onClick={onBack}><ArrowLeft size={14} /> Back</button>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </header>
  );
}

function GuestLink() {
  const continueAsGuest = useAuth(s => s.continueAsGuest);
  return (
    <button type="button" className="auth-guest" onClick={continueAsGuest}>
      Continue as guest <small>(no friends or online features)</small>
    </button>
  );
}

function SignInForm({ email, setEmail, go }: { email: string; setEmail: (v: string) => void; go: Go }) {
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const { busy, error, run } = useSubmit();
  const emailError = touched ? validateEmail(email) : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (validateEmail(email) || !password) return;
    void run(async () => {
      try {
        await api.signIn(email, password);
      } catch (err) {
        if ((err as { code?: string }).code === "email_not_confirmed") {
          await api.resendSignupCode(email).catch(() => undefined);
          go({ name: "verify", email });
          return;
        }
        throw err;
      }
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      <Heading title="Welcome back" text="Sign in to your NEXUS account." />
      <Field label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} error={emailError} autoFocus />
      <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={setPassword}
        error={touched && !password ? "Enter your password." : null}
        aside={<button type="button" className="subtle-button" onClick={() => go({ name: "forgot" })}>Forgot password?</button>} />
      <FormError message={error} />
      <SubmitButton busy={busy}>Sign in</SubmitButton>
      <p className="auth-switch">New to NEXUS? <button type="button" className="subtle-button" onClick={() => go({ name: "signUp" })}>Create an account</button></p>
      <GuestLink />
    </form>
  );
}

type Availability = "idle" | "checking" | "available" | "taken" | "error";

function SignUpForm({ email, setEmail, go }: { email: string; setEmail: (v: string) => void; go: Go }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [availability, setAvailability] = useState<Availability>("idle");
  const { busy, error, run } = useSubmit();
  const toast = useUi(s => s.toast);

  // Check the username as the user types (debounced).
  useEffect(() => {
    if (validateUsername(username)) return setAvailability("idle");
    setAvailability("checking");
    let cancelled = false;
    const timer = setTimeout(() => {
      api.isUsernameAvailable(username)
        .then(ok => !cancelled && setAvailability(ok ? "available" : "taken"))
        .catch(() => !cancelled && setAvailability("error"));
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [username]);

  const errors = {
    username: validateUsername(username) ?? (availability === "taken" ? "That username is taken." : null),
    displayName: validateDisplayName(displayName),
    email: validateEmail(email),
    password: validatePassword(password),
    confirm: confirm !== password ? "Passwords don't match." : null
  };
  const show = (key: keyof typeof errors) => (touched ? errors[key] : null);
  const strength = passwordStrength(password);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (Object.values(errors).some(Boolean) || availability === "checking") return;
    void run(async () => {
      const ready = await api.signUp({ email, password, username, displayName });
      if (ready) toast("Welcome to NEXUS!", "success");
      else go({ name: "verify", email });
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      <Heading title="Create your account" text="It takes 30 seconds. Your username is how friends find you." onBack={() => go({ name: "signIn" })} />
      <Field label="Username" value={username} onChange={v => setUsername(v.replace(/\s/g, ""))} maxLength={20} autoComplete="username" autoFocus
        error={show("username")}
        hint={availability === "checking" ? "Checking…" : availability === "available" ? <span className="ok">@{normalizeUsername(username)} is available</span> : availability === "taken" ? <span className="bad">That username is taken.</span> : "3–20 letters, numbers or underscores"} />
      <Field label="Display name" value={displayName} onChange={setDisplayName} maxLength={LIMITS.displayName} error={show("displayName")} hint="What friends see. You can use spaces and emoji." />
      <Field label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} error={show("email")} />
      <Field label="Password" type="password" autoComplete="new-password" value={password} onChange={setPassword} error={show("password")}
        hint={<span className={`strength strength--${strength}`}><i /><i /><i /><i /> {["", "Weak", "Okay", "Good", "Strong"][strength]}</span>} />
      <Field label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={setConfirm} error={show("confirm")} />
      <FormError message={error} />
      <SubmitButton busy={busy}>Create account</SubmitButton>
      <p className="auth-switch">Already have an account? <button type="button" className="subtle-button" onClick={() => go({ name: "signIn" })}>Sign in</button></p>
    </form>
  );
}

function VerifyForm({ email, go }: { email: string; go: Go }) {
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [resent, setResent] = useState(false);
  const { busy, error, setError, run } = useSubmit();
  const toast = useUi(s => s.toast);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (validateCode(code)) return;
    void run(async () => {
      await api.verifySignupCode(email, code);
      toast("Email confirmed. Welcome to NEXUS!", "success");
    });
  };

  const resend = async () => {
    try {
      await api.resendSignupCode(email);
      setResent(true);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="auth-icon"><MailCheck size={22} /></div>
      <Heading title="Check your email" text={`We sent a code to ${email}. Enter it below to confirm your account.`} />
      <Field label="Confirmation code" value={code} onChange={v => setCode(v.replace(/\D/g, ""))} inputMode="numeric" autoComplete="one-time-code"
        maxLength={10} className="text-input code-input" autoFocus error={touched ? validateCode(code) : null} />
      <FormError message={error} />
      <SubmitButton busy={busy}>Confirm email</SubmitButton>
      <p className="auth-switch">
        {resent ? "New code sent. " : "Didn't get it? Check spam, or "}
        {!resent && <button type="button" className="subtle-button" onClick={resend}>send a new code</button>}
      </p>
      <p className="auth-switch"><button type="button" className="subtle-button" onClick={() => go({ name: "signIn" })}>Back to sign in</button></p>
    </form>
  );
}

function ForgotForm({ email, setEmail, go }: { email: string; setEmail: (v: string) => void; go: Go }) {
  const [touched, setTouched] = useState(false);
  const { busy, error, run } = useSubmit();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (validateEmail(email)) return;
    void run(async () => {
      await api.sendPasswordResetCode(email);
      go({ name: "reset", email });
    });
  };
  return (
    <form onSubmit={submit} noValidate>
      <Heading title="Reset your password" text="Enter your account email and we'll send you a reset code." onBack={() => go({ name: "signIn" })} />
      <Field label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} error={touched ? validateEmail(email) : null} autoFocus />
      <FormError message={error} />
      <SubmitButton busy={busy}>Send reset code</SubmitButton>
    </form>
  );
}

function ResetCodeForm({ email, go }: { email: string; go: Go }) {
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const { busy, error, run } = useSubmit();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (validateCode(code)) return;
    void run(() => api.verifyResetCode(email, code));
  };
  return (
    <form onSubmit={submit} noValidate>
      <div className="auth-icon"><MailCheck size={22} /></div>
      <Heading title="Enter your reset code" text={`If ${email} has a NEXUS account, a code is on its way.`} onBack={() => go({ name: "forgot" })} />
      <Field label="Reset code" value={code} onChange={v => setCode(v.replace(/\D/g, ""))} inputMode="numeric" autoComplete="one-time-code"
        maxLength={10} className="text-input code-input" autoFocus error={touched ? validateCode(code) : null} />
      <FormError message={error} />
      <SubmitButton busy={busy}>Continue</SubmitButton>
    </form>
  );
}

function NewPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const { busy, error, run } = useSubmit();
  const signOut = useAuth(s => s.signOut);
  const toast = useUi(s => s.toast);
  const passwordError = validatePassword(password);
  const confirmError = confirm !== password ? "Passwords don't match." : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (passwordError || confirmError) return;
    void run(async () => {
      await api.setNewPassword(password);
      toast("Password updated. You're signed in.", "success");
    });
  };
  return (
    <form onSubmit={submit} noValidate>
      <Heading title="Choose a new password" text="Pick something you don't use anywhere else." />
      <Field label="New password" type="password" autoComplete="new-password" value={password} onChange={setPassword} error={touched ? passwordError : null} autoFocus />
      <Field label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={setConfirm} error={touched ? confirmError : null} />
      <FormError message={error} />
      <SubmitButton busy={busy}>Save password</SubmitButton>
      <p className="auth-switch"><button type="button" className="subtle-button" onClick={() => void signOut()}>Cancel</button></p>
    </form>
  );
}
