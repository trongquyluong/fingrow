-- ════════════════════════════════════════════════════════════════════
-- Fingrow leaderboard schema
-- Run this once in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.leaderboard (
  user_id      text,
  username     text primary key,  -- PK: registered students use their account username; guests use their user_id
  avatar       text        not null default '⭐',
  total_points int         not null default 0,
  week_points  int         not null default 0,
  tier         text        not null default 'bronze',
  week_start   text        not null,
  updated_at   timestamptz not null default now(),
  unique (user_id)  -- guests (no username) keep a unique user_id for their anonymous entry
);

create index if not exists leaderboard_week_idx
  on public.leaderboard (week_start, week_points desc);

create index if not exists leaderboard_total_idx
  on public.leaderboard (total_points desc);

-- ── Row Level Security ──
-- Anyone can READ the leaderboard (it's public).
-- Anyone can INSERT/UPDATE rows by their username (registered students) or
--   user_id (anonymous guests). Open RLS suits the research pilot MVP.
alter table public.leaderboard enable row level security;

drop policy if exists "Read leaderboard" on public.leaderboard;
create policy "Read leaderboard"
  on public.leaderboard for select
  using (true);

drop policy if exists "Anonymous upsert" on public.leaderboard;
create policy "Anonymous upsert"
  on public.leaderboard for insert
  with check (true);

drop policy if exists "Anonymous update" on public.leaderboard;
create policy "Anonymous update"
  on public.leaderboard for update
  using (true)
  with check (true);

-- ════════════════════════════════════════════════════════════════════
-- Accounts (cross-device login)
-- Lets a student log in from any device/browser. Passwords are SHA-256
-- hashed in the browser before being stored — plaintext never reaches here.
-- NOTE: with the anonymous (publishable) key + open RLS below, password
-- HASHES are readable, like the leaderboard. This is acceptable for a
-- school MVP but is NOT bank-grade. For stronger security, migrate to
-- Supabase Auth (email + server-side salted hashing).
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.accounts (
  username         text primary key,          -- lowercased, unique
  username_display text        not null,
  password_hash    text        not null,
  avatar           text        not null default '🦁',
  full_name        text,
  email            text,
  school           text,
  age              int,
  joined_at        timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.accounts enable row level security;

-- Anyone can look up an account (needed to verify login client-side).
drop policy if exists "Read accounts" on public.accounts;
create policy "Read accounts"
  on public.accounts for select
  using (true);

-- Anyone can register a new username (PK prevents duplicates).
drop policy if exists "Anonymous register" on public.accounts;
create policy "Anonymous register"
  on public.accounts for insert
  with check (true);

-- Anyone can update (profile edits / backfill). Tighten with auth later.
drop policy if exists "Anonymous account update" on public.accounts;
create policy "Anonymous account update"
  on public.accounts for update
  using (true)
  with check (true);
