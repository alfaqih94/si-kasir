import Image from "next/image";
import logoImg from "@/components/logo.png"; // Menggunakan alias @/ atau relative path

export default function Header() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src={logoImg}
        alt="Logo Toko"
        priority
        width={40}
        height={40}
        className="h-10 w-10 object-contain rounded-lg"
      />
      <span className="font-bold text-slate-800">Top - Top Tea</span>
    </div>
  );
}
