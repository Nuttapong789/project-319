// =========================================================
// ข่าวสาร / ร่วมช่วยเหลือ / ผู้สนับสนุน — การ์ดในหน้าแรก + หน้ารายละเอียดของแต่ละอัน
// *** ข้อมูลจำลองทั้งหมด (isDemo) *** หน่วยงาน คลินิก วันที่ และราคา เป็นตัวอย่างเพื่อแสดงผล ไม่ใช่บริการจริง
// ไม่มีที่อยู่ เบอร์โทร หรือเลขบัญชีจริง — แบบฟอร์มในหน้าไม่ส่งข้อมูลไปที่ไหน
// ถ้าจะใช้จริง: ย้ายไปเป็นตาราง promos ใน Database ให้ Backend ตอบรูปแบบ Promo ข้างล่าง + เพิ่ม endpoint รับแบบฟอร์ม
// =========================================================

export interface InfoItem {
  label: string;
  value: string;
}

export type FormField =
  | { name: string; label: string; type: "text" | "tel" | "date" | "textarea"; required?: boolean; hint?: string }
  | { name: string; label: string; type: "select" | "checks"; options: string[]; required?: boolean; hint?: string };

export type PromoAction =
  | { kind: "link"; label: string; to: string } // ไปหน้าอื่นในเว็บ
  | { kind: "form"; label: string; fields: FormField[]; success: string }; // แบบฟอร์มแสดงความสนใจ (Demo)

export interface Promo {
  id: string;
  path: string; // route ของหน้ารายละเอียด
  category: string; // เช่น "ประชาสัมพันธ์"
  title: string;
  description: string;
  cta: string; // ปุ่มบนการ์ดหน้าแรก
  tone: "navy" | "sand";
  isDemo: boolean;
  organization: string;
  date?: { start: string; end: string; label: string }; // มีวันจัด → คำนวณสถานะจากวันที่ (promoStatus)
  time: string;
  location: string;
  price?: InfoItem[];
  requirements: string[];
  sections: { heading: string; items: string[]; ordered?: boolean }[];
  contact: InfoItem[];
  action: PromoAction;
}

export type PromoStatus = "open" | "upcoming" | "ongoing" | "ended";

export const promoStatusLabel: Record<PromoStatus, string> = {
  open: "เปิดรับอยู่",
  upcoming: "เร็ว ๆ นี้",
  ongoing: "กำลังจัดอยู่",
  ended: "จบแล้ว",
};

// วันนี้ตามเวลาในเครื่อง รูปแบบ YYYY-MM-DD (เทียบกับ date.start / date.end ได้ตรง ๆ)
const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// กิจกรรมที่มีวันจัด: ก่อนวันจัด = เร็ว ๆ นี้ · ระหว่าง = กำลังจัด · หลัง = จบแล้ว · ไม่มีวันจัด = เปิดรับตลอด
export function promoStatus(promo: Pick<Promo, "date">, now = new Date()): PromoStatus {
  if (!promo.date) return "open";
  const today = localDate(now);
  if (today < promo.date.start) return "upcoming";
  if (today > promo.date.end) return "ended";
  return "ongoing";
}

const contactViaForm: InfoItem = { label: "ติดต่อ", value: "ผ่านแบบฟอร์มในหน้านี้ (Demo — ยังไม่มีช่องทางติดต่อจริง)" };

export const homePromos: Promo[] = [
  {
    id: "rabies-vaccine",
    path: "/announcements/rabies-vaccine",
    category: "ประชาสัมพันธ์",
    title: "ฉีดวัคซีนพิษสุนัขบ้าฟรี",
    description: "พาน้องหมาแมวอายุ 3 เดือนขึ้นไปมาฉีดวัคซีนพิษสุนัขบ้าฟรี ลงทะเบียนหน้างานตามลำดับคิว ไม่ต้องจองล่วงหน้า",
    cta: "ดูรายละเอียด",
    tone: "navy",
    isDemo: true,
    organization: "ศูนย์บริการสัตวแพทย์ PawHome",
    date: { start: "2026-11-21", end: "2026-11-22", label: "21–22 พฤศจิกายน 2569" },
    time: "10:00–15:00 น.",
    location: "ศูนย์บริการสัตวแพทย์ PawHome",
    price: [{ label: "ค่าบริการ", value: "ฟรี" }],
    requirements: [
      "สุนัขและแมว อายุ 3 เดือนขึ้นไป",
      "ลงทะเบียนหน้างานตามลำดับคิว (รับคิวถึง 14:30 น.)",
      "น้องต้องแข็งแรงดีในวันที่มา",
    ],
    sections: [
      {
        heading: "ทำไมต้องฉีด",
        items: [
          "โรคพิษสุนัขบ้าติดต่อถึงคนได้ และเมื่อแสดงอาการแล้วรักษาไม่หาย การฉีดวัคซีนเป็นวิธีป้องกันที่สำคัญที่สุด",
          "แมวก็ติดเชื้อได้เหมือนสุนัข ต้องฉีดเหมือนกัน",
          "ฉีดกระตุ้นตามนัดที่สัตวแพทย์แนะนำ (ส่วนใหญ่ปีละครั้ง)",
        ],
      },
      {
        heading: "เตรียมตัวก่อนมา",
        items: [
          "นำสมุดวัคซีนเดิมมาด้วย (ถ้ามี) จะได้บันทึกต่อในเล่มเดิม",
          "สุนัขใส่ปลอกคอและสายจูง แมวใส่กรงหรือกระเป๋าที่ปิดได้",
          "ถ้าน้องมีไข้ ท้องเสีย หรือป่วยอยู่ ให้เลื่อนไปก่อน แล้วปรึกษาสัตวแพทย์",
          "ถ้าน้องตั้งท้องหรือกำลังรักษาโรคอยู่ ให้แจ้งเจ้าหน้าที่ก่อนฉีด",
        ],
      },
      {
        heading: "หลังฉีด",
        items: [
          "รอสังเกตอาการที่จุดบริการประมาณ 15 นาทีก่อนกลับ",
          "ซึม กินน้อยลง หรือเจ็บบริเวณที่ฉีด 1–2 วัน พบได้บ่อย",
          "ถ้าหน้าบวม หายใจลำบาก อาเจียนหลายครั้ง หรือทรุดลง ให้พาไปหาสัตวแพทย์ทันที",
          "เก็บสมุดวัคซีนไว้ และจดวันนัดฉีดครั้งถัดไป",
        ],
      },
    ],
    contact: [
      { label: "ผู้จัด", value: "ศูนย์บริการสัตวแพทย์ PawHome" },
      { label: "อยากฉีดวัคซีนจริง", value: "สอบถามจุดบริการจากสำนักงานเขต เทศบาล หรือ อบต. ใกล้บ้าน" },
    ],
    action: { kind: "link", label: "อ่านเรื่องวัคซีนและการดูแลเพิ่มเติม", to: "/guide" },
  },
  {
    id: "donate-food",
    path: "/support/donate-food",
    category: "ร่วมช่วยเหลือ",
    title: "บริจาคอาหารให้น้องในมูลนิธิ",
    description: "อาหารสุนัข อาหารแมว ทรายแมว ผ้าห่ม และอุปกรณ์ดูแลสัตว์ ช่วยน้องที่ยังรอบ้านได้ทุกตัว แจ้งความประสงค์แล้วนัดวันส่งของ",
    cta: "วิธีบริจาค",
    tone: "sand",
    isDemo: true,
    organization: "ศูนย์ช่วยเหลือสัตว์ PawHome",
    time: "ทุกวัน 09:00–17:00 น.",
    location: "ยังไม่มีสถานที่รับบริจาคจริงที่ยืนยันแล้ว (Demo)",
    requirements: [
      "สิ่งของต้องยังไม่หมดอายุ และยังไม่แกะถุงหรือเปิดใช้",
      "แจ้งความประสงค์ผ่านแบบฟอร์มก่อน แล้วรอนัดวันส่งของ",
    ],
    sections: [
      {
        heading: "สิ่งของที่รับ",
        items: [
          "อาหารสุนัข (อาหารเม็ดและอาหารเปียก)",
          "อาหารแมว — ต้องการอาหารลูกแมวเป็นพิเศษ",
          "ทรายแมว",
          "ผ้าห่มหรือผ้าขนหนูเก่าที่ซักสะอาดแล้ว",
          "อุปกรณ์ดูแลสัตว์ เช่น ชามอาหาร สายจูง กรงหิ้ว แปรงขน",
        ],
      },
      {
        heading: "วิธีบริจาค",
        ordered: true,
        items: [
          "กรอกแบบฟอร์มแสดงความประสงค์ด้านล่าง บอกสิ่งของและวันที่สะดวก",
          "รอเจ้าหน้าที่ติดต่อกลับเพื่อนัดวันและสถานที่ส่งของ",
          "ส่งของตามนัด เขียนชื่อผู้บริจาคไว้บนกล่องหรือถุง",
        ],
      },
      {
        heading: "ขอไม่รับ",
        items: ["อาหารที่หมดอายุหรือแกะแล้ว", "อาหารคน และขนมที่มีช็อกโกแลต", "ยาที่เปิดใช้แล้ว", "เงินสด (ไม่มีช่องทางรับเงินในระบบ Demo)"],
      },
    ],
    contact: [{ label: "องค์กร", value: "ศูนย์ช่วยเหลือสัตว์ PawHome" }, contactViaForm],
    action: {
      kind: "form",
      label: "แบบฟอร์มแสดงความประสงค์บริจาค",
      success: "บันทึกความประสงค์แล้ว (Demo) — ระบบนี้เป็นข้อมูลจำลอง จะไม่มีเจ้าหน้าที่ติดต่อกลับ",
      fields: [
        { name: "name", label: "ชื่อผู้บริจาค", type: "text", required: true },
        { name: "phone", label: "เบอร์โทรติดต่อ", type: "tel", required: true },
        {
          name: "items",
          label: "สิ่งของที่จะบริจาค",
          type: "checks",
          required: true,
          options: ["อาหารสุนัข", "อาหารแมว", "ทรายแมว", "ผ้าห่ม", "อุปกรณ์ดูแลสัตว์"],
        },
        { name: "method", label: "วิธีส่งของ", type: "select", required: true, options: ["นำไปส่งเองตามนัด", "ส่งพัสดุหลังได้รับที่อยู่จากเจ้าหน้าที่"] },
        { name: "date", label: "วันที่สะดวก", type: "date" },
        { name: "note", label: "หมายเหตุ", type: "textarea", hint: "เช่น จำนวน ยี่ห้อ หรือวันหมดอายุ" },
      ],
    },
  },
  {
    id: "spay-neuter",
    path: "/partners/spay-neuter",
    category: "ผู้สนับสนุน",
    title: "ทำหมันราคาพิเศษสำหรับน้องจร",
    description: "ลดจำนวนสัตว์จรเกิดใหม่ กับคลินิกพันธมิตรที่ให้ราคาพิเศษแก่ผู้ดูแลน้องจรและผู้รับเลี้ยงจาก PawHome",
    cta: "จองคิว",
    tone: "navy",
    isDemo: true,
    organization: "PawHome Partner Vet",
    time: "จันทร์–เสาร์ 09:00–17:00 น.",
    location: "PawHome Partner Vet",
    price: [
      { label: "แมวเพศผู้", value: "500 บาท" },
      { label: "แมวเพศเมีย", value: "800 บาท" },
      { label: "สุนัขเพศผู้", value: "1,000 บาท" },
      { label: "สุนัขเพศเมีย", value: "1,500 บาท" },
    ],
    requirements: [
      "สำหรับน้องจร หรือน้องที่รับเลี้ยงผ่าน PawHome",
      "สัตวแพทย์ตรวจร่างกายและประเมินความพร้อมก่อนผ่าตัดทุกตัว",
      "ลงทะเบียนความสนใจในระบบ Demo แล้วรอคลินิกยืนยันคิว",
    ],
    sections: [
      {
        heading: "ขั้นตอนจองคิว",
        ordered: true,
        items: [
          "กรอกแบบฟอร์มลงทะเบียนความสนใจด้านล่าง",
          "คลินิกติดต่อกลับเพื่อยืนยันวัน เวลา และคำแนะนำก่อนผ่าตัด",
          "พาน้องมาตามนัด สัตวแพทย์ตรวจร่างกายก่อนผ่าตัด",
        ],
      },
      {
        heading: "ก่อนวันผ่าตัด",
        items: [
          "งดอาหารและน้ำตามเวลาที่คลินิกแจ้ง",
          "อายุที่เหมาะสมขึ้นกับตัวน้อง สัตวแพทย์จะประเมินให้",
          "แมวใส่กรงที่ปิดได้ สุนัขใส่ปลอกคอและสายจูง",
        ],
      },
      {
        heading: "หลังผ่าตัด",
        items: [
          "ใส่ปลอกคอกันเลียแผลตามที่สัตวแพทย์แนะนำ",
          "ให้อยู่ในที่สะอาด เงียบ และไม่วิ่งกระโดดมาก",
          "ถ้าแผลบวมแดง มีหนอง หรือน้องซึมไม่กินอาหาร ให้กลับไปพบสัตวแพทย์",
          "กลับไปตรวจแผลหรือตัดไหมตามนัด",
        ],
      },
    ],
    contact: [{ label: "คลินิก", value: "PawHome Partner Vet" }, contactViaForm],
    action: {
      kind: "form",
      label: "ลงทะเบียนความสนใจทำหมัน",
      success: "ลงทะเบียนความสนใจแล้ว (Demo) — ระบบนี้เป็นข้อมูลจำลอง ยังไม่ได้จองคิวจริง",
      fields: [
        { name: "name", label: "ชื่อผู้ติดต่อ", type: "text", required: true },
        { name: "phone", label: "เบอร์โทรติดต่อ", type: "tel", required: true },
        { name: "species", label: "ชนิดสัตว์", type: "select", required: true, options: ["แมว", "สุนัข"] },
        { name: "sex", label: "เพศ", type: "select", required: true, options: ["เพศผู้", "เพศเมีย"] },
        { name: "age", label: "อายุโดยประมาณ", type: "text", hint: "เช่น 8 เดือน หรือ 2 ปี" },
        { name: "date", label: "วันที่สะดวก", type: "date", hint: "เปิดจันทร์–เสาร์" },
      ],
    },
  },
];
