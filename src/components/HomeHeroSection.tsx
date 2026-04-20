import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { CommunitySignupWizard } from './CommunitySignupWizard';
import { HomeLogoScene } from './HomeLogoScene';
import { usePublicMarketingBlueprint } from '../marketing/usePublicMarketingBlueprints';
import {
  getBlueprintSlot,
  resolveBlueprintAccentColor,
  resolveBlueprintBackdropClasses,
  resolveBlueprintHeadingClasses,
  resolveBlueprintPanelClasses,
  resolveSlotMaxWidth,
} from '../marketing/publicBlueprintTheme';

export function HomeHeroSection() {
  const navigate = useNavigate();
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const arrowContainerRef = useRef<HTMLDivElement>(null);
  const { blueprint: publicHeroBlueprint } = usePublicMarketingBlueprint('home.hero');

  const accentColor = resolveBlueprintAccentColor(publicHeroBlueprint);
  const panelClasses = resolveBlueprintPanelClasses(publicHeroBlueprint);
  const backdropClasses = resolveBlueprintBackdropClasses(publicHeroBlueprint);
  const headingClasses = resolveBlueprintHeadingClasses(publicHeroBlueprint);
  const titleSlot = getBlueprintSlot(publicHeroBlueprint?.blueprintConfig, 'title');
  const copySlot = getBlueprintSlot(publicHeroBlueprint?.blueprintConfig, 'copy');
  const collectionSlot = getBlueprintSlot(publicHeroBlueprint?.blueprintConfig, 'collection');
  const showCopy = copySlot?.enabled ?? true;
  const showCollectionLabels =
    publicHeroBlueprint?.blueprintConfig.behavior.showCollectionLabel ?? Boolean(collectionSlot);
  const showCta = publicHeroBlueprint?.blueprintConfig.behavior.showCta ?? true;
  const heroCopyMaxWidth = resolveSlotMaxWidth(copySlot, 30);
  const heroTitleMaxWidth = resolveSlotMaxWidth(titleSlot, 34);

  useEffect(() => {
    if (arrowContainerRef.current) {
      gsap.to(arrowContainerRef.current, {
        x: 10,
        repeat: -1,
        yoyo: true,
        duration: 1.5,
        ease: 'sine.inOut',
      });
    }
  }, []);

  const handleNavigate = (path: string) => {
    if (!containerRef.current) { navigate(path); return; }
    gsap.to(containerRef.current, {
      opacity: 0, x: -100, duration: 0.6, ease: 'power3.inOut',
      onComplete: () => navigate(path),
    });
  };

  return (
    <>
      <section
        ref={containerRef}
        className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#050505]"
      >
        <div className={`pointer-events-none absolute inset-0 z-0 ${backdropClasses}`} />
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-6 pb-12 pt-28 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.15 }}
            className={`relative max-w-[24rem] rounded-[28px] border px-5 py-6 md:max-w-[30rem] md:px-6 md:py-7 lg:absolute lg:left-16 lg:top-[21%] xl:left-20 ${panelClasses}`}
          >
            <div
              className="inline-flex items-center gap-2 rounded-full border bg-white/[0.03] px-3 py-1.5 shadow-sm"
              style={{ borderColor: `${accentColor}2b` }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/60">
                Premium Architectural Community
              </span>
            </div>

            <h1
              className={`mt-6 text-3xl leading-[1.02] text-white drop-shadow-2xl md:text-5xl xl:text-6xl ${headingClasses}`}
              style={{ maxWidth: heroTitleMaxWidth }}
            >
              Where South Africa&apos;s
              <span className="mt-2 block font-semibold text-stone-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.18)]">
                Architectural Logic
              </span>
              <span className="mt-2 block">
                and Creative Design Meets
              </span>
            </h1>

            {showCopy ? (
              <p className="mt-6 text-sm leading-7 text-white/68 md:text-base" style={{ maxWidth: heroCopyMaxWidth }}>
                Premium cladding, bricks, paving and blocks shaped for architects, designers, developers and premium residential builds.
              </p>
            ) : null}

            {showCollectionLabels ? (
              <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                {['Cladding', 'Bricks', 'Paving', 'Blocks'].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border bg-white/[0.02] px-3 py-2"
                    style={{ borderColor: `${accentColor}1f` }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
          </motion.div>

          <div className="flex flex-1 items-center justify-center lg:absolute lg:inset-0 lg:pt-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotateY: 15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.25 }}
              className="pointer-events-none flex w-full max-w-[980px] flex-col items-center lg:translate-x-14 xl:translate-x-20"
            >
              <div className="pointer-events-auto h-[36vh] min-h-[250px] w-full md:h-[42vh] lg:h-[48vh] xl:h-[52vh]">
                <HomeLogoScene />
              </div>

              {showCta ? (
                <motion.button
                  onClick={() => setIsSignupOpen(true)}
                  animate={{
                    scale: [1, 1.02, 1],
                    boxShadow: [
                      '0px 0px 15px rgba(214,211,209,0.1)',
                      `0px 0px 30px ${accentColor}55`,
                      '0px 0px 15px rgba(214,211,209,0.1)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group pointer-events-auto relative mt-4 overflow-hidden rounded-xl border px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] shadow-xl transition-all duration-300 hover:border-white hover:shadow-2xl md:mt-6"
                  style={{
                    backgroundColor: accentColor,
                    borderColor: `${accentColor}55`,
                    color: accentColor === '#d6d3d1' ? '#111111' : '#03150a',
                  }}
                >
                  <div className="absolute inset-0 -translate-x-full skew-x-12 bg-white/40 transition-transform duration-700 ease-in-out pointer-events-none group-hover:translate-x-[200%]" />
                  <span className="relative z-10">Join the Community</span>
                </motion.button>
              ) : null}
            </motion.div>
          </div>
        </div>

        {/* ── Right-side "Enter Products" pulsing arrow ── */}
        <div
          className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 z-20"
          ref={arrowContainerRef}
        >
          <button
            onClick={() => handleNavigate('/products')}
            className="group flex flex-col items-center justify-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300"
          >
            <div
              className="w-14 h-14 rounded-full border bg-white/[0.03] backdrop-blur-xl flex items-center justify-center relative overflow-hidden"
              style={{ borderColor: `${accentColor}22` }}
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ backgroundColor: `${accentColor}1a` }} />
              <ChevronRight size={28} className="text-white relative z-10" />
            </div>
            <span
              className="text-[9px] uppercase tracking-widest font-bold text-white/50 group-hover:text-white transition-colors"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Enter Products
            </span>
          </button>
        </div>

      </section>

      <CommunitySignupWizard isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </>
  );
}
