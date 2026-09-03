"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Plus, Edit2, Trash2, Store, MapPin, Phone } from "lucide-react";

export default function AdminStoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "stores"));
      const items = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setStores(items);
    } catch (err) {
      console.error("Gagal mengambil data toko:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const openModal = (store = null) => {
    if (store) {
      setEditingId(store.id);
      setName(store.name || "");
      setAddress(store.address || "");
      setPhone(store.phone || "");
      setIsActive(store.isActive ?? true);
    } else {
      setEditingId(null);
      setName("");
      setAddress("");
      setPhone("");
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const storeData = {
        name,
        address,
        phone,
        isActive,
      };

      if (editingId) {
        await updateDoc(doc(db, "stores", editingId), storeData);
      } else {
        await addDoc(collection(db, "stores"), storeData);
      }

      setIsModalOpen(false);
      fetchStores();
    } catch (err) {
      console.error("Gagal menyimpan data toko:", err);
      alert("Terjadi kesalahan saat menyimpan data toko.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus cabang toko ini?")) {
      try {
        await deleteDoc(doc(db, "stores", id));
        fetchStores();
      } catch (err) {
        console.error("Gagal menghapus toko:", err);
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Kelola Cabang Toko
          </h1>
          <p className="text-sm text-slate-500">
            Daftar lokasi fisik kedai kopi Anda
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          <Plus className="h-4 w-4" /> Tambah Toko
        </button>
      </div>

      {/* Grid Cabang Toko */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">
          Memuat data toko...
        </div>
      ) : stores.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow">
          Belum ada cabang toko terdaftar.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((s) => (
            <div
              key={s.id}
              className="flex flex-col justify-between rounded-xl bg-white p-6 shadow transition hover:shadow-md"
            >
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Store className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      s.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {s.isActive ? "Beroperasi" : "Tutup"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800">{s.name}</h3>

                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>{s.address || "Alamat belum diisi"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{s.phone || "No. Telepon belum diisi"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end border-t border-slate-100 pt-4">
                <div className="flex gap-1">
                  <button
                    onClick={() => openModal(s)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-amber-600"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Store */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              {editingId ? "Edit Cabang Toko" : "Tambah Cabang Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Nama Toko / Cabang
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="Contoh: Kedai Kopi Sudirman"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Alamat Lengkap
                </label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="Jl. Jend. Sudirman No. 123, Jakarta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="081234567890"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">
                  Status Beroperasi
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
