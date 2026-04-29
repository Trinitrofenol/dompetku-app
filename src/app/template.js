'use client';

import { motion } from 'framer-motion';

export default function Template({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} // Mulai dari transparan dan sedikit bergeser ke kanan
      animate={{ opacity: 1, x: 0 }}  // Muncul sepenuhnya di posisi tengah
      transition={{ 
        ease: 'easeOut', 
        duration: 0.3 // Kecepatan animasi (0.3 detik)
      }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}