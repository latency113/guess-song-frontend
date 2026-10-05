"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAudio } from "@/context/AudioContext";
import { Volume2, Volume1, VolumeX, Minus, Plus } from "lucide-react";

interface VolumeControlProps {
  variant?: "compact" | "full" | "panel";
  className?: string;
  showShortcutsHint?: boolean;
}

export default function VolumeControl({
  variant = "full",
  className = "",
  showShortcutsHint = false,
}: VolumeControlProps) {
  const {
    volume,
    isMuted,
    effectiveVolume,
    setVolume,
    toggleMute,
    increaseVolume,
    decreaseVolume,
  } = useAudio();

  const [isHovered, setIsHovered] = useState(false);
  const [isOpenPopover, setIsOpenPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpenPopover(false);
      }
    }
    if (isOpenPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpenPopover]);

  const percent = Math.round(effectiveVolume * 100);

  const getVolumeIcon = (size = "w-4 h-4") => {
    if (isMuted || volume === 0) {
      return <VolumeX className={`${size} text-rose-400`} />;
    }
    if (volume < 0.5) {
      return <Volume1 className={`${size} text-zinc-300`} />;
    }
    return <Volume2 className={`${size} text-zinc-200`} />;
  };

  // Compact Variant (Used in Navbar)
  if (variant === "compact") {
    return (
      <div
        ref={popoverRef}
        className={`relative flex items-center ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          onClick={toggleMute}
          onContextMenu={(e) => {
            e.preventDefault();
            setIsOpenPopover((prev) => !prev);
          }}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/40 text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center relative group"
          title={isMuted ? "เปิดเสียง (Unmute)" : `ปิดเสียง (Mute) - ปัจจุบัน ${percent}%`}
          aria-label={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
        >
          {getVolumeIcon()}
          {isMuted && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        {/* Hover / Click slider popover */}
        <div
          className={`absolute right-0 top-full mt-2 z-50 transition-all duration-200 origin-top-right ${
            isHovered || isOpenPopover
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl glass-panel border border-violet-500/30 shadow-2xl backdrop-blur-xl bg-zinc-950/90 w-44">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="เปิด/ปิดเสียง"
            >
              {getVolumeIcon("w-3.5 h-3.5")}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effectiveVolume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #ec4899 0%, #a855f7 ${percent}%, #27272a ${percent}%, #27272a 100%)`,
              }}
            />

            <span className="text-[11px] font-mono font-bold text-zinc-300 w-8 text-right shrink-0">
              {percent}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Panel Variant (Used in Pre-game Screen)
  if (variant === "panel") {
    return (
      <div className={`p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
            >
              {getVolumeIcon("w-4 h-4")}
            </button>
            <span className="text-xs font-semibold text-zinc-200">
              ระดับเสียงเพลง (Volume)
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-pink-400">
            {isMuted ? "ปิดเสียง" : `${percent}%`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => decreaseVolume(0.1)}
            disabled={effectiveVolume <= 0}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
            title="ลดเสียง 10%"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effectiveVolume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #ec4899 0%, #8b5cf6 ${percent}%, #27272a ${percent}%, #27272a 100%)`,
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => increaseVolume(0.1)}
            disabled={effectiveVolume >= 1}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
            title="เพิ่มเสียง 10%"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {showShortcutsHint && (
          <div className="mt-2 text-[10px] text-zinc-500 text-center flex items-center justify-center gap-2">
            <span>คีย์ลัด:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px] text-zinc-400">M</kbd>
            <span>เปิด/ปิดเสียง</span>
            <span>•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px] text-zinc-400">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px] text-zinc-400">↓</kbd>
            <span>เพิ่ม/ลดเสียง</span>
          </div>
        )}
      </div>
    );
  }

  // Full / In-game Variant (For Quiz Game Deck)
  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-2xl glass-panel border border-white/10 shadow-lg ${className}`}>
      {/* Mute / Unmute Button */}
      <button
        type="button"
        onClick={toggleMute}
        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/40 text-zinc-300 hover:text-white transition-all shrink-0"
        title={isMuted ? "เปิดเสียง (Unmute)" : "ปิดเสียง (Mute)"}
      >
        {getVolumeIcon("w-4 h-4")}
      </button>

      {/* Decrease volume button */}
      <button
        type="button"
        onClick={() => decreaseVolume(0.1)}
        disabled={effectiveVolume <= 0}
        className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors shrink-0"
        title="ลดเสียง 10% (-)"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      {/* Slider */}
      <div className="relative w-20 sm:w-28 flex items-center">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={effectiveVolume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none"
          style={{
            background: `linear-gradient(to right, #ec4899 0%, #8b5cf6 ${percent}%, #27272a ${percent}%, #27272a 100%)`,
          }}
          title={`ระดับเสียง: ${percent}%`}
        />
      </div>

      {/* Increase volume button */}
      <button
        type="button"
        onClick={() => increaseVolume(0.1)}
        disabled={effectiveVolume >= 1}
        className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors shrink-0"
        title="เพิ่มเสียง 10% (+)"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Percentage Readout */}
      <span className="text-[11px] font-mono font-bold text-pink-300 w-8 text-right shrink-0">
        {isMuted ? "MUTE" : `${percent}%`}
      </span>
    </div>
  );
}
