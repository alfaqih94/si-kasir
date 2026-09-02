"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
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
    { name: "Kelola Toko", href: "/admin/stores", icon: Store },
    { name: "Kelola Kasir", href: "/admin/users", icon: Users },
    { name: "Laporan Sales", href: "/admin/reports", icon: FileText },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex min-h-screen bg-slate-100">
        {/* Sidebar Navigasi */}
        <aside className="hidden w-64 flex-col justify-between bg-slate-900 p-4 text-slate-300 md:flex">
          <div>
            {/* Logo Brand */}
            <div className="mb-6 flex items-center gap-3 border-b border-slate-800 px-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white">
                <Coffee className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Kedai Kopi POS
                </h2>
                <p className="text-xs text-slate-400">Panel Administrator</p>
              </div>
            </div>

            {/* Menu Links */}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-amber-600 text-white shadow-md"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="border-t border-slate-800 pt-4">
            <div className="mb-3 px-3">
              <p className="text-sm font-semibold text-white">
                {userProfile?.name || "Admin"}
              </p>
              <p className="text-xs text-slate-400 capitalize">
                Role: {userProfile?.role}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </aside>

        {/* Area Konten Utama */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
