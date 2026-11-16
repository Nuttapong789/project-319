// =========================================================
// ตัวกลางสำหรับเรียก Backend (Express)
// - API_URL มาจากไฟล์ .env (VITE_API_URL)
// - แนบ token ของคนที่ล็อกอินไปทุก request (Authorization: Bearer ...)
// - token ใกล้หมดอายุ หรือ Backend ตอบ 401 → ขอ token ใหม่ด้วย refreshToken แล้วยิงซ้ำ 1 ครั้ง
//   refresh ไม่ผ่าน (ถูก logout / refresh token หมดอายุ) → ออกจากระบบให้เลย
// - ถ้า Backend ตอบ error จะโยน ApiError ออกไป ให้ TanStack Query จับเป็น isError
// =========================================================

import { useAuthStore } from "../stores/useAuthStore";
import type { AuthResponse } from "../types/user";

export const API_URL = import.meta.env.VITE_API_URL ?? "";

// ใช้ข้อมูลจำลองเมื่อยังไม่ได้ตั้ง API_URL หรือสั่ง VITE_USE_MOCK=true
export const USE_MOCK = !API_URL || import.meta.env.VITE_USE_MOCK === "true";

// ขอ token ใหม่ก่อนหมดอายุจริง 60 วินาที กันหมดระหว่างทาง
const REFRESH_EARLY_SECONDS = 60;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// หลาย request ในแท็บเดียวเจอ token หมดพร้อมกัน → ใช้ refresh ก้อนเดียวกัน (refresh token ใช้ได้ครั้งเดียว)
let refreshing: Promise<string | null> | null = null;

// คืน token ใหม่ หรือ null ถ้า refresh ไม่ได้ (ออกจากระบบให้แล้ว)
// เน็ตหลุด / Backend ตอบ 429 หรือ 5xx → โยน error และยังไม่ล็อกเอาต์ (ลองใหม่ได้)
// staleToken = token ที่ใช้ไม่ได้แล้ว ถ้าแท็บอื่นได้ตัวใหม่มาแทนแล้ว ก็ใช้ตัวนั้นเลยไม่ต้อง refresh ซ้ำ
export function refreshSession(staleToken = useAuthStore.getState().token): Promise<string | null> {
  refreshing ??= withRefreshLock(() => doRefresh(staleToken)).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

// ข้ามแท็บ: Web Locks API ให้ refresh ทีละแท็บ (Chrome 69+, Firefox 96+, Safari 15.4+) · ไม่มีก็ทำต่อแบบไม่ล็อก
function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  return locks ? locks.request("pawhome-auth-refresh", fn) : fn();
}

async function doRefresh(staleToken: string | null): Promise<string | null> {
  // ระหว่างรอคิว แท็บอื่นอาจ refresh เสร็จแล้ว (localStorage มีชุดใหม่) → อ่านใหม่ก่อน
  await useAuthStore.persist.rehydrate();
  const { token, expiresAt, refreshToken, logout, setAuth } = useAuthStore.getState();
  if (token && token !== staleToken && !isExpiring(expiresAt)) return token;
  if (!refreshToken) return null;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  // 400/401 = refresh token ใช้ไม่ได้จริง → ออกจากระบบ (เฉพาะถ้ายังเป็น session เดิม อาจล็อกอินใหม่ไปแล้วระหว่างรอ)
  if (response.status === 400 || response.status === 401) {
    if (useAuthStore.getState().refreshToken === refreshToken) logout();
    return null;
  }
  if (!response.ok) throw new ApiError(response.status, messageOf(await response.json().catch(() => null), response.status));
  const session = (await response.json()) as AuthResponse;
  // ออกจากระบบไประหว่างรอ → ห้ามเอา session กลับมาใส่
  if (useAuthStore.getState().refreshToken !== refreshToken) return null;
  setAuth(session);
  return session.token;
}

// ออกจากระบบฝั่ง Backend จาก snapshot ของ session (เรียกก่อนล้าง store ได้เลย ไม่แตะ store)
// token ใกล้หมด → refresh ก่อน เพื่อให้ Backend ยกเลิก session ได้จริง ไม่ทิ้ง refresh token ค้างไว้
export async function revokeSession(snapshot: { token: string | null; refreshToken: string | null; expiresAt: number | null }) {
  let { token } = snapshot;
  if (isExpiring(snapshot.expiresAt) && snapshot.refreshToken) {
    // ต่อคิวกับแท็บอื่นที่อาจกำลัง refresh ด้วย refresh token ตัวเดียวกัน
    token = await withRefreshLock(async () => {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: snapshot.refreshToken }),
      });
      return response.ok ? ((await response.json()) as AuthResponse).token : null;
    });
  }
  if (token) await send("/auth/logout", { method: "POST" }, token);
}

const isExpiring = (expiresAt: number | null) =>
  expiresAt !== null && expiresAt - REFRESH_EARLY_SECONDS <= Date.now() / 1000;

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let { token } = useAuthStore.getState();
  if (token && isExpiring(useAuthStore.getState().expiresAt)) token = await refreshSession(token);

  let response = await send(path, options, token);

  // token ถูกปฏิเสธ (หมดอายุก่อนกำหนด / ถูกยกเลิก) → ลอง refresh แล้วยิงซ้ำครั้งเดียว
  if (response.status === 401 && token) {
    const renewed = await refreshSession(token);
    if (renewed) response = await send(path, options, renewed);
    else useAuthStore.getState().logout();
  }

  // DELETE มักตอบ 204 (ไม่มีข้อมูล)
  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, messageOf(body, response.status));
  return body as T;
}

// Backend ส่ง { message: "..." } มาตอน error
function messageOf(body: unknown, status: number): string {
  return body && typeof body === "object" && "message" in body && typeof body.message === "string"
    ? body.message
    : `เกิดข้อผิดพลาด (${status})`;
}

function send(path: string, options: RequestInit, token: string | null) {
  const headers = new Headers(options.headers);
  // ส่งไฟล์ (FormData) ไม่ต้องใส่ Content-Type เอง browser จะใส่ให้พร้อม boundary
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_URL}${path}`, { ...options, headers });
}
