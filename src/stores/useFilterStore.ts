// =========================================================
// Zustand = "Client State" (ข้อมูลฝั่งหน้าจอเท่านั้น ไม่ได้มาจาก Database)
// เก็บตัวกรองที่ผู้ใช้เลือก — กลับมาหน้ารวมน้องแล้วตัวกรองยังอยู่
// *** ห้ามเก็บรายการน้องไว้ที่นี่ *** รายการน้องเป็นหน้าที่ของ TanStack Query
// =========================================================

import { create } from "zustand";
import type { PetFilters, PostedWithin, Species, Urgency } from "../types/pet";

interface FilterState extends PetFilters {
  setSpecies: (species: Species | "ALL") => void;
  setProvince: (province: string) => void;
  setSearch: (search: string) => void;
  setPostedWithin: (postedWithin: PostedWithin) => void;
  setUrgency: (urgency: Urgency) => void;
  reset: () => void;
}

const initial: PetFilters = { species: "ALL", province: "", search: "", postedWithin: 0, urgency: "ALL" };

export const useFilterStore = create<FilterState>((set) => ({
  ...initial,
  setSpecies: (species) => set({ species }),
  setProvince: (province) => set({ province }),
  setSearch: (search) => set({ search }),
  setPostedWithin: (postedWithin) => set({ postedWithin }),
  setUrgency: (urgency) => set({ urgency }),
  reset: () => set(initial),
}));
