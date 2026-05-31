/**
 * Guesstimate.tsx — daily "how close can you get?" estimation challenge.
 *
 * Slider-based. Score scales with how close the guess is to the real figure.
 * Black-box leaf: reports total LP + correct count up via onComplete.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Target, ChevronLeft } from "lucide-react";
import { GuesstimateItem } from "../../constants";
import { LP_REWARDS } from "../../constants";
import { DailyChallengeResult } from "../../types";

interface Props {
  items: GuesstimateItem[];
  onComplete: (r: DailyChallengeResult) => void;
  onBack: () => void;
}

const fmt = (item: GuesstimateItem, n: number) =>
  `${item.prefix ?? ""}${n.toLocaleString()}${item.unit ?? ""}`;

/** 0..1 closeness score: 1 = exact, 0 = off by half the slider range or more. */
function closeness(item: GuesstimateItem, guess: number): number {
  const range = item.max - item.min || 1;
  const diff = Math.abs(guess - item.answer);
  return Math.max(0, Math.min(1, 1 - diff / (range * 0.5)));
}

export default function Guesstimate({ items, onComplete, onBack }: Props) {
  const [idx, setIdx] = useState(0);
  const [lpTotal, setLpTotal] = useState(0);
  const [correct, setCorrect] = useState(0);
  const item = items[idx];
  const mid = Math.round(((item.min + item.max) / 2) / item.step) * item.step;
  const [guess, setGuess] = useState<number>(mid);
  const [locked, setLocked] = useState(false);

  const isLast = idx >= items.length - 1;
  const score01 = closeness(item, guess);
  const points = Math.round(LP_REWARDS.GUESS_MAX_PER * score01);
  const closeEnough = score01 >= 0.6;

  const lockIn = () => {
    if (locked) return;
    setLocked(true);
    setLpTotal(t => t + points);
    if (closeEnough) setCorrect(c => c + 1);
  };

  const next = () => {
    if (isLast) {
      onComplete({ type: "guesstimate", correct, total: items.length, lpAwarded: lpTotal });
      return;
    }
    const nextItem = items[idx + 1];
    setIdx(i => i + 1);
    setGuess(Math.round(((nextItem.min + nextItem.max) / 2) / nextItem.step) * nextItem.step);
    setLocked(false);
  };

  const verdict =
    score01 >= 0.95 ? "Bullseye! 🎯" : score01 >= 0.6 ? "Close!" : score01 > 0.2 ? "In the ballpark" : "Way off";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-violet-500">
        <ChevronLeft size={14} /> Back to Learn
      </button>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
          🎯 Guesstimate
        </span>
        <span className="text-[11px] font-bold tabular-nums text-[var(--text-muted)]">
          {idx + 1} / {items.length} · <span className="text-amber-400">+{lpTotal} LP</span>
        </span>
      </div>

      <div className="flex gap-1.5">
        {items.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < idx ? "bg-emerald-500" : i === idx ? "bg-violet-500" : "bg-[var(--bg-elevated)]"}`} />
        ))}
      </div>

      <div className="card-base !p-5 flex flex-col gap-5 card-glow">
        <h3 className="text-[16px] font-bold leading-snug">{item.question}</h3>

        {/* Big live readout */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-4xl font-black tabular-nums" style={{ color: locked ? (closeEnough ? "#22C55E" : "#EF4444") : "#A855F7" }}>
            {fmt(item, guess)}
          </div>
          {locked && (
            <div className="text-xs font-bold text-[var(--text-muted)]">
              Actual: <span className="text-emerald-400">{fmt(item, item.answer)}</span>
            </div>
          )}
        </div>

        <input
          type="range"
          min={item.min}
          max={item.max}
          step={item.step}
          value={guess}
          disabled={locked}
          onChange={(e) => setGuess(Number(e.target.value))}
          className="w-full accent-violet-500 disabled:opacity-60"
        />
        <div className="flex justify-between text-[10px] font-bold text-[var(--text-muted)] tabular-nums -mt-2">
          <span>{fmt(item, item.min)}</span>
          <span>{fmt(item, item.max)}</span>
        </div>

        {!locked ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={lockIn}
            className="py-3.5 rounded-2xl font-bold bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
          >
            <Target size={16} /> Lock in my guess
          </motion.button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border-2 flex flex-col gap-2 ${
                closeEnough ? "bg-emerald-500/10 border-emerald-500/40" : "bg-red-500/10 border-red-500/40"
              }`}
            >
              <div className="flex items-center justify-between font-black">
                <span className={closeEnough ? "text-emerald-400" : "text-red-400"}>{verdict}</span>
                <span className="text-amber-400">+{points} LP</span>
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
      </div>
    </motion.div>
  );
}
