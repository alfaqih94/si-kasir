import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata = {
  title: "POS Kedai Kopi",
  description: "Aplikasi Kasir Kedai Kopi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
