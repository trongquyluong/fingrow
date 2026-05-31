/**
 * AccountModal.tsx — Full sign-up / sign-in / profile flow.
 *
 * Three views:
 *   • "welcome"  — first-time user, choose Sign Up or Log In
 *   • "signup"   — collect full student info (username, password, name, school, JC year, age)
 *   • "login"    — re-enter username + password to restore session on another device
 *   • "profile"  — logged-in user; edit non-credential fields
 *
 * Password is SHA-256 hashed via the Web Crypto API and stored on this device.
 * The hash never leaves the browser. The leaderboard sync only sends username + avatar.
 *
 * Registered accounts are stored in localStorage under key "fingrow_users"
 * as a map { [username]: AccountRecord } — this lets the same browser host
 * multiple students (e.g. a shared school iPad).
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, CheckCircle2, UserCircle2, Eye, EyeOff,
  ChevronLeft, School, Cake, Mail, LogOut, Lock, User,
} from "lucide-react";
import {
  SUPABASE_ENABLED, fetchAccount, registerAccount, upsertAccount, AccountRow,
} from "../lib/supabase";

export interface AccountData {
  username: string;
  avatar: string;
  joinedAt: string;
  fullName?: string;
  email?: string;
  school?: string;
  jcYear?: "JC1" | "JC2" | "Other";
  age?: number;
}

interface AccountRecord extends AccountData {
  passwordHash: string;
}

const USERS_KEY = "fingrow_users";

const AVATAR_OPTIONS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐺",
  "🦅", "🦉", "🐬", "🦋", "🌟", "🔥",
  "💎", "🚀", "🎯", "🏆", "🐉", "🦄",
];

// ── Password helpers ──────────────────────────────────────────────────────
async function hashPassword(pw: string): Promise<string> {
  const buf = new TextEncoder().encode(pw);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function loadUsers(): Record<string, AccountRecord> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, AccountRecord>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── Map between local records and Supabase rows ────────────────────────────
function rowToPublic(r: AccountRow): AccountData {
  return {
    username: r.username_display,
    avatar: r.avatar,
    joinedAt: r.joined_at,
    fullName: r.full_name ?? undefined,
    email: r.email ?? undefined,
    school: r.school ?? undefined,
    age: r.age ?? undefined,
  };
}

function recordToRow(rec: AccountRecord): AccountRow {
  return {
    username: rec.username.toLowerCase(),
    username_display: rec.username,
    password_hash: rec.passwordHash,
    avatar: rec.avatar,
    full_name: rec.fullName ?? null,
    email: rec.email ?? null,
    school: rec.school ?? null,
    age: rec.age ?? null,
    joined_at: rec.joinedAt,
  };
}

// ──────────────────────────────────────────────────────────────────────────
type View = "welcome" | "signup" | "login" | "profile";

interface Props {
  account: AccountData | null;
  onSave: (data: AccountData | null) => void;
  onClose: () => void;
  /** Optional starting view (used by onboarding to jump straight to signup/login). */
  initialView?: View;
}

export default function AccountModal({ account, onSave, onClose, initialView }: Props) {
  const [view, setView] = useState<View>(account ? "profile" : (initialView ?? "welcome"));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Auto-clear errors when the user changes view
  useEffect(() => { setError(null); }, [view]);

  // ── form state ──
  const [username, setUsername]   = useState(account?.username ?? "");
  const [password, setPassword]   = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [fullName, setFullName]   = useState(account?.fullName ?? "");
  const [email, setEmail]         = useState(account?.email ?? "");
  const [school, setSchool]       = useState(account?.school ?? "");
  const [age, setAge]             = useState<number>(account?.age ?? 17);
  const [avatar, setAvatar]       = useState(account?.avatar ?? "🦁");

  // ── handlers ──
  const handleSignUp = async () => {
    setError(null);
    if (!username.trim() || username.length < 3) {
      return setError("Username must be at least 3 characters.");
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return setError("Username can only contain letters, numbers, _ and -.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (password !== password2) {
      return setError("Passwords don't match.");
    }
    if (!school.trim()) {
      return setError("Please enter your school.");
    }

    setBusy(true);
    const users = loadUsers();
    const key = username.trim().toLowerCase();

    const record: AccountRecord = {
      username: username.trim(),
      avatar,
      joinedAt: new Date().toISOString(),
      fullName: fullName.trim() || undefined,
      email: email.trim() || undefined,
      school: school.trim(),
      age,
      passwordHash: await hashPassword(password),
    };

    // Cross-device: register in the DB first. If it's taken globally, block.
    // If the DB is unavailable (not set up / offline), fall back to local-only.
    let dbHandled = false;
    if (SUPABASE_ENABLED) {
      const res = await registerAccount(recordToRow(record));
      if (res.ok) dbHandled = true;
      else if (res.reason === "taken") { setBusy(false); return setError("That username is already taken."); }
    }
    if (!dbHandled && users[key]) {
      setBusy(false);
      return setError("That username is already taken on this device.");
    }

    users[key] = record;
    saveUsers(users);

    const { passwordHash, ...publicData } = record;
    onSave(publicData);
    setBusy(false);
    setSaved(true);
    setTimeout(onClose, 900);
  };

  const handleLogin = async () => {
    setError(null);
    setBusy(true);
    const users = loadUsers();
    const key = username.trim().toLowerCase();
    const hash = await hashPassword(password);

    // 1) Try the cross-device DB so login works from any browser.
    if (SUPABASE_ENABLED) {
      const remote = await fetchAccount(key);
      if (remote) {
        if (remote.password_hash !== hash) { setBusy(false); return setError("Incorrect password."); }
        const publicData = rowToPublic(remote);
        users[key] = { ...publicData, passwordHash: hash };  // cache for offline use
        saveUsers(users);
        onSave(publicData);
        setBusy(false); setSaved(true); setTimeout(onClose, 900);
        return;
      }
    }

    // 2) Fall back to a local account stored on this device.
    const rec = users[key];
    if (!rec) { setBusy(false); return setError("No account found with that username."); }
    if (hash !== rec.passwordHash) { setBusy(false); return setError("Incorrect password."); }

    // Backfill to the DB so this account becomes available on other devices.
    if (SUPABASE_ENABLED) upsertAccount(recordToRow(rec));

    const { passwordHash, ...publicData } = rec;
    onSave(publicData);
    setBusy(false); setSaved(true); setTimeout(onClose, 900);
  };

  const handleUpdateProfile = () => {
    if (!account) return;
    const users = loadUsers();
    const key = account.username.toLowerCase();
    // Fall back to the logged-in account if no local record exists (e.g. logged in via DB on a fresh device)
    const base: AccountRecord = users[key] ?? { ...account, passwordHash: "" };
    const updated: AccountRecord = {
      ...base,
      avatar,
      fullName: fullName.trim() || undefined,
      email: email.trim() || undefined,
      school: school.trim(),
      age,
    };
    users[key] = updated;
    saveUsers(users);
    // Sync the edit to the DB (only if we have the password hash to keep the row valid)
    if (SUPABASE_ENABLED && updated.passwordHash) upsertAccount(recordToRow(updated));
    const { passwordHash, ...publicData } = updated;
    onSave(publicData);
    setSaved(true);
    setTimeout(onClose, 900);
  };

  const handleLogout = () => {
    onSave(null);
    setTimeout(onClose, 100);
  };

  // ──────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 40 }}
        animate={{ y: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[92vh] bg-[var(--bg-card)] rounded-t-3xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            {view !== "welcome" && view !== "profile" && (
              <button onClick={() => setView("welcome")} className="p-1 -ml-1 text-[var(--text-muted)] hover:text-violet-500">
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="font-black text-lg">
                {view === "welcome" && "Join Fingrow"}
                {view === "signup"  && "Create Account"}
                {view === "login"   && "Log In"}
                {view === "profile" && "Your Profile"}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {view === "welcome" && "Compete with classmates"}
                {view === "signup"  && "Set up your student profile"}
                {view === "login"   && "Restore your account"}
                {view === "profile" && "Edit your student info"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* ───── WELCOME ───── */}
          {view === "welcome" && (
            <div className="flex flex-col gap-4">
              <div className="bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-2xl p-5 text-center">
                <div className="text-4xl mb-2">🎓</div>
                <p className="font-black text-base mb-1">Compete with your school</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Sign up to climb the leaderboard, sync your score across devices, and prove you're the top financial mind in your JC.
                </p>
              </div>

              <button
                onClick={() => setView("signup")}
                className="w-full py-4 rounded-2xl font-black text-white shadow-lg shadow-violet-500/20 bg-gradient-to-r from-violet-600 to-violet-500 active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <UserCircle2 size={18} /> Create New Account
              </button>
              <button
                onClick={() => setView("login")}
                className="w-full py-4 rounded-2xl font-black bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Lock size={16} /> Log In to Existing
              </button>

              <p className="text-[10px] text-center text-[var(--text-muted)] leading-relaxed mt-2">
                Accounts are stored on this device. Your password is hashed (SHA-256) and never leaves your browser.
              </p>
            </div>
          )}

          {/* ───── SIGN UP ───── */}
          {view === "signup" && (
            <div className="flex flex-col gap-4">
              {/* Avatar */}
              <Section icon={<UserCircle2 size={14} />} title="Pick an avatar">
                <div className="grid grid-cols-9 gap-1.5">
                  {AVATAR_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                        avatar === emoji
                          ? "bg-violet-500/20 border-2 border-violet-500 scale-110"
                          : "bg-[var(--bg-main)] border border-[var(--border-color)]"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Credentials */}
              <Section icon={<Lock size={14} />} title="Login credentials">
                <Field label="Username" required>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value.slice(0, 20))}
                    placeholder="WealthWizard99"
                    maxLength={20}
                    className="input-style"
                  />
                </Field>
                <Field label="Password" required>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="input-style pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm password" required>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password2}
                    onChange={e => setPassword2(e.target.value)}
                    placeholder="Re-enter your password"
                    className="input-style"
                  />
                </Field>
              </Section>

              {/* Student info */}
              <Section icon={<School size={14} />} title="Student info">
                <Field label="Full name (optional)">
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value.slice(0, 40))}
                    placeholder="e.g. Tan Wei Ming"
                    className="input-style"
                  />
                </Field>
                <Field label="Email (optional)">
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@school.edu.sg"
                      className="input-style pl-10"
                    />
                  </div>
                </Field>
                <Field label="School" required>
                  <input
                    value={school}
                    onChange={e => setSchool(e.target.value.slice(0, 40))}
                    placeholder="e.g. National JC"
                    className="input-style"
                  />
                </Field>
                <Field label="Age">
                  <div className="relative">
                    <Cake size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10" />
                    <select
                      value={age}
                      onChange={e => setAge(Number(e.target.value))}
                      className="input-style pl-10 appearance-none"
                    >
                      {[15,16,17,18,19,20,21].map(n => (
                        <option key={n} value={n}>{n} years</option>
                      ))}
                    </select>
                  </div>
                </Field>
              </Section>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <SubmitButton
                label={busy ? "Creating…" : "Create Account"}
                disabled={busy || !username.trim() || !password || !password2 || !school.trim()}
                saved={saved}
                onClick={handleSignUp}
              />
            </div>
          )}

          {/* ───── LOGIN ───── */}
          {view === "login" && (
            <div className="flex flex-col gap-4">
              <Section icon={<User size={14} />} title="Welcome back">
                <Field label="Username" required>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value.slice(0, 20))}
                    placeholder="Your username"
                    className="input-style"
                  />
                </Field>
                <Field label="Password" required>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="input-style pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>
              </Section>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <SubmitButton
                label={busy ? "Logging in…" : "Log In"}
                disabled={busy || !username.trim() || !password}
                saved={saved}
                onClick={handleLogin}
              />
              <p className="text-[10px] text-center text-[var(--text-muted)]">
                Don't have an account?{" "}
                <button onClick={() => setView("signup")} className="text-violet-500 font-bold">Create one</button>
              </p>
            </div>
          )}

          {/* ───── PROFILE ───── */}
          {view === "profile" && account && (
            <div className="flex flex-col gap-4">
              {/* Profile card */}
              <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center gap-3">
                <span className="text-4xl">{account.avatar}</span>
                <div className="flex-1">
                  <p className="font-black text-base">{account.username}</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
                    Joined {new Date(account.joinedAt).toLocaleDateString("en-SG", { month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Avatar picker */}
              <Section icon={<UserCircle2 size={14} />} title="Avatar">
                <div className="grid grid-cols-9 gap-1.5">
                  {AVATAR_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                        avatar === emoji
                          ? "bg-violet-500/20 border-2 border-violet-500 scale-110"
                          : "bg-[var(--bg-main)] border border-[var(--border-color)]"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </Section>

              <Section icon={<School size={14} />} title="Student info">
                <Field label="Full name">
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value.slice(0, 40))}
                    placeholder="e.g. Tan Wei Ming"
                    className="input-style"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@school.edu.sg"
                    className="input-style"
                  />
                </Field>
                <Field label="School">
                  <input
                    value={school}
                    onChange={e => setSchool(e.target.value.slice(0, 40))}
                    placeholder="e.g. National JC"
                    className="input-style"
                  />
                </Field>
                <Field label="Age">
                  <div className="relative">
                    <Cake size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10" />
                    <select
                      value={age}
                      onChange={e => setAge(Number(e.target.value))}
                      className="input-style pl-10 appearance-none"
                    >
                      {[15,16,17,18,19,20,21].map(n => (
                        <option key={n} value={n}>{n} years</option>
                      ))}
                    </select>
                  </div>
                </Field>
              </Section>

              <SubmitButton
                label="Save Changes"
                disabled={false}
                saved={saved}
                onClick={handleUpdateProfile}
              />

              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <style>{`
        .input-style {
          width: 100%;
          padding-top: 12px;
          padding-bottom: 12px;
          padding-left: 14px;
          padding-right: 14px;
          border-radius: 14px;
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          font-weight: 600;
          font-size: 13px;
          color: var(--text-main);
          outline: none;
          transition: border-color .15s ease;
        }
        .input-style:focus {
          border-color: #A855F7;
        }
        .input-style::placeholder { color: #94A3B8; }
      `}</style>
    </div>
  );
}

// ── small sub-components ─────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5">
        <span className="text-violet-500">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{title}</span>
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function SubmitButton({ label, disabled, saved, onClick }: { label: string; disabled: boolean; saved: boolean; onClick: () => void }) {
  return (
    <AnimatePresence mode="wait">
      {saved ? (
        <motion.div
          key="saved"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full py-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center gap-2 font-black text-emerald-400"
        >
          <CheckCircle2 size={18} /> Done!
        </motion.div>
      ) : (
        <motion.button
          key="submit"
          onClick={onClick}
          disabled={disabled}
          whileTap={disabled ? {} : { scale: 0.97 }}
          className={`w-full py-3.5 rounded-2xl font-black transition-all ${
            disabled
              ? "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/30"
          }`}
        >
          {label}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
