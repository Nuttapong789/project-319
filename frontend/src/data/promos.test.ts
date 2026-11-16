import { describe, expect, it } from "vitest";
import { validateForm } from "../components/DemoInterestForm";
import { homePromos, promoStatus } from "./promos";

// การ์ดในหน้าแรกต้องกดได้จริง: มีหน้าปลายทาง ไม่มีลิงก์ "#" เนื้อหาครบ และไม่เหลือ placeholder
describe("homePromos", () => {
  it("has the 3 home cards in order", () => {
    expect(homePromos.map((p) => [p.category, p.title, p.cta])).toEqual([
      ["ประชาสัมพันธ์", "ฉีดวัคซีนพิษสุนัขบ้าฟรี", "ดูรายละเอียด"],
      ["ร่วมช่วยเหลือ", "บริจาคอาหารให้น้องในมูลนิธิ", "วิธีบริจาค"],
      ["ผู้สนับสนุน", "ทำหมันราคาพิเศษสำหรับน้องจร", "จองคิว"],
    ]);
  });

  it("every card has its own route and a working action", () => {
    const paths = homePromos.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const promo of homePromos) {
      expect(promo.path).toMatch(/^\/[a-z-]+\/[a-z-]+$/);
      if (promo.action.kind === "link") expect(promo.action.to).toMatch(/^\/[a-z]/);
      else expect(promo.action.fields.some((f) => f.required)).toBe(true);
    }
  });

  it("no placeholders left, all marked as demo", () => {
    const text = JSON.stringify(homePromos);
    expect(text).not.toMatch(/\[ใส่|TODO|FIXME|TBD|placeholder|"#"/i);
    expect(homePromos.every((p) => p.isDemo)).toBe(true);
  });

  it("no real-looking phone numbers, bank accounts or street addresses to send money or goods to", () => {
    const text = JSON.stringify(homePromos);
    expect(text).not.toMatch(/\b0\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4}\b/); // เบอร์โทร
    expect(text).not.toMatch(/บัญชี|เลขที่\s*\d|ถนน|รหัสไปรษณีย์|พร้อมเพย์/);
  });

  it("spay/neuter prices match the brief", () => {
    expect(homePromos[2].price).toEqual([
      { label: "แมวเพศผู้", value: "500 บาท" },
      { label: "แมวเพศเมีย", value: "800 บาท" },
      { label: "สุนัขเพศผู้", value: "1,000 บาท" },
      { label: "สุนัขเพศเมีย", value: "1,500 บาท" },
    ]);
  });
});

describe("promoStatus", () => {
  const event = { date: { start: "2026-11-21", end: "2026-11-22", label: "" } };
  it.each([
    ["2026-11-16T12:00:00", "upcoming"],
    ["2026-11-21T09:00:00", "ongoing"],
    ["2026-11-22T23:59:00", "ongoing"],
    ["2026-11-23T00:01:00", "ended"],
  ])("vaccine event at %s → %s", (now, expected) => {
    expect(promoStatus(event, new Date(now))).toBe(expected);
  });

  it("no date → open", () => {
    expect(promoStatus({})).toBe("open");
  });
});

describe("validateForm (demo interest forms)", () => {
  const fields = homePromos[1].action.kind === "form" ? homePromos[1].action.fields : [];

  it("requires the required fields and at least one item", () => {
    expect(validateForm(fields, { name: "", phone: "", items: [], method: "", date: "", note: "" })).toEqual({
      name: "กรุณากรอกชื่อผู้บริจาค",
      phone: "กรุณากรอกเบอร์โทรติดต่อ",
      items: "เลือกอย่างน้อย 1 อย่าง",
      method: "กรุณากรอกวิธีส่งของ",
    });
  });

  it("checks the phone format like the adoption form", () => {
    const ok = { name: "นุ่น", phone: "081-234-5678", items: ["ทรายแมว"], method: "นำไปส่งเองตามนัด" };
    expect(validateForm(fields, ok)).toEqual({});
    expect(validateForm(fields, { ...ok, phone: "12345" })).toEqual({ phone: "เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9–10 หลัก" });
  });
});
