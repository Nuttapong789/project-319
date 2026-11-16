import { useState } from "react";
import PawLogo from "./PawLogo";

// แสดงรูปน้อง ถ้าไม่มีลิงก์หรือโหลดรูปไม่ได้ จะแสดงกล่องรูปเท้าแทน
export default function PetImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className={`bg-sand flex items-center justify-center ${className}`}>
        <PawLogo className="size-14 fill-white/70" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} className={`object-cover ${className}`} />;
}
