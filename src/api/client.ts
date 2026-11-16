// =========================================================
// ตัวกลางสำหรับเรียก Backend (Express)
// - API_URL มาจากไฟล์ .env (VITE_API_URL)
// - แนบ token ของคนที่ล็อกอินไปทุก request (Authorization: Bearer ...)
// - ถ้า Backend ตอบ error จะโยน ApiError ออกไป ให้ TanStack Query จับเป็น isError
// =========================================================

import { useAuthStore } from "../stores/useAuthStore";

export const API_URL = import.meta.env.VITE_API_URL ?? "";

// ใช้ข้อมูลจำลองเมื่อยังไม่ได้ตั้ง API_URL หรือสั่ง VITE_USE_MOCK=true
export const USE_MOCK = !API_URL || import.meta.env.VITE_USE_MOCK === "true";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  // ส่งไฟล์ (FormData) ไม่ต้องใส่ Content-Type เอง browser จะใส่ให้พร้อม boundary
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const token = useAuthStore.getState().token;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  // DELETE มักตอบ 204 (ไม่มีข้อมูล)
  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // token หมดอายุ / ไม่ถูกต้อง → ออกจากระบบให้เลย
    if (response.status === 401 && token) useAuthStore.getState().logout();

    // Backend ควรส่ง { message: "..." } มาตอน error
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : `เกิดข้อผิดพลาด (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return body as T;
}
