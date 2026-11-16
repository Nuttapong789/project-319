// =========================================================
// Type ของผู้ใช้ — ต้องตรงกับ model User ใน schema.prisma (ยกเว้น password ที่ Backend ห้ามส่งกลับมา)
// =========================================================

export interface User {
  id: number;
  name: string;
  email: string;
}

// สิ่งที่ Backend ตอบกลับตอนเข้าสู่ระบบ / สมัครสมาชิก
export interface AuthResponse {
  user: User;
  token: string;
}

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
