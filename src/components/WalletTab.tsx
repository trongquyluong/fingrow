/**
 * WalletTab.tsx — "My Wallet" personal money tracker for students.
 * Patterns adapted from Copilot Money (transaction list, smart dates),
 * Cleo (teen tone), Spendee (donut breakdown), Monarch (summary card).
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  X,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet as WalletIcon,
  PencilLine,
} from "lucide-react";
import { Transaction, TransactionType, WalletCategoryId } from "../types";
import { WALLET_CATEGORIES } from "../constants";

interface WalletTabProps {
  transactions: Transaction[];
  monthlyBudget: number;
  onAdd: (t: Omit<Transaction, "id">) => void;
  onDelete: (id: string) => void;
  onSetBudget: (amount: number) => void;
}

const catById = (id: WalletCategoryId) =>
  WALLET_CATEGORIES.find(c => c.id === id) ?? WALLET_CATEGORIES.find(c => c.id === "other")!;

export default function WalletTab({
  transactions,
  monthlyBudget,
  onAdd,
  onDelete,
  onSetBudget,
}: WalletTabProps) {
  const [showSheet, setShowSheet] = useState(false);
  const [showBudgetSheet, setShowBudgetSheet] = useState(false);

  // ── Computed: this-month stats ──
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const thisMonth = useMemo(
    () =>
      transactions.filter(t => {
        const d = new Date(t.date);
        return `${d.getFullYear()}-${d.getMonth()}` === monthKey;
      }),
    [transactions, monthKey]
  );

  const income = thisMonth
    .filter(t => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = thisMonth
    .filter(t => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const net = income - expenses;

  // ── Spending by category (for donut) ──
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    thisMonth
      .filter(t => t.type === "expense")
      .forEach(t => { map[t.categoryId] = (map[t.categoryId] || 0) + t.amount; });
    return Object.entries(map)
      .map(([id, amt]) => ({ id: id as WalletCategoryId, amount: amt }))
      .sort((a, b) => b.amount - a.amount);
  }, [thisMonth]);

  // ── Group transactions by date for list ──
  const grouped = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const groups: Record<string, Transaction[]> = {};
    sorted.forEach(t => {
      const key = smartDateLabel(t.date);
      (groups[key] ||= []).push(t);
    });
    return Object.entries(groups);
  }, [transactions]);

  const budgetUsed = monthlyBudget > 0 ? Math.min(100, (expenses / monthlyBudget) * 100) : 0;
  const budgetColor =
    budgetUsed < 60 ? "#22C55E" :
    budgetUsed < 85 ? "#F59E0B" :
    budgetUsed < 100 ? "#F97316" : "#EF4444";

  const monthName = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <motion.div
      key="wallet"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">My Wallet</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Track real income & spending</p>
        </div>
        <button
          onClick={() => setShowBudgetSheet(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-violet-500 text-xs font-bold active:scale-95 transition-all"
        >
          <PencilLine size={13} />
          {monthlyBudget > 0 ? "Edit budget" : "Set budget"}
        </button>
      </div>

      {/* ── Monthly Summary (budget ring hero) ── */}
      <div className="card-base !p-5 card-glow flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{monthName}</span>
          <span className={`text-[11px] font-bold ${net >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {net >= 0 ? "+" : "−"}${Math.abs(net).toFixed(2)} net
          </span>
        </div>

        {monthlyBudget > 0 ? (
          <div className="flex justify-center py-1">
            <BudgetRing used={expenses} budget={monthlyBudget} color={budgetColor} />
          </div>
        ) : (
          <button onClick={() => setShowBudgetSheet(true)} className="flex flex-col items-center py-3">
            <span className="text-4xl font-extrabold tabular-nums tracking-tight">${expenses.toFixed(2)}</span>
            <span className="text-xs text-violet-400 font-bold mt-1.5">Set a monthly budget to track →</span>
          </button>
        )}

        {/* Income/Expense split */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-emerald-500">
              <TrendingUp size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Income</span>
            </div>
            <p className="text-lg font-extrabold mt-1 tabular-nums">${income.toFixed(2)}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-red-500">
              <TrendingDown size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Spent</span>
            </div>
            <p className="text-lg font-extrabold mt-1 tabular-nums">${expenses.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* ── Category Donut ── */}
      {byCategory.length > 0 ? (
        <div className="card-base !p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold">Spending Breakdown</h3>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {byCategory.length} {byCategory.length === 1 ? "category" : "categories"}
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Donut data={byCategory} total={expenses} />
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              {byCategory.slice(0, 5).map(c => {
                const cat = catById(c.id);
                const pct = (c.amount / expenses) * 100;
                return (
                  <div key={c.id} className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs font-semibold truncate flex-1">{cat.name}</span>
                    <span className="text-xs font-bold text-[var(--text-muted)] tabular-nums shrink-0">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Transactions ── */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-bold">Recent Activity</h3>
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            {transactions.length} total
          </span>
        </div>

        {grouped.length === 0 ? (
          <EmptyState onAdd={() => setShowSheet(true)} />
        ) : (
          <div className="flex flex-col gap-3">
            {grouped.map(([label, txs]) => (
              <div key={label} className="flex flex-col gap-1.5">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">{label}</p>
                <div className="card-base !p-2 flex flex-col">
                  {txs.map((t, i) => (
                    <TransactionRow
                      key={t.id}
                      t={t}
                      onDelete={() => onDelete(t.id)}
                      hasDivider={i < txs.length - 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Floating Add Button ── */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setShowSheet(true)}
        className="fixed bottom-28 right-5 z-[51] w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/40"
        style={{ boxShadow: "0 8px 24px rgba(124,58,237,0.4)" }}
      >
        <Plus size={26} strokeWidth={2.8} />
      </motion.button>

      {/* ── Add Sheet ── */}
      <AnimatePresence>
        {showSheet && (
          <AddSheet
            onClose={() => setShowSheet(false)}
            onSave={(t) => { onAdd(t); setShowSheet(false); }}
          />
        )}
      </AnimatePresence>

      {/* ── Budget Sheet ── */}
      <AnimatePresence>
        {showBudgetSheet && (
          <BudgetSheet
            current={monthlyBudget}
            onClose={() => setShowBudgetSheet(false)}
            onSave={(amt) => { onSetBudget(amt); setShowBudgetSheet(false); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TransactionRow
// ════════════════════════════════════════════════════════════════════════════
function TransactionRow({
  t, onDelete, hasDivider,
}: { t: Transaction; onDelete: () => void; hasDivider: boolean }) {
  const cat = catById(t.categoryId);
  const [showDelete, setShowDelete] = useState(false);
  const time = new Date(t.date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div className={`flex items-center gap-3 px-2 py-2.5 ${hasDivider ? "border-b border-[var(--border-color)]" : ""}`}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${cat.color}25` }}
      >
        <span className="text-lg">{cat.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight truncate">
          {t.note || cat.name}
        </p>
        <p className="text-[11px] text-[var(--text-muted)] truncate">
          {cat.name} · {time}
        </p>
      </div>
      <div className="flex flex-col items-end gap-0 shrink-0">
        <p
          className={`font-bold text-sm tabular-nums ${
            t.type === "income" ? "text-emerald-500" : "text-[var(--text-main)]"
          }`}
        >
          {t.type === "income" ? "+" : "−"}${t.amount.toFixed(2)}
        </p>
        <button
          onClick={() => showDelete ? onDelete() : setShowDelete(true)}
          onBlur={() => setShowDelete(false)}
          className="text-[10px] text-[var(--text-muted)] hover:text-red-500 transition-colors flex items-center gap-0.5"
        >
          {showDelete ? <><Trash2 size={9} />Confirm</> : "delete"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EmptyState
// ════════════════════════════════════════════════════════════════════════════
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card-base !p-7 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
        <WalletIcon size={28} className="text-violet-500" />
      </div>
      <div>
        <h3 className="font-bold text-base">Let's track your first transaction</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[260px]">
          Log what you spent or earned today. Tracking even small amounts is the #1 budgeting habit.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="bg-gradient-to-r from-violet-600 to-violet-500 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-violet-500/20 active:scale-95 transition-transform"
      >
        Add first transaction
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Budget ring (circular "left to spend" gauge)
// ════════════════════════════════════════════════════════════════════════════
function BudgetRing({
  used, budget, color, size = 156,
}: { used: number; budget: number; color: string; size?: number }) {
  const pct = budget > 0 ? Math.min(100, (used / budget) * 100) : 0;
  const radius = 54;
  const cx = 70, cy = 70;
  const circ = 2 * Math.PI * radius;
  const left = Math.max(0, budget - used);
  const over = used > budget;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="12" />
        <motion.circle
          cx={cx} cy={cy} r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
          {over ? "Over budget" : "Left to spend"}
        </p>
        <p className="text-[28px] font-extrabold tabular-nums leading-tight" style={{ color }}>
          {over ? "−" : ""}${over ? (used - budget).toFixed(0) : left.toFixed(0)}
        </p>
        <p className="text-[10px] text-[var(--text-muted)]">of ${budget.toFixed(0)}</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Donut chart
// ════════════════════════════════════════════════════════════════════════════
function Donut({
  data, total, size = 110,
}: { data: { id: WalletCategoryId; amount: number }[]; total: number; size?: number }) {
  const radius = 45;
  const cx = 60, cy = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative shrink-0">
      <svg width={size} height={size} viewBox="0 0 120 120">
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="14" />
        {data.map(seg => {
          const frac = seg.amount / total;
          const segLen = frac * circumference;
          const cat = catById(seg.id);
          const dashArray = `${segLen - 2} ${circumference}`;
          const el = (
            <motion.circle
              key={seg.id}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={cat.color}
              strokeWidth="14"
              strokeLinecap="butt"
              strokeDasharray={dashArray}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: dashArray }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          );
          offset += segLen;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Spent</p>
        <p className="text-lg font-extrabold tabular-nums leading-none mt-0.5">${total.toFixed(0)}</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Add Sheet — compact single-screen layout, no scroll needed
// ════════════════════════════════════════════════════════════════════════════
function AddSheet({
  onClose, onSave,
}: { onClose: () => void; onSave: (t: Omit<Transaction, "id">) => void }) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<WalletCategoryId>("food");
  const [note, setNote] = useState("");

  const categories = WALLET_CATEGORIES.filter(c => c.type === type);

  const switchType = (newType: TransactionType) => {
    setType(newType);
    const first = WALLET_CATEGORIES.find(c => c.type === newType);
    if (first) setCategoryId(first.id);
  };

  const canSave = !!amount && parseFloat(amount) > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      type,
      amount: parseFloat(amount),
      categoryId,
      note: note.trim() || undefined,
      date: new Date().toISOString(),
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative w-full max-w-sm bg-[var(--bg-card)] rounded-3xl shadow-2xl shadow-black/40 flex flex-col"
      >
        {/* Header row */}
        <div className="flex justify-between items-center px-5 pt-5 pb-3 shrink-0">
          <h3 className="font-bold text-base">Add Transaction</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[var(--bg-main)] text-[var(--text-muted)] active:scale-90 transition-transform"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form body */}
        <div className="flex flex-col gap-3 px-5 pb-1">

          {/* Type toggle — compact pill row */}
          <div className="flex p-1 bg-[var(--bg-elevated)] rounded-full shrink-0">
            {(["expense", "income"] as TransactionType[]).map(t => (
              <button
                key={t}
                onClick={() => switchType(t)}
                className={`flex-1 py-1.5 rounded-full font-bold text-xs transition-all ${
                  type === t
                    ? t === "expense"
                      ? "bg-red-500/15 text-red-500"
                      : "bg-emerald-500/15 text-emerald-500"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t === "expense" ? "💸 Expense" : "💰 Income"}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="flex items-baseline gap-1 justify-center py-1 shrink-0">
            <span className="text-xl font-extrabold text-[var(--text-muted)]">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
              className="text-4xl font-extrabold tabular-nums bg-transparent border-0 outline-none text-center w-[160px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] placeholder:opacity-30"
            />
          </div>

          {/* Category — 3-col compact grid */}
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Category</p>
            <div className="grid grid-cols-3 gap-1.5">
              {categories.slice(0, 9).map(c => {
                const active = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border transition-all ${
                      active
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-[var(--border-color)] bg-[var(--bg-main)]"
                    }`}
                    style={active ? { borderColor: c.color, backgroundColor: `${c.color}15` } : undefined}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span
                      className="text-[9px] font-bold text-center leading-tight"
                      style={active ? { color: c.color } : { color: "var(--text-muted)" }}
                    >
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div className="shrink-0">
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              maxLength={60}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] outline-none focus:border-violet-500 transition-colors text-xs text-center placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="px-5 pb-5 pt-3 shrink-0">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.97] ${
              canSave
                ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/20"
                : "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed"
            }`}
          >
            Save Transaction
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Budget Sheet
// ════════════════════════════════════════════════════════════════════════════
function BudgetSheet({
  current, onClose, onSave,
}: { current: number; onClose: () => void; onSave: (v: number) => void }) {
  const [amount, setAmount] = useState(current > 0 ? current.toString() : "");

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 240 }}
        className="relative w-full max-w-md bg-[var(--bg-card)] rounded-t-3xl px-5 py-5 flex flex-col gap-4"
      >
        <div className="flex justify-center">
          <div className="w-10 h-1 rounded-full bg-[var(--border-color)]" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Monthly Budget</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">How much do you want to spend this month?</p>
        </div>
        <div className="flex items-baseline gap-1 justify-center py-3">
          <span className="text-2xl font-extrabold text-[var(--text-muted)]">$</span>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            autoFocus
            className="text-5xl font-extrabold tabular-nums bg-transparent border-0 outline-none text-center w-[180px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] placeholder:opacity-30"
          />
        </div>
        <div className="flex gap-2">
          {[100, 250, 500, 1000].map(preset => (
            <button
              key={preset}
              onClick={() => setAmount(preset.toString())}
              className="flex-1 py-2 rounded-full bg-[var(--bg-elevated)] text-xs font-bold text-[var(--text-muted)] hover:text-violet-500 active:scale-95 transition-all"
            >
              ${preset}
            </button>
          ))}
        </div>
        <button
          onClick={() => onSave(parseFloat(amount) || 0)}
          className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/20 active:scale-95 transition-transform"
        >
          Save Budget
        </button>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Smart date labels (Today / Yesterday / Wed / May 27 / May 27 2024)
// ════════════════════════════════════════════════════════════════════════════
function smartDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - txDay.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
