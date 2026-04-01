import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MoveHorizontal, Wand2 } from 'lucide-react';
import { useVisualLab, useTheme } from './VisualLabContext';

export function TopSellersSection() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeCategory } = useVisualLab();

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  const onInteractionStart = (clientX: number) => {
    setIsDragging(true);
    handleMove(clientX);
  };

  const onInteractionEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = 'auto';
    }
  }, [isDragging]);

  const { primaryColor, textClass: primaryClass } = useTheme();
  
  const borderClassMap: Record<string, string> = {
    'cladding-tiles': 'border-[#22c55e]/30',
    'bricks': 'border-[#eab308]/30',
    'paving': 'border-[#14b8a6]/30',
    'breeze-blocks': 'border-[#ef4444]/30',
  };
  const borderClass = borderClassMap[activeCategory] || borderClassMap['cladding-tiles'];

  return (
    <section id="transform" className="h-[100svh] w-full bg-transparent border-t border-white/5 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Decorative background elements */}
      <div 
        className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: `${primaryColor}15` }}
      />
      
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 flex flex-col items-center"
        >
          <span className={`border ${borderClass} ${primaryClass} text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-2 rounded-full mb-4 backdrop-blur-md`}>
            Signature BTS Selection
          </span>
          <h2 className="text-6xl md:text-8xl font-['Anton'] text-white uppercase tracking-tighter leading-none mb-6">
            TRANSFORM.
          </h2>
          <p className="text-white/40 text-[10px] md:text-xs uppercase tracking-widest max-w-xl leading-relaxed text-center mx-auto">
            Built around premium collections, with finish-led selection, sample support, and a cleaner path back into structural design.
          </p>
        </motion.div>

        {/* Before/After Slider */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          className="relative w-full max-w-4xl max-h-[45vh] aspect-[21/9] rounded-[2rem] overflow-hidden cursor-ew-resize border border-white/10 shadow-2xl mx-auto"
          ref={containerRef}
          onMouseDown={(e) => onInteractionStart(e.clientX)}
          onTouchStart={(e) => onInteractionStart(e.touches[0].clientX)}
          onMouseMove={onMouseMove}
          onTouchMove={onTouchMove}
          onMouseUp={onInteractionEnd}
          onMouseLeave={onInteractionEnd}
          onTouchEnd={onInteractionEnd}
        >
          {/* AFTER Image (Background) */}
          <div className="absolute inset-0 select-none pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop" 
              alt="After - Brick Wall Installation"
              className="w-full h-full object-cover"
              draggable={false}
            />
            {/* Dark gradient overlay to make text pop */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <div className="absolute top-6 right-6 md:top-8 md:right-8 bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 opacity-90">
              <span className={`text-[10px] uppercase font-bold tracking-widest ${primaryClass}`}>
                {activeCategory === 'cladding-tiles' ? 'CONGO INSTALLATION' : activeCategory === 'bricks' ? 'CLAY BRICK FINISH' : activeCategory === 'paving' ? 'PAVING INSTALLATION' : 'BREEZE BLOCK SCREEN'}
              </span>
            </div>
          </div>

          {/* BEFORE Image (Clipped) */}
          <div 
            className="absolute inset-0 select-none pointer-events-none"
            style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
          >
            <img 
              src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop" 
              alt="Before - Plastered Wall"
              className="w-full h-full object-cover grayscale-[0.3]"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <div className="absolute top-6 left-6 md:top-8 md:left-8 bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 opacity-90">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">PLASTERED WALL</span>
            </div>
          </div>

          {/* Slider Handle */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white flex items-center justify-center transition-transform hover:scale-x-150"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#0a0a0a] text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)] border-2 border-white/20 hover:scale-110 transition-transform active:scale-95">
              <MoveHorizontal size={24} className="opacity-60" />
            </div>
          </div>
        </motion.div>

        {/* Call to Action Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <button 
            onClick={() => document.getElementById('visual-lab')?.scrollIntoView({ behavior: 'smooth' })}
            className={`group relative px-10 py-5 bg-white text-black rounded-full overflow-hidden hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(34,197,94,0.2)]`}
          >
            <div 
              className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" 
              style={{ backgroundColor: primaryColor }}
            />
            <div className="relative flex items-center gap-4 font-bold text-xs uppercase tracking-[0.2em] group-hover:text-black transition-colors">
              <Wand2 size={18} />
              Test In Visual Studio
            </div>
          </button>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Upload your own space & visualize instantly</p>
        </motion.div>
      </div>
    </section>
  );
}
