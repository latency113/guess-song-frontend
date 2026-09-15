"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { soundEngine } from "@/lib/audio";
import { Music, Trophy, User, LogOut, Volume2, VolumeX, Sparkles } from "lucide-react";

export default function Navbar() {
  const { user, stats, logout, openAuthModal } = useAuth();
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    soundEngine.isMuted = !soundEngine.isMuted;
    setIsMuted(soundEngine.isMuted);
  };

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 md:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 p-0.5 shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-zinc-950/80 rounded-[10px] flex items-center justify-center">
              <Music className="w-5 h-5 text-pink-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-violet-400 via-fuchsia-300 to-pink-400 bg-clip-text text-transparent">
                INTRO QUIZ
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">เกมทายเพลงจากเสียงดนตรี</p>
          </div>
        </Link>

        {/* Center navigation */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <Link
            href="/"
            className="px-4 py-1.5 text-sm font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            เลือกหมวดหมู่
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            ตารางอันดับ
          </Link>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Mute toggle button */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-zinc-300" />}
          </button>

          {/* Leaderboard icon on mobile */}
          <Link
            href="/leaderboard"
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-amber-400 hover:bg-white/10"
          >
            <Trophy className="w-4 h-4" />
          </Link>

          {/* User Auth state */}
          {user ? (
            <div className="flex items-center gap-2.5">
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/50 hover:bg-white/10 transition-all"
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 p-0.5 overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-zinc-300" />
                    </div>
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-zinc-200 truncate max-w-[120px]">
                    {user.displayName}
                  </div>
                  {stats && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      {stats.highestScore} pts
                    </div>
                  )}
                </div>
              </Link>
              <button
                onClick={logout}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal("login")}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => openAuthModal("register")}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md shadow-violet-600/25 hover:opacity-95 active:scale-95 transition-all"
              >
                สมัครเล่น
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
