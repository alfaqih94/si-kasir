"use client";

import { useState } from "react";
import Image from "next/image";
import logoImg from "@/components/logo.png";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Footer from "@/components/Footer";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Layers,
} from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { userProfile, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Kelola Produk", href: "/admin/products", icon: ShoppingBag },
    { name: "Kelola Stok", href: "/admin/stocks", icon: Layers },
    { name: "Laporan Harian", href: "/admin/daily", icon: FileText },
    { name: "Laporan Penjualan", href: "/admin/reports", icon: FileText },
    { name: "Kelola Cabang", href: "/admin/stores", icon: Store },
    { name: "Kelola Akun", href: "/admin/users", icon: Users },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex h-screen flex-col bg-slate-100 overflow-hidden">
        {/* Header Atas dengan Tombol Toggle Sidebar */}
        <header
          className="flex h-16 items-center justify-between px-4 sm:px-6 text-white shrink-0 shadow-md z-20"
          style={{
            background: "linear-gradient(90deg, #003c00 0%, #00750a 100%)",
          }}
        >
          <div className="flex items-center gap-3">
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
                  TOP-TOP TEA
                </h1>
                <p className="mt-0.5 text-xs" style={{ color: "#9ae39e" }}>
                  Panel Administrator
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-xs hidden sm:block">
              <p className="font-semibold text-white">
                {userProfile?.name || "Admin"}
              </p>
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
          {/* Overlay di layar kecil saat sidebar terbuka */}
          {isSidebarOpen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-10 bg-black/40 md:hidden"
            />
          )}

          {/* Collapsible Sidebar */}
          <aside
            className={`absolute md:relative z-10 flex h-full flex-col justify-between p-4 transition-all duration-300 ease-in-out text-slate-200 ${
              isSidebarOpen
                ? "w-64 translate-x-0 shadow-lg"
                : "w-0 -translate-x-full overflow-hidden p-0 border-none"
            }`}
            style={{
              background:
                "linear-gradient(180deg, #003c00 0%, #002800 60%, #001900 100%)",
            }}
          >
            <div className="space-y-4">
              <p
                className="text-xs font-bold uppercase tracking-wider px-2"
                style={{ color: "#9ae39e" }}
              >
                Menu Navigasi
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
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all"
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(90deg, #3eae4c 0%, #00750a 100%)",
                              color: "#ffffff",
                              boxShadow: "0 4px 12px rgba(0, 117, 10, 0.4)",
                            }
                          : {
                              color: "#e2f7e2",
                            }
                      }
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Area Konten Utama & Footer */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto p-4">{children}</main>
            <Footer />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
