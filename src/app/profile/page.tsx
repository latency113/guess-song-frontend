"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Trophy,
  ShieldCheck,
  Gamepad2,
  Sparkles,
  CheckCircle,
  Play,
  RotateCcw,
  LogOut,
  Calendar,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, stats, isLoading, openAuthModal, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center flex-1 flex flex-col justify-center">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto mb-4 flex items-center justify-center text-zinc-400">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">ยังไม่ได้เข้าสู่ระบบ</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            เข้าสู่ระบบเพื่อดูประวัติการเล่นเกม สถิติความเร็ว และคะแนนสูงสุดของคุณ
          </p>
          <div className="space-y-2.5">
            <button
              onClick={() => openAuthModal("login")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-violet-600/25 hover:opacity-95 transition-all"
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => openAuthModal("register")}
              className="w-full py-3 rounded-xl glass-panel border border-white/10 text-zinc-300 font-semibold text-xs hover:bg-white/10 transition-all"
            >
              สมัครสมาชิกใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1">
      {/* Profile Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-600/20 via-pink-600/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 p-1 shadow-xl shadow-purple-600/30 overflow-hidden">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.displayName}
                className="w-full h-full object-cover rounded-[20px] bg-zinc-900"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Argon2id Protected Account</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {user.displayName}
              </h1>
              <p className="text-xs text-zinc-400 font-mono">@{user.username}</p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="p-4 rounded-2xl glass-panel border border-white/10 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-zinc-400 mb-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>คะแนนสูงสุด</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-400">
            {stats ? stats.highestScore.toLocaleString() : 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/10 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-zinc-400 mb-1">
            <Gamepad2 className="w-3.5 h-3.5 text-violet-400" />
            <span>จำนวนเกมที่เล่น</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {stats ? stats.totalGames : 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/10 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-zinc-400 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>ความแม่นยำ</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {stats ? stats.accuracy : 0}%
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/10 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-zinc-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>คะแนนสะสมรวม</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-pink-400">
            {stats ? stats.totalScore.toLocaleString() : 0}
          </div>
        </div>
      </div>

      {/* Quick Play CTA */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-pink-400" />
          ประวัติการเล่นล่าสุด
        </h2>
        <button
          onClick={() => router.push("/play")}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5 hover:opacity-90 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> เล่นรอบใหม่
        </button>
      </div>

      {/* History List */}
      {stats && stats.recentGames && stats.recentGames.length > 0 ? (
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <div className="divide-y divide-white/5">
            {stats.recentGames.map((game: any) => (
              <div key={game.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div>
                  <span className="text-xs font-bold text-white block">{game.category}</span>
                  <span className="text-[11px] text-zinc-400">
                    ถูก {game.correctCount}/{game.totalRounds} ข้อ ({game.timeTakenSec.toFixed(1)}s)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-pink-400">
                    +{game.score.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-1">pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-8 text-center border border-white/10">
          <p className="text-xs text-zinc-400 mb-3">ยังไม่มีประวัติการเล่น</p>
          <button
            onClick={() => router.push("/play")}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
          >
            เริ่มเล่นเกมแรกของคุณ
          </button>
        </div>
      )}
    </div>
  );
}
