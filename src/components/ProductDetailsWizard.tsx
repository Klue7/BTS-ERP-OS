import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, ArrowLeft, Image as ImageIcon, Box, Ruler, CheckCircle2, Factory } from 'lucide-react';
import { useVisualLab, useTheme } from './VisualLabContext';

const slideVariants = {
  hidden: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 })
};

export function ProductDetailsWizard() {
  const { 
    isProductDetailsOpen, 
    setIsProductDetailsOpen,
    activeCategory, 
    selectedCatalogItem,
    setIsQuoteWizardOpen
  } = useVisualLab();
  
  const { primaryColor: accentColor, textClass, bgClass, hoverBgClass } = useTheme();

  const handleClose = () => {
    setIsProductDetailsOpen(false);
  };

  const handleAddToCart = () => {
    setIsProductDetailsOpen(false);
    setIsQuoteWizardOpen(true);
  };

  if (!selectedCatalogItem) return null;

  return (
    <AnimatePresence>
      {isProductDetailsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-2xl"
        >
          <motion.div
            custom={1}
            variants={slideVariants}
            initial="hidden"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 200 } as any}
            className={`w-full max-w-5xl h-[90vh] bg-black border border-white/20 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col relative`}
          >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <button 
                onClick={handleClose}
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest"
              >
                <ArrowLeft size={16} /> BACK TO SHOWCASE
              </button>
              
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* ── Body ────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-full">
                
                {/* Visual Half */}
                <div className="bg-[#0a0a0a] border-r border-white/5 p-12 flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <img 
                      src={selectedCatalogItem.image || selectedCatalogItem.images?.[0] || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200"}
                      alt="Texture BG"
                      className="w-full h-full object-cover blur-xl grayscale"
                    />
                  </div>
                  
                  <div className="relative z-10 w-full aspect-video md:aspect-square flex items-center justify-center perspective-[1200px]">
                     <motion.div
                        initial={{ rotateX: 20, rotateY: -30, scale: 0.9 }}
                        animate={{ rotateX: 25, rotateY: 15, scale: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 } as any}
                        className="w-64 h-24 md:w-80 md:h-32"
                        style={{
                          backgroundColor: selectedCatalogItem.color,
                          borderRadius: 4,
                          boxShadow: `inset 0 0 20px rgba(0,0,0,0.5), 0 20px 40px ${selectedCatalogItem.color}80, -20px -20px 60px rgba(0,0,0,0.8)`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-sm" />
                        <div className="absolute -bottom-[12px] left-[6px] right-[-6px] h-[12px] brightness-50 rounded-b-sm"
                          style={{ backgroundColor: selectedCatalogItem.color, transform: 'skewX(45deg)' }} />
                        <div className="absolute -right-[12px] top-[6px] bottom-[-6px] w-[12px] brightness-75 rounded-r-sm"
                          style={{ backgroundColor: selectedCatalogItem.color, transform: 'skewY(45deg)' }} />
                     </motion.div>
                  </div>
                  
                  <div className="absolute bottom-8 left-12 right-12 flex justify-between items-center text-white/30 text-[10px] tracking-widest uppercase font-bold">
                    <span>{selectedCatalogItem.specs?.module || "222x73x8mm"}</span>
                    <span>100% Cumbrian Clay</span>
                  </div>
                </div>

                {/* Details Half */}
                <div className="p-8 md:p-12 lg:p-16 flex flex-col">
                  <div className="mb-4">
                    <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${textClass}`}>
                      {activeCategory === 'bricks' ? 'Brick Types' : 'Colour Moods'} • {selectedCatalogItem.mood || selectedCatalogItem.subCategory || 'Signature'}
                    </span>
                  </div>
                  
                  <h1 className="text-4xl md:text-6xl font-light text-white tracking-tight leading-none mb-6">
                    {selectedCatalogItem.name}
                  </h1>

                  <p className="text-white/60 leading-relaxed text-sm md:text-base mb-10">
                    {selectedCatalogItem.description} This exquisite product features subtle organic variations, making it an excellent choice for architects and designers looking to add character, warmth, and a tactile footprint to high-end residential or commercial spaces.
                  </p>

                  {/* Specifications Grid */}
                  <div className="grid grid-cols-2 gap-6 mb-12">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-white/40 mb-1">
                         <Ruler size={14} />
                         <span className="text-[10px] font-bold tracking-widest uppercase">Format</span>
                       </div>
                       <p className="text-white text-sm font-medium">{selectedCatalogItem.specs?.module || "222mm x 73mm x 8mm"}</p>
                    </div>
                    
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-white/40 mb-1">
                         <Box size={14} />
                         <span className="text-[10px] font-bold tracking-widest uppercase">Coverage</span>
                       </div>
                       <p className="text-white text-sm font-medium">{selectedCatalogItem.specs?.boxDetail || "1 SQ/M BOX • 50 TILES"}</p>
                    </div>

                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-white/40 mb-1">
                         <Factory size={14} />
                         <span className="text-[10px] font-bold tracking-widest uppercase">Origin</span>
                       </div>
                       <p className="text-white text-sm font-medium">Locally Sourced Clay</p>
                    </div>

                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-white/40 mb-1">
                         <CheckCircle2 size={14} />
                         <span className="text-[10px] font-bold tracking-widest uppercase">Warranty</span>
                       </div>
                       <p className="text-white text-sm font-medium">10 Year Guarentee</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center gap-6 justify-between">
                    <div>
                      <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-1">SELLING PRICE</div>
                      <div className={`text-4xl font-bold ${textClass}`}>{selectedCatalogItem.price || "R 310.00"}</div>
                    </div>
                    
                    <button 
                      onClick={handleAddToCart}
                      className={`w-full sm:w-auto px-8 py-4 ${bgClass} text-white font-bold text-sm uppercase tracking-[0.2em] rounded-full transition-all hover:opacity-90 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.3)]`}
                      style={{ boxShadow: `0 0 20px ${accentColor}40` }}
                    >
                      <ShoppingCart size={18} />
                      ADD TO CART
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
