# PROJECT CONTINUATION DOCUMENT
## Session 7 — 31 May 2026

> Supersedes `AI_Continuation_Document-29May2026-1530.md` (Session 6). Where this
> doc and the older one disagree, THIS one wins.

### 1. PROJECT IDENTITY

- **Project Name:** fingrow
- **What This Project Is:** A mobile-first, dark-first financial-literacy gamification PWA for Singapore Junior College (JC) students aged 16–18. Students learn budgeting, investing, debt, scams and CPF through a daily Learn hub, real expense tracking ("My Wallet"), a stock simulator, a life simulator (age 8→65), and standalone minigames. Progress is gamified with coins (cosmetic), XP (level), and a League-of-Legends-style ranked ladder of "League Points" (LP).
- **Primary Objective:** Drive daily-active engagement with financial concepts via short, replayable game loops + cross-mode rewards so JC students retain knowledge before handling real money.
- **Strategic Intent:** Become the de-facto financial-literacy app for SG schools — the competing-with-classmates loop (Supabase leaderboard) + locally-relevant content (CPF, DBS scams, BTO, HDB, GST, SDIC) is the moat.
- **Hard Constraints:**
  - **Mobile-only**, single column, `max-w-md mx-auto` (448px) container, fixed glass bottom nav. No desktop layouts.
  - **Dark-first** CSS-variable theme (`--bg-main`, `--bg-card`, `--bg-elevated`, `--text-main`, `--text-muted`, `--border-color`) flipped via `[data-theme]`. Light exists but dark is canonical.
  - **App must remain playable with NO backend auth** (anonymous `fingrow_uid`). Supabase is optional + env-gated (`SUPABASE_ENABLED`).
  - **All user state in localStorage** under one keyed blob (`fingrow_v6`). Bump the version suffix only when you must NUKE data; additive fields use the defensive merge instead (see §4/§5).
  - **No new dependencies without asking.** Allowlist: React 19, TypeScript, Vite 6, Tailwind v4, motion/react (Framer Motion), lucide-react, canvas-confetti, @supabase/supabase-js. (Note: package.json also lists `@google/genai`, `express`, `recharts`, `dotenv` from the AI-Studio scaffold; the app code does NOT use them — don't build on them.)
  - **JC-level pedagogy**, MAS/MoneySense/CPF-accurate SG facts.
  - No emojis in code comments unless user-facing. Mojibake in App.tsx box-drawing comments is known/intentional-to-leave.

### 2. WHAT EXISTS RIGHT NOW

**Built and working (all verified by `npm run build` + preview this session):**
- **Avatar** (`Avatar.tsx`): SVG mascot, fixed `0 0 220 220` viewBox, 10 slots, user-pickable skin/hair/eye hex, mood-driven face.
- **Dashboard** (in `App.tsx`): avatar hero + XP bar; **redesigned "Today's Challenges"** = a headline Daily Challenge card + a **horizontal carousel** of the 3 new mini-challenges + a compact 3-up utility row (Log Expense / Minigames / My Buddy); Weekly Quests card; **Trophies strip** (compact horizontal badges + "View all ›"); Quick Stats.
- **Learn** (`LearnTab.tsx`): Daily Challenge (1 hard MCQ/day, +150 LP) + Practice (unlimited easy/medium, +5 LP, **cap +120/day**) + Mastery Climb + **3 new once-per-day mini-challenges**: Higher-or-Lower, Guesstimate, Myth-or-Fact (each deep-linkable from the dashboard).
- **3 new Learn mini-games** (`src/components/learn/{HigherLower,Guesstimate,MythOrFact}.tsx`): black-box leaves, report results via `onComplete` → `App.handleDailyChallengeComplete`.
- **Trophies full screen** (`TrophiesScreen.tsx`): all 6 Frugal Ribbons (earned/locked + unlock conditions + progress bar + Play-Life CTA). Routed at `activeTab === "trophies"`; Home stays highlighted via BottomNav `matches`.
- **Wallet** (`WalletTab.tsx`): **circular budget ring** ("left to spend"), income/expense split, spending donut, grouped Today/Yesterday list, add/budget bottom sheets.
- **Stocks** (`StocksTab.tsx`): 6-stock sim, sparklines, buy/sell, owned-position "Worth $X" line.
- **Life Simulator** (`LifeTab.tsx`): scenarios age 8→65, fires `onLifeEnded` with `choicesMade[]` → ribbon detection.
- **League** (`LeagueTab.tsx`): 10-tier LoL ladder, rank showcase, weekly leaderboard with **top-3 podium tints**, Supabase Live/Offline chip.
- **Minigames hub** (`GamesHub.tsx`): Stock Trader, Life Sim, Scam Spotter, Bao Stand Tycoon.
- **Scam Spotter** + **Bao Stand Tycoon** (`src/components/games/`): unchanged from Session 6, working.
- **Account system** (`AccountModal.tsx`): welcome/signup/login/profile. SHA-256 hashed passwords. **Now Supabase-backed for cross-device login** (see §4) with graceful local fallback.
- **First-run onboarding** (`Onboarding.tsx`): 3-slide intro → Create account / Log in / Continue-as-guest, shown once via `fingrow_onboarded` flag.
- **5 LP mechanisms** (Streak Shield, Mastery Climb, Weekly Quests, Frugal Ribbons, Budget Streak): all live (from Session 6).

**Partially built / caveats:**
- **Supabase cross-device accounts**: code complete; user RAN the `accounts` table migration this session ("Success. No rows returned"). NOT yet verified end-to-end across two real devices on the deployed (Netlify) build. Accounts created BEFORE the migration only sync after the next login on their original browser (backfill).
- **Streak Shield freeze**: `freezeUsedThisWeek`/`freezeWeekStart` reset Mondays but the consume-on-miss logic is STILL not implemented (carried from Session 6).

**Broken or blocked:** Nothing functionally broken. `npm run build` is clean. Pre-existing `tsc --noEmit` errors remain (React namespace + a couple of types) — Vite/esbuild ignores them; see §5.

**Not started:** Streak Freeze auto-apply; the 3 unbuilt game proposals (Compound Quest, Debt Dash, Portfolio Panic — these are the original *minigame* ideas, distinct from the Learn mini-challenges built this session); Supabase Auth (stronger security); per-user ribbon/quest sync to Supabase (still local-only); porting remaining Stitch screens into code (Avatar flat-mascot, etc.).

### 3. ARCHITECTURE & TECHNICAL MAP

- **Tech stack:** Vite 6 + React 19 + TS (`noEmit`, bundler resolution; Vite is the only transpiler, `tsc` is IDE-only). Tailwind v4 (`@theme` + CSS vars). motion/react. lucide-react. canvas-confetti. Optional Supabase.
- **Repo root:** `C:\Users\luong\Downloads\fingrow`. Entry `src/main.tsx` → `src/App.tsx`. Styles `src/index.css`. Supabase SQL `supabase/schema.sql`.
- **Key files:**
  - `src/App.tsx` (~1100 lines) — central state owner (`useLocalStorage<UserState>("fingrow_v6")`), all handlers, all routing via `activeTab: NavTab`, dashboard JSX, `MissionCard`/`CountUp` helpers, onboarding + account-modal wiring (`learnInitialMode`, `accountInitialView`, `showOnboarding`, `fingrow_onboarded`).
  - `src/types.ts` — `UserState`, `DailyChallengeType`/`DailyChallengeResult`, `QuizQuestion`, `WeeklyQuest`, `QuestionMastery`, etc. UserState gained `higherLowerDate` / `guesstimateDate` / `mythFactDate` this session (additive).
  - `src/constants.ts` (~1200 lines) — `QUIZ_QUESTIONS` (now ~64; ~18 hard), `QUESTION_DIFFICULTY`, `LP_REWARDS` (incl. `PRACTICE_DAILY_CAP: 120`, `HL_PER_CORRECT`, `GUESS_MAX_PER`, `MYTH_PER_CORRECT`), `HIGHER_LOWER_PAIRS` (22), `GUESSTIMATE_ITEMS` (16), `MYTH_FACT_ITEMS` (23), `pickDailyHigherLower/Guesstimate/MythFact` (date-seeded), LoL ladder, mastery + ribbon registries, weekly-quest templates.
  - `src/components/` — all tabs + `RibbonsCard.tsx`, `TrophiesScreen.tsx`, `Onboarding.tsx`, `WeeklyQuestsCard.tsx`, `BottomNav.tsx`, `HowToPlayModal.tsx`, `AccountModal.tsx`, `Avatar.tsx`.
  - `src/components/learn/` — the 3 new mini-game components.
  - `src/lib/supabase.ts` — client + `syncScore`, `fetchWeeklyLeaderboard`, and NEW account helpers `fetchAccount` / `registerAccount` / `upsertAccount` + `AccountRow`. `SUPABASE_ENABLED` gates all.
  - `netlify.toml` (new) — build command, `publish = dist`, SPA redirect.
  - `FRONTEND_DESIGN_SPEC.md` (new) — paste-ready design brief for Google Stitch.
- **End-to-end flow:**
  1. Boot → `useLocalStorage` rehydrates `UserState`; **defensive merge** spreads `DEFAULT_STATE` first so new/optional fields auto-default for older saves.
  2. Mount effects: first-run onboarding gate (`!account && !fingrow_onboarded`), daily reset, stock refresh, weekly reset, Supabase score sync.
  3. `activeTab` routing (`NavTab` now includes `"trophies"`). Games tab + Home tab use `matches` to stay highlighted across sub-screens.
  4. Leaf components report completion via callbacks; **App.tsx handlers do ALL LP/streak/quest/tier/Supabase logic** (e.g. `handleLearnAnswer`, `handleDailyChallengeComplete`, `handleScamSpotterComplete`, `handleLifeEnded`).
- **Naming:** handlers `handleX`; storage keys `fingrow_*`; components PascalCase; LP values centralized in `LP_REWARDS`; tier colors only via `TIER_CONFIG`.
- **Storage keys (all current):** `fingrow_v6` (state), `fingrow_account`, `fingrow_users` (local account records map), `fingrow_uid` (anon leaderboard id), `fingrow_onboarded` (NEW this session), `fingrow_life_v1`.
- **External deps:** Supabase (optional, env-gated). Tables: `leaderboard` + NEW `accounts` (username PK, username_display, password_hash, avatar, full_name, email, school, age, joined_at, updated_at), both with open anonymous RLS. `.env` has `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (key is the new `sb_publishable_...` format). Web Crypto API for hashing.

### 4. RECENT WORK — WHAT JUST HAPPENED (HIGH PRIORITY)

**Worked on this session (chronological):**
1. **Ribbons UI** — built `RibbonsCard` (dashboard), later converted to a compact horizontal badge strip, plus a full `TrophiesScreen` (new `trophies` route + "View all").
2. **Fixed app title** in `index.html`: "My Google AI Studio App" → "fingrow — Financial Literacy for JC Students".
3. **Netlify leaderboard-offline fix** — root cause: `.env` is gitignored so `VITE_*` never reach Netlify; Vite inlines them at BUILD time. Fix = set both vars in Netlify env + redeploy. Added `netlify.toml` (build/publish/SPA redirect).
4. **Learn expansion** — added quiz questions; **raised `PRACTICE_DAILY_CAP` 50→120 (user-approved LP_REWARDS change)**; built 3 new daily challenges (Higher-or-Lower, Guesstimate, Myth-or-Fact) with date-seeded pickers, LP keys, components, LearnTab wiring, and `handleDailyChallengeComplete` (LP + streak + quiz-quest progress + tier). Added `higherLowerDate/guesstimateDate/mythFactDate` to UserState (additive, no key bump).
5. **Dashboard** — surfaced the 3 challenges in the mission grid with **deep-linking** (`learnInitialMode` prop on LearnTab), then restructured the section into the tiered hierarchy described in §2.
6. **Google Stitch MCP** — registered the `stitch` HTTP MCP server in `~/.claude.json` (user scope) by editing the file directly (the standalone `claude` CLI is NOT installed on this machine). Wrote `FRONTEND_DESIGN_SPEC.md`. Reviewed/generated (via Stitch web UI) and code-ported: Dashboard v2 (compact + hierarchy), Learn v2, Trophies screen, Wallet budget ring, League podium tints, Stocks position value. The flat-mascot Avatar + Higher-or-Lower-gameplay comps were generated in Stitch but NOT yet ported to code.
7. **Customization page cleanup** — root cause of the "messy" look was a **missing `.no-scrollbar` CSS utility** (referenced but never defined → native scrollbars rendered). Added it to `index.css`; switched `ShopTab` color rows to `flex-wrap`.
8. **First-run onboarding** — `Onboarding.tsx` + `AccountModal` `initialView` prop + `fingrow_onboarded` flag.
9. **Bug fix:** removed two stray `jcYear` references in `AccountModal` (`handleSignUp`/`handleUpdateProfile`) that would throw a ReferenceError and crash signup/profile-save.
10. **Diversified daily pools:** Daily Challenge MCQ 10→18, Higher-or-Lower 12→22, Guesstimate 8→16, Myth-or-Fact 13→23.
11. **Supabase cross-device accounts** — `accounts` table + RLS in `schema.sql`; `lib/supabase.ts` helpers; `AccountModal` signup/login/profile now DB-aware with **graceful local fallback** + **backfill of existing local accounts on login** + a `busy` state. User ran the SQL migration successfully.

**Decisions + reasoning (do not undo):**
- **No storage-key bump for the 3 new date fields.** They're purely additive; the documented defensive-merge pattern (how v5→v6 upgraders kept data) handles them. Bumping the key would WIPE every user's coins/LP/avatar. (The Session-6 working rule "bump on shape change" is overridden here for additive-only changes; bump only when nuking is intended.)
- **Mini-game LP routed through App.tsx**, never inside leaves — preserves the single-source-of-truth handler pattern.
- **Onboarding/overlays must NOT use `AnimatePresence mode="wait"`** — its exit animation STALLS in the headless preview (the same Framer-Motion timer stall noted for Scam Spotter), which froze slide content and could leave the `z-70` overlay above the modal. Reworked to keyed entrance animation; overlay rendered without an exit transition so it unmounts instantly.
- **Supabase accounts use open RLS + unsalted SHA-256** (matching the existing leaderboard model). Chosen for MVP speed and to reuse the existing project. Hashes are readable via the anon key — acceptable for a school MVP, NOT bank-grade. Stronger path = Supabase Auth (email + server-side salted hashing), deliberately deferred.
- **Graceful degradation everywhere for Supabase** — if the table is missing/offline, signup & login fall back to local-only so the app never breaks (verified in preview where the table didn't exist).
- **Stocks/League/Wallet got light, additive polish, NOT rewrites** — they already matched their Stitch comps; rewriting stable code would be risk without payoff.

**Discussed but NOT implemented:** Supabase Auth migration; porting the flat-mascot Avatar + gameplay screens into code; Streak Freeze auto-apply; the 3 unbuilt minigames; per-user ribbon/quest Supabase sync.

**Open threads:**
- Cross-device account login not yet confirmed on the live Netlify build (depends on Netlify having `VITE_SUPABASE_*` set + a redeploy since they were added).
- Stitch `generate`/`edit` MCP endpoints reject the API key ("Expected OAuth 2 access token") — only READ works via MCP. Generating new screens requires the Stitch web UI (user pastes prompts; AI reviews via MCP read).

### 5. WHAT COULD GO WRONG

**Known bugs / issues:**
- **Pre-existing `tsc --noEmit` errors (Vite ignores them, build is clean):** `React` namespace not found in `AccountModal.tsx` (~lines 569/581 after edits — `React.ReactNode` without a React import), `GamesHub.tsx`, `LifeTab.tsx` arithmetic on `unknown/symbol`, and a `key`-prop type mismatch in `WalletTab.tsx`. The `jcYear` errors are FIXED. None affect runtime.
- **Headless preview stalls** on continuous Framer-Motion timers (Scam Spotter playing phase) and on `AnimatePresence mode="wait"`. Verify such screens in a real browser, or via DOM/`preview_eval` rather than screenshots.
- **Streak Freeze** still not consumed on a missed day.

**Edge cases:**
- Daily reset / stock refresh run once on mount — a tab left open across midnight won't roll over until reload (acceptable MVP).
- Date-seeded daily pickers key off `toDateString()`; a timezone change mid-day could reshuffle.
- Mastery/daily gates use device clock — clock manipulation can speedrun (acceptable MVP).
- Ribbon detection is substring keyword-scan of the Life-sim choice log — brittle if scenario wording changes.

**Technical debt / shortcuts:**
- App.tsx ~1100 lines (monolithic by design — see §6).
- Account password hashing is unsalted SHA-256; `accounts` RLS is fully open.
- "Play Again" in Scam Spotter / Bao Tycoon still `window.location.reload()`.
- No automated tests.

**Risky assumptions to flag for the next AI:**
- DO NOT assume bumping `fingrow_v6` is safe — it wipes all users. Additive fields use the defensive merge instead.
- DO NOT assume Supabase is configured on Netlify — production leaderboard/accounts only work if the env vars are set there AND the build was redeployed after adding them, AND the `accounts` + `leaderboard` SQL has been run (accounts SQL WAS run this session; leaderboard SQL status on their dashboard is ❓).
- DO NOT assume usernames are device-local anymore — with the `accounts` table they are now GLOBALLY unique.
- `account.jcYear` still exists as an optional field on `AccountData` and is read in `LeagueTab` (renders nothing) — harmless; the input/state for it was removed.

### 6. HOW TO THINK ABOUT THIS PROJECT

1. **Core pattern — single-component state machine.** App.tsx owns the entire `UserState` and passes typed callbacks to black-box leaf components; leaves report a single "completion" event and never write parent state. Chosen because all state fits one localStorage blob with ~12 concentrated update sites; a state library would be ceremony. New games/challenges plug in by accepting an `onComplete`/`onAnswer` callback.
2. **Most common mistake** — reimplementing LP/streak/quest/Supabase logic inside a leaf component (or `useLocalStorage` in a leaf) instead of routing through an App.tsx handler. Second mistake: changing the storage key (or bumping its version) for an additive change, which wipes user data.
3. **Looks refactorable but is NOT:** App.tsx's length (keep monolithic until painful); the nested defensive-merge spread (each level matters); `window.location.reload()` "Play Again"; the `matches: []` arrays on BottomNav tabs; the duplicated mastery-LP math between `constants.nextMasteryLevel` and `LearnTab.handleAnswer` (LearnTab needs the delta before submitting). Also: do not "fix" the design by adopting `AnimatePresence mode="wait"` for overlays — it stalls here.

### 7. DO NOT TOUCH LIST

- Do NOT refactor App.tsx into multiple files / a state library without an explicit ask.
- Do NOT change the storage key `fingrow_v6` (or any `fingrow_*` key) — additive UserState fields use the defensive merge; a key change wipes data.
- Do NOT change persisted IDs: shop item IDs, avatar slot IDs, `WeeklyQuest.type` enum values, ribbon IDs, `DailyChallengeType` values.
- Do NOT change `LP_REWARDS` values without asking (they're calibrated to LoL tiers). `PRACTICE_DAILY_CAP` was changed to 120 WITH user approval this session — that's the new baseline.
- Do NOT introduce new dependencies (allowlist in §1). Don't build on the unused scaffold deps (`@google/genai`, `express`, `recharts`, `dotenv`).
- Do NOT touch `Avatar.tsx`'s `0 0 220 220` viewBox.
- Do NOT replace the 10-tier LoL ladder; do NOT add per-game leaderboards (one global LP race is intentional).
- Do NOT bulk-clean the mojibake comments in App.tsx (Edit anchors depend on exact bytes).
- Do NOT use `AnimatePresence mode="wait"` for full-screen overlays (stalls in preview).
- Preserve dark-first + mobile-only `max-w-md` everywhere.

### 8. CONFIDENCE & FRESHNESS

- **§1 IDENTITY:** ✅ HIGH — constraints reaffirmed/updated this session.
- **§2 WHAT EXISTS:** ✅ HIGH for everything built/edited this session (dashboard, Learn + 3 mini-games, Trophies, Wallet ring, onboarding, accounts, content pools — all build-passed + preview-verified). ⚠️ MEDIUM for untouched older bodies (LifeTab/ScamSpotter/BaoTycoon internals). ❓ LOW for live cross-device account behaviour on Netlify (not tested on two real devices).
- **§3 ARCHITECTURE:** ✅ HIGH — files/keys verified this session.
- **§4 RECENT WORK:** ✅ HIGH — all changes made, built, and (where possible) preview-verified this session.
- **§5 RISKS:** ✅ HIGH for the tsc errors, preview animation stall, and the Supabase security trade-off (all observed this session). ⚠️ MEDIUM for ribbon-keyword brittleness (not stress-tested).
- **§6 PHILOSOPHY / §7 DO NOT TOUCH:** ✅ HIGH — consistent with how every handler/leaf was built and with explicit user instructions across sessions.
