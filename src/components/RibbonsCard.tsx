/**
 * RibbonsCard.tsx — Dashboard "trophy case" that surfaces earned Frugal Ribbons.
 *
 * Ribbons are awarded by App.handleLifeEnded (LP mechanism #4) and persisted in
 * UserState.lifeRibbons[]. Compact horizontal strip of badge tiles: earned ones
 * glow, locked ones are dimmed. Read-only — no state writes here.
 */

import { motion } from "motion/react";
import { Award, Lock } from "lucide-react";
import { RIBBONS, LP_REWARDS } from "../constants";

interface Props {
  /** Array of earned ribbon ids (UserState.lifeRibbons). */
  earned: string[];
  /** Optional: jump to the Life Simulator where ribbons are earned. */
  onPlayLife?: () => void;
  /** Optional: open the full Trophies screen. */
  onViewAll?: () => void;
}

export default function RibbonsCard({ earned, onPlayLife, onViewAll }: Props) {
  const earnedSet = new Set(earned);
  const earnedCount = RIBBONS.filter(r => earnedSet.has(r.id)).length;
  const allDone = earnedCount === RIBBONS.length;

  return (
    <div className="card-base !p-4 flex flex-col gap-3 relative overflow-hidden">
      {allDone && (
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-30 bg-amber-500 pointer-events-none" />
      )}

      <div className="flex justify-between items-center relative">
        <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
          <Award size={12} className="text-amber-400" />
          Trophies
        </h3>
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold tabular-nums">
            <span className={allDone ? "text-amber-400" : "text-violet-400"}>{earnedCount}</span>
            <span className="text-[var(--text-muted)]"> / {RIBBONS.length}</span>
          </span>
          {onViewAll && (
            <button onClick={onViewAll} className="text-[10px] font-bold text-violet-400 hover:text-violet-300">
              View all ›
            </button>
          )}
        </div>
      </div>

      {/* Horizontal badge strip */}
      <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1 relative">
        {RIBBONS.map((ribbon, idx) => {
          const isEarned = earnedSet.has(ribbon.id);
          return (
            <motion.div
              key={ribbon.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(idx * 0.05, 0.4) }}
              title={`${ribbon.name} — ${ribbon.description}`}
              className="shrink-0 w-[60px] flex flex-col items-center gap-1.5"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border ${
                  isEarned ? "" : "grayscale opacity-40"
                }`}
                style={
                  isEarned
                    ? {
                        background: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(168,85,247,0.20))",
                        borderColor: "rgba(245,158,11,0.45)",
                        boxShadow: "0 0 12px rgba(245,158,11,0.25)",
                      }
                    : { background: "var(--bg-main)", borderColor: "var(--border-color)" }
                }
              >
                {isEarned ? ribbon.emoji : <Lock size={16} className="text-[var(--text-muted)]" />}
              </div>
              <span
                className={`text-[8.5px] font-bold text-center leading-tight ${
                  isEarned ? "text-amber-300" : "text-[var(--text-muted)]"
                }`}
              >
                {ribbon.name}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Footer line */}
      {earnedCount === 0 ? (
        <button
          onClick={onPlayLife}
          disabled={!onPlayLife}
          className="text-[10px] text-[var(--text-muted)] leading-relaxed text-left disabled:cursor-default"
        >
          Play the <span className="text-violet-400 font-bold">Life Simulator</span> to earn ribbons —
          each is worth <span className="text-amber-400 font-bold">+{LP_REWARDS.RIBBON_REWARD} LP</span>.
        </button>
      ) : !allDone ? (
        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
          Each ribbon is worth <span className="text-amber-400 font-bold">+{LP_REWARDS.RIBBON_REWARD} LP</span> —
          replay the Life Simulator to collect them all.
        </p>
      ) : (
        <p className="text-[10px] font-black text-amber-400 text-center">
          🏆 Full set collected — you're a finance legend!
        </p>
      )}
    </div>
  );
}
