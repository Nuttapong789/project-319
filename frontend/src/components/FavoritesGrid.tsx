import { Link } from "react-router";
import { useFavorites } from "../hooks/useFavorites";
import PetCard from "./PetCard";
import { EmptyState, ErrorBox, PetCardSkeleton } from "./States";

// รายการโปรด ใช้ทั้งหน้า /favorites และแท็บในหน้า "ของฉัน"
export default function FavoritesGrid() {
  const { data: pets, isLoading, isError, error, refetch } = useFavorites();

  if (isLoading) {
    return (
      <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
        {Array.from({ length: 3 }, (_, i) => (
          <PetCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorBox message={error?.message} onRetry={() => refetch()} />;
  if (!pets || pets.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีน้องในรายการโปรด กด ♡ บนการ์ดน้องเพื่อเก็บไว้ดูทีหลัง"
        action={
          <Link to="/pets" className="min-h-11 px-5 flex items-center rounded-xl bg-navy text-white font-semibold">
            ไปดูน้องทั้งหมด
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} />
      ))}
    </div>
  );
}
