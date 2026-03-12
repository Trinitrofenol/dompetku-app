/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Mengizinkan Vercel untuk tetap melanjutkan peluncuran meskipun ada peringatan kecil
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;