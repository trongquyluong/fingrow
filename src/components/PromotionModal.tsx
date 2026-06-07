/**
 * PromotionModal.tsx — full-screen LoL-style rank-up celebration.
 *
 * Fires whenever a player's leagueTier advances to a new tier.
 * Reuses the centered-modal pattern from WalletTab.AddSheet.
 */
import { useEffect } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { LeagueTier, RankInfo } from "../types";
import { TIER_CONFIG, TIER_TAGLINES } from "../constants";
import RankCrest from "./RankCrest";

interface Props {
  promotion: { tier: LeagueTier; from: LeagueTier; lpEarned: number } | null;
  onClose: () => void;
}

export default function PromotionModal({ promotion, onClose }: Props) {
  useEffect(() => {
    if (!promotion) return;
    const cfg = TIER_CONFIG[promotion.tier];
    // Tier-coloured confetti burst (1.5s)
    const end = Date.now() + 1500;
    const tick = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: [cfg.color, cfg.gradient[0], cfg.gradient[1], "#FFFFFF"],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: [cfg.color, cfg.gradient[0], cfg.gradient[1], "#FFFFFF"],
      });
      if (Date.now() < end) requestAnimationFrame(tick);
    };
    tick();
  }, [promotion]);

  if (!promotion) return null;
  const cfg = TIER_CONFIG[promotion.tier];
  const fromCfg = TIER_CONFIG[promotion.from];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Card */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="relative w-full max-w-xs rounded-3xl overflow-hidden text-center"
        style={{
          background: `linear-gradient(180deg, ${cfg.gradient[0]}25, ${cfg.gradient[1]}40)`,
          border: `1.5px solid ${cfg.color}80`,
          boxShadow: `0 0 60px ${cfg.color}55, inset 0 1px 0 rgba(255,255,255,0.15)`,
        }}
      >
        {/* Top label */}
        <div className="pt-6 pb-2">
          <p
            className="text-[10px] font-black tracking-[0.35em] uppercase"
            style={{ color: cfg.color }}
          >
            ✦ Promoted ✦
          </p>
        </div>

        {/* Crest */}
        <div className="flex justify-center py-3">
          <RankCrest tier={promotion.tier} size={104} />
        </div>

        {/* Tier name */}
        <h2
          className="text-3xl font-black tracking-tight"
          style={{ color: cfg.color }}
        >
          {cfg.label}
        </h2>
        <p className="text-[11px] text-[var(--text-muted)] italic px-6 mt-1">
          “{TIER_TAGLINES[promotion.tier]}”
        </p>

        {/* Stat row */}
        <div className="grid grid-cols-2 gap-2 mx-5 mt-5 mb-5">
          <div
            className="rounded-2xl p-2.5"
            style={{ background: "rgba(0,0,0,0.35)", border: `1px solid ${cfg.color}40` }}
          >
            <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-bold">
              From
            </p>
            <p
              className="text-sm font-black mt-0.5"
              style={{ color: fromCfg.color }}
            >
              {fromCfg.icon} {fromCfg.label}
            </p>
          </div>
          <div
            className="rounded-2xl p-2.5"
            style={{ background: "rgba(0,0,0,0.35)", border: `1px solid ${cfg.color}60` }}
          >
            <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-bold">
              LP earned
            </p>
            <p className="text-sm font-black mt-0.5" style={{ color: cfg.color }}>
              +{promotion.lpEarned.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 font-black text-sm tracking-wide active:scale-95 transition-transform"
          style={{
            background: `linear-gradient(135deg, ${cfg.color}, ${cfg.gradient[1]})`,
            color: "#0A0A0A",
          }}
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}
