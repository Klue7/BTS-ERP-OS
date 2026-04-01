import React, { useEffect, useRef } from 'react';
import { NavigationBar } from './NavigationBar';
import { HomeHeroSection } from './HomeHeroSection';
import { CatalogSection } from './CatalogSection';
import { Footer } from './Footer';
import Lenis from '@studio-freight/lenis';
import { useVisualLab } from './VisualLabContext';

import { QuoteWizard } from './QuoteWizard';
import { DeliveryWizard } from './DeliveryWizard';
import { CartCheckoutWizard } from './CartCheckoutWizard';
import { ProductDetailsWizard } from './ProductDetailsWizard';

const SNAP_IDS = [
  'hero',
  'catalog',
  'footer'
];

const LOCK_MS = 1350;

export function HomeLandingPage() {
  const { isEstimating } = useVisualLab();
  const lenisRef = useRef<any>(null);
  const lockRef = useRef(false);
  const isEstimatingRef = useRef(isEstimating);

  useEffect(() => {
    isEstimatingRef.current = isEstimating;
  }, [isEstimating]);

  // ── Lenis smooth scroll ────────────────────────────────────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.8,
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // ── Section-snap wheel controller ─────────────────────────────────────────
  useEffect(() => {
    const getSection = (id: string) => document.getElementById(id);

    const closestSnapIdx = (): number => {
      const midVP = window.innerHeight / 2;
      let best = -1;
      let bestDist = Infinity;

      SNAP_IDS.forEach((id, i) => {
        const el = getSection(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const elMid = rect.top + rect.height / 2;
        const dist = Math.abs(elMid - midVP);
        if (dist < window.innerHeight * 1.5 && dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    };

    const scrollTo = (id: string) => {
      const el = getSection(id);
      if (!el) return;

      if (lenisRef.current) {
        lenisRef.current.scrollTo(el, {
          duration: LOCK_MS / 1000,
          easing: (t: number) => 1 - Math.pow(1 - t, 4),
          offset: 0,
          lock: true,
          force: true,
        });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (isEstimatingRef.current) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const target = e.target as HTMLElement;
      if (target.closest('[data-free-scroll]')) return;

      const idx = closestSnapIdx();
      if (idx === -1) return;

      const currentEl = getSection(SNAP_IDS[idx]);
      if (!currentEl) return;

      const rect = currentEl.getBoundingClientRect();
      const overlap = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      if (overlap / window.innerHeight < 0.35) return;

      if (lockRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const dir = e.deltaY > 0 ? 1 : -1;
      const dest = idx + dir;

      if (dest < 0 || dest >= SNAP_IDS.length) return;

      e.preventDefault();
      e.stopPropagation();

      lockRef.current = true;
      scrollTo(SNAP_IDS[dest]);

      setTimeout(() => { lockRef.current = false; }, LOCK_MS + 300);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div id="main-container" className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#22c55e] selection:text-white relative">
      <NavigationBar />
      
      <main className="relative">
        <div id="hero" className="pt-20 relative">
          <HomeHeroSection />
        </div>

        <CatalogSection />
      </main>
      
      <div id="footer">
        <Footer />
      </div>

      {/* Global Modals for Catalogue interactions */}
      <QuoteWizard />
      <DeliveryWizard />
      <CartCheckoutWizard />
      <ProductDetailsWizard />
    </div>
  );
}
