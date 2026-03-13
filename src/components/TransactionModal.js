'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  FaTimes, FaExchangeAlt, FaUtensils, FaCar, FaGraduationCap, 
  FaFileInvoiceDollar, FaHeartbeat, FaShoppingBag, FaFilm, 
  FaBox, FaBriefcase, FaClock, FaGift, FaWallet, FaMoneyBillWave 
} from "react-icons/fa";

export default function TransactionModal({ isOpen, onClose, onSuccess, wallets = [], userId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('tunai');
  const [transferFrom, setTransferFrom] = useState('rekening');
  const [transferTo, setTransferTo] = useState('tunai');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  // Pastikan dompet default terpilih saat modal dibuka
  useEffect(() => {
    if (wallets.length > 0 && !wallets.find(w => String(w.id) === String(selectedWallet))) {
      setSelectedWallet(String(wallets[0].id));
    }
  }, [wallets, isOpen]);

  if (!isOpen) return null;

  const handleSaveTransaction = async () => {
    if (!amount || !date) return alert("Mohon isi Tanggal dan Nominal!");
    if (transactionType !== 'transfer' && !selectedCategory) return alert("Pilih Kategori!");
    if (!userId) return alert("Sesi tidak valid. Silakan login ulang."); 
    
    setIsLoading(true);

    const nominal = parseFloat(amount);

    // PROTEKSI SALDO MINUS: Cek saldo sebelum menyimpan pengeluaran atau mutasi
    if (transactionType === 'expense' || transactionType === 'transfer') {
      const checkWalletId = String(transactionType === 'transfer' ? transferFrom : selectedWallet);
      
      // Ambil transaksi user untuk hitung saldo dompet ini
      const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', userId);
      let currentBal = 0;
      
      if (txs) {
        txs.forEach(t => {
          const a = Number(t.amount);
          const wFrom = String(t.wallet_from);
          const wTo = String(t.wallet_to);

          if ((t.type === 'income' || t.type === 'debt_in' || t.type === 'debt_payment_in') && wFrom === checkWalletId) {
            currentBal += a;
          }
          else if ((t.type === 'expense' || t.type === 'debt_out' || t.type === 'debt_payment_out') && wFrom === checkWalletId) {
            currentBal -= a;
          }
          else if (t.type === 'transfer') {
            if (wFrom === checkWalletId) currentBal -= a;
            if (wTo === checkWalletId) currentBal += a;
          }
        });
      }

      if (nominal > currentBal) {
        setIsLoading(false);
        const formatRp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(currentBal);
        return alert(`Saldo kantong tidak mencukupi!\nSisa saldo di kantong ini hanya: ${formatRp}`);
      }
    }

    const data = {
      type: transactionType, amount: nominal, date: date, note: note,
      category: transactionType === 'transfer' ? 'Mutasi Saldo' : selectedCategory,
      wallet_from: transactionType === 'transfer' ? transferFrom : selectedWallet,
      wallet_to: transactionType === 'transfer' ? transferTo : null,
      user_id: userId 
    };

    const { error } = await supabase.from('transactions').insert([data]);
    setIsLoading(false);

    if (error) {
      alert("Gagal menyimpan data: " + error.message);
    } else {
      setAmount(''); setNote(''); setDate(''); setSelectedCategory('');
      onSuccess(); 
      onClose(); 
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="w-full max-w-md relative flex flex-col justify-end pointer-events-none">
        <div className="bg-white w-full rounded-t-[2rem] p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] max-h-[85vh] overflow-y-auto pointer-events-auto">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2">
            <h3 className="text-lg font-bold text-slate-800">Catat Transaksi</h3>
            <button onClick={onClose} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><FaTimes /></button>
          </div>
          
          <div className="flex bg-gradient-to-br from-amber-400 to-orange-500 p-1 rounded-2xl mb-6">
            <button onClick={() => {setTransactionType('expense'); setSelectedCategory('');}} className={`flex-1 py-3 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${transactionType === 'expense' ? 'bg-white text-orange-500 shadow-sm' : 'text-white'}`}>Pengeluaran</button>
            <button onClick={() => {setTransactionType('income'); setSelectedCategory('');}} className={`flex-1 py-3 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${transactionType === 'income' ? 'bg-white text-emerald-500 shadow-sm' : 'text-white'}`}>Pemasukan</button>
            <button onClick={() => {setTransactionType('transfer'); setSelectedCategory('');}} className={`flex-1 py-3 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${transactionType === 'transfer' ? 'bg-white text-cyan-600 shadow-sm' : 'text-white'}`}>Mutasi</button>
          </div>
          
          <div className="mb-5">
            <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase">Tanggal</p>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full text-sm font-bold text-slate-800 border-b-2 border-slate-100 pb-2 focus:outline-none focus:border-cyan-400 bg-transparent transition-colors"/>
          </div>
          
          <div className="mb-5">
            <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase">Nominal (Rp)</p>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-full text-3xl font-bold text-cyan-500 border-b-2 border-slate-100 pb-2 focus:outline-none focus:border-cyan-400 placeholder-slate-300 bg-transparent transition-colors"/>
          </div>
          
          {transactionType !== 'transfer' && (
            <div className="mb-5">
              <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase">Kategori</p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {transactionType === 'expense' ? (
                  <>
                    <button onClick={() => setSelectedCategory('makanan')} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border whitespace-nowrap transition-all ${selectedCategory === 'makanan' ? 'bg-orange-50 border-orange-200 text-orange-500 shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}><FaUtensils/> Makanan</button>
                    <button onClick={() => setSelectedCategory('kesehatan')} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border whitespace-nowrap transition-all ${selectedCategory === 'kesehatan' ? 'bg-orange-50 border-orange-200 text-orange-500 shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}><FaHeartbeat/> Kesehatan</button>
                    <button onClick={() => setSelectedCategory('transportasi')} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border whitespace-nowrap transition-all ${selectedCategory === 'transportasi' ? 'bg-orange-50 border-orange-200 text-orange-500 shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}><FaCar/> Transportasi</button>
                    <button onClick={() => setSelectedCategory('pendidikan')} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border whitespace-nowrap transition-all ${selectedCategory === 'pendidikan' ? 'bg-orange-50 border-orange-200 text-orange-500 shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}><FaGraduationCap/> Pendidikan</button>
                    <button onClick={() => setSelectedCategory('tagihan')} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border whitespace-nowrap transition-all ${selectedCategory === 'tagihan' ? 'bg-orange-50 border-orange-200 text-orange-500 shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}><FaFileInvoiceDollar/> Tagihan</button>
                    <button onClick={() => setSelectedCategory('belanja')} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border whitespace-nowrap transition-all ${selectedCategory === 'belanja' ? 'bg-orange-50 border-orange-200 text-orange-500 shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}><FaShoppingBag/> Belanja</button>
                    <button onClick={() => setSelectedCategory('hiburan')} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border whitespace-nowrap transition-all ${selectedCategory === 'hiburan' ? 'bg-orange-50 border-orange-200 text-orange-500 shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}><FaFilm/> Hiburan</button>
                    <button onClick={() => setSelectedCategory('lainnya')} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border whitespace-nowrap transition-all ${selectedCategory === 'lainnya' ? 'bg-orange-50 border-orange-200 text-orange-500 shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}><FaBox/> Lainnya</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setSelectedCategory('gaji')} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border whitespace-nowrap transition-all ${selectedCategory === 'gaji' ? 'bg-emerald-50 border-emerald-200 text-emerald-500 shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}><FaBriefcase/> Gaji</button>
                    <button onClick={() => setSelectedCategory('bonus')} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border whitespace-nowrap transition-all ${selectedCategory === 'bonus' ? 'bg-emerald-50 border-emerald-200 text-emerald-500 shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}><FaGift/> Bonus</button>
                    <button onClick={() => setSelectedCategory('Uang Makan')} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border whitespace-nowrap transition-all ${selectedCategory === 'Uang Makan' ? 'bg-emerald-50 border-emerald-200 text-emerald-500 shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}><FaUtensils/> Uang Makan</button>
                    <button onClick={() => setSelectedCategory('Lainnya')} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border whitespace-nowrap transition-all ${selectedCategory === 'Lainnya' ? 'bg-emerald-50 border-emerald-200 text-emerald-500 shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}><FaMoneyBillWave/> Lainnya</button>
                  </>
                )}
              </div>
            </div>
          )}

          {transactionType !== 'transfer' ? (
            <div className="mb-5">
              <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase">{transactionType === 'expense' ? 'Sumber Dana' : 'Masuk Ke Dompet'}</p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {wallets.map(w => (
                  <button 
                    key={w.id}
                    onClick={() => setSelectedWallet(String(w.id))} 
                    className={`px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold border whitespace-nowrap transition-all ${String(selectedWallet) === String(w.id) ? 'bg-cyan-50 border-cyan-200 text-cyan-600 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                  >
                    <FaWallet className={String(selectedWallet) === String(w.id) ? "text-cyan-500" : "text-slate-400"}/> {w.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-5 bg-cyan-50 p-4 rounded-3xl border border-slate-100">
              <div className="mb-4">
                <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase">Dari Kantong (Sumber)</p>
                <select value={transferFrom} onChange={(e) => setTransferFrom(String(e.target.value))} className="w-full bg-white border border-slate-100 text-slate-800 text-sm font-bold rounded-xl px-3 py-3 shadow-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20">
                  {wallets.map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
                </select>
              </div>
              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-white border border-slate-100 p-2 rounded-full text-slate-400 shadow-sm"><FaExchangeAlt className="rotate-90" /></div>
              </div>
              <div className="mt-2">
                <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase">Ke Kantong (Tujuan)</p>
                <select value={transferTo} onChange={(e) => setTransferTo(String(e.target.value))} className="w-full bg-white border border-slate-100 text-slate-800 text-sm font-bold rounded-xl px-3 py-3 shadow-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20">
                  {wallets.map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
                </select>
              </div>
            </div>
          )}
          
          <div className="mb-8">
            <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase">Catatan</p>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Beli makan siang..." className="w-full text-sm font-bold text-slate-800 border-b-2 border-slate-100 pb-2 focus:outline-none focus:border-cyan-400 placeholder-slate-300 bg-transparent transition-colors"/>
          </div>
          
          <button onClick={handleSaveTransaction} disabled={isLoading} className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform ${isLoading ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/30'}`}>
            {isLoading ? 'Menyimpan...' : transactionType === 'transfer' ? 'Proses Mutasi' : 'Simpan Transaksi'}
          </button>
        </div>
      </div>
    </div>
  );
}