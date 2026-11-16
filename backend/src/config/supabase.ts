import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const options = { auth: { persistSession: false, autoRefreshToken: false } };

// service role: ข้าม RLS ได้ ใช้เฉพาะฝั่ง Backend (ตรวจ token, สร้างผู้ใช้, อัปโหลดรูป) ห้ามส่งไปหน้าเว็บ
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);

// client ใหม่ต่อการล็อกอินแต่ละครั้ง เพราะ signInWithPassword เก็บ session ไว้ใน client ตัวนั้น
export const createAnonClient = () => createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, options);
