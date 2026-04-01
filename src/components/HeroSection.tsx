import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useVisualLab, useTheme } from './VisualLabContext';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

export function HeroSection() {
  const { activeCategory, setActiveCategory } = useVisualLab();
  const { bgClass } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const arrowContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Pulse animation for the side arrow container moving slightly left and right
    if (arrowContainerRef.current) {
      gsap.to(arrowContainerRef.current, {
        x: -10,
        repeat: -1,
        yoyo: true,
        duration: 1.5,
        ease: 'sine.inOut' // Smooth oscillating pulse backward
      });
    }
  }, []);

  const handleNavigateHome = () => {
    const mainContainer = document.getElementById('main-container');
    if (!mainContainer) {
      navigate('/');
      return;
    }
    
    // Smooth fade out and slide right affect
    gsap.to(mainContainer, {
      opacity: 0,
      x: 100, // Slides slightly to the right to indicate backward momentum
      duration: 0.6,
      ease: 'power3.inOut',
      onComplete: () => {
        navigate('/');
      }
    });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const sectionIndex = Math.round(scrollLeft / clientWidth);
    
    if (sectionIndex === 0 && activeCategory !== 'cladding-tiles') {
      setActiveCategory('cladding-tiles');
    } else if (sectionIndex === 1 && activeCategory !== 'bricks') {
      setActiveCategory('bricks');
    } else if (sectionIndex === 2 && activeCategory !== 'paving') {
      setActiveCategory('paving');
    } else if (sectionIndex === 3 && activeCategory !== 'breeze-blocks') {
      setActiveCategory('breeze-blocks');
    }
  };

  const scrollToSection = (index: number) => {
    if (!scrollContainerRef.current) return;
    const { clientWidth } = scrollContainerRef.current;
    scrollContainerRef.current.scrollTo({
      left: index * clientWidth,
      behavior: 'smooth'
    });
  };

  // Sync scroll position if category changes externally
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const { clientWidth } = scrollContainerRef.current;
    const targetScrollLeft = activeCategory === 'cladding-tiles' ? 0 : activeCategory === 'bricks' ? clientWidth : activeCategory === 'paving' ? clientWidth * 2 : clientWidth * 3;
    
    // Only scroll if we're not already there (to prevent fighting with manual scroll)
    if (Math.abs(scrollContainerRef.current.scrollLeft - targetScrollLeft) > 10) {
      scrollContainerRef.current.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
    }
  }, [activeCategory]);

  return (
    <section id="hero" className="relative w-full h-screen overflow-hidden bg-transparent">
      {/* Background image removed — architectural background provides the visual layer */}

      {/* Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 transition-colors duration-1000 pointer-events-none z-0">
        <div className={`w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full blur-[150px] transition-colors duration-1000 ${bgClass}`}></div>
      </div>

      {/* Horizontal Scroll Container */}
      <div 
        ref={scrollContainerRef}
        className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Section 1: Cladding Tiles */}
        <div className="w-screen h-screen shrink-0 snap-center flex flex-col items-center justify-center relative">
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 z-20">
            <h2 className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-[#22c55e]">
              BRICK TILE SHOP
            </h2>
          </div>
          <div className="absolute bottom-32 md:bottom-40 left-1/2 -translate-x-1/2 z-20">
            <div className="px-6 py-2 rounded-full border border-white/10 bg-black/50 backdrop-blur-md">
              <span className="text-white text-xs md:text-sm font-bold tracking-widest uppercase">
                BRICK TILE SHOP TILE
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Bricks */}
        <div className="w-screen h-screen shrink-0 snap-center flex flex-col items-center justify-center relative">
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 z-20">
            <h2 className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-[#eab308]">
              BRICK TILE SHOP
            </h2>
          </div>
          <div className="absolute bottom-32 md:bottom-40 left-1/2 -translate-x-1/2 z-20">
            <div className="px-6 py-2 rounded-full border border-white/10 bg-black/50 backdrop-blur-md">
              <span className="text-white text-xs md:text-sm font-bold tracking-widest uppercase">
                BRICK TILE SHOP BRICK
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Paving */}
        <div className="w-screen h-screen shrink-0 snap-center flex flex-col items-center justify-center relative">
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 z-20">
            <h2 className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-[#14b8a6]">
              BRICK TILE SHOP
            </h2>
          </div>
          <div className="absolute bottom-32 md:bottom-40 left-1/2 -translate-x-1/2 z-20">
            <div className="px-6 py-2 rounded-full border border-white/10 bg-black/50 backdrop-blur-md">
              <span className="text-white text-xs md:text-sm font-bold tracking-widest uppercase">
                BRICK TILE SHOP PAVING
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Breeze Blocks */}
        <div className="w-screen h-screen shrink-0 snap-center flex flex-col items-center justify-center relative">
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 z-20">
            <h2 className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-[#ef4444]">
              BRICK TILE SHOP
            </h2>
          </div>
          <div className="absolute bottom-32 md:bottom-40 left-1/2 -translate-x-1/2 z-20">
            <div className="px-6 py-2 rounded-full border border-white/10 bg-black/50 backdrop-blur-md">
              <span className="text-white text-xs md:text-sm font-bold tracking-widest uppercase">
                BREEZE BLOCKS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Controls */}
      <div className="absolute bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-6 w-full px-4 pointer-events-none">
        {/* Category Toggle */}
        <div className="flex items-center gap-4 pointer-events-auto">
          <button 
            onClick={() => {
              const currentIndex = activeCategory === 'cladding-tiles' ? 0 : activeCategory === 'bricks' ? 1 : activeCategory === 'paving' ? 2 : 3;
              scrollToSection(Math.max(0, currentIndex - 1));
            }}
            className={`w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-colors bg-black/50 backdrop-blur-md hover:border-white hover:text-white text-white/50`}
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center rounded-full border border-white/20 bg-black/50 backdrop-blur-md overflow-hidden p-1">
            <button 
              onClick={() => scrollToSection(0)}
              className={`px-6 py-2 text-xs font-bold tracking-widest uppercase rounded-full transition-colors ${
                activeCategory === 'cladding-tiles' 
                  ? 'bg-transparent text-[#22c55e]' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              CLADDING TILES
            </button>
            <button 
              onClick={() => scrollToSection(1)}
              className={`px-6 py-2 text-xs font-bold tracking-widest uppercase rounded-full transition-colors ${
                activeCategory === 'bricks' 
                  ? 'bg-transparent text-[#eab308]' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              BRICKS
            </button>
            <button 
              onClick={() => scrollToSection(2)}
              className={`px-6 py-2 text-xs font-bold tracking-widest uppercase rounded-full transition-colors ${
                activeCategory === 'paving' 
                  ? 'bg-transparent text-[#14b8a6]' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              PAVING
            </button>
            <button 
              onClick={() => scrollToSection(3)}
              className={`px-6 py-2 text-xs font-bold tracking-widest uppercase rounded-full transition-colors ${
                activeCategory === 'breeze-blocks' 
                  ? 'bg-transparent text-[#ef4444]' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              BREEZE BLOCKS
            </button>
          </div>

          <button 
            onClick={() => {
              const currentIndex = activeCategory === 'cladding-tiles' ? 0 : activeCategory === 'bricks' ? 1 : activeCategory === 'paving' ? 2 : 3;
              scrollToSection(Math.min(3, currentIndex + 1));
            }}
            className={`w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-colors bg-black/50 backdrop-blur-md hover:border-white hover:text-white text-white/50`}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Scroll Hint */}
        <p className="text-[10px] md:text-xs text-white/40 tracking-widest uppercase mt-2 text-center pointer-events-auto">
          SCROLL TO BROWSE THE {
            activeCategory === 'cladding-tiles' ? 'CLADDING TILES' : 
            activeCategory === 'bricks' ? 'BRICKS' : 
            activeCategory === 'paving' ? 'PAVING' :
            'BREEZE BLOCKS'
          } SELECTION BOARD
        </p>
      </div>

      {/* Persistent Pulsing Left Navigation Arrow to Return Home */}
      <div 
        className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-40"
        ref={arrowContainerRef}
      >
        <button 
          onClick={handleNavigateHome}
          className="group flex flex-col items-center justify-center gap-3 opacity-70 hover:opacity-100 transition-opacity"
        >
          <div className="w-16 h-16 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl flex items-center justify-center relative overflow-hidden">
            {/* Soft inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <ChevronLeft size={32} className="text-white relative z-10" />
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/50 group-hover:text-white/80 transition-colors" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Return Home
          </span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </section>
  );
}
