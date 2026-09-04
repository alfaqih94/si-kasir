"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Footer from "@/components/Footer";
import {
  LogOut,
  Store,
  Menu,
  X,
  ShoppingCart,
  FileText,
  UserCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import logoImg from "@/components/logo.png";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PosLayout({ children }) {
  const { userProfile, logout } = useAuth();
  const [storeName, setStoreName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

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

  const menuItems = [
    { name: "Kasir", href: "/kasir", icon: ShoppingCart },
    { name: "Laporan Harian", href: "/kasir/report", icon: FileText },
    { name: "Profil", href: "/kasir/profile", icon: UserCheck },
  ];

  return (
    <ProtectedRoute allowedRoles={["kasir", "admin"]}>
      <div className="flex h-screen flex-col bg-slate-100 font-sans overflow-hidden">
        {/* Header Navigation */}
        <header
          className="flex h-16 items-center justify-between px-4 sm:px-6 text-white shrink-0 shadow-md z-20"
          style={{
            background: "linear-gradient(90deg, #003c00 0%, #00750a 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Tombol Toggle Sidebar */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg p-1.5 hover:bg-white/10 transition active:scale-95"
              title="Toggle Sidebar"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-amber-100 shrink-0">
                <Image
                  src={logoImg}
                  alt="Top-Top Tea Logo"
                  priority
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
                  <Store className="h-3 w-3" />{" "}
                  {storeName || "Memuat Cabang..."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-xs hidden sm:block">
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

        {/* Layout Utama dengan Collapsible Sidebar */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Overlay saat sidebar terbuka di layar hp */}
          {isSidebarOpen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-10 bg-black/40 md:hidden"
            />
          )}

          {/* Collapsible Sidebar */}
          <aside
            className={`absolute md:relative z-10 flex h-full flex-col justify-between p-4 transition-all duration-300 ease-in-out border-r border-slate-200 bg-white ${
              isSidebarOpen
                ? "w-64 translate-x-0 shadow-lg"
                : "w-0 -translate-x-full overflow-hidden p-0 border-none"
            }`}
          >
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
                Menu Kasir
              </p>
              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/20"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Area Konten Utama (Kasir / Laporan) */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex flex-1 overflow-hidden">{children}</main>
            <Footer />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
