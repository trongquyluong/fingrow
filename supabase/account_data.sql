-- ════════════════════════════════════════════════════════════════════
-- Fingrow — Account-bound progress + admin account management
-- Run this ONCE in the Supabase SQL editor, after schema.sql + admin.sql.
-- Non-destructive: only CREATE TABLE IF NOT EXISTS + policies.
-- ════════════════════════════════════════════════════════════════════

-- 1. Cloud save: a student's full game state, keyed by their account.
--    The app pushes this (debounced) while they play and restores it on
--    login from any device. `state` is the entire UserState blob.
create table if not exists public.account_state (
  username    text primary key,          -- lowercased; matches accounts.username
  state       jsonb       not null,
  updated_at  timestamptz not null default now()
);

alter table public.account_state enable row level security;

drop policy if exists "Read account_state" on public.account_state;
create policy "Read account_state"
  on public.account_state for select using (true);

drop policy if exists "Anonymous state upsert" on public.account_state;
create policy "Anonymous state upsert"
  on public.account_state for insert with check (true);

drop policy if exists "Anonymous state update" on public.account_state;
create policy "Anonymous state update"
  on public.account_state for update using (true) with check (true);

-- ════════════════════════════════════════════════════════════════════
-- 2. (OPTIONAL — destructive) Enable the admin console to DELETE accounts.
--
--    ⚠️  WARNING: with the app's open anonymous RLS, a DELETE policy of
--    `using (true)` lets ANYONE holding the public anon key delete ANY
--    row — not just the admin. The admin gate is client-side only.
--    This is acceptable ONLY for a closed research pilot on throwaway
--    data. For anything real, migrate to Supabase Auth + role-based RLS
--    BEFORE enabling deletes.
--
--    If you do NOT run this block, the admin console's other features
--    (view / edit info / reset password / rename) still work — only the
--    "Delete account" button will fail (handled gracefully in the UI).
--
--    To enable deletion, run the statements below.
-- ════════════════════════════════════════════════════════════════════

-- drop policy if exists "Anonymous account delete" on public.accounts;
-- create policy "Anonymous account delete"
--   on public.accounts for delete using (true);

-- drop policy if exists "Anonymous progress delete" on public.student_progress;
-- create policy "Anonymous progress delete"
--   on public.student_progress for delete using (true);

-- drop policy if exists "Anonymous state delete" on public.account_state;
-- create policy "Anonymous state delete"
--   on public.account_state for delete using (true);

-- drop policy if exists "Anonymous leaderboard delete" on public.leaderboard;
-- create policy "Anonymous leaderboard delete"
--   on public.leaderboard for delete using (true);
