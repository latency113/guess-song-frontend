"use client";

import { Timer } from "lucide-react";

interface TimerBarProps {
  timeLeft: number;
  totalTime: number;
}

export default function TimerBar({ timeLeft, totalTime }: TimerBarProps) {
  const percentage = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  // Determine color and intensity based on time left
  let colorGradient = "from-cyan-500 to-violet-500";
  let textColor = "text-cyan-400";
  let glowStyle = "shadow-[0_0_15px_rgba(6,182,212,0.4)]";

  if (timeLeft <= 3) {
    colorGradient = "from-red-600 via-rose-500 to-amber-500 animate-pulse";
    textColor = "text-rose-400";
    glowStyle = "shadow-[0_0_20px_rgba(244,63,94,0.7)]";
  } else if (timeLeft <= 5) {
    colorGradient = "from-amber-500 to-rose-500";
    textColor = "text-amber-400";
    glowStyle = "shadow-[0_0_15px_rgba(245,158,11,0.5)]";
  }

  return (
    <div className="w-full max-w-xl mx-auto mb-6">
      {/* Time Header */}
      <div className="flex items-center justify-between mb-1.5 px-1 text-xs">
        <div className="flex items-center gap-1 text-zinc-400">
          <Timer className="w-3.5 h-3.5" />
          <span>เวลาในการทาย</span>
        </div>
        <div className={`font-mono font-bold text-sm ${textColor}`}>
          {timeLeft.toFixed(1)}s
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-3 bg-zinc-900/90 rounded-full p-0.5 border border-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorGradient} ${glowStyle} transition-all duration-100 ease-linear`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
