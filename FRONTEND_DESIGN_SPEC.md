# fingrow — Front-End Design Spec (for redesign tools, e.g. Google Stitch)

> A complete description of the current UI/UX so a design tool can understand the
> existing look-and-feel and propose improvements. fingrow is a **mobile-first,
> dark-first financial-literacy gamification PWA** for Singapore JC students (16–18).
> Think "Duolingo meets a League-of-Legends ranked ladder, for money skills."

---

## 1. Platform & canvas

- **Target device:** mobile phone only. No desktop/tablet layouts are designed for.
- **Canvas:** a single centered column, `max-width: 28rem (448px)` (`max-w-md mx-auto`),
  full min-height of the viewport, horizontal padding `16px` (`px-4`), top padding `20px`.
- **Bottom padding `128px`** on the scroll container so content never hides behind the
  fixed bottom navigation.
- **Orientation:** portrait. Everything is a vertical scroll of stacked "cards."
- **Vertical rhythm:** sections are separated by a consistent `20px` gap (`gap-5`).

---

## 2. Theme & color system

Dark is the **canonical / default** theme; light exists but is secondary. Colors are
CSS custom properties that flip on `[data-theme='dark']`.

### Dark theme (primary)
| Token | Value | Use |
|---|---|---|
| `--bg-main` | `#0C0E14` | App background (near-black, blue-tinted) |
| `--bg-card` | `#13151E` | Card surfaces |
| `--bg-elevated` | `#1A1D28` | Raised elements, hover states |
| `--text-main` | `#F1F5F9` | Primary text (near-white) |
| `--text-muted` | `#64748B` | Secondary text (slate gray) |
| `--border-color` | `#1E2230` | Hairline borders (very subtle) |

### Light theme (secondary)
| Token | Value |
|---|---|
| `--bg-main` | `#F5F3FF` (lavender white) |
| `--bg-card` | `#FFFFFF` |
| `--bg-elevated` | `#EDE9FE` |
| `--text-main` | `#0F0A1E` |
| `--text-muted` | `#6B7280` |
| `--border-color` | `#DDD6FE` |

### Brand accent palette (theme-independent)
- **Violet/Purple** `#A855F7` / `#7C3AED` — **primary brand color** (nav active state, CTAs, progress bars).
- **Green/Mint** `#22C55E` — success, money-positive, "done" states.
- **Coral/Red** `#EF4444` / `#F43F5E` — daily challenge, warnings, money-negative.
- **Amber** `#F59E0B` / `#FBBF24` — rewards, LP, trophies, coins.
- **Cyan** `#06B6D4` — secondary accent (games, XP gradient endpoint).
- **Blue** `#60A5FA` — stocks/portfolio.

**Signature gradient:** violet→cyan (XP bar) and violet→amber (quest progress).
Accent colors are almost always used at low opacity over dark surfaces:
`bg-violet-500/10`, `border-violet-500/30`, etc. — glow, not fill.

---

## 3. Typography

- **Font:** `Plus Jakarta Sans` (Google Font), weights 400–800. Geometric, friendly, modern.
- **Scale (observed):**
  - Page title (h2): `24px` / extrabold (`text-2xl font-extrabold tracking-tight`)
  - Card heading: `15–18px` / bold–extrabold
  - Body: `13–14px`
  - Secondary/caption: `10–12px`, often `font-bold uppercase tracking-widest text-muted`
  - Micro-labels: `9–10px` uppercase, wide letter-spacing — used heavily for section eyebrows.
- **Numbers:** `tabular-nums` for all stats/currency/LP so digits don't jitter.
- **Tone of copy:** energetic, student-friendly, emoji-accented ("Today's Brain Buster",
  "You crushed today's challenge", "🔥 Daily Challenge").

---

## 4. Core surface styles (the visual "vocabulary")

- **`.card-base`** — the workhorse container: `background: --bg-card`, `1px` border in
  `--border-color`, **`border-radius: 24px` (rounded-3xl)**, padding `16px`, smooth color transitions.
  Large corner radii everywhere is a defining trait.
- **`.card-glow`** — adds a soft violet ambient shadow (`0 2px 20px rgba(124,58,237,0.1)`)
  plus a hairline ring. Gives cards a subtle "lit from within" feel on dark.
- **`.glass`** — frosted translucency (`backdrop-blur-xl` + semi-transparent card color +
  white hairline). Used for the bottom nav.
- **Pills:** rounded-full chips with low-opacity tinted background + matching border +
  matching text color (e.g. coins pill, streak pill, rank pill). The dominant "stat" affordance.
- **Decorative glow blobs:** many feature cards have an absolutely-positioned, large,
  heavily-blurred colored circle (`blur-2xl opacity-30`) bleeding off a corner to add depth.
- **Rounded everything:** buttons `rounded-2xl`, cards `rounded-3xl`/`28px`, chips `rounded-full`.

---

## 5. Navigation

### Bottom nav (fixed, glass)
- Fixed to viewport bottom, full width, `.glass` background, top hairline border, `z-50`.
- Inner row constrained to `max-w-md`, 5 evenly-spaced items, extra bottom padding `28px`
  (for the phone home-indicator safe area).
- **5 tabs:** Home (house), Wallet (wallet), **Games (gamepad — center)**, Learn (grad-cap), League (trophy).
- **Active state:** icon + label turn violet (`#A855F7`), icon sits in a `rounded-2xl`
  violet-tinted chip (`bg-violet-600/15`), stroke-width thickens (1.8 → 2.5).
- **Inactive:** muted gray, no chip.
- Labels are `9px` uppercase, wide tracking. Tap feedback: `active:scale-90`.
- The "Games" tab stays highlighted across all game sub-screens (stocks, life sim, scam
  spotter, bao tycoon) via a `matches` list.

### Top header (on every screen, scrolls with content)
- Left cluster of **stat pills**: coins (yellow coin icon + count), streak (flame + day count),
  and a **League rank pill** (tier icon + rank name, gradient-tinted to the current tier color, tappable → League).
- Right cluster of **icon buttons** (circular, bordered): Help (?), Account (avatar emoji or
  user icon), Theme toggle (moon/sun).

---

## 6. Screen-by-screen layout

### 6.1 Dashboard / Home (the landing screen)
Vertical stack:
1. **Avatar hero card** — a big rounded (`28px`) card showing the user's customizable SVG
   character (Avatar.tsx, `0 0 220 220` viewBox), rendered ~full-width. Overlaid:
   - Top-left: "Level N" eyebrow + level name in mint green.
   - Top-right: "Status" eyebrow + mood label (e.g. "Thriving 🌟", "Misses you 😢"), colored by mood.
   - A small floating violet **"✨ Customize"** pill (top-right).
   - Bottom: **XP / "Growth Progress" bar** — violet→cyan gradient with an animated shimmer sweep.
   - Top & bottom dark gradient scrims for text legibility over the avatar.
   - Tapping the card → Shop (customize).
2. **Daily Challenges** section — eyebrow row ("⚡ Daily Challenges", "x/4 done") + a
   **2×2 grid of MissionCards**: Daily Challenge (🔥, +150 LP), Log Expense (💸), Minigames (🎮),
   My Buddy (🧑). Each card shows icon, title, reward hint, and a done/checkmark state.
3. **Weekly Quests card** — 3 quests with emoji, title, description, per-quest progress bar
   (violet→amber), `+200 LP` tags, and a "x/3" counter. Glows amber when all complete.
4. **Trophies card** (newest) — a 2-column grid of 6 "Frugal Ribbon" achievements. Earned ones
   show a colored amber/violet gradient tile with emoji; locked ones are grayscale + dimmed
   with a small lock icon. Header shows "Trophies" + "x/6".
5. **Quick Stats** — 2-up grid of tappable stat cards: Portfolio value (blue) and This-month
   Spent vs budget (green).

### 6.2 Learn (the quiz screen) — *focus of upcoming changes*
- **Hub view:** page title "Learn" + two large feature buttons stacked:
  - **Daily Challenge card** — coral/violet gradient, "🔥 Daily Challenge" + "HARD" chips,
    big 🔥 emoji, "+150 LP" trophy tag, "Today's Brain Buster" heading. Turns green/✅ when done.
  - **Practice Mode card** — violet/blue gradient, "📚 Practice Mode", big 🧠 emoji,
    "Unlimited Questions", and a "Practice LP today: +X / +50" progress bar.
  - **Knowledge Mastery card** — a stacked multi-segment progress bar across 5 mastery tiers
    (Untouched→Seen→Familiar→Proficient→Mastered, gray→slate→blue→violet→amber) + a legend.
- **Question view (shared):** difficulty + mastery + category chips at top, a `.card-base`
  with the question text, vertically-stacked answer options (A/B/C/D in a rounded square badge),
  a violet "Submit Answer" CTA (+ optional "Skip" in practice). On submit, options recolor
  green (correct) / red (chosen-wrong) / dimmed, and an explanation panel slides in. Confetti fires on correct.

### 6.3 League (ranked ladder)
- Title + Live/Offline connection chip (Supabase). Account prompt card.
- **Big rank showcase card** — tinted to the current tier's gradient, with a `RankBadge`
  (gradient shield + tier icon + division chip), total LP, and a progress bar to the next tier.
- **Weekly Leaderboard** — ranked list rows (🥇🥈🥉 / #N, avatar emoji, name, week LP);
  the user's own row is violet-highlighted with a "you" chip.
- **How to Earn LP** list + **The Ladder** (all 10 tiers Iron→Challenger with lock icons on
  unreached tiers, current tier highlighted).

### 6.4 Wallet, Stocks, Shop, Games hub, Life sim
- **Wallet:** expense/income tracking, donut chart, monthly budget, grouped transaction list,
  bottom-sheet "Add" form.
- **Stocks:** 6-stock simulator, price cards, buy/sell.
- **Shop:** slot-tabbed avatar customizer with rarity-tagged items, color pickers, mini-avatar previews.
- **Games hub:** lobby of game cards (Stock Trader, Life Simulator, Scam Spotter, Bao Stand Tycoon).
- **Life Sim:** scenario cards age 8→65 with choice buttons.

---

## 7. Motion & micro-interactions (Framer Motion / `motion/react`)

- **Entrance:** screens fade + slide up (`opacity 0→1, y 20→0`); list items stagger with
  small incremental delays.
- **Tap feedback:** `active:scale-90` (icons) / `whileTap scale 0.97–0.99` (buttons/cards).
- **Progress bars** animate width from 0 with `easeOut` over ~0.8–1.2s; XP bar has an infinite
  shimmer sweep.
- **Confetti** (canvas-confetti) on rewards — big burst for daily challenge, small for practice.
- **Custom keyframes:** `shimmer`, `tree-sway`, `float-up` (floating XP gain), `slide-up`
  (bottom sheets), `glow-pulse`.
- Note: some screens run *continuous* animations (timers), which is part of the lively feel.

---

## 8. Design language summary (for the redesign tool)

**Keep these traits:**
- Dark-first, deep near-black blue background with softly glowing violet-accented cards.
- Very rounded corners (24–28px cards, full-round pills).
- Gamified, energetic, emoji-friendly, reward-forward (LP, coins, streaks, confetti).
- Low-opacity tinted accent surfaces (glow, not solid fills) over dark.
- Tabular numbers, uppercase micro-eyebrows, generous 20px vertical rhythm.
- Strictly single-column, thumb-reachable, mobile-only with a fixed glass bottom nav.

**Known opportunities to improve (candidate areas for the redesign):**
- Visual hierarchy between the many stacked cards on the dashboard (everything is a
  rounded card of similar weight — could use more size/contrast hierarchy).
- The 2×2 "Daily Challenges" grid vs the separate "Daily Challenge" feature inside Learn
  is slightly redundant naming.
- Empty/locked states (e.g. Trophies, leaderboard offline) could be more inviting.
- Consistency of chip/eyebrow styles across tabs.
- The header stat-pill row can get crowded on small screens when many pills wrap.

**Hard constraints any redesign MUST respect:**
- Mobile-only, `max-w-md` single column, fixed bottom nav with the same 5 destinations.
- Dark theme must look correct first; CSS-variable theming must be preserved.
- Avatar SVG uses a fixed `0 0 220 220` viewBox — don't change its aspect assumptions.
- Persisted identifiers (tier system = 10 tiers + divisions, shop/avatar slots) are fixed.
