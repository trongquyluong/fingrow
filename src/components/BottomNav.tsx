import { Home, Gamepad2, GraduationCap, Trophy, Wallet } from "lucide-react";

export type NavTab = "dashboard" | "games" | "stocks" | "wallet" | "quiz" | "league" | "life" | "shop" | "scam_spotter" | "bao_tycoon" | "debt_dash" | "trophies" | "admin";

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs: { id: NavTab; icon: any; label: string; matches?: NavTab[] }[] = [
    { id: "dashboard", icon: Home,          label: "Home",   matches: ["dashboard", "trophies"] },
    { id: "wallet",    icon: Wallet,        label: "Wallet" },
    { id: "games",     icon: Gamepad2,      label: "Games",  matches: ["games", "stocks", "life", "scam_spotter", "bao_tycoon", "debt_dash"] },
    { id: "quiz",      icon: GraduationCap, label: "Learn"  },
    { id: "league",    icon: Trophy,        label: "League" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-[var(--border-color)] z-50">
      <div className="max-w-md mx-auto flex justify-around items-center px-2 py-2 pb-7">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.matches ? tab.matches.includes(activeTab) : activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-0.5 relative transition-all duration-200 active:scale-90 min-w-[52px]"
            >
              <div
                className={`p-2 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-violet-600/15"
                    : "hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-colors duration-200 ${
                    isActive ? "text-violet-500" : "text-[var(--text-muted)]"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-200 ${
                  isActive ? "text-violet-500" : "text-[var(--text-muted)]"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
