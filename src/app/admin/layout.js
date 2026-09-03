"use client";

import Image from "next/image";
import logoImg from "@/components/logo.jpeg";
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
  Coffee,
} from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { userProfile, logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Kelola Produk", href: "/admin/products", icon: ShoppingBag },
    { name: "Kelola Cabang", href: "/admin/stores", icon: Store },
    { name: "Kelola Akun", href: "/admin/users", icon: Users },
    { name: "Laporan Penjualan", href: "/admin/reports", icon: FileText },
    { name: "Kelola Stok", href: "/admin/stocks", icon: FileText },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex min-h-screen bg-slate-100">
        {/* Sidebar Navigasi - Tema Hijau Gelap #003c00 ke #00750a */}
        <aside
          className="hidden w-64 flex-col justify-between p-4 text-slate-200 md:flex"
          style={{
            background:
              "linear-gradient(180deg, #003c00 0%, #002800 60%, #001900 100%)",
          }}
        >
          <div>
            {/* Logo Brand */}
            <div
              className="mb-6 flex items-center gap-3 border-b px-3 py-4"
              style={{ borderColor: "rgba(154, 227, 158, 0.2)" }}
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-amber-100">
                <Image
                  src={logoImg}
                  alt="Top-Top Tea Logo"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">TOP-TOP TEA</h2>
                <p className="text-xs" style={{ color: "#9ae39e" }}>
                  Panel Administrator
                </p>
              </div>
            </div>

            {/* Menu Links */}
            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
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

          {/* User Profile & Logout */}
          <div
            className="border-t pt-4"
            style={{ borderColor: "rgba(154, 227, 158, 0.2)" }}
          >
            <div className="mb-3 px-3">
              <p className="text-sm font-semibold text-white">
                {userProfile?.name || "Admin"}
              </p>
              <p className="text-xs capitalize" style={{ color: "#9ae39e" }}>
                Role: {userProfile?.role}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600/20 border border-red-500/40 px-4 py-2.5 text-sm font-bold text-red-200 transition hover:bg-red-600 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </aside>

        {/* Area Konten Utama & Footer */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <main className="flex-1 p-8">{children}</main>
          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
