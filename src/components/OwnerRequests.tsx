import { usePetAdoptions, useReviewAdoption } from "../hooks/useAdoptions";
import { housingLabel, type AdoptionRequest } from "../types/adoption";
import { timeAgo } from "../types/pet";
import AdoptionBadge from "./AdoptionBadge";
import { ErrorBox } from "./States";

// เจ้าของโพสต์ดูคำขอรับเลี้ยงทั้งหมดของน้องตัวนี้ แล้วกด "อนุมัติ" หรือ "ไม่ผ่าน"
export default function OwnerRequests({ petId }: { petId: number }) {
  const { data: requests, isLoading, isError, error, refetch } = usePetAdoptions(petId, true);

  return (
    <section className="bg-white rounded-2xl border border-line p-5 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display font-semibold text-lg">คำขอรับเลี้ยง</h2>
        {requests && <span className="text-sm text-muted">{requests.length} คำขอ</span>}
      </div>

      {isLoading && <div aria-hidden="true" className="h-24 rounded-xl bg-ground animate-pulse" />}
      {isError && <ErrorBox message={error?.message} onRetry={() => refetch()} />}
      {requests && requests.length === 0 && <p className="text-muted">ยังไม่มีใครขอรับเลี้ยง แชร์โพสต์นี้ให้เพื่อนช่วยกันดูได้นะ</p>}

      <ul className="flex flex-col gap-3">
        {requests?.map((r) => (
          <RequestItem key={r.id} request={r} />
        ))}
      </ul>
    </section>
  );
}

function RequestItem({ request }: { request: AdoptionRequest }) {
  const review = useReviewAdoption();

  function approve() {
    if (!window.confirm(`อนุมัติให้ ${request.userName} รับน้องไปเลี้ยง? คำขออื่นที่รออยู่จะไม่ผ่านอัตโนมัติ`)) return;
    review.mutate({ id: request.id, status: "APPROVED" });
  }

  return (
    <li className="rounded-xl border border-line p-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{request.userName}</span>
        <AdoptionBadge status={request.status} />
        <span className="text-sm text-muted ml-auto">{timeAgo(request.createdAt)}</span>
      </div>
      <p className="text-sm text-muted">
        โทร{" "}
        <a href={`tel:${request.phone}`} className="text-navy font-medium underline">
          {request.phone}
        </a>{" "}
        · {housingLabel[request.housing]}
      </p>
      <p className="whitespace-pre-line">{request.message}</p>

      {request.status === "PENDING" && (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={approve}
            disabled={review.isPending}
            className="min-h-11 px-5 rounded-xl bg-navy text-white font-semibold disabled:opacity-50"
          >
            อนุมัติ
          </button>
          <button
            type="button"
            onClick={() => review.mutate({ id: request.id, status: "REJECTED" })}
            disabled={review.isPending}
            className="min-h-11 px-5 rounded-xl border border-line font-semibold hover:border-danger hover:text-danger disabled:opacity-50"
          >
            ไม่ผ่าน
          </button>
        </div>
      )}
    </li>
  );
}
