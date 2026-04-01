import React from 'react';
import { productData } from '../catalog/productData';
import { ArrowLeft } from 'lucide-react';
import { useVisualLab, useTheme } from './VisualLabContext';
import { Link } from 'react-router-dom';

export function VisualLabSection() {
  const { visualLab } = productData;
  const {
    activeCategory,
    activeGrout, setActiveGrout,
    activeLayout, setActiveLayout,
    activeLighting, setActiveLighting,
    setIsCustomizeMode
  } = useVisualLab();

  const {
    primaryColor: activeColor,
    textClass: activeColorClass,
    borderClass: activeBorderClass,
    bgClass: activeBgClass,
    hoverTextClass,
    hoverBorderClass
  } = useTheme();

  const activeGroutColor = visualLab.groutColors.find(g => g.id === activeGrout)?.hex || '#e5e5e5';

  // Lighting overlay styles
  const getLightingOverlay = () => {
    if (activeLighting === 'daylight') {
      return 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.5) 100%)';
    }
    if (activeLighting === 'interior') {
      return 'radial-gradient(circle at 70% 50%, rgba(210,140,80,0.25) 0%, rgba(20,10,5,0.85) 100%)';
    }
    return 'none';
  };

  return (
    <section id="visual-lab" className="relative w-full min-h-screen bg-[#050505] flex flex-col md:flex-row">
      {/* Left Control Panel */}
      <div className="w-full md:w-[400px] bg-[#0a0a0a] border-r border-white/5 p-8 md:p-12 flex flex-col z-20 h-auto md:h-screen md:sticky top-0 overflow-y-auto shrink-0">

        <button
          className={`flex items-center gap-2 text-white/50 text-xs tracking-widest uppercase mb-12 transition-colors w-fit ${hoverTextClass}`}
          onClick={() => {
            setIsCustomizeMode(false);
            window.scrollTo(0, 0);
          }}
        >
          <ArrowLeft size={14} /> BACK TO SHOP
        </button>

        <h2 className="text-4xl font-['Anton'] text-white uppercase tracking-tighter leading-none mb-2">
          DESIGN YOUR<br />LEGACY
        </h2>
        <p className="text-sm text-white/50 mb-12">{visualLab.subtitle}</p>

        {/* Grout Color */}
        <div className="mb-10">
          <h3 className="text-[10px] text-white/40 tracking-widest uppercase mb-4">GROUT COLOR</h3>
          <div className="flex gap-4">
            {visualLab.groutColors.map(color => (
              <button
                key={color.id}
                onClick={() => setActiveGrout(color.id)}
                className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeGrout === color.id ? 'scale-110' : 'hover:scale-105'}`}
                title={color.name}
              >
                <span
                  className={`absolute inset-0 rounded-full border-2 transition-all ${activeGrout === color.id ? activeBorderClass : `border-transparent group-hover:${activeBorderClass}/50`}`}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span
                  className="w-full h-full rounded-full shadow-inner"
                  style={{ backgroundColor: color.hex }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div className="mb-10">
          <h3 className="text-[10px] text-white/40 tracking-widest uppercase mb-4">LAYOUT PATTERN</h3>
          <div className="grid grid-cols-2 gap-3">
            {visualLab.layouts.map(layout => (
              <button
                key={layout.id}
                onClick={() => setActiveLayout(layout.id)}
                className={`py-4 px-4 text-xs font-bold tracking-widest uppercase border transition-all ${activeLayout === layout.id ? `${activeBgClass} text-black ${activeBorderClass}` : `bg-transparent text-white/40 border-white/10 ${hoverBorderClass} ${hoverTextClass}`}`}
              >
                {layout.name}
              </button>
            ))}
          </div>
        </div>

        {/* Lighting */}
        <div className="mb-12">
          <h3 className="text-[10px] text-white/40 tracking-widest uppercase mb-4">LIGHTING ENVIRONMENT</h3>
          <div className="grid grid-cols-2 gap-3">
            {visualLab.lighting?.map(light => (
              <button
                key={light.id}
                onClick={() => setActiveLighting(light.id)}
                className={`py-4 px-4 text-xs font-bold tracking-widest uppercase border transition-all ${activeLighting === light.id ? `${activeBgClass} text-black ${activeBorderClass}` : `bg-transparent text-white/40 border-white/10 ${hoverBorderClass} ${hoverTextClass}`}`}
              >
                {light.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <button className={`w-full text-white py-5 text-sm font-bold tracking-widest uppercase transition-colors shadow-[0_0_30px_rgba(34,197,94,0.3)] ${activeBgClass} hover:opacity-80`} style={{ boxShadow: `0 0 30px ${activeColor}4d` }}>
            ADD TO COLLECTION
          </button>
          <Link
            to="/customize"
            className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all text-white/60 hover:text-white"
          >
            Open in Full Studio
          </Link>
        </div>
      </div>

      {/* Right Preview Area */}
      <div className="flex-1 relative z-0 min-h-[60vh] md:min-h-screen overflow-hidden flex items-center justify-center bg-neutral-900">

        {/* Background Grout Color */}
        <div
          className="absolute inset-0 transition-colors duration-700 ease-in-out"
          style={{ backgroundColor: activeGroutColor }}
        />

        {/* Lighting Overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none mix-blend-multiply transition-all duration-1000 ease-in-out"
          style={{ background: getLightingOverlay() }}
        />

        {/* Specular Highlight Overlay for Daylight */}
        <div
          className={`absolute inset-0 z-10 pointer-events-none mix-blend-overlay transition-opacity duration-1000 ease-in-out ${activeLighting === 'daylight' ? 'opacity-40' : 'opacity-0'}`}
          style={{ background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)' }}
        />

        <div className="absolute top-8 right-8 z-20 text-right pointer-events-none mix-blend-overlay opacity-50">
          <h2 className="text-6xl md:text-8xl font-['Anton'] text-white uppercase tracking-tighter leading-none">CUSTOM</h2>
          <p className="text-white text-xs tracking-[0.3em] uppercase">LAB EDITION</p>
        </div>

        {/* CSS Wall Preview */}
        <div className="w-[150%] h-[150%] transform -rotate-6 scale-110 pointer-events-none flex flex-col justify-center">
          {Array.from({ length: 24 }).map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="flex whitespace-nowrap mb-[8px] transition-all duration-700 ease-in-out"
              style={{
                marginLeft: activeLayout === 'stretcher' && rowIdx % 2 !== 0 ? '-110px' : '0'
              }}
            >
              {Array.from({ length: 16 }).map((_, colIdx) => {
                // Pseudo-random based on indices for stable rendering
                const seed = (rowIdx * 16 + colIdx);
                const pseudoRandom = (Math.sin(seed) + 1) / 2;
                const pseudoRandom2 = (Math.cos(seed) + 1) / 2;

                // Earthy clay/charcoal palette variations
                const lightness = 18 + (pseudoRandom * 12);
                const hue = 20 + (pseudoRandom2 * 6);
                const saturation = 35 + (pseudoRandom * 10);

                return (
                  <div
                    key={colIdx}
                    className="w-[220px] h-[65px] mr-[8px] rounded-[2px] relative overflow-hidden"
                    style={{
                      backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
                      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.05), inset 0 -2px 6px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.3)'
                    }}
                  >
                    {/* Brick Texture Overlay */}
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'
                    }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
