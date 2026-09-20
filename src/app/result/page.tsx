"use client";

import { useEffect, useState ,useRef} from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Trophy,
  RotateCcw,
  Sparkles,
  Zap,
  Clock,
  CheckCircle,
  Share2,
  ShieldCheck,
  ArrowRight,
  User,
  Loader2,
} from "lucide-react";

interface GameResult {
  category: string;
  mode?: string;
  voice?: string;
  score: number;
  correctCount: number;
  totalRounds: number;
  timeTakenSec: number;
}

export default function ResultPage() {
  const router = useRouter();
  const { user, openAuthModal, refreshUser } = useAuth();

  const [result, setResult] = useState<GameResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [guestName, setGuestName] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const hasSavedRef = useRef(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("music_quiz_last_result");
    if (!raw) {
      router.push("/");
      return;
    }
    const parsed: GameResult = JSON.parse(raw);
    setResult(parsed);

    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ec4899", "#8b5cf6", "#06b6d4", "#eab308"],
    });

    // If user is already logged in, auto-save score once
    if (user && !hasSavedRef.current) {
      hasSavedRef.current = true;
      saveScore(parsed);
    }
  }, [user]);

  const saveScore = async (dataToSave?: GameResult, overrideGuestName?: string) => {
    const data = dataToSave || result;
    if (!data || isSaving || isSaved) return;

    hasSavedRef.current = true;
    setIsSaving(true);
    try {
      const res = await api.finishGame({
        category: data.category,
        mode: data.mode || "disguised",
        score: data.score,
        correctCount: data.correctCount,
        totalRounds: data.totalRounds,
        timeTakenSec: data.timeTakenSec,
        guestName: overrideGuestName || (user ? undefined : guestName || "Guest Player"),
      });

      setIsSaved(true);
      if (res.rank) {
        setRank(res.rank);
      }
      setSaveMessage(res.message);
      if (user) {
        await refreshUser();
      }
    } catch (err: any) {
      console.error("Save score error:", err);
      setSaveMessage(err.message || "บันทึกคะแนนไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    saveScore(undefined, guestName.trim());
  };

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  const accuracy = Math.round((result.correctCount / result.totalRounds) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
      {/* Result Card */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-violet-500/30 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-pink-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        {/* Trophy Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-pink-500 to-violet-600 p-0.5 mx-auto mb-6 shadow-xl shadow-amber-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-zinc-950/80 rounded-[22px] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400 animate-pulse" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">ยอดเยี่ยมมาก! จบเกมแล้ว</h1>
        <div className="text-xs sm:text-sm text-zinc-400 mt-1.5 flex items-center justify-center gap-2 flex-wrap">
          <span>
            หมวดหมู่: <span className="text-pink-300 font-semibold">{result.category}</span>
          </span>
          {result.mode && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                result.mode === "instrumental"
                  ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                  : result.mode === "disguised"
                  ? "bg-pink-500/20 text-pink-300 border-pink-500/30"
                  : "bg-violet-500/20 text-violet-300 border-violet-500/30"
              }`}
            >
              {result.mode === "instrumental"
                ? "🎸 โหมดตัดเสียงร้อง"
                : result.mode === "disguised"
                ? "🎭 โหมดดัดเสียงร้อง"
                : "🎵 โหมดอินโทรปกติ"}
            </span>
          )}
        </div>

        {/* Big Score Display */}
        <div className="my-8 py-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            คะแนนที่คุณทำได้
          </div>
          <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 my-1 neon-text-glow">
            {result.score.toLocaleString()}
          </div>
          {rank && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mt-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>อันดับที่ #{rank} ในตารางผู้นำ!</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs mb-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>ความแม่นยำ</span>
            </div>
            <div className="font-extrabold text-lg text-white">{accuracy}%</div>
            <div className="text-[10px] text-zinc-400">{result.correctCount}/{result.totalRounds} ข้อ</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-center gap-1 text-cyan-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>เวลารวม</span>
            </div>
            <div className="font-extrabold text-lg text-white">{result.timeTakenSec}s</div>
            <div className="text-[10px] text-zinc-400">เฉลี่ย {(result.timeTakenSec / result.totalRounds).toFixed(1)}s/ข้อ</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-xs mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>สปีดโบนัส</span>
            </div>
            <div className="font-extrabold text-lg text-white">
              {result.score > 0 ? `+${Math.round(result.score / result.correctCount || 0)}` : "0"}
            </div>
            <div className="text-[10px] text-zinc-400">แต้มเฉลี่ยต่อข้อ</div>
          </div>
        </div>

        {/* Save Score Section */}
        {user ? (
          <div className="p-4 rounded-2xl bg-violet-600/10 border border-violet-500/30 text-violet-300 text-xs mb-8 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>คะแนนของคุณถูกบันทึกเข้าบัญชี <strong>{user.displayName}</strong> เรียบร้อยแล้ว!</span>
          </div>
        ) : isSaved ? (
          <div className="p-4 rounded-2xl bg-emerald-600/10 border border-emerald-500/30 text-emerald-300 text-xs mb-8 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{saveMessage || "บันทึกคะแนนเข้าตารางเรียบร้อยแล้ว!"}</span>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-8 text-left">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm text-white">บันทึกคะแนนลง Leaderboard</h3>
                <p className="text-[11px] text-zinc-400">เข้าสู่ระบบเพื่อเก็บสถิติถาวร หรือกรอกชื่อชั่วคราว</p>
              </div>
              <button
                onClick={() => openAuthModal("login")}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow hover:opacity-90 transition-all"
              >
                เข้าสู่ระบบ
              </button>
            </div>

            {/* Guest submission form */}
            <form onSubmit={handleGuestSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="กรอกชื่อของคุณ (เช่น SonicEar)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 outline-none focus:border-violet-500"
                />
                <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              </div>
              <button
                type="submit"
                disabled={isSaving || !guestName.trim()}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all disabled:opacity-40"
              >
                {isSaving ? "กำลังบันทึก..." : "ส่งคะแนน"}
              </button>
            </form>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              const modeToPlay =
                result.mode ||
                (typeof window !== "undefined"
                  ? localStorage.getItem("music_quiz_last_mode")
                  : null) ||
                "disguised";
              const voiceToPlay =
                result.voice ||
                (typeof window !== "undefined"
                  ? localStorage.getItem("music_quiz_last_voice")
                  : null);

              const params = new URLSearchParams({
                category: result.category,
                rounds: String(result.totalRounds),
                mode: modeToPlay,
              });
              if (voiceToPlay) {
                params.set("voice", voiceToPlay);
              }
              router.push(`/play?${params.toString()}`);
            }}
            className="w-full sm:flex-1 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-bold text-sm shadow-lg shadow-violet-600/30 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>เล่นใหม่อีกครั้ง</span>
          </button>

          <button
            onClick={() => router.push("/leaderboard")}
            className="w-full sm:flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-200 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>ดูตารางอันดับทั้งหมด</span>
          </button>
        </div>
      </div>
    </div>
  );
}
