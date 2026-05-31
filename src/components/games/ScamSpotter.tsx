/**
 * ScamSpotter.tsx — Swipe deck minigame.
 *
 * 12 cards (messages/emails) slide in one at a time. Player has 6 seconds per card to:
 *   - Swipe RIGHT (or tap Legit) → mark as legitimate
 *   - Swipe LEFT  (or tap Scam)  → mark as a scam
 *
 * Each correct decision: +10 LP. False alarm on legit: -5 LP. Streak of 5 correct: +25 bonus.
 * End-of-round results screen explains the red flags missed.
 *
 * Cards are SG-flavoured: DBS phishing, MOM SMS, PayNow refund traps, fake delivery notices,
 * real-looking ride confirmations, school admin messages.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "motion/react";
import { X, Check, AlertTriangle, Trophy, ArrowLeft, Shield, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

interface ScamCard {
  id: string;
  sender: string;          // "DBS Bank", "+65 9123 4567", "Lazada Notice"
  channel: "SMS" | "WhatsApp" | "Email";
  preview: string;         // the message body
  isScam: boolean;
  /** Red flags (if scam) or "Why legit" reasons (if legit) — shown in review. */
  reasons: string[];
}

// ───── Card deck ─────────────────────────────────────────────────────────
const DECK: ScamCard[] = [
  {
    id: "dbs_otp",
    sender: "+65 9234 1122",
    channel: "SMS",
    preview: "DBS: Unusual login detected. Verify identity via https://dbs-secure-verify.com or your account will be locked in 1 hour.",
    isScam: true,
    reasons: [
      "Sender is a personal mobile number — banks use short codes like '77767' or '74824'",
      "Suspicious URL: 'dbs-secure-verify.com' is not the official dbs.com.sg domain",
      "Urgency ('1 hour') is the #1 scam tactic",
      "Banks never ask you to verify identity via SMS links",
    ],
  },
  {
    id: "paynow_refund",
    sender: "PayNow Refund",
    channel: "SMS",
    preview: "Your PayNow refund of $238.00 is pending. Click here to claim: bit.ly/pynow-claim",
    isScam: true,
    reasons: [
      "Sender name 'PayNow Refund' is not a real service",
      "Shortened links (bit.ly) hide the destination — never click",
      "PayNow refunds go directly to your bank, not via links",
      "Unsolicited money is a classic bait",
    ],
  },
  {
    id: "lazada_delivery",
    sender: "Lazada Notice",
    channel: "WhatsApp",
    preview: "Hi! Your package #LAZ8821 cannot be delivered. Pay $1.30 surcharge here: lazada-delivery.help-claim.net",
    isScam: true,
    reasons: [
      "Lazada doesn't charge surcharges via WhatsApp",
      "Domain 'help-claim.net' is not lazada.sg",
      "A tiny payment is bait to harvest your card details",
      "Track packages only in the official Lazada app",
    ],
  },
  {
    id: "mom_grant",
    sender: "MOM Singapore",
    channel: "SMS",
    preview: "Congrats! You qualify for a $500 MOM relief grant. Provide NRIC + bank details at https://mom-relief.sg-grant.com",
    isScam: true,
    reasons: [
      "Real MOM URLs end in .gov.sg, not .com",
      "Government agencies never ask for full bank details via SMS",
      "Unsolicited grants targeting students are almost always scams",
      "Verify any MOM communication on mom.gov.sg directly",
    ],
  },
  {
    id: "iphone_win",
    sender: "Apple SG",
    channel: "SMS",
    preview: "You've been selected to receive a free iPhone 16! Claim within 24h: getfreeapple.win",
    isScam: true,
    reasons: [
      "Apple never runs SMS giveaways",
      "Domain '.win' is a major red flag",
      "'You've been selected' = generic bait",
      "Real promos appear in trusted channels, not SMS",
    ],
  },
  {
    id: "telegram_invest",
    sender: "+1 234 567 8901",
    channel: "WhatsApp",
    preview: "Hi! I'm Sarah from Goldman Sachs. Join our Telegram group for 25% guaranteed monthly crypto returns!",
    isScam: true,
    reasons: [
      "No legitimate fund promises 'guaranteed' returns",
      "25%/month = mathematically impossible long-term",
      "Cold WhatsApp from foreign number = scam pattern",
      "Real Goldman Sachs reps don't recruit via WhatsApp",
    ],
  },
  {
    id: "school_rewards",
    sender: "MOE Smart Nation",
    channel: "Email",
    preview: "Dear Student, your school login was flagged. Reset your password at moe-singpass-reset.online to keep your account.",
    isScam: true,
    reasons: [
      "Singpass resets happen only at singpass.gov.sg",
      "Domain ending '.online' is highly suspicious",
      "MOE doesn't manage Singpass accounts",
      "Government communications use .gov.sg domains",
    ],
  },
  {
    id: "boss_gift_card",
    sender: "Mr. Tan (Principal)",
    channel: "WhatsApp",
    preview: "Urgent — I'm in a meeting. Please buy 5 x $100 iTunes gift cards and send the codes. I'll reimburse later.",
    isScam: true,
    reasons: [
      "Classic 'boss impersonation' scam — gift cards are untraceable",
      "Real bosses don't ask for gift cards over WhatsApp",
      "Urgency + secrecy = scam combo",
      "Always verify by calling the person directly",
    ],
  },

  // LEGITIMATE messages
  {
    id: "dbs_legit_alert",
    sender: "77767",
    channel: "SMS",
    preview: "DBS: $32.50 charged at NTUC FairPrice 11:42am. If not you, call 1800 111 1111.",
    isScam: false,
    reasons: [
      "Short code '77767' is DBS's official sender ID",
      "Reports a specific transaction — no action requested",
      "Hotline '1800 111 1111' is DBS's real fraud line",
      "Tells you how to act, doesn't push a link",
    ],
  },
  {
    id: "grab_ride",
    sender: "Grab",
    channel: "SMS",
    preview: "Your Grab ride to Tampines Mall has arrived. Driver: John Tan (SJB1234R, silver Honda).",
    isScam: false,
    reasons: [
      "Specific ride details match what you booked in-app",
      "No action required — informational",
      "Doesn't ask for payment or personal info",
    ],
  },
  {
    id: "friend_meetup",
    sender: "Mei Lin",
    channel: "WhatsApp",
    preview: "Eh you free tmr 6pm? Got Korean BBQ deal at Robertson Quay, $25 buffet!",
    isScam: false,
    reasons: [
      "From a saved contact",
      "Casual tone, specific plans",
      "No money/data request",
    ],
  },
  {
    id: "school_email",
    sender: "admin@nationaljc.edu.sg",
    channel: "Email",
    preview: "Reminder: Term 2 fees due by 15 May. Pay via the Parents Gateway app or AXS station.",
    isScam: false,
    reasons: [
      "Domain ends in .edu.sg — real school domain",
      "Points to official payment channels (Parents Gateway, AXS)",
      "No external links to click",
    ],
  },
];

const TIME_PER_CARD = 6;        // seconds
const CARDS_PER_ROUND = 12;
const LP_CORRECT = 10;
const LP_WRONG = -5;
const LP_STREAK_BONUS = 25;

interface ScamResult {
  card: ScamCard;
  decision: "legit" | "scam" | "timeout";
  correct: boolean;
}

export interface ScamSpotterResult {
  totalLP: number;
  correctCount: number;
  totalAnswered: number;
  results: ScamResult[];
}

interface Props {
  onExit: () => void;
  onComplete: (result: ScamSpotterResult) => void;
}

// ────────────────────────────────────────────────────────────────────────────
export default function ScamSpotter({ onExit, onComplete }: Props) {
  // Shuffle and pick CARDS_PER_ROUND
  const [deck] = useState(() =>
    [...DECK].sort(() => Math.random() - 0.5).slice(0, CARDS_PER_ROUND)
  );
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ScamResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [floatingMsg, setFloatingMsg] = useState<{ text: string; color: string; key: number } | null>(null);
  const [phase, setPhase] = useState<"intro" | "playing" | "results">("intro");
  const [timeLeft, setTimeLeft] = useState(TIME_PER_CARD);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacityLeft = useTransform(x, [-150, -40, 0], [1, 0.4, 0]);
  const opacityRight = useTransform(x, [0, 40, 150], [0, 0.4, 1]);

  const card = deck[index];
  const done = index >= deck.length;

  // ── Timer ──
  useEffect(() => {
    if (phase !== "playing" || done) return;
    setTimeLeft(TIME_PER_CARD);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const remaining = Math.max(0, TIME_PER_CARD - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        handleDecision("timeout");
      }
    }, 100);
    return () => clearInterval(interval);
  }, [index, phase, done]);

  // ── Finish round ──
  useEffect(() => {
    if (phase === "playing" && done) {
      finalizeRound(results);
    }
  }, [done, phase]);

  function finalizeRound(finalResults: ScamResult[]) {
    let lp = 0;
    let correct = 0;
    let streakCount = 0;
    for (const r of finalResults) {
      if (r.correct) {
        lp += LP_CORRECT;
        correct += 1;
        streakCount += 1;
        if (streakCount > 0 && streakCount % 5 === 0) lp += LP_STREAK_BONUS;
      } else if (r.decision !== "timeout" && !r.card.isScam) {
        // False alarm — penalty
        lp += LP_WRONG;
        streakCount = 0;
      } else {
        streakCount = 0;
      }
    }
    setPhase("results");
    if (correct >= 9) {
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, colors: ["#10B981", "#A855F7", "#FBBF24"] });
    }
    onComplete({
      totalLP: Math.max(0, lp),  // never negative LP returned to App
      correctCount: correct,
      totalAnswered: finalResults.length,
      results: finalResults,
    });
  }

  function handleDecision(decision: "legit" | "scam" | "timeout") {
    if (!card) return;
    const correct = decision !== "timeout" && (
      (decision === "scam" && card.isScam) ||
      (decision === "legit" && !card.isScam)
    );
    const result: ScamResult = { card, decision, correct };
    const newResults = [...results, result];
    setResults(newResults);

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setFloatingMsg({
        text: newStreak > 0 && newStreak % 5 === 0 ? `🔥 +${LP_CORRECT + LP_STREAK_BONUS} LP` : `+${LP_CORRECT} LP`,
        color: "text-emerald-400",
        key: Date.now(),
      });
    } else {
      setStreak(0);
      if (decision === "timeout") {
        setFloatingMsg({ text: "⏰ Time's up!", color: "text-amber-400", key: Date.now() });
      } else if (!card.isScam) {
        setFloatingMsg({ text: `${LP_WRONG} LP false alarm`, color: "text-red-400", key: Date.now() });
      } else {
        setFloatingMsg({ text: "❌ That was a scam!", color: "text-red-400", key: Date.now() });
      }
    }

    setTimeout(() => setFloatingMsg(null), 1200);
    x.set(0);
    setIndex(i => i + 1);
  }

  function handleDragEnd(_: any, info: PanInfo) {
    const SWIPE_THRESHOLD = 100;
    if (info.offset.x > SWIPE_THRESHOLD) handleDecision("legit");
    else if (info.offset.x < -SWIPE_THRESHOLD) handleDecision("scam");
    else x.set(0);
  }

  // ───── INTRO ─────
  if (phase === "intro") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5"
      >
        <button onClick={onExit} className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-violet-500 w-fit">
          <ArrowLeft size={14} /> Back to Games
        </button>

        <div className="text-center mt-4">
          <div className="text-7xl mb-3">🕵️</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Scam Spotter</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2 max-w-xs mx-auto">
            12 messages. {TIME_PER_CARD}s each. Spot the scams before they catch you out.
          </p>
        </div>

        <div className="card-base !p-5 flex flex-col gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">How to Play</p>
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 text-red-400 font-black">←</div>
            <div className="flex-1">
              <p className="text-sm font-bold">Swipe LEFT for scam</p>
              <p className="text-[11px] text-[var(--text-muted)]">Block it — protect your money.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400 font-black">→</div>
            <div className="flex-1">
              <p className="text-sm font-bold">Swipe RIGHT for legit</p>
              <p className="text-[11px] text-[var(--text-muted)]">Trust it — real messages get through.</p>
            </div>
          </div>
        </div>

        <div className="card-base !p-4 flex flex-col gap-2 border border-amber-500/30 bg-amber-500/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">⚡ Rewards</p>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
            <div><p className="text-emerald-400">+{LP_CORRECT} LP</p><p className="text-[var(--text-muted)]">Per correct</p></div>
            <div><p className="text-red-400">{LP_WRONG} LP</p><p className="text-[var(--text-muted)]">False alarm</p></div>
            <div><p className="text-amber-400">+{LP_STREAK_BONUS} LP</p><p className="text-[var(--text-muted)]">Every 5 streak</p></div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setPhase("playing")}
          className="w-full py-4 rounded-2xl font-black text-white text-base bg-gradient-to-r from-amber-500 to-red-500 shadow-lg shadow-amber-500/30"
        >
          Start Round 🚀
        </motion.button>
      </motion.div>
    );
  }

  // ───── RESULTS ─────
  if (phase === "results") {
    const correctCount = results.filter(r => r.correct).length;
    const accuracy = Math.round((correctCount / results.length) * 100);
    const totalLP = (() => {
      let lp = 0;
      let s = 0;
      for (const r of results) {
        if (r.correct) {
          lp += LP_CORRECT;
          s += 1;
          if (s > 0 && s % 5 === 0) lp += LP_STREAK_BONUS;
        } else if (r.decision !== "timeout" && !r.card.isScam) {
          lp += LP_WRONG;
          s = 0;
        } else {
          s = 0;
        }
      }
      return Math.max(0, lp);
    })();

    const grade = accuracy >= 92 ? "S" : accuracy >= 80 ? "A" : accuracy >= 65 ? "B" : accuracy >= 50 ? "C" : "D";
    const gradeColor = grade === "S" ? "#FBBF24" : grade === "A" ? "#22C55E" : grade === "B" ? "#3B82F6" : grade === "C" ? "#F59E0B" : "#EF4444";

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
        <button onClick={onExit} className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-violet-500 w-fit">
          <ArrowLeft size={14} /> Back to Games
        </button>

        {/* Score */}
        <div className="card-base !p-6 flex flex-col items-center gap-3 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ backgroundColor: gradeColor }} />
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Round Complete</p>
          <div className="relative">
            <div
              className="text-7xl font-black"
              style={{ color: gradeColor, textShadow: `0 0 30px ${gradeColor}80` }}
            >
              {grade}
            </div>
          </div>
          <p className="font-extrabold text-2xl">{correctCount} / {results.length} correct ({accuracy}%)</p>
          <div className="flex gap-2 items-center mt-1 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-full">
            <Trophy size={16} className="text-amber-400" />
            <span className="font-black text-amber-400 tabular-nums">+{totalLP} LP earned</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] px-1">Review Each Card</p>
          {results.map((r, i) => (
            <div
              key={i}
              className={`card-base !p-4 border-l-4 flex flex-col gap-2 ${
                r.correct ? "border-l-emerald-500" : "border-l-red-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--bg-main)] text-[var(--text-muted)]">
                    {r.card.channel}
                  </span>
                  <span className="text-xs font-bold">{r.card.sender}</span>
                </div>
                {r.correct ? (
                  <Check size={16} className="text-emerald-500" />
                ) : (
                  <X size={16} className="text-red-500" />
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 italic">"{r.card.preview}"</p>
              <div className="text-[10px] font-bold">
                <span className={r.card.isScam ? "text-red-400" : "text-emerald-400"}>
                  {r.card.isScam ? "🚨 Scam" : "✅ Legit"}
                </span>
                <span className="text-[var(--text-muted)] ml-2">
                  • You chose: {r.decision === "timeout" ? "Time ran out" : r.decision}
                </span>
              </div>
              <ul className="flex flex-col gap-1 mt-1">
                {r.card.reasons.slice(0, 3).map((reason, j) => (
                  <li key={j} className="text-[11px] text-[var(--text-main)] flex gap-1.5 leading-snug">
                    <span className={r.card.isScam ? "text-red-400" : "text-emerald-400"}>•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onExit}
            className="flex-1 py-3.5 rounded-2xl font-bold bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]"
          >
            Done
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-amber-500 to-red-500 text-white flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} /> Play Again
          </button>
        </div>
      </motion.div>
    );
  }

  // ───── PLAYING ─────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 relative">
      {/* Top bar */}
      <div className="flex justify-between items-center">
        <button onClick={onExit} className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-violet-500">
          <ArrowLeft size={14} /> Exit
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            {index + 1} / {deck.length}
          </span>
          {streak >= 2 && (
            <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
              🔥 {streak} streak
            </span>
          )}
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 w-full bg-[var(--bg-main)] rounded-full overflow-hidden">
        <motion.div
          key={`timer-${index}`}
          animate={{ width: `${(timeLeft / TIME_PER_CARD) * 100}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
          className={`h-full transition-colors ${
            timeLeft > 3 ? "bg-emerald-500" : timeLeft > 1.5 ? "bg-amber-500" : "bg-red-500"
          }`}
        />
      </div>

      {/* Floating message */}
      <AnimatePresence>
        {floatingMsg && (
          <motion.div
            key={floatingMsg.key}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.5 }}
            className={`absolute top-12 left-1/2 -translate-x-1/2 text-2xl font-black z-30 ${floatingMsg.color} drop-shadow-lg pointer-events-none`}
          >
            {floatingMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card stack */}
      <div className="relative w-full h-[420px] flex items-center justify-center">
        {/* Behind card peek */}
        {!done && deck[index + 1] && (
          <div className="absolute w-full max-w-sm h-[380px] rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] opacity-50 scale-95 -z-0" />
        )}

        {!done && card && (
          <motion.div
            key={card.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            style={{ x, rotate }}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            whileTap={{ cursor: "grabbing" }}
            className="absolute w-full max-w-sm h-[380px] rounded-3xl bg-[var(--bg-card)] border-2 border-[var(--border-color)] shadow-2xl cursor-grab overflow-hidden flex flex-col"
          >
            {/* SCAM overlay */}
            <motion.div
              style={{ opacity: opacityLeft }}
              className="absolute inset-0 bg-red-500/30 flex items-center justify-center z-20 pointer-events-none"
            >
              <div className="border-4 border-red-500 text-red-500 px-6 py-3 rounded-2xl font-black text-3xl rotate-[-15deg]">
                SCAM
              </div>
            </motion.div>
            {/* LEGIT overlay */}
            <motion.div
              style={{ opacity: opacityRight }}
              className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center z-20 pointer-events-none"
            >
              <div className="border-4 border-emerald-500 text-emerald-500 px-6 py-3 rounded-2xl font-black text-3xl rotate-[15deg]">
                LEGIT
              </div>
            </motion.div>

            {/* Channel header */}
            <div
              className="p-4 flex items-center gap-2 border-b border-[var(--border-color)]"
              style={{
                background: card.channel === "SMS"
                  ? "linear-gradient(135deg, rgba(59,130,246,0.15), transparent)"
                  : card.channel === "WhatsApp"
                  ? "linear-gradient(135deg, rgba(34,197,94,0.15), transparent)"
                  : "linear-gradient(135deg, rgba(168,85,247,0.15), transparent)",
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-[var(--bg-main)] text-[var(--text-muted)]">
                {card.channel === "SMS" ? "💬 SMS" : card.channel === "WhatsApp" ? "📱 WhatsApp" : "📧 Email"}
              </span>
            </div>

            {/* Sender */}
            <div className="px-5 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">FROM</p>
              <p className="font-extrabold text-sm mt-0.5 break-all">{card.sender}</p>
            </div>

            {/* Message */}
            <div className="px-5 py-5 flex-1 flex items-start">
              <p className="text-sm leading-relaxed text-[var(--text-main)] font-medium">
                {card.preview}
              </p>
            </div>

            {/* Hint */}
            <div className="px-4 py-2 border-t border-[var(--border-color)] text-center">
              <p className="text-[10px] font-bold text-[var(--text-muted)]">
                ← Swipe left = Scam  •  Swipe right = Legit →
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Button row (fallback for non-touch) */}
      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleDecision("scam")}
          className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
        >
          <Shield size={18} /> Block — Scam
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleDecision("legit")}
          className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
        >
          <Check size={18} /> Trust — Legit
        </motion.button>
      </div>
    </motion.div>
  );
}
