-- ════════════════════════════════════════════════════════════════════
-- Fingrow — Admin / Research add-on
-- Run this ONCE in the Supabase SQL editor, after schema.sql.
--
-- Creates:
--   1. public.student_progress — per-student learning analytics snapshot
--      (synced from each student's device so the research admin can see
--       how they study). Scalar columns for listing/sorting + a `details`
--       jsonb blob for the deep per-student breakdown.
--   2. The research admin account row in public.accounts.
--
-- SECURITY NOTE (matches the app's documented MVP model): RLS below is
-- fully open — the anonymous publishable key can read every row. The
-- "admin" gate is enforced CLIENT-SIDE only. This is acceptable for a
-- closed research pilot but is NOT hardened access control. To harden,
-- migrate to Supabase Auth + per-role RLS (deferred).
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.student_progress (
  username           text primary key,          -- lowercased; matches accounts.username
  username_display   text        not null,
  full_name          text,
  school             text,
  age                int,
  avatar             text        not null default '🦁',
  level              int         not null default 1,
  xp                 int         not null default 0,
  league_points      int         not null default 0,
  league_tier        text        not null default 'iron',
  league_week_points int         not null default 0,
  streak             int         not null default 0,
  questions_seen     int         not null default 0,   -- distinct questions attempted
  questions_correct  int         not null default 0,   -- distinct questions ever answered correctly
  accuracy           real        not null default 0,   -- 0..1 across all attempts
  mastered_count     int         not null default 0,   -- questions at mastery level 4
  daily_done_today   int         not null default 0,   -- daily challenges completed today (0..4)
  transactions_count int         not null default 0,
  ribbons_count      int         not null default 0,
  last_active        text,
  details            jsonb,                              -- deep breakdown for the admin detail view
  updated_at         timestamptz not null default now()
);

create index if not exists student_progress_lp_idx
  on public.student_progress (league_points desc);

alter table public.student_progress enable row level security;

-- Open RLS, matching the leaderboard/accounts MVP model.
drop policy if exists "Read progress" on public.student_progress;
create policy "Read progress"
  on public.student_progress for select
  using (true);

drop policy if exists "Anonymous progress upsert" on public.student_progress;
create policy "Anonymous progress upsert"
  on public.student_progress for insert
  with check (true);

drop policy if exists "Anonymous progress update" on public.student_progress;
create policy "Anonymous progress update"
  on public.student_progress for update
  using (true)
  with check (true);

-- ────────────────────────────────────────────────────────────────────
-- Research admin account.
-- Username: fingrow_admin
-- Password hash below is SHA-256 of the plaintext credential handed over
-- separately (same hashing the app's login uses). Re-running updates the
-- password hash so this statement is idempotent.
-- ────────────────────────────────────────────────────────────────────
insert into public.accounts
  (username, username_display, password_hash, avatar, full_name, school, joined_at, updated_at)
values
  ('fingrow_admin', 'fingrow_admin',
   'b53c543995e9b36075ad97537c5029154f5a7a98e2a2fce2d74d5fe503cdc581',
   '🛡️', 'Research Admin', 'Fingrow Research', now(), now())
on conflict (username) do update
  set password_hash = excluded.password_hash,
      username_display = excluded.username_display,
      avatar = excluded.avatar;
