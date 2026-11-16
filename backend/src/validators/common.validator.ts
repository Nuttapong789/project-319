import { z } from "zod";
import { ApiError } from "../middleware/error.js";

// id ใน URL เช่น /pets/3 — ไม่ใช่ตัวเลขบวก = ไม่มีทางเจอ ตอบ 404 เหมือนหาไม่เจอ
export function parseId(value: unknown, notFoundMessage: string): number {
  const parsed = z.coerce.number().int().positive().max(2_147_483_647).safeParse(value);
  if (!parsed.success) throw new ApiError(404, notFoundMessage);
  return parsed.data;
}
