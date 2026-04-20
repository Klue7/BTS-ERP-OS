import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVisualLab, useTheme } from './VisualLabContext';
import {
  Download, Calculator, ArrowRight, ShoppingBag, ChevronRight, Sparkles,
  Truck, MapPin, User, Mail, Phone, Building2, Package, Check, ArrowLeft, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { calculateProjectEstimation } from '../utils/calculator';
import { VolumeEconomicsSlider } from './VolumeEconomicsSlider';
import { QuoteDocument } from './QuoteDocument';
import { RegionSelector } from './RegionSelector';
import { useStorefrontCategoryData } from '../catalog/storefrontData';
import {
  convertQuantity,
  getPieceLabel,
  getRecommendedQuoteUnit,
  type ProductQuoteModel,
} from '../pricing/quoteEngine';

gsap.registerPlugin(ScrollTrigger);

// ─── Inline Quote Wizard (steps after estimation) ────────────────────────────
function InlineQuoteWizard({
  results, tileName, tilePrice, quoteModel, onBack, onDone
}: {
  results: any; tileName: string; tilePrice: string | null; quoteModel: ProductQuoteModel | null;
  onBack: () => void; onDone: () => void;
}) {
  const { primaryColor: accentColor, textClass, borderClass, bgClass } = useTheme();
  const quoteUnit = quoteModel ? getRecommendedQuoteUnit(quoteModel) : 'piece';
  const startUomQty = quoteModel
    ? Math.max(1, Math.ceil(convertQuantity(quoteModel, results.tileQuantity ?? 0, 'piece', quoteUnit)))
    : 1;
  const pieceLabel = quoteModel ? getPieceLabel(quoteModel.categoryKey) : 'unit';

  const [step, setStep]           = useState(1);
  const [dir, setDir]             = useState(1);
  const [fulfillment, setFulfill] = useState<'collection' | 'delivery' | ''>('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [address, setAddress]     = useState({ street: '', city: '', province: '', code: '' });
  const [uomQty, setUomQty]       = useState(startUomQty);
  const [contact, setContact]     = useState({ name: '', email: '', phone: '', company: '' });
  const [submitted, setSubmitted] = useState(false);

  // Step sequence: 1=Fulfilment, 2=Location, 3=Volume, 4=Contact
  const steps = [
    { label: 'Fulfilment', icon: Truck },
    { label: 'Location', icon: MapPin },
    { label: 'Volume',  icon: Package },
    { label: 'Contact', icon: User },
  ];
  const maxStep = steps.length;

  const regionStep  = 2;
  const volumeStep  = 3;
  const contactStep = 4;

  const go = (target: number) => { setDir(target > step ? 1 : -1); setStep(target); };

  const canProceed = () => {
    if (step === 1) return fulfillment !== '';
    if (step === regionStep) {
       if (fulfillment === 'delivery') return selectedRegion !== '' && !!(address.city && address.street);
       return selectedRegion !== '';
    }
    if (step === volumeStep) return true;  // slider always valid
    if (step === contactStep) return !!(contact.name && contact.email);
    return true;
  };

  const nextStep = () => { if (step < maxStep) go(step + 1); else setSubmitted(true); };
  const prevStep = () => go(Math.max(1, step - 1));

  if (submitted) return (
    <QuoteDocument
      contact={contact}
      address={{...address, province: selectedRegion || address.province}}
      fulfillment={fulfillment}
      uomQty={uomQty}
      quantityUnit={quoteUnit}
      itemName={tileName}
      product={quoteModel}
      activeColor={accentColor}
      onClose={onDone}
    />
  );

  return (
    <div className="flex flex-col h-full w-full max-w-lg">

      {/* Back nav */}
      <button
        onClick={step === 1 ? onBack : prevStep}
        className="group flex items-center gap-3 mb-8 text-white/35 hover:text-white transition-colors"
      >
        <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 group-hover:bg-white/5 transition-all">
          <ArrowLeft size={15} />
        </div>
        <span className="text-[9px] font-bold tracking-[0.4em] uppercase">
          {step === 1 ? 'Back to Estimation' : 'Back'}
        </span>
      </button>

      {/* Order summary pill */}
      <div className="mb-6 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 w-fit">
        <span className="text-[9px] text-white/30 uppercase tracking-widest">Quoting:</span>
        <span className="text-[11px] font-mono text-white/70">{tileName}</span>
        {tilePrice && <span className={`${textClass}/70 text-[10px] font-mono`}>{tilePrice}</span>}
        <span className="text-white/20 text-[10px]">· {results.tileQuantity} {results.tileQuantity === 1 ? pieceLabel : `${pieceLabel}s`}</span>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-3 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500"
                style={{
                  backgroundColor: i + 1 < step ? accentColor : i + 1 === step ? `${accentColor}4D` : 'rgba(255,255,255,0.05)',
                  border: '1px solid',
                  borderColor: i + 1 <= step ? accentColor : 'rgba(255,255,255,0.1)',
                  color: i + 1 <= step ? (i + 1 < step ? '#000' : accentColor) : 'rgba(255,255,255,0.3)'
                }}
              >
                {i + 1 < step ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-[10px] uppercase tracking-wider hidden sm:block transition-colors duration-300 ${i + 1 === step ? 'text-white' : 'text-white/25'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-[1px] bg-white/10">
                <div className="h-full transition-all duration-700" style={{ width: i + 1 < step ? '100%' : '0%', backgroundColor: accentColor }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content — slides left/right */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -48, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          >

            {/* STEP 1 — Collection or Delivery */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-1">Step 01 / Fulfilment</p>
                  <h3 className="text-2xl font-light text-white">Collection or Delivery?</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {([
                    ['collection', Package, 'Collect In-Store',  'Pick up from our showroom'],
                    ['delivery',   Truck,   'Deliver to Me',     'We ship to your site'],
                  ] as const).map(([val, Icon, title, sub]) => (
                    <button
                      key={val}
                      onClick={() => setFulfill(val as any)}
                      className={`flex flex-col items-center gap-4 p-8 rounded-2xl border text-center transition-all backdrop-blur-xl group relative overflow-hidden`}
                      style={{
                        borderColor: fulfillment === val ? accentColor : 'rgba(255,255,255,0.1)',
                        backgroundColor: fulfillment === val ? `${accentColor}1A` : 'rgba(255,255,255,0.02)',
                        boxShadow: fulfillment === val ? `0 0 20px ${accentColor}20` : 'none'
                      }}
                    >
                      {fulfillment === val && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `linear-gradient(135deg, ${accentColor}, transparent)` }} />
                      )}
                      <div className={`w-14 h-14 rounded-full border mb-2 flex items-center justify-center transition-colors shadow-lg z-10 ${fulfillment === val ? 'bg-white text-black border-white' : 'border-white/10 text-white/50 group-hover:bg-white/[0.05]'}`}>
                        <Icon size={24} style={{ color: fulfillment === val ? accentColor : undefined }} />
                      </div>
                      <div className="z-10 mt-2">
                        <div className="text-white font-medium text-sm mb-1">{title}</div>
                        <div className="text-white/40 text-[11px] group-hover:text-white/60 transition-colors">{sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2 — Location */}
            {step === regionStep && (
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-1">Step 02 / Location</p>
                  <h3 className="text-2xl font-light text-white">Where is your project located?</h3>
                </div>
                <RegionSelector 
                  selectedRegion={selectedRegion} 
                  setSelectedRegion={setSelectedRegion} 
                  fulfillment={fulfillment} 
                />

                <AnimatePresence>
                  {fulfillment === 'delivery' && selectedRegion && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, y: -10 }} 
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="pt-2 overflow-hidden"
                    >
                      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4 shadow-inner backdrop-blur-xl">
                        <h4 className="text-[10px] uppercase tracking-widest text-white/50 mb-2 block font-bold flex items-center gap-2">
                          <Truck size={12} style={{ color: accentColor }} /> Delivery Details
                        </h4>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                          <input 
                            type="text" 
                            placeholder="Street Address" 
                            value={address.street} 
                            onChange={e => setAddress({ ...address, street: e.target.value })} 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder:text-white/20 pl-11 focus:border-white/30 focus:bg-white/10"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                            <input 
                              type="text" 
                              placeholder="City" 
                              value={address.city} 
                              onChange={e => setAddress({ ...address, city: e.target.value })} 
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder:text-white/20 pl-11 focus:border-white/30 focus:bg-white/10"
                            />
                          </div>
                          <input 
                            type="text" 
                            placeholder="Postal Code" 
                            value={address.code} 
                            onChange={e => setAddress({ ...address, code: e.target.value })} 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder:text-white/20 focus:border-white/30 focus:bg-white/10"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* STEP volumeStep — Volume Economics */}
            {step === volumeStep && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-1">Step {String(volumeStep).padStart(2,'0')} / Volume</p>
                  <h3 className="text-2xl font-light text-white">Review your order volume.</h3>
                  <p className="text-white/30 text-xs mt-1">Adjust quantity to see how delivered cost per unit changes.</p>
                </div>
                <VolumeEconomicsSlider
                  product={quoteModel ?? {
                    name: tileName,
                    categoryKey: 'cladding-tiles',
                    pricingUnit: 'm2',
                    sellPriceZar: 0,
                    unitsPerM2: 50,
                    weightPerPieceKg: 0,
                    piecesPerPallet: 2000,
                    boxesPerPallet: 40,
                    palletsPerTruck: 24,
                    logistics: { costPricePerKm: 25, sellPricePerKm: 35, fixedFee: 0, minimumCharge: 0 },
                  }}
                  uomQty={uomQty}
                  setUomQty={setUomQty}
                  minUomQty={startUomQty}
                  quantityUnit={quoteUnit}
                  province={selectedRegion || address.province}
                  isDelivery={fulfillment === 'delivery'}
                  accentColor={accentColor}
                  textClass={textClass}
                  bgClass={bgClass}
                  borderClass={borderClass}
                />
              </div>
            )}

            {/* LAST STEP — Contact */}
            {step === maxStep && (
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-1">Step 0{maxStep} / Contact</p>
                  <h3 className="text-2xl font-light text-white">Almost done — your details.</h3>
                  <p className="text-white/30 text-[12px] mt-1">Just enough to open the draft quote.</p>
                </div>
                {([
                  ['name',    'Full Name',     contact.name,    (v: string) => setContact(c => ({...c, name: v})),    'text',  User],
                  ['email',   'Email',         contact.email,   (v: string) => setContact(c => ({...c, email: v})),   'email', Mail],
                  ['phone',   'Telephone',     contact.phone,   (v: string) => setContact(c => ({...c, phone: v})),   'tel',   Phone],
                  ['company', 'Company (opt)', contact.company, (v: string) => setContact(c => ({...c, company: v})), 'text',  Building2],
                ] as any[]).map(([id, label, val, set, type, Icon]: any) => (
                  <div key={id} className="relative">
                    <label className="text-[10px] uppercase tracking-widest text-white/30 mb-2 block">{label}</label>
                    <div className="relative">
                      <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                      <input
                        type={type}
                        placeholder={label}
                        value={val}
                        onChange={e => set(e.target.value)}
                        className={`w-full bg-white/5 border border-white/10 focus:${borderClass}/50 rounded-xl pl-10 pr-4 py-3 text-white outline-none transition-colors placeholder:text-white/10`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 mt-6 border-t border-white/5">
        <button
          onClick={step === 1 ? onBack : prevStep}
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 hover:text-white transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          {step === 1 ? 'Back to Estimation' : 'Back'}
        </button>
        <button
          onClick={nextStep}
          disabled={!canProceed()}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-xs uppercase tracking-widest font-bold transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed ${bgClass} text-black`}
        >
          {step === maxStep ? 'Submit Quote' : 'Continue'}
          {step < maxStep
            ? <ChevronRight size={16} className="text-black/60" />
            : <Check size={16} className="text-black/60" />}
        </button>
      </div>

    </div>
  );
}


// ─── Animated number counter ────────────────────────────────────────────────
function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const duration = 800;

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = fromRef.current;
    const to = value;
    startRef.current = null;

    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * ease;
      setDisplay(current);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <>{display.toFixed(decimals)}</>;
}

// ─── Calculator icon button ──────────────────────────────────────────────────
function CalcTrigger({ onClick }: { onClick: () => void }) {
  const { primaryColor: accentColor, textClass, borderClass, bgClass } = useTheme();
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60, scale: 0.85 }}
      transition={{ type: 'spring', damping: 22, stiffness: 180 }}
      whileHover="hover"
      whileTap={{ scale: 0.94 }}
      className="group relative flex flex-col items-center gap-3 focus:outline-none"
      aria-label="Open Coverage Calculator"
    >
      {/* Outer pulse rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className={`absolute rounded-full border ${borderClass}/25`}
            style={{ width: 88 + i * 28, height: 88 + i * 28, top: -(44 + i * 14), left: -(44 + i * 14) }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2.8, delay: i * 0.55, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Icon circle */}
      <motion.div
        className={`relative w-16 h-16 rounded-full ${bgClass}/10 border ${borderClass}/30 flex items-center justify-center`}
        variants={{ hover: { scale: 1.1, backgroundColor: `${accentColor}33`, borderColor: `${accentColor}99` } }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <motion.div
          variants={{ hover: { rotate: [0, -12, 12, 0] } }}
          transition={{ duration: 0.5 }}
        >
          <Calculator size={26} className={`${textClass}`} />
        </motion.div>
        {/* Corner sparkle */}
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={12} className={`${textClass}/60`} />
        </motion.div>
      </motion.div>

      {/* Label */}
      <motion.span
        className={`text-[9px] font-bold tracking-[0.35em] uppercase text-white/40 group-hover:${textClass} transition-colors`}
        variants={{ hover: { y: -2 } }}
      >
        Calculate<br />
        <span className="text-[8px]">Coverage</span>
      </motion.span>
    </motion.button>
  );
}

// ─── Result card row ─────────────────────────────────────────────────────────
function ResultRow({ label, value, unit, accent }: { label: string; value: number; unit: string; accent?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[9px] text-white/25 uppercase tracking-[0.35em]">{label}</p>
      <p className="font-mono font-bold leading-none" style={{ color: accent || 'white', fontSize: '2rem' }}>
        <CountUp value={value} decimals={value % 1 !== 0 ? 2 : 0} />
        <span className="text-xs ml-1 text-white/20 font-sans font-normal">{unit}</span>
      </p>
    </div>
  );
}

// ─── Main Section ────────────────────────────────────────────────────────────
export function TechnicalSection() {
  const { primaryColor: accentColor, textClass, borderClass, bgClass } = useTheme();
  const { activeCategory, isEstimating, setIsEstimating, selectedCatalogItem } = useVisualLab();
  const { categoryData } = useStorefrontCategoryData(activeCategory);
  const catalogItems = categoryData?.catalog ?? [];
  const resolvedCatalogItem = useMemo(() => {
    if (!selectedCatalogItem) {
      return catalogItems[0] ?? null;
    }

    const matched =
      catalogItems.find((item: any) => item.inventoryProductId && item.inventoryProductId === selectedCatalogItem.inventoryProductId) ??
      catalogItems.find((item: any) => item.publicSku && item.publicSku === selectedCatalogItem.publicSku) ??
      catalogItems.find((item: any) => item.id === selectedCatalogItem.id) ??
      null;

    return matched ? { ...selectedCatalogItem, ...matched } : selectedCatalogItem;
  }, [catalogItems, selectedCatalogItem]);

  // Build display specs: prefer selected tile's specs, fallback to category technical specs
  const activeSpecs: { label: string; value: string; position: { x: number; y: number } }[] =
    resolvedCatalogItem?.specs
      ? [
          { label: 'LENGTH',    value: resolvedCatalogItem.specs.module?.split('x')[0]?.trim() ?? '220mm', position: { x: -1, y:  1 } },
          { label: 'HEIGHT',    value: resolvedCatalogItem.specs.module?.split('x')[1]?.trim() ?? '73mm',  position: { x: -1, y: -1 } },
          { label: 'THICKNESS', value: resolvedCatalogItem.specs.module?.split('x')[2]?.trim() ?? '9mm',   position: { x:  1, y:  1 } },
          { label: 'FINISH',    value: resolvedCatalogItem.specs.selection ?? 'Matte / Granular',          position: { x:  1, y: -1 } },
        ]
      : (categoryData?.technical?.specs ?? []);

  // Price per sqm from the selected tile (if any)
  const tilePrice   = resolvedCatalogItem?.price ?? null;
  const tileName    = resolvedCatalogItem?.name ?? categoryData?.productName ?? 'Product';
  const quoteModel: ProductQuoteModel | null = resolvedCatalogItem?.quoteModel ?? null;
  const pieceLabel = quoteModel ? getPieceLabel(quoteModel.categoryKey) : 'tile';
  const technicalTests = resolvedCatalogItem?.technicalTests ?? [];
  const specSheetUrl = resolvedCatalogItem?.specSheetUrl;

  const [dims, setDims] = useState({ width: 4, height: 2.5, unit: 'm' as 'm' | 'mm', wastage: 10 });

  const sectionRef  = useRef<HTMLDivElement>(null);
  const bgRef       = useRef<HTMLDivElement>(null);
  const specsRef    = useRef<HTMLDivElement>(null);
  const calcRef     = useRef<HTMLDivElement>(null);
  const triggerRef  = useRef<HTMLDivElement>(null);
  const mainTl      = useRef<gsap.core.Timeline | null>(null);
  const pulseTl     = useRef<gsap.core.Timeline | null>(null);

  const results = useMemo(
    () =>
      calculateProjectEstimation(
        quoteModel ?? {
          name: tileName,
          categoryKey: activeCategory,
          pricingUnit: activeCategory === 'bricks' ? 'piece' : activeCategory === 'cladding-tiles' ? 'm2' : 'piece',
          sellPriceZar: 0,
          unitsPerM2: activeCategory === 'bricks' ? 55 : activeCategory === 'cladding-tiles' ? 50 : 1,
          weightPerPieceKg: 0,
          piecesPerPallet: activeCategory === 'bricks' ? 500 : activeCategory === 'cladding-tiles' ? 2000 : 1,
          boxesPerPallet: activeCategory === 'cladding-tiles' ? 40 : 0,
          palletsPerTruck: 24,
          logistics: { costPricePerKm: 25, sellPricePerKm: 35, fixedFee: 0, minimumCharge: 0 },
        },
        dims,
      ),
    [activeCategory, dims, quoteModel, tileName],
  );

  // Lock page scroll when estimating
  useEffect(() => {
    if (isEstimating) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isEstimating]);

  // ── Idle pulse on button ────────────────────────────────────────────────
  useEffect(() => {
    if (!triggerRef.current) return;
    pulseTl.current = gsap.timeline({ repeat: -1, yoyo: true })
      .to(triggerRef.current, { scale: 1.06, duration: 2.6, ease: 'sine.inOut' });
    return () => { pulseTl.current?.kill(); };
  }, []);

  // ── GSAP slide transition ───────────────────────────────────────────────
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (mainTl.current) mainTl.current.kill();
    mainTl.current = gsap.timeline({ defaults: { ease: 'expo.inOut' } });

    if (isEstimating) {
      // Material Analysis slides OUT to the left
      // Calculator slides IN from the right
      mainTl.current
        .to(pulseTl.current, { timeScale: 0, duration: 0.3 })
        .to(specsRef.current, { x: isMobile ? 0 : -120, opacity: 0, duration: 0.9, pointerEvents: 'none' }, 0)
        .to(triggerRef.current, { x: 80, opacity: 0, duration: 0.6 }, 0)
        .to(bgRef.current,     { xPercent: isMobile ? 0 : -12, opacity: 0.06, duration: 1.2 }, 0)
        .fromTo(calcRef.current,
          { x: isMobile ? 0 : 180, opacity: 0, pointerEvents: 'none' },
          { x: 0, opacity: 1, duration: 1.1, pointerEvents: 'auto' }, 0.25
        )
        .from('.est-item', { y: 30, opacity: 0, stagger: 0.09, duration: 1, clearProps: 'all' }, 0.5);
    } else {
      // Calculator slides OUT to the right
      // Material Analysis slides IN from the left
      mainTl.current
        .to(calcRef.current,  { x: isMobile ? 0 : 180, opacity: 0, duration: 0.85, pointerEvents: 'none' })
        .to(bgRef.current,    { xPercent: 0, opacity: 0.2, duration: 1.1 }, 0.2)
        .to(specsRef.current, { x: 0, opacity: 1, duration: 1.1, pointerEvents: 'auto' }, 0.2)
        .to(triggerRef.current, { x: 0, opacity: 1, duration: 1 }, 0.4)
        .to(pulseTl.current, { timeScale: 1, duration: 0.8 }, 1);
    }

    // ScrollTrigger bridge (only when NOT estimating) — tracks natural scroll opacity fade
    // We remove the 'pin' so it doesn't fight Lenis 100svh global snap layout.
    const bridge = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: '+=100%',
      scrub: isEstimating ? false : true,
      onUpdate: !isEstimating ? (self) => {
        const p = Math.min(1, self.progress * 1.4);
        if (specsRef.current) gsap.set(specsRef.current, { opacity: 1 - p, y: -80 * p, pointerEvents: p > 0.5 ? 'none' : 'auto' });
        if (bgRef.current) gsap.set(bgRef.current, { opacity: 0.2 * (1 - p) });
        if (triggerRef.current) gsap.set(triggerRef.current, { opacity: 1 - p });
      } : undefined,
    });

    return () => { mainTl.current?.kill(); bridge.kill(); };
  }, [isEstimating]);

  // ── Wizard state (quote continuation from calculator) ───────────────────
  const [inWizard, setInWizard] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    alert(`Added ${results.tileQuantity} ${results.tileQuantity === 1 ? pieceLabel : `${pieceLabel}s`} (${results.totalArea.toFixed(2)} m²) to cart!`);
    setIsEstimating(false);
    setInWizard(false);
  };
  const handleContinueBrowsing = () => {
    setIsEstimating(false);
    setInWizard(false);
  };
  const handleGenerateQuote = () => {
    // Slide into wizard (within the same calc panel — no GSAP required,
    // AnimatePresence inside handles the left/right step transition)
    setInWizard(true);
  };
  const handleWizardBack = () => setInWizard(false);
  const handleWizardDone = () => {
    setInWizard(false);
    setIsEstimating(false);
  };
  const handleDownloadSpecSheet = () => {
    if (!specSheetUrl) {
      return;
    }

    window.open(specSheetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      id="technical-spotlight"
      ref={sectionRef}
      className="relative w-full h-screen bg-transparent flex items-center justify-center overflow-hidden"
    >
      {/* Section mode label */}
      <div className="absolute top-10 left-10 z-20 hidden md:block">
        <div className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/20 flex items-center gap-3">
          <div className="w-6 h-px bg-white/10" />
          <AnimatePresence mode="wait">
            <motion.span key={isEstimating ? 'est' : 'mat'}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}>
              {isEstimating ? 'Project Estimation' : 'Material Analysis'}
            </motion.span>
          </AnimatePresence>
        </div>
        {/* Selected tile name tag */}
        <AnimatePresence>
          {tileName && !isEstimating && (
            <motion.div
              key={tileName}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-2 flex items-center gap-2"
            >
              {resolvedCatalogItem?.color && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: resolvedCatalogItem.color }}
                />
              )}
              <span className="text-[10px] font-mono text-white/40">
                {tileName}
                {tilePrice && <span className={`ml-2 ${textClass}/70`}>{tilePrice}</span>}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Radar background */}
      <div ref={bgRef} className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full border border-white/8 relative">
          <div className="absolute inset-0 border border-white/5 rounded-full scale-75" />
          <div className="absolute inset-0 border border-white/4 rounded-full scale-50" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/8 -translate-x-1/2" />
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/8 -translate-y-1/2" />
        </div>
      </div>

      {/* ── Mode 1: Material Specs ── */}
      <div ref={specsRef} className="absolute inset-0 w-full h-full flex items-center justify-center z-20 pointer-events-none">
        <div className="w-full max-w-7xl relative h-full">
          {activeSpecs.map((spec: any, idx: number) => {
            const isLeft = spec.position.x < 0;
            const isTop  = spec.position.y > 0;
            return (
              <motion.div
                key={spec.label}
                initial={{ opacity: 0, x: isLeft ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.07 }}
                className={`spec-label absolute flex flex-col ${isLeft ? 'items-end text-right' : 'items-start text-left'}`}
                style={{
                  left:   isLeft  ? (window.innerWidth < 768 ? '10%' : '12%') : 'auto',
                  right:  !isLeft ? (window.innerWidth < 768 ? '10%' : '12%') : 'auto',
                  top:    isTop   ? (window.innerWidth < 768 ? '20%' : '28%') : 'auto',
                  bottom: !isTop  ? (window.innerWidth < 768 ? '20%' : '28%') : 'auto',
                }}
              >
                <div className="text-[8px] md:text-[10px] text-white/35 tracking-[0.4em] uppercase mb-1 md:mb-3 flex items-center gap-3">
                  {isLeft  && <div className="w-6 md:w-10 h-px bg-white/15" />}
                  {spec.label}
                  {!isLeft && <div className="w-6 md:w-10 h-px bg-white/15" />}
                </div>
                <div className={`text-2xl md:text-4xl font-serif font-bold text-white border-white/15 pb-2 ${isLeft ? 'border-r-2 pr-4 md:pr-6' : 'border-l-2 pl-4 md:pl-6'}`}>
                  {spec.value}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Calculator trigger button ── */}
      <div
        ref={triggerRef}
        className="absolute bottom-14 md:bottom-auto md:right-16 md:top-1/2 md:-translate-y-1/2 z-30 flex justify-center w-full md:w-auto"
      >
        <AnimatePresence>
          {!isEstimating && (
            <CalcTrigger onClick={() => setIsEstimating(true)} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Mode 2: Calculator panel ── */}
      <div
        ref={calcRef}
        className="absolute inset-0 flex items-center justify-center z-40 opacity-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, transparent 60%, rgba(10,15,10,0.8) 100%)', backdropFilter: 'blur(40px)' }}
      >
        <div className="w-full max-w-lg px-8 md:px-0">

          {/* ── AnimatePresence switches between Estimation and Wizard ── */}
          <AnimatePresence mode="wait">
            {inWizard ? (
              <motion.div
                key="wizard"
                initial={{ x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -80, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 200 }}
              >
                <InlineQuoteWizard
                  results={results}
                  tileName={tileName}
                  tilePrice={tilePrice}
                  quoteModel={quoteModel}
                  onBack={handleWizardBack}
                  onDone={handleWizardDone}
                />
              </motion.div>
            ) : (
              <motion.div
                key="estimation"
                initial={{ x: -80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -80, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 200 }}
              >
          {/* Back nav */}
          <button
            onClick={() => setIsEstimating(false)}
            className="est-item group flex items-center gap-2 mb-6 text-white/35 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 group-hover:bg-white/5 transition-all">
              <ArrowRight size={13} className="rotate-180" />
            </div>
            <span className="text-[9px] font-bold tracking-[0.4em] uppercase">Back to Specs</span>
          </button>

          {/* Header */}
          <div className="est-item flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${bgClass}/10 border ${borderClass}/20 flex items-center justify-center`}>
                <Calculator size={14} className={`${textClass}`} />
              </div>
              <h3 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight uppercase leading-none">
                Estimation
              </h3>
            </div>
            {/* Unit toggle */}
            <div className="flex bg-white/5 rounded-full p-1 border border-white/8">
              {(['m', 'mm'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => setDims(d => ({ ...d, unit: u }))}
                  className="px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all"
                  style={{ backgroundColor: dims.unit === u ? accentColor : 'transparent', color: dims.unit === u ? '#000' : 'rgba(255,255,255,0.35)' }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Dimension inputs */}
          <div className="est-item grid grid-cols-2 gap-6 mb-8">
            {([
              ['Surface Width', 'width'],
              ['Surface Height', 'height'],
            ] as const).map(([label, key]) => (
              <div key={key} className="space-y-2">
                <label className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">{label}</label>
                <div className="relative group/input">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={dims[key]}
                    onChange={e => setDims(d => ({ ...d, [key]: Number(e.target.value) }))}
                    className={`w-full bg-transparent text-4xl md:text-5xl font-serif font-bold text-white focus:outline-none border-b-2 border-white/10 pb-2 focus:${borderClass} transition-colors `}
                  />
                  <span className="absolute right-0 bottom-4 text-white/20 font-mono text-xs uppercase">{dims.unit}</span>
                  {/* Animated focus underline */}
                  <div className={`absolute bottom-0 left-0 h-[2px] w-0 ${bgClass} group-focus-within/input:w-full transition-all duration-500`} />
                </div>
              </div>
            ))}
          </div>

          {/* Live results strip */}
          <div className="est-item grid grid-cols-3 gap-4 border-t border-white/5 pt-6 mb-6">
            <ResultRow label="Total Area"  value={results.totalArea}     unit="m²" />
            <ResultRow label="Piece Count"  value={results.tileQuantity} unit={pieceLabel} accent={accentColor} />
            <ResultRow label={`+${dims.wastage}% Wastage`} value={Math.ceil(results.tileQuantity * dims.wastage / 100)} unit="extra" />
          </div>

          {/* Estimated investment */}
          <div className="est-item mb-6">
            <p className="text-[9px] text-white/25 uppercase tracking-[0.4em] mb-1">Estimated Investment</p>
            <p className={`text-4xl md:text-5xl font-serif font-bold ${textClass} tracking-tight leading-none`}>
              {results.formattedInvestment}
            </p>
            <p className="text-[8px] text-white/20 font-mono mt-1">Inclusive of VAT · Excl. delivery</p>
          </div>

          {/* Three-way CTA fork */}
          <div className="est-item flex flex-col gap-3">
            <button
              onClick={handleAddToCart}
              className={`w-full flex items-center justify-center gap-3 py-4 ${bgClass} text-black rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl`}
            >
              <ShoppingBag size={16} /> Add to Cart &amp; Continue Browsing
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleContinueBrowsing}
                className="flex items-center justify-center gap-2 py-3.5 border border-white/10 rounded-2xl text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:border-white/25 hover:bg-white/5 transition-all"
              >
                ← Back to Specs
              </button>
              <button
                onClick={handleGenerateQuote}
                className={`flex items-center justify-center gap-2 py-3.5 border ${borderClass}/30 rounded-2xl text-[9px] font-bold uppercase tracking-widest ${textClass}/80 hover:${textClass} hover:${borderClass}/60 hover:${bgClass}/5 transition-all`}
              >
                Full Quote <ChevronRight size={13} />
              </button>
            </div>
          </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Download spec sheet (Material Analysis mode only) */}
      {!isEstimating && (
        <div className="absolute bottom-10 left-10 z-30 hidden md:block">
          {technicalTests.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2 max-w-md">
              {technicalTests.slice(0, 3).map((result) => (
                <div key={result.type} className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2">
                  <div className="text-[8px] font-bold uppercase tracking-[0.35em] text-white/25">{result.type}</div>
                  <div className="mt-1 text-[11px] font-mono text-white/70">
                    {result.value} {result.unit}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <button
            onClick={handleDownloadSpecSheet}
            disabled={!specSheetUrl}
            className="px-7 py-3.5 bg-white/5 border border-white/8 rounded-full text-[9px] font-bold tracking-[0.4em] uppercase text-white/50 hover:bg-white/10 hover:text-white transition-all flex items-center gap-3 group disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={13} className="group-hover:translate-y-0.5 transition-transform" />
            Download Spec Sheet
          </button>
        </div>
      )}
    </section>
  );
}
