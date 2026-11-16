// =========================================================
// Zustand: แจ้งเตือนเล็ก ๆ (Toast) เช่น "บันทึกแล้ว" "ลบแล้ว"
// เรียกจากที่ไหนก็ได้ด้วย toast("ข้อความ") แม้จะไม่ได้อยู่ใน component (เช่นใน onSuccess ของ hook)
// =========================================================

import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, type?: ToastType) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  show: (message, type = "success") => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().dismiss(id), 3000); // หายเองใน 3 วินาที
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, type?: ToastType) {
  useToastStore.getState().show(message, type);
}
