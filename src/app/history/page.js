'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'; 
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; 
import TransactionModal from '../../components/TransactionModal';
import { 
  FaHome, FaChartPie, FaPlus, FaChartLine, FaReceipt, 
  FaArrowUp, FaArrowDown, FaExchangeAlt, FaFilter, FaTrash 
} from "react-icons/fa";

export default function History() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wallets, setWallets] = useState([]);

  // State untuk Hapus Transaksi
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  useEffect(() => {
    if (user) fetchHistory();
  }, [selectedMonth, selectedYear, user]);

  const fetchHistory = async () => {
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

    const startStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    const endDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const endStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startStr) 
      .lte('date', endStr)   
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) console.error("Gagal mengambil riwayat:", error);
    else setTransactions(data);
    
    setIsLoading(false);
  };

  // FUNGSI HAPUS TRANSAKSI
  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    // PROTEKSI: Jangan biarkan user menghapus transaksi hutang/piutang dari History
    const kategoriProteksi = ['Hutang', 'Piutang', 'Bayar Hutang', 'Terima Piutang'];
    if (kategoriProteksi.includes(transactionToDelete.category)) {
       alert("PENTING: Transaksi Hutang/Piutang tidak bisa dihapus dari tab History. Silakan hapus catatan tersebut melalui menu 'Hutang/Piutang' di Beranda agar sisa tagihan Anda tetap sinkron.");
       setTransactionToDelete(null);
       return;
    }

    setIsLoading(true);

    const { error } = await supabase.from('transactions').delete().eq('id', transactionToDelete.id);
    
    setIsLoading(false);
    if (error) {
      alert("Gagal menghapus transaksi: " + error.message);
    } else {
      setTransactionToDelete(null);
      fetchHistory(); // Refresh data setelah dihapus
    }
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const getWalletName = (walletId) => {
    const found = wallets.find(w => w.id === walletId);
    return found ? found.name : walletId;
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

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
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h1>
          <p className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase">Semua Catatan Keuangan</p>
        </div>

        {/* Filter */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex gap-2 z-10 shadow-sm">
          <div className="flex items-center justify-center bg-slate-50 w-10 rounded-xl text-slate-400 border border-slate-100"><FaFilter /></div>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="flex-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 appearance-none">
            {monthNames.map((month, index) => <option key={index} value={index}>{month}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-24 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 appearance-none">
            {[...Array(5)].map((_, i) => { const year = new Date().getFullYear() - i; return <option key={year} value={year}>{year}</option>; })}
          </select>
        </div>

        {/* Daftar Transaksi */}
        <div className="flex-1 overflow-y-auto px-6 py-4 pb-24">
          {isLoading ? (
            <p className="text-center text-slate-400 text-sm mt-10 animate-pulse">Memuat data...</p>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <FaReceipt className="mx-auto text-4xl mb-3 opacity-20" />
              <p className="text-sm font-medium">Belum ada transaksi di bulan ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((trx) => (
                <div key={trx.id} className="relative bg-white p-4 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex items-center justify-between transition-transform hover:scale-[1.01] group">
                  
                  {/* TOMBOL HAPUS (Muncul saat di-hover/tap) */}
                  <button 
                    onClick={() => setTransactionToDelete(trx)}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaTrash className="text-xs" />
                  </button>

                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md ${
                      trx.type === 'expense' ? 'bg-orange-50 text-orange-500' :
                      (trx.type === 'income' || trx.type === 'debt_in' || trx.type === 'debt_payment_in') ? 'bg-emerald-50 text-emerald-500' :
                      'bg-cyan-50 text-cyan-500'
                    }`}>
                      {(trx.type === 'expense' || trx.type === 'debt_out' || trx.type === 'debt_payment_out') && <FaArrowDown />}
                      {(trx.type === 'income' || trx.type === 'debt_in' || trx.type === 'debt_payment_in') && <FaArrowUp />}
                      {trx.type === 'transfer' && <FaExchangeAlt />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm capitalize">{trx.category.replace('_', ' ')}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{formatDate(trx.date)} • <span className="text-cyan-600">{getWalletName(trx.wallet_from)}</span>{trx.type === 'transfer' && ` → ${getWalletName(trx.wallet_to)}`}</p>
                      {trx.note && <p className="text-xs text-slate-500 mt-1 italic line-clamp-1">"{trx.note}"</p>}
                    </div>
                  </div>
                  <div className="text-right pr-2">
                    <p className={`font-bold text-sm ${(trx.type === 'expense' || trx.type === 'debt_out' || trx.type === 'debt_payment_out') ? 'text-orange-500' : (trx.type === 'income' || trx.type === 'debt_in' || trx.type === 'debt_payment_in') ? 'text-emerald-500' : 'text-slate-800'}`}>
                      {(trx.type === 'expense' || trx.type === 'debt_out' || trx.type === 'debt_payment_out') ? '-' : (trx.type === 'income' || trx.type === 'debt_in' || trx.type === 'debt_payment_in') ? '+' : ''}{formatRupiah(trx.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex justify-between items-center px-6 py-2 pb-4 z-20 pointer-events-auto">
          <Link href="/" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><FaHome className="text-slate-400 text-xl" /><span className="text-[10px] font-bold text-slate-500">Home</span></Link>
          <Link href="/budget" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><FaChartPie className="text-slate-400 text-xl" /><span className="text-[10px] font-bold text-slate-500">Budget</span></Link>
          <div className="relative -top-8"><button onClick={() => setIsModalOpen(true)} className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl shadow-xl shadow-cyan-500/30 border-4 border-slate-50 active:scale-95 transition-transform"><FaPlus /></button></div>
          <Link href="/report" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><FaChartLine className="text-slate-400 text-xl" /><span className="text-[10px] font-bold text-slate-500">Report</span></Link>
          <div className="flex flex-col items-center gap-1 cursor-pointer"><FaReceipt className="text-cyan-500 text-xl" /><span className="text-[10px] font-bold text-cyan-500">History</span></div>
        </div>

        <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchHistory} wallets={wallets} userId={user?.id} />

        {/* MODAL KONFIRMASI HAPUS TRANSAKSI */}
        {transactionToDelete && (
          <div className="fixed inset-0 z-[100] flex justify-center items-center px-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setTransactionToDelete(null)}></div>
            <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 animate-[slideUp_0.2s_ease-out]">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl mb-4 mx-auto"><FaTrash /></div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Hapus Transaksi?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Transaksi ini akan dihapus secara permanen dan saldo dompet Anda akan disesuaikan kembali.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setTransactionToDelete(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                <button onClick={confirmDeleteTransaction} disabled={isLoading} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors">
                  {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}