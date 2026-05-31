/**
 * TrophiesScreen.tsx — full-page Achievements view for the Frugal Ribbons.
 *
 * Reached from the dashboard Trophies strip's "View all". Read-only over
 * UserState.lifeRibbons[]; ribbons are awarded by App.handleLifeEnded.
 */

import { motion } from "motion/react";
import { ChevronLeft, Lock, Trophy } from "lucide-react";
import { RIBBONS, LP_REWARDS } from "../constants";

interface Props {
  earned: string[];
  onBack: () => void;
  onPlayLife: () => void;
}

export default function TrophiesScreen({ earned, onBack, onPlayLife }: Props) {
  const earnedSet = new Set(earned);
  const earnedCount = RIBBONS.filter(r => earnedSet.has(r.id)).length;
  const pct = Math.round((earnedCount / RIBBONS.length) * 100);
  const allDone = earnedCount === RIBBONS.length;

  return (
    <motion.div
      key="trophies"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-[var(--text-muted)] hover:text-violet-500">
          <ChevronLeft size={18} /> Back
        </button>
        <span className="text-[11px] font-black tabular-nums px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
          {earnedCount} / {RIBBONS.length} earned
        </span>
      </div>

      <div>
        <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Trophy size={22} className="text-amber-400" /> Trophies
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Frugal Ribbons earned across your Life Simulator runs.</p>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="h-3 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border-color)] p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-500"
          />
        </div>
        <p className="text-[10px] font-bold text-[var(--text-muted)] text-center uppercase tracking-widest">{pct}% collected</p>
      </div>

      {/* Ribbon grid */}
      <div className="grid grid-cols-2 gap-3">
        {RIBBONS.map((ribbon, idx) => {
          const isEarned = earnedSet.has(ribbon.id);
          return (
            <motion.div
              key={ribbon.id}
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(idx * 0.05, 0.4) }}
              className={`relative flex flex-col gap-2 p-4 rounded-3xl border ${
                isEarned
                  ? "bg-gradient-to-br from-amber-500/15 to-violet-500/10 border-amber-500/40"
                  : "bg-[var(--bg-card)] border-[var(--border-color)]"
              }`}
              style={isEarned ? { boxShadow: "0 0 16px rgba(245,158,11,0.18)" } : undefined}
            >
              <div className="flex items-center justify-between">
                <span className={`text-3xl leading-none ${isEarned ? "" : "grayscale opacity-30"}`}>{ribbon.emoji}</span>
                {isEarned ? (
                  <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Earned</span>
                ) : (
                  <Lock size={13} className="text-[var(--text-muted)]" />
                )}
              </div>
              <div>
                <p className={`font-black text-sm leading-tight ${isEarned ? "text-amber-300" : "text-[var(--text-muted)]"}`}>{ribbon.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] leading-snug mt-1">{ribbon.description}</p>
              </div>
              <span className={`text-[10px] font-black ${isEarned ? "text-amber-400" : "text-[var(--text-muted)]"}`}>
                +{LP_REWARDS.RIBBON_REWARD} LP
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      {!allDone && (
        <div className="card-base !p-4 flex items-center gap-3">
          <div className="text-3xl">🎮</div>
          <div className="flex-1">
            <p className="font-bold text-sm">Earn more ribbons</p>
            <p className="text-[11px] text-[var(--text-muted)] leading-snug">Make smart money choices in the Life Simulator to unlock the rest.</p>
          </div>
          <button
            onClick={onPlayLife}
            className="shrink-0 px-4 py-2.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/20 active:scale-95 transition-transform"
          >
            Play
          </button>
        </div>
      )}
    </motion.div>
  );
}
