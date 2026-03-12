'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { FaWallet, FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setMessage({ text: 'Email dan password wajib diisi!', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isLogin) {
        // Proses Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // Jika berhasil, arahkan ke beranda
        router.push('/');
        
      } else {
        // Proses Register
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage({ text: 'Pendaftaran berhasil! Silakan login menggunakan akun tersebut.', type: 'success' });
        setIsLogin(true); // Pindah ke tab login
        setPassword(''); // Kosongkan password demi keamanan
      }
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl flex items-center justify-center text-white text-4xl shadow-xl shadow-cyan-500/30 mb-6 rotate-3">
            <FaWallet className="-rotate-3" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dompetku</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Personal Finance App</p>
        </div>

        {/* Toggle Login / Register */}
        <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8 border border-slate-100">
          <button 
            onClick={() => { setIsLogin(true); setMessage({text:'', type:''}); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${isLogin ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Masuk
          </button>
          <button 
            onClick={() => { setIsLogin(false); setMessage({text:'', type:''}); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${!isLogin ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Notifikasi Pesan (Error / Success) */}
        {message.text && (
          <div className={`p-4 rounded-2xl mb-6 text-xs font-bold ${message.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
            {message.text}
          </div>
        )}

        {/* Form Input */}
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase ml-1">Alamat Email</p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <FaEnvelope />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com" 
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-sm font-bold rounded-2xl pl-11 pr-4 py-4 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 transition-all placeholder-slate-300"
                required
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase ml-1">Kata Sandi</p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <FaLock />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter" 
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-sm font-bold rounded-2xl pl-11 pr-4 py-4 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 transition-all placeholder-slate-300"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 mt-8 active:scale-95 transition-all ${isLoading ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/30 hover:shadow-cyan-500/40'}`}
          >
            {isLoading ? 'Memproses...' : isLogin ? 'Masuk Sekarang' : 'Buat Akun'}
            {!isLoading && <FaArrowRight className="text-xs opacity-70" />}
          </button>
        </form>

      </div>
    </main>
  );
}