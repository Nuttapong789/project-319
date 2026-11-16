// =========================================================
// Zustand: ผู้ใช้ที่ล็อกอินอยู่ (Client State)
// - persist = เก็บลง localStorage ด้วย กด F5 แล้วยังล็อกอินอยู่
// - token ถูกแนบไปกับทุก request ใน api/client.ts (Authorization: Bearer ...)
// =========================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/user";

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "pawhome-auth" },
  ),
);
