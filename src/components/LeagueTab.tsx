/**
 * LeagueTab.tsx — LoL-style competitive ladder.
 * Pulls weekly scores from Supabase if VITE_SUPABASE_URL is set,
 * otherwise renders a friendly "Connect your league" prompt.
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  GraduationCap,
  TrendingUp,
  Wallet as WalletIcon,
  UserCircle2,
  Wifi,
  WifiOff,
  RefreshCw,
  Lock,
} from "lucide-react";
import { LeagueTier, RankInfo } from "../types";
import {
  TIER_CONFIG,
  TIER_THRESHOLDS,
  ALL_TIERS,
  getRank,
  formatRank,
} from "../constants";
import { AccountData } from "./AccountModal";
import {
  SUPABASE_ENABLED,
  fetchWeeklyLeaderboard,
  getOrCreateUserId,
  isAdminUsername,
  LeaderboardRow,
} from "../lib/supabase";

interface LeagueTabProps {
  leaguePoints: number;
  leagueTier: LeagueTier;
  leagueWeekPoints: number;
  leagueWeekStart: string | null;
  account: AccountData | null;
  onOpenAccount: () => void;
}

/** Compact LoL-style badge (shield + tier + division). */
function RankBadge({ info, size = "lg" }: { info: RankInfo; size?: "sm" | "lg" | "xl" }) {
  const cfg = TIER_CONFIG[info.tier];
  const dim = size === "xl" ? 64 : size === "lg" ? 40 : 24;
  const fontSize = size === "xl" ? "text-base" : size === "lg" ? "text-xs" : "text-[9px]";
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative flex items-center justify-center rounded-xl shrink-0"
        style={{
          width: dim,
          height: dim,
          background: `linear-gradient(135deg, ${cfg.gradient[0]}, ${cfg.gradient[1]})`,
          boxShadow: `0 4px 14px ${cfg.color}55, inset 0 1px 0 rgba(255,255,255,0.3)`,
        }}
      >
        <span style={{ fontSize: dim * 0.55 }}>{cfg.icon}</span>
        {info.division && size !== "sm" && (
          <span
            className="absolute -bottom-1 -right-1 px-1 py-0 rounded text-[8px] font-black border"
            style={{
              backgroundColor: cfg.color,
              borderColor: "#FFFFFF40",
              color: "white",
            }}
          >
            {info.division}
          </span>
        )}
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`font-black ${fontSize}`} style={{ color: cfg.color }}>
          {cfg.label}
        </span>
        {info.division && size === "xl" && (
          <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
            Division {info.division}
          </span>
        )}
      </div>
    </div>
  );
}

export default function LeagueTab({
  leaguePoints,
  leagueWeekPoints,
  leagueWeekStart,
  account,
  onOpenAccount,
}: LeagueTabProps) {
  const rank = getRank(leaguePoints);
  const cfg = TIER_CONFIG[rank.tier];

  const tierRange = rank.nextThreshold ? rank.nextThreshold - rank.threshold : 1;
  const progressInRank = leaguePoints - rank.threshold;
  const progressPct = rank.nextThreshold ? Math.min(100, (progressInRank / tierRange) * 100) : 100;

  const nextRank = rank.nextThreshold ? getRank(rank.nextThreshold) : null;

  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);

  const myUserId = getOrCreateUserId();
  const myName = account?.username ?? "You";
  const myAvatar = account?.avatar ?? "⭐";

  const loadLeaderboard = async () => {
    if (!SUPABASE_ENABLED || !leagueWeekStart) return;
    setLoading(true);
    const rows = await fetchWeeklyLeaderboard(leagueWeekStart);
    // Defensive: keep admin/research accounts off the public leaderboard.
    setLeaderboard(rows.filter(r => !isAdminUsername(r.username)));
    setLoading(false);
  };

  useEffect(() => { loadLeaderboard(); }, [leagueWeekStart, leagueWeekPoints]);

  // The player is identified by username (case-insensitive) since the same
  // account on different devices has different anonymous user_ids. Match by
  // username so the local 'you' row doesn't get duplicated by a cloud row
  // from another device for the same account.
  const meUsername = (account?.username ?? '').trim().toLowerCase();
  const myRowInList = meUsername
    ? leaderboard.find(r => r.username.toLowerCase() === meUsername)
    : leaderboard.find(r => r.user_id === myUserId);
  const allCompetitors: { id: string; name: string; avatar: string; weekPoints: number; isMe: boolean }[] = [
    ...(myRowInList ? [] : [{ id: myUserId, name: myName, avatar: myAvatar, weekPoints: leagueWeekPoints, isMe: true }]),
    ...leaderboard
      .filter(r => !meUsername || r.username.toLowerCase() !== meUsername)
      .map(r => ({
        id: r.user_id,
        name: r.username,
        avatar: r.avatar,
        weekPoints: r.week_points,
        isMe: r.user_id === myUserId,
      })),
  ].sort((a, b) => b.weekPoints - a.weekPoints);

  return (
    <motion.div
      key="league"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-5"
    >
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Ranked League</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Climb the ladder to Challenger</p>
        </div>
        <div className="flex items-center gap-1">
          {SUPABASE_ENABLED ? (
            <>
              <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                <Wifi size={11} /> Live
              </div>
              <button
                onClick={loadLeaderboard}
                disabled={loading}
                className="p-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] active:scale-90 transition-transform"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider">
              <WifiOff size={11} /> Offline
            </div>
          )}
        </div>
      </div>

      {/* Account prompt */}
      {!account ? (
        <button
          onClick={onOpenAccount}
          className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 transition-colors w-full text-left"
        >
          <div className="bg-violet-500/10 p-2 rounded-xl">
            <UserCircle2 size={20} className="text-violet-500" />
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-sm text-violet-500">Create your account</p>
            <p className="text-xs text-[var(--text-muted)]">Sign up to appear on the leaderboard</p>
          </div>
          <span className="text-violet-500 text-lg">→</span>
        </button>
      ) : (
        <button
          onClick={onOpenAccount}
          className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-violet-500/30 transition-colors w-full text-left"
        >
          <span className="text-3xl">{account.avatar}</span>
          <div className="flex-1">
            <p className="font-extrabold text-sm">{account.username}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {account.school ? `${account.school} · ${account.jcYear ?? "JC"}` : "Tap to edit profile"}
            </p>
          </div>
          <RankBadge info={rank} size="sm" />
        </button>
      )}

      {/* Big rank showcase */}
      <div
        className="rounded-3xl p-6 flex flex-col gap-5 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${cfg.gradient[0]}30, ${cfg.gradient[1]}10)`,
          border: `1px solid ${cfg.color}40`,
        }}
      >
        {/* Decorative ambient glow */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30 blur-2xl pointer-events-none"
          style={{ backgroundColor: cfg.color }}
        />

        <div className="flex justify-between items-start relative">
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Your Rank</p>
            <div className="mt-2">
              <RankBadge info={rank} size="xl" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Total LP</p>
            <p className="text-3xl font-extrabold mt-1 tabular-nums" style={{ color: cfg.color }}>
              {leaguePoints.toLocaleString()}
            </p>
          </div>
        </div>

        {nextRank && rank.nextThreshold && (
          <div className="flex flex-col gap-2 relative">
            <div className="flex justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              <span>Progress to {formatRank(nextRank)}</span>
              <span>{progressInRank} / {tierRange} LP</span>
            </div>
            <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${cfg.gradient[0]}, ${cfg.gradient[1]})`,
                  boxShadow: `0 0 10px ${cfg.color}80`,
                }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] text-center">
              <span className="font-bold" style={{ color: cfg.color }}>
                {rank.nextThreshold - leaguePoints}
              </span>{" "}
              LP until {TIER_CONFIG[nextRank.tier].icon} {formatRank(nextRank)}
            </p>
          </div>
        )}
        {!nextRank && (
          <p className="text-xs font-bold text-center" style={{ color: cfg.color }}>
            🏆 You've reached Challenger — the apex of the ladder.
          </p>
        )}
      </div>

      {/* Weekly Leaderboard */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Weekly Leaderboard</h3>
          <span className="text-[9px] font-bold text-[var(--text-muted)]">Resets Monday</span>
        </div>

        {!SUPABASE_ENABLED && (
          <div className="card-base !p-4 border-dashed">
            <p className="text-xs font-bold text-[var(--text-muted)] mb-2">⚙️ Real leaderboard is offline</p>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Connect a Supabase backend to compete with other students in real time. See{" "}
              <code className="text-violet-500 font-mono">supabase/SETUP.md</code> for the 5-min setup.
            </p>
          </div>
        )}

        {SUPABASE_ENABLED && loading && leaderboard.length === 0 && (
          <div className="card-base !p-6 flex justify-center items-center gap-2 text-[var(--text-muted)] text-xs">
            <RefreshCw size={14} className="animate-spin" /> Loading leaderboard...
          </div>
        )}

        <div className="flex flex-col gap-2">
          {allCompetitors.length === 0 && SUPABASE_ENABLED && !loading && (
            <div className="card-base !p-5 text-center">
              <p className="text-sm font-bold mb-1">🏁 Be the first this week!</p>
              <p className="text-xs text-[var(--text-muted)]">Take the daily quiz to earn league points and claim #1.</p>
            </div>
          )}

          {allCompetitors.map((member, idx) => {
            const rankNum = idx + 1;
            const rankIcon = rankNum === 1 ? "🥇" : rankNum === 2 ? "🥈" : rankNum === 3 ? "🥉" : `#${rankNum}`;
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: member.isMe ? -10 : 0 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.5) }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                  member.isMe
                    ? "bg-violet-500/8 border-violet-500/30 shadow-sm"
                    : rankNum === 1
                      ? "bg-amber-400/10 border-amber-400/30"
                      : rankNum === 2
                        ? "bg-slate-300/10 border-slate-300/25"
                        : rankNum === 3
                          ? "bg-orange-500/10 border-orange-500/25"
                          : "bg-[var(--bg-card)] border-[var(--border-color)]"
                }`}
              >
                <span className="text-base w-8 text-center shrink-0 font-bold">{rankIcon}</span>
                <span className="text-2xl shrink-0">{member.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold text-sm truncate ${member.isMe ? "text-violet-500" : ""}`}>{member.name}</span>
                    {member.isMe && <span className="text-[8px] font-bold bg-violet-500/15 text-violet-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">you</span>}
                  </div>
                </div>
                <span className="font-extrabold text-sm tabular-nums shrink-0">{member.weekPoints} LP</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* How to Earn */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">How to Earn LP</h3>
        <div className="grid grid-cols-1 gap-2">
          {[
            { icon: GraduationCap, color: "#A855F7", bg: "rgba(168,85,247,0.1)", label: "Daily Quiz",     pts: "+50 LP",   desc: "Answer the daily flashcard correctly" },
            { icon: TrendingUp,    color: "#60A5FA", bg: "rgba(96,165,250,0.1)", label: "Stock Profits",  pts: "+1 LP/$1", desc: "Earn LP when you sell stocks for profit" },
            { icon: WalletIcon,    color: "#22C55E", bg: "rgba(34,197,94,0.1)",  label: "Log Expenses",   pts: "+5 LP",    desc: "Log a transaction to keep your budgeting streak" },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="card-base !p-4 flex items-center gap-4">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: item.bg }}>
                  <Icon size={18} style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{item.desc}</p>
                </div>
                <span className="font-extrabold text-xs text-emerald-500 shrink-0">{item.pts}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Ladder */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">The Ladder</h3>
        <div className="card-base !p-4 flex flex-col gap-2">
          {ALL_TIERS.map(tier => {
            const tCfg = TIER_CONFIG[tier];
            const threshold = TIER_THRESHOLDS[tier];
            const isCurrent = tier === rank.tier;
            const isUnlocked = leaguePoints >= threshold;
            return (
              <div
                key={tier}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  isCurrent ? "border-2 shadow-md" : "border border-transparent"
                }`}
                style={
                  isCurrent
                    ? {
                        background: `linear-gradient(90deg, ${tCfg.gradient[0]}20, transparent)`,
                        borderColor: tCfg.color + "60",
                      }
                    : undefined
                }
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
                  style={{
                    background: isUnlocked
                      ? `linear-gradient(135deg, ${tCfg.gradient[0]}, ${tCfg.gradient[1]})`
                      : "#33333355",
                    opacity: isUnlocked ? 1 : 0.4,
                  }}
                >
                  {isUnlocked ? tCfg.icon : <Lock size={12} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-black text-xs ${isCurrent ? "" : isUnlocked ? "" : "opacity-50"}`}
                    style={isUnlocked || isCurrent ? { color: tCfg.color } : undefined}
                  >
                    {tCfg.label}
                    {tCfg.hasDivisions && " IV → I"}
                  </p>
                  <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                    {threshold.toLocaleString()} LP
                  </p>
                </div>
                {isCurrent && (
                  <span
                    className="text-[8px] font-black px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: tCfg.color + "20", color: tCfg.color }}
                  >
                    YOU
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
