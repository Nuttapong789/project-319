import { Link } from "react-router";
import AdStrip from "../components/AdStrip";
import PetList from "../components/PetList";

// หน้าแรก "หาบ้านให้น้อง" — เน้นน้องที่ต้องการบ้านด่วน
export default function PetsPage() {
  return (
    <>
      <section className="bg-ground overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-4 relative text-center">
          <p className="font-hand text-2xl text-navy">บ้านอุ่น · อิ่มท้อง · รักตลอดไป</p>
          <h1 className="font-display font-extrabold text-navy leading-none tracking-tight text-[clamp(64px,15vw,190px)]">
            PAWHOME
          </h1>
          <img
            src="/pawhome-cat.png"
            alt="น้องแมวส้มขาวนอนมองกล้อง"
            className="mx-auto -mt-[clamp(40px,8vw,110px)] w-[clamp(220px,32vw,380px)] drop-shadow-xl relative"
          />
          <p className="font-hand text-2xl mt-2">
            ไม่ใช่แค่หาบ้าน... แต่หา<span className="text-navy">ครอบครัว</span>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-6">
        {/* โฆษณาแบบแถบเล็ก อยู่บนรายการน้อง */}
        <AdStrip />

        {/* หน้าแรกไม่มีตัวกรอง แสดงน้องด่วนทุกตัว — อยากกรองให้ไปหน้า "น้องทั้งหมด" */}
        <PetList title="น้องที่ต้องการบ้านด่วน" urgentOnly />

        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/pets" className="min-h-12 px-6 flex items-center rounded-xl border border-navy text-navy font-semibold">
            ดูน้องทั้งหมด →
          </Link>
          <Link to="/pets/new" className="min-h-12 px-6 flex items-center rounded-xl bg-navy text-white font-semibold">
            + โพสต์หาบ้านให้น้อง
          </Link>
        </div>
      </section>
    </>
  );
}
