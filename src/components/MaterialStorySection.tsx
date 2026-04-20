import React from 'react';
import { useVisualLab, useTheme } from './VisualLabContext';
import { motion, AnimatePresence } from 'motion/react';
import { useStorefrontCategoryData } from '../catalog/storefrontData';

export function MaterialStorySection() {
  const { activeCategory, selectedCatalogItem } = useVisualLab();
  const { categoryData } = useStorefrontCategoryData(activeCategory);
  const { materialStory } = categoryData;

  const item = selectedCatalogItem;

  const headline    = item?.name        ?? materialStory.title;
  const subtitle    = item
    ? (item.mood ?? item.subCategory ?? 'AUTHENTIC TEXTURE').toUpperCase()
    : materialStory.subtitle;
  const description = item?.description ?? materialStory.description;
  const price       = item?.price       ?? null;
  const coverage    = item?.specs?.coverage ?? null;
  const module      = item?.specs?.module   ?? null;
  const selection   = item?.specs?.selection ?? null;

  const metrics = item
    ? [
        {
          value: '100%',
          label: 'NATURAL CLAY',
          description: item.description || 'Sourced and fired for maximum durability and authentic aesthetic.',
        },
        {
          value: item.specs?.module?.split('x')?.[2]?.trim() ?? materialStory.metrics[1]?.value ?? '9mm',
          label: 'THICKNESS',
          description: `${item.name} — ${item.specs?.selection ?? 'Premium Select'}. ${item.specs?.boxDetail ?? ''}`,
        },
      ]
    : materialStory.metrics;

  const { primaryColor: accentColor } = useTheme();

  return (
    <section
      id="material-story"
      className="relative w-full h-screen bg-transparent flex items-center overflow-hidden"
    >
      <div className="container mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* ── Left content ── */}
        <div className="flex flex-col justify-center z-20">

          {/* Label */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase"
                  style={{ color: accentColor }}>
              PERFORMANCE METRICS
            </span>
          </div>

          {/* Animated headline */}
          <AnimatePresence mode="wait">
            <motion.div
              key={headline}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.42 }}
            >
              <h2 className="text-4xl md:text-6xl font-['Anton'] text-white uppercase tracking-tighter leading-[0.85] mb-4">
                {headline}<br />
                <span className="text-transparent"
                      style={{ WebkitTextStroke: '1px rgba(255,255,255,0.8)' }}>
                  {subtitle}
                </span>
              </h2>

              {/* Price pill — visible only when a tile is selected */}
              {price && (
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border mb-8"
                     style={{ borderColor: `${accentColor}40`, backgroundColor: `${accentColor}12` }}>
                  <span className="text-xs font-mono text-white/50 uppercase tracking-widest">Price / sqm</span>
                  <span className="text-sm font-bold" style={{ color: accentColor }}>{price}</span>
                  {coverage && (
                    <span className="text-[10px] text-white/30 font-mono">· {coverage}</span>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Description */}
          <AnimatePresence mode="wait">
            <motion.p
              key={description}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
              className="text-sm md:text-base text-white/40 leading-relaxed mb-10 max-w-md"
            >
              {description}
            </motion.p>
          </AnimatePresence>

          {/* Metrics */}
          <div className="space-y-8 md:space-y-12 max-w-md">
            {metrics.map((metric, idx) => (
              <div key={idx} className="border-l border-white/10 pl-4 md:pl-6">
                <div className="flex items-baseline gap-1 mb-1 md:mb-2">
                  <span className="text-3xl md:text-4xl font-bold text-white">
                    {String(metric.value).replace(/[^0-9.]/g, '')}
                  </span>
                  <span className="text-xs md:text-sm text-white/50">
                    {String(metric.value).replace(/[0-9.]/g, '')}
                  </span>
                </div>
                <h3 className="text-[10px] md:text-xs font-bold text-white/70 tracking-widest uppercase mb-2 md:mb-3">
                  {metric.label}
                </h3>
                <p className="text-xs md:text-sm text-white/40 leading-relaxed">
                  {metric.description}
                </p>
              </div>
            ))}
          </div>

          {/* Spec strip — only when a tile is selected */}
          {item && (
            <div className="mt-10 flex flex-wrap gap-3">
              {[
                { label: 'MODULE', value: module },
                { label: 'SELECTION', value: selection },
              ].filter(s => s.value).map(s => (
                <div key={s.label} className="px-4 py-2 rounded-lg bg-white/5 border border-white/8">
                  <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-xs font-mono text-white/70">{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — 3D object floats here via fixed ProductScene canvas */}
        <div className="hidden md:block relative" />
      </div>
    </section>
  );
}
