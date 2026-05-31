/**
 * MythOrFact.tsx — daily "true or false?" finance challenge.
 *
 * Tap Fact / Myth on each statement (taps, not drag — reliable & simple).
 * Black-box leaf: reports correct count + LP up via onComplete.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, ChevronLeft } from "lucide-react";
import { MythFactItem } from "../../constants";
import { LP_REWARDS } from "../../constants";
import { DailyChallengeResult } from "../../types";

interface Props {
  items: MythFactItem[];
  onComplete: (r: DailyChallengeResult) => void;
  onBack: () => void;
}

export default function MythOrFact({ items, onComplete, onBack }: Props) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);

  const item = items[idx];
  const isLast = idx >= items.length - 1;
  const wasCorrect = answer !== null && answer === item.isFact;

  const choose = (saidFact: boolean) => {
    if (answer !== null) return;
    setAnswer(saidFact);
    if (saidFact === item.isFact) setCorrect(c => c + 1);
  };

  const next = () => {
    if (isLast) {
      onComplete({
        type: "myth_fact",
        correct,
        total: items.length,
        lpAwarded: correct * LP_REWARDS.MYTH_PER_CORRECT,
      });
      return;
    }
    setIdx(i => i + 1);
    setAnswer(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-violet-500">
        <ChevronLeft size={14} /> Back to Learn
      </button>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
          🔍 Myth or Fact
        </span>
        <span className="text-[11px] font-bold tabular-nums text-[var(--text-muted)]">
          {idx + 1} / {items.length} · <span className="text-emerald-400">{correct} ✓</span>
        </span>
      </div>

      <div className="flex gap-1.5">
        {items.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < idx ? "bg-emerald-500" : i === idx ? "bg-violet-500" : "bg-[var(--bg-elevated)]"}`} />
        ))}
      </div>

      <div className="card-base !p-6 flex flex-col gap-5 card-glow min-h-[160px] justify-center">
        <p className="text-lg font-bold leading-snug text-center">"{item.statement}"</p>
      </div>

      {answer === null ? (
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => choose(false)}
            className="flex-1 py-4 rounded-2xl font-black text-red-400 bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center gap-2"
          >
            <X size={18} /> Myth
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => choose(true)}
            className="flex-1 py-4 rounded-2xl font-black text-emerald-400 bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center gap-2"
          >
            <Check size={18} /> Fact
          </motion.button>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border-2 flex flex-col gap-2 ${
              wasCorrect ? "bg-emerald-500/10 border-emerald-500/40" : "bg-red-500/10 border-red-500/40"
            }`}
          >
            <div className="flex items-center justify-between font-black">
              <span className={wasCorrect ? "text-emerald-400" : "text-red-400"}>
                {wasCorrect ? "Correct!" : "Nope —"} it's a {item.isFact ? "Fact" : "Myth"}
              </span>
              {wasCorrect && <span className="text-amber-400">+{LP_REWARDS.MYTH_PER_CORRECT} LP</span>}
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-main)]">{item.explanation}</p>
            <button
              onClick={next}
              className="mt-1 py-3 rounded-2xl font-bold bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/20"
            >
              {isLast ? "Finish challenge" : "Next"}
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
