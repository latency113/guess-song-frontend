"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, LeaderboardItem } from "@/lib/api";
import {
  Trophy,
  Medal,
  Crown,
  Sparkles,
  Gamepad2,
  Users,
  Award,
  Loader2,
  Play,
  Mic2,
  MicOff,
  Volume2,
  Radio,
} from "lucide-react";

function getModeBadge(mode?: string) {
  if (mode === "instrumental") {
    return {
      label: "โหมดตัดเสียงร้อง",
      shortLabel: "ตัดเสียงร้อง",
      icon: <MicOff className="w-3 h-3 text-teal-400" />,
      style: "bg-teal-500/10 border-teal-500/30 text-teal-300",
    };
  }
  if (mode === "normal") {
    return {
      label: "โหมดอินโทรปกติ",
      shortLabel: "อินโทรปกติ",
      icon: <Volume2 className="w-3 h-3 text-violet-400" />,
      style: "bg-violet-500/10 border-violet-500/30 text-violet-300",
    };
  }
  return {
    label: "โหมดดัดเสียงร้อง",
    shortLabel: "ดัดเสียงร้อง",
    icon: <Mic2 className="w-3 h-3 text-pink-400" />,
    style: "bg-pink-500/10 border-pink-500/30 text-pink-300",
  };
}

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "ALL";
  const initialMode = searchParams.get("mode") || "ALL";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedMode, setSelectedMode] = useState<string>(initialMode);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [globalStats, setGlobalStats] = useState<{ totalGames: number; highestScore: number; totalUsers: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    { id: "ALL", label: "ทั้งหมด (All Categories)" },
    { id: "THAI_HITS", label: "เพลงไทยยอดฮิต" },
    { id: "THAI_INDIE_ROCK", label: "ไทยอินดี้ & ร็อก" },
    { id: "GLOBAL_POP", label: "เพลงสากลยอดนิยม" },
    { id: "GLOBAL_CLASSIC", label: "สากลคลาสสิก" },
  ];

  const modes = [
    { id: "ALL", label: "ทุกโหมด (All Modes)", icon: Sparkles },
    { id: "disguised", label: "โหมดดัดเสียงร้อง", icon: Mic2, color: "text-pink-400" },
    { id: "instrumental", label: "โหมดตัดเสียงร้อง", icon: MicOff, color: "text-teal-400" },
    { id: "normal", label: "โหมดอินโทรปกติ", icon: Volume2, color: "text-violet-400" },
  ];

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [lb, stats] = await Promise.all([
          api.getLeaderboard(selectedCategory, 50, selectedMode),
          api.getGlobalStats(),
        ]);
        setLeaderboard(lb);
        setGlobalStats(stats);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedCategory, selectedMode]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const rest = leaderboard.slice(3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
          <Trophy className="w-3.5 h-3.5" />
          <span>Hall of Fame & Top Players</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          ตารางอันดับผู้นำ{" "}
          <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
            LEADERBOARD
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2">
          จัดอันดับผู้เล่นที่ทายเพลงได้เร็วและแม่นยำที่สุด แยกตามโหมดการเล่นและหมวดหมู่เพลง
        </p>
      </div>

      {/* Global Stats Overview Cards */}
      {globalStats && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto mb-8">
          <div className="p-4 rounded-2xl glass-panel border border-white/10 text-center">
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-xs mb-1">
              <Gamepad2 className="w-4 h-4 text-violet-400" />
              <span>จำนวนการเล่น</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {globalStats.totalGames.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-amber-500/30 text-center shadow-lg shadow-amber-500/5">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs mb-1">
              <Crown className="w-4 h-4" />
              <span>คะแนนสูงสุด</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-400">
              {globalStats.highestScore.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-white/10 text-center">
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-xs mb-1">
              <Users className="w-4 h-4 text-pink-400" />
              <span>ผู้เล่นลงทะเบียน</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {globalStats.totalUsers.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* 1. Mode Filter Tabs (Primary Filter) */}
      <div className="max-w-3xl mx-auto mb-4">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-pink-400" />
          <span>เลือกโหมดการเล่น (Game Mode)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {modes.map((m) => {
            const IconComponent = m.icon;
            const isSelected = selectedMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  isSelected
                    ? "bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 border-pink-500 text-white shadow-lg shadow-pink-600/20 scale-[1.02]"
                    : "glass-panel border-white/10 text-zinc-400 hover:text-white hover:border-white/20 bg-white/5"
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isSelected ? "text-white" : m.color || "text-zinc-400"}`} />
                <span className="truncate">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Category Filter Tabs (Secondary Filter) */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? "bg-white/20 border border-white/40 text-white shadow-md"
                  : "glass-panel border border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-3" />
          <p className="text-xs text-zinc-400">กำลังดึงตารางอันดับล่าสุด...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto border border-white/10">
          <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base">ยังไม่มีคะแนนในโหมด/หมวดนี้</h3>
          <p className="text-xs text-zinc-400 mt-1 mb-6">เป็นคนแรกที่เล่นและขึ้นเป็นอันดับ 1 ของตาราง!</p>
          <Link
            href={`/play?category=${selectedCategory === "ALL" ? "THAI_HITS" : selectedCategory}&mode=${selectedMode === "ALL" ? "disguised" : selectedMode}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xs font-bold shadow-lg"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> เริ่มเล่นในโหมดนี้เลย
          </Link>
        </div>
      ) : (
        <>
          {/* Podium Top 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto items-end mb-12">
            {/* 2nd Place */}
            {top2 && (
              <div className="order-2 sm:order-1 glass-panel p-5 rounded-3xl border border-slate-400/30 text-center relative overflow-hidden shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-slate-300/10 border border-slate-300/30 mx-auto mb-2 flex items-center justify-center text-slate-200">
                  <Medal className="w-6 h-6 text-slate-300" />
                </div>
                <div className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-400/20 text-slate-300 mb-1">
                  อันดับ 2
                </div>
                <h3 className="font-bold text-white text-sm truncate">{top2.displayName}</h3>
                
                {/* Mode badge for 2nd */}
                {top2.mode && (
                  <div className="mt-1 mb-1">
                    {(() => {
                      const badge = getModeBadge(top2.mode);
                      return (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.style}`}>
                          {badge.icon}
                          <span>{badge.shortLabel}</span>
                        </span>
                      );
                    })()}
                  </div>
                )}

                <div className="text-2xl font-black text-slate-200 my-1">
                  {top2.score.toLocaleString()} <span className="text-xs font-normal text-zinc-400">pts</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  ถูก {top2.correctCount}/{top2.totalRounds} • {top2.timeTakenSec.toFixed(1)}s
                </div>
              </div>
            )}

            {/* 1st Place (Center & Elevated) */}
            {top1 && (
              <div className="order-1 sm:order-2 glass-panel p-6 rounded-3xl border border-amber-500/50 text-center relative overflow-hidden shadow-2xl shadow-amber-500/10 sm:-translate-y-4 bg-gradient-to-b from-amber-500/10 to-transparent">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-600 p-0.5 mx-auto mb-2 shadow-xl shadow-amber-500/30 flex items-center justify-center">
                  <div className="w-full h-full bg-zinc-950/80 rounded-[22px] flex items-center justify-center">
                    <Crown className="w-8 h-8 text-amber-400 animate-bounce" />
                  </div>
                </div>
                <div className="inline-block text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 mb-1 border border-amber-500/40">
                  🏆 แชมป์อันดับ 1
                </div>
                <h3 className="font-extrabold text-white text-base truncate">{top1.displayName}</h3>
                
                {/* Mode badge for 1st */}
                {top1.mode && (
                  <div className="mt-1 mb-1">
                    {(() => {
                      const badge = getModeBadge(top1.mode);
                      return (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.style}`}>
                          {badge.icon}
                          <span>{badge.shortLabel}</span>
                        </span>
                      );
                    })()}
                  </div>
                )}

                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 my-1 neon-text-glow">
                  {top1.score.toLocaleString()} <span className="text-xs font-normal text-amber-300">pts</span>
                </div>
                <div className="text-xs text-amber-300/80 font-medium">
                  ความแม่นยำ {Math.round((top1.correctCount / top1.totalRounds) * 100)}% ({top1.timeTakenSec.toFixed(1)}s)
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className="order-3 glass-panel p-5 rounded-3xl border border-amber-700/30 text-center relative overflow-hidden shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-700/10 border border-amber-700/30 mx-auto mb-2 flex items-center justify-center text-amber-600">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-700/20 text-amber-500 mb-1">
                  อันดับ 3
                </div>
                <h3 className="font-bold text-white text-sm truncate">{top3.displayName}</h3>
                
                {/* Mode badge for 3rd */}
                {top3.mode && (
                  <div className="mt-1 mb-1">
                    {(() => {
                      const badge = getModeBadge(top3.mode);
                      return (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.style}`}>
                          {badge.icon}
                          <span>{badge.shortLabel}</span>
                        </span>
                      );
                    })()}
                  </div>
                )}

                <div className="text-2xl font-black text-amber-500 my-1">
                  {top3.score.toLocaleString()} <span className="text-xs font-normal text-zinc-400">pts</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  ถูก {top3.correctCount}/{top3.totalRounds} • {top3.timeTakenSec.toFixed(1)}s
                </div>
              </div>
            )}
          </div>

          {/* Full Rankings List (4+) */}
          {rest.length > 0 && (
            <div className="max-w-4xl mx-auto glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <span>อันดับ & ผู้เล่น</span>
                <div className="flex items-center gap-4 sm:gap-8">
                  <span className="hidden sm:inline">โหมดการเล่น</span>
                  <span className="hidden sm:inline">หมวดหมู่</span>
                  <span className="hidden sm:inline">เวลา</span>
                  <span>คะแนน</span>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {rest.map((item) => {
                  const badge = getModeBadge(item.mode);
                  return (
                    <div
                      key={item.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="w-7 text-center font-bold text-sm text-zinc-500">
                          #{item.rank}
                        </span>
                        <div>
                          <div className="font-bold text-sm text-white">
                            {item.displayName}
                          </div>
                          <div className="text-[11px] text-zinc-400 sm:hidden flex items-center gap-1 mt-0.5">
                            <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded border ${badge.style}`}>
                              {badge.icon}
                              <span>{badge.shortLabel}</span>
                            </span>
                            <span>• {item.timeTakenSec.toFixed(1)}s</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-8">
                        {/* Mode badge desktop */}
                        <div className="hidden sm:block">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${badge.style}`}>
                            {badge.icon}
                            <span>{badge.shortLabel}</span>
                          </span>
                        </div>

                        <span className="text-xs text-zinc-400 hidden sm:inline">
                          {item.category}
                        </span>
                        <span className="text-xs text-zinc-400 hidden sm:inline">
                          {item.timeTakenSec.toFixed(1)}s
                        </span>
                        <div className="text-right">
                          <span className="font-extrabold text-sm sm:text-base text-pink-300">
                            {item.score.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-zinc-500 ml-1">pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-3" />
          <p className="text-xs text-zinc-400">กำลังโหลด...</p>
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
