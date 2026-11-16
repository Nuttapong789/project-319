import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../config/supabase.js";
import { ApiError } from "../middleware/error.js";

const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// ตรวจไบต์หัวไฟล์จริง ไม่เชื่อแค่ Content-Type ที่ browser ส่งมา
export function detectImageType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export const uploadsService = {
  async uploadPetImage(userId: string, file: Express.Multer.File | undefined): Promise<{ url: string }> {
    if (!file) throw new ApiError(400, "กรุณาเลือกรูป (ช่องชื่อ image)");
    const type = detectImageType(file.buffer);
    if (!type) throw new ApiError(400, "รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP");

    // แยกโฟลเดอร์ตามผู้ใช้ ชื่อไฟล์สุ่ม กันชนและกันเดาชื่อ
    const path = `${userId}/${randomUUID()}.${EXTENSIONS[type]}`;
    const bucket = supabaseAdmin.storage.from(env.STORAGE_BUCKET);
    const { error } = await bucket.upload(path, file.buffer, { contentType: type, upsert: false });
    if (error) {
      console.error("storage upload:", error.message);
      throw new ApiError(502, "อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
    return { url: bucket.getPublicUrl(path).data.publicUrl };
  },
};
