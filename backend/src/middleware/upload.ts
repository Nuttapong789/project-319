import multer from "multer";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

// เก็บไฟล์ไว้ในหน่วยความจำ แล้วส่งต่อ Supabase Storage (ไม่เขียนลงดิสก์ของ server)
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
}).single("image");
