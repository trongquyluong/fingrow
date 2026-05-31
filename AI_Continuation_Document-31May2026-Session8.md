# PROJECT CONTINUATION DOCUMENT
## Session 8 — 31 May 2026 (Evening)

> Supersedes `AI_Continuation_Document-31May2026-1130.md` (Session 7).

---

## 1. WHAT WAS FIXED THIS SESSION

### Admin system bugs
- **`syncProgress` overwrites admin profile edits** — `buildProgressSnapshot` was including `username_display`, `full_name`, `school`, `age`, `avatar`, `email` in the snapshot and upserting them every 1.5s, overwriting admin edits. Fixed by stripping those fields from the snapshot return. Admin dashboard now JOINs `accounts` to always read fresh profile data.
- **`fetchAllProgress` now JOINs `accounts`** — `select("*, accounts(...)")` so admin sees live profile data; `joined_at` and `email` moved to top-level fields.
- **Guests excluded from leaderboard** — `fetchWeeklyLeaderboard` and `fetchAllTimeLeaderboard` now fetch all `accounts` usernames and filter the leaderboard to only registered students. Guests (anonymous `user_id` entries) never appear.

### Cross-device sync bugs
- **Hydration race condition** — Both `syncScore` and `progressTimer` effects had `if (hydratingRef.current || ...) return;` guards, but on page refresh the hydration effect set `hydratingRef.current = true` AFTER the other effects had already checked it. Neither re-ran when hydration finished because their deps hadn't changed. Fixed by adding `hydratingRef.current` to both deps arrays.
- **Refs hoisting bug** — `hydratingRef`, `hydratedForRef`, `syncTimer`, `progressTimer` were declared AFTER the `syncScore` effect that referenced them. JavaScript TDZ crashed the entire App. Fixed by hoisting all four refs to the top of the component (before any effects).
- **Cloud seed overwrote existing progress** — The hydration `else` branch (no cloud copy) was saving `DEFAULT_STATE` to the cloud on every same-account login, destroying existing progress. Fixed: `seed = state` when `localBelongsToThis`, not `DEFAULT_STATE`.

### Leaderboard deduplication
- **Leaderboard keyed by `user_id` (duplicates)** — Same account logging in from multiple devices got different anonymous `user_id`s, creating duplicate leaderboard rows. Fixed: `onConflict: "user_id"` → `onConflict: "username"` in `syncScore`. `username` is now the primary key in both the code and `schema.sql`.
- **`schema.sql` updated** — `username` is now primary key, `user_id` kept as nullable unique column for guest compatibility.

### UI bugs
- **Wallet Add button invisible** — Floating button was `z-40`, BottomNav was `z-50`. Fixed: `z-[51]`.
- **Wallet Add Transaction sheet couldn't scroll to Save button** — `overflow-hidden` on the sheet outer div clipped the Save button which was inside a nested scroll div. Fixed:
  - Outer motion div: `overflow-hidden` → `overflow-y-auto overscroll-contain`
  - Save button: moved OUTSIDE the inner scroll div, given `sticky bottom-0 bg-[var(--bg-card)]`
  - `overflow: hidden` on `<body>` set when sheet is open (prevents page scroll)

---

## 2. SUPABASE SQL CHANGES NEEDED

Run in the Supabase SQL editor (in order):

### A. Update leaderboard schema (fixes duplicate rows)
```sql
ALTER TABLE public.leaderboard DROP CONSTRAINT IF EXISTS leaderboard_pkey;
ALTER TABLE public.leaderboard ADD PRIMARY KEY (username);
ALTER TABLE public.leaderboard ADD CONSTRAINT leaderboard_user_id_unique UNIQUE (user_id);
```

### B. Clean up duplicate T1_Makoto row
```sql
-- Check first
SELECT username, total_points, week_points FROM public.leaderboard WHERE username = 'T1_Makoto';

-- Delete the one with 0 LP
DELETE FROM public.leaderboard WHERE username = 'T1_Makoto' AND total_points = 0;
```

### C. Enable delete policies (optional — for admin delete button)
```sql
drop policy if exists "Anonymous account delete" on public.accounts;
create policy "Anonymous account delete" on public.accounts for delete using (true);

drop policy if exists "Anonymous progress delete" on public.student_progress;
create policy "Anonymous progress delete" on public.student_progress for delete using (true);

drop policy if exists "Anonymous leaderboard delete" on public.leaderboard;
create policy "Anonymous leaderboard delete" on public.leaderboard for delete using (true);
```
Note: Run `account_data.sql` first if you want `account_state` delete policy too.

---

## 3. FILES CHANGED THIS SESSION

| File | Changes |
|------|---------|
| `src/lib/supabase.ts` | `syncScore` onConflict → username; `fetchAllProgress` JOINs accounts; leaderboard filters guests; removed account fields from ProgressDetails |
| `src/lib/analytics.ts` | Removed account metadata from `buildProgressSnapshot` return |
| `src/components/AdminDashboard.tsx` | `r.details.email` → `r.email`; `r.details.joinedAt` → `r.joined_at`; CSV cols updated |
| `src/App.tsx` | Refs hoisted to top; `hydratingRef.current` added to sync/progress deps; hydration seed fixed |
| `src/components/WalletTab.tsx` | AddSheet scroll fixed (overflow-y-auto + sticky Save); z-[51] on FAB; body scroll lock |
| `supabase/schema.sql` | username PK, user_id unique for guests |

---

## 4. WHAT WAS DECIDED THIS SESSION

- **Guests stay off leaderboard** — Only registered accounts appear. Guests can still play and earn LP locally.
- **Real-time admin data: NO** — Guests do NOT sync anonymously. Only logged-in students sync to `student_progress`. Admins must wait for students to log in to see their data. This was explicitly chosen.
- **Streak Freeze: already implemented** — Confirmed working. The freeze auto-applies when `gapDays === 2` and the weekly freeze is available.
- **Onboarding → Account guest mode** — Still present. Guests can continue without an account; their data stays local.

---

## 5. DO NOT TOUCH (same as Session 7)

- Do NOT refactor App.tsx into multiple files
- Do NOT bump `fingrow_v6` for additive changes
- Do NOT change `LP_REWARDS` values
- Do NOT add new dependencies
- Do NOT use `AnimatePresence mode="wait"` for overlays
- Preserve dark-first, mobile-only `max-w-md`
- Do NOT touch `Avatar.tsx`'s `0 0 220 220` viewBox
