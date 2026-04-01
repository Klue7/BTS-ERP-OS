import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Check, ArrowLeft, Send, Package, Truck, MapPin, Building2 } from 'lucide-react';
import { useVisualLab, useTheme } from './VisualLabContext';
import { VolumeEconomicsSlider } from './VolumeEconomicsSlider';
import { QuoteDocument } from './QuoteDocument';
import { RegionSelector } from './RegionSelector';

export function QuoteWizard() {
  const { 
    isQuoteWizardOpen, 
    setIsQuoteWizardOpen, 
    activeCategory, 
    selectedCatalogItem,
    quoteQuantity,
    setQuoteQuantity,
    setSelectedCatalogItem
  } = useVisualLab();
  
  const isBrick = activeCategory === 'bricks';
  
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [palletQty, setPalletQty] = useState(1);
  const [formData, setFormData] = useState({
    projectType: '',
    timeline: '',
    email: ''
  });

  const [length, setLength] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [includeWaste, setIncludeWaste] = useState(true);
  const [fulfillment, setFulfillment] = useState<'delivery'|'collection'>('delivery');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [address, setAddress] = useState({ street: '', city: '', code: '' });

  const handleDimChange = (l: string, h: string, w: boolean) => {
    setLength(l);
    setHeight(h);
    setIncludeWaste(w);
    
    const lval = parseFloat(l) || 0;
    const hval = parseFloat(h) || 0;
    if (lval > 0 && hval > 0) {
      let sqm = lval * hval;
      if (w) sqm *= 1.1;
      setQuoteQuantity(Math.ceil(sqm));
    }
  };

  const { primaryColor: activeColor, textClass, bgClass, borderClass } = useTheme();

  const handleClose = () => {
    setIsQuoteWizardOpen(false);
    setStep(1);
    setSubmitted(false);
  };

  const steps = [
    { title: 'Dimensions', description: 'Calculate your coverage'         },
    { title: 'Logistics',  description: 'Collection or Delivery?'         },
    { title: 'Location',   description: 'Where is your site located?'     },
    { title: 'Volume',     description: 'Delivery volume economics'       },
    { title: 'Project',    description: 'What type of project is this?'   },
    { title: 'Timeline',   description: 'When do you need the materials?' },
    { title: 'Contact',    description: 'Where should we send the quote?' }
  ];
  const maxSteps = steps.length;

  return (
    <AnimatePresence>
      {isQuoteWizardOpen && (
        <>
          {submitted ? (
             <QuoteDocument
                contact={{ name: "Guest User", email: formData.email, phone: "-", company: formData.projectType }}
                address={{ street: address.street, city: address.city || "TBD", province: selectedRegion || "Gauteng", code: address.code || "0000" }}
                fulfillment={fulfillment}
                uomQty={palletQty}
                itemName={selectedCatalogItem?.name || (isBrick ? "Signature Clay Bricks" : "Premium Cladding / Paving")}
                pricePerUnit={isBrick ? (4000/500) : (450/52)} // fallback proxy
                isBrick={isBrick}
                activeColor={activeColor}
                onClose={handleClose}
             />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
              style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.97) 100%)' }}
            >
              {/* Decorative blurred orbs */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: activeColor }} />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: activeColor }} />
              </div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-2xl rounded-3xl overflow-hidden relative shadow-[0_32px_80px_rgba(0,0,0,0.7)] border border-white/[0.08]"
                style={{ 
                  background: 'rgba(10,10,12,0.8)',
                  backdropFilter: 'blur(32px)',
                  WebkitBackdropFilter: 'blur(32px)'
                }}
              >
                {/* Header */}
              <div className="p-8 border-b border-white/[0.06] flex justify-between items-center" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full" style={{ backgroundColor: selectedCatalogItem?.color }} />
                </div>
                <div>
                  <span className="text-[9px] tracking-[0.4em] text-white/30 uppercase font-bold mb-1 block">Quote Request</span>
                  <h2 className="text-xl font-light text-white tracking-tight">
                    {selectedCatalogItem?.name}
                  </h2>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-3 hover:bg-white/5 rounded-full transition-colors text-white/30 hover:text-white"
              >
                <X size={20} />
              </button>
              </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-white/5 flex">
              {steps.map((_, i) => (
                <div 
                  key={i}
                  className="h-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${100 / steps.length}%`,
                    backgroundColor: i < step ? activeColor : 'transparent',
                    opacity: i < step ? 1 : 0.1
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="p-12 min-h-[450px] flex flex-col justify-center overflow-y-auto max-h-[65vh]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="space-y-10"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 bg-white/5 rounded border border-white/10 text-white/40">
                        Step 0{step}
                      </span>
                      <div className="h-[1px] w-8 bg-white/10" />
                    </div>
                    <h3 className="text-4xl font-light text-white tracking-tight leading-tight">
                      {steps[step - 1].description}
                    </h3>
                  </div>

                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Wall Length (Meters)</label>
                          <input 
                            type="number"
                            value={length}
                            onChange={(e) => handleDimChange(e.target.value, height, includeWaste)}
                            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-4 text-white text-xl outline-none focus:border-white/30 focus:bg-white/10 transition-all backdrop-blur-sm placeholder:text-white/20"
                            placeholder="e.g. 5"
                            min="0"
                            step="0.1"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Wall Height (Meters)</label>
                          <input 
                            type="number"
                            value={height}
                            onChange={(e) => handleDimChange(length, e.target.value, includeWaste)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-xl outline-none focus:border-white/30 transition-colors"
                            placeholder="e.g. 2.4"
                            min="0"
                            step="0.1"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 cursor-pointer group w-fit" onClick={() => handleDimChange(length, height, !includeWaste)}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${includeWaste ? 'bg-white border-white text-black' : 'border-white/30 text-transparent group-hover:border-white/50'}`}>
                          <Check size={14} />
                        </div>
                        <span className="text-sm text-white/60 group-hover:text-white transition-colors">Add 10% cutting waste (Recommended)</span>
                      </div>

                      <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Total Coverage</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-mono text-white tracking-tighter">{quoteQuantity}</span>
                            <span className="text-xl text-white/50 font-light">m²</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button onClick={() => { setLength(''); setHeight(''); setQuoteQuantity(Math.max(1, quoteQuantity - 1)); }} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all hover:scale-110 active:scale-90"><ArrowLeft size={18} /></button>
                          <button onClick={() => { setLength(''); setHeight(''); setQuoteQuantity(quoteQuantity + 1); }} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all hover:scale-110 active:scale-90"><ChevronRight size={18} /></button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 pt-4">
                        {[25, 50, 100, 250].map(val => (
                          <button 
                            key={val}
                            onClick={() => { setLength(''); setHeight(''); setQuoteQuantity(val); }}
                            className={`py-3 rounded-xl border transition-all text-[10px] uppercase tracking-widest font-bold backdrop-blur-sm ${
                              quoteQuantity === val && !length && !height 
                                ? 'bg-white text-black border-white shadow-lg' 
                                : 'bg-white/[0.04] border-white/[0.08] text-white/40 hover:border-white/30 hover:bg-white/[0.08]'
                            }`}
                          >
                            {val} m²
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="grid grid-cols-2 gap-4">
                      {(['delivery', 'collection'] as const).map(type => {
                        const isActive = fulfillment === type;
                        const Icon = type === 'delivery' ? Truck : Package;
                        return (
                          <button 
                            key={type}
                            onClick={() => setFulfillment(type)}
                            className="p-8 rounded-2xl border text-left transition-all group relative overflow-hidden backdrop-blur-xl"
                            style={{
                              borderColor: isActive ? activeColor : 'rgba(255,255,255,0.08)',
                              backgroundColor: isActive ? `${activeColor}18` : 'rgba(255,255,255,0.02)',
                              boxShadow: isActive ? `0 0 28px ${activeColor}25` : 'none'
                            }}
                          >
                            {isActive && (
                              <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ background: `linear-gradient(135deg, ${activeColor}, transparent)` }} />
                            )}
                            <div className={`w-14 h-14 rounded-full border mb-6 flex items-center justify-center transition-all shadow-lg z-10 relative ${isActive ? 'bg-white border-white scale-110' : 'border-white/10 text-white/40 group-hover:border-white/30 group-hover:bg-white/[0.05]'}`}>
                              <Icon size={22} style={{ color: isActive ? activeColor : undefined }} />
                            </div>
                            <span className={`relative z-10 text-[10px] font-bold uppercase tracking-widest block mb-2 transition-colors ${isActive ? 'text-white/60' : 'text-white/30 group-hover:text-white/50'}`}>Fulfillment</span>
                            <span className="relative z-10 text-2xl font-light text-white capitalize">{type}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
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
                            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4 shadow-inner">
                              <h4 className="text-[10px] uppercase tracking-widest text-white/50 mb-2 block font-bold flex items-center gap-2">
                                <Truck size={12} className="text-[#eab308]" /> Delivery Details
                              </h4>
                              <div className="relative">
                                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                                <input 
                                  type="text" 
                                  placeholder="Street Address" 
                                  value={address.street} 
                                  onChange={e => setAddress({ ...address, street: e.target.value })} 
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder:text-white/20 pl-11"
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
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder:text-white/20 pl-11"
                                  />
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="Postal Code" 
                                  value={address.code} 
                                  onChange={e => setAddress({ ...address, code: e.target.value })} 
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder:text-white/20"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-4">
                      <VolumeEconomicsSlider
                        uomQty={palletQty}
                        setUomQty={setPalletQty}
                        minUomQty={1}
                        pricePerUnit={0}
                        province={selectedRegion}
                        isDelivery={fulfillment === 'delivery'}
                        accentColor={activeColor}
                        textClass={textClass}
                        bgClass={bgClass}
                        borderClass={borderClass}
                      />
                    </div>
                  )}

                  {step === 5 && (
                    <div className="grid grid-cols-2 gap-4">
                      {['Residential', 'Commercial', 'Interior', 'Exterior'].map(type => (
                        <button 
                          key={type}
                          onClick={() => setFormData({ ...formData, projectType: type })}
                          className={`p-8 rounded-2xl border text-left transition-all group ${formData.projectType === type ? 'border-white bg-white/10' : 'border-white/10 hover:border-white/30 bg-white/[0.02]'}`}
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-widest block mb-2 transition-colors ${formData.projectType === type ? 'text-white' : 'text-white/30 group-hover:text-white/60'}`}>Project Type</span>
                          <span className="text-lg font-light text-white">{type}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {step === 6 && (
                    <div className="space-y-4">
                      {['ASAP', '1-3 Months', '3-6 Months', 'Planning Phase'].map(time => (
                        <button 
                          key={time}
                          onClick={() => setFormData({ ...formData, timeline: time })}
                          className={`w-full p-6 rounded-2xl border text-left flex justify-between items-center transition-all ${formData.timeline === time ? 'border-white bg-white/10' : 'border-white/10 hover:border-white/30 bg-white/[0.02]'}`}
                        >
                          <span className="text-sm font-light text-white tracking-wide">{time}</span>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${formData.timeline === time ? 'bg-white border-white' : 'border-white/20'}`}>
                            {formData.timeline === time && <Check size={14} className="text-black" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {step === 7 && (
                    <div className="space-y-6">
                      <div className="relative">
                        <input 
                          type="email" 
                          placeholder="your@email.com"
                          className="w-full bg-white/5 border border-white/10 p-8 rounded-2xl text-2xl text-white focus:border-white/30 outline-none transition-all placeholder:text-white/10"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20">
                          <Send size={24} />
                        </div>
                      </div>
                      <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                        <p className="text-[10px] text-white/30 leading-relaxed uppercase tracking-widest text-center">
                          Our specialists will review your project requirements and provide a detailed quote within 24 hours.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/5 flex justify-between items-center bg-white/[0.02]">
              <button 
                onClick={() => step > 1 && setStep(step - 1)}
                className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-40 hover:opacity-100 hover:-translate-x-1'}`}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <button 
                onClick={() => {
                  if (step < maxSteps) setStep(step + 1);
                  else setSubmitted(true);
                }}
                className="px-12 py-5 rounded-2xl flex items-center gap-4 group transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                style={{ backgroundColor: activeColor }}
              >
                <span className="text-white font-bold tracking-widest uppercase text-xs">
                  {step === maxSteps ? 'Submit Request' : 'Next Step'}
                </span>
                {step === maxSteps ? <Check size={18} className="text-white" /> : <ChevronRight size={18} className="text-white group-hover:translate-x-1 transition-transform" />}
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
