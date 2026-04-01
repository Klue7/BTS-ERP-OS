import React, { useRef, useEffect } from 'react';
import { Truck, PackageCheck, Clock, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useVisualLab, useTheme } from './VisualLabContext';

gsap.registerPlugin(ScrollTrigger);

export function DeliveryProcessSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { selectedCatalogItem, setIsDeliveryWizardOpen } = useVisualLab();
  const { primaryColor: accentColor, textClass, bgClass, borderClass } = useTheme();
  const productLabel = selectedCatalogItem?.name ?? 'Brick Tile';
  const productColor = accentColor;

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo('.delivery-stagger', 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="delivery-process" ref={sectionRef} className="relative w-full min-h-screen bg-transparent flex items-end md:items-center overflow-hidden pb-32 pt-24 md:py-24">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10 flex justify-end">
        <div ref={contentRef} className="w-full md:w-1/2 flex flex-col justify-center">
          
          <div className="delivery-stagger inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md w-fit mb-8">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: productColor }} />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/70">
              {productLabel} · Direct to Site
            </span>
          </div>

          <h2 className="delivery-stagger text-5xl md:text-7xl font-serif font-bold text-white tracking-tight leading-[1.1] mb-12 uppercase">
            Seamless <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Delivery</span>
          </h2>

          <div className="space-y-10">
            <div className="delivery-stagger flex items-start gap-6 group">
              <div 
                className="w-12 h-12 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors"
                style={{ backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}33` }}
              >
                <PackageCheck size={20} style={{ color: accentColor }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">1. Order Processing</h3>
                <p className="text-white/50 leading-relaxed text-sm md:text-base">
                  Once your quote is approved, our team immediately begins preparing your custom brick tile order, ensuring every piece meets our stringent quality standards.
                </p>
              </div>
            </div>

            <div className="delivery-stagger flex items-start gap-6 group">
              <div 
                className="w-12 h-12 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors"
                style={{ backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}33` }}
              >
                <Truck size={20} style={{ color: accentColor }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">2. Secure Dispatch</h3>
                <p className="text-white/50 leading-relaxed text-sm md:text-base">
                  Tiles are carefully packed into reinforced, shock-absorbent crates designed specifically for heavy masonry transport to prevent any transit damage.
                </p>
              </div>
            </div>

            <div className="delivery-stagger flex items-start gap-6 group">
              <div 
                className="w-12 h-12 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors"
                style={{ backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}33` }}
              >
                <Clock size={20} style={{ color: accentColor }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">3. Site Arrival</h3>
                <p className="text-white/50 leading-relaxed text-sm md:text-base">
                  Delivered directly to your project site with specialized offloading equipment, ready for immediate installation by your masonry team.
                </p>
              </div>
            </div>

            <div className="delivery-stagger flex items-center gap-4 mt-10 flex-wrap">
              <button
                onClick={() => setIsDeliveryWizardOpen(true)}
                className="px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-[#050505] transition-transform hover:scale-105"
                style={{ backgroundColor: accentColor }}
              >
                Calculate Delivery Costs
              </button>

              <button
                onClick={() => setIsDeliveryWizardOpen(true)}
                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest border ${borderClass}/30 text-white/60 hover:text-white hover:${borderClass}/60 transition-all`}
              >
                Receive a Quote <ArrowRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
