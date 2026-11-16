// =========================================================
// เข้าสู่ระบบ / สมัครสมาชิก / ออกจากระบบ
// ผลลัพธ์ (user + token) เก็บใน Zustand (useAuthStore) เพราะเป็นสถานะของหน้าเว็บ ไม่ใช่รายการข้อมูลจาก Database
// เปลี่ยนคนล็อกอิน (ทุกแท็บ) → main.tsx ล้าง cache ข้อมูล "ของฉัน" ของคนเก่าให้เอง
// =========================================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, logout as logoutRequest, register, updateProfile } from "../api/auth";
import { useAuthStore } from "../stores/useAuthStore";
import { toast } from "../stores/useToastStore";
import type { LoginInput, RegisterInput } from "../types/user";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (data) => {
      setAuth(data);
      toast(`ยินดีต้อนรับ ${data.user.name}`);
    },
  });
}

// โปรเจกต์ที่เปิดยืนยันอีเมล: ได้ { needsVerification } กลับมา ยังไม่ล็อกอิน (RegisterPage แสดงให้ไปเช็คอีเมล)
export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: (data) => {
      if ("needsVerification" in data) return;
      setAuth(data);
      toast(`สมัครสมาชิกสำเร็จ ยินดีต้อนรับ ${data.user.name}`);
    },
  });
}

// แก้ชื่อที่แสดง → อัปเดต Navbar ทันที (และแท็บอื่นผ่าน localStorage) · โหลดโพสต์/คำขอใหม่ให้ชื่อผู้โพสต์ตรง
export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => updateProfile(name),
    onSuccess: (user) => {
      setUser(user);
      toast("บันทึกข้อมูลส่วนตัวแล้ว");
      return queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return () => {
    // ไม่ต้องรอ: logoutRequest อ่าน session ไว้แล้วตั้งแต่บรรทัดนี้ เรียกไม่สำเร็จ (เน็ตหลุด) ก็ยังออกจากระบบในเครื่องได้
    logoutRequest().catch(() => {});
    logout();
    toast("ออกจากระบบแล้ว", "info");
  };
}
