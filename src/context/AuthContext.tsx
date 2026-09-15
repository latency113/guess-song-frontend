"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api, UserProfile, UserStats } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  stats: UserStats | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalTab: "login" | "register";
  openAuthModal: (tab?: "login" | "register") => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem("music_quiz_token");
      if (!storedToken) {
        setUser(null);
        setStats(null);
        setToken(null);
        return;
      }
      setToken(storedToken);
      const data = await api.getMe();
      setUser(data.user);
      setStats(data.stats);
    } catch {
      localStorage.removeItem("music_quiz_token");
      setUser(null);
      setStats(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    localStorage.setItem("music_quiz_token", res.token);
    setToken(res.token);
    setUser(res.user);
    setStats(res.stats || null);
    setIsAuthModalOpen(false);
  };

  const register = async (username: string, password: string, displayName?: string) => {
    const res = await api.register({ username, password, displayName });
    localStorage.setItem("music_quiz_token", res.token);
    setToken(res.token);
    setUser(res.user);
    setStats(null);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem("music_quiz_token");
    setUser(null);
    setStats(null);
    setToken(null);
  };

  const openAuthModal = (tab: "login" | "register" = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
