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
  Radio,
  Mic2,
  MicOff,
  Music,
} from "lucide-react";

const ROUND_TIME_SEC = 15;

type VoicePresetStyle = "chipmunk" | "monster" | "radio" | "normal";

interface VoicePreset {
  id: string;
  label: string;
  shortLabel: string;
  style: VoicePresetStyle;
}

const VOICE_PRESETS: VoicePreset[] = [
  { id: "chipmunk", label: "🐿️ ชิปมังก์ (เสียงแหลม)", shortLabel: "ชิปมังก์", style: "chipmunk" },
  { id: "monster", label: "🤖 มอนสเตอร์ (เสียงทุ้ม)", shortLabel: "มอนสเตอร์", style: "monster" },
  { id: "radio", label: "📻 วิทยุโบราณ (Lo-Fi)", shortLabel: "วิทยุ", style: "radio" },
];

function GamePlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "THAI_HITS";
  const roundsCount = parseInt(searchParams.get("rounds") || "10", 10);
  const mode = (searchParams.get("mode") as "disguised" | "instrumental" | "normal") || "disguised";
  const voiceParam = searchParams.get("voice") || "random";

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

  // Active voice preset for current round
  const [activeVoice, setActiveVoice] = useState<VoicePreset>({
    id: "chipmunk",
    label: "🐿️ ชิปมังก์ (เสียงแหลม)",
    shortLabel: "ชิปมังก์",
    style: "chipmunk",
  });

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
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextRoundTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimeRef = useRef<number>(0);

  // Synchronized state refs to prevent stale closures in async callbacks
  const isAnsweredRef = useRef(false);
  const currentRoundIdxRef = useRef(0);
  const scoreRef = useRef(0);
  const correctCountRef = useRef(0);
  const streakRef = useRef(0);
  const totalTimeSpentRef = useRef(0);
  const roundsRef = useRef<GameRound[]>([]);

  // Initialize Web Audio API nodes with both Instrumental Vocal Canceler and Voice Disguise branches
  const setupAudioNodes = () => {
    if (!audioRef.current || audioCtxRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      // 1. Center Vocal Canceler Branch (L - R stereo difference)
      const splitter = ctx.createChannelSplitter(2);
      const inverter = ctx.createGain();
      inverter.gain.value = -1;

      const diffGain = ctx.createGain();
      diffGain.gain.value = mode === "instrumental" ? 1.0 : 0.0;
      diffGainRef.current = diffGain;

      source.connect(splitter);
      splitter.connect(diffGain, 0); // Left channel
      splitter.connect(inverter, 1); // Right channel into inverter
      inverter.connect(diffGain);    // Left + (-Right) = Vocal Cancelled!
      diffGain.connect(ctx.destination);

      // 2. Normal / Voice Disguised Branch
      const filter = ctx.createBiquadFilter();
      filter.type = "allpass";
      filterNodeRef.current = filter;

      const normalGain = ctx.createGain();
      normalGain.gain.value = mode === "instrumental" ? 0.0 : 1.0;
      normalGainRef.current = normalGain;

      source.connect(filter);
      filter.connect(normalGain);
      normalGain.connect(ctx.destination);
    } catch (e) {
      console.warn("Web Audio initialization warning:", e);
    }
  };

  // Apply Voice Disguise to audio element and Web Audio filters
  const applyVoiceDisguise = (style: VoicePresetStyle) => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (style === "chipmunk") {
        (audio as any).preservesPitch = false;
        (audio as any).mozPreservesPitch = false;
        (audio as any).webkitPreservesPitch = false;
        audio.playbackRate = 1.33;
        if (filterNodeRef.current) {
          filterNodeRef.current.type = "allpass";
        }
      } else if (style === "monster") {
        (audio as any).preservesPitch = false;
        (audio as any).mozPreservesPitch = false;
        (audio as any).webkitPreservesPitch = false;
        audio.playbackRate = 0.82;
        if (filterNodeRef.current) {
          filterNodeRef.current.type = "allpass";
        }
      } else if (style === "radio") {
        (audio as any).preservesPitch = true;
        (audio as any).mozPreservesPitch = true;
        (audio as any).webkitPreservesPitch = true;
        audio.playbackRate = 1.0;
        if (filterNodeRef.current && audioCtxRef.current) {
          filterNodeRef.current.type = "bandpass";
          filterNodeRef.current.frequency.setValueAtTime(1300, audioCtxRef.current.currentTime);
          filterNodeRef.current.Q.setValueAtTime(2.2, audioCtxRef.current.currentTime);
        }
      } else {
        // Normal / Answer reveal
        (audio as any).preservesPitch = true;
        (audio as any).mozPreservesPitch = true;
        (audio as any).webkitPreservesPitch = true;
        audio.playbackRate = 1.0;
        if (filterNodeRef.current) {
          filterNodeRef.current.type = "allpass";
        }
      }
    } catch (err) {
      console.warn("Error applying voice disguise:", err);
    }
  };

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
        roundsRef.current = session.rounds;
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
    if (nextRoundTimeoutRef.current) {
      clearTimeout(nextRoundTimeoutRef.current);
      nextRoundTimeoutRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(false);
  };

  // Start round
  const startCurrentRound = (round: GameRound, roundIndex: number) => {
    stopAudioAndTimer();
    currentRoundIdxRef.current = roundIndex;
    setCurrentRoundIdx(roundIndex);

    isAnsweredRef.current = false;
    setIsAnswered(false);
    setSelectedChoiceId(null);
    setLastRoundScore(null);
    setTimeLeft(ROUND_TIME_SEC);

    // Pick target voice preset & gain routing
    let targetVoice: VoicePreset;
    if (mode === "disguised") {
      if (diffGainRef.current && normalGainRef.current) {
        diffGainRef.current.gain.value = 0.0;
        normalGainRef.current.gain.value = 1.0;
      }
      if (voiceParam === "chipmunk") {
        targetVoice = VOICE_PRESETS[0];
      } else if (voiceParam === "monster") {
        targetVoice = VOICE_PRESETS[1];
      } else if (voiceParam === "radio") {
        targetVoice = VOICE_PRESETS[2];
      } else {
        // Random / cycle each round
        targetVoice = VOICE_PRESETS[roundIndex % VOICE_PRESETS.length];
      }
    } else if (mode === "instrumental") {
      if (diffGainRef.current && normalGainRef.current) {
        diffGainRef.current.gain.value = 1.0;
        normalGainRef.current.gain.value = 0.0;
      }
      targetVoice = {
        id: "instrumental",
        label: "🎸 ตัดเสียงร้อง (ดนตรีล้วน)",
        shortLabel: "ดนตรีล้วน",
        style: "normal",
      };
    } else {
      if (diffGainRef.current && normalGainRef.current) {
        diffGainRef.current.gain.value = 0.0;
        normalGainRef.current.gain.value = 1.0;
      }
      targetVoice = {
        id: "normal",
        label: "🎵 เสียงต้นฉบับ",
        shortLabel: "ต้นฉบับ",
        style: "normal",
      };
    }
    setActiveVoice(targetVoice);

    // Set audio source and play
    if (audioRef.current) {
      audioRef.current.src = round.previewUrl;
      audioRef.current.currentTime = 0;
      applyVoiceDisguise(targetVoice.style);
      audioRef.current
        .play()
        .then(() => {
          applyVoiceDisguise(targetVoice.style);
          setIsPlayingAudio(true);
        })
        .catch((err) => {
          console.warn("Audio autoplay blocked or network issue:", err);
        });
    }

    roundStartTimeRef.current = Date.now();

    // Start 100ms interval timer for smooth progress bar using exact elapsed time
    timerIntervalRef.current = setInterval(() => {
      if (isAnsweredRef.current) return;

      const elapsed = (Date.now() - roundStartTimeRef.current) / 1000;
      const remaining = Math.max(0, ROUND_TIME_SEC - elapsed);
      setTimeLeft(remaining);

      // Sound tick on last 3 seconds
      if (remaining <= 3 && Math.floor(remaining * 10) % 10 === 0 && remaining > 0) {
        soundEngine.playTick();
      }

      if (remaining <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        handleTimeOut();
      }
    }, 100);
  };

  // Replay audio
  const handleReplayIntro = () => {
    if (isAnsweredRef.current || !audioRef.current) return;
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    audioRef.current.currentTime = 0;
    if (mode === "instrumental") {
      if (diffGainRef.current && normalGainRef.current) {
        diffGainRef.current.gain.value = 1.0;
        normalGainRef.current.gain.value = 0.0;
      }
      applyVoiceDisguise("normal");
    } else if (mode === "disguised") {
      if (diffGainRef.current && normalGainRef.current) {
        diffGainRef.current.gain.value = 0.0;
        normalGainRef.current.gain.value = 1.0;
      }
      applyVoiceDisguise(activeVoice.style);
    } else {
      if (diffGainRef.current && normalGainRef.current) {
        diffGainRef.current.gain.value = 0.0;
        normalGainRef.current.gain.value = 1.0;
      }
      applyVoiceDisguise("normal");
    }
    audioRef.current
      .play()
      .then(() => {
        if (mode === "disguised") {
          applyVoiceDisguise(activeVoice.style);
        }
        setIsPlayingAudio(true);
      })
      .catch(console.warn);
  };

  // Handle timeout (User ran out of time)
  const handleTimeOut = () => {
    if (isAnsweredRef.current) return;
    isAnsweredRef.current = true;
    setIsAnswered(true);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(false);

    streakRef.current = 0;
    setStreak(0);
    setLastRoundScore(0);
    soundEngine.playWrong();

    // Reveal full original vocals
    if (diffGainRef.current && normalGainRef.current) {
      diffGainRef.current.gain.value = 0.0;
      normalGainRef.current.gain.value = 1.0;
    }
    applyVoiceDisguise("normal");

    totalTimeSpentRef.current += ROUND_TIME_SEC;
    setTotalTimeSpent(totalTimeSpentRef.current);

    if (nextRoundTimeoutRef.current) {
      clearTimeout(nextRoundTimeoutRef.current);
    }
    nextRoundTimeoutRef.current = setTimeout(() => {
      goToNextRound();
    }, 2000);
  };

  // Handle choice click
  const handleSelectChoice = (choice: GameChoice) => {
    if (isAnsweredRef.current) return;
    isAnsweredRef.current = true;
    setIsAnswered(true);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const timeSpent = (Date.now() - roundStartTimeRef.current) / 1000;
    const roundDuration = Math.min(timeSpent, ROUND_TIME_SEC);
    totalTimeSpentRef.current += roundDuration;
    setTotalTimeSpent(totalTimeSpentRef.current);

    setSelectedChoiceId(choice.id);

    const currentRound = roundsRef.current[currentRoundIdxRef.current];
    const isCorrect = choice.id === currentRound?.correctSongId;

    if (isCorrect) {
      soundEngine.playCorrect();
      // Time decay formula: max 1000 down to 100 based on remaining time
      const remainingTime = Math.max(0, ROUND_TIME_SEC - roundDuration);
      const baseScore = Math.max(100, Math.round(1000 * (remainingTime / ROUND_TIME_SEC)));
      const streakBonus = streakRef.current * 50;
      const earned = baseScore + streakBonus;

      scoreRef.current += earned;
      setScore(scoreRef.current);

      streakRef.current += 1;
      setStreak(streakRef.current);

      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);

      setLastRoundScore(earned);
    } else {
      soundEngine.playWrong();
      streakRef.current = 0;
      setStreak(0);
      setLastRoundScore(0);
    }

    // Reveal original audio with full vocals!
    if (diffGainRef.current && normalGainRef.current) {
      diffGainRef.current.gain.value = 0.0;
      normalGainRef.current.gain.value = 1.0;
    }
    applyVoiceDisguise("normal");

    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => {});
    }

    if (nextRoundTimeoutRef.current) {
      clearTimeout(nextRoundTimeoutRef.current);
    }
    nextRoundTimeoutRef.current = setTimeout(() => {
      goToNextRound();
    }, 2200);
  };

  const goToNextRound = () => {
    stopAudioAndTimer();
    const nextIdx = currentRoundIdxRef.current + 1;
    if (nextIdx < roundsRef.current.length) {
      currentRoundIdxRef.current = nextIdx;
      setCurrentRoundIdx(nextIdx);
      startCurrentRound(roundsRef.current[nextIdx], nextIdx);
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
      mode,
      score: scoreRef.current,
      correctCount: correctCountRef.current,
      totalRounds: roundsRef.current.length,
      timeTakenSec: parseFloat(totalTimeSpentRef.current.toFixed(1)),
    };
    sessionStorage.setItem("music_quiz_last_result", JSON.stringify(gameResult));

    router.push("/result");
  };

  const handleStartFirstRound = () => {
    setHasStarted(true);
    setupAudioNodes();
    scoreRef.current = 0;
    correctCountRef.current = 0;
    streakRef.current = 0;
    totalTimeSpentRef.current = 0;
    currentRoundIdxRef.current = 0;
    if (roundsRef.current.length > 0) {
      startCurrentRound(roundsRef.current[0], 0);
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
          onPlay={() => {
            if (!isAnswered && mode === "disguised") {
              applyVoiceDisguise(activeVoice.style);
            }
          }}
        />

        <div className="w-full max-w-lg p-8 rounded-3xl glass-panel border border-violet-500/30 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-600 p-0.5 mx-auto mb-6 shadow-xl shadow-purple-600/30 flex items-center justify-center">
            {mode === "instrumental" ? (
              <MicOff className="w-8 h-8 text-white animate-bounce" />
            ) : mode === "disguised" ? (
              <Mic2 className="w-8 h-8 text-white animate-bounce" />
            ) : (
              <Volume2 className="w-8 h-8 text-white animate-bounce" />
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 font-bold text-xs mb-3">
            <Radio className="w-3.5 h-3.5" />
            {mode === "instrumental"
              ? "โหมดตัดเสียงร้อง (เหลือแต่ดนตรี)"
              : mode === "disguised"
              ? "โหมดทายด้วยเนื้อเพลงแต่เปลี่ยนเสียงร้อง"
              : "โหมดอินโทรเพลงฮิต (Original Audio)"}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {mode === "instrumental"
              ? "พร้อมฟังเสียงดนตรีแล้วหรือยัง?"
              : mode === "disguised"
              ? "พร้อมทายเพลงจากเนื้อร้องดัดเสียงแล้วหรือยัง?"
              : "พร้อมฟังเสียงอินโทรแล้วหรือยัง?"}
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
            หมวดหมู่: <strong className="text-pink-400">{category}</strong> | จำนวน:{" "}
            <strong className="text-cyan-400">{rounds.length} ข้อ</strong>
            <br />
            <span className="text-xs text-zinc-400">
              {mode === "instrumental"
                ? "ระบบจะกรองและตัดเสียงร้องของศิลปินออก เหลือเฉพาะเสียงดนตรีกีตาร์ กลอง เบส ซินธ์ เพื่อทายจากฝีมือดนตรีแท้ๆ"
                : mode === "disguised"
                ? "ระบบจะเล่นท่อนเพลงพร้อมเนื้อร้อง แต่ดัดเสียงร้อง (ชิปมังก์/มอนสเตอร์) เพื่อไม่ให้จำเสียงนักร้องได้ ทายให้ถูกว่าคือเพลงอะไร!"
                : "ฟังเสียงดนตรีและทำนองเพลงต้นฉบับ ทายให้ไวว่าคือเพลงอะไร"}
            </span>
          </p>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-8 text-left space-y-2.5 text-xs text-zinc-300">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <span>
                <strong>
                  {mode === "disguised"
                    ? `ฟังเนื้อร้อง ${ROUND_TIME_SEC} วินาที:`
                    : `ฟังเสียงดนตรี ${ROUND_TIME_SEC} วินาที:`}
                </strong>{" "}
                {mode === "disguised"
                  ? "โฟกัสที่คำร้อง ทำนอง และท่อนฮิตของเพลงที่ถูกดัดแปลงเสียง"
                  : mode === "instrumental"
                  ? "โฟกัสที่ไลน์กีตาร์ คอร์ด บีทกลอง และเบส (ตัดเสียงร้องออก)"
                  : "โฟกัสที่จังหวะ คอร์ดกีตาร์ บีทกลอง และเมโลดี้"}
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-pink-400/20 text-pink-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <span>
                <strong>ยิ่งตอบเร็ว คะแนนยิ่งสูง:</strong> สูงสุด 1,000 คะแนนต่อข้อ พร้อมโบนัส Streak ต่อเนื่อง
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <span>
                <strong>เฉลยเสียงร้องจริง:</strong> เมื่อกดตอบจะเผยหน้าปกและเปิดเสียงร้องจริงของศิลปินให้ฟังทันที!
              </span>
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
        onPlay={() => {
          if (!isAnswered && mode === "disguised") {
            applyVoiceDisguise(activeVoice.style);
          }
        }}
      />

      {/* Top Game Bar: Score, Round, Streak, Voice Mode Badge */}
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

        {/* Center: Streak / Voice Disguise Badge */}
        <div className="flex items-center gap-2">
          {streak > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold text-xs animate-bounce">
              <Flame className="w-4 h-4 fill-current" />
              <span>Streak x{streak}</span>
            </div>
          )}

          {mode === "instrumental" ? (
            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${
                isAnswered
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-teal-500/10 border-teal-500/30 text-teal-300"
              }`}
            >
              {isAnswered ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>เฉลยเสียงร้องจริง</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                  <span>ตัดเสียงร้อง (ดนตรีล้วน)</span>
                </>
              )}
            </div>
          ) : mode === "disguised" ? (
            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${
                isAnswered
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-pink-500/10 border-pink-500/30 text-pink-300"
              }`}
            >
              {isAnswered ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>เฉลยเสียงจริง</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                  <span>ดัดเสียง: {activeVoice.shortLabel}</span>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 font-bold text-xs">
              <Volume2 className="w-3.5 h-3.5 text-violet-400" />
              <span>เสียงต้นฉบับ</span>
            </div>
          )}
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
          <span>
            {isPlayingAudio
              ? (mode === "disguised"
                  ? `กำลังเล่นเสียง${activeVoice.shortLabel}...`
                  : mode === "instrumental"
                  ? "กำลังเล่นเสียงดนตรี..."
                  : "กำลังเล่นเสียงเพลง...")
              : (mode === "disguised"
                  ? "ฟังเนื้อเพลงซ้ำ"
                  : mode === "instrumental"
                  ? "ฟังเสียงดนตรีซ้ำ"
                  : "ฟังเสียงเพลงซ้ำ")}
          </span>
        </button>
      </div>

      {/* Timer Bar */}
      <TimerBar timeLeft={timeLeft} totalTime={ROUND_TIME_SEC} />

      {/* Target Artist Badge */}
      {currentRound.artistName && (
        <div className="flex items-center justify-center mt-3 mb-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border border-violet-500/25 text-zinc-200 text-xs sm:text-sm font-medium shadow-sm">
            <Mic2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="text-zinc-400">ทายเพลงของ:</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-200 font-extrabold">
              {currentRound.artistName}
            </span>
          </div>
        </div>
      )}

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
