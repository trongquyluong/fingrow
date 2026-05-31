import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, TrendingDown, Minus, X, Coins } from "lucide-react";
import { StockDef } from "../types";
import { STOCKS } from "../constants";

interface StocksTabProps {
  stockCash: number;
  stockHoldings: Record<string, number>;
  stockAvgBuy: Record<string, number>;
  stockPrices: Record<string, number>;
  stockHistory: Record<string, number[]>;
  onBuy: (stockId: string, shares: number, price: number) => void;
  onSell: (stockId: string, shares: number, price: number, profit: number) => void;
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return <div className="w-16 h-8" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 64;
  const H = 32;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 4) - 2,
  }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const color = positive ? "#6EE7B7" : "#FB7185";
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PortfolioSummary({
  stockCash, holdings, prices, avgBuy,
}: {
  stockCash: number;
  holdings: Record<string, number>;
  prices: Record<string, number>;
  avgBuy: Record<string, number>;
}) {
  const portfolioValue = STOCKS.reduce((sum, s) => {
    return sum + (holdings[s.id] || 0) * (prices[s.id] || s.basePrice);
  }, 0);
  const totalInvested = STOCKS.reduce((sum, s) => {
    return sum + (holdings[s.id] || 0) * (avgBuy[s.id] || prices[s.id] || s.basePrice);
  }, 0);
  const unrealisedPnL = portfolioValue - totalInvested;
  const positive = unrealisedPnL >= 0;

  return (
    <div className="bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 border border-brand-blue/20 rounded-3xl p-5 flex flex-col gap-3">
      <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Investment Wallet</span>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Cash Available</p>
          <p className="text-2xl font-black">${stockCash.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Portfolio Value</p>
          <p className="text-2xl font-black">${portfolioValue.toFixed(2)}</p>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full w-fit ${positive ? "bg-brand-mint/20 text-emerald-700 dark:text-brand-mint" : "bg-brand-coral/20 text-rose-700 dark:text-brand-coral"}`}>
        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {positive ? "+" : ""}{unrealisedPnL.toFixed(2)} unrealised P&L
      </div>
    </div>
  );
}

interface TradeModalProps {
  stock: StockDef;
  price: number;
  sharesOwned: number;
  avgBuyPrice: number;
  stockCash: number;
  onBuy: (shares: number) => void;
  onSell: (shares: number) => void;
  onClose: () => void;
}

function TradeModal({ stock, price, sharesOwned, avgBuyPrice, stockCash, onBuy, onSell, onClose }: TradeModalProps) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState("");
  const shares = parseInt(qty) || 0;
  const totalCost = shares * price;
  const canBuy = shares > 0 && totalCost <= stockCash;
  const canSell = shares > 0 && shares <= sharesOwned;
  const pnl = sharesOwned > 0 ? (price - avgBuyPrice) * (parseInt(qty) || 0) : 0;

  const handle = () => {
    if (mode === "buy" && canBuy) { onBuy(shares); onClose(); }
    if (mode === "sell" && canSell) { onSell(shares); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        className="relative w-full max-w-md bg-[var(--bg-card)] rounded-t-[40px] p-8 flex flex-col gap-5 shadow-2xl"
      >
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stock.ticker}</span>
            <h3 className="text-xl font-black">{stock.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-[var(--bg-main)] rounded-full text-[var(--text-muted)]">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2">
          {(["buy", "sell"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-2xl font-black text-sm uppercase tracking-wide transition-all ${mode === m ? (m === "buy" ? "bg-brand-mint text-emerald-900" : "bg-brand-coral text-white") : "bg-[var(--bg-main)] text-slate-400"}`}>
              {m}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>Current Price</span>
            <span className="font-black text-[var(--text-main)]">${price.toFixed(2)}</span>
          </div>
          {mode === "sell" && sharesOwned > 0 && (
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Avg Buy Price</span>
              <span className="font-black text-[var(--text-main)]">${avgBuyPrice.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>Shares Owned</span>
            <span className="font-black text-[var(--text-main)]">{sharesOwned}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Number of Shares</label>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-full bg-[var(--bg-main)] border-2 border-transparent focus:border-brand-purple rounded-2xl py-4 px-5 text-2xl font-black outline-none transition-all"
            placeholder="0"
          />
        </div>

        {shares > 0 && (
          <div className="bg-[var(--bg-main)] rounded-2xl p-4 flex flex-col gap-1.5">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-slate-400">{mode === "buy" ? "Total Cost" : "Total Proceeds"}</span>
              <span className="font-black">${totalCost.toFixed(2)}</span>
            </div>
            {mode === "sell" && sharesOwned > 0 && (
              <div className={`flex justify-between text-sm font-bold ${pnl >= 0 ? "text-brand-mint" : "text-brand-coral"}`}>
                <span>Est. P&L</span>
                <span>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}</span>
              </div>
            )}
            {mode === "buy" && (
              <div className="flex justify-between text-xs text-slate-400">
                <span>Remaining Cash</span>
                <span className={totalCost > stockCash ? "text-brand-coral font-bold" : ""}>
                  ${(stockCash - totalCost).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        <motion.button
          whileTap={(mode === "buy" ? canBuy : canSell) ? { scale: 0.95 } : {}}
          onClick={handle}
          disabled={mode === "buy" ? !canBuy : !canSell}
          className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all ${
            (mode === "buy" ? canBuy : canSell)
              ? mode === "buy"
                ? "bg-brand-mint text-emerald-900 shadow-lg shadow-brand-mint/20"
                : "bg-brand-coral text-white shadow-lg shadow-brand-coral/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
          }`}
        >
          {mode === "buy"
            ? canBuy ? `Buy ${shares} shares` : shares === 0 ? "Enter quantity" : "Insufficient cash"
            : canSell ? `Sell ${shares} shares` : shares === 0 ? "Enter quantity" : `Only ${sharesOwned} owned`}
        </motion.button>
      </motion.div>
    </div>
  );
}

export default function StocksTab({ stockCash, stockHoldings, stockAvgBuy, stockPrices, stockHistory, onBuy, onSell }: StocksTabProps) {
  const [selectedStock, setSelectedStock] = useState<StockDef | null>(null);

  const getChange = (stock: StockDef) => {
    const hist = stockHistory[stock.id] || [];
    const current = stockPrices[stock.id] || stock.basePrice;
    const prev = hist.length >= 2 ? hist[hist.length - 2] : stock.basePrice;
    return prev > 0 ? ((current - prev) / prev) * 100 : 0;
  };

  const getPositive = (stock: StockDef) => {
    const hist = stockHistory[stock.id] || [];
    return hist.length >= 2 ? hist[hist.length - 1] >= hist[0] : true;
  };

  return (
    <motion.div
      key="stocks"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-5"
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stock Market</h2>
        <p className="text-sm text-[var(--text-muted)]">Buy low, sell high — prices refresh daily.</p>
      </div>

      <PortfolioSummary stockCash={stockCash} holdings={stockHoldings} prices={stockPrices} avgBuy={stockAvgBuy} />

      <div className="flex flex-col gap-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Live Market</h3>
        {STOCKS.map(stock => {
          const price = stockPrices[stock.id] || stock.basePrice;
          const change = getChange(stock);
          const hist = stockHistory[stock.id] || [stock.basePrice];
          const positive = getPositive(stock);
          const owned = stockHoldings[stock.id] || 0;
          const changePositive = change >= 0;

          return (
            <motion.button
              key={stock.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedStock(stock)}
              className="card-base flex items-center justify-between !py-3.5 !px-4 active:bg-slate-50 dark:active:bg-slate-800/50 text-left"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm">{stock.ticker}</span>
                  {owned > 0 && (
                    <span className="bg-brand-purple/10 text-brand-purple text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {owned} shares
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--text-muted)] font-medium">{stock.name}</span>
                {owned > 0 && (
                  <span className="text-[10px] font-bold text-brand-blue mt-0.5 tabular-nums">
                    Worth ${(owned * price).toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Sparkline data={hist} positive={positive} />
                <div className="flex flex-col items-end min-w-[70px]">
                  <span className="font-black text-sm">${price.toFixed(2)}</span>
                  <div className={`flex items-center gap-0.5 text-[10px] font-black ${changePositive ? "text-emerald-500" : "text-rose-500"}`}>
                    {changePositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {changePositive ? "+" : ""}{change.toFixed(2)}%
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="card-base !p-4 flex items-start gap-3">
        <Coins size={16} className="text-yellow-500 fill-yellow-500 mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          <span className="font-black text-[var(--text-main)]">Tip:</span> Profits from selling stocks earn you League Points! Diversify across sectors to reduce risk.
        </p>
      </div>

      <AnimatePresence>
        {selectedStock && (
          <TradeModal
            stock={selectedStock}
            price={stockPrices[selectedStock.id] || selectedStock.basePrice}
            sharesOwned={stockHoldings[selectedStock.id] || 0}
            avgBuyPrice={stockAvgBuy[selectedStock.id] || stockPrices[selectedStock.id] || selectedStock.basePrice}
            stockCash={stockCash}
            onBuy={shares => onBuy(selectedStock.id, shares, stockPrices[selectedStock.id] || selectedStock.basePrice)}
            onSell={shares => {
              const price = stockPrices[selectedStock.id] || selectedStock.basePrice;
              const avg = stockAvgBuy[selectedStock.id] || price;
              const profit = (price - avg) * shares;
              onSell(selectedStock.id, shares, price, profit);
            }}
            onClose={() => setSelectedStock(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
