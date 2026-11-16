import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import AdoptionPanel from "../components/AdoptionPanel";
import FavoriteButton from "../components/FavoriteButton";
import OwnerRequests from "../components/OwnerRequests";
import PetImage from "../components/PetImage";
import { ErrorBox } from "../components/States";
import { useDeletePet, usePet } from "../hooks/usePets";
import { useAuthStore } from "../stores/useAuthStore";
import { formatAge, sexLabel, speciesLabel, statusLabel, timeAgo } from "../types/pet";

// หน้ารายละเอียดแบบ dynamic: /pets/:id
// เจ้าของโพสต์ → เห็นปุ่มแก้ไข/ลบ + คำขอรับเลี้ยง | คนอื่น → เห็นฟอร์มขอรับเลี้ยง
export default function PetDetailPage() {
  const { id } = useParams();
  const petId = Number(id);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: pet, isLoading, isError, error, refetch } = usePet(petId);
  const deleteMutation = useDeletePet();

  function handleDelete() {
    if (!pet) return;
    if (!window.confirm(`ลบโพสต์ของ "${pet.name}" ใช่ไหม?`)) return;
    deleteMutation.mutate(pet.id, {
      onSuccess: () => navigate("/me?tab=posts"), // ลบเสร็จไปแท็บ "โพสต์ของฉัน" รายการอัปเดตเองเพราะ invalidateQueries
    });
  }

  if (!Number.isInteger(petId) || petId <= 0) {
    return <PageShell><ErrorBox message="ลิงก์ไม่ถูกต้อง" /></PageShell>;
  }

  if (isLoading) {
    return (
      <PageShell>
        <div aria-hidden="true" className="flex flex-wrap gap-8 animate-pulse">
          <div className="flex-[1_1_420px] h-96 rounded-3xl bg-sand" />
          <div className="flex-[1_1_360px] flex flex-col gap-4">
            <div className="h-10 w-1/2 rounded bg-sand" />
            <div className="h-4 w-3/4 rounded bg-white" />
            <div className="h-32 rounded-2xl bg-white" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (isError || !pet) {
    return (
      <PageShell>
        <ErrorBox message={error?.message} onRetry={() => refetch()} />
      </PageShell>
    );
  }

  const isOwner = user?.id === pet.ownerId;

  return (
    <PageShell>
      <div className="flex flex-wrap gap-8 items-start">
        <div className="flex-[1_1_420px] relative">
          <PetImage src={pet.imageUrl} alt={`รูปน้อง${pet.name}`} className="w-full h-96 rounded-3xl" />
          <FavoriteButton petId={pet.id} petName={pet.name} className="absolute top-4 right-4 size-12" />
        </div>

        <div className="flex-[1_1_360px] flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {pet.urgent && pet.status === "AVAILABLE" && (
              <span className="bg-danger text-white text-xs font-semibold px-3 py-1 rounded-full">ด่วน! ต้องการบ้าน</span>
            )}
            <span className="bg-navy-soft text-navy text-xs font-semibold px-3 py-1 rounded-full">
              สถานะ: {statusLabel[pet.status]}
            </span>
          </div>

          <div>
            <h1 className="font-display font-bold text-4xl">{pet.name}</h1>
            <p className="text-muted mt-1">
              {speciesLabel[pet.species]} · {pet.breed} · {pet.province}
            </p>
            <p className="text-sm text-muted mt-1">
              โพสต์โดย {isOwner ? "คุณ" : pet.ownerName} · {timeAgo(pet.createdAt)}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <InfoBox label="อายุ" value={formatAge(pet.ageMonths)} />
            <InfoBox label="เพศ" value={sexLabel[pet.sex]} />
            <InfoBox label="วัคซีน" value={pet.vaccinated ? "ฉีดแล้ว" : "ยังไม่ฉีด"} />
            <InfoBox label="ทำหมัน" value={pet.sterilized ? "ทำแล้ว" : "ยังไม่ทำ"} />
          </dl>

          <section className="bg-white rounded-2xl border border-line p-5">
            <h2 className="font-display font-semibold text-lg mb-2">เรื่องของ{pet.name}</h2>
            <p className="leading-relaxed whitespace-pre-line">{pet.description}</p>
          </section>

          {isOwner ? (
            <>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/pets/${pet.id}/edit`}
                  className="min-h-12 px-6 flex items-center rounded-xl bg-navy text-white font-semibold"
                >
                  แก้ไขโพสต์
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="min-h-12 px-6 rounded-xl border border-danger text-danger font-semibold disabled:opacity-50"
                >
                  {deleteMutation.isPending ? "กำลังลบ..." : "ลบโพสต์"}
                </button>
              </div>
              {deleteMutation.isError && <p className="text-danger text-sm">{deleteMutation.error?.message}</p>}
              <OwnerRequests petId={pet.id} />
            </>
          ) : (
            <AdoptionPanel pet={pet} />
          )}
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-6">
      <Link to="/pets" className="self-start font-semibold min-h-11 flex items-center hover:text-navy">
        ← กลับไปหน้ารวมน้อง
      </Link>
      {children}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-line p-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
