'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSignOutAlt } from 'react-icons/fa';

export default function ClientBackHandler() {
  const router = useRouter();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    // Memasang "jebakan" pada riwayat navigasi saat aplikasi dimuat
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // Mengecek posisi pengguna saat tombol back/kembali ditekan
      const currentPath = window.location.pathname;

      if (currentPath === '/') {
        // Jika sedang di Beranda (Home), tampilkan pop-up konfirmasi keluar
        setShowExitConfirm(true);
        
        // Pasang kembali "jebakan" agar aplikasi tidak langsung tertutup
        window.history.pushState(null, '', window.location.href);
      } else {
        // Jika sedang di halaman lain (Budget, Report, History), paksa pindah ke Home
        router.push('/');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  const handleExit = () => {
    setShowExitConfirm(false);
    
    // Perintah untuk menutup aplikasi (Sangat efektif jika aplikasi diinstal sebagai PWA di HP)
    if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
       window.close();
    } else {
       // Jika di browser biasa, kita kembalikan riwayatnya melewati "jebakan" tadi
       window.history.go(-2);
    }
  };

  if (!showExitConfirm) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-center items-center px-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)}></div>
      <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 animate-[slideUp_0.2s_ease-out]">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl mb-4 mx-auto">
          <FaSignOutAlt className="ml-1" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Tutup Aplikasi?</h3>
        <p className="text-sm text-slate-500 text-center mb-6">Apakah Anda yakin ingin keluar dari aplikasi Dompetku?</p>
        <div className="flex gap-3">
          <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
            Batal
          </button>
          <button onClick={handleExit} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors">
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  );
}