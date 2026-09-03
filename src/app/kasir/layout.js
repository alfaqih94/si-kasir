"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Coffee, LogOut, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import logoImg from "@/components/logo.jpeg";

export default function PosLayout({ children }) {
  const { userProfile, logout } = useAuth();
  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    const fetchStore = async () => {
      if (userProfile?.storeId) {
        try {
          const storeSnap = await getDoc(
            doc(db, "stores", userProfile.storeId),
          );
          if (storeSnap.exists()) {
            setStoreName(storeSnap.data().name);
          }
        } catch (err) {
          console.error("Gagal mengambil data toko:", err);
        }
      } else if (userProfile?.role === "admin") {
        setStoreName("Akses Admin (Semua Cabang)");
      }
    };

    fetchStore();
  }, [userProfile]);

  return (
    <ProtectedRoute allowedRoles={["kasir", "admin"]}>
      <div className="flex h-screen flex-col bg-slate-100 font-sans">
        {/* Header Navigation - Tema Hijau Gelap (#003c00 - #00750a) */}
        <header
          className="flex h-16 items-center justify-between px-6 text-white shrink-0 shadow-md z-10"
          style={{
            background: "linear-gradient(90deg, #003c00 0%, #00750a 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="mx-auto flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-amber-100">
              <Image
                src={logoImg}
                alt="Top-Top Tea Logo"
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-base font-bold leading-none text-white">
                Top-Top Tea
              </h1>
              <p
                className="mt-0.5 flex items-center gap-1 text-xs"
                style={{ color: "#9ae39e" }}
              >
                <Store className="h-3 w-3" /> {storeName || "Memuat Cabang..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-xs">
              <p className="font-semibold text-white">{userProfile?.name}</p>
              <p className="capitalize" style={{ color: "#9ae39e" }}>
                Role: {userProfile?.role}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl bg-red-600/90 border border-red-400/30 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </header>

        {/* Konten Halaman Kasir */}
        <div className="flex flex-1 overflow-hidden">{children}</div>
      </div>
    </ProtectedRoute>
  );
}
