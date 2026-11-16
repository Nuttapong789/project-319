import { describe, expect, it } from "vitest";
import { supabaseUrlSchema } from "../src/config/env.js";
import { derivePetStatus } from "../src/services/adoptions.service.js";
import { detectImageType } from "../src/services/uploads.service.js";
import { adoptionInputSchema } from "../src/validators/adoptions.validator.js";
import { petFiltersSchema, petInputSchema } from "../src/validators/pets.validator.js";

describe("SUPABASE_URL validation", () => {
  it.each([
    "https://xlbjxpsaciesbtpnxelw.supabase.co",
    "https://xlbjxpsaciesbtpnxelw.supabase.co/",
    "http://localhost:54321",
    "http://127.0.0.1:54321",
  ])("accepts %s", (url) => {
    expect(supabaseUrlSchema.safeParse(url).success).toBe(true);
  });

  it.each([
    ["https://xlbjxpsaciesbtpnxelw.supabase.co/rest/v1/", /ตัด "\/rest\/v1\/" ออก/],
    ["https://abc.supabase.co?x=1", /Project URL อย่างเดียว/],
    ["https://abc.supabase.co/#top", /Project URL อย่างเดียว/],
    ["http://abc.supabase.co", /ต้องเป็น https/],
    ["abc.supabase.co", /ไม่ใช่ URL/],
  ])("rejects %s with a clear message", (url, message) => {
    const result = supabaseUrlSchema.safeParse(url);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message).join(" ")).toMatch(message);
  });
});

describe("derivePetStatus", () => {
  it.each([
    [[], "AVAILABLE"],
    [["REJECTED"], "AVAILABLE"],
    [["PENDING", "REJECTED"], "PENDING"],
    [["APPROVED", "REJECTED", "PENDING"], "ADOPTED"],
  ] as const)("%j → %s", (statuses, expected) => {
    expect(derivePetStatus([...statuses])).toBe(expected);
  });
});

describe("detectImageType", () => {
  it("reads magic bytes, not the file name", () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectImageType(Buffer.from("RIFF0000WEBPVP8 "))).toBe("image/webp");
    expect(detectImageType(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
  });
});

describe("validators", () => {
  const pet = {
    name: "ข้าวตัง",
    species: "DOG",
    breed: "พันทาง",
    ageMonths: 24,
    sex: "MALE",
    province: "กรุงเทพมหานคร",
    imageUrl: "",
    description: "ขี้อ้อน ชอบเดินเล่นตอนเย็น ขับถ่ายเป็นที่แล้ว",
    vaccinated: true,
    sterilized: true,
    urgent: true,
  };

  it("accepts the same pet the frontend form sends", () => {
    expect(petInputSchema.parse(pet)).toEqual(pet);
  });

  it.each([
    [{ name: "ก" }, "กรุณากรอกชื่อน้องอย่างน้อย 2 ตัวอักษร"],
    [{ ageMonths: 301 }, "อายุต้องเป็นตัวเลข 0–300 เดือน"],
    [{ ageMonths: 1.5 }, "อายุต้องเป็นตัวเลข 0–300 เดือน"],
    [{ description: "สั้นไป" }, "เล่าเรื่องน้องอย่างน้อย 20 ตัวอักษร"],
    [{ province: "" }, "กรุณาเลือกจังหวัด"],
    [{ imageUrl: "javascript:alert(1)" }, "ลิงก์รูปต้องขึ้นต้นด้วย http:// หรือ https://"],
    [{ species: "BIRD" }, "ชนิดสัตว์ไม่ถูกต้อง"],
  ])("rejects %j", (patch, message) => {
    const result = petInputSchema.safeParse({ ...pet, ...patch });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });

  it("parses GET /pets query strings", () => {
    expect(petFiltersSchema.parse({ urgent: "true", postedWithin: "7", species: "CAT" })).toEqual({
      urgent: true,
      postedWithin: 7,
      species: "CAT",
    });
    expect(petFiltersSchema.safeParse({ postedWithin: "3" }).success).toBe(false);
    expect(petFiltersSchema.safeParse({ urgent: "yes" }).success).toBe(false);
  });

  it("normalises phone like the frontend (strips spaces and dashes)", () => {
    const input = { phone: "081-234 5678", housing: "HOUSE", message: "บ้านมีสนามหญ้า มีคนอยู่บ้านตลอดทั้งวัน" };
    expect(adoptionInputSchema.parse(input).phone).toBe("0812345678");
    expect(adoptionInputSchema.safeParse({ ...input, phone: "1234567890" }).success).toBe(false);
  });
});
