import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ArrowLeft, ChevronRight, Truck, MapPin, Building2,
  Package, Check, User, Mail, Phone, ShoppingBag, ShoppingCart
} from 'lucide-react';
import { useVisualLab, useTheme } from './VisualLabContext';
import { QuoteDocument } from './QuoteDocument';
import { useStorefrontCategoryData } from '../catalog/storefrontData';
import {
  calculateQuoteBreakdown,
  convertQuantity,
  formatZar,
  getPricingUnitLabel,
  getRecommendedQuoteUnit,
  type ProductQuoteModel,
} from '../pricing/quoteEngine';

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 })
};
const slideTransition: any = { type: 'spring', damping: 28, stiffness: 220 };

function buildCartFallbackProduct(category: 'cladding-tiles' | 'bricks' | 'paving' | 'breeze-blocks', name: string, pricePerUnit: number): ProductQuoteModel {
  const isBrick = category === 'bricks';
  const isCladding = category === 'cladding-tiles';

  return {
    name,
    categoryKey: category,
    pricingUnit: isBrick ? 'piece' : isCladding ? 'm2' : 'piece',
    sellPriceZar: pricePerUnit,
    unitsPerM2: isBrick ? 55 : isCladding ? 50 : 1,
    weightPerPieceKg: 0,
    piecesPerPallet: isBrick ? 500 : isCladding ? 2000 : 1,
    boxesPerPallet: isCladding ? 40 : 0,
    palletsPerTruck: 24,
    logistics: {
      costPricePerKm: 25,
      sellPricePerKm: 35,
      fixedFee: 0,
      minimumCharge: 0,
    },
  };
}

export function CartCheckoutWizard() {
  const {
    isCartWizardOpen, setIsCartWizardOpen,
    cart, setCart
  } = useVisualLab();

  const { primaryColor } = useTheme();
  const textClass = 'text-white';
  const bgClass = 'bg-white';
  const borderClass = 'border-white';
  const inputCls = "w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white outline-none transition-colors placeholder:text-white/20";

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [fulfillment, setFulfillment] = useState<'delivery' | 'collection' | ''>('');
  const [address, setAddress] = useState({ street: '', city: '', province: '', code: '' });
  const [contact, setContact] = useState({ name: '', email: '', phone: '', company: '' });
  const [submitted, setSubmitted] = useState(false);
  const firstCategory = cart[0]?.category ?? 'cladding-tiles';
  const { categoryData } = useStorefrontCategoryData(firstCategory);

  const go = (target: number) => {
    setDir(target > step ? 1 : -1);
    setStep(target);
  };

  const handleClose = () => {
    setIsCartWizardOpen(false);
    setTimeout(() => {
      setStep(1); setDir(1);
      setFulfillment('');
      setAddress({ street: '', city: '', province: '', code: '' });
      setContact({ name: '', email: '', phone: '', company: '' });
      setSubmitted(false);
    }, 500);
  };

  const STEPS = ['Cart Summary', 'Logistics', 'Volume', 'Contact'];
  const maxStep = STEPS.length;

  const totalPallets = useMemo(() => {
    return cart.reduce((total, item) => {
      const product = item.quoteModel ?? buildCartFallbackProduct(item.category, item.name, item.pricePerUnit);
      const quantityUnit = item.quantityUnit ?? getRecommendedQuoteUnit(product);
      const quote = calculateQuoteBreakdown({
        product,
        quantity: item.uomQty,
        quantityUnit,
        minimumQuantity: 1,
        province: address.province,
        isDelivery: fulfillment === 'delivery',
      });

      return total + quote.pallets;
    }, 0);
  }, [address.province, cart, fulfillment]);
  
  const estimatedTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const product = item.quoteModel ?? buildCartFallbackProduct(item.category, item.name, item.pricePerUnit);
      const quantityUnit = item.quantityUnit ?? getRecommendedQuoteUnit(product);
      const quote = calculateQuoteBreakdown({
        product,
        quantity: item.uomQty,
        quantityUnit,
        minimumQuantity: 1,
        province: address.province,
        isDelivery: fulfillment === 'delivery',
      });

      return total + quote.productTotalZar;
    }, 0);
  }, [address.province, cart, fulfillment]);

  const suggestedProducts = useMemo(() => {
    if (cart.length === 0) return [];
    const inCartIds = new Set(cart.map(c => c.id));
    return (categoryData?.catalog || []).filter((i: any) => !inCartIds.has(i.id)).slice(0, 2);
  }, [cart, categoryData]);

  const updateCartItemUom = (id: string, uomQty: number) => {
    if (uomQty < 1) return;
    setCart(cart.map(c => {
      if (c.id === id) {
        const product = c.quoteModel ?? buildCartFallbackProduct(c.category, c.name, c.pricePerUnit);
        const quantityUnit = c.quantityUnit ?? getRecommendedQuoteUnit(product);
        return {
          ...c,
          quantityUnit,
          uomQty,
          rawQty: Math.ceil(convertQuantity(product, uomQty, quantityUnit, 'piece')),
        };
      }
      return c;
    }));
  };

  const addSuggestedItem = (p: any) => {
    if (cart.length === 0) return;
    const firstCat = cart[0].category;
    const product = p.quoteModel ?? buildCartFallbackProduct(firstCat as any, p.name, parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0);
    const quantityUnit = getRecommendedQuoteUnit(product);
    setCart([...cart, {
      id: p.id,
      name: p.name,
      category: firstCat as any,
      rawQty: Math.ceil(convertQuantity(product, 1, quantityUnit, 'piece')),
      uomQty: 1,
      pricePerUnit: product.sellPriceZar,
      image: p.images ? p.images[0] : p.image,
      color: p.color,
      quantityUnit,
      quoteModel: product,
    }]);
  };

  const canProceed = () => {
    if (step === 1) return cart.length > 0;
    if (step === 2 && fulfillment === '') return false;
    if (step === 2 && fulfillment === 'delivery' && (!address.city || !address.province)) return false;
    if (step === 4 && (!contact.name || !contact.email)) return false;
    return true;
  };

  const fillPercentage = Math.min((totalPallets / 24) * 100, 100);
  let discountMsg = "Adding more material on the same route lowers the delivered rate per unit.";
  if (fulfillment === 'delivery') {
    if (totalPallets >= 24) discountMsg = "Full truck loaded. The same trip cost is now spread across the maximum pallet volume.";
  } else if (fulfillment === 'collection') {
    if (totalPallets >= 20) discountMsg = "High-volume collection loaded.";
    else if (totalPallets >= 10) discountMsg = "Bulk collection is improving your unit economics.";
  }

  return (
    <AnimatePresence>
      {isCartWizardOpen && (
        <>
          {submitted ? (
            <QuoteDocument
              contact={contact}
              address={address}
              fulfillment={fulfillment}
              cartItems={cart}
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
                transition={{ type: 'spring', damping: 25, stiffness: 200 } as any}
                className={`w-full max-w-xl bg-black border ${borderClass}/20 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col relative max-h-[90vh]`}
              >
                {/* ── Header ──────────────────────────────────────────────────── */}
                <div className={`p-8 border-b ${borderClass}/10 flex justify-between items-center bg-white/[0.01] shrink-0`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${bgClass}/10 border ${borderClass}/20 flex items-center justify-center`}>
                      <ShoppingBag className={textClass} size={22} />
                    </div>
                    <div>
                      <span className="text-[9px] tracking-[0.3em] text-white/40 uppercase font-bold mb-1 block">Shopping Cart</span>
                      <h2 className="text-xl font-light text-white tracking-tight">Checkout</h2>
                    </div>
                  </div>
                  <button onClick={handleClose} className="p-3 hover:bg-white/5 rounded-full transition-colors text-white/30 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className={`h-[2px] w-full bg-white/5 flex shrink-0`}>
                  {STEPS.map((_, i) => (
                    <div key={i} className="flex-1 h-full transition-all duration-700"
                      style={{ backgroundColor: i < step ? primaryColor : 'transparent',
                               opacity: i < step ? 1 : 0.1 }} />
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  <AnimatePresence mode="wait" custom={dir}>
                    
                    {/* STEP 1: Cart Summary */}
                    {step === 1 && (
                      <motion.div key="step-1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} className="flex flex-col gap-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-1">Step 01 / Review</p>
                          <h3 className="text-2xl font-light text-white">Your Cart Items</h3>
                        </div>
                        {cart.length === 0 ? (
                          <div className="p-8 text-center text-white/40 border border-white/10 rounded-2xl border-dashed">
                            Your cart is empty.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {cart.map((c, idx) => (
                              <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                                {(() => {
                                  const product = c.quoteModel ?? buildCartFallbackProduct(c.category, c.name, c.pricePerUnit);
                                  const quantityUnit = c.quantityUnit ?? getRecommendedQuoteUnit(product);
                                  const quote = calculateQuoteBreakdown({
                                    product,
                                    quantity: c.uomQty,
                                    quantityUnit,
                                    minimumQuantity: 1,
                                    province: address.province,
                                    isDelivery: fulfillment === 'delivery',
                                  });

                                  return (
                                    <>
                                      <div className="w-12 h-12 rounded bg-white/10 overflow-hidden relative">
                                        {c.image ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ backgroundColor: c.color }} />}
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="text-white text-sm font-bold">{c.name}</h4>
                                        <p className="text-white/40 text-[10px] uppercase tracking-widest">
                                          {quote.pieces.toLocaleString()} Units · {c.uomQty} {getPricingUnitLabel(quantityUnit, product.categoryKey, c.uomQty)}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-white text-sm font-mono font-bold">{formatZar(quote.productTotalZar)}</p>
                                        <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-widest mt-1">Remove</button>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            ))}
                            <div className="flex justify-between items-center p-4">
                               <span className="text-white/40 text-xs uppercase tracking-widest font-bold">Est Product Total</span>
                               <span className="text-2xl font-light text-white">{formatZar(estimatedTotal)}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* STEP 2: Logistics */}
                    {step === 2 && (
                      <motion.div key="step-2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} className="flex flex-col gap-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-1">Step 02 / Logistics</p>
                          <h3 className="text-2xl font-light text-white">Fulfilment Method</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setFulfillment('delivery')}
                            className="p-6 rounded-2xl border flex flex-col items-center justify-center gap-4 transition-all"
                            style={{ 
                              borderColor: fulfillment === 'delivery' ? primaryColor : 'rgba(255,255,255,0.1)',
                              backgroundColor: fulfillment === 'delivery' ? `${primaryColor}10` : 'transparent'
                            }}
                          >
                            <Truck size={32} style={{ color: fulfillment === 'delivery' ? primaryColor : 'rgba(255,255,255,0.3)' }} />
                            <span className="text-sm font-bold uppercase tracking-widest text-white">Delivery</span>
                          </button>
                          <button
                            onClick={() => setFulfillment('collection')}
                            className="p-6 rounded-2xl border flex flex-col items-center justify-center gap-4 transition-all"
                            style={{ 
                              borderColor: fulfillment === 'collection' ? primaryColor : 'rgba(255,255,255,0.1)',
                              backgroundColor: fulfillment === 'collection' ? `${primaryColor}10` : 'transparent'
                            }}
                          >
                            <Package size={32} style={{ color: fulfillment === 'collection' ? primaryColor : 'rgba(255,255,255,0.3)' }} />
                            <span className="text-sm font-bold uppercase tracking-widest text-white">Collection</span>
                          </button>
                        </div>

                        {fulfillment === 'delivery' && (
                           <div className="space-y-4 pt-4 mt-4 border-t border-white/10">
                            <h4 className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Delivery Details</h4>
                            <div className="relative">
                              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                              <input type="text" placeholder="Street Address (Optional)" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} className={`${inputCls} pl-11`} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="relative">
                                <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                                <input type="text" placeholder="City" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className={`${inputCls} pl-11`} />
                              </div>
                              <input type="text" placeholder="Province / State" value={address.province} onChange={e => setAddress({ ...address, province: e.target.value })} className={inputCls} />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* STEP 3: Volume */}
                    {step === 3 && (
                      <motion.div key="step-3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} className="flex flex-col gap-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-1">Step 03 / Volume</p>
                          <h3 className="text-2xl font-light text-white">Optimize Your Load</h3>
                          <p className="text-white/40 text-[10px] md:text-xs mt-2">Adjust quantities or top up to fill the truck and reduce delivery costs.</p>
                        </div>
                        
                        <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-white/[0.03] space-y-6 md:space-y-8">
                          <div className="flex justify-between items-end border-b border-white/10 pb-4 md:pb-6">
                            <div>
                                <h4 className="text-2xl md:text-3xl font-light text-white">{totalPallets.toFixed(1)} <span className="text-sm md:text-base text-white/40">Pallets</span></h4>
                                <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/30 mt-1">Total Cart Volume</p>
                            </div>
                            <div className="text-right">
                                <h4 className="text-2xl md:text-3xl font-light" style={{ color: primaryColor }}>{fillPercentage.toFixed(0)}%</h4>
                                <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/30 mt-1">Truck Fill</p>
                            </div>
                          </div>
                          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                             <div className="absolute top-0 bottom-0 left-0 bg-white/20 transition-all duration-1000" style={{ width: `${fillPercentage}%`, backgroundColor: primaryColor }} />
                          </div>
                          {fillPercentage < 100 && (
                             <p className="text-[10px] md:text-xs text-white/50 text-center">{discountMsg}</p>
                          )}
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Adjust Existing Items</h4>
                          {cart.map((c) => (
                            <div key={c.id} className="p-4 rounded-xl border border-white/10 flex justify-between items-center gap-4">
                              {(() => {
                                const product = c.quoteModel ?? buildCartFallbackProduct(c.category, c.name, c.pricePerUnit);
                                const quantityUnit = c.quantityUnit ?? getRecommendedQuoteUnit(product);
                                const maxQty =
                                  quantityUnit === 'pallet'
                                    ? product.palletsPerTruck
                                    : quantityUnit === 'm2'
                                      ? Math.ceil(product.palletsPerTruck * (product.boxesPerPallet || 1))
                                      : quantityUnit === 'box'
                                        ? Math.ceil(product.palletsPerTruck * (product.boxesPerPallet || 1))
                                        : Math.ceil(product.palletsPerTruck * product.piecesPerPallet);

                                return (
                                  <>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-sm font-bold text-white truncate">{c.name}</h5>
                                      <p className="text-[10px] uppercase tracking-widest text-white/40">{c.uomQty} {getPricingUnitLabel(quantityUnit, product.categoryKey, c.uomQty)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="range" 
                                        min="1" 
                                        max={maxQty}
                                        value={c.uomQty}
                                        onChange={(e) => updateCartItemUom(c.id, parseInt(e.target.value))}
                                        className="w-20 md:w-32 accent-white opacity-70 hover:opacity-100 transition-opacity"
                                      />
                                      <span className="text-white font-mono text-xs w-8 text-right">{c.uomQty}</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          ))}
                        </div>

                        {suggestedProducts.length > 0 && fillPercentage < 100 && (
                          <div className="space-y-4 pt-4 border-t border-white/10">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Fill out your truck (Same Factory)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {suggestedProducts.map((p: any) => (
                                <div key={p.id} className="p-3 rounded-xl border border-white/10 bg-white/[0.01] flex gap-3 items-center group">
                                  <div className="w-10 h-10 rounded bg-white/10 overflow-hidden shrink-0">
                                    {(p.images || p.image) ? <img src={p.images ? p.images[0] : p.image} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ backgroundColor: p.color }} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-xs font-bold text-white truncate group-hover:text-white transition-colors">{p.name}</h5>
                                    <p className="text-[9px] uppercase tracking-widest text-white/40">{p.price}</p>
                                  </div>
                                  <button onClick={() => addSuggestedItem(p)} className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/40 transition-all">
                                    <ShoppingCart size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* STEP 4: Contact */}
                    {step === 4 && (
                      <motion.div key="step-4" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} className="flex flex-col gap-5">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-1">Step 04 / Checkout</p>
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
                </div>

                <div className={`p-6 sm:p-8 flex justify-between items-center bg-white/[0.01] border-t ${borderClass}/10 shrink-0`}>
                  <button onClick={() => step === 1 ? handleClose() : go(step - 1)} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 hover:text-white transition-colors group">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    {step === 1 ? 'Cancel' : 'Back'}
                  </button>
                  <button disabled={!canProceed()} onClick={() => { if (step < maxStep) { go(step + 1); return; } setSubmitted(true); }} className="flex items-center gap-3 px-8 py-4 rounded-2xl text-xs uppercase tracking-widest font-bold transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed text-black" style={{ backgroundColor: primaryColor }}>
                    {step === maxStep ? 'Generate Quote' : 'Continue'}
                    {step < maxStep ? <ChevronRight size={16} className="text-black/60" /> : <Check size={16} className="text-black/60" />}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
