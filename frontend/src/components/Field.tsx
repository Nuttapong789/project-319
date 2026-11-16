import type { ReactNode } from "react";

// ช่องในฟอร์ม: ชื่อช่อง + ช่องกรอก + คำอธิบาย (จาง 50%) + ข้อความ error (สีแดง)
// ใช้ร่วมกันทุกฟอร์ม: โพสต์น้อง, เข้าสู่ระบบ, สมัครสมาชิก, ขอรับเลี้ยง
export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 font-medium">
      {label}
      {children}
      {hint && <span className="text-sm font-normal opacity-50">{hint}</span>}
      {error && <span className="text-sm font-normal text-danger">{error}</span>}
    </label>
  );
}

// class ของช่องกรอก: ถ้ามี error ขอบเป็นสีแดง
export const inputClass = (hasError: boolean) =>
  `min-h-12 px-3 rounded-xl border bg-white text-ink font-normal ${hasError ? "border-danger border-2" : "border-line"}`;
