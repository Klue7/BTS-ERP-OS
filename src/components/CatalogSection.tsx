import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVisualLab, useTheme } from './VisualLabContext';
import { useStorefrontCategoryData } from '../catalog/storefrontData';
import { ChevronRight, ArrowLeft, Check, Package, Truck, Star, Layers,
  Sun, Moon, ShieldCheck, Palette, LayoutGrid, Sparkles, MapPin,
  User, Phone, Mail, Building2, ShoppingCart, ChevronLeft as ChevLeft
} from 'lucide-react';
import { VolumeEconomicsSlider } from './VolumeEconomicsSlider';
import { toast } from 'sonner';
import {
  calculateDeterministicProjectEstimation,
  calculateQuoteBreakdown,
  convertQuantity,
  formatStoredPriceLabel,
  formatZar,
  getPieceLabel,
  getPricingUnitLabel,
  getRecommendedQuoteUnit,
  type ProductQuoteModel,
} from '../pricing/quoteEngine';

// ─── Mood / Type definitions ────────────────────────────────────────────────
const MOODS = [
  { id: 'Rich Aesthetic', icon: Star,        label: 'Classic'  },
  { id: 'Modern',         icon: Layers,       label: 'Modern'   },
  { id: 'Tan',            icon: Sun,          label: 'Natural'  },
  { id: 'Dark',           icon: Moon,         label: 'Premium'  },
];
const BRICK_TYPES = [
  { id: 'NFP', icon: Package,     label: 'NFP', description: 'Non-Facing Plaster',     strength: '7-10 MPa'  },
  { id: 'NFX', icon: ShieldCheck, label: 'NFX', description: 'Non-Facing Extra',        strength: '14-20 MPa' },
  { id: 'FBA', icon: Palette,     label: 'FBA', description: 'Face Brick Aesthetic',    strength: '20 MPa+'   },
  { id: 'FBS', icon: LayoutGrid,  label: 'FBS', description: 'Face Brick Standard',     strength: '20 MPa+'   },
  { id: 'FBX', icon: Sparkles,    label: 'FBX', description: 'Face Brick Extra',        strength: '25 MPa+'   },
  { id: 'Maxi', icon: Layers,     label: 'Maxi', description: 'Large-format Clay Brick', strength: '20 MPa+'   },
];

// ─── Small 3-D brick tile visual ────────────────────────────────────────────
function BrickChip({ color, isPaving }: { color: string; isPaving: boolean }) {
  return (
    <motion.div
      initial={{ rotateX: 20, rotateZ: -10, rotateY: 0, scale: 1 }}
      whileHover={{ 
        rotateX: 25, 
        rotateZ: -5, 
        rotateY: 15, 
        scale: 1.15,
        transition: { type: 'spring', damping: 12, stiffness: 200 }
      }}
      className="relative cursor-pointer"
      style={{
        width:  isPaving ? 60  : 80,
        height: isPaving ? 60  : 30,
        backgroundColor: color,
        borderRadius: 2,
        boxShadow: `inset 0 0 10px rgba(0,0,0,0.5), 0 10px 20px ${color}50`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-sm" />
      <div className="absolute -bottom-[6px] left-[3px] right-[-3px] h-[6px] brightness-50 rounded-b-sm"
        style={{ backgroundColor: color, transform: 'skewX(45deg)' }} />
      <div className="absolute -right-[6px] top-[3px] bottom-[-3px] w-[6px] brightness-75 rounded-r-sm"
        style={{ backgroundColor: color, transform: 'skewY(45deg)' }} />
    </motion.div>
  );
}

// ─── Embedded Quote Wizard (Minimalist UX) ──────────────────────────────
function EmbeddedQuoteWizard({ item, accentColor, onBack }: { item: any; accentColor: string; onBack: () => void }) {
  const { activeCategory, setCart } = useVisualLab();
  const quoteModel: ProductQuoteModel = item.quoteModel;
  const pieceLabel = getPieceLabel(quoteModel.categoryKey);
  const quoteUnit = getRecommendedQuoteUnit(quoteModel);
  // Step 1=Specs, 2=Estimation, 3=Fulfilment, 4=Address(delivery only), 5=Contact
  const [step, setStep] = useState<number>(1);
  const [length, setLength] = useState('');
  const [width, setWidth]   = useState('');
  const [fulfillment, setFulfillment] = useState<'collection'|'delivery'|''>('');
  const [address, setAddress] = useState({ street: '', city: '', province: '', code: '' });
  const [contact, setContact] = useState({ name: '', email: '', phone: '', company: '' });
  const [submitted, setSubmitted] = useState(false);
  const [uomQty, setUomQty] = useState(1);

  // Calculations
  const l = parseFloat(length) || 0;
  const w = parseFloat(width) || 0;
  const sqm = l * w;
  const estimation = useMemo(() => {
    if (l <= 0 || w <= 0) {
      return null;
    }

    return calculateDeterministicProjectEstimation(quoteModel, {
      width: l,
      height: w,
      unit: 'm',
      wastage: 10,
    });
  }, [l, quoteModel, w]);
  const basePieceQuantity = useMemo(
    () => (sqm > 0 ? Math.ceil(sqm * quoteModel.unitsPerM2) : 0),
    [quoteModel.unitsPerM2, sqm],
  );
  const recommendedQuoteQuantity = useMemo(() => {
    if (!estimation) {
      return 1;
    }

    return Math.max(1, Math.ceil(convertQuantity(quoteModel, estimation.tileQuantity, 'piece', quoteUnit)));
  }, [estimation, quoteModel, quoteUnit]);
  const hasQty = Boolean(estimation && estimation.tileQuantity > 0);
  const isDelivery = fulfillment === 'delivery';
  const liveQuote = useMemo(() => {
    if (!hasQty) {
      return null;
    }

    return calculateQuoteBreakdown({
      product: quoteModel,
      quantity: uomQty,
      minimumQuantity: recommendedQuoteQuantity,
      quantityUnit: quoteUnit,
      province: address.province,
      isDelivery,
    });
  }, [address.province, hasQty, isDelivery, quoteModel, quoteUnit, recommendedQuoteQuantity, uomQty]);
  const storedPriceLabel = formatStoredPriceLabel(quoteModel);
  const quoteUnitLabel = getPricingUnitLabel(quoteUnit, quoteModel.categoryKey, recommendedQuoteQuantity);
  const quantityLabel = getPricingUnitLabel('piece', quoteModel.categoryKey, estimation?.tileQuantity ?? 0);
  const boxesPerPallet = quoteModel.boxesPerPallet ?? 0;

  useEffect(() => {
    setUomQty(recommendedQuoteQuantity);
  }, [item.id, recommendedQuoteQuantity]);

  // Step sequence depends on fulfillment choice
  // Collection: 3=Fulfilment → 5=Contact (skip address)
  // Delivery:   3=Fulfilment → 4=Address → 5=Contact
  const goNext = () => {
    if (step === 3 && fulfillment === 'collection') setStep(5);
    else if (step < 5) setStep(step + 1);
    else setSubmitted(true);
  };
  const goBack = () => {
    if (step === 5 && fulfillment === 'collection') setStep(3);
    else if (step > 1) setStep(step - 1);
    else onBack();
  };

  const canContinue = () => {
    if (step === 3) return fulfillment !== '';
    if (step === 4) return !!(address.city && address.province);
    if (step === 5) return !!(contact.name && contact.email);
    return true;
  };

  const handleAddToCart = () => {
    if (!liveQuote) {
      return;
    }

    setCart((currentCart) => [
      ...currentCart,
      {
        id: `${item.id}-${Date.now()}`,
        name: item.name,
        category: activeCategory,
        rawQty: liveQuote.pieces,
        uomQty: liveQuote.quoteUnitQuantity,
        quantityUnit: liveQuote.quoteUnit,
        pricePerUnit: quoteModel.sellPriceZar,
        image: item.image,
        color: item.color,
        quoteModel,
      },
    ]);
    toast.success(`Added ${liveQuote.quoteUnitQuantity} ${getPricingUnitLabel(liveQuote.quoteUnit, quoteModel.categoryKey, liveQuote.quoteUnitQuantity)} of ${item.name} to cart.`);
    onBack();
  };

  // ── Step progress bar (shown from step 3 onwards) ──
  const ProgressBar = () => {
    const showAddress = fulfillment === 'delivery' || step < 3;
    const steps = [
      { key: 3, label: 'Fulfilment' },
      ...(showAddress ? [{ key: 4, label: 'Address' }] : []),
      { key: 5, label: 'Contact' },
    ];
    return (
      <div className="flex items-center gap-1 mb-8">
        {/* Quoting pill */}
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5 mr-4 shrink-0">
          <span className="text-[8px] text-white/30 uppercase tracking-widest">Quoting</span>
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
          <span className="text-[9px] font-black text-white">{item.name}</span>
          <span className="text-[9px] text-[#1DB954] font-mono font-black">{item.price}</span>
          {estimation ? (
            <span className="text-[8px] text-white/30 font-mono">
              {estimation.tileQuantity.toLocaleString()} {quantityLabel}
            </span>
          ) : null}
        </div>

        {steps.map((s, i) => {
          const done = step > s.key;
          const active = step === s.key;
          return (
            <React.Fragment key={s.key}>
              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black transition-all"
                  style={{
                    backgroundColor: done ? '#1DB954' : active ? '#1DB954' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${done || active ? '#1DB954' : 'rgba(255,255,255,0.1)'}`,
                    color: done || active ? '#000' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {done ? <Check size={10} /> : i + 1}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'text-white' : done ? 'text-[#1DB954]/60' : 'text-white/20'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px mx-1" style={{ backgroundColor: done ? '#1DB954' : 'rgba(255,255,255,0.08)' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (submitted) return (
    <div className="flex flex-col w-full max-w-2xl mx-auto h-full px-6 py-10 items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 flex items-center justify-center mb-6">
        <Check size={28} style={{ color: '#1DB954' }} />
      </div>
      <h1 className="text-4xl font-['Anton'] uppercase text-white mb-3">Quote Sent!</h1>
      <p className="text-white/40 text-sm mb-8">We'll be in touch within 24 hours with your full quote document.</p>
      <button onClick={onBack} className="px-8 py-4 bg-[#1DB954] text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-full">
        Back to Catalogue
      </button>
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto h-full px-6 py-10 no-scrollbar overflow-y-auto">

      {/* ─── STEP 1: Specs & Image ─────────────────────────────────────── */}
      {step === 1 && (
        <AnimatePresence mode="wait">
          <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            <button onClick={onBack} className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
              <ArrowLeft size={14} /> Back to Range
            </button>

            <div className="space-y-4">
              <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-white/50 uppercase tracking-[0.3em] font-black">{item.mood || 'Standard'} Series</span>
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-['Anton'] uppercase text-white tracking-wide">{item.name}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Selling Price</span>
                  <div className="flex gap-1 items-start text-[#1DB954]">
                    <span className="text-sm font-bold mt-1">R</span>
                    <span className="text-3xl font-black">{quoteModel.sellPriceZar.toFixed(2)}</span>
                  </div>
                  <span className="text-[8px] text-white/20 uppercase">Incl. Vat / {getPricingUnitLabel(quoteModel.pricingUnit, quoteModel.categoryKey, 1)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] uppercase font-black tracking-widest text-[#1DB954] border-b border-white/10 pb-2">Technical Matrix</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-8">
                {[
                  ['Dimensions', item.specs?.module || '220 x 73 x 9mm'],
                  ['Stored UOM', storedPriceLabel],
                  ['Coverage', item.specs?.coverage || `${quoteModel.unitsPerM2} ${getPricingUnitLabel('piece', quoteModel.categoryKey, 2)} / sqm`],
                  ['Pallet Pack', quoteModel.categoryKey === 'cladding-tiles' ? `${boxesPerPallet} boxes / pallet` : `${quoteModel.piecesPerPallet} ${getPricingUnitLabel('piece', quoteModel.categoryKey, 2)} / pallet`],
                  ['Truck Capacity', `${quoteModel.palletsPerTruck} pallets / full truck`],
                  ['Origin', `${quoteModel.logistics.originCity || 'Supplier'}${quoteModel.logistics.originRegion ? `, ${quoteModel.logistics.originRegion}` : ''}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">{k}</span>
                    <span className="text-[10px] font-mono text-white/80">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button onClick={() => setStep(2)} className="w-full py-5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-black uppercase tracking-[0.2em] text-[11px] rounded transition-all shadow-[0_0_20px_rgba(29,185,84,0.3)]">
                Calculate Estimate
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ─── STEP 2: Estimation ────────────────────────────────────────── */}
      {step === 2 && (
        <AnimatePresence mode="wait">
          <motion.div key="s2" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.03 }} className="space-y-10 py-10 w-full max-w-lg mx-auto">
            <button onClick={() => setStep(1)} className="text-[8px] text-white/30 hover:text-white uppercase tracking-[0.4em] transition-colors flex items-center gap-3 border border-white/10 py-2 px-4 rounded-full w-max">
              <ArrowLeft size={10} /> Back to Specs
            </button>

            <div className="flex justify-between items-center">
              <h1 className="text-5xl font-['Anton'] uppercase text-white tracking-wider">Estimation</h1>
              <div className="flex bg-white/5 border border-white/10 rounded-full p-1">
                <span className="px-3 py-1 bg-[#1DB954] text-black text-[9px] font-black rounded-full">M</span>
                <span className="px-3 py-1 text-white/40 text-[9px] font-black">MM</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div className="border-b border-white/20 pb-2 relative">
                <label className="text-[10px] text-white/20 font-black tracking-widest uppercase block mb-4">Surface Width</label>
                <input type="number" placeholder="4" value={length} onChange={e => setLength(e.target.value)} className="bg-transparent w-full text-4xl font-['Anton'] text-white focus:outline-none placeholder:text-white/10" />
                <span className="absolute bottom-4 right-0 text-[10px] text-white/20 font-black">M</span>
              </div>
              <div className="border-b border-white/20 pb-2 relative">
                <label className="text-[10px] text-white/20 font-black tracking-widest uppercase block mb-4">Surface Height</label>
                <input type="number" placeholder="2.5" value={width} onChange={e => setWidth(e.target.value)} className="bg-transparent w-full text-4xl font-['Anton'] text-white focus:outline-none placeholder:text-white/10" />
                <span className="absolute bottom-4 right-0 text-[10px] text-white/20 font-black">M</span>
              </div>
            </div>

            <div className="border-y border-white/10 py-8 grid grid-cols-3 gap-8">
              <div>
                <div className="text-[8px] font-black tracking-[0.2em] uppercase text-white/20 mb-2">Total Area</div>
                <div className="text-xl font-bold text-white font-mono">{sqm > 0 ? sqm.toFixed(1) : '–'}<span className="text-[10px] ml-1 text-white/30">m²</span></div>
              </div>
              <div>
                <div className="text-[8px] font-black tracking-[0.2em] uppercase text-white/20 mb-2">{pieceLabel} Count</div>
                <div className="text-xl font-bold text-[#1DB954] font-mono">
                  {estimation ? estimation.tileQuantity.toLocaleString() : '–'}
                  <span className="text-[10px] ml-1 text-white/30">{getPricingUnitLabel('piece', quoteModel.categoryKey, estimation?.tileQuantity ?? 2)}</span>
                </div>
              </div>
              <div>
                <div className="text-[8px] font-black tracking-[0.2em] uppercase text-white/20 mb-2">+10% Wastage</div>
                <div className="text-xl font-bold text-white font-mono">
                  {estimation ? Math.max(0, estimation.tileQuantity - basePieceQuantity).toLocaleString() : '–'}
                  <span className="text-[10px] ml-1 text-white/30">extra {getPricingUnitLabel('piece', quoteModel.categoryKey, 2)}</span>
                </div>
              </div>
            </div>

            {estimation ? (
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div>
                  <div className="text-[8px] font-black tracking-[0.2em] uppercase text-white/20 mb-2">Recommended Quote Volume</div>
                  <div className="text-xl font-bold text-white font-mono">
                    {recommendedQuoteQuantity.toLocaleString()}
                    <span className="text-[10px] ml-1 text-white/30">{quoteUnitLabel}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[8px] font-black tracking-[0.2em] uppercase text-white/20 mb-2">Packaging Context</div>
                  <div className="text-sm font-mono text-white/70">
                    {quoteModel.categoryKey === 'cladding-tiles'
                      ? `1 box = 1 m² · ${boxesPerPallet} boxes / pallet`
                      : `${quoteModel.unitsPerM2.toFixed(0)} ${getPricingUnitLabel('piece', quoteModel.categoryKey, 2)} / m² · ${quoteModel.piecesPerPallet} / pallet`}
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <div className="text-[9px] font-black tracking-[0.25em] uppercase text-white/40 mb-3">Estimated Investment</div>
              <div className="flex items-baseline gap-2 text-[#1DB954]">
                <span className="text-4xl font-bold">R</span>
                <span className="text-5xl lg:text-6xl font-['Anton'] tracking-wider">
                  {estimation ? estimation.totalInvestment.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) : '–'}
                </span>
              </div>
              <div className="text-[8px] text-white/20 uppercase tracking-widest mt-1 italic">{storedPriceLabel} · Inclusive of VAT · Delivery added later</div>
            </div>

            <div className="space-y-4 pt-2">
              <button onClick={hasQty ? handleAddToCart : undefined} className={`w-full py-4 font-black uppercase tracking-[0.2em] text-[10px] rounded flex items-center justify-center gap-3 transition-all ${hasQty ? 'bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-[0_0_20px_rgba(29,185,84,0.3)]' : 'bg-white/10 text-white/20 cursor-not-allowed'}`}>
                <ShoppingCart size={14} /> Add to Cart &amp; Continue Browsing
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setStep(1)} className="py-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-white/40 font-bold text-[9px] uppercase tracking-widest rounded flex justify-center items-center gap-2 transition-all">
                  <ArrowLeft size={10} /> Back to Specs
                </button>
                <button onClick={() => { if (hasQty) setStep(3); }} className={`py-4 border font-bold text-[9px] uppercase tracking-widest rounded flex justify-center items-center gap-2 transition-all group ${hasQty ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-white' : 'border-white/5 text-white/20 cursor-not-allowed'}`}>
                  Full Quote <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ─── STEP 3: Fulfilment ────────────────────────────────────────── */}
      {step === 3 && (
        <AnimatePresence mode="wait">
          <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ type: 'spring', damping: 28 }} className="space-y-8 py-6 w-full max-w-lg mx-auto">
            <ProgressBar />
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-2">Step 01 / Fulfilment</p>
              <h1 className="text-4xl font-['Anton'] uppercase text-white tracking-wider">Collection or Delivery?</h1>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {([
                ['collection', Package, 'Collect In-Store', 'Pick up from our showroom'],
                ['delivery',   Truck,   'Deliver to Me',    'We ship to your site'],
              ] as const).map(([val, Icon, title, sub]) => (
                <button
                  key={val}
                  onClick={() => setFulfillment(val)}
                  className="flex flex-col items-center gap-4 p-8 rounded-2xl border transition-all"
                  style={{
                    borderColor: fulfillment === val ? '#1DB954' : 'rgba(255,255,255,0.08)',
                    backgroundColor: fulfillment === val ? 'rgba(29,185,84,0.08)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <Icon size={28} style={{ color: fulfillment === val ? '#1DB954' : 'rgba(255,255,255,0.5)' }} />
                  <div className="text-center">
                    <div className="text-white font-bold text-sm mb-1">{title}</div>
                    <div className="text-white/30 text-[10px]">{sub}</div>
                  </div>
                </button>
              ))}
            </div>

            {fulfillment === 'collection' && liveQuote ? (
              <VolumeEconomicsSlider
                product={quoteModel}
                uomQty={uomQty}
                setUomQty={setUomQty}
                minUomQty={recommendedQuoteQuantity}
                quantityUnit={quoteUnit}
                province={quoteModel.logistics.originRegion ?? ''}
                isDelivery={false}
                accentColor={accentColor}
                textClass="text-[#1DB954]"
                bgClass="bg-[#1DB954]"
                borderClass="border-[#1DB954]"
              />
            ) : null}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                <ArrowLeft size={12} /> Back to Estimation
              </button>
              <button
                onClick={goNext}
                disabled={!canContinue()}
                className="px-8 py-3 bg-[#1DB954] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-full flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1ed760] transition-all"
              >
                Continue <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ─── STEP 4: Delivery Address ───────────────────────────────────── */}
      {step === 4 && (
        <AnimatePresence mode="wait">
          <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ type: 'spring', damping: 28 }} className="space-y-6 py-6 w-full max-w-lg mx-auto">
            <ProgressBar />
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-2">Step 02 / Address</p>
              <h1 className="text-4xl font-['Anton'] uppercase text-white tracking-wider">Where should we deliver?</h1>
            </div>

            <div className="space-y-4">
              {([
                ['street',   'Street Address', 'text',  address.street,   (v: string) => setAddress(a => ({ ...a, street:   v }))],
                ['city',     'City / Town',    'text',  address.city,     (v: string) => setAddress(a => ({ ...a, city:     v }))],
                ['province', 'Province',       'text',  address.province, (v: string) => setAddress(a => ({ ...a, province: v }))],
                ['code',     'Postal Code',    'text',  address.code,     (v: string) => setAddress(a => ({ ...a, code:     v }))],
              ] as any[]).map(([id, label, type, val, set]: any) => (
                <div key={id}>
                  <label className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 block">{label}</label>
                  <input
                    type={type}
                    placeholder={label}
                    value={val}
                    onChange={e => set(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-[#1DB954] rounded-lg px-5 py-3.5 text-white text-sm outline-none transition-all placeholder:text-white/15 focus:bg-white/[0.06]"
                  />
                </div>
              ))}
            </div>

            {liveQuote ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border border-[#1DB954]/20 bg-[#1DB954]/05 flex items-start gap-3"
                >
                  <Truck size={16} className="text-[#1DB954] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-[#1DB954] font-black mb-1">
                      Delivery Estimate — {address.city || address.province}
                    </div>
                    <div className="text-white text-sm font-mono font-bold">
                      {formatZar(liveQuote.deliveryTotalZar)}
                      <span className="text-white/30 text-[10px] ml-2 font-normal">
                        {liveQuote.distanceKm.toFixed(0)} km route · {liveQuote.distanceSource}
                      </span>
                    </div>
                    <div className="text-white/30 text-[9px] mt-1">
                      Factory: {quoteModel.logistics.originCity || 'Supplier origin'}{quoteModel.logistics.originRegion ? `, ${quoteModel.logistics.originRegion}` : ''} ·
                      Delivered at {formatZar(liveQuote.pricePerPieceDeliveredZar)} / {pieceLabel}
                      {quoteModel.categoryKey === 'cladding-tiles' ? ` · ${formatZar(liveQuote.pricePerBoxDeliveredZar)} / box` : ''}
                      {' '}· {formatZar(liveQuote.pricePerPalletDeliveredZar)} / pallet
                    </div>
                  </div>
                </motion.div>

                <VolumeEconomicsSlider
                  product={quoteModel}
                  uomQty={uomQty}
                  setUomQty={setUomQty}
                  minUomQty={recommendedQuoteQuantity}
                  quantityUnit={quoteUnit}
                  province={address.province}
                  isDelivery
                  accentColor={accentColor}
                  textClass="text-[#1DB954]"
                  bgClass="bg-[#1DB954]"
                  borderClass="border-[#1DB954]"
                />
              </>
            ) : address.province ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl border border-white/10 bg-white/[0.03] text-[10px] text-white/40">
                <MapPin size={14} className="inline mr-2 text-white/20" />
                Delivery route for <span className="text-white">{address.province}</span> will be calculated as soon as a valid quote quantity is set.
              </motion.div>
            ) : null}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <button onClick={goBack} className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                <ArrowLeft size={12} /> Back
              </button>
              <button
                onClick={goNext}
                disabled={!canContinue()}
                className="px-8 py-3 bg-[#1DB954] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-full flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1ed760] transition-all"
              >
                Continue <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ─── STEP 5: Contact Details ────────────────────────────────────── */}
      {step === 5 && (
        <AnimatePresence mode="wait">
          <motion.div key="s5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ type: 'spring', damping: 28 }} className="space-y-6 py-6 w-full max-w-lg mx-auto">
            <ProgressBar />
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-2">Step {fulfillment === 'delivery' ? '04' : '03'} / Contact</p>
              <h1 className="text-4xl font-['Anton'] uppercase text-white tracking-wider">Almost done —<br/>your details.</h1>
              <p className="text-white/30 text-xs mt-2">Just enough to open the draft quote.</p>
            </div>

            {liveQuote ? (
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-white/30 mb-1">Order basis</div>
                  <div className="text-white font-mono text-sm">
                    {liveQuote.quoteUnitQuantity.toLocaleString()} {getPricingUnitLabel(liveQuote.quoteUnit, quoteModel.categoryKey, liveQuote.quoteUnitQuantity)}
                  </div>
                  <div className="text-white/35 text-[10px] mt-1">
                    {liveQuote.pieces.toLocaleString()} {getPricingUnitLabel('piece', quoteModel.categoryKey, liveQuote.pieces)} · {liveQuote.sqm.toFixed(2)} m²
                    {quoteModel.categoryKey === 'cladding-tiles' ? ` · ${liveQuote.boxes.toFixed(2)} boxes` : ''}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-white/30 mb-1">Quote total</div>
                  <div className="text-white font-mono text-sm">{formatZar(liveQuote.totalZar)}</div>
                  <div className="text-white/35 text-[10px] mt-1">
                    Product {formatZar(liveQuote.productTotalZar)} · {isDelivery ? `Transport ${formatZar(liveQuote.deliveryTotalZar)}` : 'Collection'}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              {([
                ['name',    'Full Name',     'text',  User,      contact.name,    (v: string) => setContact(c => ({ ...c, name: v }))],
                ['email',   'Email',         'email', Mail,      contact.email,   (v: string) => setContact(c => ({ ...c, email: v }))],
                ['phone',   'Telephone',     'tel',   Phone,     contact.phone,   (v: string) => setContact(c => ({ ...c, phone: v }))],
                ['company', 'Company (Opt)', 'text',  Building2, contact.company, (v: string) => setContact(c => ({ ...c, company: v }))],
              ] as any[]).map(([id, label, type, Icon, val, set]: any) => (
                <div key={id}>
                  <label className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 block">{label}</label>
                  <div className="relative">
                    <Icon size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                      type={type}
                      placeholder={label}
                      value={val}
                      onChange={e => set(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-[#1DB954] rounded-lg pl-10 pr-5 py-3.5 text-white text-sm outline-none transition-all placeholder:text-white/15 focus:bg-white/[0.06]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <button onClick={goBack} className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                <ArrowLeft size={12} /> Back
              </button>
              <button
                onClick={() => { if (canContinue()) setSubmitted(true); }}
                disabled={!canContinue()}
                className="px-8 py-3 bg-[#1DB954] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-full flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1ed760] transition-all"
              >
                Submit Deterministic Quote <Check size={14} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

    </div>
  );
}

// ─── Product Detail Panel — Sleek Centered Modal ─────────────────────────
function ProductDetailPanel({ item, accentColor, onBack }: {
  item: any; accentColor: string; onBack: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark blurry backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#080808]/90 backdrop-blur-md" 
        onClick={onBack}
      />
      
      {/* Centered Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative z-10 w-full max-w-4xl h-[95vh] md:h-[85vh] max-h-[850px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#111] to-[#040404] border border-white/5 rounded-2xl shadow-2xl overflow-hidden flex"
      >
        <EmbeddedQuoteWizard item={item} accentColor={accentColor} onBack={onBack} />
      </motion.div>
    </div>
  );
}
// ─── Catalog Tile card ───────────────────────────────────────────────────────
function CatalogTile({ item, onSelect }: { item: any; onSelect: (i: any) => void }) {
  const { activeCategory } = useVisualLab();
  const isPaving = activeCategory === 'paving';
  return (
    <div
      className="group relative h-[110px] w-full flex flex-col items-center justify-center bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all duration-500 cursor-pointer"
      onClick={() => onSelect(item)}
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center perspective-[2000px]">
        <BrickChip color={item.color} isPaving={isPaving} />
      </div>
      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
        <span className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-[0.25em] rounded-full">
          View
        </span>
      </div>
      <div className="absolute bottom-0 left-0 w-full z-10 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 group-hover:text-white transition-colors block truncate leading-tight">
          {item.name}
        </span>
        <span
          className="text-[11px] font-black font-mono tracking-wider transition-all"
          style={{ color: '#C5A059', textShadow: '0 0 8px rgba(197,160,89,0.6)' }}
        >
          {item.price || 'P.O.A'}
        </span>
      </div>
    </div>
  );
}

// ─── Category column with 4×2 carousel ───────────────────────────────────────

function CategoryCarouselColumn({ cat, items, onSelect, accentColor, isPaving, animDelay }: {
  cat: any; items: any[]; onSelect: (i: any) => void; accentColor: string; isPaving: boolean; animDelay: number;
}) {
  const [page, setPage] = React.useState(0);
  // 4 columns × 2 rows = 8 tiles visible per page, but since the column is 1 col wide
  // we show 2 rows of 1 item each = 2 per page within the single column.
  // Actually showing them in a 3-row grid within each column.
  const ROWS = 3;
  const PER_PAGE = ROWS; // 3 items per page per column
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const visibleItems = items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: animDelay }}
      className="flex flex-col items-center gap-3"
    >
      {/* Header: icon + label only — 3D chip removed */}
      <div className="flex flex-col items-center gap-2 mb-2">
        <cat.icon size={18} className="text-[#C5A059]" />
        <h3 className="text-sm font-light text-white/80 tracking-widest uppercase text-center">{cat.label}</h3>
        {cat.description && (
          <p className="text-[9px] text-white/30 uppercase tracking-widest text-center max-w-[100px]">{cat.description}</p>
        )}
        <div className="w-12 h-[1px] bg-white/20" />
      </div>

      {/* 3-row tile grid */}
      <div className="w-full grid grid-rows-3 gap-3">
        {visibleItems.map((item: any) => (
          <CatalogTile key={item.id} item={item} onSelect={onSelect} />
        ))}
        {/* Fill empty slots so layout stays consistent */}
        {visibleItems.length < PER_PAGE && Array.from({ length: PER_PAGE - visibleItems.length }).map((_, i) => (
          <div key={`empty-${i}`} className="h-[110px] w-full rounded-2xl border border-white/[0.03] bg-white/[0.01]" />
        ))}
      </div>

      {/* Carousel arrows — explicitly highlighted in neon green */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 mt-2 justify-center">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-7 h-7 rounded-full border border-[#39FF14] flex items-center justify-center text-[#39FF14] hover:bg-[#39FF14]/15 disabled:opacity-20 disabled:border-white/10 disabled:text-white/30 transition-all shadow-[0_0_8px_rgba(57,255,20,0.3)] hover:shadow-[0_0_12px_rgba(57,255,20,0.6)]"
          >
            <ChevLeft size={14} />
          </button>
          <span className="text-[10px] font-mono text-[#39FF14] tracking-widest drop-shadow-[0_0_4px_rgba(57,255,20,0.5)]">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="w-7 h-7 rounded-full border border-[#39FF14] flex items-center justify-center text-[#39FF14] hover:bg-[#39FF14]/15 disabled:opacity-20 disabled:border-white/10 disabled:text-white/30 transition-all shadow-[0_0_8px_rgba(57,255,20,0.3)] hover:shadow-[0_0_12px_rgba(57,255,20,0.6)]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function CatalogSection() {
  const { activeCategory, setSelectedCatalogItem, setCart } = useVisualLab();
  const { primaryColor } = useTheme();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const { categoryData } = useStorefrontCategoryData(activeCategory);

  // Propagate to global context so all downstream sections reflect this selection
  const handleSelectItem = (item: any) => {
    setSelectedItem(item);          // opens the in-section detail panel
    setSelectedCatalogItem(item);   // persists to context → drives tile colour + all sections
  };

  const items      = categoryData?.catalog || [];
  const { primaryColor: accentColor } = useTheme();
  const inventoryBackedItems = items.some((item: any) => item.inventoryProductId);

  const categories = useMemo<any[]>(() => {
    if (!inventoryBackedItems) {
      return activeCategory === 'bricks' ? BRICK_TYPES : MOODS;
    }

    if (activeCategory === 'bricks') {
      return Array.from(new Set(items.map((item: any) => item.subCategory).filter(Boolean))).map((id) => {
        const match = BRICK_TYPES.find((type) => type.id === id);
        return match ?? { id, icon: Package, label: id, description: `${id} published type`, strength: 'Published' };
      });
    }

    return Array.from(new Set(items.map((item: any) => item.mood).filter(Boolean))).map((id) => {
      const match = MOODS.find((mood) => mood.label === id || mood.id === id);
      return match ?? { id, icon: Layers, label: id, description: `${id} published type` };
    });
  }, [activeCategory, inventoryBackedItems, items]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, any[]> = {};
    categories.forEach(cat => {
      groups[cat.id] = items.filter((item: any) =>
        activeCategory === 'bricks'
          ? item.subCategory === cat.id
          : item.mood === cat.id || item.mood === cat.label
      );
    });
    return groups;
  }, [items, categories, activeCategory]);

  return (
    <section id="catalog" className="relative h-screen bg-transparent overflow-hidden">
      {/* Ghost watermark removed for a cleaner look */}

      {/* ── Catalog grid (slides out left when item selected) ── */}
      <AnimatePresence>
        {!selectedItem && (
          <motion.div
            key="catalog-grid"
            initial={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="absolute inset-0 z-10 overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-4">
              {/* Heading — tightened */}
              <div className="text-center mb-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-6xl font-light text-white tracking-tighter mb-3"
                >
                  {activeCategory === 'bricks' ? 'Brick' : 'Colour'}{' '}
                  <span className="italic font-serif" style={{ color: primaryColor }}>
                    {activeCategory === 'bricks' ? 'Types' : 'Moods'}
                  </span>
                </motion.h2>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  className="h-[1px] bg-white/10 max-w-2xl mx-auto"
                />
              </div>

              {/* Category columns — 4 cols fixed grid */}
              <div className={`grid grid-cols-2 ${activeCategory === 'bricks' ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-6 md:gap-6`}>
                {categories.map((cat: any, idx) => (
                  <CategoryCarouselColumn
                    key={cat.id}
                    cat={cat}
                    items={groupedItems[cat.id] || []}
                    onSelect={handleSelectItem}
                    accentColor={accentColor}
                    isPaving={activeCategory === 'paving'}
                    animDelay={idx * 0.08}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Product detail + wizard (slides in from right) ── */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            key="product-detail"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 180 }}
            className="absolute inset-0 z-20 bg-transparent backdrop-blur-3xl overflow-y-auto"
          >
            <ProductDetailPanel
              item={selectedItem}
              accentColor={accentColor}
              onBack={() => setSelectedItem(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
