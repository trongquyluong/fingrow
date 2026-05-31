/**
 * ShopTab.tsx — Avatar customization shop.
 * Live preview at top, slot tabs (Hair/Hat/Glasses/Outfit/Background),
 * grid of items with prices. Spend coins, equip purchased items.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Coins, Check, Lock, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { AvatarState, AvatarSlot, MascotMood, ShopItem } from "../types";
import { SHOP_ITEMS } from "../constants";
import Avatar from "./Avatar";

interface ShopTabProps {
  coins: number;
  avatar: AvatarState;
  mood: MascotMood;
  onBuy: (itemId: string, cost: number) => void;
  onEquip: (slot: AvatarSlot, itemId: string | null) => void;
  onSetColors?: (colors: { skinTone?: string; hairColor?: string; eyeColor?: string }) => void;
}

const SKIN_TONES = ["#FDDEC0", "#FDD9B5", "#F1C27D", "#E0AC69", "#C68642", "#8D5524", "#5A3A1B"];
const HAIR_COLORS = ["#1F1108", "#3D2914", "#6B4226", "#A0522D", "#D4A017", "#E5C07B", "#F4D03F", "#E74C3C", "#9333EA", "#3B82F6", "#10B981", "#EC4899"];
const EYE_COLORS  = ["#3B2A1F", "#8B5A2B", "#1E40AF", "#0EA5E9", "#10B981", "#7C3AED", "#9CA3AF"];

const SLOTS: { id: AvatarSlot; label: string; icon: string }[] = [
  { id: "face",       label: "Face",       icon: "🧑" },
  { id: "hair",       label: "Hair",       icon: "💇" },
  { id: "brows",      label: "Brows",      icon: "👁️" },
  { id: "eyes",       label: "Eyes",       icon: "👀" },
  { id: "mouth",      label: "Mouth",      icon: "👄" },
  { id: "hat",        label: "Hats",       icon: "🎩" },
  { id: "glasses",    label: "Glasses",    icon: "🕶️" },
  { id: "outfit",     label: "Outfits",    icon: "👕" },
  { id: "accessory",  label: "Accessory",  icon: "💎" },
  { id: "background", label: "Backdrop",   icon: "🌌" },
];

const RARITY_STYLE: Record<string, { ring: string; label: string; glow: string }> = {
  common:    { ring: "border-slate-500/40",  label: "text-slate-400",  glow: "" },
  rare:      { ring: "border-blue-500/50",   label: "text-blue-400",   glow: "shadow-blue-500/20" },
  epic:      { ring: "border-violet-500/60", label: "text-violet-400", glow: "shadow-violet-500/30" },
  legendary: { ring: "border-amber-500/60",  label: "text-amber-400",  glow: "shadow-amber-500/40" },
};

export default function ShopTab({ coins, avatar, mood, onBuy, onEquip, onSetColors }: ShopTabProps) {
  const [activeSlot, setActiveSlot] = useState<AvatarSlot>("hair");
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);

  const slotItems = SHOP_ITEMS.filter(i => i.slot === activeSlot);
  const equippedId = avatar.equipped[activeSlot];

  // Build preview avatar based on equipped items (we look them up to get variants)
  const equippedItem = (slot: AvatarSlot) => {
    const id = avatar.equipped[slot];
    if (!id) return undefined;
    return SHOP_ITEMS.find(i => i.id === id)?.variant;
  };

  const handleBuyConfirm = (item: ShopItem) => {
    if (coins < item.cost) return;
    onBuy(item.id, item.cost);
    onEquip(item.slot, item.id);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.4 },
      colors: ["#A855F7", "#06B6D4", "#FBBF24", "#22C55E"],
    });
    setConfirmItem(null);
  };

  return (
    <motion.div
      key="shop"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-5"
    >
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Character Shop</h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Spend coins to customize your buddy</p>
      </div>

      {/* ── Live preview ── */}
      <div className="relative rounded-[28px] overflow-hidden">
        <Avatar
          face={equippedItem("face")}
          hair={equippedItem("hair")}
          brows={equippedItem("brows")}
          eyes={equippedItem("eyes")}
          mouth={equippedItem("mouth")}
          hat={equippedItem("hat")}
          glasses={equippedItem("glasses")}
          outfit={equippedItem("outfit")}
          accessory={equippedItem("accessory")}
          background={equippedItem("background")}
          skinTone={avatar.skinTone}
          hairColor={avatar.hairColor}
          eyeColor={avatar.eyeColor}
          mood={mood}
          size={300}
          className="w-full h-auto"
        />
        {/* Floating coin balance */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/10">
          <Coins size={14} className="text-yellow-400 fill-yellow-400/40" />
          <span className="font-bold text-sm tabular-nums">{coins.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Color pickers ── */}
      {onSetColors && (
        <div className="card-base !p-4 flex flex-col gap-3.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Colors</p>
          <ColorRow label="Skin"  colors={SKIN_TONES}  active={avatar.skinTone}  onPick={v => onSetColors({ skinTone: v })} />
          <ColorRow label="Hair"  colors={HAIR_COLORS} active={avatar.hairColor} onPick={v => onSetColors({ hairColor: v })} />
          <ColorRow label="Eyes"  colors={EYE_COLORS}  active={avatar.eyeColor}  onPick={v => onSetColors({ eyeColor: v })} />
        </div>
      )}

      {/* ── Slot tabs ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {SLOTS.map(s => {
          const active = activeSlot === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSlot(s.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border whitespace-nowrap font-bold text-xs transition-all active:scale-95 ${
                active
                  ? "bg-violet-500/15 border-violet-500/40 text-violet-500"
                  : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]"
              }`}
            >
              <span className="text-sm">{s.icon}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ── Items grid ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {slotItems.map(item => {
          const owned = avatar.owned.includes(item.id);
          const equipped = equippedId === item.id;
          const canAfford = coins >= item.cost;
          const onClick = () => {
            if (equipped) {
              // Unequip optional slots; required ones stay
              if (item.slot === "hat" || item.slot === "glasses" || item.slot === "accessory") {
                onEquip(item.slot, null);
              }
            } else if (owned) {
              onEquip(item.slot, item.id);
            } else if (canAfford) {
              setConfirmItem(item);
            }
          };
          const rarity = item.rarity ?? "common";
          const rarityStyle = RARITY_STYLE[rarity];

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.96 }}
              onClick={onClick}
              className={`relative aspect-square rounded-2xl border-2 overflow-hidden transition-all ${
                equipped
                  ? "border-violet-500 shadow-lg shadow-violet-500/30"
                  : owned
                    ? `${rarityStyle.ring} hover:border-violet-500/40`
                    : canAfford
                      ? `${rarityStyle.ring} ${rarityStyle.glow} shadow-lg`
                      : "border-[var(--border-color)] opacity-50"
              }`}
            >
              {/* Mini avatar preview with this item applied */}
              <Avatar
                face={item.slot === "face" ? item.variant : equippedItem("face")}
                hair={item.slot === "hair" ? item.variant : equippedItem("hair")}
                brows={item.slot === "brows" ? item.variant : equippedItem("brows")}
                eyes={item.slot === "eyes" ? item.variant : equippedItem("eyes")}
                mouth={item.slot === "mouth" ? item.variant : equippedItem("mouth")}
                hat={item.slot === "hat" ? item.variant : equippedItem("hat")}
                glasses={item.slot === "glasses" ? item.variant : equippedItem("glasses")}
                outfit={item.slot === "outfit" ? item.variant : equippedItem("outfit")}
                accessory={item.slot === "accessory" ? item.variant : equippedItem("accessory")}
                background={item.slot === "background" ? item.variant : equippedItem("background")}
                skinTone={avatar.skinTone}
                hairColor={avatar.hairColor}
                eyeColor={avatar.eyeColor}
                mood="happy"
                staticFace={item.slot === "eyes" || item.slot === "mouth" || item.slot === "brows"}
                size={120}
                className="w-full h-full"
              />

              {/* Status badge */}
              <div className="absolute top-1.5 right-1.5">
                {equipped ? (
                  <div className="bg-violet-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : owned ? (
                  <div className="bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles size={11} />
                  </div>
                ) : !canAfford ? (
                  <div className="bg-red-500/80 text-white w-6 h-6 rounded-full flex items-center justify-center">
                    <Lock size={11} />
                  </div>
                ) : null}
              </div>

              {/* Rarity tag (top-left) */}
              {rarity !== "common" && (
                <div
                  className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-sm ${rarityStyle.label}`}
                >
                  {rarity}
                </div>
              )}

              {/* Price strip */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-3">
                <p className="text-[10px] font-bold text-white truncate text-left">{item.name}</p>
                {!owned && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <Coins size={9} className="text-yellow-400 fill-yellow-400/40" />
                    <span className="text-[10px] font-bold text-yellow-300 tabular-nums">{item.cost}</span>
                  </div>
                )}
                {equipped && (
                  <p className="text-[9px] font-bold text-violet-300 uppercase tracking-wider mt-0.5">Equipped</p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Purchase Confirm Modal ── */}
      <AnimatePresence>
        {confirmItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-5"
            onClick={() => setConfirmItem(null)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 24 }}
              className="relative w-full max-w-sm bg-[var(--bg-card)] rounded-3xl p-6 flex flex-col items-center gap-4 border border-[var(--border-color)]"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden">
                <Avatar
                  face={confirmItem.slot === "face" ? confirmItem.variant : equippedItem("face")}
                  hair={confirmItem.slot === "hair" ? confirmItem.variant : equippedItem("hair")}
                  brows={confirmItem.slot === "brows" ? confirmItem.variant : equippedItem("brows")}
                  eyes={confirmItem.slot === "eyes" ? confirmItem.variant : equippedItem("eyes")}
                  mouth={confirmItem.slot === "mouth" ? confirmItem.variant : equippedItem("mouth")}
                  hat={confirmItem.slot === "hat" ? confirmItem.variant : equippedItem("hat")}
                  glasses={confirmItem.slot === "glasses" ? confirmItem.variant : equippedItem("glasses")}
                  outfit={confirmItem.slot === "outfit" ? confirmItem.variant : equippedItem("outfit")}
                  accessory={confirmItem.slot === "accessory" ? confirmItem.variant : equippedItem("accessory")}
                  background={confirmItem.slot === "background" ? confirmItem.variant : equippedItem("background")}
                  skinTone={avatar.skinTone}
                  hairColor={avatar.hairColor}
                  eyeColor={avatar.eyeColor}
                  mood="happy"
                  staticFace={confirmItem.slot === "eyes" || confirmItem.slot === "mouth" || confirmItem.slot === "brows"}
                  size={96}
                  className="w-full h-full"
                />
              </div>
              <div className="text-center">
                <h3 className="font-extrabold text-lg">{confirmItem.name}</h3>
                {confirmItem.description && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">{confirmItem.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full">
                <Coins size={16} className="text-yellow-500 fill-yellow-500/40" />
                <span className="font-extrabold text-yellow-500 tabular-nums">{confirmItem.cost.toLocaleString()}</span>
              </div>
              <div className="flex gap-2 w-full mt-2">
                <button
                  onClick={() => setConfirmItem(null)}
                  className="flex-1 py-3 rounded-2xl bg-[var(--bg-elevated)] font-bold text-sm text-[var(--text-muted)] active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBuyConfirm(confirmItem)}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-500/20 active:scale-95 transition-transform"
                >
                  Buy & Equip
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Balance after: <span className="font-bold tabular-nums">{(coins - confirmItem.cost).toLocaleString()}</span> coins
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Color picker row ──────────────────────────────────────────────────────
function ColorRow({
  label,
  colors,
  active,
  onPick,
}: {
  label: string;
  colors: string[];
  active: string;
  onPick: (color: string) => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] w-12 pt-1.5 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-2 flex-1">
        {colors.map(c => (
          <button
            key={c}
            onClick={() => onPick(c)}
            className={`w-7 h-7 rounded-full border-2 transition-all shrink-0 ${
              active.toLowerCase() === c.toLowerCase()
                ? "border-violet-500 scale-110 shadow-md shadow-violet-500/30"
                : "border-white/20 hover:scale-105"
            }`}
            style={{ backgroundColor: c }}
            aria-label={`${label} ${c}`}
          />
        ))}
      </div>
    </div>
  );
}
