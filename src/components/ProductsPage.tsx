import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { NavigationBar } from './NavigationBar';
import { HeroSection } from './HeroSection';
import { MaterialStorySection } from './MaterialStorySection';
import { DeliveryProcessSection } from './DeliveryProcessSection';
import { ProductJourneySection } from './ProductJourneySection';

import { TechnicalSection } from './TechnicalSection';
import { ShowcaseSection } from './ShowcaseSection';
import { PremiumShowcaseSection } from './PremiumShowcaseSection';
import { TopSellersSection } from './TopSellersSection';
import { CatalogSection } from './CatalogSection';
import { Footer } from './Footer';

import { ProductScene } from './ProductScene';
import Lenis from '@studio-freight/lenis';
import { useVisualLab } from './VisualLabContext';
import { QuoteWizard } from './QuoteWizard';
import { DeliveryWizard } from './DeliveryWizard';
import { CartCheckoutWizard } from './CartCheckoutWizard';
import { ProductDetailsWizard } from './ProductDetailsWizard';

// ── Ordered list of section IDs that participate in snap-scroll ──────────────
// Each receives its own snap stop so the user can interact before moving on.
const SNAP_IDS = [
  'hero',
  'catalog',            // colour moods picker — must be a stop, not skipped
  'product-journey',
  'material-story',
  'delivery-process',
  'technical-spotlight',
  'showcase',
  'transform',
  'premium-showcase',
  'footer',
];

// How long to block re-scroll while Lenis is animating to the target section.
// Keep generous so the scroll feels locked-in, not accidental.
const LOCK_MS = 1350;

export function ProductsPage() {
  const { isEstimating } = useVisualLab();
  const lenisRef = useRef<any>(null);
  const lockRef = useRef(false);
  const isEstimatingRef = useRef(isEstimating);

  // Keep a ref in sync so the wheel callback always has the latest value
  // without needing to remount the event listener on every state change.
  useEffect(() => {
    isEstimatingRef.current = isEstimating;
  }, [isEstimating]);

  // ── Lenis smooth scroll ────────────────────────────────────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,                                         // slightly longer base
      easing: (t: number) => 1 - Math.pow(1 - t, 3),       // smooth cubic ease-out
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

    // Returns the index of whichever snap section's centre is closest to the
    // viewport centre.  Returning -1 means "we're not near any snap section".
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
        // Only consider sections whose edge is within 1.5 viewports of the screen
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
          easing: (t: number) => 1 - Math.pow(1 - t, 4), // snappy ease-out-quart
          offset: 0,
          lock: true,
          force: true,
        });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const onWheel = (e: WheelEvent) => {
      // Never intercept when calculator inputs are visible
      if (isEstimatingRef.current) return;

      // Never intercept horizontal trackpad swipes (deltaX dominant)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Skip if user is scrolling inside a manually-scrollable child
      const target = e.target as HTMLElement;
      if (target.closest('[data-free-scroll]')) return;

      const idx = closestSnapIdx();
      if (idx === -1) return;               // not near any snap zone

      const currentEl = getSection(SNAP_IDS[idx]);
      if (!currentEl) return;

      // Only engage the snap if the current section is at least 35% centred
      // in the viewport — prevents accidental snaps when barely entering a section.
      const rect = currentEl.getBoundingClientRect();
      const overlap = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const visible = overlap / window.innerHeight;
      if (visible < 0.35) return;

      if (lockRef.current) {
        // Snap is mid-flight — absorb the scroll so it doesn't compound
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const dir = e.deltaY > 0 ? 1 : -1;
      const dest = idx + dir;

      if (dest < 0 || dest >= SNAP_IDS.length) return; // already at first/last

      e.preventDefault();
      e.stopPropagation();

      lockRef.current = true;
      scrollTo(SNAP_IDS[dest]);

      setTimeout(() => { lockRef.current = false; }, LOCK_MS + 300);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []); // intentionally no deps — isEstimating is read via ref

  return (
    <div
      id="main-container"
      className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#22c55e] selection:text-white relative"
    >
      <NavigationBar />



      <main className="relative">

        {/* 1 — Hero (eager — above fold) */}
        <HeroSection />

        {/* Below-fold sections */}
        {/* 2 — Colour Moods / Catalogue (snap stop — user picks a tile) */}
        <CatalogSection />

        {/* 3 — Product Journey */}
        <ProductJourneySection />

        <MaterialStorySection />
        <DeliveryProcessSection />
        <TechnicalSection />
        <ShowcaseSection />
        <TopSellersSection />
        <PremiumShowcaseSection />
        
        {/* Footer */}
        <Footer />

        {/* Global Modals for Landing Page */}
        <QuoteWizard />
        <DeliveryWizard />
        <CartCheckoutWizard />
        <ProductDetailsWizard />

      </main>
    </div>
  );
}
