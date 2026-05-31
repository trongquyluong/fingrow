/**
 * WeeklyQuestsCard.tsx — Dashboard card showing this week's 3 quests + bonus.
 * Tap a quest to navigate to the right tab.
 */

import { motion } from "motion/react";
import { Trophy, ChevronRight, CheckCircle2 } from "lucide-react";
import { WeeklyQuest } from "../types";
import { LP_REWARDS } from "../constants";

interface Props {
  quests: WeeklyQuest[];
  bonusClaimed: boolean;
  onNavigate: (questType: WeeklyQuest["type"]) => void;
}

const TYPE_TO_TAB: Record<string, string> = {
  quiz: "Learn",
  stock_profit: "Games",
  stock_trade: "Games",
  wallet_log: "Wallet",
  life_year: "Games",
};

export default function WeeklyQuestsCard({ quests, bonusClaimed, onNavigate }: Props) {
  if (!quests || quests.length === 0) return null;
  const doneCount = quests.filter(q => q.done).length;
  const allDone = doneCount === quests.length;

  return (
    <div className="card-base !p-4 flex flex-col gap-3 relative overflow-hidden">
      {/* Glow effect when all done */}
      {allDone && (
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-30 bg-amber-500 pointer-events-none" />
      )}

      <div className="flex justify-between items-center relative">
        <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
          <Trophy size={12} className="text-amber-400" />
          Weekly Quests
        </h3>
        <span className="text-[10px] font-bold tabular-nums">
          <span className={allDone ? "text-amber-400" : "text-violet-400"}>{doneCount}</span>
          <span className="text-[var(--text-muted)]"> / {quests.length}</span>
        </span>
      </div>

      <div className="flex flex-col gap-2 relative">
        {quests.map(q => {
          const pct = Math.min(100, (q.current / q.target) * 100);
          return (
            <button
              key={q.id}
              onClick={() => !q.done && onNavigate(q.type)}
              disabled={q.done}
              className={`text-left p-2.5 rounded-xl border transition-all ${
                q.done
                  ? "bg-emerald-500/8 border-emerald-500/30"
                  : "bg-[var(--bg-main)] border-[var(--border-color)] hover:border-violet-500/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl shrink-0">{q.done ? "✅" : q.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-xs ${q.done ? "text-emerald-400" : ""}`}>{q.title}</p>
                  <p className="text-[10px] text-[var(--text-muted)] leading-snug">{q.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black text-amber-400">+{q.reward} LP</p>
                  <p className="text-[9px] font-bold tabular-nums text-[var(--text-muted)]">
                    {q.current}/{q.target}
                  </p>
                </div>
              </div>
              {!q.done && (
                <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    className="h-full bg-gradient-to-r from-violet-500 to-amber-500"
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Completion bonus */}
      {allDone && !bonusClaimed && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-violet-500/20 border border-amber-500/40 flex items-center gap-2"
        >
          <CheckCircle2 size={16} className="text-amber-400" />
          <span className="text-xs font-black text-amber-400">
            All done! +{LP_REWARDS.QUEST_ALL_BONUS} LP bonus auto-claimed!
          </span>
        </motion.div>
      )}
    </div>
  );
}
