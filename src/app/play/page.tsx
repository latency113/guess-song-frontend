"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, GameRound, GameChoice } from "@/lib/api";
import { soundEngine } from "@/lib/audio";
import AudioVisualizer from "@/components/AudioVisualizer";
import TimerBar from "@/components/TimerBar";
import {
  Flame,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Loader2,
  Volume2,
  RotateCw,
  MicOff,
  Music,
  Radio
} from "lucide-react";

const ROUND_TIME_SEC = 10;

function GamePlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "THAI_HITS";
  const roundsCount = parseInt(searchParams.get("rounds") || "10", 10);

  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gameplay state
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_SEC);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  // Vocal suppression filter (Instrumental mode)
  const [isVocalFilterEnabled, setIsVocalFilterEnabled] = useState(true);

  // Round answer selection state
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [lastRoundScore, setLastRoundScore] = useState<number | null>(null);

  // Audio elements & Web Audio API
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const diffGainRef = useRef<GainNode | null>(null);
  const normalGainRef = useRef<GainNode | null>(null);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimeRef = useRef<number>(0);

  // Initialize Web Audio API Center-Channel Vocal Canceler
  const setupVocalCanceler = () => {
    if (!audioRef.current || audioCtxRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      // 1. Center Vocal Canceler Branch (L - R stereo difference)
      // Cancels center-panned vocals while keeping guitars, drums, synths, and stereo music
      const splitter = ctx.createChannelSplitter(2);
      const inverter = ctx.createGain();
      inverter.gain.value = -1;

      const diffGain = ctx.createGain();
      diffGain.gain.value = isVocalFilterEnabled ? 1.0 : 0.0;
      diffGainRef.current = diffGain;

      source.connect(splitter);
      splitter.connect(diffGain, 0);   // Left channel
      splitter.connect(inverter, 1);   // Right channel to inverter
      inverter.connect(diffGain);      // Left + (-Right) = Vocal Cancelled!
      diffGain.connect(ctx.destination);

      // 2. Normal Audio Branch (used for reveal or when filter is disabled)
      const normalGain = ctx.createGain();
      normalGain.gain.value = isVocalFilterEnabled ? 0.0 : 1.0;
      normalGainRef.current = normalGain;
      source.connect(normalGain);
      normalGain.connect(ctx.destination);
    } catch (e) {
      console.warn("Web Audio vocal canceler error, playing normal audio:", e);
    }
  };

  // Sync vocal filter gain nodes when toggled
  useEffect(() => {
    if (diffGainRef.current && normalGainRef.current && !isAnswered) {
      if (isVocalFilterEnabled) {
        diffGainRef.current.gain.value = 1.0;
        normalGainRef.current.gain.value = 0.0;
      } else {
        diffGainRef.current.gain.value = 0.0;
        normalGainRef.current.gain.value = 1.0;
      }
    }
  }, [isVocalFilterEnabled, isAnswered]);

  // Fetch session rounds from API
  useEffect(() => {
    async function initGame() {
      setIsLoading(true);
      setError(null);
      try {
        const session = await api.createGameSession(category, roundsCount);
        if (!session.rounds || session.rounds.length === 0) {
          throw new Error("ไม่มีข้อมูลเพลงในหมวดหมู่นี้");
        }
        setRounds(session.rounds);
      } catch (err: any) {
        console.error("Init game error:", err);
        setError(err.message || "ไม่สามารถโหลดข้อมูลเกมได้");
      } finally {
        setIsLoading(false);
      }
    }
    initGame();
  }, [category, roundsCount]);

  // Clean up audio & timers on unmount
  useEffect(() => {
    return () => {
      stopAudioAndTimer();
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  const stopAudioAndTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(false);
  };

  // Start round
  const startCurrentRound = (round: GameRound) => {
    stopAudioAndTimer();
    setTimeLeft(ROUND_TIME_SEC);
    setSelectedChoiceId(null);
    setIsAnswered(false);
    setLastRoundScore(null);

    // Apply vocal filter for guessing phase
    if (diffGainRef.current && normalGainRef.current) {
      if (isVocalFilterEnabled) {
        diffGainRef.current.gain.value = 1.0;
        normalGainRef.current.gain.value = 0.0;
      } else {
        diffGainRef.current.gain.value = 0.0;
        normalGainRef.current.gain.value = 1.0;
      }
    }

    // Set audio source and play
    if (audioRef.current) {
      audioRef.current.src = round.previewUrl;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingAudio(true);
        })
        .catch((err) => {
          console.warn("Audio autoplay blocked or network issue:", err);
        });
    }

    roundStartTimeRef.current = Date.now();

    // Start 100ms interval timer for smooth progress bar
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 0.1);

        // Sound tick on last 3 seconds
        if (next <= 3 && Math.floor(next * 10) % 10 === 0 && next > 0) {
          soundEngine.playTick();
        }

        if (next <= 0) {
          handleTimeOut();
        }
        return next;
      });
    }, 100);
  };

  // Replay audio
  const handleReplayIntro = () => {
    if (isAnswered || !audioRef.current) return;
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setIsPlayingAudio(true))
      .catch(console.warn);
  };

  // Handle timeout (User ran out of time)
  const handleTimeOut = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(false);
    setIsAnswered(true);
    setStreak(0);
    setLastRoundScore(0);
    soundEngine.playWrong();

    setTotalTimeSpent((prev) => prev + ROUND_TIME_SEC);

    setTimeout(() => {
      goToNextRound();
    }, 2000);
  };

  // Handle choice click
  const handleSelectChoice = (choice: GameChoice) => {
    if (isAnswered) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const timeSpent = (Date.now() - roundStartTimeRef.current) / 1000;
    setTotalTimeSpent((prev) => prev + Math.min(timeSpent, ROUND_TIME_SEC));

    setSelectedChoiceId(choice.id);
    setIsAnswered(true);

    const currentRound = rounds[currentRoundIdx];
    const isCorrect = choice.id === currentRound.correctSongId;

    if (isCorrect) {
      soundEngine.playCorrect();
      // Time decay formula: max 1000 down to 100
      const baseScore = Math.max(100, Math.round(1000 * (timeLeft / ROUND_TIME_SEC)));
      const streakBonus = streak * 50;
      const earned = baseScore + streakBonus;

      setScore((prev) => prev + earned);
      setStreak((prev) => prev + 1);
      setCorrectCount((prev) => prev + 1);
      setLastRoundScore(earned);
    } else {
      soundEngine.playWrong();
      setStreak(0);
      setLastRoundScore(0);
    }

    // Reveal audio: Unmute full original vocals as celebration reward
    if (diffGainRef.current && normalGainRef.current) {
      diffGainRef.current.gain.value = 0.0;
      normalGainRef.current.gain.value = 1.0;
    }

    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => {});
    }

    setTimeout(() => {
      goToNextRound();
    }, 2200);
  };

  const goToNextRound = () => {
    if (currentRoundIdx + 1 < rounds.length) {
      setCurrentRoundIdx((prev) => {
        const next = prev + 1;
        startCurrentRound(rounds[next]);
        return next;
      });
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    stopAudioAndTimer();
    soundEngine.playFanfare();

    // Store temporary result in sessionStorage
    const gameResult = {
      category,
      score,
      correctCount,
      totalRounds: rounds.length,
      timeTakenSec: parseFloat(totalTimeSpent.toFixed(1)),
    };
    sessionStorage.setItem("music_quiz_last_result", JSON.stringify(gameResult));

    router.push("/result");
  };

  const handleStartFirstRound = () => {
    setHasStarted(true);
    setupVocalCanceler();
    if (rounds.length > 0) {
      startCurrentRound(rounds[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
        <p className="text-zinc-300 font-medium">กำลังเตรียมเสียงดนตรีเพลงฮิต...</p>
        <p className="text-xs text-zinc-500 mt-1">โหลดสัญญาณเสียงดนตรีสำหรับการแข่งขัน</p>
      </div>
    );
  }

  if (error || rounds.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
          <XCircle className="w-12 h-12 mx-auto mb-2" />
          <h3 className="font-bold text-lg">เกิดข้อผิดพลาดในการโหลดเพลง</h3>
          <p className="text-sm text-zinc-400 mt-1">{error || "ไม่พบเพลงในหมวดหมู่ที่เลือก"}</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> กลับสู่หน้าแรก
        </button>
      </div>
    );
  }

  // Pre-game Welcome Screen
  if (!hasStarted) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        {/* Hidden persistent audio element with CORS enabled */}
        <audio
          ref={audioRef}
          crossOrigin="anonymous"
          preload="auto"
          className="hidden"
        />

        <div className="w-full max-w-lg p-8 rounded-3xl glass-panel border border-violet-500/30 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-600 p-0.5 mx-auto mb-6 shadow-xl shadow-purple-600/30 flex items-center justify-center">
            <Volume2 className="w-8 h-8 text-white animate-bounce" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 font-bold text-xs mb-3">
            <Radio className="w-3.5 h-3.5" />
            เกมทายเพลงจากเสียงดนตรี (Instrumental Quiz)
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">พร้อมฟังเสียงดนตรีแล้วหรือยัง?</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
            หมวดหมู่: <strong className="text-pink-400">{category}</strong> | จำนวน:{" "}
            <strong className="text-cyan-400">{rounds.length} ข้อ</strong>
            <br />
            <span className="text-xs text-zinc-500">
              ระบบจะเน้นเสียงดนตรีกีตาร์ กลอง เบส และตัดเสียงร้อง เพื่อทายจากฝีมือดนตรีแท้ๆ
            </span>
          </p>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-8 text-left space-y-2.5 text-xs text-zinc-300">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <span><strong>ฟังเสียงดนตรี 10 วินาที:</strong> โฟกัสที่จังหวะ คอร์ดกีตาร์ บีทกลอง และเมโลดี้</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-pink-400/20 text-pink-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <span><strong>ยิ่งตอบเร็ว คะแนนยิ่งสูง:</strong> สูงสุด 1,000 คะแนนต่อข้อ พร้อมโบนัส Streak ต่อเนื่อง</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <span><strong>เฉลยเพลงเต็ม:</strong> เมื่อกดตอบจะเผยหน้าปกและเปิดเพลงเฉลยให้ฟังอย่างสะใจ</span>
            </div>
          </div>

          <button
            onClick={handleStartFirstRound}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-bold text-base shadow-lg shadow-violet-600/30 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>เริ่มเล่นทันที</span>
          </button>
        </div>
      </div>
    );
  }

  const currentRound = rounds[currentRoundIdx];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col justify-between">
      {/* Hidden persistent audio element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="auto"
        className="hidden"
      />

      {/* Top Game Bar: Score, Round, Streak, Vocal Toggle */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between shadow-lg mb-3">
        {/* Round Counter */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-pink-400">
            {currentRoundIdx + 1}
          </div>
          <span className="text-xs font-medium text-zinc-400">
            จากทั้งหมด {rounds.length} ข้อ
          </span>
        </div>

        {/* Center: Streak / Vocal Filter Badge */}
        <div className="flex items-center gap-2">
          {streak > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold text-xs animate-bounce">
              <Flame className="w-4 h-4 fill-current" />
              <span>Streak x{streak}</span>
            </div>
          )}

          {/* Toggle Vocal Filter Button */}
          <button
            type="button"
            onClick={() => setIsVocalFilterEnabled(!isVocalFilterEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all ${
              isVocalFilterEnabled
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
            }`}
            title="เปิด/ปิดการตัดเสียงร้องของศิลปิน"
          >
            {isVocalFilterEnabled ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ตัดเสียงร้อง: เปิด</span>
                <span className="sm:hidden">ตัดเสียง</span>
              </>
            ) : (
              <>
                <Music className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ตัดเสียงร้อง: ปิด</span>
                <span className="sm:hidden">ปกติ</span>
              </>
            )}
          </button>
        </div>

        {/* Current Score */}
        <div className="text-right">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">คะแนนรวม</div>
          <div className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
            {score.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Audio Visualizer Disc */}
      <div className="relative">
        <AudioVisualizer
          isPlaying={isPlayingAudio}
          artworkUrl={isAnswered ? currentRound.choices.find((c) => c.id === currentRound.correctSongId)?.artworkUrl : undefined}
          roundIndex={currentRoundIdx + 1}
          totalRounds={rounds.length}
          isRevealed={isAnswered}
        />

        {/* Round Score Popup Animation */}
        {lastRoundScore !== null && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-fadeIn">
            {lastRoundScore > 0 ? (
              <div className="px-6 py-3 rounded-2xl bg-emerald-500/90 text-white font-extrabold text-xl shadow-2xl backdrop-blur-md border border-emerald-300 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                <span>+{lastRoundScore} PTS!</span>
              </div>
            ) : (
              <div className="px-6 py-3 rounded-2xl bg-rose-600/90 text-white font-extrabold text-xl shadow-2xl backdrop-blur-md border border-rose-300 flex items-center gap-2">
                <XCircle className="w-6 h-6" />
                <span>0 PTS</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clean Replay Controller */}
      <div className="flex items-center justify-center my-3">
        <button
          type="button"
          disabled={isAnswered}
          onClick={handleReplayIntro}
          className={`py-2 px-6 rounded-2xl border font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
            isPlayingAudio
              ? "bg-pink-500/20 border-pink-500/50 text-pink-300 shadow-pink-500/20 animate-pulse"
              : "bg-white/10 hover:bg-white/20 border-white/20 text-white active:scale-[0.98]"
          }`}
        >
          <RotateCw className={`w-4 h-4 ${isPlayingAudio ? "animate-spin" : ""}`} />
          <span>{isPlayingAudio ? "กำลังเล่นเสียงดนตรี..." : "ฟังเสียงดนตรีซ้ำ"}</span>
        </button>
      </div>

      {/* Timer Bar */}
      <TimerBar timeLeft={timeLeft} totalTime={ROUND_TIME_SEC} />

      {/* 4 Choices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 mt-2 mb-4">
        {currentRound.choices.map((choice, idx) => {
          const isSelected = selectedChoiceId === choice.id;
          const isCorrectAnswer = choice.id === currentRound.correctSongId;

          let buttonStyle = "border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-500/40 text-white";

          if (isAnswered) {
            if (isCorrectAnswer) {
              buttonStyle = "border-emerald-500 bg-emerald-500/20 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.4)]";
            } else if (isSelected && !isCorrectAnswer) {
              buttonStyle = "border-rose-500 bg-rose-500/20 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.4)]";
            } else {
              buttonStyle = "border-white/5 bg-white/5 opacity-40";
            }
          }

          return (
            <button
              key={choice.id}
              disabled={isAnswered}
              onClick={() => handleSelectChoice(choice)}
              className={`relative text-left p-3.5 sm:p-4 rounded-2xl border glass-panel transition-all duration-200 flex items-center justify-between group active:scale-[0.98] ${buttonStyle}`}
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                {/* Number Badge or Album Cover */}
                <div className="w-11 h-11 rounded-xl bg-zinc-900/80 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {isAnswered && choice.artworkUrl ? (
                    <img src={choice.artworkUrl} alt={choice.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-sm text-zinc-400 group-hover:text-pink-300 transition-colors">
                      {["A", "B", "C", "D"][idx]}
                    </span>
                  )}
                </div>

                {/* Track and Artist Title */}
                <div className="overflow-hidden">
                  <h4 className="font-bold text-sm sm:text-base text-white truncate leading-snug">
                    {choice.title}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {choice.artist}
                  </p>
                </div>
              </div>

              {/* Status Icon */}
              {isAnswered && (
                <div className="flex-shrink-0 ml-2">
                  {isCorrectAnswer ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isSelected ? (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  ) : null}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function GamePlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      }
    >
      <GamePlayContent />
    </Suspense>
  );
}
