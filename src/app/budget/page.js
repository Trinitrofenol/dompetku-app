'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import TransactionModal from '../../components/TransactionModal';
import { 
  FaHome, FaChartPie, FaPlus, FaChartLine, FaReceipt, FaTimes, FaTrash,
  FaUtensils, FaCar, FaGraduationCap, FaFileInvoiceDollar, FaHeartbeat, 
  FaShoppingBag, FaFilm, FaBox, FaFilter,
  FaCoffee, FaGamepad, FaBus, FaTshirt, FaBook, FaDumbbell, FaWallet, FaMoneyBill, FaBuilding
} from "react-icons/fa";

export default function Budget() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);

  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState('makanan');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetToDelete, setBudgetToDelete] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

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

  const renderIcon = (iconName, className="") => {
    const icons = {
      FaBox: <FaBox className={className} />, FaCoffee: <FaCoffee className={className} />, FaGamepad: <FaGamepad className={className} />,
      FaHome: <FaHome className={className} />, FaBus: <FaBus className={className} />, FaTshirt: <FaTshirt className={className} />,
      FaHeartbeat: <FaHeartbeat className={className} />, FaBook: <FaBook className={className} />, FaDumbbell: <FaDumbbell className={className} />,
      FaWallet: <FaWallet className={className} />, FaMoneyBill: <FaMoneyBill className={className} />, FaBuilding: <FaBuilding className={className} />
    };
    return icons[iconName] || <FaBox className={className} />;
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.replace('/login');
      else { setUser(session.user); setIsCheckingAuth(false); }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (user) fetchBudgetData();
  }, [user, selectedMonth, selectedYear]);

  const fetchBudgetData = async () => {
    setIsLoading(true);
    
    // Ambil Wallets untuk Modal Transaksi
    const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id);
    let allWallets = [{ id: 'tunai', name: 'Uang Tunai' }, { id: 'rekening', name: 'Rekening Utama' }];
    if (walletData) allWallets = [...allWallets, ...walletData];
    setWallets(allWallets);

    // Ambil Kategori Kustom
    const { data: catData } = await supabase.from('categories').select('*').eq('user_id', user.id).eq('type', 'expense');
    if (catData) setCustomCategories(catData);

    // Ambil Anggaran (Budgets)
    const { data: budgetData } = await supabase.from('budgets').select('*').eq('user_id', user.id);
    if (budgetData) setBudgets(budgetData);

    // Ambil Transaksi Bulan Ini
    const startStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    const endDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const endStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    const { data: trxData } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'expense')
      .eq('user_id', user.id)
      .gte('date', startStr)
      .lte('date', endStr);
      
    if (trxData) setTransactions(trxData);
    
    setIsLoading(false);
  };

  const handleSaveBudget = async () => {
    if (!budgetAmount) return alert("Mohon isi nominal anggaran!");
    setIsLoading(true);
    
    const numericAmount = parseFloat(budgetAmount.replace(/\./g, ''));
    const existingBudget = budgets.find(b => b.category === selectedCategory);
    
    if (existingBudget) {
      await supabase.from('budgets').update({ amount: numericAmount }).eq('id', existingBudget.id);
    } else {
      await supabase.from('budgets').insert([{ category: selectedCategory, amount: numericAmount, user_id: user.id }]);
    }

    setIsBudgetModalOpen(false);
    setBudgetAmount('');
    fetchBudgetData();
  };

  const confirmDeleteBudget = async () => {
    if (!budgetToDelete) return;
    setIsLoading(true);
    await supabase.from('budgets').delete().eq('id', budgetToDelete.id);
    setBudgetToDelete(null);
    fetchBudgetData();
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  // Kalkulasi Total Keseluruhan
  let totalLimit = 0;
  let totalUsed = 0;
  budgets.forEach(b => {
    totalLimit += Number(b.amount);
    const spent = transactions.filter(t => t.category === b.category).reduce((sum, t) => sum + Number(t.amount), 0);
    totalUsed += spent;
  });

  if (isCheckingAuth) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center font-sans"><div className="w-12 h-12 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin"></div></main>;
  }

  return (
    <main className="min-h-[100dvh] bg-slate-50 flex justify-center text-slate-800 font-sans">
      <div className="w-full max-w-md bg-slate-50 h-[100dvh] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 pt-3 pb-4 bg-white z-10 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800">Anggaran</h1>
          <p className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase">Kontrol Pengeluaran</p>
        </div>

        {/* Filter Bulan */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex gap-2 z-10 shadow-sm">
          <div className="flex items-center justify-center bg-slate-50 w-10 rounded-xl text-slate-400 border border-slate-100"><FaFilter /></div>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="flex-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:border-cyan-400 appearance-none">
            {monthNames.map((month, index) => <option key={index} value={index}>{month}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-24 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:border-cyan-400 appearance-none">
            {[...Array(5)].map((_, i) => { const year = new Date().getFullYear() - i; return <option key={year} value={year}>{year}</option>; })}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
          <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-[2rem] p-6 text-white shadow-xl shadow-purple-500/30 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <p className="text-[10px] text-purple-50 font-bold tracking-wider mb-1 uppercase">SISA ANGGARAN TOTAL</p>
            <h2 className="text-3xl font-extrabold tracking-tight mb-6">{formatRupiah(totalLimit - totalUsed)}</h2>
            <div className="w-full bg-white/20 rounded-full h-2 mb-2">
               <div className={`h-2 rounded-full ${totalUsed > totalLimit ? 'bg-red-400' : 'bg-white'}`} style={{width: `${totalLimit > 0 ? Math.min((totalUsed/totalLimit)*100, 100) : 0}%`}}></div>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span>Terpakai: {formatRupiah(totalUsed)}</span>
              <span>Batas: {formatRupiah(totalLimit)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800">Daftar Anggaran</h3>
            <button onClick={() => setIsBudgetModalOpen(true)} className="text-xs font-bold text-cyan-600 bg-cyan-50 px-3 py-1.5 rounded-lg hover:bg-cyan-100 transition-colors">+ Atur Baru</button>
          </div>

          {isLoading ? (
            <p className="text-center text-slate-400 text-sm mt-10 animate-pulse">Memuat data...</p>
          ) : budgets.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <FaChartPie className="mx-auto text-4xl mb-3 opacity-20" />
              <p className="text-sm font-medium">Belum ada anggaran yang diatur.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map(budget => {
                const spent = transactions.filter(t => t.category === budget.category).reduce((sum, t) => sum + Number(t.amount), 0);
                const limit = Number(budget.amount);
                const percentage = limit > 0 ? (spent / limit) * 100 : 0;
                const isOver = spent > limit;

                let catInfo = categoryMap[budget.category];
                if (!catInfo) {
                  const customCat = customCategories.find(c => c.name === budget.category);
                  if (customCat) {
                    catInfo = { name: customCat.name, icon: renderIcon(customCat.icon), color: 'bg-cyan-500', barColor: 'bg-cyan-400' };
                  } else {
                    catInfo = { name: budget.category, icon: <FaBox />, color: 'bg-slate-500', barColor: 'bg-slate-400' };
                  }
                }

                return (
                  <div key={budget.id} className="relative bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                    <button onClick={() => setBudgetToDelete(budget)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><FaTrash className="text-[10px]" /></button>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${catInfo.color} shadow-sm`}>{catInfo.icon}</div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm capitalize">{catInfo.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400">{percentage.toFixed(0)}% Terpakai</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-end mb-1">
                      <p className={`text-xs font-bold ${isOver ? 'text-red-500' : 'text-slate-800'}`}>{formatRupiah(spent)}</p>
                      <p className="text-[10px] text-slate-400 font-bold">/ {formatRupiah(limit)}</p>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : catInfo.barColor}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                    </div>
                    {isOver && <p className="text-[10px] font-bold text-red-500 mt-2 text-center bg-red-50 py-1 rounded-md">⚠️ Anggaran Jebol!</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Anggaran Baru */}
        {isBudgetModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsBudgetModalOpen(false)}></div>
            <div className="w-full max-w-md relative flex flex-col justify-end pointer-events-none">
              <div className="bg-white w-full rounded-t-[2rem] p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] pointer-events-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Atur Anggaran</h3>
                  <button onClick={() => setIsBudgetModalOpen(false)} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><FaTimes /></button>
                </div>

                <div className="mb-5">
                  <p className="text-[10px] font-bold mb-2 text-slate-400">PILIH KATEGORI</p>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-white border border-slate-100 text-slate-800 text-sm font-bold rounded-xl px-3 py-3 shadow-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 capitalize">
                    <option value="makanan">🍔 Makanan & Minuman</option>
                    <option value="transportasi">🚗 Transportasi</option>
                    <option value="tagihan">🧾 Tagihan & Utilitas</option>
                    <option value="belanja">🛍️ Belanja</option>
                    
                    {/* MENAMPILKAN KATEGORI KUSTOM DI DROPDOWN ANGGARAN */}
                    {customCategories.map(c => (
                      <option key={c.id} value={c.name}>⭐ {c.name}</option>
                    ))}
                    
                    <option value="lainnya">📦 Lainnya</option>
                  </select>
                </div>

                <div className="mb-8">
                  <p className="text-[10px] font-bold mb-2 text-slate-400">BATAS MAKSIMAL (RP)</p>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={budgetAmount} 
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      const formatted = rawValue ? rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '';
                      setBudgetAmount(formatted);
                    }} 
                    placeholder="0" 
                    className="w-full text-3xl font-bold border-b-2 border-slate-100 pb-2 focus:outline-none focus:border-cyan-400 text-cyan-500 bg-transparent placeholder-slate-300"
                  />
                </div>

                <button onClick={handleSaveBudget} disabled={isLoading} className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform ${isLoading ? 'bg-slate-300 shadow-none' : 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/30'}`}>
                  {isLoading ? 'Menyimpan...' : 'Simpan Anggaran'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Hapus Anggaran */}
        {budgetToDelete && (
          <div className="fixed inset-0 z-[110] flex justify-center items-center px-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setBudgetToDelete(null)}></div>
            <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 animate-[slideUp_0.2s_ease-out]">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl mb-4 mx-auto"><FaTrash /></div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Hapus Anggaran?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">Anda yakin ingin menghapus batasan anggaran untuk kategori <span className="capitalize font-bold text-cyan-600">"{budgetToDelete.category}"</span>?</p>
              <div className="flex gap-3">
                <button onClick={() => setBudgetToDelete(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                <button onClick={confirmDeleteBudget} disabled={isLoading} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors">{isLoading ? 'Menghapus...' : 'Ya, Hapus'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex justify-between items-center px-6 py-2 pb-4 z-10 pointer-events-auto">
          <Link href="/" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><FaHome className="text-slate-400 text-xl" /><span className="text-[10px] font-bold text-slate-500">Home</span></Link>
          <div className="flex flex-col items-center gap-1 cursor-pointer"><FaChartPie className="text-cyan-500 text-xl" /><span className="text-[10px] font-bold text-cyan-500">Budget</span></div>
          <div className="relative -top-8"><button onClick={() => setIsTransactionModalOpen(true)} className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl shadow-xl shadow-cyan-500/30 border-4 border-slate-50 active:scale-95 transition-transform"><FaPlus /></button></div>
          <Link href="/report" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><FaChartLine className="text-slate-400 text-xl" /><span className="text-[10px] font-bold text-slate-500">Report</span></Link>
          <Link href="/history" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><FaReceipt className="text-slate-400 text-xl" /><span className="text-[10px] font-bold text-slate-500">History</span></Link>
        </div>

        <TransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSuccess={fetchBudgetData} wallets={wallets} userId={user?.id} />
      </div>
    </main>
  );
}