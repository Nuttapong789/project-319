import { adoptionStatusLabel, type AdoptionStatus } from "../types/adoption";

const tone: Record<AdoptionStatus, string> = {
  PENDING: "bg-sand text-ink",
  APPROVED: "bg-navy text-white",
  REJECTED: "bg-danger/10 text-danger",
};

// ป้ายสถานะคำขอรับเลี้ยง
export default function AdoptionBadge({ status }: { status: AdoptionStatus }) {
  return (
    <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${tone[status]}`}>
      {adoptionStatusLabel[status]}
    </span>
  );
}
