import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// INI ADALAH BAGIAN UNTUK MENGUBAH JUDUL DAN DESKRIPSI
export const metadata = {
  title: "Dompetku",
  description: "Aplikasi pencatatan keuangan pribadi yang pintar, rapi, dan mudah digunakan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}