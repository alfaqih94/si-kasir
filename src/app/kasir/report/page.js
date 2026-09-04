"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  Calendar,
  DollarSign,
  ShoppingBag,
  Clock,
  FileSpreadsheet,
} from "lucide-react";

export default function KasirReportPage() {
  const { user, userProfile, currentUser } = useAuth();
  const [dailyTransactions, setDailyTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalOmset: 0,
    totalTransaksi: 0,
    totalCash: 0,
    totalQris: 0,
  });

  useEffect(() => {
    const fetchDailyReport = async () => {
      // Dapatkan activeUid dari berbagai opsi objek Auth yang mungkin dipasang di context
      const activeUid =
        user?.uid || userProfile?.uid || userProfile?.id || currentUser?.uid;

      if (!activeUid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const transSnap = await getDocs(collection(db, "transactions"));

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const transList = [];
        let omset = 0;
        let cash = 0;
        let qris = 0;

        transSnap.docs.forEach((docSnap) => {
          const data = docSnap.data();

          // Ambil ID kasir dari field dokumen transaksi
          const docCashierId = String(
            data.cashierId || data.userId || data.createdBy || "",
          );

          // Cek apakah ID sesuai dengan user yang sedang login
          if (docCashierId === String(activeUid)) {
            // Parser tanggal
            let dateObj = new Date();
            if (data.createdAt?.toDate) {
              dateObj = data.createdAt.toDate();
            } else if (data.createdAt) {
              dateObj = new Date(data.createdAt);
            }

            // Filter transaksi hari ini
            if (dateObj >= startOfDay && dateObj <= endOfDay) {
              const item = {
                id: docSnap.id,
                ...data,
                dateObj,
              };
              transList.push(item);

              const total = Number(data.totalPrice) || 0;
              omset += total;
              if (data.paymentMethod === "cash") cash += total;
              if (data.paymentMethod === "qris") qris += total;
            }
          }
        });

        // Urutkan transaksi terbaru di paling atas
        transList.sort((a, b) => b.dateObj - a.dateObj);

        setDailyTransactions(transList);
        setSummary({
          totalOmset: omset,
          totalTransaksi: transList.length,
          totalCash: cash,
          totalQris: qris,
        });
      } catch (err) {
        console.error("Gagal mengambil laporan harian kasir:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyReport();
  }, [user, userProfile, currentUser]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" /> Ringkasan
            Penjualan Harian
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Laporan khusus transaksi kasir:{" "}
            <span className="font-semibold text-slate-700">
              {userProfile?.name ||
                user?.displayName ||
                currentUser?.email ||
                "Kasir"}
            </span>
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
        ) : dailyTransactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            Belum ada transaksi yang diproses hari ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Waktu</th>
                  <th className="px-4 py-3">Kasir</th>
                  <th className="px-4 py-3">Item Pesanan</th>
                  <th className="px-4 py-3">Metode</th>
                  <th className="px-4 py-3 text-right rounded-r-xl">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                      {t.dateObj.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {t.cashierName ||
                        userProfile?.name ||
                        user?.displayName ||
                        "Kasir"}
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
