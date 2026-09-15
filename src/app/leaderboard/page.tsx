"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, LeaderboardItem } from "@/lib/api";
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Clock,
  Sparkles,
  Gamepad2,
  Users,
  Award,
  Loader2,
  Play,
} from "lucide-react";

export default function LeaderboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [globalStats, setGlobalStats] = useState<{ totalGames: number; highestScore: number; totalUsers: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    { id: "ALL", label: "ทั้งหมด (All)" },
    { id: "THAI_HITS", label: "เพลงไทยยอดฮิต" },
    { id: "THAI_INDIE_ROCK", label: "ไทยอินดี้ & ร็อก" },
    { id: "GLOBAL_POP", label: "เพลงสากลยอดนิยม" },
    { id: "GLOBAL_CLASSIC", label: "สากลคลาสสิก" },
  ];

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [lb, stats] = await Promise.all([
          api.getLeaderboard(selectedCategory, 50),
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
  }, [selectedCategory]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const rest = leaderboard.slice(3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
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
          อันดับผู้เล่นที่ทายเพลงจากเสียง Intro ได้เร็วและแม่นยำที่สุด
        </p>
      </div>

      {/* Global Stats Overview Cards */}
      {globalStats && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto mb-10">
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

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === c.id
                ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-600/25"
                : "glass-panel border border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-3" />
          <p className="text-xs text-zinc-400">กำลังดึงตารางอันดับล่าสุด...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto border border-white/10">
          <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base">ยังไม่มีคะแนนในหมวดหมู่นี้</h3>
          <p className="text-xs text-zinc-400 mt-1 mb-6">เป็นคนแรกที่เล่นและขึ้นเป็นอันดับ 1 ของตาราง!</p>
          <Link
            href="/play"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xs font-bold shadow-lg"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> เริ่มเล่นเลย
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
                <div className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-400/20 text-slate-300 mb-2">
                  อันดับ 2
                </div>
                <h3 className="font-bold text-white text-sm truncate">{top2.displayName}</h3>
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
                <div className="inline-block text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 mb-2 border border-amber-500/40">
                  🏆 แชมป์อันดับ 1
                </div>
                <h3 className="font-extrabold text-white text-base truncate">{top1.displayName}</h3>
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
                <div className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-700/20 text-amber-500 mb-2">
                  อันดับ 3
                </div>
                <h3 className="font-bold text-white text-sm truncate">{top3.displayName}</h3>
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
                <div className="flex items-center gap-6 sm:gap-12">
                  <span className="hidden sm:inline">หมวดหมู่</span>
                  <span className="hidden sm:inline">เวลา</span>
                  <span>คะแนน</span>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {rest.map((item) => (
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
                        <div className="text-[11px] text-zinc-400 sm:hidden">
                          {item.category} • {item.timeTakenSec.toFixed(1)}s
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 sm:gap-12">
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
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
