import { env } from "../config/env.js";
import { createAnonClient, supabaseAdmin } from "../config/supabase.js";
import { ApiError } from "../middleware/error.js";
import { profilesRepository } from "../repositories/profiles.repository.js";
import type { User } from "../types/dto.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validator.js";

export interface AuthResponse {
  user: User;
  token: string; // access token ของ Supabase (อายุสั้น ค่าเริ่มต้น 1 ชม.)
  refreshToken: string; // ใช้ครั้งเดียว ได้ตัวใหม่ทุกครั้งที่ refresh
  expiresAt: number; // วินาที (unix) ที่ token หมดอายุ
}

// โปรเจกต์เปิด "Confirm email" → สมัครแล้วยังไม่ได้ session ต้องกดลิงก์ในอีเมลก่อน
export interface VerificationPending {
  needsVerification: true;
  email: string;
}

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in: number;
  user: { id: string; email?: string; user_metadata?: { name?: unknown } };
}

interface AuthErrorLike {
  code?: string;
  status?: number;
  message: string;
}

// แปลง error ของ Supabase Auth ตามชนิด — "รหัสผิด" ใช้เฉพาะกรณีรหัสผิดจริง
function authFailure(error: AuthErrorLike, invalidMessage: string): ApiError {
  if (error.status === 429 || error.code?.startsWith("over_")) {
    return new ApiError(429, "มีคนเข้าสู่ระบบจากเครือข่ายนี้ถี่เกินไป กรุณารอสักครู่แล้วลองใหม่");
  }
  if (error.code === "email_not_confirmed") return new ApiError(403, "กรุณายืนยันอีเมลก่อน (กดลิงก์ในอีเมลที่ได้รับตอนสมัคร)");
  if (error.code === "user_banned") return new ApiError(403, "บัญชีนี้ถูกระงับ");
  if (error.status !== undefined && error.status >= 400 && error.status < 500) return new ApiError(401, invalidMessage);
  console.error("supabase auth:", error.code ?? error.status, error.message);
  return new ApiError(502, "ระบบยืนยันตัวตนขัดข้องชั่วคราว ลองใหม่อีกครั้ง");
}

async function toAuthResponse(session: SupabaseSession): Promise<AuthResponse> {
  // ปกติ trigger on_auth_user_created สร้าง profile ให้ตอนสมัคร · ถ้าไม่มี (เช่น trigger ยังไม่ได้ติดตั้ง) สร้างตอนนี้ ไม่ให้เข้าระบบไม่ได้
  const profile =
    (await profilesRepository.findById(session.user.id)) ??
    (await profilesRepository.create(session.user.id, fallbackName(session.user)));
  return {
    user: { id: profile.id, name: profile.name, email: session.user.email ?? "" },
    token: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in,
  };
}

function fallbackName(user: SupabaseSession["user"]): string {
  const name = typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";
  return (name || user.email?.split("@")[0] || "ผู้ใช้").slice(0, 100);
}

export const authService = {
  // รหัสผ่านเก็บใน Supabase Auth (hash ด้วย bcrypt) — Backend ไม่เคยเก็บเอง
  async login({ email, password }: LoginInput): Promise<AuthResponse> {
    const { data, error } = await createAnonClient().auth.signInWithPassword({ email, password });
    if (error) throw authFailure(error, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    if (!data.session) throw new ApiError(401, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    return toAuthResponse(data.session);
  },

  // แลก refresh token เป็น session ใหม่ — Supabase หมุน refresh token ให้ทุกครั้ง ตัวเก่าใช้ซ้ำไม่ได้
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const { data, error } = await createAnonClient().auth.refreshSession({ refresh_token: refreshToken });
    if (error) throw authFailure(error, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    if (!data.session) throw new ApiError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    return toAuthResponse(data.session);
  },

  // สมัครแบบปกติของ Supabase (ไม่ใช้ Admin API) → Supabase ส่งอีเมลยืนยันตามการตั้งค่าโปรเจกต์
  // ปิด Confirm email = ได้ session เลย · เปิด = ต้องยืนยันอีเมลก่อนแล้วค่อยเข้าสู่ระบบ
  async register({ name, email, password }: RegisterInput): Promise<AuthResponse | VerificationPending> {
    const { data, error } = await createAnonClient().auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: `${env.APP_URL}/login?verified=1` },
    });
    if (error) {
      if (error.code === "user_already_exists" || error.code === "email_exists") throw new ApiError(409, "อีเมลนี้มีผู้ใช้แล้ว");
      if (error.code === "weak_password") throw new ApiError(400, "รหัสผ่านไม่ผ่านเงื่อนไขของระบบ");
      if (error.code === "email_address_invalid") throw new ApiError(400, "อีเมลนี้ใช้สมัครไม่ได้");
      if (error.code === "signup_disabled") throw new ApiError(403, "ปิดรับสมัครสมาชิกอยู่");
      throw authFailure(error, "สมัครสมาชิกไม่สำเร็จ");
    }
    if (data.session) return toAuthResponse(data.session);
    // อีเมลที่มีบัญชีอยู่แล้ว Supabase ก็ตอบแบบนี้เหมือนกัน (ไม่บอกว่ามีบัญชี กันการไล่เดาอีเมล)
    return { needsVerification: true, email };
  },

  // ชื่อใหม่แสดงทันทีในโพสต์และคำขอทั้งหมด (ownerName / userName อ่านจาก profiles ตอน query)
  async updateProfile(user: User, name: string): Promise<User> {
    const profile = await profilesRepository.updateName(user.id, name);
    return { ...user, name: profile.name };
  },

  // ยกเลิก refresh token ของ session นี้ (access token ที่ออกไปแล้วยังใช้ได้จนหมดอายุ เป็นธรรมชาติของ JWT)
  async logout(token: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.signOut(token, "local");
    if (error) console.warn("logout:", error.message);
  },
};
