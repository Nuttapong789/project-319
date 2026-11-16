import { z } from "zod";

// กฎเดียวกับ LoginPage / RegisterPage ในหน้าเว็บ
const email = z
  .string({ required_error: "กรุณากรอกอีเมล" })
  .trim()
  .toLowerCase()
  .email("รูปแบบอีเมลไม่ถูกต้อง")
  .max(254, "อีเมลยาวเกินไป");

export const registerSchema = z.object({
  name: z.string({ required_error: "กรุณากรอกชื่อ" }).trim().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร").max(100, "ชื่อยาวเกิน 100 ตัวอักษร"),
  email,
  password: z.string({ required_error: "กรุณากรอกรหัสผ่าน" }).min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร").max(72, "รหัสผ่านยาวเกิน 72 ตัวอักษร"),
});

export const loginSchema = z.object({
  email,
  password: z.string({ required_error: "กรุณากรอกรหัสผ่าน" }).min(1, "กรุณากรอกรหัสผ่าน").max(72, "รหัสผ่านยาวเกิน 72 ตัวอักษร"),
});

export const refreshSchema = z.object({
  refreshToken: z.string({ required_error: "กรุณาเข้าสู่ระบบใหม่" }).min(1, "กรุณาเข้าสู่ระบบใหม่").max(2048),
});

// แก้ข้อมูลส่วนตัว — ตอนนี้แก้ได้เฉพาะชื่อที่แสดง (ตาราง profiles มีแค่ name)
export const profileSchema = z.object({
  name: z.string({ required_error: "กรุณากรอกชื่อ" }).trim().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร").max(100, "ชื่อยาวเกิน 100 ตัวอักษร"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
