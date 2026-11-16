// =========================================================
// เข้าสู่ระบบ / สมัครสมาชิก / ออกจากระบบ
//   POST /auth/login     { email, password }        → { user, token, refreshToken, expiresAt }
//   POST /auth/register  { name, email, password }  → { user, token, refreshToken, expiresAt }
//   POST /auth/refresh   { refreshToken }           → session ใหม่ (เรียกเองอัตโนมัติใน client.ts)
//   POST /auth/logout                               → ยกเลิก session ฝั่ง Supabase
// =========================================================

import { useAuthStore } from "../stores/useAuthStore";
import type { AuthResponse, LoginInput, RegisterInput, RegisterResult, User } from "../types/user";
import { request, revokeSession, USE_MOCK } from "./client";
import { mockLogin, mockRegister, mockUpdateProfile } from "./mockPets";

export function login(input: LoginInput): Promise<AuthResponse> {
  if (USE_MOCK) return mockLogin(input);
  return request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) });
}

export function register(input: RegisterInput): Promise<RegisterResult> {
  if (USE_MOCK) return mockRegister(input);
  return request<RegisterResult>("/auth/register", { method: "POST", body: JSON.stringify(input) });
}

// PATCH /me/profile { name } → User (แก้ได้เฉพาะชื่อที่แสดง)
export function updateProfile(name: string): Promise<User> {
  if (USE_MOCK) return mockUpdateProfile(name);
  return request<User>("/me/profile", { method: "PATCH", body: JSON.stringify({ name }) });
}

// เก็บ session ไว้ก่อน แล้วค่อยล้าง store ได้ทันที (ไม่ต้องรอเน็ต)
export async function logout(): Promise<void> {
  if (USE_MOCK) return;
  const { token, refreshToken, expiresAt } = useAuthStore.getState();
  await revokeSession({ token, refreshToken, expiresAt });
}
