// =========================================================
// เข้าสู่ระบบ / สมัครสมาชิก / ออกจากระบบ
// ผลลัพธ์ (user + token) เก็บใน Zustand (useAuthStore) เพราะเป็นสถานะของหน้าเว็บ ไม่ใช่รายการข้อมูลจาก Database
// =========================================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, register } from "../api/auth";
import { useAuthStore } from "../stores/useAuthStore";
import { toast } from "../stores/useToastStore";
import type { AuthResponse, LoginInput, RegisterInput } from "../types/user";

// เปลี่ยนคนล็อกอิน → ล้างข้อมูล "ของฉัน" ของคนเก่าออกจาก cache
function useSaveAuth() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  return ({ user, token }: AuthResponse) => {
    queryClient.removeQueries({ queryKey: ["me"] });
    setAuth(user, token);
    return user;
  };
}

export function useLogin() {
  const saveAuth = useSaveAuth();
  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (data) => toast(`ยินดีต้อนรับ ${saveAuth(data).name}`),
  });
}

export function useRegister() {
  const saveAuth = useSaveAuth();
  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: (data) => toast(`สมัครสมาชิกสำเร็จ ยินดีต้อนรับ ${saveAuth(data).name}`),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  return () => {
    logout();
    queryClient.removeQueries({ queryKey: ["me"] });
    toast("ออกจากระบบแล้ว", "info");
  };
}
