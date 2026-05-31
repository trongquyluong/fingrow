# Supabase Leaderboard Setup

Fingrow uses Supabase as the backend for the real cross-device leaderboard. If you don't set this up, the app still runs — it falls back to a local-only leaderboard.

## 1. Create a Supabase project (free tier)

1. Go to <https://app.supabase.com> and sign in.
2. Click **New project**, pick any name (e.g. `fingrow`).
3. Set a strong DB password and choose the nearest region.
4. Wait ~1 minute for provisioning.

## 2. Run the schema

1. In the project dashboard, open **SQL Editor** (left nav).
2. Click **New query**.
3. Paste the contents of `supabase/schema.sql` from this repo.
4. Click **Run**. You should see `Success. No rows returned.`

## 3. Grab your keys

1. Go to **Project Settings → API** (left nav).
2. Copy:
   - **Project URL** (e.g. `https://abcdefg.supabase.co`)
   - **Anon public** key (long JWT under `Project API keys`)

## 4. Add to your `.env`

Create `.env` in the project root (copy from `.env.example`):

```
VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_ANON_PUBLIC_KEY"
```

Restart `npm run dev`. The League tab will now sync to the real database.

## How it works

- Each user gets an anonymous `user_id` stored in `localStorage` (`fingrow_uid`).
- When the user earns league points or sets a username, the app upserts a row in `public.leaderboard`.
- The League tab fetches the top 20 by `week_points` for the current week.
- Row Level Security is open for read + write since users are anonymous. For a stricter setup, swap to Supabase Auth and tie upserts to `auth.uid()`.

## Security notes

- The **anon** key is safe to ship to the browser — it's gated by Row Level Security.
- Never commit the `service_role` key. It's not used by the frontend.
- For abuse prevention (someone spamming scores), add a Postgres rate-limit trigger or migrate to authed users.
