/**
 * Avatar.tsx — Modular SVG character v2.
 *
 * Inspired by Bitmoji / Picrew / Duolingo character art:
 *  • softer chibi proportions (head ~36% of frame)
 *  • layered face features so every part is swappable
 *  • mood overrides face (happy / sad / thirsty / excited / cool)
 *  • rich backgrounds with depth (parallax orbs, scenery elements)
 *
 * Layer order (bottom → top):
 *   background → body/outfit → neck → head → ears → hair-back → brows
 *   → eyes → glasses → nose → mouth → accessory → hair-front → hat
 *
 * To extend: add a new variant case in the relevant sub-renderer AND
 * a matching SHOP_ITEMS entry in constants.ts (slot + variant).
 */

import { MascotMood } from "../types";

interface AvatarProps {
  face?: string;
  hair?: string;
  brows?: string;
  eyes?: string;
  mouth?: string;
  hat?: string;
  glasses?: string;
  outfit?: string;
  accessory?: string;
  background?: string;
  skinTone?: string;
  hairColor?: string;
  eyeColor?: string;
  mood?: MascotMood;
  size?: number;
  className?: string;
  /** Disable mood overrides — show the exact equipped face features. */
  staticFace?: boolean;
}

export default function Avatar({
  face = "round",
  hair = "short",
  brows = "natural",
  eyes = "bright",
  mouth = "smile",
  hat,
  glasses,
  outfit = "tee",
  accessory,
  background = "cosmic",
  skinTone = "#FDD9B5",
  hairColor = "#3D2914",
  eyeColor = "#3B2A1F",
  mood = "happy",
  size = 220,
  className = "",
  staticFace = false,
}: AvatarProps) {
  const gid = "av";

  // Mood overrides the configured face features (sad/thirsty/excited/cool)
  let effectiveEyes = eyes;
  let effectiveMouth = mouth;
  let effectiveBrows = brows;
  if (!staticFace) {
    if (mood === "sad") {
      effectiveEyes = "sleepy";
      effectiveMouth = "frown";
      effectiveBrows = "worried";
    } else if (mood === "thirsty") {
      effectiveEyes = "dot";
      effectiveMouth = "flat";
    } else if (mood === "excited") {
      effectiveEyes = "anime";
      effectiveMouth = "grin";
    } else if (mood === "cool") {
      effectiveEyes = "sharp";
      effectiveMouth = "smirk";
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <Defs gid={gid} skinTone={skinTone} hairColor={hairColor} />

      <g clipPath={`url(#${gid}-clip)`}>
        {/* ── Background ── */}
        <Background variant={background} gid={gid} />

        {/* ── Hair (back layer for long styles) ── */}
        <HairBack variant={hair} color={hairColor} />

        {/* ── Body / Outfit ── */}
        <Outfit variant={outfit} />

        {/* ── Neck ── */}
        <path d="M96 118 Q96 132 110 132 Q124 132 124 118 Z" fill={skinTone} />
        <ellipse cx="110" cy="130" rx="14" ry="3" fill="rgba(0,0,0,0.18)" />

        {/* ── Head ── */}
        <Head variant={face} skinTone={skinTone} gid={gid} />

        {/* ── Ears ── */}
        <Ears skinTone={skinTone} />

        {/* ── Eyebrows ── */}
        <Brows variant={effectiveBrows} color={hairColor} />

        {/* ── Eyes ── */}
        <Eyes variant={effectiveEyes} color={eyeColor} />

        {/* ── Glasses (over eyes) ── */}
        {glasses && <Glasses variant={glasses} />}

        {/* ── Nose ── */}
        <Nose skinTone={skinTone} />

        {/* ── Mouth ── */}
        <Mouth variant={effectiveMouth} />

        {/* ── Accessory (earrings, neck) ── */}
        {accessory && accessory !== "none" && <Accessory variant={accessory} />}

        {/* ── Hair (front layer: bangs, top) ── */}
        <HairFront variant={hair} color={hairColor} />

        {/* ── Hat (top layer) ── */}
        {hat && <Hat variant={hat} gid={gid} />}
      </g>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DEFS — gradients, filters, clip path
// ════════════════════════════════════════════════════════════════════════════
function Defs({ gid, skinTone, hairColor }: { gid: string; skinTone: string; hairColor: string }) {
  return (
    <defs>
      {/* Background gradients */}
      <linearGradient id={`${gid}-cosmic`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1a0b30" />
        <stop offset="0.5" stopColor="#0d1525" />
        <stop offset="1" stopColor="#04101a" />
      </linearGradient>
      <linearGradient id={`${gid}-sunset`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FF6B9D" />
        <stop offset="0.5" stopColor="#FFA17F" />
        <stop offset="1" stopColor="#FFD86F" />
      </linearGradient>
      <linearGradient id={`${gid}-aurora`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0E1B3D" />
        <stop offset="0.5" stopColor="#1B4D5E" />
        <stop offset="1" stopColor="#0B2A20" />
      </linearGradient>
      <linearGradient id={`${gid}-beach`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7DD3FC" />
        <stop offset="0.6" stopColor="#FDE68A" />
        <stop offset="1" stopColor="#FCD34D" />
      </linearGradient>
      <linearGradient id={`${gid}-cyber`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#1A0033" />
        <stop offset="1" stopColor="#330033" />
      </linearGradient>
      <linearGradient id={`${gid}-forest`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1F3A2E" />
        <stop offset="1" stopColor="#0B2419" />
      </linearGradient>
      <linearGradient id={`${gid}-classroom`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FBBF77" />
        <stop offset="1" stopColor="#C97A4A" />
      </linearGradient>
      <linearGradient id={`${gid}-stadium`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#22C55E" />
        <stop offset="1" stopColor="#15803D" />
      </linearGradient>
      <linearGradient id={`${gid}-mountain`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#93C5FD" />
        <stop offset="1" stopColor="#E0E7FF" />
      </linearGradient>
      <radialGradient id={`${gid}-galaxy`} cx="0.5" cy="0.5" r="0.7">
        <stop offset="0" stopColor="#7C3AED" />
        <stop offset="0.6" stopColor="#2E1065" />
        <stop offset="1" stopColor="#0A0A1E" />
      </radialGradient>

      {/* Skin highlight */}
      <radialGradient id={`${gid}-skin`} cx="0.35" cy="0.3" r="0.7">
        <stop offset="0" stopColor="rgba(255,255,255,0.22)" />
        <stop offset="1" stopColor="rgba(255,255,255,0)" />
      </radialGradient>

      {/* Soft shadow under chin */}
      <radialGradient id={`${gid}-chin-shadow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="rgba(0,0,0,0.15)" />
        <stop offset="1" stopColor="rgba(0,0,0,0)" />
      </radialGradient>

      {/* Hair shine */}
      <linearGradient id={`${gid}-hair`} x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.25" />
        <stop offset="0.4" stopColor={hairColor} stopOpacity="0" />
      </linearGradient>

      {/* Outfit highlight */}
      <linearGradient id={`${gid}-outfit-shine`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,0.15)" />
        <stop offset="1" stopColor="rgba(0,0,0,0)" />
      </linearGradient>

      {/* Glow filter */}
      <filter id={`${gid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Clip-path frame */}
      <clipPath id={`${gid}-clip`}>
        <rect x="0" y="0" width="220" height="220" rx="32" ry="32" />
      </clipPath>

      {/* Unused but referenced for skin */}
      <linearGradient id={`${gid}-noop`}><stop stopColor={skinTone} /></linearGradient>
    </defs>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BACKGROUND
// ════════════════════════════════════════════════════════════════════════════
function Background({ variant, gid }: { variant: string; gid: string }) {
  switch (variant) {
    case "sunset":
      return (
        <>
          <rect width="220" height="220" fill={`url(#${gid}-sunset)`} />
          <circle cx="55" cy="65" r="26" fill="#FFF59D" opacity="0.85" />
          <circle cx="55" cy="65" r="32" fill="#FFF59D" opacity="0.3" />
          {/* clouds */}
          <ellipse cx="170" cy="50" rx="22" ry="6" fill="#FFFFFF" opacity="0.4" />
          <ellipse cx="40" cy="105" rx="18" ry="5" fill="#FFFFFF" opacity="0.3" />
          {/* mountains */}
          <path d="M0 165 L40 130 L75 160 L110 120 L150 155 L185 130 L220 160 L220 220 L0 220 Z" fill="#7C3AED" opacity="0.55" />
        </>
      );
    case "aurora":
      return (
        <>
          <rect width="220" height="220" fill={`url(#${gid}-aurora)`} />
          <path d="M0 40 Q60 20 110 50 T220 30 L220 110 Q160 90 110 120 T0 110 Z" fill="#22D3EE" opacity="0.35" />
          <path d="M0 65 Q70 45 140 75 T220 55 L220 135 Q150 115 80 145 T0 135 Z" fill="#A855F7" opacity="0.35" />
          {[[30,20],[170,15],[160,40],[40,50],[200,80],[10,90]].map(([x,y],i)=>(
            <circle key={i} cx={x} cy={y} r={1 + Math.random()} fill="white" />
          ))}
        </>
      );
    case "beach":
      return (
        <>
          <rect width="220" height="220" fill={`url(#${gid}-beach)`} />
          <circle cx="45" cy="55" r="20" fill="#FFE066" />
          <circle cx="45" cy="55" r="28" fill="#FFE066" opacity="0.3" />
          {/* sea */}
          <path d="M0 145 Q55 142 110 145 T220 145 L220 165 L0 165 Z" fill="#38BDF8" opacity="0.7" />
          {/* sand */}
          <path d="M0 160 Q55 158 110 162 T220 158 L220 220 L0 220 Z" fill="#FBBF77" />
          {/* palm */}
          <rect x="180" y="105" width="4" height="55" fill="#7C3F00" />
          <path d="M182 105 L200 92 L184 102 L204 110 L184 110 L196 122 L182 112 Z" fill="#16A34A" />
        </>
      );
    case "cyber":
      return (
        <>
          <rect width="220" height="220" fill={`url(#${gid}-cyber)`} />
          {/* horizon grid */}
          {[135, 150, 165, 180, 195].map((y, i) => (
            <line key={`h${i}`} x1="0" y1={y} x2="220" y2={y} stroke="#EC4899" strokeWidth="0.4" opacity={0.7 - i * 0.1} />
          ))}
          {[20, 60, 110, 160, 200].map((x, i) => (
            <line key={`v${i}`} x1={110} y1="135" x2={x} y2="220" stroke="#EC4899" strokeWidth="0.3" opacity="0.4" />
          ))}
          {/* sun */}
          <circle cx="110" cy="85" r="38" fill="#EC4899" opacity="0.25" />
          <circle cx="110" cy="85" r="24" fill="#FBBF24" opacity="0.5" />
          {/* skyline */}
          <rect x="15" y="95" width="14" height="40" fill="#0F0728" />
          <rect x="35" y="80" width="12" height="55" fill="#0F0728" />
          <rect x="180" y="90" width="14" height="45" fill="#0F0728" />
          <rect x="200" y="100" width="12" height="35" fill="#0F0728" />
        </>
      );
    case "forest":
      return (
        <>
          <rect width="220" height="220" fill={`url(#${gid}-forest)`} />
          {/* moon */}
          <circle cx="180" cy="40" r="14" fill="#FEF3C7" opacity="0.85" />
          {/* trees silhouettes */}
          {[20, 50, 95, 140, 185].map((x, i) => (
            <g key={i} opacity={0.6}>
              <rect x={x - 2} y={130} width="4" height="50" fill="#062b18" />
              <path d={`M${x - 14} 135 L${x} 90 L${x + 14} 135 Z`} fill="#0c4d2a" />
              <path d={`M${x - 16} 115 L${x} 75 L${x + 16} 115 Z`} fill="#0c4d2a" />
            </g>
          ))}
          {/* fireflies */}
          {[[60,60],[150,80],[100,50],[40,100]].map(([x,y],i)=>(
            <circle key={i} cx={x} cy={y} r="1.5" fill="#FCD34D" opacity="0.9" />
          ))}
        </>
      );
    case "classroom":
      return (
        <>
          <rect width="220" height="220" fill={`url(#${gid}-classroom)`} />
          {/* shelf with books */}
          <rect x="20" y="40" width="180" height="6" fill="#5C2E0A" />
          {[25, 38, 51, 64, 77, 95, 108, 121, 134, 152, 165, 178].map((x, i) => (
            <rect key={i} x={x} y={20} width="11" height="20" fill={["#DC2626","#2563EB","#16A34A","#9333EA","#EAB308","#0891B2"][i % 6]} />
          ))}
          {/* desk */}
          <rect x="0" y="170" width="220" height="50" fill="#7C3F00" opacity="0.6" />
        </>
      );
    case "stadium":
      return (
        <>
          <rect width="220" height="220" fill={`url(#${gid}-stadium)`} />
          {/* field lines */}
          <line x1="0" y1="170" x2="220" y2="170" stroke="white" strokeWidth="2" opacity="0.7" />
          <circle cx="110" cy="170" r="22" stroke="white" strokeWidth="2" fill="none" opacity="0.7" />
          {/* stadium silhouette */}
          <path d="M0 100 Q110 70 220 100 L220 130 L0 130 Z" fill="#1F2937" opacity="0.7" />
          {/* lights */}
          <circle cx="50" cy="90" r="3" fill="#FEF08A" />
          <circle cx="170" cy="90" r="3" fill="#FEF08A" />
          <circle cx="50" cy="90" r="8" fill="#FEF08A" opacity="0.4" />
          <circle cx="170" cy="90" r="8" fill="#FEF08A" opacity="0.4" />
        </>
      );
    case "mountain":
      return (
        <>
          <rect width="220" height="220" fill={`url(#${gid}-mountain)`} />
          {/* clouds */}
          <ellipse cx="40" cy="55" rx="22" ry="7" fill="#FFFFFF" opacity="0.85" />
          <ellipse cx="180" cy="40" rx="26" ry="8" fill="#FFFFFF" opacity="0.85" />
          {/* back mountain */}
          <path d="M0 165 L60 90 L120 145 L170 80 L220 150 L220 220 L0 220 Z" fill="#7DD3FC" />
          {/* front mountain */}
          <path d="M0 195 L50 140 L100 180 L160 125 L220 175 L220 220 L0 220 Z" fill="#1E40AF" />
          {/* snow caps */}
          <path d="M55 95 L65 105 L60 90 Z" fill="white" />
          <path d="M165 85 L175 95 L170 80 Z" fill="white" />
        </>
      );
    case "galaxy":
      return (
        <>
          <rect width="220" height="220" fill={`url(#${gid}-galaxy)`} />
          {/* spiral arms */}
          <path d="M40 110 Q70 70 110 90 Q150 110 180 70" stroke="#C4B5FD" strokeWidth="2" fill="none" opacity="0.4" />
          <path d="M40 130 Q80 160 130 140 Q170 120 200 150" stroke="#C4B5FD" strokeWidth="2" fill="none" opacity="0.4" />
          {/* lots of stars */}
          {Array.from({length: 24}).map((_, i) => {
            const x = Math.random() * 220;
            const y = Math.random() * 220;
            const r = Math.random() * 1.5 + 0.5;
            return <circle key={i} cx={x} cy={y} r={r} fill="white" opacity={0.5 + Math.random()*0.5} />;
          })}
        </>
      );
    case "cosmic":
    default:
      return (
        <>
          <rect width="220" height="220" fill={`url(#${gid}-cosmic)`} />
          {/* stars */}
          {[[25,30,1],[160,20,1.5],[180,60,1],[40,80,0.8],[170,120,1],[15,150,0.8],[200,170,1.2],[80,30,0.7]].map(([x,y,r],i)=>(
            <circle key={i} cx={x} cy={y} r={r} fill="white" opacity={0.6 + Math.random()*0.4} />
          ))}
          {/* nebula */}
          <circle cx="55" cy="45" r="28" fill="#A855F7" opacity="0.18" />
          <circle cx="175" cy="180" r="32" fill="#06B6D4" opacity="0.18" />
          <circle cx="110" cy="120" r="40" fill="#EC4899" opacity="0.08" />
        </>
      );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HEAD shape
// ════════════════════════════════════════════════════════════════════════════
function Head({ variant, skinTone, gid }: { variant: string; skinTone: string; gid: string }) {
  const cheeks = (
    <g>
      <ellipse cx="86" cy="96" rx="7" ry="4.5" fill="#FFB5C5" opacity="0.6" />
      <ellipse cx="134" cy="96" rx="7" ry="4.5" fill="#FFB5C5" opacity="0.6" />
    </g>
  );
  const highlight = <circle cx="110" cy="82" r="44" fill={`url(#${gid}-skin)`} />;

  switch (variant) {
    case "oval":
      return (
        <>
          <ellipse cx="110" cy="82" rx="36" ry="42" fill={skinTone} />
          {cheeks}
          <ellipse cx="110" cy="82" rx="36" ry="42" fill={`url(#${gid}-skin)`} />
        </>
      );
    case "square":
      return (
        <>
          <path d="M75 60 Q75 50 90 50 L130 50 Q145 50 145 60 L148 100 Q148 122 110 124 Q72 122 72 100 Z" fill={skinTone} />
          {cheeks}
          {highlight}
        </>
      );
    case "heart":
      return (
        <>
          <path d="M70 65 Q70 45 110 45 Q150 45 150 65 L148 95 Q148 120 110 128 Q72 120 72 95 Z" fill={skinTone} />
          {cheeks}
          {highlight}
        </>
      );
    case "round":
    default:
      return (
        <>
          <circle cx="110" cy="82" r="44" fill={skinTone} />
          {cheeks}
          {highlight}
        </>
      );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// EARS
// ════════════════════════════════════════════════════════════════════════════
function Ears({ skinTone }: { skinTone: string }) {
  return (
    <g>
      <ellipse cx="68" cy="86" rx="5" ry="9" fill={skinTone} />
      <ellipse cx="152" cy="86" rx="5" ry="9" fill={skinTone} />
      <ellipse cx="68" cy="88" rx="2" ry="4" fill="rgba(0,0,0,0.15)" />
      <ellipse cx="152" cy="88" rx="2" ry="4" fill="rgba(0,0,0,0.15)" />
    </g>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// OUTFIT (body / clothes from y=125 down)
// ════════════════════════════════════════════════════════════════════════════
function Outfit({ variant }: { variant: string }) {
  const baseBody = (color: string, collar?: string) => (
    <>
      <path d="M58 220 L58 145 Q58 132 75 130 L145 130 Q162 132 162 145 L162 220 Z" fill={color} />
      {collar && <path d="M96 130 Q110 140 124 130" fill="none" stroke={collar} strokeWidth="2.5" />}
    </>
  );

  switch (variant) {
    case "hoodie":
      return (
        <g>
          {/* hood */}
          <path d="M62 130 Q70 88 110 88 Q150 88 158 130 Z" fill="#4B5563" />
          {baseBody("#374151")}
          {/* pocket */}
          <path d="M82 175 L138 175 L142 195 L78 195 Z" fill="#1F2937" />
          {/* drawstrings */}
          <line x1="98" y1="138" x2="96" y2="160" stroke="#111827" strokeWidth="1.5" />
          <line x1="122" y1="138" x2="124" y2="160" stroke="#111827" strokeWidth="1.5" />
          <circle cx="96" cy="161" r="2" fill="#111827" />
          <circle cx="124" cy="161" r="2" fill="#111827" />
        </g>
      );
    case "suit":
      return (
        <g>
          {baseBody("#1E293B")}
          {/* white shirt */}
          <path d="M96 130 L110 155 L124 130 Z" fill="white" />
          {/* tie */}
          <path d="M104 138 L116 138 L118 175 L110 192 L102 175 Z" fill="#A855F7" />
          {/* lapels */}
          <path d="M74 134 L96 130 L110 155 L88 155 Z" fill="#0F172A" />
          <path d="M146 134 L124 130 L110 155 L132 155 Z" fill="#0F172A" />
        </g>
      );
    case "jersey":
      return (
        <g>
          {baseBody("#3B82F6")}
          <text x="110" y="190" textAnchor="middle" fill="white" fontSize="36" fontWeight="800" fontFamily="Arial">7</text>
          <rect x="58" y="145" width="5" height="75" fill="white" />
          <rect x="157" y="145" width="5" height="75" fill="white" />
        </g>
      );
    case "formal":
      return (
        <g>
          {/* sweetheart neckline dress */}
          <path d="M58 220 L58 145 Q58 132 75 130 L88 130 Q98 140 110 140 Q122 140 132 130 L145 130 Q162 132 162 145 L162 220 Z" fill="#EC4899" />
          <path d="M75 145 L145 145" stroke="#BE185D" strokeWidth="1" opacity="0.4" />
        </g>
      );
    case "uniform":
      return (
        <g>
          {/* white shirt */}
          {baseBody("#F8FAFC", "#CBD5E1")}
          {/* tie */}
          <path d="M104 132 L116 132 L118 168 L110 182 L102 168 Z" fill="#DC2626" />
          <path d="M104 132 L116 132 L116 140 L104 140 Z" fill="#991B1B" />
          {/* pocket */}
          <rect x="74" y="160" width="22" height="20" fill="none" stroke="#94A3B8" strokeWidth="1" />
        </g>
      );
    case "jacket":
      return (
        <g>
          {baseBody("#0F172A")}
          {/* bomber stripes */}
          <rect x="58" y="200" width="104" height="6" fill="#DC2626" />
          <rect x="58" y="208" width="104" height="3" fill="#FBBF24" />
          {/* zipper */}
          <line x1="110" y1="135" x2="110" y2="200" stroke="#FBBF24" strokeWidth="1.5" />
          {/* shirt visible */}
          <path d="M96 130 Q110 138 124 130 L124 142 L96 142 Z" fill="#475569" />
        </g>
      );
    case "tank":
      return (
        <g>
          {baseBody("#F59E0B")}
          {/* armholes */}
          <ellipse cx="62" cy="148" rx="9" ry="14" fill="#FDD9B5" />
          <ellipse cx="158" cy="148" rx="9" ry="14" fill="#FDD9B5" />
          {/* deep v */}
          <path d="M88 130 L110 165 L132 130 Z" fill="#FDD9B5" />
        </g>
      );
    case "armor":
      return (
        <g>
          {baseBody("#94A3B8")}
          {/* breastplate */}
          <path d="M76 145 L110 138 L144 145 L140 200 L80 200 Z" fill="#CBD5E1" />
          {/* rivets */}
          {[[88,160],[110,158],[132,160],[88,180],[110,178],[132,180]].map(([x,y],i)=>(
            <circle key={i} cx={x} cy={y} r="2" fill="#475569" />
          ))}
          {/* shoulder pauldrons */}
          <ellipse cx="62" cy="142" rx="14" ry="12" fill="#E2E8F0" />
          <ellipse cx="158" cy="142" rx="14" ry="12" fill="#E2E8F0" />
        </g>
      );
    case "astro":
      return (
        <g>
          {baseBody("#F1F5F9")}
          {/* helmet ring */}
          <ellipse cx="110" cy="132" rx="42" ry="6" fill="#CBD5E1" />
          {/* control panel */}
          <rect x="92" y="158" width="36" height="18" rx="3" fill="#1F2937" />
          <circle cx="100" cy="167" r="2" fill="#EF4444" />
          <circle cx="110" cy="167" r="2" fill="#10B981" />
          <circle cx="120" cy="167" r="2" fill="#3B82F6" />
          {/* nasa-style flag */}
          <rect x="76" y="158" width="10" height="14" fill="#DC2626" />
        </g>
      );
    case "tee":
    default:
      return (
        <g>
          {baseBody("#A855F7", "#7C3AED")}
        </g>
      );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HAIR — split into back layer (long, ponytails) and front layer (bangs)
// ════════════════════════════════════════════════════════════════════════════
function HairBack({ variant, color }: { variant: string; color: string }) {
  switch (variant) {
    case "long":
      return (
        <g fill={color}>
          {/* hair flowing down behind shoulders */}
          <path d="M62 75 Q50 130 70 175 L82 175 Q74 130 76 75 Z" />
          <path d="M158 75 Q170 130 150 175 L138 175 Q146 130 144 75 Z" />
        </g>
      );
    case "ponytail":
      return (
        <g fill={color}>
          <ellipse cx="160" cy="100" rx="10" ry="22" />
          <path d="M155 85 Q170 95 165 130 Q160 145 152 142 Q154 110 150 90 Z" />
        </g>
      );
    case "twin":
      return (
        <g fill={color}>
          {/* two buns at ear level */}
          <circle cx="56" cy="80" r="12" />
          <circle cx="164" cy="80" r="12" />
        </g>
      );
    case "afro":
      return (
        <g fill={color}>
          {/* large halo */}
          {Array.from({length: 14}).map((_, i) => {
            const angle = (i / 14) * Math.PI * 2;
            const cx = 110 + Math.cos(angle) * 50;
            const cy = 82 + Math.sin(angle) * 50;
            return <circle key={i} cx={cx} cy={cy} r="14" />;
          })}
          <circle cx="110" cy="82" r="52" />
        </g>
      );
    default:
      return null;
  }
}

function HairFront({ variant, color }: { variant: string; color: string }) {
  const shine = "rgba(255,255,255,0.18)";
  switch (variant) {
    case "long":
      return (
        <g>
          <path d="M68 80 Q68 38 110 38 Q152 38 152 80 L150 70 Q140 54 110 54 Q80 54 70 70 Z" fill={color} />
          <path d="M80 50 Q95 42 110 48 Q125 42 140 50 Q125 60 110 58 Q95 60 80 50 Z" fill={color} opacity="0.9" />
          <path d="M70 50 Q90 38 130 40" stroke={shine} strokeWidth="2" fill="none" />
        </g>
      );
    case "curly":
      return (
        <g fill={color}>
          {[[78, 50, 14],[95, 42, 14],[110, 38, 14],[125, 42, 14],[142, 50, 12],[68, 64, 11],[152, 64, 11],[65, 80, 9],[155, 80, 9]].map(([x,y,r],i)=>(
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
          <circle cx="92" cy="48" r="4" fill={shine} />
        </g>
      );
    case "bun":
      return (
        <g>
          <path d="M70 80 Q70 40 110 40 Q150 40 150 80 L147 68 Q140 55 110 55 Q80 55 73 68 Z" fill={color} />
          <circle cx="110" cy="32" r="16" fill={color} />
          <ellipse cx="110" cy="44" rx="14" ry="3" fill="#1F2937" />
          <circle cx="105" cy="28" r="3" fill={shine} />
        </g>
      );
    case "mohawk":
      return (
        <g fill={color}>
          <path d="M70 75 Q70 55 85 50 L92 75 Z" opacity="0.55" />
          <path d="M150 75 Q150 55 135 50 L128 75 Z" opacity="0.55" />
          {/* spikes */}
          <path d="M90 58 L93 26 L100 52 L106 22 L112 52 L118 24 L124 52 L130 26 L130 58 Z" fill={color} />
          {/* shine */}
          <path d="M100 30 L105 28" stroke={shine} strokeWidth="2" />
        </g>
      );
    case "ponytail":
      return (
        <g>
          <path d="M70 75 Q70 40 110 40 Q150 40 150 75 L148 65 Q140 55 110 55 Q82 55 72 65 Z" fill={color} />
          <path d="M80 50 Q95 42 110 48 Q125 42 140 50 Q125 60 110 58 Q95 60 80 50 Z" fill={color} opacity="0.9" />
        </g>
      );
    case "afro":
      return null; // back layer handles entire afro
    case "undercut":
      return (
        <g fill={color}>
          {/* shaved sides hint */}
          <path d="M70 80 L70 95 L85 95 L78 80 Z" opacity="0.4" />
          <path d="M150 80 L150 95 L135 95 L142 80 Z" opacity="0.4" />
          {/* swept top */}
          <path d="M72 65 Q90 30 130 38 Q148 42 150 65 L148 55 Q135 45 110 47 Q85 50 75 60 Z" />
          {/* swoop */}
          <path d="M82 55 Q105 42 135 50 Q125 60 110 58 Q92 60 82 55 Z" opacity="0.9" />
        </g>
      );
    case "pixie":
      return (
        <g fill={color}>
          <path d="M72 75 Q72 45 110 42 Q148 45 148 75 L146 65 Q138 55 110 55 Q82 55 74 65 Z" />
          {/* swept bangs */}
          <path d="M75 55 Q100 40 140 45 Q120 58 95 60 Q80 60 75 55 Z" opacity="0.95" />
        </g>
      );
    case "twin":
      return (
        <g>
          <path d="M72 78 Q72 40 110 40 Q148 40 148 78 L146 66 Q138 54 110 54 Q82 54 74 66 Z" fill={color} />
          <path d="M82 55 Q100 45 110 50 Q120 45 138 55 Q120 60 110 58 Q100 60 82 55 Z" fill={color} opacity="0.9" />
        </g>
      );
    case "short":
    default:
      return (
        <g>
          <path d="M72 75 Q72 42 110 42 Q148 42 148 75 L146 65 Q138 54 110 54 Q82 54 74 65 Z" fill={color} />
          <path d="M82 55 Q100 46 116 52 Q105 60 92 60 Q84 60 82 55 Z" fill={color} opacity="0.9" />
          <path d="M80 50 Q105 42 145 50" stroke={shine} strokeWidth="1.5" fill="none" />
        </g>
      );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BROWS
// ════════════════════════════════════════════════════════════════════════════
function Brows({ variant, color }: { variant: string; color: string }) {
  switch (variant) {
    case "bold":
      return (
        <g fill={color}>
          <path d="M82 76 Q92 70 100 76 L100 80 Q92 76 82 80 Z" />
          <path d="M120 76 Q130 70 138 76 L138 80 Q130 76 120 80 Z" />
        </g>
      );
    case "arched":
      return (
        <g stroke={color} strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M82 78 Q92 70 100 78" />
          <path d="M120 78 Q130 70 138 78" />
        </g>
      );
    case "thin":
      return (
        <g stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round">
          <path d="M83 78 Q92 74 100 78" />
          <path d="M120 78 Q128 74 137 78" />
        </g>
      );
    case "worried":
      return (
        <g stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M82 80 Q92 76 100 78" />
          <path d="M120 78 Q128 76 138 80" />
        </g>
      );
    case "natural":
    default:
      return (
        <g stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M82 78 Q92 73 100 78" />
          <path d="M120 78 Q130 73 138 78" />
        </g>
      );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// EYES — color-aware
// ════════════════════════════════════════════════════════════════════════════
function Eyes({ variant, color }: { variant: string; color: string }) {
  const whitesL = <ellipse cx="92" cy="90" rx="6" ry="7" fill="white" />;
  const whitesR = <ellipse cx="128" cy="90" rx="6" ry="7" fill="white" />;

  switch (variant) {
    case "sharp":
      return (
        <g>
          {/* narrowed */}
          <path d="M84 92 Q92 86 100 92 L100 94 Q92 90 84 94 Z" fill="white" />
          <path d="M120 92 Q128 86 136 92 L136 94 Q128 90 120 94 Z" fill="white" />
          <ellipse cx="92" cy="92" rx="2.5" ry="2.5" fill={color} />
          <ellipse cx="128" cy="92" rx="2.5" ry="2.5" fill={color} />
          <circle cx="93" cy="91" r="0.8" fill="white" />
          <circle cx="129" cy="91" r="0.8" fill="white" />
        </g>
      );
    case "sleepy":
      return (
        <g>
          <path d="M84 91 Q92 88 100 91" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M120 91 Q128 88 136 91" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* lashes */}
          <line x1="85" y1="91" x2="84" y2="94" stroke="#1F2937" strokeWidth="1" />
          <line x1="137" y1="91" x2="138" y2="94" stroke="#1F2937" strokeWidth="1" />
        </g>
      );
    case "anime":
      return (
        <g>
          <ellipse cx="92" cy="90" rx="8" ry="10" fill="white" />
          <ellipse cx="128" cy="90" rx="8" ry="10" fill="white" />
          <ellipse cx="92" cy="92" rx="5" ry="7" fill={color} />
          <ellipse cx="128" cy="92" rx="5" ry="7" fill={color} />
          <circle cx="92" cy="89" r="2.5" fill="white" />
          <circle cx="128" cy="89" r="2.5" fill="white" />
          <circle cx="94" cy="94" r="1" fill="white" />
          <circle cx="130" cy="94" r="1" fill="white" />
          {/* tiny sparkle */}
          <path d="M84 84 L86 86 L84 88 L82 86 Z" fill="white" />
          <path d="M136 84 L138 86 L136 88 L134 86 Z" fill="white" />
        </g>
      );
    case "wink":
      return (
        <g>
          {/* left open */}
          {whitesL}
          <ellipse cx="92" cy="91" rx="3" ry="4" fill={color} />
          <circle cx="93" cy="89" r="1" fill="white" />
          {/* right wink */}
          <path d="M120 92 Q128 87 136 92" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      );
    case "dot":
      return (
        <g fill="#1F2937">
          <circle cx="92" cy="91" r="2.5" />
          <circle cx="128" cy="91" r="2.5" />
        </g>
      );
    case "bright":
    default:
      return (
        <g>
          {whitesL}
          {whitesR}
          <ellipse cx="92" cy="91" rx="3.5" ry="4.5" fill={color} />
          <ellipse cx="128" cy="91" rx="3.5" ry="4.5" fill={color} />
          {/* sparkles */}
          <circle cx="93.5" cy="89" r="1.3" fill="white" />
          <circle cx="129.5" cy="89" r="1.3" fill="white" />
          <circle cx="90.5" cy="93" r="0.7" fill="white" />
          <circle cx="126.5" cy="93" r="0.7" fill="white" />
        </g>
      );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// NOSE — subtle
// ════════════════════════════════════════════════════════════════════════════
function Nose({ skinTone }: { skinTone: string }) {
  return (
    <path
      d="M108 100 Q110 106 113 105"
      stroke={shadeColor(skinTone, -20)}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      opacity="0.6"
    />
  );
}

function shadeColor(hex: string, percent: number): string {
  const f = parseInt(hex.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const R = f >> 16,
    G = (f >> 8) & 0xff,
    B = f & 0xff;
  const r = Math.round((t - R) * p) + R;
  const g = Math.round((t - G) * p) + G;
  const b = Math.round((t - B) * p) + B;
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ════════════════════════════════════════════════════════════════════════════
// MOUTH
// ════════════════════════════════════════════════════════════════════════════
function Mouth({ variant }: { variant: string }) {
  switch (variant) {
    case "grin":
      return (
        <g>
          <path d="M94 112 Q110 126 126 112 L126 114 Q110 128 94 114 Z" fill="#1F2937" />
          {/* teeth */}
          <path d="M96 113 L124 113 L122 119 L98 119 Z" fill="white" />
          <line x1="110" y1="113" x2="110" y2="119" stroke="#1F2937" strokeWidth="0.5" />
        </g>
      );
    case "smirk":
      return (
        <g>
          <path d="M98 114 Q115 118 122 110" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      );
    case "pout":
      return (
        <g>
          <ellipse cx="110" cy="113" rx="6" ry="3.5" fill="#FF8FA3" />
          <path d="M104 113 Q110 115 116 113" stroke="#BE185D" strokeWidth="0.8" fill="none" />
        </g>
      );
    case "frown":
      return <path d="M100 116 Q110 110 120 116" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    case "flat":
      return <path d="M102 114 L118 114" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />;
    case "smile":
    default:
      return (
        <g>
          <path d="M100 110 Q110 120 120 110" stroke="#1F2937" strokeWidth="2.5" fill="#FF8FA3" strokeLinecap="round" />
        </g>
      );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GLASSES
// ════════════════════════════════════════════════════════════════════════════
function Glasses({ variant }: { variant: string }) {
  switch (variant) {
    case "square":
      return (
        <g stroke="#1F2937" strokeWidth="2.5" fill="none">
          <rect x="80" y="84" width="16" height="14" rx="2" fill="rgba(255,255,255,0.18)" />
          <rect x="124" y="84" width="16" height="14" rx="2" fill="rgba(255,255,255,0.18)" />
          <line x1="96" y1="90" x2="124" y2="90" />
        </g>
      );
    case "shades":
      return (
        <g>
          <ellipse cx="92" cy="91" rx="10" ry="8" fill="#0F172A" />
          <ellipse cx="128" cy="91" rx="10" ry="8" fill="#0F172A" />
          <line x1="102" y1="91" x2="118" y2="91" stroke="#0F172A" strokeWidth="3" />
          <ellipse cx="88" cy="88" rx="3" ry="1.5" fill="white" opacity="0.6" />
          <ellipse cx="124" cy="88" rx="3" ry="1.5" fill="white" opacity="0.6" />
        </g>
      );
    case "vr":
      return (
        <g>
          <rect x="72" y="80" width="76" height="24" rx="6" fill="#0F172A" />
          <rect x="76" y="83" width="68" height="18" rx="3" fill="#06B6D4" opacity="0.85" />
          <rect x="76" y="83" width="68" height="18" rx="3" fill="none" stroke="#22D3EE" strokeWidth="1.2" />
          <circle cx="110" cy="92" r="2" fill="#10B981" />
          <line x1="66" y1="86" x2="72" y2="86" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
          <line x1="148" y1="86" x2="154" y2="86" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "cat":
      return (
        <g stroke="#1F2937" strokeWidth="2.5" fill="rgba(255,255,255,0.18)">
          <path d="M80 88 Q80 84 86 84 L100 84 Q104 84 104 88 L104 96 Q104 100 96 100 L86 100 Q80 100 80 96 Z M82 88 L78 84" />
          <path d="M120 88 Q120 84 124 84 L138 84 Q144 84 144 88 L144 96 Q144 100 138 100 L128 100 Q120 100 120 96 Z M142 88 L146 84" />
          <line x1="104" y1="91" x2="120" y2="91" />
        </g>
      );
    case "monocle":
      return (
        <g>
          <circle cx="128" cy="90" r="11" fill="rgba(255,255,255,0.18)" stroke="#FBBF24" strokeWidth="2.5" />
          <line x1="128" y1="101" x2="135" y2="125" stroke="#FBBF24" strokeWidth="1.5" />
          <ellipse cx="124" cy="86" rx="3" ry="2" fill="white" opacity="0.6" />
        </g>
      );
    case "round":
    default:
      return (
        <g stroke="#1F2937" strokeWidth="2" fill="rgba(255,255,255,0.18)">
          <circle cx="92" cy="91" r="9" />
          <circle cx="128" cy="91" r="9" />
          <line x1="101" y1="91" x2="119" y2="91" />
          <ellipse cx="88" cy="88" rx="2.5" ry="1.5" fill="white" opacity="0.5" stroke="none" />
          <ellipse cx="124" cy="88" rx="2.5" ry="1.5" fill="white" opacity="0.5" stroke="none" />
        </g>
      );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ACCESSORY (earrings, chain, scarf, bowtie)
// ════════════════════════════════════════════════════════════════════════════
function Accessory({ variant }: { variant: string }) {
  switch (variant) {
    case "studs":
      return (
        <g>
          <circle cx="68" cy="94" r="2" fill="#FBBF24" />
          <circle cx="152" cy="94" r="2" fill="#FBBF24" />
        </g>
      );
    case "hoops":
      return (
        <g stroke="#FBBF24" strokeWidth="1.8" fill="none">
          <ellipse cx="68" cy="98" rx="3.5" ry="6" />
          <ellipse cx="152" cy="98" rx="3.5" ry="6" />
        </g>
      );
    case "chain":
      return (
        <g>
          <path d="M85 130 Q110 158 135 130" fill="none" stroke="#FBBF24" strokeWidth="2.5" />
          <circle cx="110" cy="150" r="5" fill="#FBBF24" />
          <text x="110" y="153" textAnchor="middle" fontSize="6" fontWeight="800" fill="#7C2D12">$</text>
        </g>
      );
    case "scarf":
      return (
        <g fill="#DC2626">
          <path d="M70 130 Q110 142 150 130 L150 145 Q110 155 70 145 Z" />
          <path d="M140 142 L150 200 L160 200 L155 145 Z" fill="#B91C1C" />
        </g>
      );
    case "bowtie":
      return (
        <g>
          <path d="M95 130 L110 138 L95 146 Z" fill="#DC2626" />
          <path d="M125 130 L110 138 L125 146 Z" fill="#DC2626" />
          <rect x="106" y="134" width="8" height="8" fill="#991B1B" />
        </g>
      );
    default:
      return null;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HAT
// ════════════════════════════════════════════════════════════════════════════
function Hat({ variant, gid }: { variant: string; gid: string }) {
  switch (variant) {
    case "beanie":
      return (
        <g>
          <path d="M68 52 Q68 28 110 28 Q152 28 152 52 L152 64 L68 64 Z" fill="#EF4444" />
          <line x1="72" y1="38" x2="148" y2="38" stroke="#B91C1C" strokeWidth="1" opacity="0.5" />
          <line x1="70" y1="48" x2="150" y2="48" stroke="#B91C1C" strokeWidth="1" opacity="0.5" />
          <circle cx="110" cy="22" r="7" fill="white" />
          <circle cx="112" cy="20" r="2" fill="#E5E7EB" />
        </g>
      );
    case "grad":
      return (
        <g>
          <rect x="62" y="44" width="96" height="3" fill="#0F172A" />
          <rect x="68" y="28" width="84" height="18" rx="2" fill="#0F172A" transform="rotate(-3 110 36)" />
          <circle cx="110" cy="32" r="3" fill="#FBBF24" />
          <line x1="110" y1="32" x2="148" y2="52" stroke="#FBBF24" strokeWidth="1.5" />
          <path d="M145 50 L152 54 L150 62 L143 58 Z" fill="#FBBF24" />
        </g>
      );
    case "crown":
      return (
        <g filter={`url(#${gid}-glow)`}>
          <path d="M68 58 L74 30 L88 48 L100 24 L110 44 L120 24 L132 48 L146 30 L152 58 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
          <circle cx="88" cy="50" r="3.5" fill="#EF4444" />
          <circle cx="110" cy="48" r="4" fill="#A855F7" />
          <circle cx="132" cy="50" r="3.5" fill="#10B981" />
          <path d="M74 32 L80 35" stroke="#FEF3C7" strokeWidth="1.5" />
        </g>
      );
    case "tiara":
      return (
        <g filter={`url(#${gid}-glow)`}>
          <path d="M74 52 Q110 30 146 52" fill="none" stroke="#F0ABFC" strokeWidth="3" />
          <circle cx="110" cy="38" r="5" fill="#EC4899" />
          <circle cx="110" cy="38" r="2.5" fill="#FBCFE8" />
          <circle cx="86" cy="46" r="2.5" fill="#F0ABFC" />
          <circle cx="134" cy="46" r="2.5" fill="#F0ABFC" />
        </g>
      );
    case "bucket":
      return (
        <g>
          <path d="M72 56 L74 30 L146 30 L148 56 Z" fill="#10B981" />
          <ellipse cx="110" cy="58" rx="44" ry="6" fill="#047857" />
          <rect x="100" y="40" width="20" height="3" fill="#065F46" />
        </g>
      );
    case "wizard":
      return (
        <g filter={`url(#${gid}-glow)`}>
          <path d="M75 58 L110 0 L145 58 Z" fill="#4C1D95" />
          {/* stars */}
          <text x="105" y="42" fontSize="10" fill="#FBBF24">★</text>
          <text x="115" y="28" fontSize="6" fill="#FBBF24">✦</text>
          <text x="95" y="50" fontSize="6" fill="#FBBF24">✦</text>
          {/* brim */}
          <ellipse cx="110" cy="58" rx="46" ry="5" fill="#3B0764" />
        </g>
      );
    case "headphone":
      return (
        <g>
          <path d="M65 75 Q65 40 110 40 Q155 40 155 75" stroke="#0F172A" strokeWidth="5" fill="none" />
          <rect x="55" y="72" width="16" height="22" rx="4" fill="#EF4444" />
          <rect x="149" y="72" width="16" height="22" rx="4" fill="#EF4444" />
          <circle cx="63" cy="83" r="3" fill="#FCA5A5" />
          <circle cx="157" cy="83" r="3" fill="#FCA5A5" />
        </g>
      );
    case "cap":
    default:
      return (
        <g>
          <path d="M68 58 Q68 32 110 32 Q152 32 152 58 L152 64 L68 64 Z" fill="#3B82F6" />
          <path d="M110 58 Q152 58 170 70 L170 76 Q152 68 110 68 Z" fill="#1E40AF" />
          <circle cx="110" cy="44" r="6" fill="white" />
          <text x="110" y="48" textAnchor="middle" fill="#3B82F6" fontSize="9" fontWeight="800" fontFamily="Arial">F</text>
        </g>
      );
  }
}
