// =========================================================
// Type ของผู้ใช้ — ต้องตรงกับ model User ใน schema.prisma (ยกเว้น password ที่ Backend ห้ามส่งกลับมา)
// =========================================================

export interface User {
  id: string; // UUID จาก Supabase Auth
  name: string;
  email: string;
  avatarUrl?: string; // ยังไม่มีระบบรูปโปรไฟล์ — ไม่มีก็แสดงตัวอักษรแรกของชื่อแทน
}

// ชื่อสั้นบน Navbar: "THITIWUT TANGTANAKUL" → "THITIWUT T." · ชื่อคำเดียวใช้ตามเดิม (ยาวเกินตัดด้วย CSS)
export function shortName(name: string): string {
  const [first = "", second] = name.trim().split(/\s+/);
  return second ? `${first} ${Array.from(second)[0]}.` : first;
}

// ตัวอักษรบน avatar: ข้ามสระหน้า (เ แ โ ใ ไ) ไม่ให้ "เอ" ออกมาเป็น "เ"
export function initialOf(name: string): string {
  const first = Array.from(name.trim()).find((ch) => !/[เ-ไ\s]/.test(ch));
  return (first ?? "?").toUpperCase();
}

// สิ่งที่ Backend ตอบกลับตอนเข้าสู่ระบบ / สมัครสมาชิก
export interface AuthResponse {
  user: User;
  token: string; // access token อายุสั้น (Supabase ค่าเริ่มต้น 1 ชม.)
  refreshToken: string; // แลก token ใหม่ที่ POST /auth/refresh (ใช้ได้ครั้งเดียว)
  expiresAt: number; // วินาที (unix) ที่ token หมดอายุ
}

// สมัครแล้ว: ได้ session เลย หรือ (โปรเจกต์เปิดยืนยันอีเมล) ต้องไปกดลิงก์ในอีเมลก่อน
export type RegisterResult = AuthResponse | { needsVerification: true; email: string };

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// กันไม่ให้ ?redirect= พาออกไปเว็บอื่น (รับเฉพาะลิงก์ในเว็บเรา เช่น "/pets/3")
export function safeRedirect(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}
