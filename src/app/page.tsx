"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Category, LeaderboardItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import CategoryCard from "@/components/CategoryCard";
import {
  Zap,
  Trophy,
  Flame,
  Volume2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Award,
  Radio,
  Music2,
  Mic2,
  MicOff,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("THAI_HITS");
  const [roundsCount, setRoundsCount] = useState<number>(10);
  const [gameMode, setGameMode] = useState<"disguised" | "instrumental" | "normal">("disguised");
  const [voiceStyle, setVoiceStyle] = useState<"random" | "chipmunk" | "monster" | "radio">("random");
  const [topScores, setTopScores] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, lb] = await Promise.all([
          api.getCategories(),
          api.getLeaderboard("ALL", 3),
        ]);
        setCategories(cats);
        setTopScores(lb);
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleStartGame = () => {
    router.push(
      `/play?category=${selectedCategory}&rounds=${roundsCount}&mode=${gameMode}&voice=${voiceStyle}`
    );
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-violet-600/20 via-pink-600/15 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 -left-48 w-96 h-96 bg-cyan-600/10 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 -right-48 w-96 h-96 bg-pink-600/10 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-pink-300 mb-6 shadow-lg shadow-pink-500/10">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>เปิดลำโพงหรือเสียบหูฟัง แล้วมาประลองความไวกัน!</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            ทายเพลงจากเสียง{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent neon-text-glow">
              INTRO
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            ฟังเพียงท่อนอินโทรของเพลงฮิต แล้วเลือกคำตอบให้ถูกต้อง
            <strong className="text-white"> ยิ่งทายเร็วยิ่งได้คะแนนเยอะ</strong> ทายผิดได้ 0 คะแนน!
          </p>

          {/* Quick Rules Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>ความเร็ว = คะแนน (สูงสุด 1,000 pts/ข้อ)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Streak Bonus ตอบถูกต่อเนื่อง</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <Trophy className="w-3.5 h-3.5 text-cyan-400" />
              <span>บันทึกชื่อขึ้น Leaderboard</span>
            </div>
          </div>
        </div>

        {/* Game Mode Selection Section */}
        <div className="mb-12">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Music2 className="w-5 h-5 text-pink-400" />
              เลือกโหมดการเล่น (Game Mode)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              เลือกความท้าทาย: ทายจากเนื้อร้องดัดเสียง หรือทายจากเสียงอินโทรต้นฉบับ
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Mode 1: Voice Disguised / Guess by Lyrics */}
            <div
              onClick={() => setGameMode("disguised")}
              className={`relative p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                gameMode === "disguised"
                  ? "bg-gradient-to-br from-violet-900/40 via-purple-900/30 to-pink-900/30 border-pink-500/60 shadow-xl shadow-pink-500/10 ring-1 ring-pink-500/40"
                  : "glass-panel border-white/10 hover:border-white/20 hover:bg-white/5 opacity-75 hover:opacity-100"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 shrink-0">
                      <Mic2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/20 text-[10px] font-bold text-pink-300 mb-0.5">
                        ✨ ยอดนิยม
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        โหมดดัดเสียงร้อง
                      </h3>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                      gameMode === "disguised" ? "border-pink-500 bg-pink-500" : "border-zinc-500"
                    }`}
                  >
                    {gameMode === "disguised" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed">
                  ได้ยินเนื้อเพลงชัดเจน แต่ระบบจะ<strong>ดัดเสียงร้อง (ชิปมังก์/มอนสเตอร์)</strong> เพื่อไม่ให้รู้ว่าใครร้อง ทายจากเนื้อเพลงล้วนๆ
                </p>
              </div>

              {/* Voice Sub-options when selected */}
              {gameMode === "disguised" && (
                <div
                  className="mt-3.5 pt-3 border-t border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-[11px] font-semibold text-zinc-400 mb-1.5">
                    เลือกสไตล์เสียงร้อง:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "random", label: "🎲 สุ่มทุกข้อ" },
                      { id: "chipmunk", label: "🐿️ ชิปมังก์" },
                      { id: "monster", label: "🤖 มอนสเตอร์" },
                      { id: "radio", label: "📻 วิทยุโบราณ" },
                    ].map((voice) => (
                      <button
                        key={voice.id}
                        type="button"
                        onClick={() => setVoiceStyle(voice.id as any)}
                        className={`px-2 py-1.5 rounded-xl text-left border transition-all ${
                          voiceStyle === voice.id
                            ? "bg-pink-500/20 border-pink-500/60 text-white font-bold shadow"
                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <div className="text-xs">{voice.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mode 2: Pure Instrumental / Vocal Cut */}
            <div
              onClick={() => setGameMode("instrumental")}
              className={`relative p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                gameMode === "instrumental"
                  ? "bg-gradient-to-br from-emerald-950/40 via-teal-900/30 to-cyan-950/40 border-emerald-500/60 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                  : "glass-panel border-white/10 hover:border-white/20 hover:bg-white/5 opacity-75 hover:opacity-100"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 shrink-0">
                      <MicOff className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300 mb-0.5">
                        🎸 อินสตรูเมนทัล
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        โหมดตัดเสียงร้อง
                      </h3>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                      gameMode === "instrumental" ? "border-emerald-500 bg-emerald-500" : "border-zinc-500"
                    }`}
                  >
                    {gameMode === "instrumental" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed">
                  ตัดเสียงร้องของศิลปินออก เหลือเฉพาะ<strong>เสียงกีตาร์ กลอง เบส ซินธ์</strong> ทายจากทำนองและฝีมือดนตรีล้วนๆ!
                </p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-white/10 text-[11px] text-emerald-400/90 font-medium">
                ⚡ ระบบ Center Phase Cancellation ตัดเสียงร้องกลาง
              </div>
            </div>

            {/* Mode 3: Original Sound / Intro */}
            <div
              onClick={() => setGameMode("normal")}
              className={`relative p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                gameMode === "normal"
                  ? "bg-gradient-to-br from-violet-900/40 via-purple-900/30 to-pink-900/30 border-violet-500/60 shadow-xl shadow-violet-500/10 ring-1 ring-violet-500/40"
                  : "glass-panel border-white/10 hover:border-white/20 hover:bg-white/5 opacity-75 hover:opacity-100"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 shrink-0">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-300 mb-0.5">
                        🎵 คลาสสิก
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        โหมดอินโทรปกติ
                      </h3>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                      gameMode === "normal" ? "border-violet-500 bg-violet-500" : "border-zinc-500"
                    }`}
                  >
                    {gameMode === "normal" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed">
                  ฟังเสียงเพลงแบบต้นฉบับครบทั้งดนตรีและเสียงร้อง ทายจากจังหวะ คอร์ด ทำนอง และเสียงของศิลปินตัวจริง
                </p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-white/10 text-[11px] text-violet-400/90 font-medium">
                🎧 ฟังเสียงบันทึกเสียงมาสเตอร์คุณภาพสูง
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Headphones className="w-5 h-5 text-violet-400" />
                เลือกหมวดหมู่เพลง
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">เลือกแนวเพลงที่คุณมั่นใจและพร้อมลุย</p>
            </div>

            {/* Rounds Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-white/10">
              <span className="text-[11px] font-medium text-zinc-400 px-2 hidden sm:inline">จำนวนข้อ:</span>
              {[5, 10, 15].map((count) => (
                <button
                  key={count}
                  onClick={() => setRoundsCount(count)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    roundsCount === count
                      ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {count} ข้อ
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                isSelected={selectedCategory === cat.id}
                onSelect={(id) => setSelectedCategory(id)}
              />
            ))}
          </div>

          {/* Big Launch Button */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStartGame}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-bold text-base shadow-xl shadow-purple-600/30 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              <Volume2 className="w-5 h-5 text-pink-200 group-hover:scale-110 transition-transform" />
              <span>เริ่มเล่นเกมทันที ({roundsCount} ข้อ)</span>
              <ArrowRight className="w-5 h-5 text-pink-200 group-hover:translate-x-1 transition-transform" />
            </button>

            {!user && (
              <button
                onClick={() => openAuthModal("register")}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl glass-panel border border-white/10 text-zinc-300 font-semibold text-sm hover:text-white hover:border-violet-500/50 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>สมัครสมาชิกเพื่อเก็บสถิติถาวร</span>
              </button>
            )}
          </div>
        </div>

        {/* Top 3 Leaderboard Teaser */}
        {topScores.length > 0 && (
          <div className="mt-16 max-w-3xl mx-auto rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">ยอดฝีมือประจำตารางอันดับ</h3>
                  <p className="text-xs text-zinc-400">ผู้เล่นที่มีคะแนนสูงที่สุดในขณะนี้</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/leaderboard")}
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
              >
                ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {topScores.map((item, idx) => {
                const podiumColors = [
                  "border-amber-500/40 bg-amber-500/5 text-amber-300",
                  "border-slate-300/30 bg-slate-300/5 text-slate-300",
                  "border-amber-700/40 bg-amber-700/5 text-amber-500",
                ];
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border ${podiumColors[idx] || "border-white/10"} flex items-center justify-between sm:flex-col sm:items-start`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-sm px-2 py-0.5 rounded-md bg-white/10">
                        #{item.rank}
                      </span>
                      <span className="font-semibold text-sm text-white truncate max-w-[120px]">
                        {item.displayName}
                      </span>
                    </div>
                    <div className="text-right sm:text-left">
                      <div className="font-extrabold text-lg text-white">
                        {item.score.toLocaleString()} <span className="text-xs font-normal text-zinc-400">pts</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        ถูก {item.correctCount}/{item.totalRounds} ข้อ ({item.timeTakenSec.toFixed(1)}s)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
