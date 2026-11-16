import PetCard from "./PetCard";
import { EmptyState, ErrorBox, PetCardSkeleton } from "./States";
import { usePets } from "../hooks/usePets";
import { useFilterStore } from "../stores/useFilterStore";
import type { PetFilters } from "../types/pet";

// รายการน้อง + สถานะ loading / error / ว่าง ใช้ร่วมกันทั้งหน้า "หาบ้านด่วน" และหน้า "น้องทั้งหมด"
// urgentOnly = true → ดึงเฉพาะน้องที่ต้องการบ้านด่วนทั้งหมด โดยไม่ใช้ตัวกรอง (ใช้ในหน้าแรกที่ไม่มีตัวกรอง)
export default function PetList({ title, urgentOnly = false }: { title: string; urgentOnly?: boolean }) {
  const species = useFilterStore((s) => s.species);
  const province = useFilterStore((s) => s.province);
  const search = useFilterStore((s) => s.search);
  const postedWithin = useFilterStore((s) => s.postedWithin);
  const urgencyFilter = useFilterStore((s) => s.urgency);
  const reset = useFilterStore((s) => s.reset);

  const filters: PetFilters = urgentOnly
    ? { species: "ALL", province: "", search: "", postedWithin: 0, urgency: "URGENT" }
    : { species, province, search, postedWithin, urgency: urgencyFilter };
  const { data: pets, isLoading, isError, error, refetch } = usePets(filters);

  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display font-semibold text-2xl">{title}</h2>
        {pets && <p className="text-sm text-muted">พบ {pets.length} ตัว</p>}
      </div>

      {isLoading && (
        <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
          {Array.from({ length: 6 }, (_, i) => (
            <PetCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && <ErrorBox message={error?.message} onRetry={() => refetch()} />}

      {pets && pets.length === 0 &&
        (urgentOnly ? (
          <EmptyState title="ตอนนี้ไม่มีน้องที่ต้องการบ้านด่วน" />
        ) : (
          <EmptyState
            title="ไม่พบน้องที่ตรงกับตัวกรอง"
            action={
              <button type="button" onClick={reset} className="min-h-11 px-5 rounded-xl border border-ink">
                ล้างตัวกรอง
              </button>
            }
          />
        ))}

      {pets && pets.length > 0 && (
        <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </>
  );
}
