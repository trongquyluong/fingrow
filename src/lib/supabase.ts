/**
 * Supabase client + leaderboard helpers.
 *
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.
 * If unset, the helpers return mock data so the app keeps working in dev.
 *
 * SQL schema lives in /supabase/schema.sql — run it once in the Supabase
 * dashboard SQL editor to create the table and Row Level Security policies.
 */

/// <reference types="vite/client" />
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

export const SUPABASE_ENABLED = Boolean(URL && KEY);

let _client: SupabaseClient | null = null;
export function supabase(): SupabaseClient | null {
  if (!SUPABASE_ENABLED) return null;
  if (!_client) _client = createClient(URL!, KEY!);
  return _client;
}

// ─── Types ─────────────────────────────────────────────────────────────────
export interface LeaderboardRow {
  user_id: string;
  username: string;       // primary key — same account on any device updates one row
  avatar: string;          // emoji
  total_points: number;
  week_points: number;
  tier: string;
  week_start: string;
  updated_at: string;
}

// ─── Local user-id (anonymous) ────────────────────────────────────────────
const UID_KEY = "fingrow_uid";
export function getOrCreateUserId(): string {
  let uid = localStorage.getItem(UID_KEY);
  if (!uid) {
    uid = "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(UID_KEY, uid);
  }
  return uid;
}

// ─── Sync user score to the leaderboard ───────────────────────────────────
// Keyed by username (not user_id) so the same account on multiple devices
// updates one row rather than spawning duplicates. user_id is kept for
// backwards compatibility and as a fallback uniqueness constraint.
export async function syncScore(payload: {
  username: string;
  avatar: string;
  totalPoints: number;
  weekPoints: number;
  tier: string;
  weekStart: string;
}): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  const userId = getOrCreateUserId();
  const { error } = await sb.from("leaderboard").upsert(
    {
      user_id: userId,
      username: payload.username,
      avatar: payload.avatar,
      total_points: payload.totalPoints,
      week_points: payload.weekPoints,
      tier: payload.tier,
      week_start: payload.weekStart,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "username" }
  );
  if (error) console.error("syncScore", error);
}

// ─── Fetch weekly leaderboard ──────────────────────────────────────────────
export async function fetchWeeklyLeaderboard(weekStart: string, limit = 20): Promise<LeaderboardRow[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("leaderboard")
    .select("*")
    .or(`week_start.eq.${weekStart},updated_at.gte.${new Date(Date.now() - 14 * 86400_000).toISOString()}`)
    .order("week_points", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("fetchWeeklyLeaderboard", error);
    return [];
  }
  // Filter out guests (no registered account) so only students appear on the leaderboard.
  const { data: acctData } = await sb
    .from("accounts")
    .select("username");
  const registered = new Set((acctData ?? []).map((a: AccountRow) => a.username.toLowerCase()));
  return ((data ?? []) as LeaderboardRow[]).filter(r => registered.has(r.username.toLowerCase()));
}

// ─── Accounts (cross-device login) ─────────────────────────────────────────
// Stored in the `accounts` table so a student can log in from any device.
// Password is SHA-256 hashed in the browser (AccountModal) before it ever
// reaches here — the plaintext never leaves the device.
export interface AccountRow {
  username: string;          // lowercased — primary key
  username_display: string;  // original casing for display
  password_hash: string;
  avatar: string;
  full_name: string | null;
  email: string | null;
  school: string | null;
  age: number | null;
  joined_at: string;
}

/** Look up an account by username. Returns null if Supabase is off, not found, or on error. */
export async function fetchAccount(username: string): Promise<AccountRow | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("accounts")
    .select("*")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();
  if (error) { console.warn("fetchAccount", error.message); return null; }
  return (data as AccountRow) ?? null;
}

/**
 * Insert a new account.
 * Returns { ok:true } on success, { ok:false, reason:"taken" } on a unique
 * violation, or { ok:false, reason:"unavailable" } when Supabase/table is
 * missing or unreachable (caller should fall back to local-only).
 */
export async function registerAccount(
  row: AccountRow
): Promise<{ ok: boolean; reason?: "taken" | "unavailable" }> {
  const sb = supabase();
  if (!sb) return { ok: false, reason: "unavailable" };
  const { error } = await sb.from("accounts").insert(row);
  if (!error) return { ok: true };
  if ((error as any).code === "23505") return { ok: false, reason: "taken" };
  console.warn("registerAccount", error.message);
  return { ok: false, reason: "unavailable" };
}

/** Create-or-update an account row (used for profile edits and backfilling local accounts). */
export async function upsertAccount(row: AccountRow): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  const { error } = await sb.from("accounts").upsert(row, { onConflict: "username" });
  if (error) console.warn("upsertAccount", error.message);
}

// ─── Admin / Research ──────────────────────────────────────────────────────
// Designated admin usernames (lowercased). The admin is hidden from the
// leaderboard, never syncs student progress, and unlocks the research
// dashboard. NOTE: this gate is client-side only (see admin.sql security note).
export const ADMIN_USERNAMES = ["fingrow_admin"];
export function isAdminUsername(username: string | null | undefined): boolean {
  return !!username && ADMIN_USERNAMES.includes(username.trim().toLowerCase());
}

// Deep per-student breakdown stored in student_progress.details (jsonb).
export interface ProgressDetails {
  masteryDistribution: number[];                              // counts at level 0..4 among attempted questions
  topicAccuracy: { topic: string; seen: number; correct: number }[];
  practicePointsToday: number;
  budgetStreakDays: number;
  weeklyQuestsDone: number;
  weeklyQuestsTotal: number;
  dailyChallengeDate: string | null;
  higherLowerDate: string | null;
  guesstimateDate: string | null;
  mythFactDate: string | null;
  walletIncome: number;
  walletExpense: number;
  topCategories: { categoryId: string; total: number; count: number }[];
  // ─── Research extensions (optional so old rows hydrate) ───
  scamSpotterScore?: number;
  scamSpotterPlayed?: number;
  scamSpotterRounds?: number;
  baoTycoonProfit?: number;
  baoTycoonDays?: number;
  baoTycoonRounds?: number;
  lifeRibbonsList?: string[];
  lifeRunState?: {
    investedBefore25?: boolean;
    everInDebt?: boolean;
    assetClassesUsed?: string[];
    hasInsurance?: boolean;
    cpfMaxed?: boolean;
  };
  stockPortfolioValue?: number;
  stockNetPnL?: number;
  stockCash?: number;
  monthlyBudget?: number;
  weeklyBudget?: number;
  categoryBudgets?: Record<string, number>;
  coins?: number;
  firstActiveDate?: string | null;
  daysActive?: number;
  perTopicEarly?: Record<string, { seen: number; correct: number }>;
  perTopicRecent?: Record<string, { seen: number; correct: number }>;
}

export interface StudentProgressRow {
  username: string;            // lowercased — primary key; matches accounts.username
  username_display: string;
  full_name: string | null;
  school: string | null;
  age: number | null;
  avatar: string;
  email: string | null;       // fetched from accounts; never overwritten by student heartbeats
  joined_at: string | null;   // fetched from accounts
  level: number;
  xp: number;
  league_points: number;
  league_tier: string;
  league_week_points: number;
  streak: number;
  questions_seen: number;
  questions_correct: number;
  accuracy: number;            // 0..1
  mastered_count: number;
  daily_done_today: number;    // 0..4
  transactions_count: number;
  ribbons_count: number;
  last_active: string | null;
  details: ProgressDetails | null;
  updated_at?: string;
}

// ─── Password hashing (shared) ─────────────────────────────────────────────
// SHA-256 hex of the UTF-8 plaintext — identical to AccountModal's hashPassword,
// so admin-set passwords verify against the same login path.
export async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Account-bound progress (cloud save / restore) ─────────────────────────
export interface AccountStateRow {
  username: string;
  state: unknown;          // full UserState blob
  updated_at: string;
}

/** Save a student's full game state to their account. No-op if Supabase is off. */
export async function saveAccountState(username: string, state: unknown): Promise<string | null> {
  const sb = supabase();
  if (!sb) return null;
  const updated_at = new Date().toISOString();
  const { error } = await sb
    .from("account_state")
    .upsert({ username: username.trim().toLowerCase(), state, updated_at }, { onConflict: "username" });
  if (error) { console.warn("saveAccountState", error.message); return null; }
  return updated_at;   // caller stores this as the local sync marker
}

/** Fetch a student's saved game state. Returns null if absent/off/error. */
export async function fetchAccountState(username: string): Promise<{ state: unknown; updated_at: string } | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("account_state")
    .select("state, updated_at")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();
  if (error) { console.warn("fetchAccountState", error.message); return null; }
  return data ? { state: (data as AccountStateRow).state, updated_at: (data as AccountStateRow).updated_at } : null;
}

// ─── Admin: account management ─────────────────────────────────────────────
/** Every account (admin console roster). Highest level of trust — admins only. */
export async function fetchAccounts(): Promise<AccountRow[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb.from("accounts").select("*").order("joined_at", { ascending: true });
  if (error) { console.warn("fetchAccounts", error.message); return []; }
  return (data ?? []) as AccountRow[];
}

export type AccountEditFields = Partial<Pick<AccountRow,
  "username_display" | "avatar" | "full_name" | "email" | "school" | "age">>;

/** Update a student's profile fields (not the login key or password). */
export async function adminUpdateAccount(username: string, fields: AccountEditFields): Promise<boolean> {
  const sb = supabase();
  if (!sb) return false;
  const key = username.trim().toLowerCase();
  const { error } = await sb.from("accounts")
    .update({ ...fields, updated_at: new Date().toISOString() }).eq("username", key);
  if (error) { console.warn("adminUpdateAccount", error.message); return false; }
  // keep the analytics row's display fields in sync (best effort)
  await sb.from("student_progress").update({
    ...(fields.username_display ? { username_display: fields.username_display } : {}),
    ...(fields.full_name !== undefined ? { full_name: fields.full_name } : {}),
    ...(fields.school !== undefined ? { school: fields.school } : {}),
    ...(fields.age !== undefined ? { age: fields.age } : {}),
    ...(fields.avatar ? { avatar: fields.avatar } : {}),
  }).eq("username", key);
  return true;
}

/** Reset a student's password to `newPlain`. */
export async function adminSetPassword(username: string, newPlain: string): Promise<boolean> {
  const sb = supabase();
  if (!sb) return false;
  const password_hash = await sha256Hex(newPlain);
  const { error } = await sb.from("accounts")
    .update({ password_hash, updated_at: new Date().toISOString() })
    .eq("username", username.trim().toLowerCase());
  if (error) { console.warn("adminSetPassword", error.message); return false; }
  return true;
}

/**
 * Rename a login username (the primary key). Updates accounts + the cloud-state
 * and analytics rows. Note: a student's locally-cached login on their own device
 * is not reachable — they'll use the new username on their next login.
 */
export async function adminRenameAccount(
  oldUsername: string, newUsernameRaw: string, newDisplay: string,
): Promise<{ ok: boolean; reason?: "taken" | "unavailable" | "invalid" }> {
  const sb = supabase();
  if (!sb) return { ok: false, reason: "unavailable" };
  const oldKey = oldUsername.trim().toLowerCase();
  const newKey = newUsernameRaw.trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,}$/.test(newKey)) return { ok: false, reason: "invalid" };
  if (newKey !== oldKey) {
    const clash = await fetchAccount(newKey);
    if (clash) return { ok: false, reason: "taken" };
  }
  const now = new Date().toISOString();
  const { error } = await sb.from("accounts")
    .update({ username: newKey, username_display: newDisplay, updated_at: now }).eq("username", oldKey);
  if (error) { console.warn("adminRenameAccount", error.message); return { ok: false, reason: "unavailable" }; }
  // Move related rows (best effort).
  await sb.from("account_state").update({ username: newKey }).eq("username", oldKey);
  await sb.from("student_progress").update({ username: newKey, username_display: newDisplay }).eq("username", oldKey);
  return { ok: true };
}

/**
 * Permanently delete an account and its data. Requires the (opt-in) DELETE
 * policies from account_data.sql; without them this returns ok:false.
 */
export async function adminDeleteAccount(
  username: string, displayName?: string,
): Promise<{ ok: boolean; reason?: "forbidden" | "unavailable" }> {
  const sb = supabase();
  if (!sb) return { ok: false, reason: "unavailable" };
  const key = username.trim().toLowerCase();
  await sb.from("account_state").delete().eq("username", key);
  await sb.from("student_progress").delete().eq("username", key);
  if (displayName) await sb.from("leaderboard").delete().eq("username", displayName);
  const { error } = await sb.from("accounts").delete().eq("username", key);
  if (error) {
    console.warn("adminDeleteAccount", error.message);
    return { ok: false, reason: error.code === "42501" ? "forbidden" : "unavailable" };
  }
  return { ok: true };
}

/** Push a student's learning-analytics snapshot. No-op if Supabase is off. */
export async function syncProgress(row: StudentProgressRow): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  const { error } = await sb
    .from("student_progress")
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "username" });
  if (error) console.warn("syncProgress", error.message);
}

// ─── Weekly research history ──────────────────────────────────────────────
// One row per (username, week_key). Latest in-week state wins on upsert.
// Drives longitudinal trends, retention, and pre/post literacy comparisons.
export interface StudentProgressHistoryRow {
  username: string;
  week_key: string;            // monday.toDateString() from App.tsx
  recorded_at: string;
  accuracy: number;
  mastered_count: number;
  questions_seen: number;
  questions_correct: number;
  league_points: number;
  streak: number;
  daily_done_today: number;
  transactions_count: number;
  ribbons_count: number;
  details: ProgressDetails | null;
}

export async function syncProgressHistory(
  row: Omit<StudentProgressHistoryRow, "recorded_at">,
): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  const { error } = await sb
    .from("student_progress_history")
    .upsert(
      { ...row, recorded_at: new Date().toISOString() },
      { onConflict: "username,week_key" },
    );
  if (error) console.warn("syncProgressHistory", error.message);
}

export async function fetchAllHistory(): Promise<StudentProgressHistoryRow[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("student_progress_history")
    .select("*")
    .order("week_key", { ascending: true });
  if (error) { console.warn("fetchAllHistory", error.message); return []; }
  return (data ?? []) as StudentProgressHistoryRow[];
}

/** Fetch every student's progress (admin/research view), highest LP first.
 *  Profile fields (username_display, full_name, school, age, avatar, email) are
 *  always read from accounts so admin edits are reflected immediately. */
export async function fetchAllProgress(): Promise<StudentProgressRow[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("student_progress")
    .select("*, accounts(username_display, full_name, school, age, avatar, email, joined_at)")
    .order("league_points", { ascending: false });
  if (error) { console.warn("fetchAllProgress", error.message); return []; }
  // Flatten the joined accounts row onto student_progress so callers get a single object.
  return (data ?? []).map(row => ({
    ...row,
    username_display: (row.accounts as Record<string, unknown> | null)?.username_display as string ?? row.username,
    full_name:       (row.accounts as Record<string, unknown> | null)?.full_name       as string | null,
    school:          (row.accounts as Record<string, unknown> | null)?.school          as string | null,
    age:             (row.accounts as Record<string, unknown> | null)?.age             as number | null,
    avatar:          (row.accounts as Record<string, unknown> | null)?.avatar          as string ?? "🦁",
    email:           (row.accounts as Record<string, unknown> | null)?.email          as string | null,
    joined_at:       (row.accounts as Record<string, unknown> | null)?.joined_at       as string | null,
  })) as StudentProgressRow[];
}

// ─── Fetch all-time leaderboard (alternative view) ────────────────────────
export async function fetchAllTimeLeaderboard(limit = 20): Promise<LeaderboardRow[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("fetchAllTimeLeaderboard", error);
    return [];
  }
  // Filter out guests (no registered account) so only students appear.
  const { data: acctData } = await sb
    .from("accounts")
    .select("username");
  const registered = new Set((acctData ?? []).map((a: AccountRow) => a.username.toLowerCase()));
  return ((data ?? []) as LeaderboardRow[]).filter(r => registered.has(r.username.toLowerCase()));
}
