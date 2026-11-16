import FavoritesGrid from "../components/FavoritesGrid";
import { useFavorites } from "../hooks/useFavorites";

// /favorites — น้องที่กด ♡ ไว้ (ต้องล็อกอิน)
export default function FavoritesPage() {
  const { data: pets } = useFavorites();

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-3xl">รายการโปรด</h1>
          <p className="text-muted mt-1">น้องที่คุณกดหัวใจไว้ กลับมาดูหรือขอรับเลี้ยงได้ทุกเมื่อ</p>
        </div>
        {pets && <p className="text-sm text-muted">{pets.length} ตัว</p>}
      </div>
      <FavoritesGrid />
    </section>
  );
}
