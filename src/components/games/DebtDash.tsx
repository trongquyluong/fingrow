/**
 * DebtDash.tsx — swipe-style minigame: 6 SG-flavoured financial decisions.
 *
 * Each scenario shows a setup, then two options. Tap A or B. The "smart"
 * choice (always A) awards LP. After the round, see the lesson + total LP.
 * 8 scenarios are defined; 6 are picked per round (seeded by date so all
 * users see the same set on the same day, like the daily challenge).
 */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Check, X, Zap } from "lucide-react";
import { DEBT_DASH_SCENARIOS, LP_REWARDS } from "../../constants";

interface Props {
  onExit: () => void;
  onComplete: (result: DebtDashResult) => void;
}

export interface DebtDashResult {
  totalLP: number;
  correctCount: number;
  totalAnswered: number;
  perScenario: { id: string; picked: "A" | "B"; correct: boolean }[];
}

function dailyScenarios(): typeof DEBT_DASH_SCENARIOS {
  // Deterministic 6-of-8 pick based on today's date. We use a
  // shuffle-and-slice approach so the picked set is guaranteed to have
  // 6 distinct indices even if the LCG were to repeat a value.
  const today = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  }
  const indices = DEBT_DASH_SCENARIOS.map((_, i) => i);
  // Fisher-Yates with seeded RNG
  for (let i = indices.length - 1; i > 0; i--) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    const j = hash % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, Math.min(6, DEBT_DASH_SCENARIOS.length))
    .map(idx => DEBT_DASH_SCENARIOS[idx]);
}

export default function DebtDash({ onExit, onComplete }: Props) {
  const scenarios = useMemo(dailyScenarios, []);
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<{ id: string; picked: "A" | "B"; correct: boolean }[]>([]);
  const [reveal, setReveal] = useState<null | { correct: boolean; lesson: string }>(null);
  const [done, setDone] = useState(false);

  const current = scenarios[idx];
  const correctCount = picks.filter(p => p.correct).length;
  const totalLP = correctCount * LP_REWARDS.DEBT_DASH_CORRECT;

  // Auto-advance after reveal
  useEffect(() => {
    if (!reveal) return;
    const t = setTimeout(() => {
      setReveal(null);
      if (idx + 1 < scenarios.length) {
        setIdx(idx + 1);
      } else {
        setDone(true);
      }
    }, 1300);
    return () => clearTimeout(t);
  }, [reveal, idx, scenarios.length]);

  const pick = (choice: "A" | "B") => {
    if (reveal) return;
    const correct = choice === current.correct;
    const nextPicks = [...picks, { id: current.id, picked: choice, correct }];
    setPicks(nextPicks);
    setReveal({ correct, lesson: current.lesson });
    if (idx + 1 >= scenarios.length) {
      // round ends; fire onComplete after a beat so the user sees the final reveal
      setTimeout(() => {
        onComplete({
          totalLP: nextPicks.filter(p => p.correct).length * LP_REWARDS.DEBT_DASH_CORRECT,
          correctCount: nextPicks.filter(p => p.correct).length,
          totalAnswered: nextPicks.length,
          perScenario: nextPicks,
        });
      }, 1500);
    }
  };

  // ── Result screen ──
  if (done) {
    return (
      <div className="max-w-md mx-auto min-h-screen px-4 pt-5 pb-10 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <button onClick={onExit} className="p-2 -ml-1 rounded-full hover:bg-[var(--bg-card)]">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-black text-xl">Debt Dash</h1>
        </div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl p-6 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(34,197,94,0.10))",
            border: "1px solid rgba(168,85,247,0.30)",
          }}
        >
          <p className="text-5xl mb-2">💨</p>
          <p className="font-black text-2xl">+{totalLP} LP</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {correctCount} of {scenarios.length} smart picks
          </p>
        </motion.div>
        <div className="flex flex-col gap-2">
          {picks.map((p, i) => {
            const sc = scenarios.find(s => s.id === p.id)!;
            return (
              <div key={p.id}
                className="rounded-2xl p-3 flex items-start gap-3"
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${p.correct ? "#22C55E40" : "#EF444440"}`,
                }}
              >
                <div
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white"
                  style={{ background: p.correct ? "#22C55E" : "#EF4444" }}
                >
                  {p.correct ? <Check size={14} /> : <X size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">{sc.prompt}</p>
                  <p className="text-[11px] font-semibold mt-1" style={{ color: p.correct ? "#22C55E" : "#EF4444" }}>
                    {p.picked === "A" ? sc.optionA : sc.optionB}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={onExit}
          className="mt-2 py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          Back to Games
        </button>
      </div>
    );
  }

  // ── Play screen ──
  return (
    <div className="max-w-md mx-auto min-h-screen px-4 pt-5 pb-10 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onExit} className="p-2 -ml-1 rounded-full hover:bg-[var(--bg-card)]">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-black text-xl flex-1">Debt Dash</h1>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {idx + 1} / {scenarios.length}
        </span>
      </div>

      {/* progress dots */}
      <div className="flex gap-1">
        {scenarios.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full"
            style={{
              background:
                i < idx
                  ? "#22C55E"
                  : i === idx
                    ? "linear-gradient(90deg, #A855F7, #22C55E)"
                    : "var(--bg-card)",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.18 }}
          className="rounded-3xl p-5 flex flex-col gap-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            <Zap size={12} className="text-amber-500" /> {scenarios.length - idx} decisions to go
          </div>
          <p className="font-bold text-base leading-relaxed">{current.prompt}</p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => pick("A")}
              disabled={!!reveal}
              className="text-left p-3.5 rounded-2xl font-semibold text-sm active:scale-[0.99] transition-all disabled:opacity-50"
              style={{
                background: reveal
                  ? current.correct === "A" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.10)"
                  : "var(--bg-elevated)",
                border: reveal && current.correct === "A"
                  ? "1.5px solid #22C55E"
                  : "1.5px solid var(--border-color)",
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1">
                Option A
              </span>
              {current.optionA}
              {reveal && current.correct === "A" && (
                <span className="ml-2 text-[10px] font-black text-emerald-500">✓ SMART</span>
              )}
            </button>
            <button
              onClick={() => pick("B")}
              disabled={!!reveal}
              className="text-left p-3.5 rounded-2xl font-semibold text-sm active:scale-[0.99] transition-all disabled:opacity-50"
              style={{
                background: reveal
                  ? current.correct === "B" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.10)"
                  : "var(--bg-elevated)",
                border: reveal && current.correct === "B"
                  ? "1.5px solid #22C55E"
                  : "1.5px solid var(--border-color)",
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1">
                Option B
              </span>
              {current.optionB}
              {reveal && current.correct === "B" && (
                <span className="ml-2 text-[10px] font-black text-emerald-500">✓ SMART</span>
              )}
            </button>
          </div>

          {reveal && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] leading-relaxed p-3 rounded-xl"
              style={{
                background: "rgba(168,85,247,0.10)",
                border: "1px solid rgba(168,85,247,0.25)",
                color: "var(--text-main)",
              }}
            >
              <span className="font-black text-violet-500">LESSON: </span>
              {current.lesson}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* footer tally */}
      <div className="text-center text-[11px] text-[var(--text-muted)]">
        {correctCount} correct · {scenarios.length - idx} left
      </div>
    </div>
  );
}
