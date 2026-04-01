import React from 'react';
import { motion } from 'motion/react';
import { Instagram, Twitter, Youtube, ArrowRight } from 'lucide-react';
import { useVisualLab, useTheme } from './VisualLabContext';
import { productData } from '../catalog/productData';

export function Footer() {
  const { activeCategory } = useVisualLab();
  const categoryData = productData[activeCategory];
  const { 
    primaryColor: activeColor, 
    textClass: activeColorClass, 
    borderClass: activeBorderClass, 
    bgClass: activeBgClass, 
    hoverBgClass 
  } = useTheme();

  return (
    <footer id="footer" className="relative overflow-hidden h-[100svh] w-full flex flex-col items-center justify-center bg-transparent">
      {/* Background Decorative Radial Element */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className={`w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full blur-[150px] opacity-10 transition-colors duration-1000 ${activeBgClass}`} />
      </div>

      <div className="relative z-10 w-full max-w-7xl px-8 flex flex-col items-center justify-center flex-1">
        {/* Top Label */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`px-6 py-2 border rounded-full mb-8 md:mb-12 transition-colors duration-1000 ${activeBorderClass}/30`}
        >
          <span className={`text-[10px] tracking-[0.3em] uppercase font-bold transition-colors duration-1000 ${activeColorClass}`}>
            Next Level Architecture
          </span>
        </motion.div>

        {/* GIANT DEFY DESIGN TEXT */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="text-[20vw] md:text-[15vw] leading-[0.8] font-['Anton'] text-white uppercase tracking-tighter text-center mb-16 relative whitespace-nowrap"
        >
          <span className="text-white/10 absolute -top-1/2 left-1/2 -translate-x-1/2 pointer-events-none">DEFY</span>
          DEFY<br />DESIGN<span className={`text-transparent bg-clip-text transition-colors duration-1000 ${activeBgClass}`}>.</span>
          {/* Accent square at the end like the reference */}
          <span className={`absolute bottom-6 -right-6 md:bottom-12 md:-right-16 w-4 h-4 md:w-8 md:h-8 transition-colors duration-1000 ${activeBgClass}`} />
        </motion.h1>

        {/* Info Bar (Reference Image 1 style) */}
        <div className="w-full border-y border-white/10 py-6 mb-16 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex gap-8 text-[10px] md:text-xs tracking-[0.2em] uppercase font-bold text-white/50">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-1000 ${activeBgClass}`} />
              OFFICIAL STORE
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-1000 ${activeBgClass}`} />
              GLOBAL SHIPPING
            </div>
          </div>
          
          <div className="flex gap-8">
            <a href="#" className="text-white/50 hover:text-white transition-colors"><Twitter size={18} /></a>
            <a href="#" className="text-white/50 hover:text-white transition-colors"><Instagram size={18} /></a>
            <a href="#" className="text-white/50 hover:text-white transition-colors"><Youtube size={18} /></a>
          </div>

          <div className="text-[10px] md:text-xs tracking-[0.2em] uppercase font-bold text-white/50">
            SECURE CHECKOUT
          </div>
        </div>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`bg-white text-black px-12 md:px-16 py-4 md:py-5 text-sm font-bold tracking-[0.3em] uppercase transition-colors ${hoverBgClass} hover:text-white w-full md:w-auto`}
        >
          SHOP COLLECTION
        </motion.button>
      </div>

      <div className="w-full flex justify-center py-8 relative z-10">
        <p className="text-[10px] tracking-widest text-white/20 uppercase">
          © 2024 BRICK TILE SHOP. ENGINEERED FOR GREATNESS.
        </p>
      </div>
    </footer>
  );
}
