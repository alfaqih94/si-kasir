"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import {
  TrendingUp,
  ShoppingBag,
  Store,
  Users,
  Package,
  ArrowUpRight,
  Coffee,
  DollarSign,
  FileText,
  Clock,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalOmset: 0,
    totalTransaksi: 0,
    totalProduk: 0,
    totalToko: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeTrans = () => {};

    const initDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Ambil jumlah toko dan produk
        const [storesSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, "stores")),
          getDocs(collection(db, "products")),
        ]);

        // 2. Setup Real-time Listener untuk Transaksi
        const transQuery = query(
          collection(db, "transactions"),
          orderBy("createdAt", "desc"),
        );

        unsubscribeTrans = onSnapshot(
          transQuery,
          (snapshot) => {
            const transList = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                ...data,
                dateObj: data.createdAt?.toDate
                  ? data.createdAt.toDate()
                  : new Date(),
              };
            });

            const totalOmset = transList.reduce(
              (sum, t) => sum + (t.totalPrice || 0),
              0,
            );

            // Ambil 5 transaksi terbaru
            const top5 = transList.slice(0, 5);

            setStats({
              totalOmset,
              totalTransaksi: transList.length,
              totalToko: storesSnap.size,
              totalProduk: productsSnap.size,
            });

            setRecentTransactions(top5);
            setLoading(false);
          },
          (err) => {
            console.error("Gagal mendengarkan update transaksi:", err);
            setLoading(false);
          },
        );
      } catch (err) {
        console.error("Gagal memuat data pendukung dashboard:", err);
        setLoading(false);
      }
    };

    initDashboardData();

    // Clean up listener saat komponen di-unmount
    return () => {
      unsubscribeTrans();
    };
  }, []);

  return (
    <div className="space-y-8 pb-10">
      {/* Banner Utama Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-3"></div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang di Panel Admin Top-Top Tea
          </h1>
          <p className="mt-2 text-sm sm:text-base text-amber-100">
            Pantau ringkasan omset, performa cabang, dan aktivitas transaksi
            seluruh toko dari satu dashboard interaktif.
          </p>
        </div>
        <Coffee className="absolute -right-6 -bottom-6 h-48 w-48 text-white/10 rotate-12 pointer-events-none" />
      </div>

      {/* Grid Metrik & Statistik Berwarna */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card Omset */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">
              Total Omset
            </span>
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="mt-4 text-2xl font-black">
            Rp {stats.totalOmset.toLocaleString("id-ID")}
          </h3>
          <p className="mt-1 text-xs text-emerald-100 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> Rekapitutulasi Penjualan
          </p>
        </div>

        {/* Card Transaksi */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">
              Total Transaksi
            </span>
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="mt-4 text-2xl font-black">
            {stats.totalTransaksi}{" "}
            <span className="text-sm font-normal text-blue-200">Pesanan</span>
          </h3>
          <p className="mt-1 text-xs text-blue-100">
            Tercatat di seluruh cabang
          </p>
        </div>

        {/* Card Cabang */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 p-5 text-white shadow-lg shadow-purple-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-100 uppercase tracking-wider">
              Cabang Aktif
            </span>
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
              <Store className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="mt-4 text-2xl font-black">
            {stats.totalToko}{" "}
            <span className="text-sm font-normal text-purple-200">Outlet</span>
          </h3>
          <p className="mt-1 text-xs text-purple-100">
            Siap melayani pelanggan
          </p>
        </div>

        {/* Card Produk */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 p-5 text-white shadow-lg shadow-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-100 uppercase tracking-wider">
              Total Produk
            </span>
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
              <Package className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="mt-4 text-2xl font-black">
            {stats.totalProduk}{" "}
            <span className="text-sm font-normal text-rose-200">Menu</span>
          </h3>
          <p className="mt-1 text-xs text-rose-100">Aktif dalam katalog toko</p>
        </div>
      </div>

      {/* Menu Pintas Quick Action */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>Akses Cepat Admin</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/admin/reports"
            className="group flex flex-col items-center justify-center rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm hover:border-amber-500 hover:shadow-md transition-all text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6" />
            </div>
            <span className="mt-3 font-semibold text-slate-800 text-sm">
              Laporan Penjualan
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Lihat detail penjualan
            </span>
          </Link>

          <Link
            href="/admin/products"
            className="group flex flex-col items-center justify-center rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 group-hover:scale-110 transition-transform">
              <Package className="h-6 w-6" />
            </div>
            <span className="mt-3 font-semibold text-slate-800 text-sm">
              Kelola Produk
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              kelola produk, harga dan stok
            </span>
          </Link>

          <Link
            href="/admin/stores"
            className="group flex flex-col items-center justify-center rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm hover:border-purple-500 hover:shadow-md transition-all text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 group-hover:scale-110 transition-transform">
              <Store className="h-6 w-6" />
            </div>
            <span className="mt-3 font-semibold text-slate-800 text-sm">
              Kelola Cabang
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Manajemen cabang
            </span>
          </Link>

          <Link
            href="/admin/users"
            className="group flex flex-col items-center justify-center rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm hover:border-teal-500 hover:shadow-md transition-all text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
            <span className="mt-3 font-semibold text-slate-800 text-sm">
              Kelola Akun
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Akun & hak akses
            </span>
          </Link>
        </div>
      </div>

      {/* Layout 2 Kolom: Transaksi Terbaru & Info Sistem */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Daftar Transaksi Terbaru */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                Transaksi Terbaru
              </h3>
            </div>
            <Link
              href="/admin/reports"
              className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
            >
              Lihat Semua <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Memuat data...
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Belum ada transaksi.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">
                      <Clock className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">
                        {t.storeName || "Toko Kasir"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {t.dateObj.toLocaleString("id-ID", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}{" "}
                        • Kasir: {t.cashierName || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-extrabold text-slate-900 text-sm">
                      Rp {t.totalPrice?.toLocaleString("id-ID") || 0}
                    </p>
                    <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase">
                      {t.paymentMethod || "Tunai"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Status Sistem */}
        <div>
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
            <h3 className="font-bold text-lg mb-2">Sistem Kasir Online</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Server dan Sistem berjalan stabil. Semua transaksi dan data toko
              tersinkronisasi secara real-time. Pastikan koneksi internet lancar
              untuk pengalaman terbaik.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-800/40">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Status Server: Online & Stabil
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
