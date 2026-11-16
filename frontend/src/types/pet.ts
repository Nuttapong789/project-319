// =========================================================
// Type ของข้อมูลน้อง — ต้องตรงกับ model Pet ใน prisma/schema.prisma ของ Backend
// ถ้า Backend เปลี่ยนชื่อช่อง ให้แก้ที่ไฟล์นี้ที่เดียว แล้ว TypeScript จะชี้ว่าต้องแก้ตรงไหนต่อ
// =========================================================

export type Species = "DOG" | "CAT" | "OTHER";
export type Sex = "MALE" | "FEMALE";
export type PetStatus = "AVAILABLE" | "PENDING" | "ADOPTED";

export interface Pet {
  id: number;
  name: string;
  species: Species;
  breed: string;
  ageMonths: number;
  sex: Sex;
  province: string;
  imageUrl: string;
  description: string;
  vaccinated: boolean;
  sterilized: boolean;
  urgent: boolean;
  status: PetStatus;
  createdAt: string;
  ownerId: string; // ผู้ใช้ที่โพสต์ (FK → User.id)
  ownerName: string; // ชื่อผู้โพสต์ ให้ Backend include มาด้วย จะได้ไม่ต้องยิง API เพิ่ม
}

// ข้อมูลที่ส่งไปตอนสร้าง/แก้ไข
// ไม่มี id, status, createdAt, ownerId, ownerName เพราะ Backend เป็นคนกำหนด (เจ้าของดูจาก token ที่ล็อกอิน)
export type PetInput = Omit<Pet, "id" | "status" | "createdAt" | "ownerId" | "ownerName">;

// ช่วงเวลาที่โพสต์: 0 = ทั้งหมด, 1 = 24 ชม., 7 = 7 วัน, 30 = 30 วัน
export type PostedWithin = 0 | 1 | 7 | 30;
export type Urgency = "ALL" | "URGENT" | "NORMAL";

// ตัวกรองที่ส่งไปกับ GET /pets
export interface PetFilters {
  species: Species | "ALL";
  province: string;
  search: string;
  postedWithin: PostedWithin;
  urgency: Urgency;
}

// ป้ายภาษาไทยสำหรับแสดงผล
export const speciesLabel: Record<Species, string> = { DOG: "สุนัข", CAT: "แมว", OTHER: "อื่น ๆ" };
export const sexLabel: Record<Sex, string> = { MALE: "ผู้", FEMALE: "เมีย" };
export const statusLabel: Record<PetStatus, string> = {
  AVAILABLE: "รอบ้าน",
  PENDING: "มีคนขอรับเลี้ยง",
  ADOPTED: "ได้บ้านแล้ว",
};

// "โพสต์เมื่อ 3 วันที่แล้ว"
export function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export function formatAge(ageMonths: number): string {
  if (ageMonths < 12) return `${ageMonths} เดือน`;
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  return months === 0 ? `${years} ปี` : `${years} ปี ${months} เดือน`;
}
