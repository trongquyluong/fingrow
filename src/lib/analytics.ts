/**
 * analytics.ts — derives a research/admin progress snapshot from a student's
 * local UserState. Runs ON THE DEVICE at sync time (it needs the question bank
 * to map question ids -> topics), then uploads via syncProgress().
 *
 * Pure functions only — no React, no side effects.
 */
import { UserState } from "../types";
import { QUIZ_QUESTIONS } from "../constants";
import type { AccountData } from "../components/AccountModal";
import type { StudentProgressRow, ProgressDetails } from "./supabase";

// question id -> topic/category (built once)
const QID_TOPIC: Record<string, string> = {};
for (const q of QUIZ_QUESTIONS) QID_TOPIC[q.id] = q.category;

// Mirror of App.tsx getLevel thresholds (derived display value only).
function levelFromXp(xp: number): number {
  if (xp < 50) return 1;
  if (xp < 200) return 2;
  if (xp < 500) return 3;
  if (xp < 1000) return 4;
  return 5;
}

/**
 * Per-topic early/recent proxy for pre/post literacy comparison.
 *
 * Mastery only stores aggregates (seen/correct/firstSeen/lastSeen per question)
 * — not per-attempt logs. We proxy "early" vs "recent" by sorting each topic's
 * attempted questions by `firstSeen` timestamp, splitting at the median, and
 * accumulating seen/correct on each side. Topics with <2 questions are pushed
 * into both buckets equally (no improvement signal).
 */
function perTopicHalfAccuracy(state: UserState): {
  perTopicEarly: Record<string, { seen: number; correct: number }>;
  perTopicRecent: Record<string, { seen: number; correct: number }>;
} {
  const mastery = state.quizMastery ?? {};
  const byTopic: Record<string, [string, number, number, string | null][]> = {};
  // [qid, seen, correct, firstSeen]
  for (const [qid, m] of Object.entries(mastery)) {
    if (!m || m.seen <= 0) continue;
    const topic = QID_TOPIC[qid] ?? "Other";
    (byTopic[topic] ??= []).push([qid, m.seen, m.correct, m.firstSeen ?? null]);
  }
  const perTopicEarly: Record<string, { seen: number; correct: number }> = {};
  const perTopicRecent: Record<string, { seen: number; correct: number }> = {};
  for (const [topic, qs] of Object.entries(byTopic)) {
    const seenAcc = { seen: 0, correct: 0 };
    if (qs.length < 2) {
      // No signal — push the same totals to both halves.
      for (const [, s, c] of qs) { seenAcc.seen += s; seenAcc.correct += c; }
      perTopicEarly[topic] = { ...seenAcc };
      perTopicRecent[topic] = { ...seenAcc };
      continue;
    }
    qs.sort((a, b) => {
      const ta = a[3] ? new Date(a[3]).getTime() : Number.POSITIVE_INFINITY;
      const tb = b[3] ? new Date(b[3]).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb;
    });
    const mid = Math.floor(qs.length / 2);
    const early = { seen: 0, correct: 0 };
    const recent = { seen: 0, correct: 0 };
    for (let i = 0; i < qs.length; i++) {
      const [, s, c] = qs[i];
      if (i < mid) { early.seen += s; early.correct += c; }
      else { recent.seen += s; recent.correct += c; }
    }
    perTopicEarly[topic] = early;
    perTopicRecent[topic] = recent;
  }
  return { perTopicEarly, perTopicRecent };
}

/** Build the full progress row for a student. `today` is a toDateString() value. */
export function buildProgressSnapshot(
  state: UserState,
  account: AccountData,
  today: string,
): StudentProgressRow {
  const mastery = state.quizMastery ?? {};
  const entries = Object.entries(mastery);

  let attempts = 0;
  let correctAttempts = 0;
  let distinctCorrect = 0;
  let mastered = 0;
  const masteryDistribution = [0, 0, 0, 0, 0];           // level 0..4
  const topicMap: Record<string, { seen: number; correct: number }> = {};

  for (const [qid, m] of entries) {
    attempts += m.seen;
    correctAttempts += m.correct;
    if (m.correct > 0) distinctCorrect += 1;
    if (m.level === 4) mastered += 1;
    if (m.level >= 0 && m.level <= 4) masteryDistribution[m.level] += 1;
    const topic = QID_TOPIC[qid] ?? "Other";
    const t = (topicMap[topic] ??= { seen: 0, correct: 0 });
    t.seen += m.seen;
    t.correct += m.correct;
  }

  const accuracy = attempts > 0 ? correctAttempts / attempts : 0;

  const topicAccuracy = Object.entries(topicMap)
    .map(([topic, v]) => ({ topic, seen: v.seen, correct: v.correct }))
    .sort((a, b) => b.seen - a.seen);

  // Daily-challenge engagement TODAY (0..4)
  const dailyDoneToday =
    (state.dailyChallengeDate === today ? 1 : 0) +
    (state.higherLowerDate === today ? 1 : 0) +
    (state.guesstimateDate === today ? 1 : 0) +
    (state.mythFactDate === today ? 1 : 0);

  // Wallet behaviour
  let walletIncome = 0;
  let walletExpense = 0;
  const catMap: Record<string, { total: number; count: number }> = {};
  for (const tx of state.transactions ?? []) {
    if (tx.type === "income") walletIncome += tx.amount;
    else {
      walletExpense += tx.amount;
      const c = (catMap[tx.categoryId] ??= { total: 0, count: 0 });
      c.total += tx.amount;
      c.count += 1;
    }
  }
  const topCategories = Object.entries(catMap)
    .map(([categoryId, v]) => ({ categoryId, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const quests = state.weeklyQuests ?? [];

  // Pre/post per-topic halves (research proxy for "early" vs "recent" accuracy)
  const { perTopicEarly, perTopicRecent } = perTopicHalfAccuracy(state);

  // Stock portfolio math (mirrors App.tsx sellStock pricing).
  let stockPortfolioValue = 0;
  let costBasis = 0;
  for (const [id, qtyRaw] of Object.entries(state.stockHoldings ?? {})) {
    const qty = Number(qtyRaw) || 0;
    if (qty <= 0) continue;
    const price = state.stockPrices?.[id] ?? 0;
    const avg = state.stockAvgBuy?.[id] ?? 0;
    stockPortfolioValue += qty * price;
    costBasis += qty * avg;
  }
  const stockNetPnL = stockPortfolioValue - costBasis;
  const stockCash = state.stockCash ?? 0;

  // Engagement proxy: union of mastery firstSeen/lastSeen + transaction dates.
  // (We don't have a per-day activity log; this is a coarse estimate of
  //  "how many distinct days a student has shown up".)
  const activeDaySet = new Set<string>();
  let earliest: string | null = null;
  const consider = (iso?: string | null) => {
    if (!iso) return;
    let d: Date;
    try { d = new Date(iso); } catch { return; }
    if (Number.isNaN(d.getTime())) return;
    const key = d.toDateString();
    activeDaySet.add(key);
    if (!earliest || key < earliest) earliest = key;
  };
  for (const m of Object.values(state.quizMastery ?? {})) {
    consider(m.firstSeen);
    consider(m.lastSeen);
  }
  for (const t of state.transactions ?? []) consider(t.date);
  const daysActive = activeDaySet.size;
  const firstActiveDate = earliest;

  const details: ProgressDetails = {
    masteryDistribution,
    topicAccuracy,
    practicePointsToday: state.practicePointsToday ?? 0,
    budgetStreakDays: state.budgetStreakDays ?? 0,
    weeklyQuestsDone: quests.filter(q => q.done).length,
    weeklyQuestsTotal: quests.length,
    dailyChallengeDate: state.dailyChallengeDate ?? null,
    higherLowerDate: state.higherLowerDate ?? null,
    guesstimateDate: state.guesstimateDate ?? null,
    mythFactDate: state.mythFactDate ?? null,
    walletIncome,
    walletExpense,
    topCategories,
    // Research extensions
    scamSpotterScore: state.scamSpotterCorrect ?? 0,
    scamSpotterPlayed: state.scamSpotterPlayed ?? 0,
    scamSpotterRounds: state.scamSpotterRounds ?? 0,
    baoTycoonProfit: state.baoTycoonProfit ?? 0,
    baoTycoonDays: state.baoTycoonDays ?? 0,
    baoTycoonRounds: state.baoTycoonRounds ?? 0,
    lifeRibbonsList: state.lifeRibbons ?? [],
    lifeRunState: state.lifeRunState ?? undefined,
    stockPortfolioValue,
    stockNetPnL,
    stockCash,
    monthlyBudget: state.monthlyBudget ?? 0,
    weeklyBudget: state.weeklyBudget ?? 0,
    categoryBudgets: (state.categoryBudgets ?? {}) as Record<string, number>,
    coins: state.coins ?? 0,
    firstActiveDate,
    daysActive,
    perTopicEarly,
    perTopicRecent,
  };

  return {
    username: account.username.trim().toLowerCase(),
    level: levelFromXp(state.experience),
    xp: state.experience,
    league_points: state.leaguePoints,
    league_tier: state.leagueTier,
    league_week_points: state.leagueWeekPoints,
    streak: state.streak,
    questions_seen: entries.length,
    questions_correct: distinctCorrect,
    accuracy,
    mastered_count: mastered,
    daily_done_today: dailyDoneToday,
    transactions_count: (state.transactions ?? []).length,
    ribbons_count: (state.lifeRibbons ?? []).length,
    last_active: state.lastDailyActivity,
    details,
  };
}
