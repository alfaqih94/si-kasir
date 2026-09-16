"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
  query,
  where,
  runTransaction,
} from "firebase/firestore";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

export default function KasirPage() {
  // Ambil `user` (Firebase Auth) dan `userProfile` (Firestore Doc)
  const { user, userProfile } = useAuth();
  const [products, setProducts] = useState([]);
  const [storeName, setStoreName] = useState("");
  const [storeStockMap, setStoreStockMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Cart State
  const [cart, setCart] = useState([]);

  // Modal Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(null);

  // Fetch Produk, Stock Cabang, & Nama Toko Kasir
  const fetchPosData = async () => {
    try {
      setLoading(true);

      // 1. Ambil Produk Aktif
      const qProducts = query(
        collection(db, "products"),
        where("isAvailable", "==", true),
      );
      const productsSnap = await getDocs(qProducts);
      const productList = productsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setProducts(productList);

      // 2. Ambil Info Cabang dan Stok Produk spesifik Cabang ini
      if (userProfile?.storeId) {
        const storeSnap = await getDoc(doc(db, "stores", userProfile.storeId));
        if (storeSnap.exists()) {
          setStoreName(storeSnap.data().name);
        }

        const stockSnap = await getDocs(
          collection(db, "stores", userProfile.storeId, "stocks"),
        );
        const stockMap = {};
        stockSnap.docs.forEach((d) => {
          stockMap[d.id] = d.data().qty ?? 0;
        });
        setStoreStockMap(stockMap);
      } else if (userProfile?.role === "admin") {
        setStoreName("Akses Admin (Semua Cabang)");
      }
    } catch (err) {
      console.error("Gagal memuat data kasir:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile || user) {
      fetchPosData();
    }
  }, [userProfile, user]);

  // Handle Cart dengan Validasi Stok
  const addToCart = (product) => {
    const currentCartQty =
      cart.find((item) => item.id === product.id)?.qty || 0;

    // Jika produk melacak stok dan kasir terikat cabang
    if (product.trackStock && userProfile?.storeId) {
      const availableStock = storeStockMap[product.id] ?? 0;
      if (currentCartQty + 1 > availableStock) {
        alert(
          `Stok produk "${product.name}" di cabang ini tidak mencukupi! (Sisa stok: ${availableStock})`,
        );
        return;
      }
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    const targetItem = cart.find((item) => item.id === id);
    if (!targetItem) return;

    if (delta > 0 && targetItem.trackStock && userProfile?.storeId) {
      const availableStock = storeStockMap[id] ?? 0;
      if (targetItem.qty + 1 > availableStock) {
        alert(
          `Stok produk "${targetItem.name}" tidak mencukupi! (Sisa stok: ${availableStock})`,
        );
        return;
      }
    }

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Kalkulasi
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const changeAmount = Number(paidAmount) - totalPrice;

  // Simpan Transaksi & Potong Stok Otomatis
  const handleProcessTransaction = async (e) => {
    e.preventDefault();
    if (paymentMethod === "cash" && Number(paidAmount) < totalPrice) {
      alert("Uang pembayaran kurang!");
      return;
    }

    // Mendapatkan ID Kasir dari user auth atau userProfile
    const activeCashierId =
      user?.uid || userProfile?.uid || userProfile?.id || "";

    if (!activeCashierId) {
      alert("Gagal memproses: ID Kasir tidak ditemukan. Silakan login ulang.");
      return;
    }

    setSubmitting(true);
    try {
      let createdTransactionId = "";

      await runTransaction(db, async (transaction) => {
        // 1. Cek & siapkan pemotongan stok jika cabang terdaftar
        const stockUpdates = [];

        if (userProfile?.storeId) {
          for (const item of cart) {
            if (item.trackStock) {
              const stockRef = doc(
                db,
                "stores",
                userProfile.storeId,
                "stocks",
                item.id,
              );
              const stockDoc = await transaction.get(stockRef);

              if (!stockDoc.exists()) {
                throw new Error(
                  `Stok untuk produk "${item.name}" belum diatur di cabang ini.`,
                );
              }

              const currentQty = stockDoc.data().qty ?? 0;
              if (currentQty < item.qty) {
                throw new Error(
                  `Stok produk "${item.name}" tidak mencukupi. (Sisa stok: ${currentQty})`,
                );
              }

              stockUpdates.push({
                ref: stockRef,
                newQty: currentQty - item.qty,
              });
            }
          }
        }

        // 2. Terapkan pengurangan stok
        stockUpdates.forEach((update) => {
          transaction.update(update.ref, {
            qty: update.newQty,
            updatedAt: serverTimestamp(),
          });
        });

        // 3. Buat dokumen transaksi
        const newTransRef = doc(collection(db, "transactions"));
        createdTransactionId = newTransRef.id;

        const transactionData = {
          storeId: userProfile?.storeId || "ADMIN_DIRECT",
          storeName: storeName || "Kedai Kopi",
          cashierId: activeCashierId,
          cashierName: userProfile?.name || user?.displayName || "Kasir",
          items: cart.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            subtotal: item.price * item.qty,
          })),
          totalPrice,
          paymentMethod,
          paidAmount:
            paymentMethod === "cash" ? Number(paidAmount) : totalPrice,
          changeAmount:
            paymentMethod === "cash" ? Math.max(0, changeAmount) : 0,
          createdAt: serverTimestamp(),
        };

        transaction.set(newTransRef, transactionData);
      });

      // Tampilkan Modal Sukses Struk
      setTransactionSuccess({
        id: createdTransactionId,
        storeName: storeName || "Kedai Kopi",
        cashierName: userProfile?.name || user?.displayName || "Kasir",
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          subtotal: item.price * item.qty,
        })),
        totalPrice,
        paymentMethod,
        paidAmount: paymentMethod === "cash" ? Number(paidAmount) : totalPrice,
        changeAmount: paymentMethod === "cash" ? Math.max(0, changeAmount) : 0,
      });

      setCart([]);
      setIsCheckoutOpen(false);
      setPaidAmount("");
      fetchPosData(); // Refresh stok lokal setelah transaksi sukses
    } catch (err) {
      console.error("Gagal memproses transaksi:", err);
      alert(err.message || "Terjadi kesalahan saat menyimpan transaksi.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-1 h-full w-full overflow-hidden">
      {/* Left Panel: Catalog Produk */}
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari menu kopi atau makanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:outline-none focus:ring-2"
            style={{ color: "#003c00" }}
          />
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-slate-500">
            Memuat catalog produk...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-slate-500">
            Tidak ada produk ditemukan.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p) => {
              const currentStock = storeStockMap[p.id];
              const isOutOfStock =
                p.trackStock &&
                userProfile?.storeId &&
                (currentStock === undefined || currentStock <= 0);

              return (
                <button
                  key={p.id}
                  disabled={isOutOfStock}
                  onClick={() => addToCart(p)}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white p-3 text-left shadow-sm transition hover:shadow-md border border-slate-200 ${
                    isOutOfStock ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="mb-3 aspect-square w-full overflow-hidden rounded-xl bg-slate-100 relative">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ShoppingBag className="h-10 w-10" />
                      </div>
                    )}

                    {/* Stock Badge */}
                    {p.trackStock && userProfile?.storeId && (
                      <div className="absolute top-2 right-2 rounded-lg bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white">
                        Stok: {currentStock ?? 0}
                      </div>
                    )}
                  </div>

                  <h3 className="line-clamp-1 font-bold text-slate-800">
                    {p.name}
                  </h3>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-bold" style={{ color: "#00750a" }}>
                      Rp {p.price?.toLocaleString("id-ID")}
                    </p>
                    {isOutOfStock && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        Habis
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Panel: Keranjang & Detail Pesanan */}
      <div className="flex w-96 flex-col border-l border-slate-200 bg-white shrink-0">
        <div className="border-b border-slate-100 p-4">
          <h2 className="flex items-center gap-2 font-bold text-slate-800">
            <ShoppingBag className="h-5 w-5" style={{ color: "#00750a" }} />{" "}
            Pesanan Baru
          </h2>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <ShoppingBag className="mb-2 h-12 w-12 opacity-30" />
              <p className="text-sm">Keranjang masih kosong</p>
              <p className="text-xs text-slate-400">
                Pilih menu di sebelah kiri
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
              >
                <div className="flex-1 pr-2">
                  <h4 className="font-semibold text-slate-800 text-sm">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Rp {item.price?.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* Qty Controller */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-slate-800">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white transition hover:opacity-90"
                    style={{ background: "#00750a" }}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-1 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total & Action Button */}
        <div className="border-t border-slate-100 p-4 bg-slate-50">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total Pembayaran</span>
            <span className="text-xl font-extrabold text-slate-900">
              Rp {totalPrice.toLocaleString("id-ID")}
            </span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition disabled:opacity-40"
            style={{
              background:
                cart.length > 0
                  ? "linear-gradient(90deg, #00750a 0%, #3eae4c 100%)"
                  : "#cbd5e1",
            }}
          >
            <CreditCard className="h-4 w-4" /> Bayar Pesanan
          </button>
        </div>
      </div>

      {/* Modal Checkout Pembayaran */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              Konfirmasi Pembayaran
            </h2>

            <form onSubmit={handleProcessTransaction} className="space-y-4">
              <div
                className="rounded-xl p-4"
                style={{ background: "#e2f7e2", color: "#003c00" }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{ color: "#00750a" }}
                >
                  Total Tagihan
                </p>
                <p className="text-2xl font-extrabold">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:outline-none"
                >
                  <option value="cash">Tunai (Cash)</option>
                  <option value="qris">QRIS / Transfer</option>
                </select>
              </div>

              {paymentMethod === "cash" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={totalPrice}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:outline-none"
                    placeholder="Masukkan nominal uang"
                  />

                  {paidAmount && Number(paidAmount) >= totalPrice && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-100 p-3 text-sm">
                      <span className="text-slate-600">Kembalian:</span>
                      <span className="font-bold" style={{ color: "#00750a" }}>
                        Rp {changeAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
                  style={{ background: "#00750a" }}
                >
                  {submitting ? "Memproses..." : "Selesaikan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Struk / Sukses Transaksi */}
      {transactionSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "#e2f7e2", color: "#00750a" }}
            >
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              Transaksi Berhasil!
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ID: {transactionSuccess.id}
            </p>

            {/* Area Struk Thermal */}
            <div
              id="printable-receipt"
              className="mb-6 rounded-xl bg-white p-4 text-left font-mono text-xs text-slate-900 border border-slate-300 shadow-inner space-y-2"
            >
              <div className="text-center font-bold text-sm text-slate-900 uppercase">
                {transactionSuccess.storeName}
              </div>
              <div className="text-center text-xs text-slate-600 border-b border-dashed border-slate-400 pb-2">
                {new Date().toLocaleString("id-ID")}
              </div>

              <div className="border-b border-dashed border-slate-400 pb-2 space-y-0.5 text-slate-900 font-medium">
                <p>Kasir : {transactionSuccess.cashierName}</p>
                <p>Bayar : {transactionSuccess.paymentMethod.toUpperCase()}</p>
              </div>

              <div className="py-1 space-y-1 text-slate-900 font-medium">
                {transactionSuccess.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {item.qty}x {item.name}
                    </span>
                    <span>Rp {item.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-400 pt-2 space-y-1">
                <div className="flex justify-between font-bold text-sm text-slate-900">
                  <span>TOTAL</span>
                  <span>
                    Rp {transactionSuccess.totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                {transactionSuccess.paymentMethod === "cash" && (
                  <>
                    <div className="flex justify-between text-slate-800 font-medium">
                      <span>Tunai</span>
                      <span>
                        Rp{" "}
                        {transactionSuccess.paidAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-800 font-medium">
                      <span>Kembali</span>
                      <span>
                        Rp{" "}
                        {transactionSuccess.changeAmount.toLocaleString(
                          "id-ID",
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center text-xs pt-3 text-slate-600 border-t border-slate-300 mt-2 font-medium">
                Terima Kasih Atas Kunjungan Anda!
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "#00750a" }}
              >
                Cetak Struk
              </button>
              <button
                onClick={() => setTransactionSuccess(null)}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "#003c00" }}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
