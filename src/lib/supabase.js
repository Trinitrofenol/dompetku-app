import { createClient } from '@supabase/supabase-js';

// Memanggil kunci dari file .env.local yang Anda buat sebelumnya
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Membuat instance koneksi ke database Supabase Anda
export const supabase = createClient(supabaseUrl, supabaseKey);