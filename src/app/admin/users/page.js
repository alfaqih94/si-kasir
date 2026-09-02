"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { Plus, Edit2, Trash2, Shield } from "lucide-react";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("kasir");
  const [storeId, setStoreId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersSnap, storesSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "stores")),
      ]);

      const storeList = storesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const userList = usersSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setStores(storeList);
      setUsers(userList);
    } catch (err) {
      console.error("Gagal mengambil data user/toko:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (user = null) => {
    if (user) {
      setEditingId(user.id);
      setName(user.name || "");
      setEmail(user.email || "");
      setPassword(""); // Kosong secara default saat edit
      setRole(user.role || "kasir");
      setStoreId(user.storeId || "");
      setIsActive(user.isActive ?? true);
    } else {
      setEditingId(null);
      setName("");
      setEmail("");
      setPassword("");
      setRole("kasir");
      setStoreId(stores[0]?.id || "");
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        const currentUser = users.find((u) => u.id === editingId);
        const isEmailChanged = email !== currentUser?.email;
        const isPasswordProvided = password.trim() !== "";

        // Kirim perubahan email/password ke API Server jika ada
        if (isEmailChanged || isPasswordProvided) {
          const res = await fetch("/api/admin/users/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: editingId,
              email: isEmailChanged ? email : undefined,
              password: isPasswordProvided ? password : undefined,
            }),
          });

          const resData = await res.json().catch(() => null);

          if (!res.ok) {
            const errorMsg =
              resData?.error ||
              `Server error status ${res.status}. Pastikan rute API dan file .env.local sudah sesuai.`;
            throw new Error(errorMsg);
          }
        }

        // Update data profil di Firestore
        await updateDoc(doc(db, "users", editingId), {
          name,
          email,
          role,
          storeId: role === "admin" ? "" : storeId,
          isActive,
        });
      } else {
        // Mode Tambah Akun Baru
        const secondaryApp =
          getApps().find((app) => app.name === "Secondary") ||
          initializeApp(firebaseConfig, "Secondary");
        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          email,
          password,
        );
        const newUid = userCredential.user.uid;

        await signOut(secondaryAuth);

        await setDoc(doc(db, "users", newUid), {
          name,
          email,
          role,
          storeId: role === "admin" ? "" : storeId,
          isActive,
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Gagal menyimpan data user:", err);
      alert("Gagal menyimpan user: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      try {
        await deleteDoc(doc(db, "users", id));
        fetchData();
      } catch (err) {
        console.error("Gagal menghapus user:", err);
      }
    }
  };

  const getStoreName = (sId) => {
    if (!sId) return "-";
    const store = stores.find((s) => s.id === sId);
    return store ? store.name : "Toko tidak ditemukan";
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Kelola User & Kasir
          </h1>
          <p className="text-sm text-slate-500">
            Daftar akun pengelola dan staf kasir cabang
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          <Plus className="h-4 w-4" /> Tambah User
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Memuat data user...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Belum ada user terdaftar.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs uppercase text-slate-700">
              <tr>
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Penempatan Cabang</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {u.name}
                  </td>
                  <td className="px-6 py-4">{u.email || "-"}</td>
                  <td className="px-6 py-4 capitalize">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.role === "admin" ? (
                      <span className="text-slate-400">Semua Cabang</span>
                    ) : (
                      getStoreName(u.storeId)
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        u.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openModal(u)}
                      title="Edit User"
                      className="mr-2 text-slate-600 hover:text-amber-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      title="Hapus User"
                      className="text-slate-600 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              {editingId ? "Edit Akun User" : "Tambah User / Kasir Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="Siti Aminah"
                />
              </div>

              {/* Field Email selalu tampil baik Tambah maupun Edit */}
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email Login
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="kasir.sudirman@kopi.com"
                />
              </div>

              {/* Field Password selalu tampil baik Tambah maupun Edit */}
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {editingId ? "Password Baru (Opsional)" : "Password"}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder={
                    editingId
                      ? "Kosongkan jika tidak ingin mengubah password"
                      : "Minimal 6 karakter"
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Role Akses
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {role === "kasir" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Penempatan Cabang Toko
                  </label>
                  <select
                    required
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="" disabled>
                      -- Pilih Cabang --
                    </option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">
                  Akun Aktif
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-800 disabled:opacity-50"
                >
                  {submitting ? "Memproses..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
