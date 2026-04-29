import { Lato } from "next/font/google";
import "./globals.css";

// Font Lato memerlukan spesifikasi 'weight' (ketebalan font)
const lato = Lato({ 
  subsets: ["latin"],
  weight: ['400', '700', '900'] // Memuat ketebalan reguler (400), bold (700), dan black (900)
});

// INI ADALAH BAGIAN UNTUK MENGUBAH JUDUL DAN DESKRIPSI
export const metadata = {
  title: "Dompetku",
  description: "Aplikasi pencatatan keuangan pribadi yang pintar, rapi, dan mudah digunakan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={lato.className}>{children}</body>
    </html>
  );
}