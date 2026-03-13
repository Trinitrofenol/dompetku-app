'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase'; 
import TransactionModal from '../components/TransactionModal'; 
import { 
  FaWallet, FaArrowDown, FaArrowUp, FaHome, FaChartPie, 
  FaPlus, FaChartLine, FaReceipt, FaTimes, FaExchangeAlt, FaUser, 
  FaChevronLeft, FaCheckCircle, FaExclamationCircle, FaBox, FaSignOutAlt, FaTrash, FaCog
} from "react-icons/fa";

export default function Home() {
  const router = useRouter();
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewWalletModalOpen, setIsNewWalletModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0); 
  const [totalPayable, setTotalPayable] = useState(0); 
  const [totalReceivable, setTotalReceivable] = useState(0); 
  
  const [wallets, setWallets] = useState([]);
  const [walletBalances, setWalletBalances] = useState({});
  const [newWalletName, setNewWalletName] = useState('');
  const [walletToDelete, setWalletToDelete] = useState(null);

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtModalView, setDebtModalView] = useState('list'); 
  const [debtsList, setDebtsList] = useState([]); 
  const [debtType, setDebtType] = useState('payable'); 
  const [debtPerson, setDebtPerson] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDate, setDebtDate] = useState('');
  const [debtWallet, setDebtWallet] = useState('tunai');

  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentWallet, setPaymentWallet] = useState('tunai');

  const [debtToDelete, setDebtToDelete] = useState(null);

  const gradientColors = [
    'from-cyan-400 to-blue-500',
    'from-amber-400 to-orange-500',
    'from-purple-400 to-pink-500',
    'from-emerald-400 to-teal-500',
    'from-rose-400 to-red-500'
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login');
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleResetData = async () => {
    if (resetConfirmationText !== 'HAPUS' || !user) return;
    setIsLoading(true);

    try {
      await supabase.from('transactions').delete().eq('user_id', user.id);
      await supabase.from('debts').delete().eq('user_id', user.id);
      await supabase.from('wallets').delete().eq('user_id', user.id);
      await supabase.from('budgets').delete().eq('user_id', user.id);

      setIsResetModalOpen(false);
      setResetConfirmationText('');
      fetchDashboardData(); 
      alert("Proses berhasil! Semua data Anda telah dihapus secara permanen.");
    } catch (error) {
      alert("Terjadi kesalahan saat menghapus data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!user) return; 

    const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id); 
    const defaultWallets = [
      { id: 'tunai', name: 'Uang Tunai', color_theme: 'from-emerald-400 to-teal-500' },
      { id: 'rekening', name: 'Rekening Utama', color_theme: 'from-cyan-400 to-blue-500' }
    ];
    let allWallets = [...defaultWallets];
    if (walletData && walletData.length > 0) allWallets = [...defaultWallets, ...walletData];
    setWallets(allWallets);

    const { data: trxData } = await supabase.from('transactions').select('*').eq('user_id', user.id);
    const { data: debtData } = await supabase.from('debts').select('*').eq('user_id', user.id).order('date', { ascending: false });
    
    let income = 0; let expense = 0; let hutang = 0; let piutang = 0;
    let balances = {};
    allWallets.forEach(w => balances[w.id] = 0);

    if (trxData) {
      trxData.forEach(trx => {
        const nom = Number(trx.amount);
        if (trx.type === 'income') income += nom;
        if (trx.type === 'expense') expense += nom;
        if (trx.type === 'income' || trx.type === 'debt_in' || trx.type === 'debt_payment_in') {
          if (balances[trx.wallet_from] !== undefined) balances[trx.wallet_from] += nom;
        } 
        else if (trx.type === 'expense' || trx.type === 'debt_out' || trx.type === 'debt_payment_out') {
          if (balances[trx.wallet_from] !== undefined) balances[trx.wallet_from] -= nom;
        } 
        else if (trx.type === 'transfer') {
          if (balances[trx.wallet_from] !== undefined) balances[trx.wallet_from] -= nom;
          if (balances[trx.wallet_to] !== undefined) balances[trx.wallet_to] += nom;
        }
      });
    }

    if (debtData) {
      setDebtsList(debtData);
      debtData.forEach(d => {
        const sisa = Number(d.amount) - Number(d.paid_amount || 0);
        if (d.status !== 'paid' && sisa > 0) {
          if (d.type === 'payable') hutang += sisa;
          if (d.type === 'receivable') piutang += sisa;
        }
      });
    }

    const totalUangDiKantong = Object.values(balances).reduce((a, b) => a + b, 0);
    const netWorth = totalUangDiKantong + piutang - hutang;

    setTotalIncome(income); setTotalExpense(expense);
    setWalletBalances(balances);
    setTotalPayable(hutang); setTotalReceivable(piutang);
    setTotalBalance(netWorth);
  };

  const handleCreateWallet = async () => {
    if (!newWalletName) return alert("Nama kantong wajib diisi!");
    setIsLoading(true);
    const randomColor = gradientColors[Math.floor(Math.random() * gradientColors.length)];
    const { error } = await supabase.from('wallets').insert([{ name: newWalletName, color_theme: randomColor, user_id: user.id }]);
    setIsLoading(false);
    if (error) alert("Gagal membuat kantong: " + error.message);
    else { setIsNewWalletModalOpen(false); setNewWalletName(''); fetchDashboardData(); }
  };

  const confirmDeleteWallet = async () => {
    if (!walletToDelete) return;
    setIsLoading(true);
    const { error } = await supabase.from('wallets').delete().eq('id', walletToDelete.id);
    setIsLoading(false);
    if (error) alert("Gagal menghapus kantong: " + error.message);
    else { setWalletToDelete(null); fetchDashboardData(); }
  };

  const confirmDeleteDebt = async () => {
    if (!debtToDelete) return;
    setIsLoading(true);

    const { error: delTrxError } = await supabase.from('transactions').delete().eq('debt_id', debtToDelete.id);
    if (delTrxError) {
       setIsLoading(false);
       return alert("Gagal menghapus riwayat transaksi: " + delTrxError.message);
    }

    const { error } = await supabase.from('debts').delete().eq('id', debtToDelete.id);
    
    setIsLoading(false);
    if (error) {
      alert("Gagal menghapus catatan hutang: " + error.message);
    } else {
      setDebtToDelete(null);
      fetchDashboardData();
    }
  };

  const handleSaveDebt = async () => {
    if (!debtAmount || !debtPerson || !debtDate) return alert("Nominal, Nama, dan Tanggal wajib diisi!");
    setIsLoading(true);
    const nom = parseFloat(debtAmount);

    // PROTEKSI: Cek apakah uang cukup jika kita MEMBERI Piutang (uang keluar)
    if (debtType === 'receivable') {
      const currentBal = walletBalances[debtWallet] || 0;
      if (nom > currentBal) {
        setIsLoading(false);
        return alert(`Saldo kantong tidak mencukupi!\nSisa saldo: ${formatRupiah(currentBal)}`);
      }
    }

    const validDueDate = debtDueDate ? debtDueDate : null;
    const debtRecord = { type: debtType, amount: nom, paid_amount: 0, person_name: debtPerson, date: debtDate, due_date: validDueDate, status: 'active', wallet: debtWallet, user_id: user.id };
    
    const { data: newDebt, error: debtError } = await supabase.from('debts').insert([debtRecord]).select();
    if (debtError) { setIsLoading(false); return alert("GAGAL menyimpan catatan hutang: " + debtError.message); }
    if (!newDebt || newDebt.length === 0) { setIsLoading(false); return alert("GAGAL: Data hutang tidak dikembalikan dari server."); }

    const trxRecord = { 
      type: debtType === 'payable' ? 'debt_in' : 'debt_out', 
      amount: nom, 
      date: debtDate, 
      note: `${debtType === 'payable' ? 'Hutang dari' : 'Piutang ke'} ${debtPerson}`, 
      category: debtType === 'payable' ? 'Hutang' : 'Piutang', 
      wallet_from: debtWallet, 
      wallet_to: null, 
      user_id: user.id,
      debt_id: newDebt[0].id
    };
    
    const { error: trxError } = await supabase.from('transactions').insert([trxRecord]);
    if (trxError) {
       setIsLoading(false); 
       return alert("PENTING! Catatan Hutang berhasil, TAPI riwayat transaksi gagal dibuat karena: " + trxError.message);
    }

    setIsLoading(false); setDebtModalView('list'); setDebtAmount(''); setDebtPerson(''); setDebtDueDate(''); setDebtDate(''); fetchDashboardData();
  };

  const handlePayDebt = async () => {
    if (!paymentAmount || !paymentDate) return alert("Nominal bayar dan tanggal wajib diisi!");
    setIsLoading(true);
    const payNom = parseFloat(paymentAmount);

    // PROTEKSI: Cek apakah uang cukup jika kita MEMBAYAR Hutang (uang keluar)
    if (debtType === 'payable') {
      const currentBal = walletBalances[paymentWallet] || 0;
      if (payNom > currentBal) {
        setIsLoading(false);
        return alert(`Saldo kantong tidak mencukupi!\nSisa saldo: ${formatRupiah(currentBal)}`);
      }
    }

    const totalHutang = Number(selectedDebt.amount);
    const sudahDibayarLama = Number(selectedDebt.paid_amount || 0);
    const sisaTagihan = totalHutang - sudahDibayarLama;
    if (payNom > sisaTagihan) { setIsLoading(false); return alert("Gagal: Nominal bayar melebihi sisa tagihan!"); }
    const newPaidAmount = sudahDibayarLama + payNom;
    const newStatus = newPaidAmount >= totalHutang ? 'paid' : 'active';
    
    const { error: debtError } = await supabase.from('debts').update({ paid_amount: newPaidAmount, status: newStatus }).eq('id', selectedDebt.id);
    if (debtError) { setIsLoading(false); return alert("GAGAL update hutang: " + debtError.message); }
    
    const trxType = debtType === 'payable' ? 'debt_payment_out' : 'debt_payment_in';
    const trxRecord = { 
      type: trxType, 
      amount: payNom, 
      date: paymentDate, 
      note: `Cicilan ${debtType === 'payable' ? 'Hutang ke' : 'Piutang dari'} ${selectedDebt.person_name}`, 
      category: debtType === 'payable' ? 'Bayar Hutang' : 'Terima Piutang', 
      wallet_from: paymentWallet, 
      wallet_to: null, 
      user_id: user.id,
      debt_id: selectedDebt.id
    };
    
    const { error: trxError } = await supabase.from('transactions').insert([trxRecord]);
    if (trxError) {
      setIsLoading(false); 
      return alert("PENTING! Cicilan terupdate, TAPI riwayat transaksi gagal dibuat karena: " + trxError.message);
    }

    setIsLoading(false); setDebtModalView('list'); setPaymentAmount(''); setPaymentDate(''); setSelectedDebt(null); fetchDashboardData();
  };

  const openDebtModal = (type) => { setDebtType(type); setDebtModalView('list'); setIsDebtModalOpen(true); };
  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const filteredDebts = debtsList.filter(d => d.type === debtType);

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-400">Memverifikasi sesi...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-slate-50 flex justify-center text-slate-800 font-sans">
      <div className="w-full max-w-md bg-slate-50 h-[100dvh] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* AREA KONTEN YANG BISA DI-SCROLL */}
        <div className="flex-1 overflow-y-auto pb-24">
          
          <div className="px-6 pt-3 pb-4">
            <div className="flex justify-between items-center mb-1">
              <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
              
              <div className="relative">
                <button 
                  onClick={() => setIsSettingsModalOpen(!isSettingsModalOpen)} 
                  className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center hover:bg-slate-100 transition-colors focus:outline-none relative z-10" 
                  title="Pengaturan"
                >
                  <FaCog className="text-cyan-500" />
                </button>

                {isSettingsModalOpen && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsSettingsModalOpen(false)}></div>
                    <div className="absolute top-12 right-0 w-48 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 z-[105] py-2 animate-[fadeIn_0.15s_ease-out] origin-top-right">
                      <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-t border-l border-slate-100 rotate-45"></div>
                      <div className="relative z-10">
                        <button onClick={() => { setIsSettingsModalOpen(false); setIsResetModalOpen(true); }} className="w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3">
                          <FaTrash className="text-xs" /> Reset Data
                        </button>
                        <div className="w-full h-px bg-slate-100 my-1"></div>
                        <button onClick={() => { setIsSettingsModalOpen(false); setIsLogoutModalOpen(true); }} className="w-full text-left px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-3">
                          <FaSignOutAlt className="text-xs" /> Keluar
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-[12px] text-slate-400 font-bold tracking-widest lowercase">{user?.email || 'Keuangan Anda'}</p>
          </div>
          
          <div className="px-6 mb-6">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] p-6 text-white shadow-xl shadow-orange-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="flex justify-between items-center mb-1 relative z-10"><p className="text-[10px] text-orange-50 font-bold tracking-wider">KEKAYAAN BERSIH</p></div>
              <h2 className="text-4xl font-extrabold mb-8 tracking-tight relative z-10">{formatRupiah(totalBalance)}</h2>
              <div className="flex gap-4 relative z-10">
                 <div><p className="text-[10px] text-orange-100 font-bold mb-1 opacity-90">PEMASUKAN</p><p className="text-sm font-bold">+ {formatRupiah(totalIncome).replace('Rp', '')}</p></div>
                 <div className="w-px bg-white/30"></div>
                 <div><p className="text-[10px] text-orange-100 font-bold mb-1 opacity-90">PENGELUARAN</p><p className="text-sm font-bold">- {formatRupiah(totalExpense).replace('Rp', '')}</p></div>
              </div>
            </div>
          </div>

          <div className="px-6 mb-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><FaWallet className="text-cyan-500" /> Kantong Anda</h3></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {wallets.map(w => (
                <div key={w.id} className="relative bg-white rounded-3xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-start transition-transform hover:scale-[1.02] cursor-pointer group">
                  {w.id !== 'tunai' && w.id !== 'rekening' && (
                    <button onClick={(e) => { e.stopPropagation(); setWalletToDelete(w); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><FaTrash className="text-xs" /></button>
                  )}
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${w.color_theme} flex items-center justify-center text-white text-xl mb-4 shadow-md`}><FaWallet /></div>
                  <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase line-clamp-1 w-full pr-2">{w.name}</p>
                  <p className="text-sm font-bold text-slate-800">{formatRupiah(walletBalances[w.id] || 0)}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setIsNewWalletModalOpen(true)} className="w-full bg-white hover:bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-4 flex items-center justify-center gap-3 transition-colors group shadow-sm">
              <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white transition-colors"><FaPlus /></div>
              <span className="text-sm font-bold text-slate-500 group-hover:text-cyan-600">Tambah Kantong</span>
            </button>
          </div>

          <div className="px-6 mb-8">
            <div className="grid grid-cols-2 gap-4">
               <div onClick={() => openDebtModal('payable')} className="bg-white rounded-3xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
                 <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mb-3"><FaArrowDown className="text-orange-500 text-sm" /></div>
                 <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">Hutang Saya</p>
                 <p className="text-sm font-bold text-slate-800">{formatRupiah(totalPayable)}</p>
               </div>
               <div onClick={() => openDebtModal('receivable')} className="bg-white rounded-3xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
                 <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center mb-3"><FaArrowUp className="text-cyan-500 text-sm" /></div>
                 <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">Piutang Orang</p>
                 <p className="text-sm font-bold text-slate-800">{formatRupiah(totalReceivable)}</p>
               </div>
            </div>
          </div>
        
        </div>

        {/* NAVIGASI BAWAH */}
        <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex justify-between items-center px-6 py-2 pb-4 z-10 pointer-events-auto">
          <div className="flex flex-col items-center gap-1 cursor-pointer"><FaHome className="text-cyan-500 text-xl" /><span className="text-[10px] font-bold text-cyan-500">Home</span></div>
          <Link href="/budget" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><FaChartPie className="text-slate-400 text-xl" /><span className="text-[10px] font-bold text-slate-500">Budget</span></Link>
          <div className="relative -top-8"><button onClick={() => setIsModalOpen(true)} className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl shadow-xl shadow-cyan-500/30 border-4 border-slate-50 active:scale-95 transition-transform"><FaPlus /></button></div>
          <Link href="/report" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><FaChartLine className="text-slate-400 text-xl" /><span className="text-[10px] font-bold text-slate-500">Report</span></Link>
          <Link href="/history" className="flex flex-col items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><FaReceipt className="text-slate-400 text-xl" /><span className="text-[10px] font-bold text-slate-500">History</span></Link>
        </div>

        <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchDashboardData} wallets={wallets} userId={user?.id} />

        {/* MODAL KONFIRMASI RESET DATA */}
        {isResetModalOpen && (
          <div className="fixed inset-0 z-[120] flex justify-center items-center px-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsResetModalOpen(false); setResetConfirmationText(''); }}></div>
            <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 animate-[slideUp_0.2s_ease-out]">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl mb-4 mx-auto"><FaExclamationCircle /></div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Reset Semua Data?</h3>
              <p className="text-sm text-slate-500 text-center mb-4">
                Tindakan ini <strong className="text-red-500">TIDAK BISA DIBATALKAN</strong>. Seluruh riwayat transaksi, dompet, hutang, dan anggaran Anda akan dihapus permanen.
              </p>
              <div className="mb-6">
                <p className="text-[10px] font-bold mb-2 text-slate-400 text-center uppercase tracking-widest">Ketik "HAPUS" untuk konfirmasi</p>
                <input type="text" value={resetConfirmationText} onChange={(e) => setResetConfirmationText(e.target.value)} placeholder="HAPUS" className="w-full text-center text-lg font-bold border-2 border-slate-100 rounded-xl py-3 focus:outline-none focus:border-red-400 bg-transparent placeholder-slate-300"/>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setIsResetModalOpen(false); setResetConfirmationText(''); }} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                <button onClick={handleResetData} disabled={isLoading || resetConfirmationText !== 'HAPUS'} className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${isLoading || resetConfirmationText !== 'HAPUS' ? 'bg-red-300 cursor-not-allowed shadow-none' : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20'}`}>{isLoading ? 'Memproses...' : 'Ya, Reset Data'}</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI LOGOUT */}
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-[110] flex justify-center items-center px-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsLogoutModalOpen(false)}></div>
            <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 animate-[slideUp_0.2s_ease-out]">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl mb-4 mx-auto"><FaSignOutAlt className="ml-1" /></div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Keluar Akun?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">Anda harus login kembali untuk mengakses data keuangan Anda.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                <button onClick={handleLogout} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors">Ya, Keluar</button>
              </div>
            </div>
          </div>
        )}

        {walletToDelete && (
          <div className="fixed inset-0 z-[110] flex justify-center items-center px-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setWalletToDelete(null)}></div>
            <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 animate-[slideUp_0.2s_ease-out]">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl mb-4 mx-auto"><FaTrash /></div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Hapus Kantong?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">Anda yakin ingin menghapus kantong <span className="text-cyan-500 font-bold">"{walletToDelete.name}"</span>?</p>
              <div className="flex gap-3">
                <button onClick={() => setWalletToDelete(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                <button onClick={confirmDeleteWallet} disabled={isLoading} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors">{isLoading ? 'Menghapus...' : 'Ya, Hapus'}</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI HAPUS HUTANG */}
        {debtToDelete && (
          <div className="fixed inset-0 z-[110] flex justify-center items-center px-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDebtToDelete(null)}></div>
            <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 animate-[slideUp_0.2s_ease-out]">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl mb-4 mx-auto"><FaTrash /></div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Hapus Catatan?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">Anda yakin ingin menghapus catatan {debtToDelete.type === 'payable' ? 'hutang' : 'piutang'} dari <span className="text-cyan-500 font-bold">"{debtToDelete.person_name}"</span> secara permanen?</p>
              <div className="flex gap-3">
                <button onClick={() => setDebtToDelete(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                <button onClick={confirmDeleteDebt} disabled={isLoading} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors">{isLoading ? 'Menghapus...' : 'Ya, Hapus'}</button>
              </div>
            </div>
          </div>
        )}

        {isNewWalletModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsNewWalletModalOpen(false)}></div>
            <div className="w-full max-w-md relative flex flex-col justify-end pointer-events-none">
              <div className="bg-white w-full rounded-t-[2rem] p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] pointer-events-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Buat Kantong Baru</h3>
                  <button onClick={() => setIsNewWalletModalOpen(false)} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><FaTimes /></button>
                </div>
                <div className="mb-8">
                  <p className="text-[10px] font-bold mb-2 text-slate-400">NAMA KANTONG</p>
                  <input type="text" value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)} placeholder="Contoh: Dana Darurat, Cicilan Motor..." className="w-full text-lg font-bold text-slate-800 border-b-2 border-slate-100 pb-2 focus:outline-none focus:border-cyan-400 bg-transparent placeholder-slate-300"/>
                </div>
                <button onClick={handleCreateWallet} disabled={isLoading} className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-cyan-500/30 active:scale-95 transition-transform">{isLoading ? 'Membuat...' : 'Buat Kantong'}</button>
              </div>
            </div>
          </div>
        )}

        {isDebtModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsDebtModalOpen(false)}></div>
            <div className="w-full max-w-md relative flex flex-col justify-end pointer-events-none">
              <div className="bg-white w-full rounded-t-[2rem] p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] max-h-[85vh] overflow-y-auto pointer-events-auto">
                {debtModalView === 'list' && (
                  <>
                    <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">{debtType === 'payable' ? 'Daftar Hutang Saya' : 'Daftar Piutang Orang'}</h3><button onClick={() => setIsDebtModalOpen(false)} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><FaTimes /></button></div>
                    <div className="overflow-y-auto flex-1 mb-6 pr-2">
                      {filteredDebts.length === 0 ? (
                        <div className="text-center py-10 text-slate-400"><FaBox className="mx-auto text-3xl mb-3 opacity-30" /><p className="text-sm font-medium">Belum ada catatan {debtType === 'payable' ? 'hutang' : 'piutang'}.</p></div>
                      ) : (
                        <div className="space-y-3">
                          {filteredDebts.map(d => {
                            const total = Number(d.amount); const paid = Number(d.paid_amount || 0); const sisa = total - paid;
                            const isLunas = sisa <= 0 || d.status === 'paid'; const isCicilan = paid > 0 && paid < total;
                            return (
                              <div key={d.id} className="relative border border-slate-100 p-4 rounded-3xl bg-white shadow-sm hover:shadow-md transition-shadow group">
                                <button onClick={() => setDebtToDelete(d)} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash className="text-xs" /></button>
                                <div className="flex justify-between items-start mb-2"><div><h4 className="font-bold text-slate-800 flex items-center gap-2"><FaUser className="text-cyan-500 text-xs" /> {d.person_name}</h4><p className="text-[10px] text-slate-400 font-medium">{formatDate(d.date)}</p></div><div className={`text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 ${isLunas ? 'bg-green-50 text-green-500' : isCicilan ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>{isLunas ? <><FaCheckCircle/> LUNAS</> : isCicilan ? <><FaExchangeAlt/> CICILAN</> : <><FaExclamationCircle/> BELUM LUNAS</>}</div></div>
                                <div className="flex justify-between items-end mt-3 pt-3 border-t border-slate-100 border-dashed"><div><p className="text-[10px] text-slate-400 font-bold mb-1">TOTAL PINJAMAN</p><p className="text-xs font-bold text-slate-500">{formatRupiah(total)}</p></div><div className="text-right"><p className="text-[10px] text-slate-400 font-bold mb-1">SISA TAGIHAN</p><p className={`text-sm font-bold ${isLunas ? 'text-green-500' : 'text-slate-800'}`}>{isLunas ? 'Rp 0' : formatRupiah(sisa)}</p></div></div>
                                {!isLunas && ( <button onClick={() => { setSelectedDebt(d); setPaymentAmount(''); setPaymentDate(''); setDebtModalView('pay'); }} className={`w-full mt-3 py-2 rounded-xl text-xs font-bold border transition-colors ${debtType === 'payable' ? 'border-orange-100 text-orange-500 bg-orange-50 hover:bg-orange-100' : 'border-cyan-100 text-cyan-600 bg-cyan-50 hover:bg-cyan-100'}`}>Bayar Cicilan</button> )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setDebtModalView('form')} className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform ${debtType === 'payable' ? 'bg-gradient-to-r from-orange-400 to-amber-500 shadow-orange-500/30' : 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/30'}`}><FaPlus /> Catat {debtType === 'payable' ? 'Hutang' : 'Piutang'} Baru</button>
                  </>
                )}
                {debtModalView === 'form' && (
                  <div className="animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center mb-6 pb-2 border-b border-slate-100"><button onClick={() => setDebtModalView('list')} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mr-3 hover:bg-slate-100"><FaChevronLeft /></button><h3 className="text-lg font-bold text-slate-800">{debtType === 'payable' ? 'Catat Hutang Baru' : 'Catat Piutang Baru'}</h3></div>
                    <div className={`p-3 rounded-xl mb-6 text-xs font-medium flex gap-2 items-start ${debtType === 'payable' ? 'bg-orange-50 text-orange-600' : 'bg-cyan-50 text-cyan-600'}`}>{debtType === 'payable' ? "💡 Saldo dompet akan bertambah." : "💡 Saldo dompet akan berkurang."}</div>
                    <div className="mb-5"><p className="text-[10px] font-bold mb-2 text-slate-400">TANGGAL TRANSAKSI</p><input type="date" value={debtDate} onChange={(e) => setDebtDate(e.target.value)} className="w-full text-sm font-bold border-b-2 border-slate-100 pb-2 focus:outline-none focus:border-cyan-400 text-slate-800 bg-transparent"/></div>
                    <div className="mb-5"><p className="text-[10px] font-bold mb-2 text-slate-400">NOMINAL (RP)</p><input type="number" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} placeholder="0" className="w-full text-3xl font-bold border-b-2 border-slate-100 pb-2 focus:outline-none focus:border-cyan-400 text-cyan-500 bg-transparent placeholder-slate-300"/></div>
                    <div className="mb-5"><p className="text-[10px] font-bold mb-2 text-slate-400">{debtType === 'payable' ? 'NAMA PEMBERI PINJAMAN' : 'NAMA PEMINJAM'}</p><div className="flex items-center border-b-2 border-slate-100 pb-2 focus-within:border-cyan-400 transition-colors"><FaUser className="text-slate-400 mr-2" /><input type="text" value={debtPerson} onChange={(e) => setDebtPerson(e.target.value)} placeholder="Contoh: Budi, Bank..." className="w-full text-sm font-bold focus:outline-none bg-transparent text-slate-800 placeholder-slate-400"/></div></div>
                    <div className="mb-5"><p className="text-[10px] font-bold mb-2 text-slate-400">MASUK/KELUAR DARI KANTONG</p><div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{wallets.map(w => ( <button key={w.id} onClick={() => setDebtWallet(w.id)} className={`px-4 py-3 rounded-xl border font-bold text-sm whitespace-nowrap transition-all ${debtWallet === w.id ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'bg-white border-slate-100 text-slate-500'}`}><FaWallet className="inline mr-2"/>{w.name}</button> ))}</div></div>
                    <div className="mb-8"><p className="text-[10px] font-bold mb-2 text-slate-400">TENGGAT LUNAS (OPSIONAL)</p><input type="date" value={debtDueDate} onChange={(e) => setDebtDueDate(e.target.value)} className="w-full text-sm font-bold border-b-2 border-slate-100 pb-2 focus:outline-none focus:border-cyan-400 bg-transparent text-slate-800"/></div>
                    <button onClick={handleSaveDebt} disabled={isLoading} className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform ${isLoading ? 'bg-slate-300' : debtType === 'payable' ? 'bg-gradient-to-r from-orange-400 to-amber-500 shadow-orange-500/30' : 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/30'}`}>{isLoading ? 'Menyimpan...' : 'Simpan Catatan'}</button>
                  </div>
                )}
                {debtModalView === 'pay' && selectedDebt && (
                  <div className="animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center mb-6 pb-2 border-b border-slate-100"><button onClick={() => setDebtModalView('list')} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mr-3 hover:bg-slate-100"><FaChevronLeft /></button><h3 className="text-lg font-bold text-slate-800">Pembayaran Cicilan</h3></div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-6"><p className="text-[10px] text-slate-400 font-bold mb-1">DETAIL TAGIHAN</p><h4 className="font-bold text-slate-800 flex items-center gap-2"><FaUser className="text-cyan-500 text-xs"/> {selectedDebt.person_name}</h4><div className="flex justify-between mt-3 pt-3 border-t border-slate-200"><span className="text-xs font-bold text-slate-500">SISA TAGIHAN:</span><span className="text-sm font-bold text-slate-800">{formatRupiah(Number(selectedDebt.amount) - Number(selectedDebt.paid_amount || 0))}</span></div></div>
                    <div className="mb-5"><p className="text-[10px] font-bold mb-2 text-slate-400">TANGGAL BAYAR</p><input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full text-sm font-bold border-b-2 border-slate-100 pb-2 focus:outline-none focus:border-cyan-400 bg-transparent text-slate-800"/></div>
                    <div className="mb-5"><p className="text-[10px] font-bold mb-2 text-slate-400">NOMINAL BAYAR (RP)</p><input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0" className="w-full text-3xl font-bold border-b-2 border-slate-100 pb-2 focus:outline-none focus:border-cyan-400 bg-transparent text-cyan-500 placeholder-slate-300"/></div>
                    <div className="mb-8"><p className="text-[10px] font-bold mb-2 text-slate-400">{debtType === 'payable' ? 'SUMBER DANA PEMBAYARAN' : 'MASUK KE KANTONG'}</p><div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{wallets.map(w => ( <button key={w.id} onClick={() => setPaymentWallet(w.id)} className={`px-4 py-3 rounded-xl border font-bold text-sm whitespace-nowrap transition-all ${paymentWallet === w.id ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'bg-white border-slate-100 text-slate-500'}`}><FaWallet className="inline mr-2"/>{w.name}</button> ))}</div></div>
                    <button onClick={handlePayDebt} disabled={isLoading} className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform ${isLoading ? 'bg-slate-300' : debtType === 'payable' ? 'bg-gradient-to-r from-orange-400 to-amber-500 shadow-orange-500/30' : 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/30'}`}>{isLoading ? 'Memproses...' : 'Proses Pembayaran'}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}