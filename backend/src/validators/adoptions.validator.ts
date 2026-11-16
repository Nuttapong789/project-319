import { z } from "zod";

// กฎเดียวกับ AdoptionForm ใน frontend/src/components/AdoptionPanel.tsx
export const adoptionInputSchema = z.object({
  phone: z
    .string({ required_error: "กรุณากรอกเบอร์โทร" })
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^0\d{8,9}$/.test(v), "เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9–10 หลัก"),
  housing: z.enum(["HOUSE", "CONDO", "DORM"], { errorMap: () => ({ message: "กรุณาเลือกที่พักอาศัย" }) }),
  message: z.string({ required_error: "กรุณาแนะนำตัว" }).trim().min(20, "เล่าเกี่ยวกับตัวคุณอย่างน้อย 20 ตัวอักษร").max(2000, "ข้อความยาวเกิน 2000 ตัวอักษร"),
});

export const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], { errorMap: () => ({ message: "status ต้องเป็น APPROVED หรือ REJECTED" }) }),
});

export type AdoptionInput = z.infer<typeof adoptionInputSchema>;
export type ReviewStatus = z.infer<typeof reviewSchema>["status"];
