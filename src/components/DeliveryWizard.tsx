import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ArrowLeft, ChevronRight, Truck, MapPin, Building2,
  Check, User, Mail, Phone, HelpCircle
} from 'lucide-react';
import { useVisualLab, useTheme } from './VisualLabContext';
import { VolumeEconomicsSlider } from './VolumeEconomicsSlider';
import { QuoteDocument } from './QuoteDocument';
import { RegionSelector } from './RegionSelector';
import { getRecommendedQuoteUnit, resolveTransportDistance, type ProductQuoteModel } from '../pricing/quoteEngine';

const FACTORY_LOCATIONS: Record<string, string> = {
  'cladding-tiles': 'Pretoria East Factory',
  'bricks':         'Midrand Mega-Plant',
  'paving':         'Krugersdorp Depot'
};

// ── Slide transition helpers ─────────────────────────────────────────────────
const slideVariants = {
  enter:  (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};
const slideTransition = { type: 'spring', damping: 28, stiffness: 220 } as const;

// ── Shared field style ───────────────────────────────────────────────────────
const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder:text-white/20';

export function DeliveryWizard() {
  const {
    isDeliveryWizardOpen, setIsDeliveryWizardOpen,
    activeCategory, selectedCatalogItem,
  } = useVisualLab();

  const { primaryColor, bgClass, borderClass, textClass } = useTheme();

  const [step, setStep]   = useState(1);
  const [dir,  setDir]    = useState(1);
  const [address, setAddress] = useState({ street: '', city: '', province: '', code: '' });
  const [uomQty, setUomQty]   = useState(1);
  const [contact,  setContact]  = useState({ name: '', email: '', phone: '', company: '' });
  const [submitted, setSubmitted] = useState(false);
  const [distance, setDistance]   = useState<number | null>(null);

  const factory   = FACTORY_LOCATIONS[activeCategory] ?? 'Main Depot';
  const itemLabel = selectedCatalogItem?.name ?? 'materials';
  const quoteModel: ProductQuoteModel | null = selectedCatalogItem?.quoteModel ?? null;
  const quoteUnit = quoteModel ? getRecommendedQuoteUnit(quoteModel) : 'piece';

  const go = (target: number) => {
    setDir(target > step ? 1 : -1);
    setStep(target);
  };

  const handleAddress = () => {
    const resolvedDistance = quoteModel
      ? resolveTransportDistance({ product: quoteModel, province: address.province }).distanceKm
      : 50;
    setDistance(resolvedDistance);
    go(2);
  };

  const handleClose = () => {
    setIsDeliveryWizardOpen(false);
    setTimeout(() => {
      setStep(1); setDir(1);
      setAddress({ street: '', city: '', province: '', code: '' });
      setUomQty(1);
      setContact({ name: '', email: '', phone: '', company: '' });
      setSubmitted(false); setDistance(null);
    }, 500);
  };

  const STEPS = ['Location', 'Volume', 'Contact'];
  const maxStep = STEPS.length;

  const canProceed = () => {
    if (step === 1) return address.city.trim() !== '' && address.province.trim() !== '';
    if (step === 2) return uomQty > 0;
    if (step === 3) return contact.name.trim() !== '' && contact.email.trim() !== '';
    return true;
  };

  return (
    <AnimatePresence>
      {isDeliveryWizardOpen && (
        <>
          {submitted ? (
            <QuoteDocument
              contact={contact}
              address={address}
              fulfillment="delivery"
              uomQty={uomQty}
              quantityUnit={quoteUnit}
              itemName={itemLabel}
              product={quoteModel}
              activeColor={primaryColor}
              onClose={handleClose}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-3xl"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`w-full max-w-xl bg-black border ${borderClass}/20 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)]`}
              >
                <div className={`p-8 border-b ${borderClass}/10 flex justify-between items-center bg-white/[0.01]`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${bgClass}/10 border ${borderClass}/20 flex items-center justify-center`}>
                      <Truck className={textClass} size={22} />
                    </div>
                    <div>
                      <span className="text-[9px] tracking-[0.3em] text-white/40 uppercase font-bold mb-1 block">Live Logistics</span>
                      <h2 className="text-xl font-light text-white tracking-tight">Delivery Cost Calculator</h2>
                    </div>
                  </div>
                  <button onClick={handleClose} className="p-3 hover:bg-white/5 rounded-full transition-colors text-white/30 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className={`h-[2px] w-full bg-white/5 flex`}>
                  {STEPS.map((_, i) => (
                    <div key={i} className="flex-1 h-full transition-all duration-700"
                      style={{ backgroundColor: i < step ? primaryColor : 'transparent',
                               opacity: i < step ? 1 : 0.1 }} />
                  ))}
                </div>

                <div className="p-8 min-h-[480px] flex flex-col">
                  <AnimatePresence mode="wait" custom={dir}>
                    {step === 1 && (
                      <motion.div key="step-1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} className="flex flex-col flex-1 gap-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-1">Step 01 / Location</p>
                          <h3 className="text-2xl font-light text-white">Where are we shipping your <span className={`${textClass} font-medium`}>{itemLabel}</span>?</h3>
                          <p className="text-white/35 text-xs mt-2">We calculate the live rate from our <span className="text-white/60">{factory}</span>.</p>
                        </div>
                        <div className="space-y-4 pt-2">
                          <div className="relative">
                            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                            <input type="text" placeholder="Street Address (Optional)" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} className={`${inputCls} pl-11`} />
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="relative">
                              <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                              <input type="text" placeholder="City" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className={`${inputCls} pl-11`} />
                            </div>
                            
                            <div className="mt-4">
                              <label className="text-[10px] uppercase tracking-widest text-white/30 mb-3 block">Select Province</label>
                              <RegionSelector 
                                selectedRegion={address.province} 
                                setSelectedRegion={(r) => setAddress({ ...address, province: r })} 
                                fulfillment="delivery" 
                              />
                            </div>
                          </div>
                        </div>
                        <div className={`p-4 rounded-xl border ${borderClass}/20 bg-white/[0.03] flex items-start gap-3 mt-auto`}>
                          <div className={`${bgClass} text-black p-1 rounded-full shrink-0 mt-0.5`}><HelpCircle size={13} /></div>
                          <p className="text-[11px] leading-relaxed text-white/50">
                            <strong className="text-white block mb-0.5">Did you know?</strong>
                            Since the truck runs to your area either way, ordering <span className={textClass + ' font-semibold'}>more volume dramatically drops your per-unit cost</span>.
                          </p>
                        </div>
                      </motion.div>
                    )}
                    {step === 2 && distance !== null && (
                      <motion.div key="step-2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} className="flex flex-col flex-1 gap-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-1">Step 02 / Volume</p>
                          <h3 className="text-2xl font-light text-white">Volume Economics Simulator</h3>
                        </div>
                        <VolumeEconomicsSlider
                          product={quoteModel ?? {
                            name: itemLabel,
                            categoryKey: activeCategory,
                            pricingUnit: activeCategory === 'bricks' ? 'piece' : activeCategory === 'cladding-tiles' ? 'm2' : 'piece',
                            sellPriceZar: 0,
                            unitsPerM2: activeCategory === 'bricks' ? 55 : activeCategory === 'cladding-tiles' ? 50 : 1,
                            weightPerPieceKg: 0,
                            piecesPerPallet: activeCategory === 'bricks' ? 500 : activeCategory === 'cladding-tiles' ? 2000 : 1,
                            boxesPerPallet: activeCategory === 'cladding-tiles' ? 40 : 0,
                            palletsPerTruck: 24,
                            logistics: { costPricePerKm: 25, sellPricePerKm: 35, fixedFee: 0, minimumCharge: 0 },
                          }}
                          uomQty={uomQty}
                          setUomQty={setUomQty}
                          minUomQty={1}
                          quantityUnit={quoteUnit}
                          province={address.province}
                          isDelivery={true}
                          accentColor={primaryColor}
                          textClass={textClass}
                          bgClass={bgClass}
                          borderClass={borderClass}
                        />
                      </motion.div>
                    )}
                    {step === 3 && (
                      <motion.div key="step-3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} className="flex flex-col flex-1 gap-5">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-1">Step 03 / Contact</p>
                          <h3 className="text-2xl font-light text-white">Almost done — your details.</h3>
                        </div>
                        {[
                          ['name',    'Full Name',     contact.name,    (v: string) => setContact(c => ({ ...c, name: v })),    'text',  User],
                          ['email',   'Email Address', contact.email,   (v: string) => setContact(c => ({ ...c, email: v })),   'email', Mail],
                          ['phone',   'Telephone',     contact.phone,   (v: string) => setContact(c => ({ ...c, phone: v })),   'tel',   Phone],
                          ['company', 'Company (opt)', contact.company, (v: string) => setContact(c => ({ ...c, company: v })), 'text',  Building2],
                        ].map(([id, label, val, setter, type, Icon]: any) => (
                          <div key={id}>
                            <label className="text-[10px] uppercase tracking-widest text-white/30 mb-2 block">{label}</label>
                            <div className="relative">
                              <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                              <input type={type} placeholder={label} value={val} onChange={e => setter(e.target.value)} className={`${inputCls} pl-11`} />
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className={`flex justify-between items-center pt-6 mt-6 border-t border-white/5`}>
                    <button onClick={() => step === 1 ? handleClose() : go(step - 1)} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 hover:text-white transition-colors group">
                      <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                      {step === 1 ? 'Cancel' : 'Back'}
                    </button>
                    <button disabled={!canProceed()} onClick={() => { if (step === 1) { handleAddress(); return; } if (step < maxStep) { go(step + 1); return; } setSubmitted(true); }} className="flex items-center gap-3 px-8 py-4 rounded-2xl text-xs uppercase tracking-widest font-bold transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed text-black" style={{ backgroundColor: primaryColor }}>
                      {step === maxStep ? 'Receive Quote' : 'Continue'}
                      {step < maxStep ? <ChevronRight size={16} className="text-black/60" /> : <Check size={16} className="text-black/60" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
