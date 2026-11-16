import { z } from "zod";

export const favoriteInputSchema = z.object({
  petId: z.number({ required_error: "กรุณาระบุน้อง", invalid_type_error: "petId ต้องเป็นตัวเลข" }).int().positive("petId ไม่ถูกต้อง"),
});
