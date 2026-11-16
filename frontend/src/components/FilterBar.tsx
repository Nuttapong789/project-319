import { useFilterStore } from "../stores/useFilterStore";
import type { PostedWithin, Species, Urgency } from "../types/pet";

const tabs: { value: Species | "ALL"; label: string }[] = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "DOG", label: "สุนัข" },
  { value: "CAT", label: "แมว" },
  { value: "OTHER", label: "อื่น ๆ" },
];

const postedOptions: { value: PostedWithin; label: string }[] = [
  { value: 0, label: "โพสต์เมื่อไหร่ก็ได้" },
  { value: 1, label: "ภายใน 24 ชั่วโมง" },
  { value: 7, label: "ภายใน 7 วัน" },
  { value: 30, label: "ภายใน 30 วัน" },
];

const urgencyOptions: { value: Urgency; label: string }[] = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "URGENT", label: "ด่วน" },
  { value: "NORMAL", label: "ไม่ด่วน" },
];

export const provinces = ["กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "ชลบุรี", "เชียงใหม่", "ขอนแก่น", "ภูเก็ต"];

// ตัวกรองอ่าน/เขียนค่าจาก Zustand โดยตรง — ไม่ต้องส่ง props ไปมา
export default function FilterBar() {
  const { species, province, search, postedWithin, urgency, setSpecies, setProvince, setSearch, setPostedWithin, setUrgency, reset } =
    useFilterStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <label htmlFor="search" className="sr-only">
          ค้นหาน้อง
        </label>
        <input
          id="search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ พันธุ์ หรือจังหวัด"
          className="flex-[2_1_280px] min-h-12 px-4 rounded-xl border border-line bg-white"
        />
        <label htmlFor="province" className="sr-only">
          จังหวัด
        </label>
        <select
          id="province"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="flex-[1_1_180px] min-h-12 px-3 rounded-xl border border-line bg-white"
        >
          <option value="">ทุกจังหวัด</option>
          {provinces.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-muted flex-[1_1_200px]">
          ช่วงเวลาที่โพสต์
          <select
            value={postedWithin}
            onChange={(e) => setPostedWithin(Number(e.target.value) as PostedWithin)}
            className="min-h-11 px-3 rounded-xl border border-line bg-white text-base text-ink"
          >
            {postedOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm text-muted mb-1">ความด่วน</legend>
          <div className="flex gap-2">
            {urgencyOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={urgency === o.value}
                onClick={() => setUrgency(o.value)}
                className={`min-h-11 px-4 rounded-xl border font-medium ${
                  urgency === o.value
                    ? o.value === "URGENT"
                      ? "bg-danger text-white border-danger"
                      : "bg-navy text-white border-navy"
                    : "bg-white border-line hover:border-navy"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="ชนิดสัตว์">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={species === tab.value}
            onClick={() => setSpecies(tab.value)}
            className={`min-h-11 px-5 rounded-full font-medium border ${
              species === tab.value ? "bg-navy text-white border-navy" : "bg-white border-line hover:border-navy"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button type="button" onClick={reset} className="ml-auto text-sm text-navy underline min-h-11 px-2">
          ล้างตัวกรอง
        </button>
      </div>
    </div>
  );
}
