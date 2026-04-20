import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin } from 'lucide-react';
import { useVisualLab, useTheme } from './VisualLabContext';
import { useStorefrontCategoryData } from '../catalog/storefrontData';

export const SOUTH_AFRICAN_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
];

interface RegionSelectorProps {
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  fulfillment: string; // 'delivery' | 'collection' | ''
}

export function RegionSelector({ selectedRegion, setSelectedRegion, fulfillment }: RegionSelectorProps) {
  const { activeCategory, selectedCatalogItem, setSelectedCatalogItem } = useVisualLab();
  const { primaryColor, textClass } = useTheme();
  const { categoryData } = useStorefrontCategoryData(activeCategory);
  
  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  // Find alternatives logic
  const showAlternatives = selectedRegion && 
                           selectedCatalogItem?.region && 
                           selectedCatalogItem.region !== selectedRegion;
                           
  const alternatives = (categoryData?.catalog || [])
    .filter((c: any) => c.region === selectedRegion)
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {SOUTH_AFRICAN_PROVINCES.map((r) => {
          const isSelected = selectedRegion === r;
          return (
            <motion.button 
              key={r}
              variants={itemVariants}
              onClick={() => setSelectedRegion(r)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border text-center transition-all duration-300 relative overflow-hidden group ${
                isSelected ? 'bg-white/10 text-white' : 'border-white/10 text-white/50 hover:bg-white/[0.04] bg-white/[0.01] backdrop-blur-md'
              }`}
              style={{
                borderColor: isSelected ? primaryColor : undefined,
                boxShadow: isSelected ? `0 0 15px ${primaryColor}33` : undefined
              }}
            >
              {/* Subtle glow effect on selected */}
              {isSelected && (
                <div 
                  className="absolute inset-0 opacity-20" 
                  style={{ background: `linear-gradient(to bottom right, ${primaryColor}, transparent)` }}
                />
              )}
              <span className={`relative text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-white' : 'group-hover:text-white/80'}`}>
                {r}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {showAlternatives && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.95 }} 
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="overflow-hidden"
          >
            <div 
              className="mt-6 p-5 md:p-6 border rounded-2xl relative shadow-lg backdrop-blur-xl"
              style={{ borderColor: `${primaryColor}4D`, backgroundColor: `${primaryColor}0D` }}
            >
               <div 
                 className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" 
                 style={{ backgroundColor: primaryColor }}
               />
               <h5 className={`text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${textClass}`}>
                 <MapPin size={16} /> Save on Logistics
               </h5>
               <p className="text-white/70 text-xs leading-relaxed mb-4 font-light pr-4">
                 Your selected product is manufactured in <span className="font-semibold text-white">{selectedCatalogItem.region}</span>. We found premium alternatives in <span className="font-semibold" style={{ color: primaryColor }}>{selectedRegion}</span> that will save you substantial {fulfillment === 'delivery' ? 'delivery' : 'collection'} costs.
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {alternatives.map((alt: any) => (
                    <motion.button 
                      key={alt.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCatalogItem(alt)}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl text-left transition-colors group flex items-center gap-3 backdrop-blur-sm"
                      style={{ '--hover-border': primaryColor } as React.CSSProperties}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${primaryColor}80`)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    >
                      <img src={alt.images?.[0]} alt={alt.name} className="w-12 h-12 rounded-lg object-cover shadow-md" />
                      <div className="flex-1 overflow-hidden">
                        <div className="text-sm text-white font-bold truncate whitespace-nowrap overflow-hidden text-ellipsis">{alt.name}</div>
                        <div className="text-[9px] uppercase tracking-widest transition-colors mt-0.5 font-semibold flex items-center gap-1" style={{ color: primaryColor, opacity: 0.7 }} onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}>
                          Switch Product <span className="text-white/30 group-hover:text-white transition-colors">→</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                 {alternatives.length === 0 && (
                   <div className="col-span-full py-2 px-3 text-xs text-white/40 italic bg-black/20 rounded-lg inline-block w-fit border border-white/5">
                     No exact regional alternatives found in this category.
                   </div>
                 )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
