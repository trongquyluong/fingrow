-- ════════════════════════════════════════════════════════════════════
-- Fingrow — Research progress history (weekly snapshots)
-- Run this ONCE in the Supabase SQL editor, after admin.sql.
--
-- One row per (username, week_key). Upserted every state sync, so
-- within a week the latest in-week state wins. week_key matches
-- App.tsx's leagueWeekStart value (monday.toDateString()).
--
-- Drives: longitudinal trends, cohort-over-week deltas, retention
-- signals, and pre/post literacy comparisons on the admin dashboard.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.student_progress_history (
  username           text        not null,
  week_key           text        not null,
  recorded_at        timestamptz not null default now(),

  accuracy           real        not null default 0,
  mastered_count     int         not null default 0,
  questions_seen     int         not null default 0,
  questions_correct  int         not null default 0,
  league_points      int         not null default 0,
  streak             int         not null default 0,
  daily_done_today   int         not null default 0,
  transactions_count int         not null default 0,
  ribbons_count      int         not null default 0,

  details            jsonb,

  primary key (username, week_key)
);

-- Cohort / week comparisons: order by week then best accuracy
create index if not exists student_progress_history_week_idx
  on public.student_progress_history (week_key, accuracy desc);

-- Per-student history lookup: newest first
create index if not exists student_progress_history_user_idx
  on public.student_progress_history (username, week_key desc);

-- ── Row Level Security ──
-- Open RLS matches the rest of fingrow's research pilot pattern.
alter table public.student_progress_history enable row level security;

drop policy if exists "Read history" on public.student_progress_history;
create policy "Read history"
  on public.student_progress_history for select
  using (true);

drop policy if exists "Anonymous history upsert" on public.student_progress_history;
create policy "Anonymous history upsert"
  on public.student_progress_history for insert
  with check (true);

drop policy if exists "Anonymous history update" on public.student_progress_history;
create policy "Anonymous history update"
  on public.student_progress_history for update
  using (true)
  with check (true);
