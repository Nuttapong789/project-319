import { useState } from "react";
import { Link } from "react-router";
import { emergencySigns, guideTopics, type GuideFor } from "../data/guide";

const filters: { value: GuideFor; label: string }[] = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "DOG", label: "สุนัข" },
  { value: "CAT", label: "แมว" },
];

// /guide — ความรู้พื้นฐานการเลี้ยงหมาแมว
// ตัวเลือก "ทั้งหมด / สุนัข / แมว" ใช้ useState ธรรมดา เพราะใช้แค่ในหน้านี้หน้าเดียว ไม่ต้องเอาไปไว้ใน Zustand
export default function GuidePage() {
  const [show, setShow] = useState<GuideFor>("ALL");
  const topics = guideTopics.filter((t) => show === "ALL" || t.for === "ALL" || t.for === show);

  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-12 flex flex-col gap-3">
          <p className="font-hand text-2xl text-white/80">ก่อนรับน้อง · ระหว่างเลี้ยง · ยามป่วย</p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl">ความรู้เบื้องต้นเรื่องหมาแมว</h1>
          <p className="text-white/80 max-w-2xl">
            สรุปสิ่งที่ควรรู้สำหรับคนที่กำลังจะรับน้องไปดูแล อ่านจบในไม่กี่นาที
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">
        <div role="tablist" aria-label="เลือกหัวข้อตามชนิดสัตว์" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={show === f.value}
              onClick={() => setShow(f.value)}
              className={`min-h-11 px-5 rounded-full border font-medium ${
                show === f.value ? "bg-navy text-white border-navy" : "bg-white border-line hover:border-navy"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {topics.map((topic, index) => (
            // <details> = กดเปิด/ปิดได้เอง ไม่ต้องเขียน state
            <details key={topic.id} open={index === 0} className="group bg-white rounded-2xl border border-line">
              <summary className="min-h-14 px-5 py-4 flex items-center gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="flex-1">
                  <span className="block font-display font-semibold text-lg">{topic.title}</span>
                  <span className="block text-sm text-muted">{topic.summary}</span>
                </span>
                {topic.for !== "ALL" && (
                  <span className="text-xs font-semibold text-navy bg-navy-soft px-2.5 py-1 rounded-full">
                    {topic.for === "DOG" ? "สุนัข" : "แมว"}
                  </span>
                )}
                <span aria-hidden="true" className="text-xl text-navy transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <ul className="px-5 pb-5 flex flex-col gap-2 list-disc pl-10 marker:text-navy">
                {topic.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        <aside className="rounded-2xl border-2 border-danger/40 bg-white p-5 flex flex-col gap-3">
          <h2 className="font-display font-semibold text-lg text-danger">เจออาการเหล่านี้ พาไปหาสัตวแพทย์โดยเร็ว</h2>
          <ul className="grid gap-2 sm:grid-cols-2 list-disc pl-5 marker:text-danger">
            {emergencySigns.map((sign) => (
              <li key={sign}>{sign}</li>
            ))}
          </ul>
        </aside>

        <p className="text-sm text-muted">
          ข้อมูลในหน้านี้เป็นความรู้ทั่วไปเพื่อการศึกษา ไม่ใช้แทนคำแนะนำของสัตวแพทย์ น้องแต่ละตัวต่างกัน ถ้าไม่แน่ใจให้ปรึกษาสัตวแพทย์เสมอ
        </p>

        <div className="bg-sand rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <p className="font-display font-semibold text-xl">พร้อมแล้ว? มีน้องหลายตัวกำลังรอบ้านอยู่</p>
          <Link to="/pets" className="min-h-12 px-6 flex items-center rounded-xl bg-navy text-white font-semibold">
            ดูน้องที่รอบ้าน →
          </Link>
        </div>
      </section>
    </>
  );
}
