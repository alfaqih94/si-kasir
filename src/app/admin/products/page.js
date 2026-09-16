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
import {
  Plus,
  Edit2,
  Trash2,
  ShoppingBag,
  Check,
  X,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form States
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Kopi");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [trackStock, setTrackStock] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Notification Dialog State
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success", // 'success' | 'error'
  });

  const showNotification = (title, message, type = "success") => {
    setDialog({ isOpen: true, title, message, type });
  };

  const closeNotification = () => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setProducts(list);
    } catch (err) {
      console.error("Gagal mengambil data produk:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setName(product.name || "");
      setPrice(product.price || "");
      setCategory(product.category || "Minuman");
      setImageUrl(product.imageUrl || "");
      setIsAvailable(product.isAvailable ?? true);
      setTrackStock(product.trackStock ?? false);
    } else {
      setEditingId(null);
      setName("");
      setPrice("");
      setCategory("Minuman");
      setImageUrl("");
      setIsAvailable(true);
      setTrackStock(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name,
        price: Number(price),
        category,
        imageUrl,
        isAvailable,
        trackStock,
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), payload);
        showNotification(
          "Berhasil Diperbarui",
          `Data produk "${name}" telah berhasil diperbarui.`,
          "success",
        );
      } else {
        await addDoc(collection(db, "products"), payload);
        showNotification(
          "Berhasil Ditambahkan",
          `Produk baru "${name}" telah berhasil ditambahkan ke menu.`,
          "success",
        );
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error("Gagal menyimpan produk:", err);
      showNotification(
        "Gagal Menyimpan",
        `Terjadi kesalahan saat menyimpan produk: ${err.message}`,
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteProduct = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);

    try {
      await deleteDoc(doc(db, "products", productToDelete.id));
      setIsDeleteModalOpen(false);
      showNotification(
        "Berhasil Dihapus",
        `Produk "${productToDelete.name}" telah dihapus secara permanen dari database.`,
        "success",
      );
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      console.error("Gagal menghapus produk:", err);
      showNotification(
        "Gagal Menghapus",
        "Terjadi kesalahan saat menghapus produk. Silakan coba lagi.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (product) => {
    try {
      await updateDoc(doc(db, "products", product.id), {
        isAvailable: !product.isAvailable,
      });
      fetchProducts();
    } catch (err) {
      console.error("Gagal memperbarui status produk:", err);
      showNotification(
        "Gagal Mengubah Status",
        "Terjadi kesalahan saat mengubah status ketersediaan produk.",
        "error",
      );
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Kelola Produk & Menu
          </h1>
          <p className="text-sm text-slate-500">
            Daftar menu minuman dan makanan untuk kasir
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-800 transition active:scale-95 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Tambah Produk
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow border border-slate-200">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Memuat data produk...
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Belum ada produk terdaftar.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs uppercase text-slate-700">
              <tr>
                <th className="px-6 py-3">Produk</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3">Harga</th>
                <th className="px-6 py-3">Lacak Stok</th>
                <th className="px-6 py-3">Status Menu</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                      )}
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{p.category || "-"}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    Rp {p.price?.toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4">
                    {p.trackStock ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <Boxes className="h-3 w-3" /> Ya (Aktif)
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                        Tidak (Unlim)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(p)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                        p.isAvailable
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.isAvailable ? (
                        <>
                          <Check className="h-3 w-3" /> Tersedia
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3" /> Habis
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openModal(p)}
                      className="mr-2 text-slate-600 hover:text-amber-600 transition"
                      title="Edit Produk"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => confirmDeleteProduct(p)}
                      className="text-slate-600 hover:text-red-600 transition"
                      title="Hapus Produk"
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

      {/* Modal Form Tambah/Edit Produk */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              {editingId ? "Edit Produk" : "Tambah Produk Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Nama Produk
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="Kopi Susu Gula Aren"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="Minuman">Minuman</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Harga (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="18000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  URL Gambar Produk (Opsional)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="https://example.com/kopi.jpg"
                />
              </div>

              <div className="space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label
                    htmlFor="isAvailable"
                    className="text-sm font-medium text-slate-700"
                  >
                    Stok Tersedia
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                  <input
                    type="checkbox"
                    id="trackStock"
                    checked={trackStock}
                    onChange={(e) => setTrackStock(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label
                    htmlFor="trackStock"
                    className="text-sm font-medium text-slate-700"
                  >
                    Lacak Stok Produk (Unit/Fisik)
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 pl-6">
                  Centang jika produk ini memiliki jumlah stok fisik per cabang
                  (seperti minuman botol/snack).
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 disabled:opacity-50 active:scale-95 transition"
                >
                  {submitting ? "Memproses..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PRODUK */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Hapus Produk</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Apakah Anda yakin ingin menghapus produk ini secara permanen?
              </p>

              {productToDelete && (
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
                  {productToDelete.imageUrl ? (
                    <img
                      src={productToDelete.imageUrl}
                      alt={productToDelete.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {productToDelete.name}
                    </h4>
                    <p className="text-slate-500">
                      {productToDelete.category} • Rp{" "}
                      {productToDelete.price?.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-red-50 p-3 text-red-700 border border-red-200">
                <strong>Peringatan!</strong> Produk yang dihapus tidak dapat
                dikembalikan lagi.
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setProductToDelete(null);
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 font-semibold text-white hover:bg-red-700 shadow-md shadow-red-600/20 active:scale-95 transition disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Alert/Notifikasi Profesional */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl transition-all">
            <button
              onClick={closeNotification}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              {dialog.type === "success" ? (
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              ) : (
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertCircle className="h-8 w-8" />
                </div>
              )}

              <h3 className="text-lg font-bold text-slate-800">
                {dialog.title}
              </h3>
              <p className="mt-2 text-xs text-slate-500">{dialog.message}</p>

              <button
                onClick={closeNotification}
                className="mt-6 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
