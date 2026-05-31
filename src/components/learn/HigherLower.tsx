/**
 * HigherLower.tsx — daily "which is bigger?" mini-challenge.
 *
 * Black-box leaf: receives today's deterministic pairs, runs the rounds, and
 * reports the result up via onComplete. All LP/streak/quest logic stays in App.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, ChevronLeft } from "lucide-react";
import { HigherLowerPair } from "../../constants";
import { LP_REWARDS } from "../../constants";
import { DailyChallengeResult } from "../../types";

interface Props {
  pairs: HigherLowerPair[];
  onComplete: (r: DailyChallengeResult) => void;
  onBack: () => void;
}

export default function HigherLower({ pairs, onComplete, onBack }: Props) {
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<"a" | "b" | null>(null);

  const pair = pairs[round];
  const isLast = round >= pairs.length - 1;
  const correctSide: "a" | "b" = pair.a.value >= pair.b.value ? "a" : "b";

  const pick = (side: "a" | "b") => {
    if (picked) return;
    setPicked(side);
    if (side === correctSide) setCorrect(c => c + 1);
  };

  const next = () => {
    if (isLast) {
      const finalCorrect = correct; // already includes this round
      onComplete({
        type: "higher_lower",
        correct: finalCorrect,
        total: pairs.length,
        lpAwarded: finalCorrect * LP_REWARDS.HL_PER_CORRECT,
      });
      return;
    }
    setRound(r => r + 1);
    setPicked(null);
  };

  const Choice = ({ side }: { side: "a" | "b" }) => {
    const item = side === "a" ? pair.a : pair.b;
    const revealed = picked !== null;
    const isCorrect = side === correctSide;
    const isPicked = picked === side;
    return (
      <motion.button
        whileTap={!revealed ? { scale: 0.97 } : {}}
        onClick={() => pick(side)}
        disabled={revealed}
        className={`flex-1 flex flex-col items-center justify-center gap-2 p-5 rounded-3xl border-2 transition-all min-h-[140px] text-center ${
          revealed
            ? isCorrect
              ? "bg-emerald-500/10 border-emerald-500"
              : isPicked
                ? "bg-red-500/10 border-red-500"
                : "bg-[var(--bg-main)] border-transparent opacity-50"
            : "bg-[var(--bg-card)] border-[var(--border-color)] hover:border-violet-500/40"
        }`}
      >
        <span className="font-bold text-sm leading-snug">{item.label}</span>
        <AnimatePresence>
          {revealed && (
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-lg font-black tabular-nums ${isCorrect ? "text-emerald-400" : "text-[var(--text-muted)]"}`}
            >
              {item.display}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-violet-500">
        <ChevronLeft size={14} /> Back to Learn
      </button>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
          ⚖️ Higher or Lower
        </span>
        <span className="text-[11px] font-bold tabular-nums text-[var(--text-muted)]">
          Round {round + 1} / {pairs.length} · <span className="text-emerald-400">{correct} ✓</span>
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {pairs.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < round ? "bg-emerald-500" : i === round ? "bg-violet-500" : "bg-[var(--bg-elevated)]"}`} />
        ))}
      </div>

      <h3 className="text-lg font-extrabold text-center mt-1">{pair.prompt}</h3>

      <div className="flex gap-3">
        <Choice side="a" />
        <div className="flex items-center text-[10px] font-black text-[var(--text-muted)] uppercase">vs</div>
        <Choice side="b" />
      </div>

      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border-2 flex flex-col gap-2 ${
              picked === correctSide ? "bg-emerald-500/10 border-emerald-500/40" : "bg-red-500/10 border-red-500/40"
            }`}
          >
            <div className="flex items-center gap-2 font-black">
              {picked === correctSide ? (
                <><CheckCircle2 size={16} className="text-emerald-500" /> <span className="text-emerald-400">Correct! +{LP_REWARDS.HL_PER_CORRECT} LP</span></>
              ) : (
                <><XCircle size={16} className="text-red-500" /> <span className="text-red-400">Not quite</span></>
              )}
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-main)]">{pair.explanation}</p>
            <button
              onClick={next}
              className="mt-1 py-3 rounded-2xl font-bold bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/20"
            >
              {isLast ? "Finish challenge" : "Next round"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
