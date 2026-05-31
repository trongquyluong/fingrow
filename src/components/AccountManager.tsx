/**
 * AccountManager.tsx — admin account administration.
 *
 * Lists every account and lets the admin edit profile info, reset passwords,
 * rename the login, and delete accounts. Admin-only surface (rendered inside
 * AdminConsole). All writes go through the open-RLS helpers in lib/supabase.
 */
import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw, Search, ChevronDown, Save, KeyRound, Trash2, AtSign,
  AlertTriangle, WifiOff, CheckCircle2, ShieldAlert,
} from "lucide-react";
import {
  SUPABASE_ENABLED, fetchAccounts, isAdminUsername,
  adminUpdateAccount, adminSetPassword, adminRenameAccount, adminDeleteAccount,
  AccountRow,
} from "../lib/supabase";

const AVATARS = ["🦁","🐯","🐻","🐼","🦊","🦉","🐬","🦋","🌟","🔥","💎","🚀","🎯","🏆","🐉","🦄"];

interface Props {
  /** The logged-in admin's own username — its row is protected from deletion. */
  selfUsername: string;
}

export default function AccountManager({ selfUsername }: Props) {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setAccounts(await fetchAccounts());
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return accounts;
    return accounts.filter(a =>
      a.username.includes(t) ||
      (a.username_display ?? "").toLowerCase().includes(t) ||
      (a.full_name ?? "").toLowerCase().includes(t) ||
      (a.school ?? "").toLowerCase().includes(t));
  }, [accounts, q]);

  return (
    <div className="flex flex-col gap-3 pb-4">
      {!SUPABASE_ENABLED && (
        <Notice tone="amber" icon={<WifiOff size={16} />}
          text="Supabase isn't configured in this build — account management is unavailable here. Set VITE_SUPABASE_* and redeploy." />
      )}

      {/* Search + refresh */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-3 py-2">
          <Search size={15} className="text-[var(--text-muted)]" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search name, username, school…"
            className="flex-1 bg-transparent outline-none text-sm font-semibold text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <button onClick={load} className="p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-violet-500 active:scale-90 transition-all" aria-label="Refresh">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {!loading && accounts.length === 0 && SUPABASE_ENABLED && (
        <Notice tone="slate" icon={<AlertTriangle size={16} />} text="No accounts found yet." />
      )}

      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
        {filtered.length} account{filtered.length === 1 ? "" : "s"}
      </p>

      <div className="flex flex-col gap-2">
        {filtered.map(a => {
          const isThisAdmin = isAdminUsername(a.username);
          const isSelf = a.username === selfUsername.trim().toLowerCase();
          const expanded = open === a.username;
          return (
            <div key={a.username} className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
              <button onClick={() => setOpen(expanded ? null : a.username)} className="w-full flex items-center gap-3 p-3 text-left active:bg-[var(--bg-main)] transition-colors">
                <span className="text-2xl shrink-0">{a.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate flex items-center gap-1.5">
                    {a.username_display}
                    {isThisAdmin && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">ADMIN</span>}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">
                    @{a.username}{a.school ? ` · ${a.school}` : ""}{a.age ? ` · ${a.age}y` : ""}
                  </p>
                </div>
                <ChevronDown size={16} className={`text-[var(--text-muted)] shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded && (
                <AccountEditor
                  row={a}
                  protectedRow={isThisAdmin || isSelf}
                  onChanged={() => { setOpen(null); load(); }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── per-account editor ─────────────────────────────────────────────────────
function AccountEditor({ row, protectedRow, onChanged }: { row: AccountRow; protectedRow: boolean; onChanged: () => void }) {
  const [display, setDisplay] = useState(row.username_display);
  const [fullName, setFullName] = useState(row.full_name ?? "");
  const [email, setEmail] = useState(row.email ?? "");
  const [school, setSchool] = useState(row.school ?? "");
  const [age, setAge] = useState<number>(row.age ?? 17);
  const [avatar, setAvatar] = useState(row.avatar);

  const [newPw, setNewPw] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [confirmDel, setConfirmDel] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const flash = (tone: "ok" | "err", text: string) => { setMsg({ tone, text }); setTimeout(() => setMsg(null), 3500); };

  const saveProfile = async () => {
    setBusy(true);
    const ok = await adminUpdateAccount(row.username, {
      username_display: display.trim() || row.username_display,
      avatar,
      full_name: fullName.trim() || null,
      email: email.trim() || null,
      school: school.trim() || null,
      age,
    });
    setBusy(false);
    if (ok) { flash("ok", "Profile saved."); onChanged(); } else flash("err", "Couldn't save profile.");
  };

  const resetPassword = async () => {
    if (newPw.length < 6) return flash("err", "Password must be at least 6 characters.");
    setBusy(true);
    const ok = await adminSetPassword(row.username, newPw);
    setBusy(false);
    setNewPw("");
    flash(ok ? "ok" : "err", ok ? "Password reset." : "Couldn't reset password.");
  };

  const rename = async () => {
    setBusy(true);
    const res = await adminRenameAccount(row.username, newUsername, display.trim() || newUsername);
    setBusy(false);
    if (res.ok) { flash("ok", "Username changed."); onChanged(); }
    else flash("err",
      res.reason === "taken" ? "That username is already taken." :
      res.reason === "invalid" ? "Use ≥3 chars: letters, numbers, _ or -." :
      "Couldn't rename (Supabase unavailable).");
  };

  const del = async () => {
    setBusy(true);
    const res = await adminDeleteAccount(row.username, row.username_display);
    setBusy(false);
    if (res.ok) { flash("ok", "Account deleted."); onChanged(); }
    else flash("err", res.reason === "forbidden"
      ? "Delete blocked: run the opt-in DELETE policies in account_data.sql first."
      : "Couldn't delete (Supabase unavailable).");
  };

  return (
    <div className="px-3 pb-3 pt-1 flex flex-col gap-4 border-t border-[var(--border-color)]">
      {msg && (
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${msg.tone === "ok" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"}`}>
          {msg.tone === "ok" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{msg.text}
        </div>
      )}

      {/* Profile */}
      <Group title="Profile">
        <div className="grid grid-cols-8 gap-1.5">
          {AVATARS.map(e => (
            <button key={e} type="button" onClick={() => setAvatar(e)}
              className={`h-8 w-8 rounded-lg flex items-center justify-center text-base ${avatar === e ? "bg-violet-500/20 border-2 border-violet-500 scale-110" : "bg-[var(--bg-main)] border border-[var(--border-color)]"}`}>{e}</button>
          ))}
        </div>
        <Input label="Display name" value={display} onChange={setDisplay} />
        <Input label="Full name" value={fullName} onChange={setFullName} />
        <Input label="Email" value={email} onChange={setEmail} />
        <Input label="School" value={school} onChange={setSchool} />
        <div className="flex flex-col gap-1">
          <Label>Age</Label>
          <select value={age} onChange={e => setAge(Number(e.target.value))} className="adm-input">
            {[15,16,17,18,19,20,21].map(n => <option key={n} value={n}>{n} years</option>)}
          </select>
        </div>
        <Btn onClick={saveProfile} busy={busy} icon={<Save size={14} />} label="Save profile" />
      </Group>

      {/* Password */}
      <Group title="Reset password">
        <Input label="New password" value={newPw} onChange={setNewPw} type="password" placeholder="≥ 6 characters" />
        <Btn onClick={resetPassword} busy={busy} icon={<KeyRound size={14} />} label="Set new password" />
      </Group>

      {/* Rename login */}
      <Group title="Change login username">
        <Input label="New username" value={newUsername} onChange={setNewUsername} placeholder={`current: ${row.username}`} />
        <p className="text-[10px] text-[var(--text-muted)] -mt-1">The student uses the new username next time they log in.</p>
        <Btn onClick={rename} busy={busy || !newUsername.trim()} icon={<AtSign size={14} />} label="Change username" />
      </Group>

      {/* Delete */}
      <Group title="Danger zone" danger>
        {protectedRow ? (
          <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5"><ShieldAlert size={13} /> This account is protected and can't be deleted here.</p>
        ) : (
          <>
            <p className="text-[11px] text-[var(--text-muted)]">Type <span className="font-black text-red-400">{row.username}</span> to confirm permanent deletion.</p>
            <Input label="" value={confirmDel} onChange={setConfirmDel} placeholder={row.username} />
            <button
              onClick={del}
              disabled={busy || confirmDel.trim().toLowerCase() !== row.username}
              className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${confirmDel.trim().toLowerCase() === row.username && !busy ? "bg-red-500 text-white active:scale-95" : "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed"}`}>
              <Trash2 size={14} /> Delete account permanently
            </button>
          </>
        )}
      </Group>

      <style>{`
        .adm-input{width:100%;padding:9px 12px;border-radius:12px;background:var(--bg-main);border:1px solid var(--border-color);font-weight:600;font-size:13px;color:var(--text-main);outline:none}
        .adm-input:focus{border-color:#A855F7}
        .adm-input::placeholder{color:#94A3B8}
      `}</style>
    </div>
  );
}

// ── small bits ──────────────────────────────────────────────────────────────
function Group({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <p className={`text-[10px] font-black uppercase tracking-widest ${danger ? "text-red-400" : "text-[var(--text-muted)]"}`}>{title}</p>
      {children}
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{children}</label>;
}
function Input({ label, value, onChange, type, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <Label>{label}</Label>}
      <input type={type ?? "text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="adm-input" />
    </div>
  );
}
function Btn({ onClick, busy, icon, label }: { onClick: () => void; busy: boolean; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} disabled={busy}
      className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${busy ? "bg-[var(--bg-elevated)] text-[var(--text-muted)]" : "bg-violet-600 text-white active:scale-95"}`}>
      {icon} {label}
    </button>
  );
}
function Notice({ icon, text, tone }: { icon: React.ReactNode; text: string; tone: "amber" | "slate" }) {
  const cls = tone === "amber" ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]";
  return <div className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold ${cls}`}><span className="mt-0.5 shrink-0">{icon}</span><span>{text}</span></div>;
}
