import { Link } from "react-router";
import type { Pet } from "../types/pet";
import { formatAge, sexLabel, speciesLabel, statusLabel, timeAgo } from "../types/pet";
import FavoriteButton from "./FavoriteButton";
import PetImage from "./PetImage";

export default function PetCard({ pet }: { pet: Pet }) {
  return (
    <article className="bg-white rounded-2xl border border-line overflow-hidden flex flex-col">
      <div className="relative">
        <PetImage src={pet.imageUrl} alt={`รูปน้อง${pet.name}`} className="h-48 w-full" />
        {pet.urgent && pet.status === "AVAILABLE" && (
          <span className="absolute top-3 left-3 bg-danger text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            ด่วน! ต้องการบ้าน
          </span>
        )}
        {pet.status !== "AVAILABLE" && (
          <span className="absolute top-3 left-3 bg-white text-navy text-xs font-semibold px-2.5 py-1 rounded-full">
            {statusLabel[pet.status]}
          </span>
        )}
        <FavoriteButton petId={pet.id} petName={pet.name} className="absolute top-2 right-2" />
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display font-semibold text-xl">{pet.name}</h3>
          <span className="text-sm text-muted">{sexLabel[pet.sex]}</span>
        </div>
        <p className="text-sm text-muted">
          {speciesLabel[pet.species]} · {pet.breed} · {formatAge(pet.ageMonths)}
        </p>
        <p className="text-sm text-muted">
          {pet.province} · โพสต์ {timeAgo(pet.createdAt)}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {pet.vaccinated && <span className="text-xs font-medium text-navy bg-navy-soft px-2.5 py-0.5 rounded-full">ฉีดวัคซีนแล้ว</span>}
          {pet.sterilized && <span className="text-xs font-medium text-navy bg-navy-soft px-2.5 py-0.5 rounded-full">ทำหมันแล้ว</span>}
        </div>
        <Link
          to={`/pets/${pet.id}`}
          className="mt-auto min-h-11 flex items-center justify-center rounded-xl bg-navy-soft text-navy font-semibold hover:bg-navy hover:text-white transition-colors"
        >
          ดูรายละเอียด
        </Link>
      </div>
    </article>
  );
}
