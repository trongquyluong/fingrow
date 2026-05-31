/**
 * AdminConsole.tsx — the admin's entire experience (replaces the student app).
 *
 * Admins don't play: no leaderboard, no games/learn. They get two tools:
 *   • Accounts — manage every account (edit info, reset password, rename, delete)
 *   • Research — the learning-analytics dashboard (how students study)
 *
 * Access note: this is gated client-side only (open anon RLS). Fine for a closed
 * research pilot, not hardened access control. See supabase/admin.sql.
 */
import { useState } from "react";
import { Users, BarChart3, LogOut } from "lucide-react";
import type { AccountData } from "./AccountModal";
import AccountManager from "./AccountManager";
import AdminDashboard from "./AdminDashboard";

interface Props {
  account: AccountData;
  onLogout: () => void;
}

type Tab = "accounts" | "research";

export default function AdminConsole({ account, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("accounts");

  return (
    <div className="max-w-md mx-auto min-h-screen pb-10 pt-5 px-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🛡️</span>
          <div>
            <h1 className="font-black text-xl leading-tight">Admin Console</h1>
            <p className="text-xs text-[var(--text-muted)]">Signed in as {account.username}</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-xs active:scale-95 transition-transform">
          <LogOut size={14} /> Log out
        </button>
      </div>

      {/* Tab switch */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <TabBtn active={tab === "accounts"} onClick={() => setTab("accounts")} icon={<Users size={15} />} label="Accounts" />
        <TabBtn active={tab === "research"} onClick={() => setTab("research")} icon={<BarChart3 size={15} />} label="Research" />
      </div>

      {tab === "accounts" ? <AccountManager selfUsername={account.username} /> : <AdminDashboard />}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-sm transition-all ${
        active ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "text-[var(--text-muted)]"
      }`}
    >
      {icon} {label}
    </button>
  );
}
