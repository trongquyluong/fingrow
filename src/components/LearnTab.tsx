/**
 * LearnTab.tsx — Daily Challenge + unlimited Practice mode.
 *
 * - Daily Challenge: one HARD question per day, +150 LP.
 * - Practice: unlimited questions from easy/medium pool, +5 LP each,
 *   capped at +50 LP/day (so daily challenge stays special).
 * - Each question also fires Mastery Climb LP (spaced repetition).
 */

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, Sparkles, Lock, Zap, ChevronRight, Trophy } from "lucide-react";
import { QuizQuestion, QuestionMastery, DailyChallengeResult } from "../types";
import {
  QUIZ_QUESTIONS, getDifficulty, questionsByDifficulty,
  MASTERY_NAMES, MASTERY_COLORS, LP_REWARDS,
  pickDailyHigherLower, pickDailyGuesstimate, pickDailyMythFact,
} from "../constants";
import HigherLower from "./learn/HigherLower";
import Guesstimate from "./learn/Guesstimate";
import MythOrFact from "./learn/MythOrFact";

export type AnswerResult = {
  questionId: string;
  correct: boolean;
  isDaily: boolean;
  lpAwarded: number;
  coinsAwarded: number;
  masteryBefore: number;
  masteryAfter: number;
  explanation: string;
};

interface LearnTabProps {
  quizMastery: Record<string, QuestionMastery>;
  dailyChallengeDate: string | null;
  dailyChallengeQuestionId: string | null;
  practicePointsToday: number;
  practiceDate: string | null;
  higherLowerDate: string | null;
  guesstimateDate: string | null;
  mythFactDate: string | null;
  initialMode?: "higher_lower" | "guesstimate" | "myth_fact" | null;
  onConsumeInitialMode?: () => void;
  onAnswer: (result: AnswerResult) => void;
  onDailyChallengeComplete: (result: DailyChallengeResult) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const todayKey = () => new Date().toDateString();

/** Deterministic pick from `hard` pool based on date — same challenge for everyone today */
function pickDailyChallenge(date: string): QuizQuestion {
  const hard = questionsByDifficulty("hard");
  // Fall back to all questions if no hard ones exist
  const pool = hard.length > 0 ? hard : QUIZ_QUESTIONS;
  let hash = 0;
  for (let i = 0; i < date.length; i++) hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

/** Pick next practice question weighted toward less-mastered ones. */
function pickPracticeQuestion(
  mastery: Record<string, QuestionMastery>,
  exclude: string[],
): QuizQuestion {
  const pool = QUIZ_QUESTIONS.filter(q => getDifficulty(q) !== "hard" && !exclude.includes(q.id));
  if (pool.length === 0) return QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
  // Weight: lower mastery → higher weight
  const weighted = pool.map(q => {
    const m = mastery[q.id]?.level ?? 0;
    const weight = 5 - m;  // level 0 = weight 5, level 4 = weight 1
    return { q, weight };
  });
  const total = weighted.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const { q, weight } of weighted) {
    r -= weight;
    if (r <= 0) return q;
  }
  return weighted[0].q;
}

// ════════════════════════════════════════════════════════════════════════════
export default function LearnTab({
  quizMastery,
  dailyChallengeDate,
  practicePointsToday,
  practiceDate,
  higherLowerDate,
  guesstimateDate,
  mythFactDate,
  initialMode,
  onConsumeInitialMode,
  onAnswer,
  onDailyChallengeComplete,
}: LearnTabProps) {
  const today = todayKey();
  const dailyDone = dailyChallengeDate === today;
  const todaysChallenge = useMemo(() => pickDailyChallenge(today), [today]);
  const todayPracticePoints = practiceDate === today ? practicePointsToday : 0;
  const practiceCapReached = todayPracticePoints >= LP_REWARDS.PRACTICE_DAILY_CAP;

  // Extra daily challenges — deterministic per day
  const hlSet = useMemo(() => pickDailyHigherLower(today), [today]);
  const gsSet = useMemo(() => pickDailyGuesstimate(today), [today]);
  const mfSet = useMemo(() => pickDailyMythFact(today), [today]);
  const hlDone = higherLowerDate === today;
  const gsDone = guesstimateDate === today;
  const mfDone = mythFactDate === today;

  // Active practice question state
  const [practiceQ, setPracticeQ] = useState<QuizQuestion | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<"hub" | "challenge" | "practice" | "higher_lower" | "guesstimate" | "myth_fact">("hub");

  const finishDaily = (result: DailyChallengeResult) => {
    onDailyChallengeComplete(result);
    setMode("hub");
  };

  // Deep-link from the dashboard: open a specific challenge (unless already done today)
  useEffect(() => {
    if (!initialMode) return;
    const doneToday = { higher_lower: hlDone, guesstimate: gsDone, myth_fact: mfDone }[initialMode];
    if (!doneToday) setMode(initialMode);
    onConsumeInitialMode?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  // Mastery distribution stats
  const masteryStats = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    QUIZ_QUESTIONS.forEach(q => {
      const m = quizMastery[q.id];
      counts[m?.level ?? 0] += 1;
    });
    return counts;
  }, [quizMastery]);
  const masteredCount = masteryStats[4];
  const totalQuestions = QUIZ_QUESTIONS.length;

  useEffect(() => {
    if (mode === "practice" && !practiceQ) {
      setPracticeQ(pickPracticeQuestion(quizMastery, practiceHistory));
    }
  }, [mode, practiceQ]);

  const handleAnswer = (question: QuizQuestion, selected: number, isDaily: boolean) => {
    const correct = selected === question.correctAnswer;
    const before = quizMastery[question.id]?.level ?? 0;
    let lp = 0;
    let coins = 0;
    let after = before;

    if (correct) {
      if (isDaily) {
        lp = LP_REWARDS.DAILY_CHALLENGE;
        coins = 200;
      } else {
        // Practice — cap-aware
        const remaining = LP_REWARDS.PRACTICE_DAILY_CAP - todayPracticePoints;
        lp = Math.max(0, Math.min(LP_REWARDS.PRACTICE_CORRECT, remaining));
      }
      // Mastery climb (in addition to base LP)
      const today = todayKey();
      const cur = quizMastery[question.id];
      if (!cur) {
        after = 1;
        lp += LP_REWARDS.MASTERY_SEEN;
      } else {
        const daysSinceLast = cur.lastCorrectDate
          ? Math.floor((Date.now() - new Date(cur.lastCorrectDate).getTime()) / 86400000)
          : Infinity;
        const daysSinceFirst = Math.floor((Date.now() - new Date(cur.firstSeenDate).getTime()) / 86400000);
        const nextCorrect = cur.correct + 1;
        if (daysSinceLast >= 1) {
          if (cur.level === 1 && nextCorrect >= 2) { after = 2; lp += LP_REWARDS.MASTERY_FAMILIAR; }
          else if (cur.level === 2 && nextCorrect >= 3 && daysSinceFirst >= 3) { after = 3; lp += LP_REWARDS.MASTERY_PROFICIENT; }
          else if (cur.level === 3 && nextCorrect >= 4 && daysSinceFirst >= 7) { after = 4; lp += LP_REWARDS.MASTERY_MASTERED; }
        }
      }
    }

    onAnswer({
      questionId: question.id,
      correct,
      isDaily,
      lpAwarded: lp,
      coinsAwarded: coins,
      masteryBefore: before,
      masteryAfter: after,
      explanation: question.explanation,
    });
  };

  // ────────────────────────────────────────────────────────────────────────
  if (mode === "challenge") {
    return (
      <QuestionView
        question={todaysChallenge}
        isDaily={true}
        onAnswer={(sel) => handleAnswer(todaysChallenge, sel, true)}
        onBack={() => setMode("hub")}
        masteryLevel={quizMastery[todaysChallenge.id]?.level ?? 0}
      />
    );
  }

  if (mode === "higher_lower") {
    return <HigherLower pairs={hlSet} onComplete={finishDaily} onBack={() => setMode("hub")} />;
  }
  if (mode === "guesstimate") {
    return <Guesstimate items={gsSet} onComplete={finishDaily} onBack={() => setMode("hub")} />;
  }
  if (mode === "myth_fact") {
    return <MythOrFact items={mfSet} onComplete={finishDaily} onBack={() => setMode("hub")} />;
  }

  if (mode === "practice" && practiceQ) {
    return (
      <QuestionView
        question={practiceQ}
        isDaily={false}
        capReached={practiceCapReached}
        onAnswer={(sel) => {
          handleAnswer(practiceQ, sel, false);
          setPracticeHistory(h => [...h, practiceQ.id].slice(-10));
          setPracticeQ(null);  // triggers next via useEffect
        }}
        onSkip={() => {
          setPracticeHistory(h => [...h, practiceQ.id].slice(-10));
          setPracticeQ(pickPracticeQuestion(quizMastery, [...practiceHistory, practiceQ.id]));
        }}
        onBack={() => { setMode("hub"); setPracticeQ(null); }}
        masteryLevel={quizMastery[practiceQ.id]?.level ?? 0}
      />
    );
  }

  // ───── HUB VIEW ─────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-5"
    >
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Learn</h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Tackle today's challenge or practice forever</p>
      </div>

      {/* ── Daily Challenge card ── */}
      <motion.button
        whileTap={!dailyDone ? { scale: 0.98 } : {}}
        onClick={() => !dailyDone && setMode("challenge")}
        disabled={dailyDone}
        className="relative overflow-hidden rounded-3xl text-left border transition-all"
        style={{
          background: dailyDone
            ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))"
            : "linear-gradient(135deg, rgba(244,63,94,0.18), rgba(168,85,247,0.10))",
          borderColor: dailyDone ? "rgba(34,197,94,0.30)" : "rgba(244,63,94,0.30)",
          boxShadow: dailyDone ? "none" : "0 4px 24px rgba(244,63,94,0.20)",
        }}
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl opacity-30 pointer-events-none"
          style={{ backgroundColor: dailyDone ? "#22C55E" : "#F43F5E" }} />

        <div className="relative p-5 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm"
                style={{ color: dailyDone ? "#22C55E" : "#F43F5E" }}>
                🔥 Daily Challenge
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-full">
                HARD
              </span>
            </div>
            <div className="flex items-center gap-1 text-white font-black text-sm">
              <Trophy size={14} className="text-amber-400" />
              +{LP_REWARDS.DAILY_CHALLENGE} LP
            </div>
          </div>

          <div className="flex items-center gap-4 mt-1">
            <div className="text-5xl">{dailyDone ? "✅" : "🔥"}</div>
            <div className="flex-1">
              <h3 className="font-extrabold text-lg leading-tight" style={{ color: dailyDone ? "#22C55E" : "white" }}>
                {dailyDone ? "Done — back tomorrow!" : "Today's Brain Buster"}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                {dailyDone
                  ? `You crushed today's challenge. Comes back at midnight.`
                  : `One hard question. Solve it for +${LP_REWARDS.DAILY_CHALLENGE} LP + 200 coins.`}
              </p>
            </div>
            {!dailyDone && <ChevronRight size={22} className="text-[var(--text-muted)] shrink-0" />}
          </div>
        </div>
      </motion.button>

      {/* ── More daily challenges ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            ⚡ More Daily Challenges
          </h3>
          <span className="text-[10px] font-bold tabular-nums text-[var(--text-muted)]">
            {[hlDone, gsDone, mfDone].filter(Boolean).length}/3 done
          </span>
        </div>
        {[
          { key: "higher_lower" as const, emoji: "⚖️", title: "Higher or Lower", desc: "Spot the bigger figure", maxLp: hlSet.length * LP_REWARDS.HL_PER_CORRECT, done: hlDone, accent: "#06B6D4" },
          { key: "guesstimate" as const,  emoji: "🎯", title: "Guesstimate",     desc: "How close can you get?", maxLp: gsSet.length * LP_REWARDS.GUESS_MAX_PER, done: gsDone, accent: "#F59E0B" },
          { key: "myth_fact" as const,    emoji: "🔍", title: "Myth or Fact",    desc: "True or false?",         maxLp: mfSet.length * LP_REWARDS.MYTH_PER_CORRECT, done: mfDone, accent: "#A855F7" },
        ].map(c => (
          <motion.button
            key={c.key}
            whileTap={!c.done ? { scale: 0.98 } : {}}
            onClick={() => !c.done && setMode(c.key)}
            disabled={c.done}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
              c.done
                ? "bg-emerald-500/8 border-emerald-500/30"
                : "bg-[var(--bg-card)] border-[var(--border-color)] hover:border-violet-500/40"
            }`}
          >
            <span className="text-2xl shrink-0">{c.done ? "✅" : c.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${c.done ? "text-emerald-400" : ""}`}>{c.title}</p>
              <p className="text-[10px] text-[var(--text-muted)] leading-snug">
                {c.done ? "Done — back tomorrow!" : c.desc}
              </p>
            </div>
            {c.done ? (
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-black" style={{ color: c.accent }}>up to +{c.maxLp}</span>
                <ChevronRight size={18} className="text-[var(--text-muted)]" />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* ── Practice mode card ── */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setMode("practice")}
        className="relative overflow-hidden rounded-3xl border border-violet-500/30 text-left p-5 transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(59,130,246,0.08))",
          boxShadow: "0 4px 24px rgba(168,85,247,0.20)",
        }}
      >
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-2xl opacity-25 pointer-events-none bg-violet-500" />

        <div className="relative flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
              📚 Practice Mode
            </span>
            <span className="text-[10px] font-black text-emerald-400">
              +{LP_REWARDS.PRACTICE_CORRECT} LP each · cap +{LP_REWARDS.PRACTICE_DAILY_CAP}/day
            </span>
          </div>

          <div className="flex items-center gap-4 mt-1">
            <div className="text-5xl">🧠</div>
            <div className="flex-1">
              <h3 className="font-extrabold text-lg leading-tight text-white">
                Unlimited Questions
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Sharpen up with as many easy & medium questions as you want.
              </p>
            </div>
            <ChevronRight size={22} className="text-violet-300 shrink-0" />
          </div>

          {/* Practice LP progress today */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              <span>Practice LP today</span>
              <span className="text-emerald-400">
                +{todayPracticePoints} / +{LP_REWARDS.PRACTICE_DAILY_CAP}
              </span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all"
                style={{ width: `${Math.min(100, (todayPracticePoints / LP_REWARDS.PRACTICE_DAILY_CAP) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </motion.button>

      {/* ── Mastery progress ── */}
      <div className="card-base !p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            🧠 Knowledge Mastery
          </h3>
          <span className="text-xs font-bold tabular-nums">
            <span className="text-amber-400">{masteredCount}</span> / {totalQuestions} mastered
          </span>
        </div>
        {/* Stacked progress bar */}
        <div className="h-3 w-full bg-[var(--bg-main)] rounded-full overflow-hidden flex">
          {masteryStats.map((count, i) => {
            const pct = (count / totalQuestions) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={i}
                className="h-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: MASTERY_COLORS[i] }}
                title={`${MASTERY_NAMES[i]}: ${count}`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5 text-[9px] font-bold uppercase tracking-wider">
          {MASTERY_NAMES.map((name, i) => (
            <span key={name} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MASTERY_COLORS[i] }} />
              <span style={{ color: MASTERY_COLORS[i] }}>{name}: {masteryStats[i]}</span>
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Question rendering (shared by daily challenge + practice) ─────────────
function QuestionView({
  question, isDaily, onAnswer, onBack, onSkip, capReached, masteryLevel,
}: {
  question: QuizQuestion;
  isDaily: boolean;
  onAnswer: (selected: number) => void;
  onBack: () => void;
  onSkip?: () => void;
  capReached?: boolean;
  masteryLevel: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; explanation: string } | null>(null);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const correct = selected === question.correctAnswer;
    setResult({ correct, explanation: question.explanation });
    setTimeout(() => onAnswer(selected), 2400);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      {/* Top bar */}
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-violet-500">
        ← Back to Learn
      </button>

      {/* Difficulty + mastery badges */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
          isDaily
            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
            : "bg-violet-500/15 text-violet-400 border-violet-500/30"
        }`}>
          {isDaily ? "🔥 Daily Challenge" : "📚 Practice"}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
          style={{
            backgroundColor: MASTERY_COLORS[masteryLevel] + "20",
            color: MASTERY_COLORS[masteryLevel],
            border: `1px solid ${MASTERY_COLORS[masteryLevel]}40`,
          }}>
          🧠 {MASTERY_NAMES[masteryLevel]}
        </span>
        <span className="text-[10px] font-bold text-[var(--text-muted)]">{question.category}</span>
      </div>

      {capReached && !submitted && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2">
          <Lock size={12} /> Practice LP cap reached. Still earn mastery LP & learning!
        </div>
      )}

      <div className="card-base !p-5 flex flex-col gap-5 card-glow">
        <h3 className="text-[16px] font-bold leading-snug">{question.question}</h3>
        <div className="flex flex-col gap-2">
          {question.options.map((opt, i) => (
            <button
              key={i}
              disabled={submitted}
              onClick={() => setSelected(i)}
              className={`text-left p-3.5 rounded-xl border-2 transition-all font-semibold text-sm ${
                submitted
                  ? i === question.correctAnswer
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                    : selected === i
                      ? "bg-red-500/10 border-red-500 text-red-400"
                      : "bg-[var(--bg-main)] border-transparent opacity-30"
                  : selected === i
                    ? "bg-violet-500/10 border-violet-500 text-violet-400"
                    : "bg-[var(--bg-main)] border-[var(--border-color)] hover:border-violet-500/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-md shrink-0 ${
                  selected === i && !submitted
                    ? "bg-violet-500/20 text-violet-400"
                    : "bg-[var(--border-color)] text-[var(--text-muted)]"
                }`}>{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </div>
            </button>
          ))}
        </div>

        {!submitted ? (
          <div className="flex gap-2">
            {onSkip && (
              <button
                onClick={onSkip}
                className="px-5 py-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] font-bold text-sm text-[var(--text-muted)]"
              >
                Skip
              </button>
            )}
            <motion.button
              whileTap={selected !== null ? { scale: 0.97 } : {}}
              onClick={handleSubmit}
              disabled={selected === null}
              className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${
                selected !== null
                  ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/20"
                  : "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed"
              }`}
            >
              Submit Answer
            </motion.button>
          </div>
        ) : (
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border-2 flex flex-col gap-2 ${
                  result.correct
                    ? "bg-emerald-500/10 border-emerald-500/40"
                    : "bg-red-500/10 border-red-500/40"
                }`}
              >
                <div className="flex items-center gap-2 font-black">
                  {result.correct ? (
                    <><CheckCircle2 size={16} className="text-emerald-500" /> <span className="text-emerald-400">Correct!</span></>
                  ) : (
                    <><XCircle size={16} className="text-red-500" /> <span className="text-red-400">Not quite</span></>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-[var(--text-main)]">{result.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
