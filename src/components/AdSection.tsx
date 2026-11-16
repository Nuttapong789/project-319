import AdCard from "./AdCard";
import { ads } from "../data/ads";

// โซนโฆษณา / ประชาสัมพันธ์ แยกออกจากรายการน้องให้ชัดเจน
// ใช้พื้นสีต่างจากส่วนรายการน้อง และมีหัวข้อบอกว่าเป็นข่าวสาร ไม่ใช่โพสต์หาบ้าน
export default function AdSection() {
  return (
    <section aria-labelledby="ads-title" className="bg-white border-y border-line">
      <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col gap-5">
        <div>
          <p className="text-sm font-semibold text-navy">ข่าวสารและผู้สนับสนุน</p>
          <h2 id="ads-title" className="font-display font-semibold text-2xl">
            ช่วยน้อง ๆ ได้อีกหลายทาง
          </h2>
        </div>
        <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      </div>
    </section>
  );
}
