// =========================================================
// Zustand: ผู้ใช้ที่ล็อกอินอยู่ (Client State)
// - persist = เก็บลง localStorage ด้วย กด F5 แล้วยังล็อกอินอยู่ (Restore Session)
// - token ถูกแนบไปกับทุก request ใน api/client.ts (Authorization: Bearer ...)
// - token ใกล้หมดอายุ → api/client.ts ใช้ refreshToken ขอชุดใหม่ให้เอง
// - เปิดหลายแท็บ: แท็บหนึ่ง refresh / ล็อกอิน / ออกจากระบบ → แท็บอื่นอ่านค่าใหม่ทันที (storage event)
// =========================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, User } from "../types/user";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // วินาที (unix)
  setAuth: (auth: AuthResponse) => void;
  setUser: (user: User) => void; // แก้ข้อมูลส่วนตัวแล้ว (token เดิม)
  logout: () => void;
}

const STORAGE_KEY = "pawhome-auth";
const signedOut = { user: null, token: null, refreshToken: null, expiresAt: null };

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...signedOut,
      setAuth: ({ user, token, refreshToken, expiresAt }) => set({ user, token, refreshToken, expiresAt }),
      setUser: (user) => set({ user }),
      logout: () => set(signedOut),
    }),
    { name: STORAGE_KEY },
  ),
);

// refresh token ใช้ได้ครั้งเดียว: ถ้าแท็บนี้ยังถือตัวเก่าอยู่ แล้วเอาไปใช้ Supabase จะยกเลิก session ทั้งชุด (ทุกแท็บหลุด)
// browser ยิง storage event ให้ "แท็บอื่น" ทุกครั้งที่ localStorage เปลี่ยน → โหลดค่าล่าสุดเข้ามา
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) void useAuthStore.persist.rehydrate();
  });
}
