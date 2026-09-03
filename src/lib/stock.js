import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Mengambil jumlah stok produk tertentu di cabang spesifik
 */
export async function getBranchStock(storeId, productId) {
  try {
    const stockRef = doc(db, "stores", storeId, "stocks", productId);
    const stockSnap = await getDoc(stockRef);

    if (stockSnap.exists()) {
      return stockSnap.data().qty ?? 0;
    }
    return 0;
  } catch (error) {
    console.error("Gagal mengambil stok produk:", error);
    throw error;
  }
}

/**
 * Memperbarui atau mengatur ulang stok produk di cabang tertentu
 */
export async function setBranchStock(storeId, productId, newQty) {
  try {
    const stockRef = doc(db, "stores", storeId, "stocks", productId);
    await setDoc(
      stockRef,
      {
        qty: Number(newQty),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Gagal mengubah stok produk:", error);
    throw error;
  }
}

/**
 * Menambah atau mengurangi stok produk di cabang secara atomik
 */
export async function adjustBranchStock(storeId, productId, deltaQty) {
  try {
    const stockRef = doc(db, "stores", storeId, "stocks", productId);
    await updateDoc(stockRef, {
      qty: increment(Number(deltaQty)),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Gagal menyesuaikan stok produk:", error);
    throw error;
  }
}
