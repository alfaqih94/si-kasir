"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  signOut,
} from "firebase/auth";
import {
  User,
  Mail,
  Lock,
  ShieldAlert,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

export default function KasirProfilePage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();

  // State Form Ubah Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State Notifikasi & Loading
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Harap isi semua kolom password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi password baru tidak cocok.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password baru minimal harus 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const activeUser = auth.currentUser;

      if (!activeUser || !activeUser.email) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      // 1. Verifikasi Password Lama (Re-Authentication)
      const credential = EmailAuthProvider.credential(
        activeUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(activeUser, credential);

      // 2. Update Password Baru
      await updatePassword(activeUser, newPassword);

      // 3. Tampilkan Pesan Sukses Singkat & Logout
      setSuccessMessage(
        "Password berhasil diperbarui! Mengalihkan ke halaman login...",
      );

      setTimeout(async () => {
        await signOut(auth);
        router.push("/login"); // Ubah path sesuai dengan rute login kamu (misal: "/login")
      }, 1500);
    } catch (err) {
      console.error("Gagal mengubah password:", err);

      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setErrorMessage("Password saat ini (lama) yang kamu masukkan salah.");
      } else if (err.code === "auth/too-many-requests") {
        setErrorMessage("Mencapai batas percobaan. Silakan coba lagi nanti.");
      } else {
        setErrorMessage(err.message || "Gagal memperbarui password.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <User className="h-6 w-6" style={{ color: "#00750a" }} />
          Profil Kasir
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola informasi akun dan tingkatkan keamanan akun kasir kamu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Identitas Kasir */}
        <div className="md:col-span-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 text-center flex flex-col items-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl text-white mb-4 shadow-inner"
            style={{ background: "#00750a" }}
          >
            {(userProfile?.name || user?.displayName || "K")
              .charAt(0)
              .toUpperCase()}
          </div>
          <h2 className="font-bold text-lg text-slate-800">
            {userProfile?.name || user?.displayName || "Kasir"}
          </h2>
          <span className="inline-block mt-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
            {userProfile?.role?.toUpperCase() || "KASIR"}
          </span>

          <div className="w-full border-t border-slate-100 my-4 pt-4 text-left space-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{user?.email || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-400 shrink-0" />
              <span>ID: {user?.uid ? `${user.uid.slice(0, 8)}...` : "-"}</span>
            </div>
          </div>
        </div>

        {/* Form Ubah Password */}
        <div className="md:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <KeyRound className="h-5 w-5" style={{ color: "#00750a" }} />
            <h3 className="font-bold text-slate-800">Ubah Password Akun</h3>
          </div>

          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
              <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              {successMessage}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password Saat Ini (Password Lama)
              </label>
              <input
                type="password"
                required
                disabled={loading}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password lama untuk konfirmasi"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-50"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                * Diperlukan verifikasi password lama untuk keamanan akun.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm text-white transition shadow-md disabled:opacity-50"
                style={{ background: "#00750a" }}
              >
                {loading
                  ? "Memverifikasi & Mengubah..."
                  : "Simpan Password Baru"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
