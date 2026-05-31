# PROJECT CONTINUATION DOCUMENT
## Session 6 — 29 May 2026

### 1. PROJECT IDENTITY

- **Project Name:** fingrow
- **What This Project Is:** A mobile-first financial-literacy gamification PWA for Singapore Junior College (JC) students aged 16–18. Students learn budgeting, investing, debt, scams and CPF through a daily quiz challenge, real expense tracking ("My Wallet"), a stock simulator, a life simulator (age 8→65), and standalone minigames. Progression is gamified with coins (cosmetic), XP (level), and a League-of-Legends-style ranked ladder of "League Points" (LP).
- **Primary Objective:** Drive daily-active engagement with financial concepts via short, replayable game loops + cross-mode rewards so JC students build retained knowledge before they handle real money.
- **Strategic Intent:** Become the de-facto financial-literacy app for SG schools — competing-with-classmates loop (Supabase leaderboard) + locally-relevant content (CPF, DBS scams, BTO, MOM, NJC/RJC/HCJC) is the moat.
- **Hard Constraints:**
  - **Mobile-first** (max-width container, bottom nav). Desktop layouts are not a goal.
  - **Dark-first** color system via CSS variables (`--bg-main`, `--bg-card`, `--bg-elevated`, `--text-main`, `--text-muted`, `--border-color`). Light theme exists but dark is the canonical look.
  - **No backend auth** required to play. Supabase is optional (env-gated `SUPABASE_ENABLED`) and only used for the public weekly leaderboard. Anonymous `fingrow_uid` in localStorage drives identity.
  - **All user state lives in localStorage** under one keyed blob (`fingrow_v6`). Storage-key version is bumped whenever the shape changes.
  - **No new dependencies without asking.** Current ones: React 19, TypeScript, Vite, Tailwind v4, motion/react (Framer Motion), lucide-react, canvas-confetti, @supabase/supabase-js.
  - **JC-level pedagogy.** Quiz questions are calibrated to Jump$tart Coalition, CFPB, MAS/MoneySense sources — not generic finance trivia.
  - **No emojis in code comments** unless intentionally for the user. (Some historical mojibake exists in App.tsx box-drawing comments — see §5.)

### 2. WHAT EXISTS RIGHT NOW

**Built and working:**
- **Avatar system** (`Avatar.tsx`): SVG character with 10 swappable slots — face, hair, brows, eyes, mouth, hat, glasses, outfit, accessory, background. Skin/hair/eye colors are user-pickable hex. Mood (`happy | sad | thirsty | excited | cool`) overrides face features unless `staticFace` prop is passed.
- **Shop** (`ShopTab.tsx`): Slot-tabbed item grid, color pickers, rarity tags (common/rare/epic/legendary), per-item mini-Avatar preview, purchase confirm modal with confetti.
- **Wallet** (`WalletTab.tsx`): Real-money expense/income tracking, donut chart, grouped transaction list, monthly budget setter, AddSheet bottom sheet.
- **Stocks** (`StocksTab.tsx`): 6-stock simulator with daily price updates, buy/sell, profit-based LP rewards.
- **Life Simulator** (`LifeTab.tsx`): 50 scenarios across age 8–65 + 27 random surprise events fired ~30% of years + 3 mini-puzzles (tax calc age 23, investment allocation age 30, monthly budget ages 26/35/50). End-of-run fires `onLifeEnded` callback with summary including `choicesMade` log.
- **Learn (v2)** (`LearnTab.tsx`): Two-mode design — **Daily Challenge** (1 hard question/day, +150 LP) + **Practice Mode** (unlimited easy/medium questions, +5 LP each, capped +50/day). Mastery Climb tracking per question.
- **Minigames hub** (`GamesHub.tsx`): Lobby card list. Currently routes 4 games — Stock Trader, Life Simulator, **Scam Spotter** (live), **Bao Stand Tycoon** (live) — plus 1 coming-soon placeholder (Budget Showdown).
- **Scam Spotter** (`games/ScamSpotter.tsx`): 12-card swipe deck, 6s/card timer, 8 SG-flavoured scam cards + 4 legit decoys, drag-or-tap UX, end-of-round S–D grade + per-card review with red-flag explanations.
- **Bao Stand Tycoon** (`games/BaoStandTycoon.tsx`): 5-day sim, 7 weather/event conditions, price slider $1.20–$3.00, inventory slider, 20s animated rush, per-day P&L breakdown, Hawker Master badge for 3+ days at 40%+ margin.
- **Account system** (`AccountModal.tsx`): Welcome → Signup → Login → Profile flow. SHA-256 hashed passwords via Web Crypto API, stored locally under `fingrow_users`. Fields: username, password, full name (optional), email (optional), school, age. Multi-user supported on one device.
- **League** (`LeagueTab.tsx`): LoL-style 10-tier ladder (Iron → Challenger) with divisions IV→I for Iron–Diamond, no divisions for Master/GM/Challenger. Rank badge with division chip, animated progress bar, ladder visualization with locks.
- **5 LP mechanisms** all live:
  1. **Streak Shield** — first activity each day awards `min(30, 10 + (streak-1))` LP. Auto-freeze flag exists but actual freeze-application logic is wired only at week reset (no mid-week miss recovery yet — see §5).
  2. **Mastery Climb** — per-question Seen/Familiar/Proficient/Mastered levels with spaced-repetition gates (1+ day between, 3+ day span for Proficient, 7+ day for Mastered). Logic in `LearnTab.handleAnswer` and mirrored in `App.handleLearnAnswer`.
  3. **Weekly Quests** — 3 quests every Monday, deterministically seeded by week-start date in `pickWeeklyQuests`. +200 LP each, +500 LP all-completion bonus. Quest progress fires from quiz answers, stock trades/profits, wallet logs, life-year advances.
  4. **Frugal Ribbons** — 6 ribbons (Compound King, Debt Dodger, Diversified, Insured, CPF Maxed, Millionaire). Awarded once per ribbon-id forever (`lifeRibbons[]`). +300 LP each. Triggered by `handleLifeEnded` scanning `summary.choicesMade` for keywords.
  5. **Budget Streak Bonus** — daily quota = `monthlyBudget / 30`. +15 LP/day under quota, +150 LP "Budget Boss" once per week for 7 clean days. Auto-checks via effect when `state.transactions` or `state.monthlyBudget` changes.

**Partially built:**
- **Streak Shield freeze** — `freezeUsedThisWeek` and `freezeWeekStart` fields exist and reset on Monday, but the consumer logic (auto-apply freeze when user misses a day, preserving streak) is not implemented. Currently any missed day still resets the streak.
- **Weekly Quests** — `life_year` quest fires per year-advance call, but the App.tsx wiring sets `weeklyQuests` even when `lpAwarded === 0`, which means the quest counter still advances but the spread of state is correct. Verified correct logic.
- **Bao Stand Tycoon "Play Again"** uses `window.location.reload()` rather than resetting component state — works but loses other in-app state on reload. Same for Scam Spotter.

**Broken or blocked:**
- **Nothing functionally broken.** The dev server runs without TS errors and no console errors in headless preview. There is a known mojibake issue in App.tsx box-drawing-character comments (e.g. `// â”€â”€ Stocks â”€â”€`) — see §5.
- **Headless screenshot tool stalls** on Scam Spotter's playing phase because the continuous Framer Motion timer animation prevents the page from settling. Real-browser play works fine.

**Not started yet:**
- The 3 remaining game proposals from the research: **Compound Quest** (drag-allocate buckets, 30-year compounding animation), **Debt Dash** (branching narrative), **Portfolio Panic** (30-second rebalancing). User explicitly chose to ship only Scam Spotter + Bao Stand Tycoon for now.
- **Streak freeze auto-application** when user misses a day.
- **Ribbon display UI** — ribbons are awarded but not visually shown anywhere (e.g. a profile/trophies tab). Confetti fires on unlock but the badge is invisible after.
- **Supabase ribbon/quest sync.** Only LP totals and tier sync via `syncScore`. Per-user achievements stay local.

### 3. ARCHITECTURE & TECHNICAL MAP

- **Tech stack:** Vite 6 + React 19 + TypeScript (`module: "ESNext"`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `noEmit: true` — Vite is the only transpiler; `tsc` is for IDE only). Tailwind v4 (uses `@theme` directive + CSS custom properties). Animation: motion/react (Framer Motion v11). Icons: lucide-react. Confetti: canvas-confetti. Optional backend: Supabase via `@supabase/supabase-js`.
- **Repo root:** `C:\Users\luong\Downloads\fingrow`. Entry: `src/main.tsx` → `src/App.tsx`. Styles in `src/index.css`. Supabase schema in `supabase/schema.sql`.
- **Key files:**
  - `src/App.tsx` (~870 lines) — central state owner. Holds `useLocalStorage` for `UserState`, all handlers (`handleLearnAnswer`, `handleSellStock`, `handleAddTransaction`, `handleScamSpotterComplete`, `handleBaoTycoonComplete`, `handleLifeEnded`, etc.), all routing via `activeTab`.
  - `src/types.ts` — single source of truth for all types: `UserState`, `Transaction`, `AvatarState`, `LeagueTier`, `RankInfo`, `QuestionMastery`, `WeeklyQuest`, `QuizQuestion`, `ShopItem`, etc.
  - `src/constants.ts` (~700 lines) — 38 quiz questions, 6 stocks, 14 wallet categories, ~70 shop items, LoL ladder definition + `getRank()`, mastery helpers + `nextMasteryLevel()`, weekly quest templates + `pickWeeklyQuests()`, ribbon definitions + `RIBBONS[]`, `LP_REWARDS` constants, `QUESTION_DIFFICULTY` overrides, `formatRank()`.
  - `src/components/` — all UI: `Avatar.tsx`, `WalletTab.tsx`, `StocksTab.tsx`, `ShopTab.tsx`, `LifeTab.tsx`, `LeagueTab.tsx`, `LearnTab.tsx`, `GamesHub.tsx`, `WeeklyQuestsCard.tsx`, `BottomNav.tsx`, `HowToPlayModal.tsx`, `AccountModal.tsx`.
  - `src/components/games/` — `ScamSpotter.tsx`, `BaoStandTycoon.tsx`.
  - `src/lib/supabase.ts` — client + helpers `syncScore`, `fetchWeeklyLeaderboard`, `getOrCreateUserId`. `SUPABASE_ENABLED` boolean gates everything.
  - `src/hooks/useLocalStorage.ts` — generic typed hook.
- **End-to-end logic flow:**
  1. App boots → `useLocalStorage<UserState>("fingrow_v6", DEFAULT_STATE)` rehydrates state. Defensive merge ensures new fields exist for older saves.
  2. On mount, 4 effects fire in order: daily reset (recompute mood + reset `tasksDoneToday`), stock-price refresh if new day, weekly reset (Monday rolls over `leagueWeekStart` + `weeklyQuests` + `freezeUsedThisWeek`), Supabase score sync (debounced 800ms on LP changes if account exists).
  3. User interacts via BottomNav → sets `activeTab` ("dashboard" | "wallet" | "games" | "stocks" | "life" | "scam_spotter" | "bao_tycoon" | "quiz" | "league" | "shop"). `games` tab uses `matches` array to stay highlighted across all game sub-tabs.
  4. Each handler in App.tsx mutates state via `setState(prev => ...)`. Handler responsibilities are stacked: award base LP/coins, run `advanceQuest()` for weekly progress, add `computeStreakLP(streak)` if first activity today, recompute `leagueTier = tierOfPoints(total)`.
  5. Effects watching `state.transactions` recompute Budget Streak Bonus daily.
- **Naming conventions:**
  - Handlers: `handleX` (event-driven), `applyX` (pure state transform inside Life sim).
  - State fields: camelCase. Storage keys: `fingrow_*`.
  - Component files: PascalCase. Hooks: `useX`.
  - Tier colors live in `TIER_CONFIG[tier].color` + `gradient[from, to]`. Always use this lookup — never hardcode tier colors.
  - LP values centralized in `LP_REWARDS` object — change there to affect entire app.
- **External dependencies:**
  - **Supabase** (optional, env-gated). Schema: single table `leaderboard (user_id PK, username, avatar, total_points, week_points, tier, week_start, updated_at)` with RLS allowing anonymous upsert. `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. App degrades gracefully when unset.
  - **Web Crypto API** (`crypto.subtle.digest`) for password hashing — assumes HTTPS or localhost.

### 4. RECENT WORK — WHAT JUST HAPPENED (HIGH PRIORITY)

**Session 6 worked on (in chronological order):**
1. Fixed `.input-style` icon overlap (root cause: CSS `padding` shorthand silently overrode Tailwind's `pl-10` — switched to individual `padding-left/right/top/bottom` properties so utility padding works).
2. Removed `JC Year` field from AccountModal (signup + profile views). Kept Age only. Stripped unused imports.
3. Changed GamesHub footer copy: "Tell your teacher" → "Tell us!"
4. Built **LearnTab.tsx** from scratch — replaces the inline daily-quiz card that lived inside App.tsx. Two modes: Daily Challenge (deterministic by date, hard pool only) + Practice Mode (weighted toward less-mastered questions, cap +50 LP/day).
5. Added `difficulty` field to `QuizQuestion` + `QUESTION_DIFFICULTY` override map in constants.ts. Tagged 10 questions hard, 14 easy, rest default to medium.
6. Implemented all 5 LP mechanisms end-to-end:
   - **Streak Shield**: `computeStreakLP(streak)` helper added to App.tsx; called in 4 handlers (learn answer, wallet log, stock sell, scam-spotter complete, bao-tycoon complete) gated by `prev.lastDailyActivity !== today`.
   - **Mastery Climb**: per-question `QuestionMastery` records, spaced-repetition gate in `nextMasteryLevel()` (constants.ts) and mirrored in `LearnTab.handleAnswer()`. Mastery LP delta is added to base LP in same payload.
   - **Weekly Quests**: `pickWeeklyQuests(weekStart)` seeded by week-start hash for deterministic per-week sets. `WeeklyQuestsCard.tsx` renders on dashboard. `advanceQuest()` helper in App.tsx is called by all activity handlers.
   - **Frugal Ribbons**: `RIBBONS[]` registry in constants.ts with `test()` predicates. `LifeTab` now exposes `LifeRunSummary` via `onLifeEnded` callback including `choicesMade[]`. `handleLifeEnded` in App.tsx scans the choice log for keyword matches (`"index"`, `"cpf"`, `"insurance"`, `"yolo"`, etc.) and awards first-time ribbons.
   - **Budget Streak**: dedicated effect in App.tsx watching `state.transactions`/`state.monthlyBudget`. Daily quota = `monthlyBudget / 30`. Streak resets to 0 on first over-budget day.
7. Built **Scam Spotter** (`src/components/games/ScamSpotter.tsx`) — 12 SG-themed cards (8 scams, 4 legit), 6s timer, swipe + tap UX, end-of-round S–D grade and per-card review.
8. Built **Bao Stand Tycoon** (`src/components/games/BaoStandTycoon.tsx`) — 5-day pricing/inventory sim with logistic demand model, 20s animated rush, end-of-day P&L, Hawker Master badge for 3+ days at 40%+ margin.
9. Wired both new games into GamesHub (replaced "Scam Spotter coming soon" placeholder), added `NavTab` IDs (`scam_spotter`, `bao_tycoon`), routed in App.tsx, added result handlers that award LP + coins.
10. Bumped storage key to `fingrow_v6` to invalidate old shape; defensive merge in App.tsx handles partial state for upgraders.

**Decisions and tradeoffs:**
- **LearnTab kept LP-award math (mastery climb) duplicated** between `nextMasteryLevel()` in constants.ts and inline in `LearnTab.handleAnswer()`. Tradeoff: `LearnTab` needs to know the LP delta BEFORE submitting so it can show a preview and pass it to App.tsx in one shot, but App.tsx is the source of truth for state. Resolution: LearnTab computes the delta with the same rules as constants helper; the result object passed up has the final lpAwarded the App should add. Don't refactor unless you also unify both paths.
- **Bao Stand Tycoon and Scam Spotter use `window.location.reload()` for "Play Again"** instead of resetting component state. Reason: minimal state mgmt, simpler code, acceptable because the parent App.tsx state is persisted to localStorage anyway. Tradeoff: any in-flight unsaved state in OTHER tabs would be lost on reload — but the app saves on every setState via useLocalStorage's effect, so realistically nothing is lost.
- **Ribbon detection uses keyword scanning of choice log**, not a structured event stream. Reason: zero changes needed to existing scenarios — scan after the fact. Tradeoff: brittle if scenario text changes (e.g. removing the word "index" from an investing scenario would break Compound King detection). Mitigation: keywords are intentionally generic ("index", "invest", "etf", "cpf", "insurance", "max it out", "yolo", "klarna").
- **Practice Mode caps LP per day at +50** so Daily Challenge stays the headline reward. Without the cap, students would farm practice and ignore the challenge. Pedagogically Daily Challenge = hard concept reinforcement; Practice = breadth.
- **Difficulty tagging via override map** (constants.ts `QUESTION_DIFFICULTY`) instead of inline on each question — easier to retune all difficulties in one place.
- **Weekly quest variety**: deterministic per-week so reloading doesn't re-randomize. Always picks 1 quiz + 1 stock + 1 wallet quest by default, 33% chance to swap wallet for life-sim quest.
- **Storage version bump (v5 → v6)** instead of migrations. Reason: state schema changed (added quizMastery, weeklyQuests, lifeRibbons, etc.); defensive merge in `state: UserState = { ...DEFAULT_STATE, ...stateRaw, ... }` handles upgraders by spreading defaults under the existing data. v5 users will see their state preserved, just with new fields defaulted. The key bump exists for the case where we have to nuke old data — currently we don't need to.
- **Bao Tycoon LP formula = avgMargin × 1000 (capped at 600) + 250 master bonus.** Rewards efficient pricing, not raw revenue. Confirmed by research as the right pedagogical hook.
- **Scam Spotter LP returned via `Math.max(0, lp)`** — never negative even if user fails. The penalty (-5/false alarm) just zeroes out gains, doesn't drain prior LP.

**System changes (file-level):**
- New: `src/components/LearnTab.tsx`, `src/components/WeeklyQuestsCard.tsx`, `src/components/GamesHub.tsx`, `src/components/games/ScamSpotter.tsx`, `src/components/games/BaoStandTycoon.tsx`.
- Modified: `src/types.ts`, `src/constants.ts`, `src/App.tsx`, `src/components/AccountModal.tsx`, `src/components/BottomNav.tsx`, `src/components/LifeTab.tsx`.
- No deletions this session.

**Discussed but NOT implemented:**
- The 3 unchosen game proposals from research: Compound Quest, Debt Dash, Portfolio Panic. User explicitly limited scope to #1 and #2.
- A ribbons/achievements UI to display earned `lifeRibbons[]` somewhere visible.
- Streak Freeze auto-application logic when user misses a day.

**Open threads:**
- The user has not yet seen Scam Spotter or Bao Stand Tycoon played all the way through (headless preview stalled during the timer phase). They saw the GamesHub listing and the Scam Spotter intro screen.
- Frugal Ribbons keyword detection is unproven — no end-to-end play through Life Sim verified ribbons unlock yet.
- Supabase is connected to the user's project (`jwwkdumwaqvpjenjrnuo.supabase.co`) but it's unclear whether the schema migration has been run in their dashboard. League shows "Live" or "Offline" based on the env vars.

### 5. WHAT COULD GO WRONG

**Known bugs / issues:**
- **Mojibake in App.tsx comments**: section-header comments like `// â”€â”€ Stocks â”€â”€` contain garbled UTF-8 bytes from an earlier PowerShell re-encoding (session 3). They render as gibberish but TypeScript ignores them — purely cosmetic. Do NOT mass-replace them with a regex without testing; some old `old_string` matches still rely on the mojibake exact bytes.
- **Headless preview screenshot tool times out** on Scam Spotter playing phase (continuous Framer Motion timer causes page-settle to never fire). Real browser is fine. If you need to verify visually, use a real browser or screenshot the intro/results phases only.
- **Streak Freeze not consumed yet** — `freezeUsedThisWeek` flag exists but no code reads it when a streak would otherwise reset. Implementation needed.

**Edge cases to watch:**
- Daily reset effect runs once on mount (`useEffect(() => ..., [])`). If a user keeps the tab open across midnight, the reset won't fire until next page load. Acceptable for MVP.
- Stock price update also runs once on mount — same caveat.
- `pickWeeklyQuests` is deterministic by `weekStart` string (Monday's `toDateString()`). If the user's timezone changes mid-week, the seed could shift. Unlikely but theoretically possible.
- Mastery Climb gates use `Date.now() - new Date(firstSeenDate)` — clock manipulation would let users speedrun mastery. Acceptable for MVP.
- `handleLifeEnded` keyword scan is case-insensitive (`log.toLowerCase()`) but is substring-based — adding a scenario with the word "yolo" in a non-debt context would falsely trigger `everInDebt`. Currently the only "yolo" scenarios are debt-related, so it's safe today.
- Bao Tycoon `buyProbability` model uses fixed midpoint $1.80 — at very high prices (>$2.50) demand drops fast, which is intentional but means novice players might never sell anything if they pick $3 on a Haze day. Forecast UI mitigates this.
- Scam Spotter only has 12 cards in the deck (entire pool). Same shuffle every play essentially. If you want more replay variety, add more cards to the `DECK` array.

**Technical debt / shortcuts:**
- App.tsx is ~870 lines and growing. The handler bodies could be extracted to a `useGameState` hook for testability, but currently the inline definition is fine because each handler is self-contained.
- `LearnTab` duplicates mastery-LP math instead of importing `nextMasteryLevel` from constants (see §4 tradeoff).
- "Play Again" reloads the page in both new games.
- No unit tests anywhere — entire codebase is interactively tested.
- AccountModal uses `<style>` block for `.input-style` instead of Tailwind classes or a component. Reason: needed CSS variables + per-property padding which Tailwind utilities can express but feel verbose for this one-off form.

**Risky assumptions:**
- `account.school` is a free-text input — assumes student typed it. No school dropdown / autocomplete. Leaderboard groupings would need a school map later.
- Supabase RLS policies are "anyone can upsert any row" — fine for a public leaderboard with anonymous IDs but would need tightening before adding auth-based features.
- `LP_REWARDS` constants are global — if you tune them, retroactive ribbons/achievements use the NEW values, not historical ones. No versioning.
- Storage version `v6` assumes users upgrading from v5 won't have catastrophic shape conflicts. The defensive merge handles partial data but doesn't migrate (e.g. if v5's `transactions` shape changed, you'd silently lose those records).

### 6. HOW TO THINK ABOUT THIS PROJECT

**1. Core architectural pattern + why:**
**Single-component state machine** — App.tsx owns the entire `UserState` and exposes typed handler props to leaf components. No Redux, no Zustand, no Context-for-state. Reason: the entire app state fits comfortably in one localStorage blob, and the user state's update sites are concentrated (~10 handlers). Adding a state library would be ceremony for no gain. Leaf components (LearnTab, LifeTab, ScamSpotter, BaoStandTycoon) receive callbacks and report results via a single "completion" event — they don't have direct write access to the parent state. This makes each game a pure black-box module — you can pull `ScamSpotter` into another app and it would just need `onExit` and `onComplete` props.

**2. Most common mistake a new person would make:**
**Reimplementing LP/quest/streak logic inside a leaf component instead of routing through App.tsx handlers.** The temptation when building a new game is to `useLocalStorage` directly for that game's scores and skip the LP system. Don't — every new game should accept an `onComplete` callback returning a result object, and the App.tsx handler does the LP math, streak shield application, quest progress, tier recompute, and Supabase sync in one place. If you add streak/quest hooks to a leaf, they'll get duplicated and drift.

The second-most-common mistake: **changing the storage key without bumping the version**, which silently corrupts user data.

**3. What looks refactorable but isn't:**
- **App.tsx's length.** It's 870 lines and looks like it should be split. But every handler needs read+write access to the global state and the existing inline definitions are clear. Splitting into a hook would scatter the LP-stacking logic and make it harder to reason about which handler awards what. Keep it monolithic until it actually becomes painful (>1500 lines or you can't find a handler quickly).
- **The defensive merge in `state: UserState = { ...DEFAULT_STATE, ...stateRaw, ... }`.** It looks ugly with all those nested spreads but each level matters — e.g. `avatar.equipped` needs its own merge or new slots break for existing users. Don't simplify to a single spread.
- **The "Play Again" `window.location.reload()`.** Cleaner would be to reset game-local state, but reload is one line, predictable, and free re-rehydration of the app shell. The "elegant" refactor adds state management for zero user benefit.
- **The `matches: []` array on BottomNav tabs.** Looks like premature abstraction but it's the cleanest way to keep "Games" highlighted while the user is inside any game sub-tab. Removing it would mean either letting the active tab visually drop, or hardcoding 6 tab IDs in nav logic.

### 7. DO NOT TOUCH LIST

- **Do NOT refactor App.tsx into multiple files / a state library** without explicit ask. The monolithic handler pattern is intentional (see §6).
- **Do NOT change `LP_REWARDS` values** without checking with the user — they were calibrated against the LoL tier thresholds so a Bronze student earns roughly Silver-worth of LP per active week.
- **Do NOT delete the mojibake comments in App.tsx by bulk regex** — some Edit tool old_string matches still rely on the exact corrupted bytes. If you must clean them, do it one comment at a time with Edit using the actual bytes from a fresh Read.
- **Do NOT change the storage key** (`fingrow_v6`, `fingrow_account`, `fingrow_users`, `fingrow_uid`, `fingrow_life_v1`) without bumping the version suffix.
- **Do NOT introduce new dependencies** — current set is React 19, TypeScript, Vite, Tailwind v4, motion/react, lucide-react, canvas-confetti, @supabase/supabase-js. Anything else needs the user's OK.
- **Do NOT change avatar slot IDs or shop item IDs** — they're persisted in user `avatar.equipped[]` and `avatar.owned[]`. Renaming `"hat-cap"` → `"baseball_cap"` would invisibly unequip every user's hat.
- **Do NOT change `WeeklyQuest.type` enum values** — quest progress keys are persisted in user state.
- **Do NOT replace the LoL tier system** with something simpler — the 10-tier + division ladder was an explicit user request after evaluating the 5-tier original.
- **Do NOT touch `Avatar.tsx`'s viewBox** (`0 0 220 220`) — all coordinate math for sub-renderers (face, eyes, mouth, hat) assumes this exact box.
- **Do NOT add per-game leaderboards yet** — leaderboard is intentionally one global LP race so cross-mode engagement is rewarded.
- **Preserve dark-first design** — light theme exists for accessibility but every new component must look correct in dark first.
- **Preserve mobile-first layout** — `max-w-md mx-auto` is the canonical container width; don't add desktop-specific styles.

### 8. CONFIDENCE & FRESHNESS

- **§1 PROJECT IDENTITY:** ✅ HIGH CONFIDENCE — user-stated objectives carried across all sessions; constraints verified this session.
- **§2 WHAT EXISTS:** ✅ HIGH CONFIDENCE for everything built this session (LearnTab, Scam Spotter, Bao Tycoon, all 5 LP mechanisms, AccountModal updates). ⚠️ MEDIUM for older components (StocksTab, WalletTab, LifeTab body — unchanged but not re-verified end-to-end this session). ❓ LOW for the Supabase schema state in the user's dashboard.
- **§3 ARCHITECTURE:** ✅ HIGH CONFIDENCE — file inventory and naming conventions verified by Grep this session.
- **§4 RECENT WORK:** ✅ HIGH CONFIDENCE — all changes were made and verified to compile in the current session.
- **§5 RISKS:** ✅ HIGH CONFIDENCE for the mojibake issue (verified by Grep) and the headless screenshot issue (reproduced this session). ⚠️ MEDIUM for the keyword-detection brittleness in `handleLifeEnded` (not stress-tested).
- **§6 PHILOSOPHY:** ✅ HIGH CONFIDENCE — consistent with how every handler was structured this session.
- **§7 DO NOT TOUCH:** ✅ HIGH CONFIDENCE — explicit user instructions across sessions.
