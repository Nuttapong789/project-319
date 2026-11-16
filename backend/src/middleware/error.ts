import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";

// error ที่ตั้งใจโยน: status + ข้อความภาษาไทยที่หน้าเว็บแสดงได้เลย
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "ไม่พบ API นี้" });
};

// ทุก error มาจบที่นี่ ตอบรูปแบบเดียว { message } ตามที่ frontend/src/api/client.ts อ่าน
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ message: err.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" });
    return;
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "ไฟล์ใหญ่เกิน 2 MB" : "อัปโหลดได้ครั้งละ 1 รูป ในช่องชื่อ image";
    res.status(400).json({ message });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ message: "ข้อมูลนี้มีอยู่แล้ว" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ message: "ไม่พบข้อมูล" });
      return;
    }
  }
  // body-parser: JSON พัง / ใหญ่เกิน
  if (typeof err?.status === "number" && err.status >= 400 && err.status < 500 && err.type) {
    res.status(err.status).json({ message: "รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง" });
    return;
  }

  console.error(err);
  res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ ลองใหม่อีกครั้ง" });
};
