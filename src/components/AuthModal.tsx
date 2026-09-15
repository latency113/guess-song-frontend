"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Lock, User, Sparkles, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, openAuthModal, login, register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (authModalTab === "login") {
        await login(username, password);
      } else {
        await register(username, password, displayName);
      }
      setUsername("");
      setPassword("");
      setDisplayName("");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Modal Card */}
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl glass-panel border border-violet-500/30 shadow-2xl shadow-purple-900/40 bg-zinc-950/90 text-white overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-violet-600/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-pink-600/25 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header & Tabs */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-600 mb-3 shadow-lg shadow-violet-600/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {authModalTab === "login" ? "ยินดีต้อนรับกลับมา!" : "สร้างบัญชีผู้เล่นใหม่"}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {authModalTab === "login"
              ? "เข้าสู่ระบบเพื่อบันทึกสถิติและขึ้นสู่ตารางอันดับ"
              : "สมัครสมาชิกเพื่อเก็บสถิติความเร็วและความแม่นยำ"}
          </p>

          {/* Switch tabs */}
          <div className="grid grid-cols-2 p-1 bg-zinc-900 rounded-xl border border-white/10 mt-5">
            <button
              type="button"
              onClick={() => {
                setError(null);
                openAuthModal("login");
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                authModalTab === "login"
                  ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                openAuthModal("register");
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                authModalTab === "register"
                  ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalTab === "register" && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">ชื่อที่แสดงในเกม (Display Name)</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="เช่น DJ Pilot, Rocker99"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                />
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">ชื่อผู้ใช้ (Username)</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="ชื่อบัญชี (ภาษาอังกฤษหรือตัวเลข)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">รหัสผ่าน (Password)</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              <>
                {authModalTab === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชีและเริ่มเล่น"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Argon2 Security Badge */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>ระบบรักษาความปลอดภัยรหัสผ่านด้วย <strong className="text-zinc-300">Argon2id</strong></span>
        </div>
      </div>
    </div>
  );
}
