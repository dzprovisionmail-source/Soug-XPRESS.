# SOUG XPRESS — Supabase Manual Setup Guide

This document describes every Supabase resource that must be configured manually
by the platform owner. None of these steps are applied automatically by the app.

> **Project URL:** `https://vztpzxigxmgbpakkbyrs.supabase.co`  
> **Dashboard:** <https://supabase.com/dashboard/project/vztpzxigxmgbpakkbyrs>

---

## Quick-reference checklist

| # | Area | Action | Priority |
|---|------|--------|----------|
| 1 | SQL Migration | Run `supabase/migrations/001_initial_missing_objects.sql` | 🔴 Critical — do first |
| 2 | Google OAuth | Add Replit preview URL to allowed redirect URLs | 🔴 Critical |
| 3 | Storage | Create `store-media` bucket + upload policy | 🟠 High |
| 4 | Phone Auth | Decide on OTP vs auto-confirm | 🟠 High |
| 5 | Admin user | Promote a user's `profiles.role` to `'admin'` | 🟡 Medium |
| 6 | Verify | Run verification SQL queries | 🟡 Medium |

---

## Step 1 — Run the SQL migration

**File:** `supabase/migrations/001_initial_missing_objects.sql`

This migration creates or hardens the following in one pass:

| Object | What it does |
|--------|-------------|
| `public.promotions` table | New table — the merchant dashboard was crashing with PGRST205 because this table did not exist |
| `promotions` RLS policies | Merchants read/insert/delete their own promos; public reads promos for approved stores |
| `comments` INSERT policy | Blocks anonymous comment spam; authenticated sessions only |
| `comments` SELECT policy | Keeps the feed publicly readable |
| `comments` DELETE policy | Lets merchants delete comments on their own posts |
| `store_media` SELECT policy | Makes the commercial feed visible to unauthenticated visitors |
| `store_media` INSERT/DELETE | Merchants manage their own media |
| `drivers` SELECT policy | Drivers see only their own row (was leaking all drivers to any user) |
| `drivers` UPDATE policy | Drivers can update their own counter/suspension fields |

### How to run

**Option A — SQL Editor (safest for first run):**

1. Open [SQL Editor](https://supabase.com/dashboard/project/vztpzxigxmgbpakkbyrs/sql/new)
2. Click **New query**
3. Paste the full contents of `supabase/migrations/001_initial_missing_objects.sql`
4. Click **Run**
5. Confirm there are no errors in the output panel

**Option B — Supabase CLI:**

```bash
# from the repo root
supabase link --project-ref vztpzxigxmgbpakkbyrs
supabase db push
```

### Verify after running

Run this in the SQL Editor to confirm every table has RLS and all new policies exist:

```sql
-- Table RLS status
SELECT tablename, rowsecurity
  FROM pg_tables
 WHERE schemaname = 'public'
   AND tablename IN ('promotions', 'comments', 'store_media', 'drivers');

-- Policy list
SELECT tablename, policyname, cmd
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename IN ('promotions', 'comments', 'store_media', 'drivers')
 ORDER BY tablename, policyname;

-- Confirm promotions table shape
SELECT column_name, data_type, column_default, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'promotions'
 ORDER BY ordinal_position;
```

---

## Step 2 — Google OAuth redirect URLs

Google OAuth currently fails on Expo Web because the redirect URL is `exp://localhost:5000/--/callback`, which browsers cannot follow. The app code was fixed to use `window.location.origin + '/callback'` on web, but the resulting HTTPS URL must be whitelisted in two places.

### 2a — Supabase allowed redirect URLs

1. Open [Authentication → URL Configuration](https://supabase.com/dashboard/project/vztpzxigxmgbpakkbyrs/auth/url-configuration)
2. Under **Redirect URLs**, add each of the following on its own line:

```
https://*.replit.dev/callback
https://*.repl.co/callback
http://localhost:5000/callback
exp://localhost:5000/--/callback
```

> The `*.replit.dev` wildcard covers all Replit preview domains.
> Add the production domain here once you deploy (e.g. `https://sougxpress.com/callback`).

### 2b — Google Cloud Console OAuth client

The OAuth client ID is `176229777872-6df9gpug786jqh4ca93sd5l273oo70ch.apps.googleusercontent.com`.

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click the OAuth 2.0 client
3. Under **Authorized redirect URIs**, confirm this entry exists (Supabase adds it automatically):
   ```
   https://vztpzxigxmgbpakkbyrs.supabase.co/auth/v1/callback
   ```
4. Under **Authorized JavaScript origins**, add your Replit preview domain:
   ```
   https://<your-replit-username>.<repl-name>.replit.dev
   ```

---

## Step 3 — `store-media` Storage bucket

The merchant dashboard uploads product photos. The bucket does not exist yet.

### Create the bucket

1. Open [Storage](https://supabase.com/dashboard/project/vztpzxigxmgbpakkbyrs/storage/buckets)
2. Click **New bucket**
3. Set:
   - **Name:** `store-media`
   - **Public bucket:** **ON** ← required; the app calls `storage.from('store-media').getPublicUrl(path)` and stores the resulting URL in `store_media.media_url`. With a private bucket those URLs return 403 and every image in the feed breaks.
   - **File size limit:** `5 MB`
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, video/mp4`
4. Click **Save**

### Add storage policies

Even with a public bucket you should restrict who can write and delete files.
Go to **Storage → Policies** and add:

| Policy name | Operation | Expression |
|-------------|-----------|------------|
| Merchants upload own files | INSERT | `(auth.uid()::text) = (storage.foldername(name))[1]` |
| Merchants delete own files | DELETE | `(auth.uid()::text) = (storage.foldername(name))[1]` |

> A public bucket grants SELECT to everyone automatically — no SELECT policy is needed.  
> The folder naming convention assumes the app uploads to paths like `<store_id>/filename.jpg`.
> Adjust the expression if the app uses a different path structure.

### Smoke-test after setup

1. Log in as a merchant, publish a post with a photo
2. Open the resulting `media_url` value from the `store_media` table in an incognito browser window
3. Confirm it loads (HTTP 200). If you see 403, the bucket is still private — toggle **Public bucket: ON** and save again

### Alternative — SQL approach

The migration file contains a commented-out `INSERT INTO storage.buckets` statement.
Un-comment Section 5 in the migration and re-run if you prefer the SQL approach.
Storage policies still require the Dashboard UI or a separate `storage.objects` policy statement.

---

## Step 4 — Phone authentication: OTP vs auto-confirm

**Current state:** `phone_autoconfirm = true` — any phone number can sign up instantly
without receiving or entering an OTP. This is a security risk (identity spoofing).

### Option A — Keep auto-confirm (development / MVP)

No action needed. Acceptable for internal testing where you control who has the app.

### Option B — Enable OTP verification (production recommended)

1. Open [Authentication → Providers → Phone](https://supabase.com/dashboard/project/vztpzxigxmgbpakkbyrs/auth/providers)
2. Uncheck **Auto Confirm**
3. Confirm your **Twilio** credentials are active (SMS provider is already set to Twilio)
4. Click **Save**

> ⚠ After disabling auto-confirm you **must** update the app's sign-up flow to call
> `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` after signup.
> The current `login.tsx` does not implement an OTP entry step — this is a Phase 3 task.
> Switching this setting before the app is updated will break phone sign-up entirely.

---

## Step 5 — Promote an admin user

The admin panel (`src/app/admin.tsx`) is accessible to users whose `profiles.role = 'admin'`.
No user starts with this role — it must be set manually.

1. Find the user's UUID in [Authentication → Users](https://supabase.com/dashboard/project/vztpzxigxmgbpakkbyrs/auth/users)
2. Open [SQL Editor](https://supabase.com/dashboard/project/vztpzxigxmgbpakkbyrs/sql/new) and run:

```sql
-- Replace the UUID with the actual admin user's ID
UPDATE public.profiles
   SET role = 'admin'
 WHERE id = '<paste-admin-user-uuid-here>';

-- Confirm
SELECT id, full_name, phone, role FROM public.profiles WHERE role = 'admin';
```

3. After this, also un-comment the **Admin bypass** policy in the migration file and re-run
   so the admin can read all drivers in the admin panel:

```sql
-- Un-comment in migration or paste directly:
DROP POLICY IF EXISTS "Admin full access to drivers" ON public.drivers;
CREATE POLICY "Admin full access to drivers"
    ON public.drivers
    FOR ALL
    USING (auth.uid() = '<paste-admin-user-uuid-here>');
```

---

## Step 6 — Verify the full state

Run this comprehensive status query after completing all steps above:

```sql
-- 1. Tables and RLS status
SELECT
    t.tablename,
    t.rowsecurity AS rls_enabled,
    COUNT(p.policyname) AS policy_count
  FROM pg_tables t
  LEFT JOIN pg_policies p
         ON p.schemaname = t.schemaname AND p.tablename = t.tablename
 WHERE t.schemaname = 'public'
   AND t.tablename IN ('profiles','stores','store_media','promotions',
                       'drivers','orders','comments')
 GROUP BY t.tablename, t.rowsecurity
 ORDER BY t.tablename;

-- 2. All policies in scope
SELECT tablename, policyname, cmd, qual
  FROM pg_policies
 WHERE schemaname = 'public'
 ORDER BY tablename, policyname;

-- 3. Auth settings snapshot
SELECT
    (SELECT count(*) FROM auth.users)           AS total_users,
    (SELECT count(*) FROM public.profiles)      AS total_profiles,
    (SELECT count(*) FROM public.stores)        AS total_stores,
    (SELECT count(*) FROM public.promotions)    AS total_promotions,
    (SELECT count(*) FROM public.drivers)       AS total_drivers,
    (SELECT count(*) FROM public.comments)      AS total_comments,
    (SELECT count(*) FROM public.store_media)   AS total_media;
```

---

## Open questions requiring owner decision

| Question | Impact | Location |
|----------|--------|----------|
| Which BARIDIMOB RIP number is correct? (Two values found in original codebase) | Financial — all driver payouts use this number | `src/constants/financial.ts` top comment |
| Should `phone_autoconfirm` be disabled before launch? | Security — prevents phone number spoofing | Supabase Auth settings (Step 4 above) |
| What is the admin user's phone number / UUID? | Admin panel access | Profiles table (Step 5 above) |
| What file path structure does the app use for Storage uploads? | Storage policies | `src/app/(tabs)/merchant.tsx` image upload logic |

---

## Environment variables (already configured)

The following are stored in the Replit project's environment and do **not** need to be changed:

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase REST + Auth endpoint |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public (publishable) client key |

> Never commit these values to source control. They live in Replit's secret store.
