"use client";

import { Disc3, Volume2 } from "lucide-react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  artworkUrl?: string;
  roundIndex: number;
  totalRounds: number;
}

export default function AudioVisualizer({
  isPlaying,
  artworkUrl,
  roundIndex,
  totalRounds,
}: AudioVisualizerProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      {/* Outer Glowing Ring */}
      <div
        className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center transition-all duration-700 ${
          isPlaying
            ? "shadow-[0_0_60px_rgba(236,72,153,0.5),0_0_100px_rgba(139,92,246,0.3)]"
            : "shadow-lg shadow-black/60 opacity-90"
        }`}
      >
        {/* Animated pulsating aura */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600/40 via-fuchsia-600/30 to-pink-500/40 blur-xl transition-opacity duration-500 ${
            isPlaying ? "opacity-100 animate-pulse" : "opacity-0"
          }`}
        />

        {/* Vinyl Disc Container */}
        <div
          className={`relative w-full h-full rounded-full bg-zinc-950 p-2.5 border-4 border-zinc-800 shadow-2xl flex items-center justify-center ${
            isPlaying ? "animate-spin-slow" : ""
          }`}
          style={{
            backgroundImage:
              "radial-gradient(circle, #1a1a24 15%, #0d0d12 35%, #181824 55%, #08080c 75%, #000 100%)",
          }}
        >
          {/* Vinyl grooves */}
          <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none" />
          <div className="absolute inset-8 rounded-full border border-white/5 pointer-events-none" />
          <div className="absolute inset-12 rounded-full border border-white/5 pointer-events-none" />

          {/* Center Label / Hidden Artwork */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-pink-600 to-violet-600 p-1 flex items-center justify-center shadow-lg relative overflow-hidden">
            {artworkUrl ? (
              <img
                src={artworkUrl}
                alt="Album Cover"
                className="w-full h-full object-cover rounded-full filter blur-[10px] scale-110"
              />
            ) : (
              <Disc3 className="w-8 h-8 text-white/90" />
            )}

            {/* Center Spindle Hole */}
            <div className="absolute w-4 h-4 rounded-full bg-zinc-950 border-2 border-zinc-400" />
          </div>
        </div>
      </div>

      {/* Intro Status Pill */}
      <div className="mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-violet-500/30 shadow-lg">
        {isPlaying ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
            <Volume2 className="w-4 h-4 text-pink-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide text-pink-300">
              กำลังเล่น INTRO เพลงที่ {roundIndex}/{totalRounds}
            </span>
          </>
        ) : (
          <span className="text-xs text-zinc-400">หมดเวลา / เลือกคำตอบ</span>
        )}
      </div>

      {/* Equalizer Frequency Bars */}
      <div className="flex items-end gap-1 sm:gap-1.5 h-8 mt-4 px-4">
        {[24, 48, 72, 90, 60, 85, 40, 95, 65, 35, 75, 50, 80, 30].map((baseHeight, i) => (
          <div
            key={i}
            className={`w-1 sm:w-1.5 rounded-full transition-all duration-200 ${
              isPlaying
                ? "bg-gradient-to-t from-violet-500 to-pink-400"
                : "bg-zinc-700 h-1.5"
            }`}
            style={{
              height: isPlaying ? `${Math.max(15, (baseHeight + (i % 3) * 12) % 100)}%` : "6px",
              animation: isPlaying ? `equalizer-bar ${0.4 + (i % 4) * 0.15}s infinite ease-in-out alternate` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}
