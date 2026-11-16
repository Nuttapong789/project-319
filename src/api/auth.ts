// =========================================================
// เข้าสู่ระบบ / สมัครสมาชิก
//   POST /auth/login     { email, password }        → { user, token }
//   POST /auth/register  { name, email, password }  → { user, token }
// =========================================================

import type { AuthResponse, LoginInput, RegisterInput } from "../types/user";
import { request, USE_MOCK } from "./client";
import { mockLogin, mockRegister } from "./mockPets";

export function login(input: LoginInput): Promise<AuthResponse> {
  if (USE_MOCK) return mockLogin(input);
  return request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) });
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  if (USE_MOCK) return mockRegister(input);
  return request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(input) });
}
