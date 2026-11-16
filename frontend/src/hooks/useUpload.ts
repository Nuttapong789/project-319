import { useMutation } from "@tanstack/react-query";
import { uploadImage } from "../api/uploads";

// อัปโหลดรูป 1 ไฟล์ → ได้ลิงก์รูปกลับมา
export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => uploadImage(file),
  });
}
