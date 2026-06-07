/**
 * RankCrest.tsx — uniform LoL-style shield crest for every tier.
 *
 * Same shield silhouette across all 11 tiers; only the fill colour, the
 * inner glyph (Roman numeral for tier 1-7, glyph for apex), and the
 * outer glow change. This is the single source of truth for the rank
 * visual — the older `RankBadge` (in LeagueTab) is kept only for
 * backwards compatibility in compact contexts where the emoji is fine.
 */
import { LeagueTier } from "../types";
import { TIER_CONFIG } from "../constants";

interface Props {
  tier: LeagueTier;
  size?: number;        // px (default 64)
  /** Show the tier label below the crest. Useful for the big showcase. */
  withLabel?: boolean;
  /** Force-show division badge (only relevant for tiers with divisions). */
  division?: string | null;
  className?: string;
}

/** Roman numerals for the division tiers (Iron → Diamond). */
const DIVISION_ROMAN: Record<string, string> = {
  IV: "IV", III: "III", II: "II", I: "I",
};

/** Inner glyph for apex ranks (no divisions). */
const APEX_GLYPH: Record<LeagueTier, string> = {
  master:      "M",
  grandmaster: "G",
  challenger:  "C",
  sovereign:   "★",
  // fallback for the ranked tiers
  iron:        "", bronze: "", silver: "", gold: "",
  platinum:    "", emerald: "", diamond: "",
};

/** Roman numeral index for Iron→Diamond (1=I, 2=II, 3=III, 4=IV). */
const TIER_ROMAN: Record<LeagueTier, string> = {
  iron:        "IV",
  bronze:      "IV",
  silver:      "IV",
  gold:        "IV",
  platinum:    "IV",
  emerald:     "IV",
  diamond:     "IV",
  master:      "",
  grandmaster: "",
  challenger:  "",
  sovereign:   "",
};

export default function RankCrest({
  tier,
  size = 64,
  withLabel = false,
  division = null,
  className = "",
}: Props) {
  const cfg = TIER_CONFIG[tier];
  // Compose the inner glyph: for division tiers show "I" / "II" / "III" / "IV";
  // for apex tiers show the APEX_GLYPH.
  const inner =
    division
      ? DIVISION_ROMAN[division] ?? ""
      : cfg.hasDivisions
        ? TIER_ROMAN[tier]
        : APEX_GLYPH[tier];
  const id = `crest-${tier}`;
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: `drop-shadow(0 0 ${Math.round(size * 0.18)}px ${cfg.color}88)`,
        }}
        aria-label={`${cfg.label} crest`}
      >
        <defs>
          <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cfg.gradient[0]} />
            <stop offset="100%" stopColor={cfg.gradient[1]} />
          </linearGradient>
          <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Outer rim — slightly darker silhouette of the shield */}
        <path
          d="M32 2 L60 12 L58 32 C56 46 46 56 32 62 C18 56 8 46 6 32 L4 12 Z"
          fill={cfg.gradient[1]}
          opacity="0.65"
        />
        {/* Main shield body */}
        <path
          d="M32 4 L57 13 L55 31.5 C53 44.5 44 53.5 32 59 C20 53.5 11 44.5 9 31.5 L7 13 Z"
          fill={`url(#${id}-grad)`}
          stroke={cfg.color}
          strokeWidth="1.2"
        />
        {/* Top highlight bevel */}
        <path
          d="M32 4 L57 13 L55 22 C45 24 19 24 9 22 L7 13 Z"
          fill={`url(#${id}-bevel)`}
        />
        {/* Inner ring (decorative) */}
        <path
          d="M32 12 L50 18 L49 30 C47.5 40 41 47 32 51 C23 47 16.5 40 15 30 L14 18 Z"
          fill="none"
          stroke={cfg.color}
          strokeOpacity="0.45"
          strokeWidth="0.8"
        />
        {/* Inner glyph */}
        <text
          x="32"
          y={inner.length > 1 ? "40" : "42"}
          textAnchor="middle"
          fontFamily="ui-black, system-ui, sans-serif"
          fontWeight="900"
          fontSize={inner.length > 1 ? "18" : "26"}
          fill="#FFFFFF"
          stroke={cfg.gradient[1]}
          strokeWidth="0.6"
          paintOrder="stroke"
        >
          {inner}
        </text>
      </svg>
      {withLabel && (
        <span
          className="font-black text-sm leading-none"
          style={{ color: cfg.color }}
        >
          {cfg.label}
        </span>
      )}
    </div>
  );
}
