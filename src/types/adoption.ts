// =========================================================
// Type ของคำขอรับเลี้ยง — ตรงกับ model AdoptionRequest ใน schema.prisma
// 1 คนขอน้อง 1 ตัวได้ครั้งเดียว → @@unique([userId, petId])
// =========================================================

import type { Pet } from "./pet";

export type AdoptionStatus = "PENDING" | "APPROVED" | "REJECTED";
export type Housing = "HOUSE" | "CONDO" | "DORM";

export interface AdoptionRequest {
  id: number;
  petId: number;
  userId: number;
  userName: string;
  phone: string;
  housing: Housing;
  message: string;
  status: AdoptionStatus;
  createdAt: string;
  pet: Pet; // Backend include ข้อมูลน้องมาด้วย (ใช้ในหน้า "ของฉัน")
}

// ข้อมูลที่ผู้ขอกรอกในฟอร์ม
export type AdoptionInput = Pick<AdoptionRequest, "phone" | "housing" | "message">;

export const adoptionStatusLabel: Record<AdoptionStatus, string> = {
  PENDING: "รอผู้โพสต์พิจารณา",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ไม่ผ่าน",
};

export const housingLabel: Record<Housing, string> = {
  HOUSE: "บ้านเดี่ยว / ทาวน์เฮาส์",
  CONDO: "คอนโด / อพาร์ตเมนต์",
  DORM: "หอพัก",
};
