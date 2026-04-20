import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVisualLab } from './VisualLabContext';
import { useStorefrontCategoryData } from '../catalog/storefrontData';
import { ChevronLeft, ChevronRight, ZoomIn, Tag, Layers, Box } from 'lucide-react';

// Supplementary lifestyle / context images per slot
const CONTEXT_IMAGES = [
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&q=80',
];

export function ShowcaseSection() {
  const { selectedCatalogItem, activeCategory } = useVisualLab();
  const { categoryData } = useStorefrontCategoryData(activeCategory);

  // Build the active product: context-selected OR default to first (Serengeti)
  const catalogItems = (categoryData?.catalog ?? []) as any[];
  const product = selectedCatalogItem ?? catalogItems[0] ?? null;

  // Build gallery: product's own images + fill with context images up to 5 slots
  const gallery = useMemo(() => {
    if (!product) return CONTEXT_IMAGES.slice(0, 5);
    const own = Array.isArray(product.images) ? product.images : [];
    const fill = CONTEXT_IMAGES.filter(u => !own.includes(u));
    return [...own, ...fill].slice(0, 5);
  }, [product]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const primary = gallery[activeIdx];
  const accent = product?.color ?? '#22c55e';

  return (
    <section
      id="showcase"
      className="relative w-full h-screen bg-transparent flex items-center justify-center overflow-hidden"
    >
      {/* Subtle grid bg */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />

      {/* Colour bloom behind active swatch */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full blur-[120px] opacity-10 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: accent }}
      />

      <div className="relative z-10 w-full max-w-7xl px-8 md:px-16 h-full flex flex-col justify-center gap-8">
        {/* ── Top bar ── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.4em] font-mono mb-2" style={{ color: accent }}>
              Product Gallery
            </p>
            <h2 className="text-4xl md:text-6xl font-serif font-light text-white leading-none tracking-tighter">
              {product?.name ?? 'Serengeti'}
            </h2>
            <p className="text-white/30 text-xs mt-2 font-mono uppercase tracking-widest">{product?.mood ?? product?.subCategory ?? 'Rich Aesthetic'} · {product?.price ?? 'R 289.00'}</p>
          </div>
          {/* Spec pills */}
          <div className="hidden md:flex items-center gap-3">
            {[
              { icon: Box,    label: product?.specs?.module ?? '223mm × 73mm × 9mm' },
              { icon: Layers, label: product?.specs?.coverage ?? '50 tiles / sqm' },
              { icon: Tag,    label: product?.specs?.selection ?? 'Premium Select' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/8 rounded-full">
                <Icon size={12} className="text-white/30" />
                <span className="text-[9px] font-mono text-white/50 uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Gallery ── */}
        <div className="flex gap-4 h-[52vh]">
          {/* Hero shot */}
          <div
            className="flex-1 relative rounded-2xl overflow-hidden cursor-zoom-in group border border-white/5"
            onClick={() => setZoomed(true)}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={primary}
                src={primary}
                alt={product?.name}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55 }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
              <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-80 transition-all duration-300" />
            </div>
            {/* Index badge */}
            <div className="absolute bottom-4 left-4 text-[9px] font-mono text-white/40">
              {activeIdx + 1} / {gallery.length}
            </div>
          </div>

          {/* Thumbnail strip */}
          <div className="flex flex-col gap-3 w-[20%] min-w-[120px] max-w-[160px]">
            {gallery.map((img, i) => (
              <motion.button
                key={img}
                onClick={() => setActiveIdx(i)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex-1 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  i === activeIdx ? 'border-white/40' : 'border-white/5 opacity-50 hover:opacity-80'
                }`}
                style={{ borderColor: i === activeIdx ? accent : undefined }}
              >
                <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                {/* Active dot */}
                {i === activeIdx && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: accent }} />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Navigation arrows + description ── */}
        <div className="flex items-center justify-between">
          <p className="text-white/30 text-sm font-light max-w-sm leading-relaxed">
            {product?.description ?? 'A lush red-clay finish with richer warmth through the face, composed for interiors that need a fuller, more earthen register.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all disabled:opacity-20"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setActiveIdx(i => Math.min(gallery.length - 1, i + 1))}
              disabled={activeIdx === gallery.length - 1}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all disabled:opacity-20"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Lightbox zoom ── */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center cursor-zoom-out"
            onClick={() => setZoomed(false)}
          >
            <motion.img
              src={primary}
              alt=""
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: 'spring', damping: 28 }}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setZoomed(false)}
              className="absolute top-8 right-8 text-white/40 hover:text-white text-[9px] uppercase tracking-widest"
            >
              Close ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
