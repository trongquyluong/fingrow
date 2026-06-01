/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Analytics } from '@vercel/analytics/react';
import {
  Flame,
  Coins,
  CheckCircle2,
  Moon,
  Sun,
  TrendingUp,
  Wallet as WalletIcon,
  HelpCircle,
  UserCircle2,
  Zap,
  Sparkles,
  Trophy,
  ChevronRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import BottomNav, { NavTab } from "./components/BottomNav";
import StocksTab from "./components/StocksTab";
import WalletTab from "./components/WalletTab";
import ShopTab from "./components/ShopTab";
import LeagueTab from "./components/LeagueTab";
import LifeTab, { LifeRunSummary } from "./components/LifeTab";
import GamesHub from "./components/GamesHub";
import ScamSpotter, { ScamSpotterResult } from "./components/games/ScamSpotter";
import BaoStandTycoon, { BaoTycoonResult } from "./components/games/BaoStandTycoon";
import LearnTab, { AnswerResult } from "./components/LearnTab";
import WeeklyQuestsCard from "./components/WeeklyQuestsCard";
import RibbonsCard from "./components/RibbonsCard";
import TrophiesScreen from "./components/TrophiesScreen";
import HowToPlayModal from "./components/HowToPlayModal";
import AccountModal, { AccountData } from "./components/AccountModal";
import Onboarding from "./components/Onboarding";
import Avatar from "./components/Avatar";
import AdminConsole from "./components/AdminConsole";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { UserState, Transaction, AvatarSlot, AvatarState, WeeklyQuest, DailyChallengeResult } from "./types";
import {
  STOCKS, SHOP_ITEMS, getRank, formatRank, TIER_CONFIG,
  LP_REWARDS, pickWeeklyQuests, RIBBONS,
} from "./constants";
import {
  syncScore, syncProgress, saveAccountState, fetchAccountState,
  isAdminUsername, SUPABASE_ENABLED,
} from "./lib/supabase";
import { buildProgressSnapshot } from "./lib/analytics";

const ACCOUNT_KEY = "fingrow_account";
const STORAGE_KEY = "fingrow_v6"; // bumped: LP mechanisms (mastery, quests, ribbons, budget streak)

// Cloud-save sync marker: records {username, at} of the account the local
// fingrow_v6 state currently belongs to + its last synced timestamp. Used to
// decide, on login, whether to adopt the cloud copy (newer / another device)
// or keep+push the local copy (same device, offline edits, first-time migration).
const CLOUD_MARKER_KEY = "fingrow_cloud_synced_at";
type SyncMarker = { username: string; at: string };
function readSyncMarker(): SyncMarker | null {
  try { return JSON.parse(localStorage.getItem(CLOUD_MARKER_KEY) || "null"); } catch { return null; }
}
function writeSyncMarker(m: SyncMarker) { localStorage.setItem(CLOUD_MARKER_KEY, JSON.stringify(m)); }
function clearSyncMarker() { localStorage.removeItem(CLOUD_MARKER_KEY); }

const DEFAULT_AVATAR: AvatarState = {
  skinTone: "#FDD9B5",
  hairColor: "#3D2914",
  eyeColor: "#3B2A1F",
  equipped: {
    face: "face-round",
    hair: "hair-short",
    brows: "brows-natural",
    eyes: "eyes-bright",
    mouth: "mouth-smile",
    outfit: "fit-tee",
    accessory: "acc-none",
    background: "bg-default",
  },
  owned: [
    "face-round", "hair-short", "brows-natural", "eyes-bright",
    "mouth-smile", "fit-tee", "acc-none", "bg-default",
  ],
};

const DEFAULT_STATE: UserState = {
  coins: 100,
  streak: 1,
  experience: 0,
  lastDailyActivity: null,
  theme: "dark",
  mood: "happy",
  tasksDoneToday: { tookQuiz: false, loggedExpense: false },
  // Stocks
  stockCash: 1000,
  stockHoldings: {},
  stockAvgBuy: {},
  stockPrices: {},
  stockHistory: {},
  lastStockUpdate: null,
  // Wallet
  transactions: [],
  monthlyBudget: 0,
  weeklyBudget: 0,
  categoryBudgets: {},
  // Avatar
  avatar: DEFAULT_AVATAR,
  // League
  leaguePoints: 0,
  leagueTier: "iron",
  leagueWeekPoints: 0,
  leagueWeekStart: null,
  // LP #1 Streak Shield
  freezeUsedThisWeek: false,
  freezeWeekStart: null,
  // LP #2 Mastery Climb
  quizMastery: {},
  dailyChallengeDate: null,
  dailyChallengeQuestionId: null,
  practicePointsToday: 0,
  practiceDate: null,
  higherLowerDate: null,
  guesstimateDate: null,
  mythFactDate: null,
  // LP #3 Weekly Quests
  weeklyQuests: [],
  questWeekStart: null,
  weeklyQuestBonusClaimed: false,
  // LP #4 Frugal Ribbons
  lifeRibbons: [],
  lifeRunState: {
    investedBefore25: false,
    everInDebt: false,
    assetClassesUsed: [],
    hasInsurance: false,
    cpfMaxed: false,
  },
  // LP #5 Budget Streak Bonus
  budgetStreakDays: 0,
  budgetLastCheckDate: null,
  budgetBossClaimedThisWeek: false,
};

const tierOfPoints = (points: number) => getRank(points).tier;

function getLevel(xp: number): { level: number; name: string; nextThreshold: number; currentThreshold: number } {
  if (xp < 50)  return { level: 1, name: "Beginner",   currentThreshold: 0,   nextThreshold: 50 };
  if (xp < 200) return { level: 2, name: "Apprentice", currentThreshold: 50,  nextThreshold: 200 };
  if (xp < 500) return { level: 3, name: "Strategist", currentThreshold: 200, nextThreshold: 500 };
  if (xp < 1000) return { level: 4, name: "Money Sage", currentThreshold: 500, nextThreshold: 1000 };
  return            { level: 5, name: "Finance Legend", currentThreshold: 1000, nextThreshold: 1000 };
}

const variantOf = (itemId?: string) =>
  itemId ? SHOP_ITEMS.find(i => i.id === itemId)?.variant : undefined;

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [stateRaw, setState] = useLocalStorage<UserState>(STORAGE_KEY, DEFAULT_STATE);
  // Defensive merge â€” ensures new fields exist even if user has older shape
  const state: UserState = {
    ...DEFAULT_STATE,
    ...stateRaw,
    tasksDoneToday: { ...DEFAULT_STATE.tasksDoneToday, ...(stateRaw.tasksDoneToday || {}) },
    avatar: { ...DEFAULT_AVATAR, ...(stateRaw.avatar || {}), equipped: { ...DEFAULT_AVATAR.equipped, ...(stateRaw.avatar?.equipped || {}) }, owned: stateRaw.avatar?.owned ?? DEFAULT_AVATAR.owned },
    transactions: stateRaw.transactions ?? [],
    categoryBudgets: stateRaw.categoryBudgets ?? {},
    quizMastery: stateRaw.quizMastery ?? {},
    weeklyQuests: stateRaw.weeklyQuests ?? [],
    lifeRibbons: stateRaw.lifeRibbons ?? [],
    lifeRunState: { ...DEFAULT_STATE.lifeRunState, ...(stateRaw.lifeRunState ?? {}) },
  };

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [accountInitialView, setAccountInitialView] = useState<"signup" | "login" | undefined>(undefined);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [account, setAccount] = useLocalStorage<AccountData | null>(ACCOUNT_KEY, null);
  // Research admin: hidden from the leaderboard, never synced as a student, unlocks the research dashboard.
  const isAdmin = isAdminUsername(account?.username);

  // First-run onboarding: show once for brand-new users (no account, never onboarded)
  useEffect(() => {
    if (!account && !localStorage.getItem("fingrow_onboarded")) setShowOnboarding(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const finishOnboarding = () => {
    localStorage.setItem("fingrow_onboarded", "1");
    setShowOnboarding(false);
  };
  // Deep-link target for the Learn tab (lets dashboard cards open a specific challenge)
  const [learnInitialMode, setLearnInitialMode] = useState<"higher_lower" | "guesstimate" | "myth_fact" | null>(null);

  // â”€â”€ Sync refs (hoisted above effects that reference them) â”€â”€
  const syncTimer = useRef<number | undefined>(undefined);
  const progressTimer = useRef<number | undefined>(undefined);
  const hydratedForRef = useRef<string | null>(null);
  const hydratingRef = useRef(false);

  // â”€â”€ Theme â”€â”€
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
  }, [state.theme]);

  // â”€â”€ Daily reset / mood â”€â”€
  useEffect(() => {
    const now = new Date();
    const today = now.toDateString();
    const lastActivity = state.lastDailyActivity ? new Date(state.lastDailyActivity) : null;

    let newMood = state.mood;
    if (lastActivity) {
      const diffDays = Math.floor((Date.now() - lastActivity.getTime()) / 86400000);
      newMood = diffDays > 1 ? "sad" : diffDays === 1 ? "thirsty" : "happy";
    }

    if (state.lastDailyActivity !== today) {
      // Calendar-day gap between the last active day and today (midnight-aligned so a
      // late-night -> early-morning session counts as one day, not two).
      const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
      const gapDays = lastActivity
        ? Math.round((startOfDay(now) - startOfDay(lastActivity)) / 86400000)
        : 0;

      // Current freeze/league week (Monday key) — must match the weekly-reset effect.
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      const weekKey = monday.toDateString();
      const yesterdayKey = (() => { const y = new Date(now); y.setDate(now.getDate() - 1); return y.toDateString(); })();

      setState(prev => {
        let streak = prev.streak;
        let freezeUsedThisWeek = prev.freezeUsedThisWeek;
        let freezeWeekStart = prev.freezeWeekStart;
        let lastDailyActivity = prev.lastDailyActivity;

        if (gapDays >= 2) {
          // At least one full day was missed since the last activity. A Streak Freeze
          // (one per week) auto-applies to cover EXACTLY one missed day; longer gaps
          // always break the streak. The freeze counts as available if it hasn't been
          // spent in the current week — a new week refills it. (The weekly-reset effect
          // also clears the flag on Mondays; we re-derive availability from the stored
          // freeze week here in case this effect runs before that one.)
          const freezeAvailable = freezeWeekStart !== weekKey || !freezeUsedThisWeek;
          if (gapDays === 2 && freezeAvailable) {
            freezeUsedThisWeek = true;
            freezeWeekStart = weekKey;
            // The freeze absorbs the single missed day: treat the effective last-active
            // day as yesterday so the streak is preserved AND re-running this effect
            // (e.g. a reload before any activity today) stays a no-op instead of
            // re-spending the freeze. lastDailyActivity stays != today, so the handlers'
            // "first activity of a new day" Streak-Shield LP bonus still fires.
            lastDailyActivity = yesterdayKey;
          } else {
            streak = 1;
          }
        }
        // gapDays <= 1 (active today or yesterday) → streak carries unchanged.

        return {
          ...prev,
          streak,
          freezeUsedThisWeek,
          freezeWeekStart,
          lastDailyActivity,
          mood: newMood,
          tasksDoneToday: { tookQuiz: false, loggedExpense: false },
        };
      });
    } else if (state.mood !== "happy") {
      setState(prev => ({ ...prev, mood: "happy" }));
    }
  }, []);

  // â”€â”€ Stock prices â”€â”€
  useEffect(() => {
    const today = new Date().toDateString();
    const needsInit = Object.keys(state.stockPrices).length === 0;
    const needsUpdate = state.lastStockUpdate !== today;
    if (!needsInit && !needsUpdate) return;

    const newPrices: Record<string, number> = {};
    const newHistory: Record<string, number[]> = {};

    STOCKS.forEach(stock => {
      if (needsInit) {
        const hist: number[] = [stock.basePrice];
        for (let i = 1; i < 7; i++) {
          const prev = hist[0];
          const delta = (Math.random() - 0.5) * 2 * stock.volatility * prev;
          hist.unshift(Math.max(0.01, prev + delta));
        }
        newPrices[stock.id] = stock.basePrice;
        newHistory[stock.id] = hist;
      } else {
        const old = state.stockPrices[stock.id] ?? stock.basePrice;
        const delta = (Math.random() - 0.5) * 2 * stock.volatility;
        const next = Math.max(0.01, old * (1 + delta));
        newPrices[stock.id] = next;
        const hist = [...(state.stockHistory[stock.id] ?? [old]), next];
        if (hist.length > 7) hist.shift();
        newHistory[stock.id] = hist;
      }
    });

    setState(prev => ({ ...prev, stockPrices: newPrices, stockHistory: newHistory, lastStockUpdate: today }));
  }, []);

  // Weekly league + quest reset
  useEffect(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const weekKey = monday.toDateString();
    if (state.leagueWeekStart !== weekKey) {
      setState(prev => ({
        ...prev,
        leagueWeekStart: weekKey,
        leagueWeekPoints: 0,
        // Reset quest pool for the new week
        weeklyQuests: pickWeeklyQuests(weekKey),
        questWeekStart: weekKey,
        weeklyQuestBonusClaimed: false,
        // Reset streak freeze for the new week
        freezeUsedThisWeek: false,
        freezeWeekStart: weekKey,
        // Reset budget boss claim
        budgetBossClaimedThisWeek: false,
      }));
    } else if (state.weeklyQuests.length === 0 || state.questWeekStart !== weekKey) {
      // First load this week — generate quests
      setState(prev => ({
        ...prev,
        weeklyQuests: pickWeeklyQuests(weekKey),
        questWeekStart: weekKey,
      }));
    }
  }, []);

  // â”€â”€ Supabase sync (debounced) â”€â”€
  // Admins are excluded so they never appear on the public leaderboard.
  useEffect(() => {
    if (!SUPABASE_ENABLED || !account || !state.leagueWeekStart || isAdmin) return;
    // Wait for hydration before syncing (same race guard as progressTimer).
    if (hydratingRef.current || hydratedForRef.current !== account.username) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => {
      syncScore({
        username: account.username,
        avatar: account.avatar,
        totalPoints: state.leaguePoints,
        weekPoints: state.leagueWeekPoints,
        tier: state.leagueTier,
        weekStart: state.leagueWeekStart!,
      });
    }, 800);
    return () => { if (syncTimer.current) window.clearTimeout(syncTimer.current); };
  }, [state.leaguePoints, state.leagueWeekPoints, state.leagueTier, state.leagueWeekStart, account, isAdmin, hydratingRef.current, hydratedForRef.current]);

  // â”€â”€ Account-bound cloud save + research progress (debounced) â”€â”€
  // Pushes (a) the full game state to the student's account so it follows them
  // across devices, and (b) a learning-analytics snapshot for the admin. Admins
  // are not students, so their own state is never synced. Gated until the
  // login hydrate below has finished, so we never clobber the cloud copy with a
  // pre-hydration (default/guest) state.
  useEffect(() => {
    if (!SUPABASE_ENABLED || !account || isAdmin) return;
    // Wait for the hydration effect to finish before syncing — otherwise a
    // refresh-on-same-account race causes the timer to bail out early.
    if (hydratingRef.current || hydratedForRef.current !== account.username) return;
    if (progressTimer.current) window.clearTimeout(progressTimer.current);
    progressTimer.current = window.setTimeout(async () => {
      syncProgress(buildProgressSnapshot(state, account, new Date().toDateString()));
      const at = await saveAccountState(account.username, state);
      if (at) writeSyncMarker({ username: account.username.trim().toLowerCase(), at });
    }, 1500);
    return () => { if (progressTimer.current) window.clearTimeout(progressTimer.current); };
  }, [
    state.leaguePoints, state.experience, state.streak, state.quizMastery,
    state.transactions, state.lifeRibbons, state.weeklyQuests, state.avatar,
    state.stockHoldings, state.coins, state.monthlyBudget,
    state.dailyChallengeDate, state.higherLowerDate, state.guesstimateDate, state.mythFactDate,
    account, isAdmin, hydratingRef.current,
  ]);

  // â”€â”€ Restore account-bound progress on login (cross-device) â”€â”€
  // On a new login, adopt the cloud copy when it's newer / from another device;
  // otherwise keep the local copy and push it up (covers offline edits and the
  // one-time migration of existing local-only progress).
  useEffect(() => {
    if (!SUPABASE_ENABLED || !account || isAdmin) return;
    const uname = account.username;
    if (hydratedForRef.current === uname) return;
    hydratingRef.current = true;
    let cancelled = false;
    (async () => {
      const lower = uname.trim().toLowerCase();
      const cloud = await fetchAccountState(uname);
      if (cancelled) return;
      const marker = readSyncMarker();
      const localBelongsToThis = !!marker && marker.username === lower;
      if (cloud) {
        const adopt = !localBelongsToThis || cloud.updated_at > (marker?.at ?? "");
        if (adopt) {
          setState(cloud.state as UserState);
          writeSyncMarker({ username: lower, at: cloud.updated_at });
        }
      } else {
        // No cloud copy yet. Keep local (migration / first use) and seed the cloud
        // with the local state so subsequent logins on other devices restore it — do
        // NOT overwrite the cloud with DEFAULT_STATE (that would nuke existing progress).
        if (!localBelongsToThis) setState(DEFAULT_STATE);
        const at = await saveAccountState(lower, localBelongsToThis ? state : DEFAULT_STATE);
        if (!cancelled) writeSyncMarker({ username: lower, at: at ?? new Date().toISOString() });
      }
      if (!cancelled) { hydratedForRef.current = uname; hydratingRef.current = false; }
    })();
    return () => { cancelled = true; };
    // `state` is intentionally read at hydrate time (snapshot) and not a trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.username, isAdmin]);

  // Account save / logout. On logout we flush the latest state to the cloud, then
  // reset the local device to a clean slate so the next user (or guest) doesn't
  // inherit this account's progress — the saved copy is safely in the account.
  const handleAccountSave = (d: AccountData | null) => {
    if (d === null && account && !isAdmin) {
      if (SUPABASE_ENABLED) saveAccountState(account.username, state);
      hydratedForRef.current = null;
      clearSyncMarker();
      setState(DEFAULT_STATE);
    }
    setAccount(d);
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Quest progress helper — increments and awards bonus LP automatically
  const advanceQuest = (prev: UserState, type: WeeklyQuest["type"], amount: number) => {
    let lpAwarded = 0;
    const newQuests = prev.weeklyQuests.map(q => {
      if (q.done || q.type !== type) return q;
      const newCurrent = q.current + amount;
      const justDone = newCurrent >= q.target;
      if (justDone) lpAwarded += q.reward;
      return { ...q, current: newCurrent, done: justDone };
    });
    const allFinished = newQuests.length > 0 && newQuests.every(q => q.done);
    let bonusClaimed = prev.weeklyQuestBonusClaimed;
    if (allFinished && !bonusClaimed) {
      lpAwarded += LP_REWARDS.QUEST_ALL_BONUS;
      bonusClaimed = true;
    }
    return { weeklyQuests: newQuests, lpAwarded, weeklyQuestBonusClaimed: bonusClaimed };
  };

  // Streak shield bonus — call once per day of activity
  const computeStreakLP = (streakDays: number): number =>
    Math.min(LP_REWARDS.STREAK_CAP, LP_REWARDS.STREAK_BASE + (streakDays - 1) * LP_REWARDS.STREAK_PER_DAY);

  // First-activity-of-a-new-day streak update. Returns the advanced streak (a day that is
  // consecutive — or freeze-covered, since the daily-reset effect rewrites lastDailyActivity
  // to yesterday when a freeze fires — extends it; any wider gap restarts at 1) plus the
  // Streak-Shield LP bonus for that streak. No-op (streakLP 0) once the day is already counted.
  // Call from every handler that marks the day active so the streak counts regardless of
  // which action happens first.
  const applyDailyStreak = (prev: UserState, today: string): { streak: number; streakLP: number } => {
    if (prev.lastDailyActivity === today) return { streak: prev.streak, streakLP: 0 };
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const streak = prev.lastDailyActivity === y.toDateString() ? prev.streak + 1 : 1;
    return { streak, streakLP: computeStreakLP(streak) };
  };

  const toggleTheme = () =>
    setState(prev => ({ ...prev, theme: prev.theme === "light" ? "dark" : "light" }));

  // ── Learn answer (Daily Challenge + Practice + Mastery + Streak + Quests) ──
  const handleLearnAnswer = (result: AnswerResult) => {
    const today = new Date().toDateString();
    const todayISO = new Date().toISOString();

    setState(prev => {
      const next: UserState = { ...prev };
      const newMastery = { ...prev.quizMastery };
      const cur = newMastery[result.questionId];

      if (result.correct) {
        const isNewDay = !cur || cur.lastCorrectDate !== today;
        const correctIncrement = isNewDay ? 1 : 0;
        newMastery[result.questionId] = {
          seen: (cur?.seen ?? 0) + 1,
          correct: (cur?.correct ?? 0) + correctIncrement,
          level: result.masteryAfter as 0 | 1 | 2 | 3 | 4,
          lastCorrectDate: isNewDay ? today : (cur?.lastCorrectDate ?? today),
          firstSeenDate: cur?.firstSeenDate ?? todayISO,
        };
      } else if (cur) {
        newMastery[result.questionId] = { ...cur, seen: cur.seen + 1 };
      } else {
        newMastery[result.questionId] = {
          seen: 1, correct: 0, level: 0,
          lastCorrectDate: null,
          firstSeenDate: todayISO,
        };
      }
      next.quizMastery = newMastery;

      if (result.isDaily) {
        next.dailyChallengeDate = today;
        next.dailyChallengeQuestionId = result.questionId;
      }

      if (!result.isDaily && result.correct) {
        const sameDay = prev.practiceDate === today;
        const todayBase = sameDay ? prev.practicePointsToday : 0;
        const room = Math.max(0, Math.min(LP_REWARDS.PRACTICE_CORRECT, LP_REWARDS.PRACTICE_DAILY_CAP - todayBase));
        next.practicePointsToday = todayBase + room;
        next.practiceDate = today;
      }

      let lpAwarded = result.lpAwarded;
      next.coins = prev.coins + result.coinsAwarded;
      next.experience = prev.experience + (result.correct ? (result.isDaily ? 30 : 5) : 0);
      next.lastDailyActivity = today;
      next.mood = "happy";
      next.tasksDoneToday = { ...prev.tasksDoneToday, tookQuiz: true };

      // Streak: advance the counter + award the Streak-Shield bonus on a new day's first activity
      const ds = applyDailyStreak(prev, today);
      next.streak = ds.streak;
      lpAwarded += ds.streakLP;

      // Weekly quest progress on any correct answer
      if (result.correct) {
        const qu = advanceQuest(prev, "quiz", 1);
        next.weeklyQuests = qu.weeklyQuests;
        next.weeklyQuestBonusClaimed = qu.weeklyQuestBonusClaimed;
        lpAwarded += qu.lpAwarded;
      }

      next.leaguePoints = prev.leaguePoints + lpAwarded;
      next.leagueTier = tierOfPoints(next.leaguePoints);
      next.leagueWeekPoints = prev.leagueWeekPoints + lpAwarded;

      return next;
    });

    if (result.correct && result.isDaily) {
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, colors: ["#F43F5E", "#A855F7", "#FBBF24", "#22C55E"] });
    } else if (result.correct) {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 }, colors: ["#A855F7", "#22C55E"] });
    }
  };

  // â”€â”€ Extra daily challenges (Higher-or-Lower / Guesstimate / Myth-or-Fact) â”€â”€
  const handleDailyChallengeComplete = (result: DailyChallengeResult) => {
    const today = new Date().toDateString();
    setState(prev => {
      const next: UserState = { ...prev };

      // Mark today's challenge done (once/day gating)
      if (result.type === "higher_lower") next.higherLowerDate = today;
      else if (result.type === "guesstimate") next.guesstimateDate = today;
      else if (result.type === "myth_fact") next.mythFactDate = today;

      let lpAwarded = Math.max(0, result.lpAwarded);

      // XP for engagement (scaled to correct answers)
      next.experience = prev.experience + result.correct * 4;
      next.lastDailyActivity = today;
      next.mood = "happy";

      // Streak: advance the counter + award the Streak-Shield bonus on a new day's first activity
      const ds = applyDailyStreak(prev, today);
      next.streak = ds.streak;
      lpAwarded += ds.streakLP;

      // Weekly quest progress: correct answers count toward the "quiz" quest
      if (result.correct > 0) {
        const qu = advanceQuest(prev, "quiz", result.correct);
        next.weeklyQuests = qu.weeklyQuests;
        next.weeklyQuestBonusClaimed = qu.weeklyQuestBonusClaimed;
        lpAwarded += qu.lpAwarded;
      }

      next.leaguePoints = prev.leaguePoints + lpAwarded;
      next.leagueTier = tierOfPoints(next.leaguePoints);
      next.leagueWeekPoints = prev.leagueWeekPoints + lpAwarded;

      return next;
    });

    if (result.correct > 0) {
      const strong = result.correct >= Math.ceil(result.total / 2);
      confetti({
        particleCount: strong ? 140 : 50,
        spread: strong ? 80 : 55,
        origin: { y: 0.5 },
        colors: ["#06B6D4", "#A855F7", "#FBBF24", "#22C55E"],
      });
    }
  };

  // â”€â”€ Stocks â”€â”€
  const handleBuyStock = (stockId: string, shares: number, price: number) => {
    const today = new Date().toDateString();
    setState(prev => {
      const cost = shares * price;
      const oldShares = prev.stockHoldings[stockId] || 0;
      const oldAvg = prev.stockAvgBuy[stockId] || price;
      const newAvg = (oldShares * oldAvg + shares * price) / (oldShares + shares);
      // Streak: advance the counter + award the Streak-Shield bonus on a new day's first activity
      const ds = applyDailyStreak(prev, today);
      const total = prev.leaguePoints + ds.streakLP;
      return {
        ...prev,
        stockCash: prev.stockCash - cost,
        stockHoldings: { ...prev.stockHoldings, [stockId]: oldShares + shares },
        stockAvgBuy: { ...prev.stockAvgBuy, [stockId]: newAvg },
        streak: ds.streak,
        leaguePoints: total,
        leagueTier: tierOfPoints(total),
        leagueWeekPoints: prev.leagueWeekPoints + ds.streakLP,
        lastDailyActivity: today,
        mood: "happy",
      };
    });
  };

  const handleSellStock = (stockId: string, shares: number, price: number, profit: number) => {
    const today = new Date().toDateString();
    setState(prev => {
      const proceeds = shares * price;
      const oldShares = prev.stockHoldings[stockId] || 0;
      const remaining = oldShares - shares;
      const newHoldings = { ...prev.stockHoldings };
      const newAvgBuy = { ...prev.stockAvgBuy };
      if (remaining <= 0) { delete newHoldings[stockId]; delete newAvgBuy[stockId]; }
      else newHoldings[stockId] = remaining;

      let leaguePts = profit > 0 ? Math.floor(profit) : 0;

      // Streak: advance the counter + award the Streak-Shield bonus on a new day's first activity
      const ds = applyDailyStreak(prev, today);
      leaguePts += ds.streakLP;

      // Weekly quest progress: any stock trade + profit quest
      let questUpdate = advanceQuest(prev, "stock_trade", 1);
      let questedQuests = questUpdate.weeklyQuests;
      let questedBonus = questUpdate.weeklyQuestBonusClaimed;
      leaguePts += questUpdate.lpAwarded;
      if (profit > 0) {
        const profitQuest = advanceQuest({ ...prev, weeklyQuests: questedQuests, weeklyQuestBonusClaimed: questedBonus }, "stock_profit", Math.floor(profit));
        questedQuests = profitQuest.weeklyQuests;
        questedBonus = profitQuest.weeklyQuestBonusClaimed;
        leaguePts += profitQuest.lpAwarded;
      }

      const total = prev.leaguePoints + leaguePts;
      return {
        ...prev,
        streak: ds.streak,
        stockCash: prev.stockCash + proceeds,
        stockHoldings: newHoldings,
        stockAvgBuy: newAvgBuy,
        leaguePoints: total,
        leagueTier: tierOfPoints(total),
        leagueWeekPoints: prev.leagueWeekPoints + leaguePts,
        weeklyQuests: questedQuests,
        weeklyQuestBonusClaimed: questedBonus,
        lastDailyActivity: today,
        mood: "happy",
      };
    });
  };

  // ── Wallet ──
  const handleAddTransaction = (t: Omit<Transaction, "id">) => {
    const today = new Date().toDateString();
    setState(prev => {
      const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const isFirstLogToday = !prev.tasksDoneToday.loggedExpense;
      let leaguePts = isFirstLogToday ? 5 : 0;

      // Streak: advance the counter + award the Streak-Shield bonus on a new day's first activity
      const ds = applyDailyStreak(prev, today);
      leaguePts += ds.streakLP;

      // Weekly quest progress: any log counts
      const qu = advanceQuest(prev, "wallet_log", 1);
      leaguePts += qu.lpAwarded;

      const total = prev.leaguePoints + leaguePts;
      return {
        ...prev,
        streak: ds.streak,
        transactions: [...prev.transactions, { ...t, id }],
        tasksDoneToday: { ...prev.tasksDoneToday, loggedExpense: true },
        weeklyQuests: qu.weeklyQuests,
        weeklyQuestBonusClaimed: qu.weeklyQuestBonusClaimed,
        leaguePoints: total,
        leagueTier: tierOfPoints(total),
        leagueWeekPoints: prev.leagueWeekPoints + leaguePts,
        experience: prev.experience + (isFirstLogToday ? 10 : 0),
        lastDailyActivity: today,
        mood: "happy",
      };
    });
  };

  // ── Budget Streak Bonus (LP #5) ──
  // Daily spending vs derived daily quota (monthlyBudget / 30). +15 LP per clean day,
  // +150 LP "Budget Boss" once per week for a full 7-day clean streak.
  useEffect(() => {
    if (state.monthlyBudget <= 0) return;
    const today = new Date().toDateString();
    if (state.budgetLastCheckDate === today) return;

    const todaySpent = state.transactions
      .filter(t => t.type === "expense" && new Date(t.date).toDateString() === today)
      .reduce((s, t) => s + t.amount, 0);

    const dailyQuota = state.monthlyBudget / 30;
    const underBudget = todaySpent <= dailyQuota;

    if (underBudget) {
      setState(prev => {
        let lp = LP_REWARDS.BUDGET_DAILY;
        const newStreak = prev.budgetStreakDays + 1;
        let bossClaimed = prev.budgetBossClaimedThisWeek;
        // Full week clean? Award the Boss bonus once per week
        if (newStreak >= 7 && !bossClaimed) {
          lp += LP_REWARDS.BUDGET_BOSS;
          bossClaimed = true;
        }
        return {
          ...prev,
          budgetStreakDays: newStreak,
          budgetLastCheckDate: today,
          budgetBossClaimedThisWeek: bossClaimed,
          leaguePoints: prev.leaguePoints + lp,
          leagueTier: tierOfPoints(prev.leaguePoints + lp),
          leagueWeekPoints: prev.leagueWeekPoints + lp,
        };
      });
    } else {
      setState(prev => ({ ...prev, budgetStreakDays: 0, budgetLastCheckDate: today }));
    }
  }, [state.transactions, state.weeklyBudget]);

  const handleDeleteTransaction = (id: string) => {
    setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  };

  const handleSetBudget = (amount: number) => {
    setState(prev => ({ ...prev, monthlyBudget: amount }));
  };

  // â”€â”€ Shop / Avatar â”€â”€
  const handleBuyItem = (itemId: string, cost: number) => {
    setState(prev => ({
      ...prev,
      coins: prev.coins - cost,
      avatar: { ...prev.avatar, owned: [...prev.avatar.owned, itemId] },
    }));
  };

  const handleEquipItem = (slot: AvatarSlot, itemId: string | null) => {
    setState(prev => {
      const newEquipped = { ...prev.avatar.equipped };
      if (itemId === null) delete newEquipped[slot];
      else newEquipped[slot] = itemId;
      return { ...prev, avatar: { ...prev.avatar, equipped: newEquipped } };
    });
  };

  const handleSetColors = (colors: { skinTone?: string; hairColor?: string; eyeColor?: string }) => {
    setState(prev => ({ ...prev, avatar: { ...prev.avatar, ...colors } }));
  };

  // ── Scam Spotter result ──
  const handleScamSpotterComplete = (r: ScamSpotterResult) => {
    setState(prev => {
      const today = new Date().toDateString();
      let lp = r.totalLP;
      let coins = Math.round(r.totalLP * 0.5);
      // Streak: advance the counter + award the Streak-Shield bonus on a new day's first activity
      const ds = applyDailyStreak(prev, today);
      lp += ds.streakLP;
      const total = prev.leaguePoints + lp;
      return {
        ...prev,
        streak: ds.streak,
        leaguePoints: total,
        leagueTier: tierOfPoints(total),
        leagueWeekPoints: prev.leagueWeekPoints + lp,
        coins: prev.coins + coins,
        lastDailyActivity: today,
        mood: "happy",
      };
    });
  };

  // ── Bao Stand Tycoon result ──
  const handleBaoTycoonComplete = (r: BaoTycoonResult) => {
    setState(prev => {
      const today = new Date().toDateString();
      let lp = r.totalLP;
      const coins = Math.max(0, Math.round(r.totalProfit * 5));   // $20 profit = +100 coins
      // Streak: advance the counter + award the Streak-Shield bonus on a new day's first activity
      const ds = applyDailyStreak(prev, today);
      lp += ds.streakLP;
      const total = prev.leaguePoints + lp;
      return {
        ...prev,
        streak: ds.streak,
        leaguePoints: total,
        leagueTier: tierOfPoints(total),
        leagueWeekPoints: prev.leagueWeekPoints + lp,
        coins: prev.coins + coins,
        lastDailyActivity: today,
        mood: "happy",
      };
    });
  };

  // ── LP #4 Frugal Ribbons ──
  const handleLifeEnded = (summary: LifeRunSummary) => {
    setState(prev => {
      // Derive run state from choice log keywords (simple substring scan)
      const log = summary.choicesMade.join(" | ").toLowerCase();
      const runFacts = {
        investedBefore25: log.includes("index") || log.includes("invest") || log.includes("etf") || prev.lifeRunState.investedBefore25,
        everInDebt: log.includes("max it out") || log.includes("yolo") || log.includes("klarna") || log.includes("debt"),
        assetClassesUsed: [
          ...new Set([
            ...(log.includes("index") ? ["index"] : []),
            ...(log.includes("savings") || log.includes("hysa") ? ["savings"] : []),
            ...(log.includes("crypto") ? ["crypto"] : []),
            ...(log.includes("house") || log.includes("property") || log.includes("apartment") ? ["real_estate"] : []),
            ...(log.includes("bond") ? ["bonds"] : []),
            ...(log.includes("stock") ? ["stocks"] : []),
          ]),
        ],
        hasInsurance: log.includes("insurance"),
        cpfMaxed: log.includes("cpf"),
        finalAge: summary.finalAge,
        finalWealth: summary.finalWealth,
      };

      // Check each ribbon; award first-time only
      const earned: string[] = [];
      let lpAwarded = 0;
      for (const ribbon of RIBBONS) {
        if (!prev.lifeRibbons.includes(ribbon.id) && ribbon.test(runFacts)) {
          earned.push(ribbon.id);
          lpAwarded += LP_REWARDS.RIBBON_REWARD;
        }
      }

      if (earned.length > 0) {
        confetti({ particleCount: 250, spread: 110, origin: { y: 0.45 }, colors: ["#FBBF24", "#A855F7", "#EF4444", "#10B981"] });
      }

      const total = prev.leaguePoints + lpAwarded;
      return {
        ...prev,
        lifeRibbons: [...prev.lifeRibbons, ...earned],
        leaguePoints: total,
        leagueTier: tierOfPoints(total),
        leagueWeekPoints: prev.leagueWeekPoints + lpAwarded,
      };
    });
  };

  // â”€â”€ Derived â”€â”€
  const level = getLevel(state.experience);
  const xpInLevel = state.experience - level.currentThreshold;
  const xpRange = level.nextThreshold - level.currentThreshold || 1;
  const xpProgress = Math.min(100, (xpInLevel / xpRange) * 100);

  // Daily challenge done-states (drive the redesigned Today's Challenges section)
  const todayStr = new Date().toDateString();
  const dailyDone = state.dailyChallengeDate === todayStr;
  const hlDone = state.higherLowerDate === todayStr;
  const gsDone = state.guesstimateDate === todayStr;
  const mfDone = state.mythFactDate === todayStr;


  const portfolioValue = Object.entries(state.stockHoldings).reduce(
    (sum, [id, qty]) => sum + qty * (state.stockPrices[id] || 0), 0
  );

  const monthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`;
  const thisMonthExpenses = state.transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === "expense" && `${d.getFullYear()}-${d.getMonth()}` === monthKey;
    })
    .reduce((s, t) => s + t.amount, 0);

  const moodLabel = state.mood === "happy" ? "Thriving 🌟" : state.mood === "thirsty" ? "Says hi 👋" : "Misses you 😢";
  const moodColor = state.mood === "happy" ? "text-emerald-400" : state.mood === "thirsty" ? "text-blue-400" : "text-red-400";

  // Admins don't play — they get the admin console instead of the student app
  // (no leaderboard, no games/learn). Full account management lives in there.
  if (isAdmin && account) {
    return <AdminConsole account={account} onLogout={() => handleAccountSave(null)} />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen pb-32 pt-5 px-4 flex flex-col gap-5">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1.5 rounded-full shadow-sm">
            <Coins size={15} className="text-yellow-500 fill-yellow-500/40" />
            <CountUp value={state.coins} className="font-bold text-sm text-[var(--text-main)]" />
          </div>
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-500 px-3 py-1.5 rounded-full">
            <Flame size={15} className="fill-orange-500" />
            <span className="font-bold text-sm tracking-tight">{state.streak}</span>
          </div>
          {/* LoL rank pill */}
          <button
            onClick={() => setActiveTab("league")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs tracking-tight active:scale-95 transition-transform"
            style={{
              background: `linear-gradient(135deg, ${TIER_CONFIG[getRank(state.leaguePoints).tier].gradient[0]}30, ${TIER_CONFIG[getRank(state.leaguePoints).tier].gradient[1]}10)`,
              border: `1px solid ${TIER_CONFIG[getRank(state.leaguePoints).tier].color}50`,
              color: TIER_CONFIG[getRank(state.leaguePoints).tier].color,
            }}
          >
            <span>{TIER_CONFIG[getRank(state.leaguePoints).tier].icon}</span>
            <span>{formatRank(getRank(state.leaguePoints))}</span>
          </button>
        </div>
        <div className="flex gap-1.5 items-center">
          <button onClick={() => setShowHowToPlay(true)} className="p-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-violet-500 active:scale-90 transition-all">
            <HelpCircle size={18} />
          </button>
          <button onClick={() => setShowAccount(true)} className="p-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] active:scale-90 transition-transform overflow-hidden">
            {account ? <span className="text-base leading-none">{account.avatar}</span> : <UserCircle2 size={18} className="text-[var(--text-muted)]" />}
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] active:scale-90 transition-transform">
            {state.theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>

      {/* â”€â”€ Dashboard â”€â”€ */}
      {activeTab === "dashboard" && (
        <div className="flex flex-col gap-5">

          {/* Avatar hero card */}
          <div className="relative rounded-[28px] overflow-hidden">
            <button
              onClick={() => setActiveTab("shop")}
              className="w-full block active:scale-[0.99] transition-transform"
              aria-label="Customize your character"
            >
              <Avatar
                face={variantOf(state.avatar.equipped.face)}
                hair={variantOf(state.avatar.equipped.hair)}
                brows={variantOf(state.avatar.equipped.brows)}
                eyes={variantOf(state.avatar.equipped.eyes)}
                mouth={variantOf(state.avatar.equipped.mouth)}
                hat={variantOf(state.avatar.equipped.hat)}
                glasses={variantOf(state.avatar.equipped.glasses)}
                outfit={variantOf(state.avatar.equipped.outfit)}
                accessory={variantOf(state.avatar.equipped.accessory)}
                background={variantOf(state.avatar.equipped.background)}
                skinTone={state.avatar.skinTone}
                hairColor={state.avatar.hairColor}
                eyeColor={state.avatar.eyeColor}
                mood={state.mood}
                size={500}
                className="w-full h-auto"
              />
            </button>

            {/* Top dark gradient for legibility */}
            <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/60 via-black/30 to-transparent pointer-events-none" />
            {/* Bottom dark gradient */}
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/70 via-black/40 to-transparent pointer-events-none" />

            {/* Top info row */}
            <div className="absolute top-4 left-5 right-5 z-10 flex justify-between items-start pointer-events-none">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/60 font-semibold mb-0.5">Level {level.level}</p>
                <p className="text-[17px] font-bold text-emerald-300 leading-tight drop-shadow-md">{level.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/60 font-semibold mb-0.5">Status</p>
                <p className={`text-[13px] font-bold drop-shadow-md ${moodColor}`}>{moodLabel}</p>
              </div>
            </div>

            {/* Bottom: XP bar */}
            <div className="absolute bottom-4 left-5 right-5 z-10 pointer-events-none">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Growth Progress</span>
                <span className="text-[11px] font-bold text-violet-300 drop-shadow-md">{state.experience} XP</span>
              </div>
              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full relative overflow-hidden"
                >
                  <div className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                </motion.div>
              </div>
            </div>

            {/* Customize hint badge */}
            <button
              onClick={() => setActiveTab("shop")}
              className="absolute top-16 right-5 z-20 flex items-center gap-1 bg-violet-600/95 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg active:scale-95 transition-transform"
            >
              <Sparkles size={10} />
              Customize
            </button>
          </div>

          {/* Today's Challenges (tiered: headline + carousel + utility row) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-[15px] font-bold flex items-center gap-2">
                <Zap size={16} className="text-violet-500" />
                Today's Challenges
              </h2>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {[dailyDone, state.tasksDoneToday.loggedExpense, hlDone, gsDone, mfDone].filter(Boolean).length}/7 done
              </span>
            </div>

            {/* Headline — Daily Challenge */}
            <motion.button
              whileTap={!dailyDone ? { scale: 0.98 } : {}}
              onClick={() => { if (!dailyDone) { setLearnInitialMode(null); setActiveTab("quiz"); } }}
              disabled={dailyDone}
              className="relative overflow-hidden rounded-3xl text-left p-4 border"
              style={{
                background: dailyDone
                  ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))"
                  : "linear-gradient(135deg, rgba(244,63,94,0.20), rgba(168,85,247,0.12))",
                borderColor: dailyDone ? "rgba(34,197,94,0.30)" : "rgba(244,63,94,0.30)",
              }}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-30 pointer-events-none"
                style={{ backgroundColor: dailyDone ? "#22C55E" : "#F43F5E" }} />
              <div className="relative flex items-center gap-3">
                <span className="text-4xl shrink-0">{dailyDone ? "✅" : "🔥"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/30"
                      style={{ color: dailyDone ? "#22C55E" : "#F43F5E" }}>Daily Challenge</span>
                    {!dailyDone && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-full">HARD</span>
                    )}
                  </div>
                  <p className="font-extrabold text-base mt-1 leading-tight" style={{ color: dailyDone ? "#22C55E" : "var(--text-main)" }}>
                    {dailyDone ? "Done — back tomorrow!" : "Today's Brain Buster"}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="flex items-center gap-1 text-amber-400 font-black text-sm">
                    <Trophy size={14} /> +{LP_REWARDS.DAILY_CHALLENGE}
                  </span>
                  {!dailyDone && <ChevronRight size={20} className="text-[var(--text-muted)]" />}
                </div>
              </div>
            </motion.button>

            {/* Mini daily challenges — horizontal carousel */}
            <div className="flex gap-2.5 overflow-x-auto -mx-4 px-4 pb-1">
              {[
                { key: "higher_lower" as const, emoji: "⚖️", title: "Higher or Lower", max: 5 * LP_REWARDS.HL_PER_CORRECT,   done: hlDone, accent: "#06B6D4" },
                { key: "guesstimate" as const,  emoji: "🎯", title: "Guesstimate",     max: 4 * LP_REWARDS.GUESS_MAX_PER,   done: gsDone, accent: "#F59E0B" },
                { key: "myth_fact" as const,    emoji: "🔍", title: "Myth or Fact",    max: 6 * LP_REWARDS.MYTH_PER_CORRECT, done: mfDone, accent: "#A855F7" },
              ].map(c => (
                <motion.button
                  key={c.key}
                  whileTap={!c.done ? { scale: 0.97 } : {}}
                  onClick={() => { if (!c.done) { setLearnInitialMode(c.key); setActiveTab("quiz"); } }}
                  disabled={c.done}
                  className={`shrink-0 w-[136px] p-3 rounded-2xl border text-left flex flex-col gap-2 ${
                    c.done ? "bg-emerald-500/8 border-emerald-500/30" : "bg-[var(--bg-card)] border-[var(--border-color)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{c.done ? "✅" : c.emoji}</span>
                    {c.done
                      ? <CheckCircle2 size={14} className="text-emerald-500" />
                      : <span className="text-[9px] font-black" style={{ color: c.accent }}>up to +{c.max}</span>}
                  </div>
                  <div>
                    <p className={`font-bold text-[12px] leading-tight ${c.done ? "text-emerald-400" : ""}`}>{c.title}</p>
                    <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-bold mt-0.5">{c.done ? "Done" : "Daily"}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Secondary utility actions */}
            <div className="grid grid-cols-3 gap-2.5">
              <MissionCard title="Log Expense" done={state.tasksDoneToday.loggedExpense} reward={0} onClick={() => setActiveTab("wallet")} icon="💸" accent="green" hint="+5 LP" />
              <MissionCard title="Minigames"   done={false}                              reward={0} onClick={() => setActiveTab("games")}  icon="🎮" accent="cyan"  hint="Play" />
              <MissionCard title="My Buddy"    done={false}                              reward={0} onClick={() => setActiveTab("shop")}   icon="🧑" accent="amber" hint="Style" />
            </div>
          </div>

          {/* Weekly Quests */}
          <WeeklyQuestsCard
            quests={state.weeklyQuests}
            bonusClaimed={state.weeklyQuestBonusClaimed}
            onNavigate={(t) => {
              if (t === "quiz") setActiveTab("quiz");
              else if (t === "wallet_log") setActiveTab("wallet");
              else setActiveTab("games");
            }}
          />

          {/* Trophies / Frugal Ribbons */}
          <RibbonsCard
            earned={state.lifeRibbons}
            onPlayLife={() => setActiveTab("life")}
            onViewAll={() => setActiveTab("trophies")}
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setActiveTab("stocks")}
              className="card-base !p-4 flex flex-col gap-2.5 text-left active:scale-[0.97] transition-transform card-glow"
            >
              <div className="flex items-center justify-between">
                <div className="bg-blue-500/10 p-1.5 rounded-xl">
                  <TrendingUp size={14} className="text-brand-blue" />
                </div>
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Portfolio</span>
              </div>
              <div>
                <p className="font-extrabold text-[20px] leading-tight tabular-nums">${portfolioValue.toFixed(0)}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Cash: ${state.stockCash.toFixed(0)}</p>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className="card-base !p-4 flex flex-col gap-2.5 text-left active:scale-[0.97] transition-transform card-glow"
            >
              <div className="flex items-center justify-between">
                <div className="bg-emerald-500/10 p-1.5 rounded-xl">
                  <WalletIcon size={14} className="text-emerald-500" />
                </div>
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Spent</span>
              </div>
              <div>
                <p className="font-extrabold text-[20px] leading-tight tabular-nums">${thisMonthExpenses.toFixed(0)}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {state.monthlyBudget > 0 ? `of $${state.monthlyBudget.toFixed(0)} budget` : "This month"}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Games hub */}
      {activeTab === "games" && (
        <GamesHub
          onPlay={(g) => {
            if (g === "stocks") setActiveTab("stocks");
            else if (g === "life") setActiveTab("life");
            else if (g === "scam_spotter") setActiveTab("scam_spotter");
            else if (g === "bao_tycoon") setActiveTab("bao_tycoon");
          }}
        />
      )}

      {/* Scam Spotter */}
      {activeTab === "scam_spotter" && (
        <ScamSpotter
          onExit={() => setActiveTab("games")}
          onComplete={(r) => handleScamSpotterComplete(r)}
        />
      )}

      {/* Bao Stand Tycoon */}
      {activeTab === "bao_tycoon" && (
        <BaoStandTycoon
          onExit={() => setActiveTab("games")}
          onComplete={(r) => handleBaoTycoonComplete(r)}
        />
      )}

      {/* Stocks */}
      {activeTab === "stocks" && (
        <StocksTab
          stockCash={state.stockCash}
          stockHoldings={state.stockHoldings}
          stockAvgBuy={state.stockAvgBuy}
          stockPrices={state.stockPrices}
          stockHistory={state.stockHistory}
          onBuy={handleBuyStock}
          onSell={handleSellStock}
        />
      )}

      {/* â”€â”€ Wallet (replaces Budget) â”€â”€ */}
      {activeTab === "wallet" && (
        <WalletTab
          transactions={state.transactions}
          monthlyBudget={state.monthlyBudget}
          onAdd={handleAddTransaction}
          onDelete={handleDeleteTransaction}
          onSetBudget={handleSetBudget}
        />
      )}

      {/* â”€â”€ Shop â”€â”€ */}
      {activeTab === "shop" && (
        <ShopTab
          coins={state.coins}
          avatar={state.avatar}
          mood={state.mood}
          onBuy={handleBuyItem}
          onEquip={handleEquipItem}
          onSetColors={handleSetColors}
        />
      )}

      {/* â”€â”€ Quiz â”€â”€ */}
      {activeTab === "quiz" && (
        <LearnTab
          quizMastery={state.quizMastery}
          dailyChallengeDate={state.dailyChallengeDate}
          dailyChallengeQuestionId={state.dailyChallengeQuestionId}
          practicePointsToday={state.practicePointsToday}
          practiceDate={state.practiceDate}
          higherLowerDate={state.higherLowerDate}
          guesstimateDate={state.guesstimateDate}
          mythFactDate={state.mythFactDate}
          initialMode={learnInitialMode}
          onConsumeInitialMode={() => setLearnInitialMode(null)}
          onAnswer={handleLearnAnswer}
          onDailyChallengeComplete={handleDailyChallengeComplete}
        />
      )}

      {/* â”€â”€ League â”€â”€ */}
      {activeTab === "league" && (
        <LeagueTab
          leaguePoints={state.leaguePoints}
          leagueTier={state.leagueTier}
          leagueWeekPoints={state.leagueWeekPoints}
          leagueWeekStart={state.leagueWeekStart}
          account={account}
          onOpenAccount={() => setShowAccount(true)}
        />
      )}

      {/* Life Simulator */}
      {activeTab === "life" && (
        <LifeTab
          onYearAdvanced={() => {
            // Weekly quest: life_year
            setState(prev => {
              const qu = advanceQuest(prev, "life_year", 1);
              if (qu.lpAwarded === 0) return { ...prev, weeklyQuests: qu.weeklyQuests };
              const total = prev.leaguePoints + qu.lpAwarded;
              return {
                ...prev,
                weeklyQuests: qu.weeklyQuests,
                weeklyQuestBonusClaimed: qu.weeklyQuestBonusClaimed,
                leaguePoints: total,
                leagueTier: tierOfPoints(total),
                leagueWeekPoints: prev.leagueWeekPoints + qu.lpAwarded,
              };
            });
          }}
          onLifeEnded={(summary) => handleLifeEnded(summary)}
        />
      )}

      {/* Trophies (full Achievements screen) */}
      {activeTab === "trophies" && (
        <TrophiesScreen
          earned={state.lifeRibbons}
          onBack={() => setActiveTab("dashboard")}
          onPlayLife={() => setActiveTab("life")}
        />
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
      {showAccount && (
        <AccountModal
          account={account}
          initialView={accountInitialView}
          onSave={handleAccountSave}
          onClose={() => { setShowAccount(false); setAccountInitialView(undefined); }}
        />
      )}

      {/* First-run onboarding */}
      {showOnboarding && (
        <Onboarding
          onCreateAccount={() => { finishOnboarding(); setAccountInitialView("signup"); setShowAccount(true); }}
          onLogin={() => { finishOnboarding(); setAccountInitialView("login"); setShowAccount(true); }}
          onGuest={finishOnboarding}
        />
      )}

      <Analytics />
    </div>
  );
}

// â”€â”€â”€ CountUp â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CountUp({ value, className, decimals = 0 }: { value: number; className?: string; decimals?: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const end = value;
    const duration = 800;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = p * (2 - p);
      setDisplay(start + (end - start) * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span className={className}>{display.toFixed(decimals)}</span>;
}

// â”€â”€â”€ MissionCard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type AccentColor = "violet" | "cyan" | "green" | "amber";
const ACCENT: Record<AccentColor, { bg: string; border: string; text: string; hover: string }> = {
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-400", hover: "hover:border-violet-500/40" },
  cyan:   { bg: "bg-cyan-500/10",   border: "border-cyan-500/20",   text: "text-cyan-400",   hover: "hover:border-cyan-500/40" },
  green:  { bg: "bg-green-500/10",  border: "border-green-500/20",  text: "text-green-400",  hover: "hover:border-green-500/40" },
  amber:  { bg: "bg-amber-500/10",  border: "border-amber-500/20",  text: "text-amber-400",  hover: "hover:border-amber-500/40" },
};

function MissionCard({
  title, done, reward, onClick, icon, hint, accent = "violet",
}: {
  title: string; done: boolean; reward: number; onClick: () => void;
  icon: string; hint?: string; accent?: AccentColor;
}) {
  const c = ACCENT[accent];
  return (
    <motion.button
      whileTap={!done ? { scale: 0.96 } : {}}
      onClick={!done ? onClick : undefined}
      className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition-all duration-200 ${
        done
          ? "bg-[var(--bg-card)] border-[var(--border-color)] opacity-50 cursor-default"
          : `bg-[var(--bg-card)] ${c.border} ${c.hover}`
      }`}
    >
      <div className="flex justify-between items-start">
        <div className={`${done ? "bg-slate-500/10 grayscale" : c.bg} p-2 rounded-xl`}>
          <span className="text-[18px] leading-none">{icon}</span>
        </div>
        {done ? (
          <CheckCircle2 size={14} className="text-emerald-500 mt-0.5" />
        ) : reward > 0 ? (
          <div className="flex items-center gap-0.5 bg-yellow-400/10 px-1.5 py-0.5 rounded-lg border border-yellow-400/20">
            <Coins size={8} className="text-yellow-500" />
            <span className="text-[9px] font-bold text-yellow-500">+{reward}</span>
          </div>
        ) : hint ? (
          <span className={`text-[9px] font-bold ${c.text} uppercase tracking-wide`}>{hint}</span>
        ) : null}
      </div>
      <span className={`font-bold text-[12px] leading-tight ${done ? "text-[var(--text-muted)]" : "text-[var(--text-main)]"}`}>
        {title}
      </span>
    </motion.button>
  );
}
