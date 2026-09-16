const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface UserStats {
  totalGames: number;
  totalScore: number;
  highestScore: number;
  accuracy: number;
  recentGames: any[];
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface GameChoice {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
}

export interface GameRound {
  roundIndex: number;
  previewUrl: string;
  youtubeId?: string;
  correctSongId: string;
  artistName?: string;
  choices: GameChoice[];
}

export interface GameSession {
  sessionId: string;
  category: string;
  totalRounds: number;
  timePerRoundSec: number;
  rounds: GameRound[];
}

export interface LeaderboardItem {
  rank: number;
  id: string;
  userId?: string;
  displayName: string;
  username?: string;
  category: string;
  score: number;
  correctCount: number;
  totalRounds: number;
  timeTakenSec: number;
  createdAt: string;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("music_quiz_token");
    }
    return null;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/game/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      return data.categories || [];
    } catch (err) {
      console.error(err);
      return [
        {
          id: "THAI_HITS",
          title: "เพลงไทยยอดฮิต (Thai Hits)",
          description: "เพลงฮิตติดหู T-Pop และเพลงไทยร่วมสมัยสุดปัง",
          icon: "🇹🇭",
          color: "from-pink-500 to-rose-600",
        },
        {
          id: "THAI_INDIE_ROCK",
          title: "ไทยอินดี้ & ร็อก (Thai Rock/Indie)",
          description: "เพลงร็อกและเพลงอินดี้ระดับตำนานที่ท่อนอินโทรคุ้นเคย",
          icon: "🎸",
          color: "from-amber-500 to-orange-600",
        },
        {
          id: "GLOBAL_POP",
          title: "เพลงสากลยอดนิยม (Global Pop)",
          description: "Billboard Hot 100 และเพลงสากลยอดฮิตระดับโลก",
          icon: "🌎",
          color: "from-cyan-500 to-blue-600",
        },
        {
          id: "GLOBAL_CLASSIC",
          title: "สากลคลาสสิก (Global Classics)",
          description: "เพลงสากลระดับตำนานยุค 80s, 90s และต้นยุค 2000s",
          icon: "👑",
          color: "from-purple-500 to-indigo-600",
        },
      ];
    }
  }

  async createGameSession(category: string, roundsCount: number = 10): Promise<GameSession> {
    const res = await fetch(`${API_BASE_URL}/api/game/create-session`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ category, roundsCount }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "ไม่สามารถสร้างรอบเกมได้");
    }
    return await res.json();
  }

  async finishGame(data: {
    category: string;
    score: number;
    correctCount: number;
    totalRounds: number;
    timeTakenSec: number;
    guestName?: string;
  }): Promise<{ message: string; record: any; rank?: number }> {
    const res = await fetch(`${API_BASE_URL}/api/game/finish`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "บันทึกคะแนนไม่สำเร็จ");
    }
    return await res.json();
  }

  async getLeaderboard(category?: string, limit: number = 25): Promise<LeaderboardItem[]> {
    try {
      const url = new URL(`${API_BASE_URL}/api/leaderboard`);
      if (category && category !== "ALL") {
        url.searchParams.set("category", category);
      }
      url.searchParams.set("limit", String(limit));

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();
      return data.leaderboard || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async getGlobalStats(): Promise<{ totalGames: number; highestScore: number; totalUsers: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaderboard/stats`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return await res.json();
    } catch (err) {
      console.error(err);
      return { totalGames: 0, highestScore: 0, totalUsers: 0 };
    }
  }

  async register(data: { username: string; password: string; displayName?: string }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "สมัครสมาชิกไม่สำเร็จ");
    }
    return result;
  }

  async login(data: { username: string; password: string }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "เข้าสู่ระบบไม่สำเร็จ");
    }
    return result;
  }

  async getMe(): Promise<{ user: UserProfile; stats: UserStats }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "Session หมดอายุ");
    }
    return result;
  }
}

export const api = new ApiClient();
