export type MascotMood = "happy" | "thirsty" | "sad" | "excited" | "cool";
export type AppTheme = "light" | "dark";

// ─── League (League of Legends inspired) ──────────────────────────────────
export type LeagueTier =
  | "iron"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "emerald"
  | "diamond"
  | "master"
  | "grandmaster"
  | "challenger";

/** Divisions only apply to Iron → Diamond. Master+ have no divisions. */
export type LeagueDivision = "IV" | "III" | "II" | "I" | null;

export interface RankInfo {
  tier: LeagueTier;
  division: LeagueDivision;
  /** Points needed at the start of this rank step. */
  threshold: number;
  /** Points needed for the next rank step (null = max rank). */
  nextThreshold: number | null;
}

// ─── Quiz ──────────────────────────────────────────────────────────────────
export type QuizDifficulty = "easy" | "medium" | "hard";

export interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: QuizDifficulty;   // defaults to "medium" if absent
}

// ─── Extra daily challenges (Higher-or-Lower / Guesstimate / Myth-or-Fact) ──
export type DailyChallengeType = "higher_lower" | "guesstimate" | "myth_fact";

export interface DailyChallengeResult {
  type: DailyChallengeType;
  correct: number;       // number answered correctly
  total: number;         // total items in today's set
  lpAwarded: number;     // LP the component computed (App applies it + streak/quest)
}

// ─── Per-question mastery (LP #2 Mastery Climb) ────────────────────────────
export type MasteryLevel = 0 | 1 | 2 | 3 | 4;   // Untouched / Seen / Familiar / Proficient / Mastered

export interface QuestionMastery {
  seen: number;
  correct: number;
  level: MasteryLevel;
  lastCorrectDate: string | null;   // ISO date
  firstSeenDate: string;             // ISO date
}

// ─── Weekly Quests (LP #3) ─────────────────────────────────────────────────
export type QuestType = "quiz" | "stock_profit" | "stock_trade" | "wallet_log" | "life_year";

export interface WeeklyQuest {
  id: string;
  title: string;
  description: string;
  emoji: string;
  type: QuestType;
  target: number;
  current: number;
  reward: number;       // LP
  done: boolean;
}

// ─── Stocks ────────────────────────────────────────────────────────────────
export interface StockDef {
  id: string;
  name: string;
  ticker: string;
  basePrice: number;
  volatility: number;
  color: string;
  description: string;
}

// ─── Wallet (My Wallet) ────────────────────────────────────────────────────
export type TransactionType = "income" | "expense";

export type WalletCategoryId =
  | "food"
  | "transport"
  | "entertainment"
  | "shopping"
  | "education"
  | "subscriptions"
  | "health"
  | "gifts"
  | "savings"
  | "other"
  | "allowance"
  | "job"
  | "gifts_in"
  | "side";

export interface WalletCategory {
  id: WalletCategoryId;
  name: string;
  icon: string;         // emoji
  color: string;        // hex
  type: TransactionType;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: WalletCategoryId;
  note?: string;
  date: string;         // ISO date string
}

// ─── Avatar & Shop ─────────────────────────────────────────────────────────
export type AvatarSlot =
  | "face"        // head shape
  | "hair"
  | "brows"
  | "eyes"        // eye shape
  | "mouth"       // mouth shape
  | "hat"
  | "glasses"
  | "outfit"
  | "accessory"   // earrings, scarf, necklace
  | "background";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface ShopItem {
  id: string;
  name: string;
  slot: AvatarSlot;
  cost: number;
  description?: string;
  /** Identifier consumed by Avatar.tsx renderer; matches the variant id. */
  variant: string;
  rarity?: Rarity;
  /** Optional theme tag for filtering (e.g. "school", "sport", "fantasy") */
  theme?: string;
}

export interface AvatarState {
  skinTone: string;       // hex
  hairColor: string;      // hex
  eyeColor: string;       // hex
  equipped: Partial<Record<AvatarSlot, string>>; // slot -> shop item id
  owned: string[];        // shop item ids
}

// ─── League members (legacy mock) ─────────────────────────────────────────
export interface LeagueMember {
  id: string;
  name: string;
  avatar: string;
  weekPoints: number;
}

// ─── User State ────────────────────────────────────────────────────────────
export interface UserState {
  coins: number;
  streak: number;
  experience: number;
  lastDailyActivity: string | null;
  theme: AppTheme;
  mood: MascotMood;
  tasksDoneToday: {
    tookQuiz: boolean;
    loggedExpense: boolean;
  };

  // Stocks
  stockCash: number;
  stockHoldings: Record<string, number>;
  stockAvgBuy: Record<string, number>;
  stockPrices: Record<string, number>;
  stockHistory: Record<string, number[]>;
  lastStockUpdate: string | null;

  // Wallet (real money tracking)
  transactions: Transaction[];
  monthlyBudget: number;                            // overall monthly cap, 0 = no budget
  weeklyBudget: number;                             // weekly LP-Bonus budget cap, 0 = not set
  categoryBudgets: Partial<Record<WalletCategoryId, number>>;

  // Avatar
  avatar: AvatarState;

  // League
  leaguePoints: number;
  leagueTier: LeagueTier;
  leagueWeekPoints: number;
  leagueWeekStart: string | null;

  // ───── LP MECHANISMS ─────

  // #1 Streak Shield
  freezeUsedThisWeek: boolean;
  freezeWeekStart: string | null;

  // #2 Mastery Climb
  quizMastery: Record<string, QuestionMastery>;
  // Learn-mode daily quotas
  dailyChallengeDate: string | null;             // ISO date when last completed
  dailyChallengeQuestionId: string | null;       // pinned question for today
  practicePointsToday: number;                   // LP earned from practice today (capped)
  practiceDate: string | null;                   // ISO date of practicePointsToday counter
  // Extra once-per-day challenges (date string when last completed; null = not done today)
  higherLowerDate: string | null;
  guesstimateDate: string | null;
  mythFactDate: string | null;

  // #3 Weekly Quests
  weeklyQuests: WeeklyQuest[];
  questWeekStart: string | null;
  weeklyQuestBonusClaimed: boolean;

  // #4 Frugal Ribbons (earned across all life runs, first-time only)
  lifeRibbons: string[];
  // Per-run tracking (reset on new run)
  lifeRunState: {
    investedBefore25: boolean;
    everInDebt: boolean;
    assetClassesUsed: string[];   // "savings", "index", "crypto", "real_estate", etc.
    hasInsurance: boolean;
    cpfMaxed: boolean;
  };

  // #5 Budget Streak Bonus
  budgetStreakDays: number;                       // current consecutive on-budget days
  budgetLastCheckDate: string | null;
  budgetBossClaimedThisWeek: boolean;
}
