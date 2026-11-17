# Setting up online accounts (Supabase)

NEXUS uses [Supabase](https://supabase.com) for accounts, profiles and (later) friends and chat. The free plan is plenty for a friend group. Setup takes about 15 minutes and you only do it once; your friends just install the app.

> **The golden rule:** the app only ever gets the **publishable** key (or the legacy **anon** key). The **secret / service_role** key bypasses every security rule. Never paste it into `.env`, the code, GitHub, Discord or anywhere else. NEXUS refuses to start if it finds one.

---

## 1. Create the project

1. Sign up at **supabase.com** (signing in with GitHub works).
2. Click **New project**. Pick a name (`nexus`), a strong database password (save it in a password manager) and the region closest to your group.
3. Wait about a minute while it starts.

## 2. Create the database tables

The database is built from the SQL files in [`supabase/migrations/`](../supabase/migrations/). Run them **in order (oldest first), once each**:

| File | Adds |
| --- | --- |
| `20261117000000_profiles.sql` | accounts, profiles, usernames, avatars (v0.3.0) |
| `20261118000000_friends.sql` | friends, requests, blocking, online status (v0.4.0) |

For each file:
1. Open **SQL Editor** and click **New query**.
2. Copy **all** of the file, paste it in and click **Run**. You should see "Success. No rows returned".

Afterwards **Table Editor** shows `profiles`, `friendships`, `blocks` and `user_status`, and **Storage** shows an `avatars` bucket.

> **Already set up for 0.3.0?** Only run the files you haven't run yet. Running one twice gives an "already exists" error, which is harmless but means it was already applied.

<details>
<summary>Alternative: use the Supabase CLI</summary>

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```
</details>

## 3. Choose how sign-up emails work

Supabase's built-in email service is only for testing: it sends just a few emails per hour, and only to members of your Supabase team. Pick one option:

### Option A: no email confirmation (easiest, fine for a private friend group)
**Authentication → Sign In / Providers → Email**: turn **Confirm email** OFF.
Friends can sign up and start straight away. The catch: **"Forgot password" won't send emails** reliably. If someone forgets their password, you (the admin) can set a new one under **Authentication → Users**.

### Option B: real emails with codes (recommended once more people join)
1. Create a free account with an email provider such as **Resend** (3,000 emails/month free) or **Brevo** (300/day free) and follow their "Supabase SMTP" guide.
2. In Supabase: **Authentication → Emails → SMTP Settings**: enable custom SMTP and paste their details.
3. Keep **Confirm email** ON.
4. Do step 4 below so emails contain a **6-digit code**.

## 4. Email templates (needed for codes)

A desktop app can't open "click here" links, so NEXUS asks for the **6-digit code** from the email. Go to **Authentication → Emails → Templates** and change these three templates:

| Template | Subject | Body |
| --- | --- | --- |
| **Confirm sign up** | `Your NEXUS confirmation code` | contents of [`supabase/templates/confirmation.html`](../supabase/templates/confirmation.html) |
| **Reset password** | `Your NEXUS password reset code` | contents of [`supabase/templates/recovery.html`](../supabase/templates/recovery.html) |
| **Change email address** | `Confirm your new NEXUS email` | contents of [`supabase/templates/email_change.html`](../supabase/templates/email_change.html) |

The important part of each template is `{{ .Token }}`, which is where the code goes.

## 5. Password rules

**Authentication → Sign In / Providers → Email**: set **Minimum password length** to **8** (it matches the app).

## 6. Connect the app

1. Find your project's **URL** (for example `https://abcdefgh.supabase.co`) and **publishable key** (`sb_publishable_…`). They're under **Project Settings → API Keys**, and the **Connect** button at the top of the dashboard shows them too.
2. In the NEXUS folder, copy `.env.example` to a new file called `.env` and fill in both values:
   ```
   RENDERER_VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   RENDERER_VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
3. Restart `npm run dev`. You'll see the sign-in screen.

`.env` is git-ignored. Each developer makes their own copy.

## 7. Let GitHub build installers that can connect

So the installer from GitHub Actions can reach your project:

**GitHub repo → Settings → Secrets and variables → Actions → Variables tab → New repository variable**

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | your project URL |
| `SUPABASE_PUBLISHABLE_KEY` | your publishable key |

(Variables rather than secrets are fine: the publishable key ends up inside the app anyway and is protected by the database's security rules.)

Push to `main` or re-run the **CI** workflow, and the next installer will have accounts switched on.

---

## Local development with Docker (optional)

You can run a complete private Supabase on your own PC to experiment without touching the real one. This needs [Docker Desktop](https://www.docker.com/products/docker-desktop/), which is free.

```bash
npm run db:start      # starts Supabase locally and prints its URL and keys
npm run test:db       # runs the 41 security tests against it
npm run db:reset      # wipes it and re-applies the migrations
npm run db:stop
```

Point `.env` at `http://127.0.0.1:54321` with the local publishable key it prints. Emails sent locally (codes and so on) appear in the test inbox at <http://127.0.0.1:54324>.

## Changing the database later

Never edit an old migration once it's been run on the real project. Add a new file in `supabase/migrations/` (e.g. `20261201000000_friends.sql`), test it locally with `npm run db:reset && npm run test:db`, then run it in the SQL Editor (or `npx supabase db push`), and finally run `npm run db:types` to update the TypeScript types.
