"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import logoImg from "@/components/logo.png";
import { Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userCredential = await login(email, password);
      const user = userCredential.user;

      // Cek role dari Firestore untuk menentukan rute redirect
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/kasir");
        }
      } else {
        setError("Profil akun tidak terdaftar di sistem database!");
      }
    } catch (err) {
      console.error(err);
      setError("Email atau Password salah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950">
      {/* Elemen Latar Belakang Berwarna/Blur untuk Memberikan Efek Kaca */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-amber-500/30 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />

      {/* Container Utama Form (Tengah Layar) */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        {/* Card Login dengan Efek Glassmorphism & Backdrop Blur */}
        <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md z-10">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-amber-100/80 shadow-inner">
              <Image
                src={logoImg}
                alt="Top-Top Tea Logo"
                priority
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white tracking-wide">
              Top-Top Tea
            </h2>
            <p className="text-sm text-slate-300">
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-200 border border-red-500/30 backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-200">
                Email
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@toptea.com"
                  className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 backdrop-blur-sm transition focus:border-amber-400 focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 backdrop-blur-sm transition focus:border-amber-400 focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-amber-600/90 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Menyatu dengan Background Parent */}
      <footer className="relative z-10 w-full py-2 bg-transparent border-t border-white/10">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold tracking-tight text-slate-300">
            © 2026 Top - Top Tea. All rights reserved. | Made with ❤️ by
            Alfaqih_94
          </p>
        </div>
      </footer>
    </div>
  );
}
