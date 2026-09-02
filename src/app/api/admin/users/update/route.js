import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export const runtime = "nodejs";

function initFirebaseAdmin() {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Kredensial Firebase Admin di .env.local belum lengkap.");
  }

  privateKey = privateKey.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export async function POST(req) {
  try {
    const app = initFirebaseAdmin();

    const { uid, email, password } = await req.json();

    if (!uid) {
      return NextResponse.json(
        { error: "UID user wajib diisi." },
        { status: 400 },
      );
    }

    const updatePayload = {};
    if (email) updatePayload.email = email;
    if (password && typeof password === "string" && password.trim() !== "") {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password minimal 6 karakter." },
          { status: 400 },
        );
      }
      updatePayload.password = password;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tidak ada data autentikasi yang diperbarui.",
      });
    }

    // Gunakan getAuth(app) dengan mengumpankan instance app
    await getAuth(app).updateUser(uid, updatePayload);

    return NextResponse.json({
      success: true,
      message: "Data autentikasi user berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Firebase Admin Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui autentikasi user." },
      { status: 500 },
    );
  }
}
