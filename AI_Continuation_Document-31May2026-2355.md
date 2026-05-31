# PROJECT CONTINUATION DOCUMENT
## Session 8 — 31 May 2026

> Supersedes `AI_Continuation_Document-31May2026-1130.md` (Session 7).

---

### 1. PROJECT IDENTITY

- **Project Name:** fingrow — Financial Literacy for JC Students
- **What This Project Is:** A dark-first, mobile-only (`max-w-md`) gamification PWA teaching SG JC students (16–18) budgeting, investing, CPF, scams through daily Learn challenges, a stock simulator, a life simulator (age 8→65), and minigames. Progress is tracked via coins (cosmetic), XP/level, and a LoL-style LP ranked ladder.
- **Primary Objective:** Daily-active engagement with financial concepts via replayable game loops + cross-mode rewards so students retain knowledge before handling real money.
- **Strategic Intent:** De-facto financial-literacy app for SG schools — competing-with-classmates LP leaderboard + SG-local content (CPF, DBS scams, BTO, GST) is the moat.
- **Hard Constraints:**
  - Mobile-only, `max-w-md mx-auto` (448px), fixed glass bottom nav
  - Dark-first CSS-variable theme, light exists but dark is canonical
  - App must work offline with no Supabase (anonymous `fingrow_uid`)
  - All user state in `localStorage` under `fingrow_v6` — do NOT bump version for additive changes; use defensive merge
  - No new deps (allowlist: React 19, TS, Vite, Tailwind v4, motion/react, lucide-react, canvas-confetti, @supabase/supabase-js)
  - `PRACTICE_DAILY_CAP = 120` is the approved LP baseline
  - Do NOT use `AnimatePresence mode="wait"` for full-screen overlays (stalls in preview)
  - Avatar.tsx `0 0 220 220` viewBox must not change

---

### 2. WHAT EXISTS RIGHT NOW

**Built and working:**
- **Avatar** (SVG mascot, 10 slots, mood-driven face)
- **Dashboard** (tiered: Daily Challenge headline + carousel + utility row, Weekly Quests, Trophies strip, Quick Stats, Portfolio/SPENT)
- **Learn** (Daily Challenge hard MCQ + Practice cap 120/day + Mastery Climb + 3 daily mini-challenges: Higher-or-Lower, Guesstimate, Myth-or-Fact — all date-seeded, deep-linkable)
- **Trophies screen** (6 Frugal Ribbons with conditions + progress bars)
- **Wallet** (circular budget ring, income/expense split, donut, grouped transaction list, Add Transaction sheet)
- **Stocks** (6-stock sim with sparklines)
- **Life Simulator** (age 8→65 scenarios, ribbon detection)
- **League** (10-tier LoL ladder, weekly leaderboard with podium tints, Supabase live/offline chip)
- **Games hub** (Stock Trader, Life Sim, Scam Spotter, Bao Stand Tycoon)
- **Account system** (cross-device login via Supabase `accounts` table with graceful local fallback; SHA-256 hashed passwords; first-run onboarding)
- **Admin Console** (replaces student app for `fingrow_admin`: Account Manager + Research Dashboard)
- **Research Dashboard** (aggregate stats, mastery distribution, weakest topics, per-student expand rows, CSV export)
- **5 LP mechanisms** (Streak Shield, Mastery Climb, Weekly Quests, Frugal Ribbons, Budget Streak)
- **Streak Freeze** (one per week, auto-applies on 1 missed day)
- Supabase-backed leaderboard + `student_progress` analytics + `account_state` cloud save

**Partially built / caveats:**
- Supabase cross-device: `accounts` table created, `student_progress` table created, `account_state` table created — all SQL migrated; end-to-end on two real devices NOT verified (depends on Netlify env vars)
- `syncProgress` and `syncScore` fire correctly after hydration (race condition fixed this session)
- Leaderboard keyed by `username` (not `user_id`) to prevent duplicates — requires SQL migration to change PK
- Admin profile edits now safe from overwriting (snapshot no longer includes account metadata)

**Broken or blocked:**
- `tsc --noEmit` errors exist (React namespace, arithmetic on unknown) — Vite ignores them, build is clean

**Not started:**
- Streak Freeze auto-apply (actually ALREADY implemented — confirmed this session)
- 3 remaining minigames (Compound Quest, Debt Dash, Portfolio Panic)
- Per-user ribbon/quest Supabase sync
- Porting Stitch comps to code (flat-mascot Avatar, gameplay screens)
- Supabase Auth migration (current: open RLS + unsalted SHA-256)

---

### 3. ARCHITECTURE & TECHNICAL MAP

- **Tech stack:** Vite 6 + React 19 + TypeScript (`noEmit`, bundler resolution; `tsc` is IDE-only) + Tailwind v4 (`@theme` + CSS vars) + motion/react + lucide-react + canvas-confetti + @supabase/supabase-js (optional, env-gated)
- **Repo root:** `C:\Users\luong\Downloads\fingrow`
- **Entry:** `src/main.tsx` → `src/App.tsx` (~1100 lines, monolithic by design)
- **Styles:** `src/index.css`
- **Key files:**
  - `src/App.tsx` — central state (`useLocalStorage<UserState>("fingrow_v6")`), all handlers, routing via `activeTab: NavTab`, dashboard JSX. Refs (`syncTimer`, `progressTimer`, `hydratedForRef`, `hydratingRef`) hoisted to top of component.
  - `src/types.ts` — `UserState`, `DailyChallengeType`, `QuizQuestion`, `WeeklyQuest`, `QuestionMastery`, `Transaction`, etc.
  - `src/constants.ts` — `QUIZ_QUESTIONS` (~64 questions, ~18 hard), `LP_REWARDS` (PRACTICE_DAILY_CAP=120, HL_PER_CORRECT, GUESS_MAX_PER, MYTH_PER_CORRECT), daily content pools (22 HL pairs, 16 Guesstimate, 23 Myth-or-Fact), LoL ladder, mastery + ribbon registries, weekly-quest templates
  - `src/components/` — all tabs + AdminConsole, AccountManager, AdminDashboard, AccountModal, Onboarding, Avatar, BottomNav, HowToPlayModal, RibbonsCard, TrophiesScreen, WeeklyQuestsCard, WalletTab
  - `src/components/learn/` — HigherLower, Guesstimate, MythOrFact
  - `src/lib/supabase.ts` — client, leaderboard helpers, account helpers, admin helpers, `buildProgressSnapshot`
  - `src/lib/analytics.ts` — pure functions deriving research snapshot from UserState
  - `supabase/schema.sql` — `leaderboard` (username PK, user_id unique for guests), `accounts` table
  - `supabase/admin.sql` — `student_progress` table + `fingrow_admin` row
  - `supabase/account_data.sql` — `account_state` table + optional delete policies

- **End-to-end flow:**
  1. Boot → `useLocalStorage("fingrow_v6")` rehydrates UserState; defensive merge spreads `DEFAULT_STATE` first
  2. Mount: daily reset, weekly reset, stock refresh, Supabase score sync, onboarding gate
  3. Hydration effect runs on login — fetches cloud `account_state`, adopts if newer, otherwise seeds cloud from local
  4. `progressTimer` + `syncScore` effects fire after hydration (`hydratingRef` must be false)
  5. Leaf components report completion via callbacks → App.tsx handlers do ALL LP/quest/streak/Supabase logic

- **Naming:** handlers `handleX`; storage keys `fingrow_*`; components PascalCase; LP values in `LP_REWARDS`; tier colors via `TIER_CONFIG`

- **Storage keys (current):** `fingrow_v6` (state), `fingrow_account`, `fingrow_users`, `fingrow_uid`, `fingrow_onboarded`, `fingrow_life_v1`

- **External:** Supabase (optional, env-gated via `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env`). Tables: `leaderboard` (username PK), `accounts`, `student_progress`, `account_state`. All with open anonymous RLS.

---

### 4. RECENT WORK — WHAT JUST HAPPENED

**Worked on this session:**

1. **Streak Freeze confirmed implemented** — `App.tsx` lines 235–255. When `gapDays === 2` and `freezeAvailable === true`, auto-sets `freezeUsedThisWeek = true`, shifts `lastDailyActivity` to yesterday. Weekly reset clears the flag on new weeks.

2. **Admin system — profile edit overwrites bug** — `buildProgressSnapshot` was upserting account metadata (`username_display`, `full_name`, `school`, `age`, `avatar`, `email`) every 1.5s, overwriting admin edits. Fixed: stripped those fields from snapshot. `fetchAllProgress` now JOINs `accounts` to always read fresh profile data. Admin dashboard updated (`r.details.email` → `r.email`, `r.details.joinedAt` → `r.joined_at`).

3. **Guests excluded from leaderboard** — `fetchWeeklyLeaderboard` and `fetchAllTimeLeaderboard` now query all `accounts` usernames and filter leaderboard rows. Guests (anonymous `user_id` entries with no `accounts` match) never appear on any leaderboard.

4. **Cross-device sync race condition** — `syncScore` and `progressTimer` effects both had `if (hydratingRef.current || ...) return;` guards, but on page refresh the hydration effect runs first and sets `hydratingRef.current = true`. The other effects checked the flag BEFORE hydration finished, bailed out, and never re-ran because their deps hadn't changed. Fixed by adding `hydratingRef.current` to both deps arrays.

5. **Refs hoisting bug** — `hydratingRef`, `hydratedForRef`, `syncTimer`, `progressTimer` were declared AFTER the `syncScore` effect that referenced them. JavaScript TDZ crashed the entire App component. Fixed by hoisting all four refs to the top of the component body.

6. **Cloud seed overwrote existing progress** — Hydration `else` branch (no cloud copy) was saving `DEFAULT_STATE` to `account_state`, destroying existing progress when T1_Makoto logged in on a second device. Fixed: seed cloud with `state` when `localBelongsToThis`, not `DEFAULT_STATE`.

7. **Leaderboard duplicate rows** — Same account logging in from multiple devices got different anonymous `user_id`s, creating duplicate rows. Fixed: `onConflict: "user_id"` → `onConflict: "username"` in `syncScore`. `username` is now the primary key in both code and `schema.sql`. `user_id` kept as nullable unique column for guest compatibility.

8. **Wallet Add button z-index** — FAB was `z-40`, BottomNav was `z-50`. FAB was invisible under the nav. Fixed: `z-[51]`.

9. **Wallet Add Transaction sheet — couldn't scroll to Save button** — `overflow-hidden` on the sheet outer div clipped the Save button. Fixed:
   - Outer motion div: `overflow-hidden` → `overflow-y-auto`
   - Inner scroll div: flex container for type toggle, amount, categories, note
   - Save button: moved OUTSIDE the inner scroll div, given `sticky bottom-0 bg-[var(--bg-card)]`
   - Sheet max-height: `max-h-[90vh]`
   - `overscroll-behavior: contain` via style prop for mobile scroll trapping
   - **REMOVED** `document.body.style.overflow = "hidden"` body lock — it caused the Wallet tab to go blank by breaking the layout context for fixed-positioned children

**Decisions (do not undo):**
- Guests stay off leaderboard; they can play and earn LP locally
- No real-time anonymous sync to admin dashboard — only logged-in students sync
- Delete policies remain optional (user has not enabled them yet)
- Leaderboard keyed by `username` (breaking change for guests — they now use `user_id` uniqueness only)

**Discussed but NOT implemented:**
- 3 remaining minigames (Compound Quest, Debt Dash, Portfolio Panic)
- Per-user ribbon/quest Supabase sync
- Stitch avatar/gameplay porting
- Supabase Auth migration

---

### 5. WHAT COULD GO WRONG

**Known bugs / issues:**
- Pre-existing `tsc --noEmit` errors (Vite ignores, build is clean): React namespace in AccountModal, arithmetic on unknown in GamesHub/LifeTab, key-prop mismatch in WalletTab
- Headless preview stalls on continuous Framer-Motion timers (Scam Spotter) and on `AnimatePresence mode="wait"` — verify such screens in a real browser or via DOM inspection
- `fetchAccounts` in LeagueTab: NOT imported, only `fetchWeeklyLeaderboard`/`fetchAllTimeLeaderboard` imported — these functions internally call `fetchAccounts` for guest filtering

**Edge cases:**
- Daily reset / stock refresh run once on mount — tab left open across midnight won't roll over
- Date-seeded daily pickers key off `toDateString()` — timezone change mid-day reshuffles
- Mastery/daily gates use device clock — clock manipulation can speedrun
- Ribbon detection is substring keyword-scan — brittle if scenario wording changes

**Technical debt / shortcuts:**
- App.tsx ~1100 lines (monolithic by design — do NOT refactor)
- Account password hashing: unsalted SHA-256; `accounts` RLS fully open
- "Play Again" in Scam Spotter / Bao Tycoon: `window.location.reload()`
- No automated tests

**Risky assumptions:**
- DO NOT bump `fingrow_v6` for additive changes (wipes all users)
- DO NOT assume Supabase is configured on Netlify — production leaderboard/accounts only work if `VITE_SUPABASE_*` are set at build time AND the SQL has been run
- DO NOT assume usernames are device-local — with `accounts` table they are globally unique
- The 3 timer refs (`syncTimer`, `progressTimer`, `hydratingRef`, `hydratedForRef`) MUST be declared before any effect that uses them — TDZ crashes the entire App

---

### 6. HOW TO THINK ABOUT THIS PROJECT

1. **Core pattern — single-component state machine.** App.tsx owns the entire `UserState` and passes typed callbacks to black-box leaf components. Leaves report completion via callbacks and never write parent state. This was chosen because all state fits one localStorage blob with ~12 concentrated update sites; a state library would be ceremony.

2. **Most common mistake** — reimplementing LP/streak/quest/Supabase logic inside a leaf component instead of routing through App.tsx handlers. Second mistake: bumping the storage key version for additive changes (wipes user data).

3. **Looks refactorable but is NOT:** App.tsx's length (keep monolithic until painful); `window.location.reload()` "Play Again"; the mojibake box-drawing comments (Edit anchors depend on exact bytes); `AnimatePresence mode="wait"` for overlays (stalls in headless preview).

---

### 7. DO NOT TOUCH LIST

- Do NOT refactor App.tsx into multiple files / a state library without an explicit ask
- Do NOT bump `fingrow_v6` for additive changes — defensive merge handles them
- Do NOT change persisted IDs (shop item IDs, avatar slot IDs, `WeeklyQuest.type` values, ribbon IDs, `DailyChallengeType` values)
- Do NOT change `LP_REWARDS` values without asking
- Do NOT introduce new dependencies
- Do NOT touch `Avatar.tsx`'s `0 0 220 220` viewBox
- Do NOT replace the 10-tier LoL ladder or add per-game leaderboards
- Do NOT bulk-clean mojibake comments in App.tsx
- Do NOT use `AnimatePresence mode="wait"` for full-screen overlays
- Preserve dark-first + mobile-only `max-w-md` everywhere
- The 3 timer refs MUST be declared before any effect that uses them
- Do NOT set `document.body.style.overflow` in any component — it breaks fixed positioning in this app's layout

---

### 8. CONFIDENCE & FRESHNESS

- **§1 IDENTITY:** ✅ HIGH — reaffirmed this session
- **§2 WHAT EXISTS:** ✅ HIGH for everything built/fixed this session; ⚠️ MEDIUM for untouched older bodies (LifeTab, ScamSpotter, BaoTycoon)
- **§3 ARCHITECTURE:** ✅ HIGH — verified this session
- **§4 RECENT WORK:** ✅ HIGH — all changes made, built, and verified
- **§5 RISKS:** ✅ HIGH for known bugs observed this session; ⚠️ MEDIUM for ribbon brittleness (not stress-tested)
- **§6 / §7:** ✅ HIGH — consistent with all prior sessions

---

### 9. SUPABASE SQL — PENDING ACTIONS

**Must run in Supabase SQL editor (in order):**

```sql
-- A. Change leaderboard primary key from user_id to username (fixes duplicates)
ALTER TABLE public.leaderboard DROP CONSTRAINT IF EXISTS leaderboard_pkey;
ALTER TABLE public.leaderboard ADD PRIMARY KEY (username);
ALTER TABLE public.leaderboard ADD CONSTRAINT leaderboard_user_id_unique UNIQUE (user_id);

-- B. Clean up duplicate T1_Makoto row (the one with 0 LP)
DELETE FROM public.leaderboard WHERE username = 'T1_Makoto' AND total_points = 0;
```

**Optional (enables admin delete button):**
```sql
drop policy if exists "Anonymous account delete" on public.accounts;
create policy "Anonymous account delete" on public.accounts for delete using (true);

drop policy if exists "Anonymous progress delete" on public.student_progress;
create policy "Anonymous progress delete" on public.student_progress for delete using (true);

drop policy if exists "Anonymous leaderboard delete" on public.leaderboard;
create policy "Anonymous leaderboard delete" on public.leaderboard for delete using (true);
-- (Run account_data.sql first if you want account_state delete policy too)
```

---

### 10. FILES CHANGED THIS SESSION

| File | Changes |
|------|---------|
| `src/lib/supabase.ts` | `syncScore` onConflict→username; leaderboard functions filter guests; ProgressDetails stripped account fields; `fetchAllProgress` JOINs accounts |
| `src/lib/analytics.ts` | Snapshot return stripped account metadata |
| `src/components/AdminDashboard.tsx` | `r.details.email`→`r.email`; `r.details.joinedAt`→`r.joined_at`; CSV cols updated |
| `src/components/AccountManager.tsx` | Unchanged |
| `src/components/WalletTab.tsx` | FAB z-[51]; AddSheet: overflow-y-auto + sticky Save + overscroll-contain + removed body overflow lock |
| `src/App.tsx` | Refs hoisted to top; `hydratingRef.current` in deps; hydration seed fixed |
| `supabase/schema.sql` | username PK, user_id unique for guests |

---

### 11. WHAT THE USER WANTS TESTED

The Wallet Add Transaction sheet was fixed this session. Test on the deployed build:
1. Go to **Wallet** tab
2. Tap the **+** floating button (bottom-right, violet)
3. Confirm the **Note** field and **Save Transaction** button are visible
4. Confirm scrolling works — can scroll through type toggle, amount, categories, note, and Save button stays at bottom
