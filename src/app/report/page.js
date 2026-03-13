'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; 
import TransactionModal from '../../components/TransactionModal';
import { 
  FaHome, FaChartPie, FaPlus, FaChartLine, FaReceipt,
  FaUtensils, FaCar, FaGraduationCap, FaFileInvoiceDollar, FaHeartbeat, 
  FaShoppingBag, FaFilm, FaBox, FaFilter
} from "react-icons/fa";

export default function Report() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);

  const [expenseData, setExpenseData] = useState([]);
  const [totalMonthExpense, setTotalMonthExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wallets, setWallets] = useState([]);

  // State untuk Filter Bulan dan Tahun
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const categoryMap = {
    'makanan': { name: 'Makanan & Minuman', icon: <FaUtensils />, color: 'bg-orange-500', barColor: 'bg-orange-400' },
    'transportasi': { name: 'Transportasi', icon: <FaCar />, color: 'bg-blue-500', barColor: 'bg-blue-400' },
    'pendidikan': { name: 'Pendidikan', icon: <FaGraduationCap />, color: 'bg-purple-500', barColor: 'bg-purple-400' },
    'tagihan': { name: 'Tagihan & Utilitas', icon: <FaFileInvoiceDollar />, color: 'bg-red-500', barColor: 'bg-red-400' },
    'kesehatan': { name: 'Kesehatan', icon: <FaHeartbeat />, color: 'bg-pink-500', barColor: 'bg-pink-400' },
    'belanja': { name: 'Belanja', icon: <FaShoppingBag />, color: 'bg-teal-500', barColor: 'bg-teal-400' },
    'hiburan': { name: 'Hiburan', icon: <FaFilm />, color: 'bg-indigo-500', barColor: 'bg-indigo-400' },
    'lainnya': { name: 'Lainnya', icon: <FaBox />, color: 'bg-slate-500', barColor: 'bg-slate-400' }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
      } else {
        setUser(session.user);
        setIsCheckingAuth(false);
      }
    };
    checkUser();
  }, [router]);

  // Panggil fetchReport setiap kali user, bulan, atau tahun berubah
  useEffect(() => {
    if (user) fetchReport();
  }, [user, selectedMonth, selectedYear]);

  const fetchReport = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id);
    const defaultWallets = [
      { id: 'tunai', name: 'Uang Tunai' },
      { id: 'rekening', name: 'Rekening Utama' }
    ];
    let allWallets = [...defaultWallets];
    if (walletData && walletData.length > 0) allWallets = [...defaultWallets, ...walletData];
    setWallets(allWallets);

    // Hitung tanggal awal dan akhir bulan yang dipilih
    const startStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    const endDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const endStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    // Hanya ambil transaksi pada bulan dan tahun yang difilter
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'expense')
      .eq('user_id', user.id)
      .gte('date', startStr)
      .lte('date', endStr);

    if (error) {
      console.error("Gagal mengambil data laporan:", error);
      setIsLoading(false);
      return;
    }

    let total = 0;
    const categoryTotals = {};

    if (data) {
      data.forEach(trx => {
        const nom = Number(trx.amount);
        total += nom;
        if (!categoryTotals[trx.category]) categoryTotals[trx.category] = 0;
        categoryTotals[trx.category] += nom;
      });
    }

    const sortedData = Object.keys(categoryTotals).map(key => {
      return {
        id: key,
        category: key,
        amount: categoryTotals[key],
        percentage: total > 0 ? (categoryTotals[key] / total) * 100 : 0
      };
    }).sort((a, b) => b.amount - a.amount); 

    setTotalMonthExpense(total);
    setExpenseData(sortedData);
    setIsLoading(false);
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-slate-50 flex justify-center text-slate-800 font-sans">
      <div className="w-full max-w-md bg-slate-50 h-[100dvh] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 pt-3 pb-4 bg-white z-10 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800">Laporan</h1>
          <p className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase">Analisis Pengeluaran</p>
        </div>

        {/* Filter (Senada dengan halaman History) */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex gap-2 z-10 shadow-sm">
          <div className="flex items-center justify-center bg-slate-50 w-10 rounded-xl text-slate-400 border border-slate-100">
            <FaFilter />
          </div>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="flex-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 appearance-none"
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-24 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 appearance-none"
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-[2rem] p-6 text-white shadow-xl shadow-cyan-500/30 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <p className="text-[10px] text-cyan-50 font-bold tracking-wider mb-1 uppercase">TOTAL PENGELUARAN • {monthNames[selectedMonth]} {selectedYear}</p>
            <h2 className="text-3xl font-extrabold tracking-tight">{formatRupiah(totalMonthExpense)}</h2>
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">Rincian Kategori</h3>

          {isLoading ? (
            <p className="text-center text-slate-400 text-sm mt-10 animate-pulse">Menganalisis data...</p>
          ) : expenseData.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <FaChartLine className="mx-auto text-4xl mb-3 opacity-20" />
              <p className="text-sm font-medium">Belum ada pengeluaran pada bulan ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenseData.map((item) => {
                const catInfo = categoryMap[item.category] || { name: item.category, icon: <FaBox />, color: 'bg-slate-500', barColor: 'bg-slate-400' };
                return (
                  <div key={item.id} className="bg-white p-4 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 transition-transform hover:scale-[1.01]">
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${catInfo.color} shadow-md`}>{catInfo.icon}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-end mb-1">
                          <h4 className="font-bold text-slate-800 text-sm capitalize">{catInfo.name}</h4>
                          <span className="text-xs font-bold text-cyan-600">{item.percentage.toFixed(1)}%</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">{formatRupiah(item.amount)}</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${catInfo.barColor}`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex justify-between items-center px-6 py-2 pb-4 z-10 pointer-events-auto">
          <Link href="/" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><FaHome className="text-slate-400 text-xl" /><span className="text-[10px] font-bold text-slate-500">Home</span></Link>
          <Link href="/budget" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><FaChartPie className="text-slate-400 text-xl" /><span className="text-[10px] font-bold text-slate-500">Budget</span></Link>
          <div className="relative -top-8"><button onClick={() => setIsModalOpen(true)} className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl shadow-xl shadow-cyan-500/30 border-4 border-slate-50 active:scale-95 transition-transform"><FaPlus /></button></div>
          <div className="flex flex-col items-center gap-1 cursor-pointer"><FaChartLine className="text-cyan-500 text-xl" /><span className="text-[10px] font-bold text-cyan-500">Report</span></div>
          <Link href="/history" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><FaReceipt className="text-slate-400 text-xl" /><span className="text-[10px] font-bold text-slate-500">History</span></Link>
        </div>

        <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchReport} wallets={wallets} userId={user?.id} />
      </div>
    </main>
  );
}