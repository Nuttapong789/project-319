import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import AdoptionBadge from "../components/AdoptionBadge";
import { Field, inputClass } from "../components/Field";
import PetCard from "../components/PetCard";
import PetImage from "../components/PetImage";
import { EmptyState, ErrorBox, PetCardSkeleton } from "../components/States";
import { Avatar } from "../components/UserMenu";
import { useCancelAdoption, useMyAdoptions } from "../hooks/useAdoptions";
import { useUpdateProfile } from "../hooks/useAuth";
import { useFavorites } from "../hooks/useFavorites";
import { useDeletePet, useMyPets } from "../hooks/usePets";
import { useAuthStore } from "../stores/useAuthStore";
import type { AdoptionRequest } from "../types/adoption";
import { housingLabel } from "../types/adoption";
import type { Pet } from "../types/pet";
import { timeAgo } from "../types/pet";
import type { User } from "../types/user";

type Tab = "profile" | "posts" | "requests";
const tabs: { value: Tab; label: string }[] = [
  { value: "profile", label: "ข้อมูลส่วนตัว" },
  { value: "posts", label: "โพสต์ของฉัน" },
  { value: "requests", label: "คำขอรับเลี้ยง" },
];

// /me — บัญชีของฉัน (ต้องล็อกอิน) · รายการโปรดอยู่หน้า /favorites หน้าเดียว
// แท็บเก็บใน URL (?tab=posts) กด F5 / ส่งลิงก์ / กดย้อนกลับ แล้วยังอยู่แท็บที่ถูก · ไม่ระบุ = ข้อมูลส่วนตัว
export default function MyPage() {
  const user = useAuthStore((s) => s.user)!; // RequireAuth รับประกันว่าล็อกอินแล้ว
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: Tab = tabs.some((t) => t.value === tabParam) ? (tabParam as Tab) : "profile";

  // ตัวเลขบนแท็บ (ใช้ cache เดียวกับเนื้อหาในแท็บ ไม่ยิง API ซ้ำ)
  const counts: Partial<Record<Tab, number>> = {
    posts: useMyPets().data?.length,
    requests: useMyAdoptions().data?.length,
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-6">
      <h1 className="font-display font-bold text-3xl">บัญชีของฉัน</h1>

      <div role="tablist" aria-label="บัญชีของฉัน" className="flex flex-wrap gap-2 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => tab !== t.value && setParams({ tab: t.value })} // เพิ่มประวัติ → ปุ่มย้อนกลับของ browser กลับแท็บเดิมได้
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

      <div role="tabpanel" aria-label={tabs.find((t) => t.value === tab)!.label}>
        {tab === "profile" && <Profile user={user} />}
        {tab === "posts" && <MyPosts />}
        {tab === "requests" && <MyRequests />}
      </div>
    </section>
  );
}

function Profile({ user }: { user: User }) {
  const [editing, setEditing] = useState(false);
  const counts = {
    posts: useMyPets().data?.length,
    requests: useMyAdoptions().data?.length,
    favorites: useFavorites().data?.length,
  };
  const stats = [
    { label: "โพสต์ของฉัน", value: counts.posts, to: "/me?tab=posts" },
    { label: "คำขอรับเลี้ยง", value: counts.requests, to: "/me?tab=requests" },
    { label: "รายการโปรด", value: counts.favorites, to: "/favorites" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <section className="bg-white rounded-2xl border border-line p-5 sm:p-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar user={user} size="size-16 text-2xl" />
          <div className="flex-[1_1_200px] min-w-0">
            <h2 className="font-display font-semibold text-2xl wrap-break-word">{user.name}</h2>
            <p className="text-muted break-all">{user.email}</p>
            <p className="text-sm text-muted">ใช้อีเมลนี้เข้าสู่ระบบ</p>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="min-h-11 px-5 rounded-xl border border-navy text-navy font-semibold hover:bg-navy-soft"
            >
              แก้ไขข้อมูลส่วนตัว
            </button>
          )}
        </div>

        {editing && <EditProfile user={user} onDone={() => setEditing(false)} />}
      </section>

      <section aria-label="ข้อมูลบัญชี" className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="bg-white rounded-2xl border border-line p-4 hover:border-navy transition-colors">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="font-display font-semibold text-2xl text-navy">{s.value ?? "–"}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

// แก้ได้เฉพาะชื่อที่แสดง (ฐานข้อมูลมีแค่ชื่อ — ยังไม่มีเบอร์โทร/รูปโปรไฟล์)
function EditProfile({ user, onDone }: { user: User; onDone: () => void }) {
  const [name, setName] = useState(user.name);
  const [error, setError] = useState("");
  const update = useUpdateProfile();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return setError("กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร");
    setError("");
    update.mutate(name.trim(), { onSuccess: onDone });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 border-t border-line pt-5">
      <Field label="ชื่อที่แสดง" hint="ผู้โพสต์จะเห็นชื่อนี้ตอนคุณขอรับเลี้ยง" error={error}>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} className={inputClass(Boolean(error))} />
      </Field>
      {update.isError && <p role="alert" className="text-danger">{update.error.message}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={update.isPending} className="min-h-11 px-6 rounded-xl bg-navy text-white font-semibold disabled:opacity-50">
          {update.isPending ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button type="button" onClick={onDone} disabled={update.isPending} className="min-h-11 px-6 rounded-xl border border-line font-semibold">
          ยกเลิก
        </button>
      </div>
    </form>
  );
}

function MyPosts() {
  const { data: pets, isLoading, isError, error, refetch } = useMyPets();
  const newPost = (
    <Link to="/pets/new" className="min-h-11 px-5 flex items-center rounded-xl bg-navy text-white font-semibold">
      + โพสต์หาบ้านให้น้อง
    </Link>
  );

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
      <EmptyState title="คุณยังไม่ได้โพสต์หาบ้านให้น้อง" action={newPost} />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">{pets.length} โพสต์</p>
        {newPost}
      </div>
      <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
        {pets.map((pet) => (
          <MyPostItem key={pet.id} pet={pet} />
        ))}
      </div>
    </div>
  );
}

// โพสต์ของตัวเอง: การ์ดเดิม + ปุ่มแก้ไข / ลบ (Backend ตรวจสิทธิ์เจ้าของซ้ำอีกชั้น)
function MyPostItem({ pet }: { pet: Pet }) {
  const remove = useDeletePet();

  function handleDelete() {
    if (!window.confirm(`ลบโพสต์ของ "${pet.name}" ใช่ไหม?`)) return;
    remove.mutate(pet.id);
  }

  return (
    <div className="flex flex-col gap-2">
      <PetCard pet={pet} />
      <div className="grid grid-cols-2 gap-2">
        <Link
          to={`/pets/${pet.id}/edit`}
          className="min-h-11 flex items-center justify-center rounded-xl border border-line bg-white font-semibold hover:border-navy hover:text-navy"
        >
          แก้ไข
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={remove.isPending}
          className="min-h-11 rounded-xl border border-line bg-white font-semibold hover:border-danger hover:text-danger disabled:opacity-50"
        >
          {remove.isPending ? "กำลังลบ..." : "ลบ"}
        </button>
      </div>
      {remove.isError && <p className="text-sm text-danger">{remove.error.message}</p>}
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
          ยื่นเมื่อ {timeAgo(request.createdAt)} · ผู้โพสต์ {request.pet.ownerName}
        </p>
        <p className="text-sm">
          ที่พัก {housingLabel[request.housing]} · เบอร์ติดต่อ {request.phone}
        </p>
        <p className="text-sm text-muted line-clamp-2 whitespace-pre-line">“{request.message}”</p>
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
