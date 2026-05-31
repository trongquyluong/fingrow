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
