import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center flex flex-col items-center gap-3">
      <p className="font-display font-extrabold text-8xl text-navy">404</p>
      <h1 className="font-semibold text-xl">น้องเดินหลงทางมาหน้านี้</h1>
      <p className="text-muted">ไม่พบหน้าที่คุณต้องการ</p>
      <Link to="/" className="mt-3 min-h-12 px-6 flex items-center rounded-xl bg-navy text-white font-semibold">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
