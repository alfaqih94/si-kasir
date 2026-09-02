"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Jika belum login, lempar ke halaman login
        router.push("/login");
      } else if (
        allowedRoles &&
        userProfile &&
        !allowedRoles.includes(userProfile.role)
      ) {
        // Jika role tidak sesuai, arahkan ke halaman yang relevan
        if (userProfile.role === "admin") {
          router.push("/admin");
        } else if (userProfile.role === "kasir") {
          router.push("/kasir");
        }
      }
    }
  }, [user, userProfile, loading, allowedRoles, router]);

  if (
    loading ||
    !user ||
    (allowedRoles && !allowedRoles.includes(userProfile?.role))
  ) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600">Memuat data akses...</p>
        </div>
      </div>
    );
  }

  return children;
}
