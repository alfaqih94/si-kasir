"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Store,
  Calendar,
  Filter,
} from "lucide-react";

export default function AdminReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [selectedStore, setSelectedStore] = useState("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState("TODAY"); // Default: Hari Ini
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Stores
        const storesSnap = await getDocs(collection(db, "stores"));
        const storeList = storesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setStores(storeList);

        // Fetch Transactions (diurutkan dari yang terbaru)
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

    fetchData();
  }, []);

  // Filter Logic
  const filteredTransactions = transactions.filter((t) => {
    // 1. Filter Cabang Toko
    if (selectedStore !== "ALL" && t.storeId !== selectedStore) {
      return false;
    }

    const txDate = t.dateObj;
    const now = new Date();

    // 2. Filter Periode Tanggal
    if (selectedPeriod === "TODAY") {
      const isToday =
        txDate.getDate() === now.getDate() &&
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear();
      if (!isToday) return false;
    } else if (selectedPeriod === "WEEK") {
      // Hitung awal minggu (Hari Senin 00:00:00)
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      // Hitung akhir minggu (Hari Minggu 23:59:59)
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

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Laporan Penjualan</h1>
        <p className="text-sm text-slate-500">
          Rekap transaksi dan omset penjualan seluruh cabang
        </p>
      </div>

      {/* Control Panel Filter */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Filter className="h-4 w-4 text-amber-600" />
          <span>Filter Laporan</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          {/* Opsi Periode Waktu */}
          <button
            onClick={() => setSelectedPeriod("TODAY")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedPeriod === "TODAY"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Hari Ini
          </button>

          <button
            onClick={() => setSelectedPeriod("WEEK")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedPeriod === "WEEK"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Minggu Ini (Sen-Min)
          </button>

          <button
            onClick={() => setSelectedPeriod("MONTH")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedPeriod === "MONTH"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Bulan Ini
          </button>

          <button
            onClick={() => setSelectedPeriod("CUSTOM")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedPeriod === "CUSTOM"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Pilih Tanggal
          </button>
        </div>

        {/* Form Rentang Tanggal Custom */}
        {selectedPeriod === "CUSTOM" && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
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
    </div>
  );
}
