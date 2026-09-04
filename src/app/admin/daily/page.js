"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  Calendar,
  DollarSign,
  ShoppingBag,
  Clock,
  FileSpreadsheet,
  Store,
  User,
  Filter,
} from "lucide-react";

export default function AdminDailyReportPage() {
  const [allTransactions, setAllTransactions] = useState([]);
  const [stores, setStores] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [selectedStore, setSelectedStore] = useState("ALL");
  const [selectedCashier, setSelectedCashier] = useState("ALL");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Data Toko
        const storesSnap = await getDocs(collection(db, "stores"));
        const storeList = storesSnap.docs.map((d) => ({
          id: String(d.id),
          ...d.data(),
        }));
        setStores(storeList);

        // 2. Fetch Data Pengguna (Kecualikan Admin)
        try {
          const usersSnap = await getDocs(collection(db, "users"));
          const cashiersOnly = usersSnap.docs
            .map((d) => ({ id: String(d.id), ...d.data() }))
            .filter(
              (u) =>
                u.role !== "admin" && u.role !== "ADMIN" && (u.name || u.email),
            );

          // Memperbaiki pemanggilan state yang sebelumnya setCashierUsers
          setAllUsers(cashiersOnly);
        } catch (e) {
          console.warn("Gagal mengambil data users:", e);
        }

        // 3. Fetch Transaksi Hari Ini
        const transSnap = await getDocs(collection(db, "transactions"));
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const dailyList = [];

        transSnap.docs.forEach((docSnap) => {
          const data = docSnap.data();

          // Konversi Timestamp Firebase
          let dateObj = new Date();
          if (data.createdAt?.toDate) {
            dateObj = data.createdAt.toDate();
          } else if (data.createdAt) {
            dateObj = new Date(data.createdAt);
          }

          if (dateObj >= startOfDay && dateObj <= endOfDay) {
            const cashierId = String(
              data.cashierId || data.userId || data.createdBy || "",
            );
            const cashierName = data.cashierName || data.userName || "Kasir";

            dailyList.push({
              id: docSnap.id,
              ...data,
              cashierId,
              cashierName,
              dateObj,
            });
          }
        });

        dailyList.sort((a, b) => b.dateObj - a.dateObj);
        setAllTransactions(dailyList);
      } catch (err) {
        console.error("Gagal mengambil laporan harian admin:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter Daftar Kasir Berdasarkan Toko/Cabang yang Dipilih
  const availableCashiers = allUsers.filter((u) => {
    // Pastikan bukan admin
    if (u.role === "admin" || u.role === "ADMIN") return false;

    // Jika toko dipilih (bukan ALL), filter kasir yang storeId-nya sesuai
    if (selectedStore !== "ALL") {
      const userStoreId = String(u.storeId || u.branchId || "");
      return userStoreId === String(selectedStore);
    }
    return true;
  });

  // Filter Transaksi Berdasarkan Toko dan Kasir
  const filteredTransactions = allTransactions.filter((t) => {
    if (
      selectedStore !== "ALL" &&
      String(t.storeId || t.branchId) !== String(selectedStore)
    ) {
      return false;
    }
    if (
      selectedCashier !== "ALL" &&
      String(t.cashierId) !== String(selectedCashier)
    ) {
      return false;
    }
    return true;
  });

  // Perhitungan Ringkasan
  const summary = filteredTransactions.reduce(
    (acc, t) => {
      const total = Number(t.totalPrice) || 0;
      acc.totalOmset += total;
      acc.totalTransaksi += 1;
      if (t.paymentMethod === "cash") acc.totalCash += total;
      if (t.paymentMethod === "qris") acc.totalQris += total;
      return acc;
    },
    { totalOmset: 0, totalTransaksi: 0, totalCash: 0, totalQris: 0 },
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" /> Ringkasan
            Penjualan Harian Admin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau transaksi harian seluruh cabang & kasir secara realtime
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 border border-emerald-200">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Control Panel Filter Toko & Kasir */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Filter className="h-4 w-4 text-emerald-600" />
          <span>Filter Laporan Harian</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Filter Toko */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 text-xs font-medium text-slate-600">
            <Store className="h-4 w-4 text-slate-400" />
            <select
              value={selectedStore}
              onChange={(e) => {
                setSelectedStore(e.target.value);
                setSelectedCashier("ALL"); // Reset pilihan kasir saat toko berganti
              }}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Toko / Cabang</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kasir */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 text-xs font-medium text-slate-600">
            <User className="h-4 w-4 text-slate-400" />
            <select
              value={selectedCashier}
              onChange={(e) => setSelectedCashier(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kasir</option>
              {availableCashiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email || "Kasir"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 p-5 text-white shadow-md">
          <p className="text-xs font-semibold uppercase opacity-80">
            Total Omset Hari Ini
          </p>
          <h2 className="mt-2 text-2xl font-black">
            Rp {summary.totalOmset.toLocaleString("id-ID")}
          </h2>
          <p className="mt-1 text-[11px] opacity-80">
            {summary.totalTransaksi} Transaksi Berhasil
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase">
              Total Tunai (Cash)
            </span>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="mt-2 text-xl font-bold text-slate-800">
            Rp {summary.totalCash.toLocaleString("id-ID")}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase">
              Total Non-Tunai (QRIS)
            </span>
            <ShoppingBag className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="mt-2 text-xl font-bold text-slate-800">
            Rp {summary.totalQris.toLocaleString("id-ID")}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase">
              Jumlah Pesanan
            </span>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="mt-2 text-xl font-bold text-slate-800">
            {summary.totalTransaksi}{" "}
            <span className="text-sm font-normal text-slate-500">Struk</span>
          </h3>
        </div>
      </div>

      {/* Tabel Rincian Transaksi */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <h2 className="font-bold text-slate-800 mb-4">
          Rincian Transaksi Hari Ini
        </h2>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            Memuat laporan...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            Tidak ada transaksi ditemukan untuk filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Waktu</th>
                  <th className="px-4 py-3">Toko</th>
                  <th className="px-4 py-3">Kasir</th>
                  <th className="px-4 py-3">Item Pesanan</th>
                  <th className="px-4 py-3">Metode</th>
                  <th className="px-4 py-3 text-right rounded-r-xl">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                      {t.dateObj.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {t.storeName || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600">
                      {t.cashierName || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.items?.map((i) => `${i.name} (x${i.qty})`).join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          t.paymentMethod === "cash"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      Rp {(Number(t.totalPrice) || 0).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
