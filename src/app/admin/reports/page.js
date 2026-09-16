"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Store,
  Calendar,
  Filter,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

export default function AdminReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [selectedStore, setSelectedStore] = useState("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState("TODAY"); // TODAY, WEEK, MONTH, CUSTOM
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Delete Modal State (Konfirmasi Berlapis)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteMonth, setDeleteMonth] = useState(new Date().getMonth());
  const [deleteYear, setDeleteYear] = useState(new Date().getFullYear());
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  const monthsList = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const storesSnap = await getDocs(collection(db, "stores"));
      const storeList = storesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setStores(storeList);

      const qTransactions = query(
        collection(db, "transactions"),
        orderBy("createdAt", "desc"),
      );
      const transSnap = await getDocs(qTransactions);
      const transList = transSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          dateObj: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
        };
      });

      setTransactions(transList);
    } catch (err) {
      console.error("Gagal memuat data laporan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Logic
  const filteredTransactions = transactions.filter((t) => {
    if (selectedStore !== "ALL" && t.storeId !== selectedStore) {
      return false;
    }

    const txDate = t.dateObj;
    const now = new Date();

    if (selectedPeriod === "TODAY") {
      const isToday =
        txDate.getDate() === now.getDate() &&
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear();
      if (!isToday) return false;
    } else if (selectedPeriod === "WEEK") {
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      if (txDate < monday || txDate > sunday) return false;
    } else if (selectedPeriod === "MONTH") {
      const isThisMonth =
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear();
      if (!isThisMonth) return false;
    } else if (selectedPeriod === "CUSTOM") {
      if (!customStart || !customEnd) return true;

      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);

      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);

      if (txDate < start || txDate > end) return false;
    }

    return true;
  });

  // Calculate Metrics
  const totalOmset = filteredTransactions.reduce(
    (sum, t) => sum + (t.totalPrice || 0),
    0,
  );
  const totalTransaksi = filteredTransactions.length;
  const avgTransaksi = totalTransaksi > 0 ? totalOmset / totalTransaksi : 0;

  // Handler Hapus Laporan Berdasarkan Rentang Bulan
  const handleDeleteRange = async () => {
    if (confirmText !== "HAPUS") return;

    setDeleting(true);
    try {
      const targetDocs = transactions.filter((t) => {
        const m = t.dateObj.getMonth();
        const y = t.dateObj.getFullYear();
        return m === Number(deleteMonth) && y === Number(deleteYear);
      });

      for (const item of targetDocs) {
        await deleteDoc(doc(db, "transactions", item.id));
      }

      closeDeleteModal();
      showNotification(
        "Berhasil Dihapus",
        `Sebanyak ${targetDocs.length} transaksi pada periode tersebut telah berhasil dihapus dari database.`,
        "success",
      );
      fetchData();
    } catch (err) {
      console.error("Gagal menghapus data:", err);
      showNotification(
        "Gagal Menghapus",
        "Terjadi kesalahan saat menghapus data laporan. Silakan coba lagi.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteStep(1);
    setConfirmText("");
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Tombol Aksi Hapus */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Laporan Penjualan
          </h1>
          <p className="text-sm text-slate-500">
            Rekap transaksi dan omset penjualan seluruh cabang
          </p>
        </div>

        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition shadow-sm active:scale-95"
        >
          <Trash2 className="h-4 w-4" />
          Hapus Database Laporan
        </button>
      </div>

      {/* Control Panel Filter */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Filter className="h-4 w-4 text-amber-600" />
          <span>Filter Laporan</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Filter Cabang */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 text-xs font-medium text-slate-600">
            <Store className="h-4 w-4 text-slate-400" />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none"
            >
              <option value="ALL">Semua Cabang</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Rentang Tanggal & Bulan via Dropdown */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 text-xs font-medium text-slate-600">
            <Calendar className="h-4 w-4 text-slate-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none"
            >
              <option value="TODAY">Hari Ini</option>
              <option value="WEEK">Minggu Ini (Senin - Minggu)</option>
              <option value="MONTH">Bulan Ini</option>
              <option value="CUSTOM">Pilih Tanggal Khusus</option>
            </select>
          </div>
        </div>

        {/* Form Rentang Tanggal Custom */}
        {selectedPeriod === "CUSTOM" && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <label className="font-medium">Dari Tanggal:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium">Sampai Tanggal:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Ringkasan Metrik */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Omset</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">
              Rp {totalOmset.toLocaleString("id-ID")}
            </h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Total Transaksi
            </p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">
              {totalTransaksi}{" "}
              <span className="text-sm font-normal text-slate-500">
                transaksi
              </span>
            </h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Rata-rata Transaksi
            </p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">
              Rp {Math.round(avgTransaksi).toLocaleString("id-ID")}
            </h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Transaksi */}
      <div className="overflow-hidden rounded-xl bg-white shadow border border-slate-200">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Memuat laporan transaksi...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Tidak ada transaksi ditemukan untuk filter ini.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs uppercase text-slate-700">
              <tr>
                <th className="px-6 py-3">Tanggal & Waktu</th>
                <th className="px-6 py-3">Cabang Toko</th>
                <th className="px-6 py-3">Kasir</th>
                <th className="px-6 py-3">Item Dibeli</th>
                <th className="px-6 py-3">Metode Bayar</th>
                <th className="px-6 py-3 text-right">Total Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                    {t.dateObj.toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {t.storeName || "-"}
                  </td>
                  <td className="px-6 py-4">{t.cashierName || "-"}</td>
                  <td className="px-6 py-4">
                    <span className="line-clamp-1 text-xs text-slate-500">
                      {t.items?.map((i) => `${i.name} (x${i.qty})`).join(", ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 capitalize">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        t.paymentMethod === "cash"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {t.paymentMethod || "Tunai"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                    Rp {t.totalPrice?.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL KONFIRMASI BERLAPIS UNTUK HAPUS DATABASE */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Hapus Database Laporan
              </h3>
            </div>

            {/* Konfirmasi Tahap 1: Pilih Rentang Bulan & Tahun */}
            {deleteStep === 1 && (
              <div className="space-y-4 text-xs text-slate-600">
                <p>
                  Pilih rentang bulan & tahun laporan transaksi yang ingin
                  dihapus secara permanen:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Bulan:
                    </label>
                    <select
                      value={deleteMonth}
                      onChange={(e) => setDeleteMonth(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 font-medium focus:outline-none focus:border-red-500"
                    >
                      {monthsList.map((m, idx) => (
                        <option key={idx} value={idx}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Tahun:
                    </label>
                    <select
                      value={deleteYear}
                      onChange={(e) => setDeleteYear(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 font-medium focus:outline-none focus:border-red-500"
                    >
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    onClick={closeDeleteModal}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => setDeleteStep(2)}
                    className="px-4 py-2 rounded-xl bg-red-600 font-semibold text-white hover:bg-red-700 shadow-md shadow-red-600/20"
                  >
                    Lanjut Konfirmasi
                  </button>
                </div>
              </div>
            )}

            {/* Konfirmasi Tahap 2: Verifikasi Manual Ketik "HAPUS" */}
            {deleteStep === 2 && (
              <div className="space-y-4 text-xs text-slate-600">
                <div className="rounded-xl bg-red-50 p-3 text-red-700 border border-red-200">
                  <strong>Peringatan!</strong> Semua data transaksi pada periode{" "}
                  <strong>
                    {monthsList[deleteMonth]} {deleteYear}
                  </strong>{" "}
                  akan dihapus dari database dan tidak dapat dikembalikan lagi.
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-slate-700">
                    Ketik kata{" "}
                    <span className="text-red-600 font-bold">HAPUS</span> untuk
                    melanjutkan:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Ketik HAPUS"
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-bold uppercase focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setDeleteStep(1)}
                    disabled={deleting}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleDeleteRange}
                    disabled={confirmText !== "HAPUS" || deleting}
                    className={`px-4 py-2 rounded-xl font-semibold text-white transition ${
                      confirmText === "HAPUS" && !deleting
                        ? "bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 active:scale-95"
                        : "bg-red-300 cursor-not-allowed"
                    }`}
                  >
                    {deleting ? "Menghapus..." : "Ya, Hapus Permanen"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
