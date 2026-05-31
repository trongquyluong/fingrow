/**
 * GamesHub.tsx — Minigames lobby.
 * Lists all playable games as big cards. Each card knows its accent color,
 * tagline, difficulty, est. play time, and the LP-earning hint.
 *
 * To add a new game: append to GAMES and wire its onPlay handler in App.tsx.
 */

import { motion } from "motion/react";
import {
  TrendingUp, Gamepad2, ChevronRight, Clock, Zap, Trophy,
} from "lucide-react";

export type GameId = "stocks" | "life" | "scam_spotter" | "bao_tycoon" | "comingSoon";

export interface GameDef {
  id: GameId;
  title: string;
  tagline: string;
  icon: string;                  // emoji shown big
  accentFrom: string;            // gradient start
  accentTo: string;              // gradient end
  difficulty: "Easy" | "Medium" | "Hard";
  estTime: string;               // e.g. "5 min", "20 min"
  lpHint: string;                // e.g. "+1 LP/$1 profit"
  locked?: boolean;
  comingSoon?: boolean;
}

const GAMES: GameDef[] = [
  {
    id: "stocks",
    title: "Stock Trader",
    tagline: "Buy low, sell high. Build a virtual portfolio with $1,000 starting cash.",
    icon: "📈",
    accentFrom: "#3B82F6",
    accentTo: "#1E40AF",
    difficulty: "Medium",
    estTime: "5 min",
    lpHint: "+1 LP per $1 profit",
  },
  {
    id: "life",
    title: "Life Simulator",
    tagline: "Make choices from age 8 to 65. Build wealth, dodge mistakes, retire rich.",
    icon: "🎮",
    accentFrom: "#A855F7",
    accentTo: "#6D28D9",
    difficulty: "Hard",
    estTime: "20 min",
    lpHint: "Up to +1500 LP per run",
  },
  {
    id: "scam_spotter",
    title: "Scam Spotter",
    tagline: "Swipe-left on scam texts. SG-specific phishing, gift-card cons, fake delivery scams.",
    icon: "🕵️",
    accentFrom: "#F43F5E",
    accentTo: "#9F1239",
    difficulty: "Medium",
    estTime: "2 min",
    lpHint: "Up to +160 LP/round",
  },
  {
    id: "bao_tycoon",
    title: "Bao Stand Tycoon",
    tagline: "Run a bao stall for 5 days. Set prices, manage inventory, master unit economics.",
    icon: "🥟",
    accentFrom: "#F59E0B",
    accentTo: "#B45309",
    difficulty: "Medium",
    estTime: "5 min",
    lpHint: "Up to +600 LP + badge",
  },
  {
    id: "comingSoon",
    title: "Budget Showdown",
    tagline: "Survive a month on a tight budget — coming soon!",
    icon: "💰",
    accentFrom: "#10B981",
    accentTo: "#065F46",
    difficulty: "Easy",
    estTime: "3 min",
    lpHint: "Coming soon",
    comingSoon: true,
  },
];

interface Props {
  onPlay: (game: GameId) => void;
}

export default function GamesHub({ onPlay }: Props) {
  return (
    <motion.div
      key="games-hub"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-3">
        <div className="bg-violet-500/15 p-2 rounded-2xl">
          <Gamepad2 size={22} className="text-violet-500" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Minigames</h2>
          <p className="text-sm text-[var(--text-muted)]">Practice finance through play</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2">
        <Stat icon="🎮" value={GAMES.filter(g => !g.comingSoon).length.toString()} label="Live" />
        <Stat icon="🔜" value={GAMES.filter(g => g.comingSoon).length.toString()} label="Soon" />
        <Stat icon="🏆" value="∞" label="LP to earn" />
      </div>

      <div className="flex flex-col gap-3">
        {GAMES.map((g, idx) => (
          <motion.button
            key={`${g.id}-${idx}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.07 }}
            whileTap={!g.comingSoon ? { scale: 0.98 } : {}}
            onClick={() => !g.comingSoon && onPlay(g.id)}
            disabled={g.comingSoon}
            className={`relative overflow-hidden rounded-3xl border text-left transition-all ${
              g.comingSoon
                ? "border-[var(--border-color)] opacity-60 cursor-not-allowed"
                : "border-transparent hover:scale-[1.01] active:scale-[0.99]"
            }`}
            style={{
              background: g.comingSoon
                ? `linear-gradient(135deg, ${g.accentFrom}10, ${g.accentTo}05)`
                : `linear-gradient(135deg, ${g.accentFrom}25, ${g.accentTo}10)`,
              boxShadow: g.comingSoon ? "none" : `0 4px 24px ${g.accentFrom}25`,
            }}
          >
            {/* Decorative glow */}
            <div
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
              style={{ backgroundColor: g.accentFrom }}
            />

            <div className="relative p-5 flex gap-4 items-center">
              {/* Big icon tile */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${g.accentFrom}, ${g.accentTo})`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 14px ${g.accentFrom}50`,
                }}
              >
                {g.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className="font-extrabold text-base tracking-tight"
                    style={{ color: g.comingSoon ? "var(--text-muted)" : g.accentFrom }}
                  >
                    {g.title}
                  </h3>
                  {g.comingSoon && (
                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      Soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2 mb-2">
                  {g.tagline}
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                  <Chip icon={<Zap size={9} />}  text={g.difficulty} color={g.accentFrom} />
                  <Chip icon={<Clock size={9} />} text={g.estTime}   color={g.accentFrom} />
                  <Chip icon={<Trophy size={9} />} text={g.lpHint}   color="#10B981" />
                </div>
              </div>

              {!g.comingSoon && (
                <ChevronRight
                  size={20}
                  className="shrink-0 opacity-60"
                  style={{ color: g.accentFrom }}
                />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      <p className="text-[10px] text-center text-[var(--text-muted)] mt-2">
        More games coming soon. Have an idea? Tell us!
      </p>
    </motion.div>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="card-base !p-3 flex flex-col items-center gap-1">
      <span className="text-lg">{icon}</span>
      <p className="font-extrabold text-base tabular-nums">{value}</p>
      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
    </div>
  );
}

function Chip({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <span
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: color + "20", color }}
    >
      {icon}
      {text}
    </span>
  );
}
