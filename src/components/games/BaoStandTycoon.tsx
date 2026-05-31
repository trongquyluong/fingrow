/**
 * BaoStandTycoon.tsx — 5-day bao stall sim.
 *
 * Daily loop:
 *   1. MORNING — set price ($1.20-$3.00) + buy inventory (each bao costs $0.80 to make)
 *   2. RUSH    — 20-second animated day: customers walk past your stall, decide to buy or skip
 *                based on price vs. weather + special modifier (haze, exam week, payday, etc.)
 *   3. P&L     — revenue, COGS, spoilage, gross margin % — student learns unit economics
 *
 * LP scales with margin % (not raw revenue) to teach efficient pricing.
 * Hawker Master badge: hit 40%+ margin for 3 days in a single run.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ChevronRight, TrendingUp, Trophy, RefreshCw, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";

// ───── Config ─────────────────────────────────────────────────────────────
const TOTAL_DAYS = 5;
const COST_PER_BAO = 0.80;
const MIN_PRICE = 1.20;
const MAX_PRICE = 3.00;
const STARTING_CAPITAL = 30;       // $30 to start
const BASE_FOOT_TRAFFIC = 50;      // average people walking by
const PRICE_ELASTICITY = 1.4;       // how strongly demand falls as price rises
const RUSH_SECONDS = 20;
const HAWKER_MARGIN = 0.40;         // 40% margin counts toward Hawker Master badge
const HAWKER_DAYS_REQUIRED = 3;

interface DayCondition {
  emoji: string;
  name: string;
  description: string;
  /** Multiplier on foot traffic */
  trafficMultiplier: number;
  /** Bonus willingness to pay ($) — positive means willing to pay more */
  priceTolerance: number;
}

const CONDITIONS: DayCondition[] = [
  { emoji: "☀️", name: "Sunny Day",     description: "Perfect bao weather. Lots of people about.",       trafficMultiplier: 1.10, priceTolerance: 0    },
  { emoji: "🌧️", name: "Rainy Day",     description: "Rain reduces foot traffic but people want hot food.", trafficMultiplier: 0.70, priceTolerance: 0.20 },
  { emoji: "😷", name: "Haze Warning",  description: "Air quality is poor. Most stay indoors.",          trafficMultiplier: 0.55, priceTolerance: -0.10},
  { emoji: "📚", name: "Exam Week",     description: "Hungry students with little money.",                trafficMultiplier: 1.40, priceTolerance: -0.30},
  { emoji: "💰", name: "Payday Friday", description: "Wallets are full. People splurge.",                 trafficMultiplier: 1.20, priceTolerance: 0.40 },
  { emoji: "🎉", name: "Sports Day",    description: "Big crowd nearby — but they're rushing.",           trafficMultiplier: 1.50, priceTolerance: -0.10},
  { emoji: "🌡️", name: "Heat Wave",     description: "Too hot. People want cold drinks, not buns.",      trafficMultiplier: 0.85, priceTolerance: -0.20},
];

interface DayResult {
  day: number;
  condition: DayCondition;
  price: number;
  bought: number;
  sold: number;
  spoiled: number;
  revenue: number;
  cogs: number;
  profit: number;
  margin: number;     // 0..1
}

export interface BaoTycoonResult {
  totalProfit: number;
  averageMargin: number;
  daysAt40PlusMargin: number;
  hawkerMaster: boolean;
  history: DayResult[];
  totalLP: number;
}

type Phase = "intro" | "setup" | "rush" | "endOfDay" | "gameOver";

interface Props {
  onExit: () => void;
  onComplete: (result: BaoTycoonResult) => void;
}

// ────────────────────────────────────────────────────────────────────────────
export default function BaoStandTycoon({ onExit, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [day, setDay] = useState(1);
  const [cash, setCash] = useState(STARTING_CAPITAL);
  const [condition, setCondition] = useState<DayCondition>(() => CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)]);

  // Today's setup
  const [price, setPrice] = useState(1.80);
  const [stockUp, setStockUp] = useState(20);

  // Rush state
  const [walkBy, setWalkBy] = useState(0);
  const [soldRT, setSoldRT] = useState(0);
  const [skippedRT, setSkippedRT] = useState(0);
  const [floaters, setFloaters] = useState<{ id: number; kind: "sold" | "skip"; x: number }[]>([]);
  const [rushTimeLeft, setRushTimeLeft] = useState(RUSH_SECONDS);

  // Today's result (committed after rush)
  const [todayResult, setTodayResult] = useState<DayResult | null>(null);

  // History
  const [history, setHistory] = useState<DayResult[]>([]);

  // ── Demand model ──────────────────────────────────────────────────────
  /**
   * Returns probability a single walker buys at the current price.
   * Higher price → exponentially fewer buyers, modified by priceTolerance.
   */
  function buyProbability(price: number, cond: DayCondition): number {
    // Sweet spot is $1.50–$2.00. Above that, demand falls off.
    const effectivePrice = price - cond.priceTolerance;
    // Logistic: prob = 1 / (1 + e^(k * (price - midpoint)))
    const midpoint = 1.80;
    const k = PRICE_ELASTICITY * 3;
    const prob = 1 / (1 + Math.exp(k * (effectivePrice - midpoint)));
    return Math.max(0.02, Math.min(0.85, prob));
  }

  // ── Rush phase ────────────────────────────────────────────────────────
  const rushTimer = useRef<number | null>(null);
  const customerTimer = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "rush") return;
    const start = Date.now();
    const totalWalkers = Math.round(BASE_FOOT_TRAFFIC * condition.trafficMultiplier);
    const buyProb = buyProbability(price, condition);

    setRushTimeLeft(RUSH_SECONDS);
    setWalkBy(0);
    setSoldRT(0);
    setSkippedRT(0);
    setFloaters([]);

    let walkers = 0;
    let sold = 0;
    let skipped = 0;
    const remainingStock = { value: stockUp };

    // Spawn one customer roughly every (RUSH_SECONDS / totalWalkers) seconds
    const intervalMs = (RUSH_SECONDS * 1000) / Math.max(1, totalWalkers);

    customerTimer.current = window.setInterval(() => {
      walkers += 1;
      setWalkBy(walkers);

      // Decision
      const wantsToBuy = Math.random() < buyProb;
      const canBuy = remainingStock.value > 0;
      const fid = Date.now() + walkers;
      if (wantsToBuy && canBuy) {
        remainingStock.value -= 1;
        sold += 1;
        setSoldRT(sold);
        setFloaters(f => [...f, { id: fid, kind: "sold", x: 30 + Math.random() * 40 }]);
      } else {
        skipped += 1;
        setSkippedRT(skipped);
        if (Math.random() < 0.3) {
          setFloaters(f => [...f, { id: fid, kind: "skip", x: 30 + Math.random() * 40 }]);
        }
      }
      setTimeout(() => setFloaters(f => f.filter(x => x.id !== fid)), 1400);

      if (walkers >= totalWalkers) {
        if (customerTimer.current) clearInterval(customerTimer.current);
      }
    }, intervalMs);

    // Tick the timer
    rushTimer.current = window.setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setRushTimeLeft(Math.max(0, RUSH_SECONDS - elapsed));
      if (elapsed >= RUSH_SECONDS) {
        if (rushTimer.current) clearInterval(rushTimer.current);
        if (customerTimer.current) clearInterval(customerTimer.current);
        // Final P&L
        const revenue = sold * price;
        const cogs = stockUp * COST_PER_BAO;
        const spoiled = stockUp - sold;
        const profit = revenue - cogs;
        const margin = revenue > 0 ? profit / revenue : 0;
        const result: DayResult = {
          day, condition, price,
          bought: stockUp, sold, spoiled,
          revenue, cogs, profit, margin,
        };
        setTodayResult(result);
        setCash(prev => prev + profit);   // cash already deducted in startDay
        setHistory(h => [...h, result]);
        setPhase("endOfDay");
      }
    }, 100);

    return () => {
      if (rushTimer.current) clearInterval(rushTimer.current);
      if (customerTimer.current) clearInterval(customerTimer.current);
    };
  }, [phase]);

  // ── Day flow ──────────────────────────────────────────────────────────
  function startDay() {
    // Charge for inventory upfront
    const inventoryCost = stockUp * COST_PER_BAO;
    if (inventoryCost > cash) return;
    setCash(prev => prev - inventoryCost);
    setPhase("rush");
  }

  function nextDay() {
    if (day >= TOTAL_DAYS) {
      // End of game
      finalize();
      return;
    }
    setDay(d => d + 1);
    setCondition(CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)]);
    setTodayResult(null);
    setPhase("setup");
    // Reasonable default for next day = price stays, restock to roughly the same number
    setStockUp(s => Math.min(40, Math.max(10, s)));
  }

  function finalize() {
    const totalProfit = history.reduce((s, r) => s + r.profit, 0);
    const avgMargin = history.reduce((s, r) => s + r.margin, 0) / history.length;
    const days40 = history.filter(r => r.margin >= HAWKER_MARGIN).length;
    const master = days40 >= HAWKER_DAYS_REQUIRED;
    // LP formula: avgMargin * 1000 (so 50% → +500 LP). Cap at 600 to keep balanced.
    const lp = Math.min(600, Math.max(0, Math.round(avgMargin * 1000)));
    const masterBonus = master ? 250 : 0;
    if (master) {
      confetti({ particleCount: 250, spread: 120, origin: { y: 0.45 }, colors: ["#FBBF24", "#22C55E", "#A855F7"] });
    }
    onComplete({
      totalProfit,
      averageMargin: avgMargin,
      daysAt40PlusMargin: days40,
      hawkerMaster: master,
      history,
      totalLP: lp + masterBonus,
    });
    setPhase("gameOver");
  }

  // ── Pre-compute current setup expectations ─────────────────────────────
  const expectedTraffic = Math.round(BASE_FOOT_TRAFFIC * condition.trafficMultiplier);
  const expectedBuyProb = buyProbability(price, condition);
  const expectedSales = Math.round(expectedTraffic * expectedBuyProb);
  const expectedSold = Math.min(stockUp, expectedSales);
  const expectedRevenue = expectedSold * price;
  const expectedCogs = stockUp * COST_PER_BAO;
  const expectedProfit = expectedRevenue - expectedCogs;
  const expectedMargin = expectedRevenue > 0 ? (expectedProfit / expectedRevenue) * 100 : 0;
  const inventoryCost = stockUp * COST_PER_BAO;
  const canAfford = inventoryCost <= cash;

  // ───── INTRO ─────
  if (phase === "intro") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
        <button onClick={onExit} className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-violet-500 w-fit">
          <ArrowLeft size={14} /> Back to Games
        </button>

        <div className="text-center mt-4">
          <div className="text-7xl mb-3">🥟</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Bao Stand Tycoon</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2 max-w-xs mx-auto">
            5 days to run a bao stall outside school. Set your price, buy inventory, watch the rush.
          </p>
        </div>

        <div className="card-base !p-5 flex flex-col gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">📊 The Rules</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><p className="font-bold">Starting cash</p><p className="text-[var(--text-muted)]">${STARTING_CAPITAL}</p></div>
            <div><p className="font-bold">Cost per bao</p><p className="text-[var(--text-muted)]">${COST_PER_BAO.toFixed(2)}</p></div>
            <div><p className="font-bold">Price range</p><p className="text-[var(--text-muted)]">${MIN_PRICE} – ${MAX_PRICE}</p></div>
            <div><p className="font-bold">Days</p><p className="text-[var(--text-muted)]">{TOTAL_DAYS}</p></div>
          </div>
        </div>

        <div className="card-base !p-4 border border-amber-500/30 bg-amber-500/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">💡 Learning Goal</p>
          <p className="text-xs text-[var(--text-main)] leading-relaxed">
            You earn <span className="font-bold text-amber-400">based on margin %</span>, not raw revenue.
            Selling 30 bao at $2.00 (high margin) beats 50 bao at $1.20 (thin margin).
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setPhase("setup")}
          className="w-full py-4 rounded-2xl font-black text-white text-base bg-gradient-to-r from-emerald-500 to-amber-500 shadow-lg shadow-emerald-500/30"
        >
          Open the Stall 🥟
        </motion.button>
      </motion.div>
    );
  }

  // ───── SETUP (morning of each day) ─────
  if (phase === "setup") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-violet-500">
            <ArrowLeft size={14} /> Exit
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              Day {day} / {TOTAL_DAYS}
            </span>
            <span className="font-black text-sm text-emerald-400 tabular-nums">${cash.toFixed(2)}</span>
          </div>
        </div>

        {/* Today's condition */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="card-base !p-4 flex items-center gap-3 border-l-4 border-l-amber-500"
        >
          <div className="text-3xl">{condition.emoji}</div>
          <div className="flex-1">
            <p className="font-extrabold text-sm">{condition.name}</p>
            <p className="text-[11px] text-[var(--text-muted)] leading-snug">{condition.description}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Traffic</p>
            <p className="font-extrabold tabular-nums">{Math.round(BASE_FOOT_TRAFFIC * condition.trafficMultiplier)}</p>
          </div>
        </motion.div>

        {/* Price slider */}
        <div className="card-base !p-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">🏷️ Selling Price</p>
            <p className="text-2xl font-extrabold tabular-nums">${price.toFixed(2)}</p>
          </div>
          <input
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={0.10}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-bold">
            <span>${MIN_PRICE} (thin margin)</span>
            <span>Cost ${COST_PER_BAO}</span>
            <span>${MAX_PRICE} (premium)</span>
          </div>
        </div>

        {/* Stock slider */}
        <div className="card-base !p-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">📦 Inventory</p>
            <p className="text-2xl font-extrabold tabular-nums">{stockUp} bao</p>
          </div>
          <input
            type="range"
            min={5}
            max={Math.min(60, Math.floor(cash / COST_PER_BAO))}
            step={1}
            value={Math.min(stockUp, Math.floor(cash / COST_PER_BAO))}
            onChange={(e) => setStockUp(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-[var(--text-muted)]">Cost: <span className={canAfford ? "text-amber-400" : "text-red-400"}>${inventoryCost.toFixed(2)}</span></span>
            <span className="text-[var(--text-muted)]">Unsold = spoiled</span>
          </div>
          {!canAfford && (
            <div className="text-xs text-red-400 font-bold flex items-center gap-1 mt-1">
              <AlertTriangle size={12} /> Can't afford this much stock — reduce.
            </div>
          )}
        </div>

        {/* Forecast */}
        <div className="card-base !p-4 flex flex-col gap-2 border border-emerald-500/30 bg-emerald-500/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">🔮 Forecast</p>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
            <div><p className="text-[var(--text-muted)]">Likely sold</p><p className="text-base font-extrabold">~{expectedSold}</p></div>
            <div><p className="text-[var(--text-muted)]">Est. revenue</p><p className="text-base font-extrabold">${expectedRevenue.toFixed(0)}</p></div>
            <div><p className="text-[var(--text-muted)]">Est. margin</p><p className={`text-base font-extrabold ${expectedMargin >= 40 ? "text-emerald-400" : expectedMargin >= 20 ? "text-amber-400" : "text-red-400"}`}>{expectedMargin.toFixed(0)}%</p></div>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] text-center italic">Actual results depend on luck + price</p>
        </div>

        <motion.button
          whileTap={canAfford ? { scale: 0.97 } : {}}
          onClick={startDay}
          disabled={!canAfford}
          className={`w-full py-4 rounded-2xl font-black text-white text-base ${
            canAfford
              ? "bg-gradient-to-r from-emerald-500 to-amber-500 shadow-lg shadow-emerald-500/30"
              : "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed"
          }`}
        >
          Start the Day 🌅 <ChevronRight size={18} className="inline ml-1" />
        </motion.button>
      </motion.div>
    );
  }

  // ───── RUSH (live animation) ─────
  if (phase === "rush") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            Day {day} • {condition.emoji} {condition.name}
          </div>
          <div className="text-[12px] font-extrabold text-amber-400 tabular-nums">
            ⏱ {rushTimeLeft.toFixed(1)}s
          </div>
        </div>
        {/* Timer bar */}
        <div className="h-1.5 w-full bg-[var(--bg-main)] rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${(rushTimeLeft / RUSH_SECONDS) * 100}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
            className="h-full bg-gradient-to-r from-emerald-500 to-amber-500"
          />
        </div>

        {/* Stand scene */}
        <div className="relative h-72 rounded-3xl overflow-hidden border border-[var(--border-color)] bg-gradient-to-b from-orange-100/10 to-orange-300/20">
          {/* Sun/sky */}
          <div className="absolute top-3 right-3 text-3xl">{condition.emoji}</div>

          {/* Floaters (sold +$ / skipped 🚶) */}
          <AnimatePresence>
            {floaters.map(f => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 100, x: `${f.x}%` }}
                animate={{ opacity: 1, y: 30 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 1.2 }}
                className={`absolute text-2xl font-black ${f.kind === "sold" ? "text-emerald-500" : "text-slate-400"} drop-shadow-lg pointer-events-none`}
                style={{ left: `${f.x}%` }}
              >
                {f.kind === "sold" ? `+$${price.toFixed(2)}` : "🚶"}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Stand */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-32 flex flex-col items-center">
            {/* roof */}
            <div className="w-52 h-4 bg-red-600 rounded-t-2xl shadow-lg" />
            {/* sign */}
            <div className="w-40 -mt-1 bg-amber-400 text-center py-1 text-xs font-black shadow">
              🥟 BAO ${price.toFixed(2)}
            </div>
            {/* counter */}
            <div className="w-44 h-20 bg-amber-700 rounded-b-xl shadow-xl flex items-center justify-center text-4xl">
              🥟
            </div>
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-4 gap-2">
          <Stat label="Walk by"  value={walkBy.toString()}    color="text-blue-400" />
          <Stat label="Sold"     value={soldRT.toString()}    color="text-emerald-400" />
          <Stat label="Skipped"  value={skippedRT.toString()} color="text-slate-400" />
          <Stat label="Revenue"  value={`$${(soldRT * price).toFixed(0)}`} color="text-amber-400" />
        </div>

        {/* Sold-out hint */}
        {soldRT >= stockUp && (
          <div className="text-center text-xs font-bold text-amber-400">⚠️ Sold out! No more stock left.</div>
        )}
      </motion.div>
    );
  }

  // ───── END OF DAY (P&L) ─────
  if (phase === "endOfDay" && todayResult) {
    const r = todayResult;
    const marginColor = r.margin >= 0.40 ? "text-emerald-400" : r.margin >= 0.20 ? "text-amber-400" : "text-red-400";
    const isLastDay = day >= TOTAL_DAYS;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">End of Day {r.day}</p>
          <h2 className="text-2xl font-extrabold mt-1">P&L Report</h2>
        </div>

        {/* Big margin */}
        <div className="card-base !p-6 text-center flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-30 bg-emerald-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Gross Margin</p>
          <p className={`text-6xl font-extrabold tabular-nums ${marginColor}`}>{(r.margin * 100).toFixed(0)}%</p>
          <p className="text-[11px] text-[var(--text-muted)]">
            {r.margin >= 0.40 ? "🏆 Hawker-level pricing!" : r.margin >= 0.20 ? "Solid day." : "Tighten that pricing."}
          </p>
        </div>

        {/* Line items */}
        <div className="card-base !p-5 flex flex-col gap-3">
          <LineItem label={`Revenue (${r.sold} sold × $${r.price.toFixed(2)})`} value={`+$${r.revenue.toFixed(2)}`} color="text-emerald-400" />
          <LineItem label={`COGS (${r.bought} × $${COST_PER_BAO})`} value={`-$${r.cogs.toFixed(2)}`} color="text-red-400" />
          {r.spoiled > 0 && (
            <LineItem label={`Spoiled: ${r.spoiled} bao 💔`} value={`(${r.spoiled} × $${COST_PER_BAO})`} color="text-slate-500" small />
          )}
          <div className="h-px bg-[var(--border-color)]" />
          <LineItem label="Net profit" value={`${r.profit >= 0 ? "+" : ""}$${r.profit.toFixed(2)}`} color={r.profit >= 0 ? "text-emerald-400" : "text-red-400"} big />
        </div>

        {/* Tip */}
        <div className="card-base !p-3 border border-violet-500/30 bg-violet-500/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1">💡 Tip</p>
          <p className="text-xs text-[var(--text-main)] leading-snug">
            {r.spoiled > r.sold ? "Over-stocked! Make less, lose less to spoilage." :
             r.sold === r.bought && r.margin < 0.30 ? "You sold out fast — try a higher price next time." :
             r.margin >= 0.40 ? "Great pricing! You captured the sweet spot." :
             "Try adjusting price by 20-40 cents and see what happens."}
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={nextDay}
          className="w-full py-4 rounded-2xl font-black text-white text-base bg-gradient-to-r from-emerald-500 to-amber-500 shadow-lg shadow-emerald-500/30"
        >
          {isLastDay ? "See Final Results 🏆" : `Next: Day ${day + 1}`}<ChevronRight size={18} className="inline ml-1" />
        </motion.button>
      </motion.div>
    );
  }

  // ───── GAME OVER (final summary) ─────
  if (phase === "gameOver") {
    const totalProfit = history.reduce((s, r) => s + r.profit, 0);
    const avgMargin = history.reduce((s, r) => s + r.margin, 0) / history.length;
    const days40 = history.filter(r => r.margin >= HAWKER_MARGIN).length;
    const master = days40 >= HAWKER_DAYS_REQUIRED;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
        <button onClick={onExit} className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-violet-500 w-fit">
          <ArrowLeft size={14} /> Back to Games
        </button>

        <div className="text-center mt-2">
          <div className="text-7xl mb-2">{master ? "🏆" : totalProfit >= 0 ? "🥟" : "💸"}</div>
          <h1 className="text-3xl font-extrabold tracking-tight">{master ? "Hawker Master!" : "5 Days Done"}</h1>
        </div>

        {/* Big stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-base !p-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Total Profit</p>
            <p className={`text-2xl font-extrabold tabular-nums mt-1 ${totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
            </p>
          </div>
          <div className="card-base !p-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Avg Margin</p>
            <p className={`text-2xl font-extrabold tabular-nums mt-1 ${avgMargin >= 0.40 ? "text-emerald-400" : avgMargin >= 0.20 ? "text-amber-400" : "text-red-400"}`}>
              {(avgMargin * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Hawker Master callout */}
        {master && (
          <div className="card-base !p-4 border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/15 to-violet-500/10 text-center">
            <p className="text-3xl mb-1">🏅</p>
            <p className="font-black text-amber-400">Hawker Master Badge Unlocked!</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {days40} days at 40%+ margin · +250 LP bonus
            </p>
          </div>
        )}

        {/* Daily breakdown */}
        <div className="card-base !p-5 flex flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Daily Breakdown</p>
          {history.map((r, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-[var(--border-color)] last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{r.condition.emoji}</span>
                <div>
                  <p className="text-xs font-bold">Day {r.day}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">${r.price.toFixed(2)} · {r.sold}/{r.bought} sold</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-extrabold tabular-nums ${r.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {r.profit >= 0 ? "+" : ""}${r.profit.toFixed(2)}
                </p>
                <p className={`text-[10px] font-bold ${r.margin >= 0.40 ? "text-emerald-400" : r.margin >= 0.20 ? "text-amber-400" : "text-red-400"}`}>
                  {(r.margin * 100).toFixed(0)}% margin
                </p>
              </div>
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
            className="flex-1 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-amber-500 text-white flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} /> Replay
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}

// ─── Subcomponents ──────────────────────────────────────────────────────────
function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card-base !p-2 flex flex-col items-center gap-0.5">
      <p className={`text-base font-extrabold tabular-nums ${color}`}>{value}</p>
      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
    </div>
  );
}

function LineItem({ label, value, color, big, small }: { label: string; value: string; color: string; big?: boolean; small?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${small ? "opacity-70" : ""}`}>
      <span className={`${big ? "text-sm font-black" : "text-xs"} ${small ? "text-[var(--text-muted)]" : ""}`}>{label}</span>
      <span className={`${big ? "text-base font-black" : "text-xs font-bold"} tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
