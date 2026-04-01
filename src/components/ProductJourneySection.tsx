import React from 'react';
import { motion } from 'motion/react';
import { useVisualLab, useTheme } from './VisualLabContext';
import { productData } from '../catalog/productData';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

export function ProductJourneySection() {
  const { activeCategory, selectedCatalogItem, setSelectedCatalogItem, setIsQuoteWizardOpen, setIsProductDetailsOpen } = useVisualLab();
  
  // Fallback to first item if none selected
  const items = (productData as any)[activeCategory].catalog;
  const currentItem = selectedCatalogItem || items[0];
  
  const handleNext = () => {
    const currentIndex = items.findIndex((i: any) => i.id === currentItem.id);
    const nextIndex = (currentIndex + 1) % items.length;
    setSelectedCatalogItem(items[nextIndex]);
  };

  const handlePrev = () => {
    const currentIndex = items.findIndex((i: any) => i.id === currentItem.id);
    const prevIndex = (currentIndex - 1 + items.length) % items.length;
    setSelectedCatalogItem(items[prevIndex]);
  };

  const currentIndex = items.findIndex((i: any) => i.id === currentItem.id);
  const totalStr = items.length < 10 ? '0' + items.length : items.length;
  const currentStr = (currentIndex + 1) < 10 ? '0' + (currentIndex + 1) : (currentIndex + 1);

  return (
    <section id="product-journey" className="relative w-full h-screen bg-transparent flex items-center overflow-hidden">
      
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{
         backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
         backgroundSize: '100px 100px'
      }} />

      <div className="container mx-auto px-6 md:px-16 relative z-10 w-full h-full flex items-center">

        {/* Master Plan Tech Detail (Top Left Decorative) */}
        <div className="absolute top-24 left-6 md:left-16 pointer-events-none opacity-50 hidden md:block">
           <div className="text-[8px] font-mono text-[#1DB954] mb-2 uppercase tracking-widest">MASTER PLAN V.03</div>
           <div className="w-[120px] h-px bg-[#1DB954]/30" />
           <div className="w-px h-[40px] bg-[#1DB954]/30" />
           <div className="w-[40px] h-px bg-[#1DB954]/30" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
          
          {/* Left Content */}
          <div className="max-w-xl relative z-20 mt-10 md:mt-0">
            <motion.div 
              key={`${currentItem.id}-header`}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-black tracking-widest uppercase text-[#1DB954]">
                  BRICK TILE SHOP {currentItem.mood || 'SIGNATURE'} FINISH
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-[#1DB954]/50 to-transparent max-w-[120px]" />
              </div>
              
              <div className="space-y-2 mt-4">
                 <h2 className="text-6xl md:text-8xl font-['Anton'] uppercase text-white tracking-widest leading-none" style={{textShadow: "0 0 40px rgba(255,255,255,0.1)"}}>
                   {currentItem.name}
                 </h2>
                 <div className="text-[10px] font-black tracking-widest uppercase text-white/50 pt-2">
                   THIN BRICK TILES
                 </div>
              </div>

              <p className="text-xs md:text-sm text-white/60 leading-relaxed max-w-sm font-medium mt-4">
                {currentItem.description || 'Deep wine-red tones that bring a luxurious warmth to any architectural project.'}
              </p>

              <div className="space-y-1 pt-8 border-t border-white/5 inline-block w-full max-w-sm mt-8">
                <div className="text-[9px] font-black tracking-widest uppercase text-[#1DB954] mb-1">
                  SELLING PRICE
                </div>
                <div className="flex justify-between items-baseline mb-2">
                   <div className="flex items-start text-[#1DB954]">
                     <span className="text-xl font-bold mt-1.5 mr-1">R</span>
                     <span className="text-5xl md:text-6xl font-['Anton'] tracking-wider">{itemPriceNumber(currentItem)}</span>
                   </div>
                </div>
                <div className="text-[8px] font-medium tracking-[0.2em] uppercase text-white/30 leading-relaxed">
                  INCL VAT + 1 SQ/M BOX - {activeCategory === 'bricks' ? '50 TILES' : '36 TILES'}<br/>
                  FORMAT {currentItem.specs?.module?.toUpperCase().replace(/X/g, '•') || '220•73•9MM'}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Content (Empty space for centered 3D object on desktop, handled by absolute pos below) */}
          <div className="hidden md:block h-[400px]"></div>
        </div>

        {/* Centered Action Buttons (Positioned below the 3D Tile explicitly) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 z-20 pointer-events-auto"
        >
          <button 
            onClick={() => setIsProductDetailsOpen(true)}
            className="px-12 py-5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-[12px] uppercase tracking-[0.2em] rounded-full transition-all shadow-[0_0_30px_rgba(29,185,84,0.35)] hover:shadow-[0_0_40px_rgba(29,185,84,0.6)] hover:scale-105 active:scale-95"
          >
            VIEW DETAILS
          </button>
          <button 
            onClick={() => setIsQuoteWizardOpen(true)}
            className="text-white/40 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 group"
          >
            <ShoppingCart size={14} className="group-hover:-translate-x-1 transition-transform" /> ADD TO CART
          </button>
        </motion.div>

        {/* Bottom Right Tracker Box matching Image #3 perfectly */}
        <div className="absolute bottom-12 right-6 md:right-16 z-20 pointer-events-auto bg-[#040404]/80 backdrop-blur-xl border border-white/5 p-6 w-[280px]">
           {/* Decorative dashed corner */}
           <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#1DB954]/50" />
           <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#1DB954]/50" />

           <div className="text-[8px] font-black text-[#1DB954] mb-6 uppercase tracking-widest">
             FOUNDATION SECTION
           </div>
           
           <div className="flex justify-between items-end">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-3">
                   <div className="text-[10px] font-mono tracking-widest text-white/50 relative">
                     {currentStr} <span className="text-white/20 mx-1">/</span> {totalStr}
                   </div>
                   <div className="flex gap-1.5 items-center">
                     {items.map((item: any) => (
                       <div 
                         key={item.id}
                         className={`h-1 rounded-full transition-all duration-500 ease-out ${item.id === currentItem.id ? 'w-3 bg-[#1DB954]' : 'w-1 bg-white/10'}`}
                       />
                     ))}
                   </div>
                </div>
                
                <div className="text-[12px] font-black tracking-widest uppercase text-white mt-1">
                  {currentItem.name}
                </div>
              </div>
              
              {/* Target-like Arrows layout */}
              <div className="flex gap-1.5">
                <button 
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all bg-[#0a0a0a]"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all bg-[#0a0a0a]"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
           </div>
        </div>

      </div>
    </section>
  );
}

function itemPriceNumber(item: any) {
  return item.price?.toString().replace(/[^0-9.]/g, '') || '0';
}
