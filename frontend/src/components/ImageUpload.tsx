import { useState, type ChangeEvent } from "react";
import { useUploadImage } from "../hooks/useUpload";
import PetImage from "./PetImage";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 2;

// เลือกรูปจากเครื่อง → อัปโหลด → ได้ลิงก์กลับมาใส่ imageUrl
export default function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const upload = useUploadImage();
  const [fileError, setFileError] = useState("");

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // เลือกไฟล์เดิมซ้ำได้
    if (!file) return;

    // ตรวจไฟล์ก่อนส่ง (Backend ต้องตรวจซ้ำ)
    if (!ACCEPT.includes(file.type)) return setFileError("รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP");
    if (file.size > MAX_MB * 1024 * 1024) return setFileError(`ไฟล์ใหญ่เกิน ${MAX_MB} MB`);

    setFileError("");
    upload.mutate(file, { onSuccess: (url) => onChange(url) });
  }

  const error = fileError || upload.error?.message;

  return (
    <div className="flex flex-col gap-2">
      <span className="font-medium">รูปน้อง</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-40 h-32 rounded-2xl overflow-hidden border border-line">
          {/* key = เปลี่ยนรูปแล้วให้ PetImage เริ่มใหม่ (ล้างสถานะ "รูปเสีย") */}
          <PetImage key={value} src={value} alt="ตัวอย่างรูปน้อง" className="w-full h-full" />
          {upload.isPending && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-sm font-semibold text-navy">
              กำลังอัปโหลด...
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {/* input ซ่อนอยู่ใน label กดที่ปุ่มก็เปิดหน้าต่างเลือกไฟล์ */}
            <label className="min-h-11 px-5 flex items-center rounded-xl bg-navy-soft text-navy font-semibold cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-navy">
              <input type="file" accept={ACCEPT.join(",")} onChange={handleFile} disabled={upload.isPending} className="sr-only" />
              {value ? "เปลี่ยนรูป" : "เลือกรูปจากเครื่อง"}
            </label>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={upload.isPending}
                className="min-h-11 px-4 rounded-xl border border-line hover:border-danger hover:text-danger"
              >
                ลบรูป
              </button>
            )}
          </div>
          <span className="text-sm opacity-50">JPG, PNG หรือ WEBP ไม่เกิน {MAX_MB} MB</span>
          {error && <span role="alert" className="text-sm text-danger">{error}</span>}
        </div>
      </div>
    </div>
  );
}
