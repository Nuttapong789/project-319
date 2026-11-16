import { z } from "zod";

// กฎเดียวกับ validate() ใน frontend/src/pages/PetFormPage.tsx
export const petInputSchema = z.object({
  name: z.string({ required_error: "กรุณากรอกชื่อน้อง" }).trim().min(2, "กรุณากรอกชื่อน้องอย่างน้อย 2 ตัวอักษร").max(100, "ชื่อน้องยาวเกิน 100 ตัวอักษร"),
  species: z.enum(["DOG", "CAT", "OTHER"], { errorMap: () => ({ message: "ชนิดสัตว์ไม่ถูกต้อง" }) }),
  breed: z.string().trim().max(100, "พันธุ์ยาวเกิน 100 ตัวอักษร").default(""),
  ageMonths: z
    .number({ required_error: "กรุณากรอกอายุ", invalid_type_error: "อายุต้องเป็นตัวเลข 0–300 เดือน" })
    .int("อายุต้องเป็นตัวเลข 0–300 เดือน")
    .min(0, "อายุต้องเป็นตัวเลข 0–300 เดือน")
    .max(300, "อายุต้องเป็นตัวเลข 0–300 เดือน"),
  sex: z.enum(["MALE", "FEMALE"], { errorMap: () => ({ message: "เพศไม่ถูกต้อง" }) }),
  province: z.string({ required_error: "กรุณาเลือกจังหวัด" }).trim().min(1, "กรุณาเลือกจังหวัด").max(100, "ชื่อจังหวัดยาวเกินไป"),
  imageUrl: z
    .string()
    .trim()
    .max(2048, "ลิงก์รูปยาวเกินไป")
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "ลิงก์รูปต้องขึ้นต้นด้วย http:// หรือ https://")
    .default(""),
  description: z.string({ required_error: "กรุณาเล่าเรื่องน้อง" }).trim().min(20, "เล่าเรื่องน้องอย่างน้อย 20 ตัวอักษร").max(5000, "เรื่องของน้องยาวเกิน 5000 ตัวอักษร"),
  vaccinated: z.boolean().default(false),
  sterilized: z.boolean().default(false),
  urgent: z.boolean().default(false),
});

// query ของ GET /pets — ไม่ส่งช่องไหนมา = ไม่กรองช่องนั้น (ตรงกับ getPets() ใน frontend/src/api/pets.ts)
export const petFiltersSchema = z.object({
  species: z.enum(["DOG", "CAT", "OTHER"], { errorMap: () => ({ message: "ชนิดสัตว์ไม่ถูกต้อง" }) }).optional(),
  province: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100, "คำค้นหายาวเกินไป").optional(),
  postedWithin: z.coerce
    .number()
    .refine((v) => [1, 7, 30].includes(v), "ช่วงเวลาที่โพสต์ต้องเป็น 1, 7 หรือ 30 วัน")
    .optional(),
  urgent: z
    .enum(["true", "false"], { errorMap: () => ({ message: "urgent ต้องเป็น true หรือ false" }) })
    .transform((v) => v === "true")
    .optional(),
});

export type PetInput = z.infer<typeof petInputSchema>;
export type PetFilters = z.infer<typeof petFiltersSchema>;
