"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { soundEngine } from "@/lib/audio";

interface AudioContextType {
  volume: number;
  isMuted: boolean;
  effectiveVolume: number;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  increaseVolume: (step?: number) => void;
  decreaseVolume: (step?: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const savedVol = localStorage.getItem("music_quiz_volume");
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          setVolumeState(parsed);
          soundEngine.setVolume(parsed);
        }
      }
      const savedMute = localStorage.getItem("music_quiz_muted");
      if (savedMute !== null) {
        const muted = savedMute === "true";
        setIsMuted(muted);
        soundEngine.setMuted(muted);
      }
    } catch (e) {
      console.warn("Could not read audio preferences from localStorage", e);
    }
  }, []);

  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, Math.round(newVol * 100) / 100));
    setVolumeState(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      soundEngine.setMuted(false);
      try {
        localStorage.setItem("music_quiz_muted", "false");
      } catch {}
    }
    soundEngine.setVolume(clamped);
    try {
      localStorage.setItem("music_quiz_volume", clamped.toString());
    } catch {}
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      try {
        localStorage.setItem("music_quiz_muted", next.toString());
      } catch {}
      return next;
    });
  }, []);

  const increaseVolume = useCallback((step: number = 0.1) => {
    setVolumeState((prev) => {
      const next = Math.min(1, Math.round((prev + step) * 100) / 100);
      soundEngine.setVolume(next);
      try {
        localStorage.setItem("music_quiz_volume", next.toString());
      } catch {}
      return next;
    });
    setIsMuted(false);
    soundEngine.setMuted(false);
    try {
      localStorage.setItem("music_quiz_muted", "false");
    } catch {}
  }, []);

  const decreaseVolume = useCallback((step: number = 0.1) => {
    setVolumeState((prev) => {
      const next = Math.max(0, Math.round((prev - step) * 100) / 100);
      soundEngine.setVolume(next);
      try {
        localStorage.setItem("music_quiz_volume", next.toString());
      } catch {}
      return next;
    });
  }, []);

  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <AudioContext.Provider
      value={{
        volume,
        isMuted,
        effectiveVolume,
        setVolume,
        toggleMute,
        increaseVolume,
        decreaseVolume,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
