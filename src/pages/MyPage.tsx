import { Link, useSearchParams } from "react-router";
import AdoptionBadge from "../components/AdoptionBadge";
import FavoritesGrid from "../components/FavoritesGrid";
import PetCard from "../components/PetCard";
import PetImage from "../components/PetImage";
import { EmptyState, ErrorBox, PetCardSkeleton } from "../components/States";
import { useCancelAdoption, useMyAdoptions } from "../hooks/useAdoptions";
import { useFavorites } from "../hooks/useFavorites";
import { useMyPets } from "../hooks/usePets";
import { useAuthStore } from "../stores/useAuthStore";
import type { AdoptionRequest } from "../types/adoption";
import { housingLabel } from "../types/adoption";
import { timeAgo } from "../types/pet";

type Tab = "posts" | "requests" | "favorites";
const tabs: { value: Tab; label: string }[] = [
  { value: "posts", label: "โพสต์ของฉัน" },
  { value: "requests", label: "คำขอที่ยื่นไว้" },
  { value: "favorites", label: "รายการโปรด" },
];

// /me — หน้า "ของฉัน" (ต้องล็อกอิน)
// แท็บเก็บใน URL (?tab=requests) กด F5 หรือส่งลิงก์ให้คนอื่นแล้วยังอยู่แท็บเดิม
export default function MyPage() {
  const user = useAuthStore((s) => s.user);
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: Tab = tabs.some((t) => t.value === tabParam) ? (tabParam as Tab) : "posts";

  // ตัวเลขบนแท็บ (ใช้ cache เดียวกับเนื้อหาในแท็บ ไม่ยิง API ซ้ำ)
  const counts: Record<Tab, number | undefined> = {
    posts: useMyPets().data?.length,
    requests: useMyAdoptions().data?.length,
    favorites: useFavorites().data?.length,
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-3xl">สวัสดี {user?.name}</h1>
          <p className="text-muted mt-1">{user?.email}</p>
        </div>
        <Link to="/pets/new" className="min-h-12 px-6 flex items-center rounded-xl bg-navy text-white font-semibold">
          + โพสต์หาบ้านให้น้อง
        </Link>
      </div>

      <div role="tablist" aria-label="ข้อมูลของฉัน" className="flex flex-wrap gap-2 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setParams({ tab: t.value }, { replace: true })}
            className={`min-h-11 px-4 -mb-px border-b-2 font-medium ${
              tab === t.value ? "border-navy text-navy font-semibold" : "border-transparent text-muted hover:text-navy"
            }`}
          >
            {t.label}
            {counts[t.value] !== undefined && (
              <span className="ml-2 text-xs bg-navy-soft text-navy px-2 py-0.5 rounded-full">{counts[t.value]}</span>
            )}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "posts" && <MyPosts />}
        {tab === "requests" && <MyRequests />}
        {tab === "favorites" && <FavoritesGrid />}
      </div>
    </section>
  );
}

function MyPosts() {
  const { data: pets, isLoading, isError, error, refetch } = useMyPets();

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
        title="คุณยังไม่ได้โพสต์หาบ้านให้น้อง"
        action={
          <Link to="/pets/new" className="min-h-11 px-5 flex items-center rounded-xl bg-navy text-white font-semibold">
            โพสต์ตัวแรก
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

function MyRequests() {
  const { data: requests, isLoading, isError, error, refetch } = useMyAdoptions();

  if (isLoading) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-3">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white border border-line animate-pulse" />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorBox message={error?.message} onRetry={() => refetch()} />;
  if (!requests || requests.length === 0) {
    return (
      <EmptyState
        title="ยังไม่ได้ยื่นขอรับเลี้ยงน้องตัวไหน"
        action={
          <Link to="/pets" className="min-h-11 px-5 flex items-center rounded-xl bg-navy text-white font-semibold">
            ไปดูน้องที่รอบ้าน
          </Link>
        }
      />
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {requests.map((r) => (
        <RequestRow key={r.id} request={r} />
      ))}
    </ul>
  );
}

function RequestRow({ request }: { request: AdoptionRequest }) {
  const cancel = useCancelAdoption();

  function handleCancel() {
    if (!window.confirm(`ยกเลิกคำขอรับเลี้ยง${request.pet.name}ใช่ไหม?`)) return;
    cancel.mutate(request.id);
  }

  return (
    <li className="bg-white rounded-2xl border border-line p-4 flex flex-wrap items-center gap-4">
      <PetImage src={request.pet.imageUrl} alt={`รูปน้อง${request.pet.name}`} className="size-20 rounded-xl shrink-0" />
      <div className="flex-[1_1_200px] flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/pets/${request.petId}`} className="font-display font-semibold text-lg hover:text-navy underline-offset-4 hover:underline">
            {request.pet.name}
          </Link>
          <AdoptionBadge status={request.status} />
        </div>
        <p className="text-sm text-muted">
          ยื่นเมื่อ {timeAgo(request.createdAt)} · ผู้โพสต์ {request.pet.ownerName} · {housingLabel[request.housing]}
        </p>
      </div>
      {request.status === "PENDING" && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancel.isPending}
          className="min-h-11 px-4 rounded-xl border border-line hover:border-danger hover:text-danger disabled:opacity-50"
        >
          {cancel.isPending ? "กำลังยกเลิก..." : "ยกเลิกคำขอ"}
        </button>
      )}
    </li>
  );
}
