/**
 * Onboarding.tsx — first-run intro shown to brand-new users.
 *
 * A short 3-slide tour of what Fingrow is, ending with an account prompt
 * (create / log in). A guest escape hatch is kept small because no-auth play
 * is a hard product constraint — but signing up is the encouraged path.
 *
 * App.tsx shows this once, gated by the `fingrow_onboarded` localStorage flag.
 */

import { useState } from "react";
import { motion } from "motion/react";
import { UserCircle2, Lock, ChevronRight } from "lucide-react";

interface Props {
  onCreateAccount: () => void;
  onLogin: () => void;
  onGuest: () => void;
}

const SLIDES = [
  {
    emoji: "🌱",
    title: "Welcome to Fingrow",
    body: "Level up your money skills — budgeting, investing, scams and CPF — through quick, fun games built for SG students.",
    glow: "#A855F7",
  },
  {
    emoji: "🎮",
    title: "Play & earn",
    body: "Take the Daily Challenge, run the Stock & Life simulators, spot scams, and earn League Points (LP) for every smart move.",
    glow: "#06B6D4",
  },
  {
    emoji: "🏆",
    title: "Climb the league",
    body: "Rank up from Iron to Challenger and compete with classmates on the weekly leaderboard. Create an account to save your progress across devices.",
    glow: "#F59E0B",
  },
];

export default function Onboarding({ onCreateAccount, onLogin, onGuest }: Props) {
  const [i, setI] = useState(0);
  const isLast = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex flex-col"
      style={{ backgroundColor: "var(--bg-main)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative flex-1 flex flex-col max-w-md w-full mx-auto px-6 pt-10 pb-8">
        {/* Skip */}
        <div className="flex justify-end">
          <button onClick={onGuest} className="text-xs font-bold text-[var(--text-muted)] hover:text-violet-400 px-2 py-1">
            Skip
          </button>
        </div>

        {/* Slide content — keyed entrance animation (no exit-wait, stall-proof) */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute w-40 h-40 rounded-full blur-3xl opacity-30" style={{ backgroundColor: slide.glow }} />
              <div
                className="relative w-28 h-28 rounded-[2rem] flex items-center justify-center text-6xl border"
                style={{
                  background: `linear-gradient(135deg, ${slide.glow}25, transparent)`,
                  borderColor: `${slide.glow}50`,
                }}
              >
                {slide.emoji}
              </div>
            </div>
            <div className="px-2">
              <h1 className="text-2xl font-extrabold tracking-tight">{slide.title}</h1>
              <p className="text-sm text-[var(--text-main)]/70 leading-relaxed mt-3 max-w-[300px] mx-auto">
                {slide.body}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, idx) => (
            <div
              key={idx}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: idx === i ? 22 : 8,
                backgroundColor: idx === i ? "#A855F7" : "var(--border-color)",
              }}
            />
          ))}
        </div>

        {/* Footer actions */}
        {!isLast ? (
          <button
            onClick={() => setI(n => Math.min(SLIDES.length - 1, n + 1))}
            className="w-full py-4 rounded-2xl font-black text-white shadow-lg shadow-violet-500/20 bg-gradient-to-r from-violet-600 to-violet-500 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            Next <ChevronRight size={18} />
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            <button
              onClick={onCreateAccount}
              className="w-full py-4 rounded-2xl font-black text-white shadow-lg shadow-violet-500/20 bg-gradient-to-r from-violet-600 to-violet-500 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <UserCircle2 size={18} /> Create your account
            </button>
            <button
              onClick={onLogin}
              className="w-full py-4 rounded-2xl font-black bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Lock size={16} /> I already have an account
            </button>
            <button
              onClick={onGuest}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-violet-400 py-1 mt-1"
            >
              Continue as guest
            </button>
            <p className="text-[10px] text-center text-[var(--text-muted)] leading-relaxed">
              An account saves your progress and puts you on the leaderboard. Guests can still play — your data stays on this device.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
