'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; 
import TransactionModal from '../../components/TransactionModal';
import { 
  FaHome, FaChartPie, FaPlus, FaChartLine, FaReceipt, FaTimes,
  FaUtensils, FaCar, FaGraduationCap, FaFileInvoiceDollar, FaHeartbeat, 
  FaShoppingBag, FaFilm, FaBox
} from "react-icons/fa";

export default function Budget() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);

  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [wallets, setWallets] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState('makanan');
  const [budgetAmount, setBudgetAmount] = useState('');

  // 1. Cek Sesi Login (Route Protection)
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

  // 2. Ambil data HANYA jika user sudah valid
  useEffect(() => {
    if (user) fetchBudgetData();
  }, [user]);

  const fetchBudgetData = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id);
    const defaultWallets = [
      { id: 'tunai', name: 'Uang Tunai', color_theme: 'from-emerald-400 to-teal-500' },
      { id: 'rekening', name: 'Rekening Utama', color_theme: 'from-cyan-400 to-blue-500' }
    ];
    let allWallets = [...defaultWallets];
    if (walletData && walletData.length > 0) allWallets = [...defaultWallets, ...walletData];
    setWallets(allWallets);

    // Ambil target anggaran khusus user ini
    const { data: budgetData } = await supabase.from('budgets').select('*').eq('user_id', user.id);
    
    // Ambil transaksi pengeluaran khusus user ini
    const { data: trxData } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'expense')
      .eq('user_id', user.id);

    const expenseTotals = {};
    if (trxData) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      trxData.forEach(trx => {
        const trxDate = new Date(trx.date);
        if (trxDate.getMonth() === currentMonth && trxDate.getFullYear() === currentYear) {
          const cat = trx.category;
          if (!expenseTotals[cat]) expenseTotals[cat] = 0;
          expenseTotals[cat] += Number(trx.amount);
        }
      });
    }

    if (budgetData) setBudgets(budgetData);
    setExpenses(expenseTotals);
    setIsLoading(false);
  };

  const handleSaveBudget = async () => {
    if (!budgetAmount) return alert("Mohon isi nominal anggaran!");
    setIsLoading(true);
    
    const existingBudget = budgets.find(b => b.category === selectedCategory);
    if (existingBudget) {
      await supabase.from('budgets').update({ amount: parseFloat(budgetAmount) }).eq('id', existingBudget.id);
    } else {
      // Sisipkan user_id saat membuat anggaran baru
      await supabase.from('budgets').insert([{ 
        category: selectedCategory, 
        amount: parseFloat(budgetAmount),
        user_id: user.id
      }]);
    }

    setIsBudgetModalOpen(false);
    setBudgetAmount('');
    fetchBudgetData(); 
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  const categoryMap = {
    'makanan': { name: 'Makanan & Minuman', icon: <FaUtensils />, color: 'bg-orange-500' },
    'transportasi': { name: 'Transportasi', icon: <FaCar />, color: 'bg-blue-500' },
    'pendidikan': { name: 'Pendidikan', icon: <FaGraduationCap />, color: 'bg-purple-500' },
    'tagihan': { name: 'Tagihan & Utilitas', icon: <FaFileInvoiceDollar />, color: 'bg-red-500' },
    'kesehatan': { name: 'Kesehatan', icon: <FaHeartbeat />, color: 'bg-pink-500' },
    'belanja': { name: 'Belanja', icon: <FaShoppingBag />, color: 'bg-teal-500' },
    'hiburan': { name: 'Hiburan', icon: <FaFilm />, color: 'bg-indigo-500' },
    'lainnya': { name: 'Lainnya', icon: <FaBox />, color: 'bg-slate-500' }
  };

  const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-slate-50 flex justify-center text-slate-800 font-sans">
      <div className="w-full max-w-md bg-slate-50 h-[100dvh] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 pt-10 pb-6 bg-white shadow-sm z-10 flex justify-between items-center border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Anggaran</h1>
            <p className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase">{currentMonthName}</p>
          </div>
          <button onClick={() => setIsBudgetModalOpen(true)} className="bg-cyan-500 shadow-lg text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-cyan-600 transition-colors">
            + Atur Anggaran
          </button>
        </div>

        {/* Daftar Progress Bar */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
          {isLoading ? (
            <p className="text-center text-slate-400 text-sm mt-10 animate-pulse">Memuat anggaran...</p>
          ) : budgets.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <FaChartPie className="mx-auto text-4xl mb-3 opacity-20" />
              <p className="text-sm font-medium">Anda belum mengatur batas anggaran bulan ini.</p>
              <p className="text-xs mt-1 opacity-70">Klik "Atur Anggaran" di kanan atas.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {budgets.map((budget) => {
                const limit = Number(budget.amount);
                const spent = expenses[budget.category] || 0;
                let percentage = (spent / limit) * 100;
                if (percentage > 100) percentage = 100;

                let barColor = categoryMap[budget.category]?.color || 'bg-slate-500';
                if (percentage >= 90) barColor = 'bg-red-500';
                else if (percentage >= 75) barColor = 'bg-orange-400';

                return (
                  <div key={budget.id} className="bg-white p-5 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 transition-transform hover:scale-[1.01]">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${categoryMap[budget.category]?.color || 'bg-slate-500'} shadow-md`}>
                          {categoryMap[budget.category]?.icon || <FaBox />}
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">{categoryMap[budget.category]?.name || budget.category}</h3>
                      </div>
                      <p className={`text-[10px] font-bold ${percentage >= 90 ? 'text-red-500' : 'text-slate-400'}`}>{percentage.toFixed(0)}% TERPAKAI</p>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden relative">
                      <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${percentage}%` }}></div>
                    </div>

                    <div className="flex justify-between items-end mt-1">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold">TERPAKAI</p>
                        <p className={`text-sm font-bold ${percentage >= 90 ? 'text-red-500' : 'text-slate-800'}`}>{formatRupiah(spent)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold">BATAS MAKSIMAL</p>
                        <p className="text-sm font-bold text-slate-500">{formatRupiah(limit)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Setel Anggaran */}
        {isBudgetModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsBudgetModalOpen(false)}></div>
            <div className="w-full max-w-md relative flex flex-col justify-end pointer-events-none">
              <div className="bg-white w-full rounded-t-[2rem] p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] pointer-events-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Atur Anggaran</h3>
                  <button onClick={() => setIsBudgetModalOpen(false)} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><FaTimes /></button>
                </div>

                <div className="mb-5">
                  <p className="text-[10px] font-bold mb-2 text-slate-400">PILIH KATEGORI</p>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-white border border-slate-100 text-slate-800 text-sm font-bold rounded-xl px-3 py-3 shadow-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20">
                    <option value="makanan">🍔 Makanan & Minuman</option>
                    <option value="transportasi">🚗 Transportasi</option>
                    <option value="pendidikan">📚 Pendidikan</option>
                    <option value="tagihan">🧾 Tagihan & Utilitas</option>
                    <option value="kesehatan">🏥 Kesehatan & Medis</option>
                    <option value="belanja">🛍️ Belanja & Pakaian</option>
                    <option value="hiburan">🎬 Hiburan & Hobi</option>
                    <option value="lainnya">📦 Lainnya</option>
                  </select>
                </div>

                <div className="mb-8">
                  <p className="text-[10px] font-bold mb-2 text-slate-400">BATAS MAKSIMAL (RP)</p>
                  <input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} placeholder="0" className="w-full text-3xl font-bold border-b-2 border-slate-100 pb-2 focus:outline-none focus:border-cyan-400 text-cyan-500 bg-transparent placeholder-slate-300"/>
                </div>

                <button onClick={handleSaveBudget} disabled={isLoading} className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform ${isLoading ? 'bg-slate-300 shadow-none' : 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/30'}`}>
                  {isLoading ? 'Menyimpan...' : 'Simpan Anggaran'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex justify-between items-center px-6 py-4 pb-8 z-10 pointer-events-auto">
          <Link href="/" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
            <FaHome className="text-slate-400 text-xl" />
            <span className="text-[10px] font-bold text-slate-500">Home</span>
          </Link>
          <div className="flex flex-col items-center gap-1 cursor-pointer">
            <FaChartPie className="text-cyan-500 text-xl" />
            <span className="text-[10px] font-bold text-cyan-500">Budget</span>
          </div>
          <div className="relative -top-8">
            <button onClick={() => setIsTransactionModalOpen(true)} className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl shadow-xl shadow-cyan-500/30 border-4 border-slate-50 active:scale-95 transition-transform">
              <FaPlus />
            </button>
          </div>
          <Link href="/report" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
            <FaChartLine className="text-slate-400 text-xl" />
            <span className="text-[10px] font-bold text-slate-500">Report</span>
          </Link>
          <Link href="/history" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
            <FaReceipt className="text-slate-400 text-xl" />
            <span className="text-[10px] font-bold text-slate-500">History</span>
          </Link>
        </div>

        <TransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSuccess={fetchBudgetData} wallets={wallets} userId={user?.id}/>
      </div>
    </main>
  );
}