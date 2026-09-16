"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Store,
  Package,
  RefreshCw,
  Save,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

export default function AdminStockPage() {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [stocks, setStocks] = useState({}); // { [productId]: qty }
  const [editedStocks, setEditedStocks] = useState({}); // { [productId]: newQty }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // State Modal Notification Profesional
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

  // Fetch Cabang & Produk
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Stores
        const storesSnap = await getDocs(collection(db, "stores"));
        const storeList = storesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setStores(storeList);

        if (storeList.length > 0) {
          setSelectedStore(storeList[0].id);
        }

        // 2. Fetch Trackable Products
        const productsSnap = await getDocs(collection(db, "products"));
        const productList = productsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.trackStock !== false); // Hanya produk yang butuh stok

        setProducts(productList);
      } catch (err) {
        console.error("Gagal memuat data awal:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch Stok Berdasarkan Cabang yang Dipilih
  const fetchBranchStock = async (storeId) => {
    if (!storeId) return;
    try {
      setLoading(true);
      const stockSnap = await getDocs(
        collection(db, "stores", storeId, "stocks"),
      );
      const stockMap = {};
      stockSnap.docs.forEach((d) => {
        stockMap[d.id] = d.data().qty ?? 0;
      });
      setStocks(stockMap);
      setEditedStocks(stockMap);
    } catch (err) {
      console.error("Gagal memuat stok cabang:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStore) {
      fetchBranchStock(selectedStore);
    }
  }, [selectedStore]);

  // Handle Perubahan Nilai Input Stok
  const handleStockChange = (productId, value) => {
    const qty = value === "" ? "" : Math.max(0, parseInt(value) || 0);
    setEditedStocks((prev) => ({
      ...prev,
      [productId]: qty,
    }));
  };

  // Simpan Perubahan Stok ke Firestore
  const handleSaveStocks = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      for (const product of products) {
        const newQty = editedStocks[product.id];
        if (newQty !== undefined && newQty !== stocks[product.id]) {
          const stockRef = doc(
            db,
            "stores",
            selectedStore,
            "stocks",
            product.id,
          );
          await setDoc(
            stockRef,
            {
              qty: Number(newQty),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        }
      }
      showNotification(
        "Berhasil Disimpan",
        "Perubahan stok barang telah berhasil diperbarui ke database.",
        "success",
      );
      fetchBranchStock(selectedStore);
    } catch (err) {
      console.error("Gagal memperbarui stok:", err);
      showNotification(
        "Gagal Menyimpan",
        "Terjadi kesalahan saat menyimpan stok. Silakan coba lagi.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const hasChanges = JSON.stringify(stocks) !== JSON.stringify(editedStocks);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Stok</h1>
          <p className="text-sm text-slate-500">
            Kelola ketersediaan stok produk untuk tiap cabang
          </p>
        </div>

        <button
          onClick={handleSaveStocks}
          disabled={!hasChanges || saving}
          className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition shadow-sm ${
            hasChanges && !saving
              ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 active:scale-95"
              : "bg-slate-300 cursor-not-allowed"
          }`}
        >
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {/* Selector Cabang & Search */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Pilih Cabang */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-200 text-xs font-medium text-slate-600">
            <Store className="h-4 w-4 text-amber-600" />
            <span className="font-bold text-slate-700">Pilih Cabang:</span>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cari Produk */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>
      </div>

      {/* Tabel Stok Produk */}
      <div className="overflow-hidden rounded-xl bg-white shadow border border-slate-200">
        {loading ? (
          <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-amber-600" />
            <span>Memuat data stok...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Tidak ada produk ditemukan.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs uppercase text-slate-700">
              <tr>
                <th className="px-6 py-3">Produk</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3 text-center">Stok Saat Ini</th>
                <th className="px-6 py-3 text-center">Atur Stok Baru</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.map((p) => {
                const currentQty = stocks[p.id] ?? 0;
                const newQty = editedStocks[p.id] ?? 0;
                const isModified = currentQty !== newQty;

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400">
                          Rp {p.price?.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize text-slate-500">
                      {p.category || "-"}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">
                      {currentQty}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={newQty}
                        onChange={(e) =>
                          handleStockChange(p.id, e.target.value)
                        }
                        className={`w-24 rounded-lg border px-3 py-1.5 text-center font-bold focus:outline-none ${
                          isModified
                            ? "border-amber-500 bg-amber-50 text-amber-900"
                            : "border-slate-300 bg-white text-slate-800"
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      {newQty === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          <AlertCircle className="h-3 w-3" /> Habis
                        </span>
                      ) : newQty <= 5 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          Menipis
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          Tersedia
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Dialog Alert Profesional */}
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
