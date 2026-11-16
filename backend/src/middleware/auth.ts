import type { RequestHandler, Response } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { profilesRepository } from "../repositories/profiles.repository.js";
import type { User } from "../types/dto.js";
import { ApiError } from "./error.js";

// อ่าน "Authorization: Bearer <access token ของ Supabase>" แล้วให้ Supabase Auth ยืนยัน token
// shortcut: getUser() ยิงไป Supabase ทุก request, ถ้าโหลดสูงเปลี่ยนเป็น auth.getClaims() ที่ตรวจ JWT ในเครื่องด้วย JWKS
export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new ApiError(401, "กรุณาเข้าสู่ระบบก่อน");

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new ApiError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");

  const profile = await profilesRepository.findById(data.user.id);
  if (!profile) throw new ApiError(401, "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");

  res.locals.user = { id: profile.id, name: profile.name, email: data.user.email ?? "" } satisfies User;
  res.locals.token = token;
  next();
};

// ใช้ใน controller ที่อยู่หลัง requireAuth
export const currentUser = (res: Response): User => res.locals.user as User;
export const currentToken = (res: Response): string => res.locals.token as string;
