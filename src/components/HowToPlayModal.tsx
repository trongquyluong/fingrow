import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Gamepad2, TrendingUp, Wallet, GraduationCap, Trophy, Sparkles } from "lucide-react";

interface Props {
  onClose: () => void;
}

const SECTIONS = [
  {
    id: "life",
    icon: <Gamepad2 size={18} />,
    label: "Life Sim",
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
    border: "border-brand-purple/30",
    content: [
      {
        title: "🌱 How to Play",
        body: "You start at age 8 and make financial and life decisions each year until retirement at 65. Every year you'll face a scenario with 3 choices — pick wisely!",
      },
      {
        title: "📊 Your Stats",
        body: "Track 3 vital stats: Happiness 😊, Health 💪, and Intelligence 🧠. Each starts between 50–75. Any stat dropping to 20 or below ends the game.",
      },
      {
        title: "💰 Wealth Goal",
        body: "Accumulate $200,000+ in total wealth (savings + investments) by age 65 to win. Invest wisely, take the right jobs, and avoid lifestyle creep.",
      },
      {
        title: "🎯 Special Minigames",
        body: "At age 23, calculate your tax take-home pay. At 30, allocate your investments. At 26, 35, and 50, balance your monthly budget. These are skill challenges — get them right for bonuses!",
      },
      {
        title: "👴 Senior Life",
        body: "From age 58+, face elderly-specific decisions: retirement villages, Social Security timing, downsizing your home, and grandchildren's education. These can make or break your retirement.",
      },
    ],
  },
  {
    id: "stocks",
    icon: <TrendingUp size={18} />,
    label: "Stocks",
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
    border: "border-brand-blue/30",
    content: [
      {
        title: "📈 The Basics",
        body: "Buy shares of companies at their current price. Prices update daily. Your goal: buy low, sell high. Start with $1,000 in your investment wallet.",
      },
      {
        title: "🛒 Buying Shares",
        body: "Tap any stock to open its detail view. Choose how many shares to buy. Your average buy price is tracked so you can see profit/loss at a glance.",
      },
      {
        title: "💸 Selling",
        body: "Sell any shares you own from the stock detail view. Profits from selling earn you League Points — the more profit, the more points!",
      },
      {
        title: "⚡ Volatility",
        body: "Each stock has a volatility rating. High-volatility stocks can move 10%+ in a day — big rewards, big risks. Low-volatility stocks are safer but grow slower.",
      },
      {
        title: "🧠 Pro Tips",
        body: "Diversify across sectors (tech, food, sports, etc.). Don't put all your money in one stock. Check back daily as prices change every day.",
      },
    ],
  },
  {
    id: "wallet",
    icon: <Wallet size={18} />,
    label: "Wallet",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    content: [
      {
        title: "💸 Track Real Money",
        body: "Log your actual income and expenses to see where your money goes. Allowance, part-time job, snacks, transport — every dollar tells a story.",
      },
      {
        title: "🎯 Set a Monthly Budget",
        body: "Tap 'Set budget' to define how much you want to spend each month. The progress bar shows how much is left and changes color as you approach your limit.",
      },
      {
        title: "📊 Spending Breakdown",
        body: "The donut chart reveals which categories eat up most of your money. Patterns you didn't notice — like $80/month on bubble tea — suddenly become obvious.",
      },
      {
        title: "✨ Daily Habit",
        body: "Log at least one transaction per day to earn 5 League Points + 10 XP. Logging is the single best habit for staying on top of your finances.",
      },
      {
        title: "🔒 Private & Local",
        body: "Your transactions are stored on your device only — no bank linking, no data sharing. This is your private financial training ground.",
      },
    ],
  },
  {
    id: "shop",
    icon: <Sparkles size={18} />,
    label: "Shop",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    content: [
      {
        title: "🎨 Customize Your Character",
        body: "Tap your character on the Home tab (or 'Customize') to enter the Shop. Spend coins to unlock hairstyles, hats, glasses, outfits, and backgrounds.",
      },
      {
        title: "💰 Earn → Spend → Show Off",
        body: "Every quiz answered, every smart trade, every logged expense earns coins. Use them to express yourself — from baseball caps to royal crowns.",
      },
      {
        title: "👕 Mix & Match",
        body: "Each slot (hair, hat, glasses, outfit, background) is independent. Try combos to find your signature look. Owned items can be re-equipped any time.",
      },
      {
        title: "🌟 Rare Items",
        body: "Premium pieces like the Royal Crown (1,500 coins) or VR Headset (800 coins) take effort to earn. They're badges of your financial discipline.",
      },
    ],
  },
  {
    id: "quiz",
    icon: <GraduationCap size={18} />,
    label: "Daily Quiz",
    color: "text-brand-coral",
    bg: "bg-brand-coral/10",
    border: "border-brand-coral/30",
    content: [
      {
        title: "🎓 Daily Flashcard",
        body: "One financial literacy question per day. Topics include budgeting, investing, taxes, compound interest, and more.",
      },
      {
        title: "💰 Rewards",
        body: "Get the question right and earn +200 coins and +50 League Points. Get it wrong and you still learn — plus you can try again tomorrow.",
      },
      {
        title: "🔥 Streaks",
        body: "Complete daily activities to maintain your streak. Miss a day and your streak resets. Streaks don't currently add bonuses but show your consistency.",
      },
      {
        title: "🌱 XP & Tree",
        body: "Coins and XP go toward your Money Tree on the Home tab. The tree grows through 4 stages as you earn more XP from all activities.",
      },
    ],
  },
  {
    id: "league",
    icon: <Trophy size={18} />,
    label: "League",
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-900/30",
    content: [
      {
        title: "🏆 League Tiers",
        body: "Earn League Points from all activities: quizzes, stock profits, and budget advances. Points unlock tiers: Bronze → Silver → Gold → Platinum → Diamond.",
      },
      {
        title: "📅 Weekly Reset",
        body: "Weekly Points reset every Monday. Compete against other players for the top of the weekly leaderboard. Your total League Points don't reset.",
      },
      {
        title: "💎 Earning Points",
        body: "Daily Quiz correct: +50 pts. Stock profits: +1 pt per $1 profit. Log a transaction in My Wallet: +5 pts (once per day).",
      },
      {
        title: "👤 Your Account",
        body: "Create an account (tap the profile icon in the header) to set your username and avatar. Your name appears on the leaderboard so others can see your rank.",
      },
      {
        title: "🥇 Tiers & Thresholds",
        body: "Bronze: 0+  •  Silver: 500+  •  Gold: 1,500+  •  Platinum: 3,000+  •  Diamond: 6,000+",
      },
    ],
  },
];

export default function HowToPlayModal({ onClose }: Props) {
  const [activeSection, setActiveSection] = useState("life");
  const section = SECTIONS.find(s => s.id === activeSection)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[85vh] bg-[var(--bg-card)] rounded-t-3xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-[var(--border-color)]">
          <div>
            <h2 className="font-black text-lg">How to Play</h2>
            <p className="text-xs text-[var(--text-muted)]">Your guide to Fingrow</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-brand-coral transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-[var(--border-color)]">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs whitespace-nowrap transition-all border ${
                activeSection === s.id
                  ? `${s.bg} ${s.color} ${s.border}`
                  : "bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)]"
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <AnimatePresence>
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4 pb-6"
            >
              {section.content.map((item, i) => (
                <div key={i} className={`p-4 rounded-2xl ${section.bg} border ${section.border}`}>
                  <p className={`font-black text-sm mb-1 ${section.color}`}>{item.title}</p>
                  <p className="text-sm text-[var(--text-main)] leading-relaxed">{item.body}</p>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
