import React from 'react';
import { motion } from 'motion/react';
import { useVisualLab } from './VisualLabContext';
import { useStorefrontCategoryData } from '../catalog/storefrontData';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  computeProductQuoteRates,
  getPricingUnitLabel,
} from '../pricing/quoteEngine';
import { usePublicMarketingBlueprint } from '../marketing/usePublicMarketingBlueprints';
import {
  getBlueprintSlot,
  resolveBlueprintAccentColor,
  resolveBlueprintBackdropClasses,
  resolveBlueprintPanelClasses,
  resolveSlotMaxWidth,
} from '../marketing/publicBlueprintTheme';

export function ProductJourneySection() {
  const { activeCategory, selectedCatalogItem, setSelectedCatalogItem, setIsQuoteWizardOpen, setIsProductDetailsOpen } = useVisualLab();
  const { categoryData } = useStorefrontCategoryData(activeCategory);
  const { blueprint: publicJourneyBlueprint } = usePublicMarketingBlueprint('products.journey');
  
  // Fallback to first item if none selected
  const items = categoryData.catalog;
  const currentItem = selectedCatalogItem || items[0];
  const currentJourneyLabel = currentItem?.mood || currentItem?.subCategory || 'SIGNATURE';
  const currentRates = currentItem?.quoteModel ? computeProductQuoteRates(currentItem.quoteModel) : null;
  const primaryUnitLabel = currentItem?.quoteModel
    ? getPricingUnitLabel(currentItem.quoteModel.pricingUnit, currentItem.quoteModel.categoryKey, 1)
    : 'unit';
  const packagingDetail = currentItem?.quoteModel
    ? currentItem.quoteModel.categoryKey === 'cladding-tiles'
      ? `1 BOX = 1 M² • ${currentRates?.boxesPerPallet ?? 40} BOXES / PALLET • ${Math.round(currentRates?.piecesPerBox ?? currentItem.quoteModel.unitsPerM2)} TILES / BOX`
      : `${Math.round(currentItem.quoteModel.unitsPerM2)} ${getPricingUnitLabel('piece', currentItem.quoteModel.categoryKey, 2).toUpperCase()} / M² • ${currentItem.quoteModel.piecesPerPallet} ${getPricingUnitLabel('piece', currentItem.quoteModel.categoryKey, 2).toUpperCase()} / PALLET`
    : activeCategory === 'bricks'
      ? '55 BRICKS / M² • 500 BRICKS / PALLET'
      : '1 BOX = 1 M² • 40 BOXES / PALLET';
  
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
  const accentColor = resolveBlueprintAccentColor(publicJourneyBlueprint);
  const overlayClasses = resolveBlueprintBackdropClasses(publicJourneyBlueprint);
  const panelClasses = resolveBlueprintPanelClasses(publicJourneyBlueprint);
  const titleSlot = getBlueprintSlot(publicJourneyBlueprint?.blueprintConfig, 'title');
  const copySlot = getBlueprintSlot(publicJourneyBlueprint?.blueprintConfig, 'copy');
  const showCollectionLabel = publicJourneyBlueprint?.blueprintConfig.behavior.showCollectionLabel ?? true;
  const showPrice = publicJourneyBlueprint?.blueprintConfig.behavior.showPrice ?? true;
  const showSpecStrip = publicJourneyBlueprint?.blueprintConfig.behavior.showSpecStrip ?? true;
  const showCta = publicJourneyBlueprint?.blueprintConfig.behavior.showCta ?? true;
  const titleMaxWidth = resolveSlotMaxWidth(titleSlot, 26);
  const copyMaxWidth = resolveSlotMaxWidth(copySlot, 22);

  return (
    <section id="product-journey" className="relative w-full h-screen bg-transparent flex items-center overflow-hidden">
      
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{
         backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
         backgroundSize: '100px 100px'
      }} />
      <div className={`absolute inset-0 z-0 pointer-events-none opacity-90 ${overlayClasses}`} />

      <div className="container mx-auto px-6 md:px-16 relative z-10 w-full h-full flex items-center">

        {/* Master Plan Tech Detail (Top Left Decorative) */}
        <div className="absolute top-24 left-6 md:left-16 pointer-events-none opacity-50 hidden md:block">
           <div className="text-[8px] font-mono mb-2 uppercase tracking-widest" style={{ color: accentColor }}>MASTER PLAN V.03</div>
           <div className="w-[120px] h-px" style={{ backgroundColor: `${accentColor}4d` }} />
           <div className="w-px h-[40px]" style={{ backgroundColor: `${accentColor}4d` }} />
           <div className="w-[40px] h-px" style={{ backgroundColor: `${accentColor}4d` }} />
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
                {showCollectionLabel ? (
                  <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: accentColor }}>
                    BRICK TILE SHOP {currentJourneyLabel} FINISH
                  </span>
                ) : (
                  <span className="text-[9px] font-black tracking-widest uppercase text-white/35">
                    BRICK TILE SHOP PRODUCT JOURNEY
                  </span>
                )}
                <div className="flex-1 h-px max-w-[120px]" style={{ backgroundImage: `linear-gradient(to right, ${accentColor}80, transparent)` }} />
              </div>
              
              <div className="space-y-2 mt-4">
                 <h2
                   className="text-6xl md:text-8xl font-['Anton'] uppercase text-white tracking-widest leading-none"
                   style={{ textShadow: '0 0 40px rgba(255,255,255,0.1)', maxWidth: titleMaxWidth }}
                 >
                  {currentItem?.name}
                 </h2>
                 <div className="text-[10px] font-black tracking-widest uppercase text-white/50 pt-2">
                   {activeCategory === 'bricks' ? 'STRUCTURAL BRICKS' : 'THIN BRICK TILES'}
                 </div>
              </div>

              <p className="text-xs md:text-sm text-white/60 leading-relaxed font-medium mt-4" style={{ maxWidth: copyMaxWidth }}>
                {currentItem?.description || 'Deep wine-red tones that bring a luxurious warmth to any architectural project.'}
              </p>

              {showPrice ? (
                <div className="space-y-1 pt-8 border-t inline-block w-full max-w-sm mt-8" style={{ borderColor: `${accentColor}1f` }}>
                  <div className="text-[9px] font-black tracking-widest uppercase mb-1" style={{ color: accentColor }}>
                    SELLING PRICE
                  </div>
                  <div className="flex justify-between items-baseline mb-2">
                     <div className="flex items-start" style={{ color: accentColor }}>
                       <span className="text-xl font-bold mt-1.5 mr-1">R</span>
                       <span className="text-5xl md:text-6xl font-['Anton'] tracking-wider">{currentItem?.quoteModel?.sellPriceZar?.toFixed(2) ?? '0.00'}</span>
                     </div>
                  </div>
                  {showSpecStrip ? (
                    <div className="text-[8px] font-medium tracking-[0.2em] uppercase text-white/30 leading-relaxed">
                      INCL VAT • SOLD PER {primaryUnitLabel.toUpperCase()}<br/>
                      {packagingDetail}<br/>
                      FORMAT {currentItem?.specs?.module?.toUpperCase().replace(/X/g, '•') || '220•73•9MM'}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </motion.div>
          </div>

          {/* Right Content (Empty space for centered 3D object on desktop, handled by absolute pos below) */}
          <div className="hidden md:block h-[400px]"></div>
        </div>

        {/* Centered Action Buttons (Positioned below the 3D Tile explicitly) */}
        {showCta ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 z-20 pointer-events-auto"
          >
            <button 
              onClick={() => setIsProductDetailsOpen(true)}
              className="px-12 py-5 text-black font-black text-[12px] uppercase tracking-[0.2em] rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 30px ${accentColor}59`,
              }}
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
        ) : null}

        {/* Bottom Right Tracker Box matching Image #3 perfectly */}
        <div className={`absolute bottom-12 right-6 md:right-16 z-20 pointer-events-auto border p-6 w-[280px] ${panelClasses}`}>
           {/* Decorative dashed corner */}
           <div className="absolute top-0 right-0 w-4 h-4 border-t border-r" style={{ borderColor: `${accentColor}80` }} />
           <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l" style={{ borderColor: `${accentColor}80` }} />

           <div className="text-[8px] font-black mb-6 uppercase tracking-widest" style={{ color: accentColor }}>
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
                         className={`h-1 rounded-full transition-all duration-500 ease-out ${item.id === currentItem.id ? 'w-3' : 'w-1 bg-white/10'}`}
                         style={item.id === currentItem.id ? { backgroundColor: accentColor } : undefined}
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
