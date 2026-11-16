import FilterBar from "../components/FilterBar";
import PetList from "../components/PetList";

// หน้า "น้องทั้งหมด" (/pets) — ฟีดรวมน้องทุกตัว สำหรับคนที่ไม่รีบ ค่อย ๆ ดูได้
export default function AllPetsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="font-display font-bold text-3xl">น้องทั้งหมด</h1>
        <p className="text-muted mt-1">รวมน้องทุกตัวที่กำลังหาบ้าน ทั้งด่วนและไม่ด่วน ค่อย ๆ เลือกตัวที่ใช่สำหรับคุณ</p>
      </div>
      <FilterBar />
      <PetList title="ฟีดน้องทั้งหมด" />
    </section>
  );
}
