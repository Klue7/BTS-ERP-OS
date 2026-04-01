import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, ArrowRight, X, Sparkles, 
  Calculator, HardHat, Info, Check, 
  Trash2, Plus, ArrowLeft, Upload, FileText, Quote,
  Layers, Wand2, Boxes, Construction, FileUp,
  MapPin, Star, Phone, MessageSquare, ExternalLink,
  Users, Building2, Store
} from 'lucide-react';
import { NavigationBar } from './NavigationBar';
import { CustomizeStudio } from './CustomizeStudio';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useVisualLab } from './VisualLabContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type StudioMode = 'creative' | 'architect' | 'calculator';

interface Volume {
  id: number;
  vol: string;
  label: string;
  headline: [string, string];
  sub: string;
  accent: string;
  stats: { val: string; label: string }[];
  bgImg: string;
  mode: StudioMode;
}

interface Professional {
  id: string;
  name: string;
  role: string;
  rating: number;
  location: string;
  image: string;
  projects: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const VOLUMES: Volume[] = [
  {
    id: 0,
    vol: 'Volume 01',
    label: 'The Laboratory',
    headline: ['Generative', 'Design'],
    sub: 'Personalize your space with our deterministic and AI-enhanced material visualization engine.',
    accent: '#22c55e',
    stats: [{ val: 'v1.0', label: 'Engine' }, { val: '12+', label: 'Patterns' }],
    bgImg: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&q=80',
    mode: 'creative'
  },
  {
    id: 1,
    vol: 'Volume 02',
    label: 'Architectural Support',
    headline: ['Plan', 'Analysis'],
    sub: 'Submit your technical drawings and architectural plans for precision AI analysis and instant quoting.',
    accent: '#60a5fa',
    stats: [{ val: 'PDF/CAD', label: 'Formats' }, { val: '24h', label: 'Turnaround' }],
    bgImg: 'https://images.unsplash.com/photo-1503387762-592dea58ef23?w=1600&q=80',
    mode: 'architect'
  },
  {
    id: 2,
    vol: 'Volume 03',
    label: 'Engineering Logic',
    headline: ['Material', 'Logic'],
    sub: 'Calculate exact material requirements including bricks, sand, and cement with industry wastage ratios.',
    accent: '#fb923c',
    stats: [{ val: '5%', label: 'Wastage' }, { val: 'QS', label: 'Certified' }],
    bgImg: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?w=1600&q=80',
    mode: 'calculator'
  }
];

const ARCHITECTS: Professional[] = [
  { id: 'arc1', name: 'Studio Linear', role: 'Architectural Firm', rating: 4.9, location: 'Melbourne, VIC', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', projects: 42 },
  { id: 'arc2', name: 'Marcus Thorne', role: 'Structural Specialist', rating: 4.8, location: 'Sydney, NSW', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', projects: 89 },
  { id: 'arc3', name: 'Elena Rossi', role: 'Industrial Designer', rating: 5.0, location: 'Brisbane, QLD', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80', projects: 125 }
];

const CONTRACTORS: Professional[] = [
  { id: 'res1', name: 'Metro Resellers', role: 'Material Reseller', rating: 4.8, location: 'Melbourne, VIC', image: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?w=400&q=80', projects: 1200 },
  { id: 'con1', name: 'Prime Masonry', role: 'Master Bricklayers', rating: 4.7, location: 'Adelaide, SA', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', projects: 210 },
  { id: 'res2', name: 'Reseller Hub', role: 'Material Supplier', rating: 4.9, location: 'Perth, WA', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', projects: 540 },
  { id: 'con2', name: 'BuildLogic Solutions', role: 'General Contractor', rating: 4.8, location: 'Hobart, TAS', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80', projects: 67 }
];

// ─── Sub-Component: Professionals Row ────────────────────────────────────────
function ProfessionalsSection({ title, label, profs, accent, allowFilter = false }: { title: string; label: string; profs: Professional[]; accent: string; allowFilter?: boolean }) {
  const [filter, setFilter] = useState('all');
  
  const filteredProfs = useMemo(() => {
    if (!allowFilter || filter === 'all') return profs;
    return profs.filter(p => p.role.toLowerCase().includes(filter.toLowerCase()));
  }, [profs, filter, allowFilter]);

  return (
    <div className="mt-24 pt-24 border-t border-white/5">
       <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div>
             <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-px bg-white/20" />
                <span className="text-[10px] uppercase tracking-[0.4em] font-black" style={{ color: accent }}>{label}</span>
             </div>
             <h3 className="text-4xl font-serif text-white">{title}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             {allowFilter && (
               <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/5 mr-4 font-black">
                  {['all', 'Reseller', 'Contractor'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-6 py-2.5 rounded-full text-[9px] uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                    >
                      {f}s
                    </button>
                  ))}
               </div>
             )}
             <button className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] font-black text-white/30 hover:text-white transition-all group">
                Search Full Directory
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProfs.map((p, i) => (
             <motion.div 
               key={p.id}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 group hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer overflow-hidden relative"
             >
                <div className="flex items-start gap-6 mb-8">
                   <div className="w-20 h-20 rounded-3xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 shadow-2xl">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1">
                      <h4 className="text-lg font-black uppercase text-white mb-1 group-hover:text-blue-400 transition-colors" style={{ color: i === 0 ? accent : 'white' }}>{p.name}</h4>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-4">{p.role}</p>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1.5 text-yellow-500">
                            <Star size={12} fill="currentColor" />
                            <span className="text-[10px] font-mono text-white">{p.rating}</span>
                         </div>
                         <div className="w-px h-3 bg-white/10" />
                         <span className="text-[10px] font-mono text-white/40">{p.projects} Projects</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between py-6 border-t border-white/5">
                   <div className="flex items-center gap-2 text-white/30">
                      <MapPin size={12} />
                      <span className="text-[9px] uppercase tracking-widest font-black italic">{p.location}</span>
                   </div>
                   <div className="flex gap-2">
                      <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white transition-all shadow-xl">
                         <MessageSquare size={14} />
                      </button>
                      <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white transition-all shadow-xl">
                    <ExternalLink size={14} />
                 </button>
              </div>
           </div>

           {/* Decoration */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] rounded-full -mr-16 -mt-16 group-hover:bg-white/[0.03] transition-all" />
        </motion.div>
     ))}
  </div>
</div>
);
}

// ─── Sub-Component: QS Calculator ─────────────────────────────────────────────
function QSCalculator({ accent }: { accent: string }) {
const { setCart, setIsCartWizardOpen } = useVisualLab();
const [quantities, setQuantities] = useState({
length: 10,
height: 3,
thicknessMode: 'double' as 'single' | 'double',
});

  const [wastage, setWastage] = useState(5);
  const [internalStage, setInternalStage] = useState<'calculator' | 'wizard'>('calculator');
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'collection'>('delivery');

  const results = useMemo(() => {
    const area = quantities.length * quantities.height;
    const bricksPerM2 = quantities.thicknessMode === 'single' ? 55 : 110;
    const totalBricksBase = area * bricksPerM2;
    const totalBricksWithWastage = Math.ceil(totalBricksBase * (1 + wastage / 100));
    const cementBagsPer1000 = 3;
    const sandM3Per1000 = 0.6;
    const cementBags = Math.ceil((totalBricksWithWastage / 1000) * cementBagsPer1000);
    const sandM3 = ((totalBricksWithWastage / 1000) * sandM3Per1000).toFixed(2);
    const crushM3 = ((totalBricksWithWastage / 1000) * 0.3).toFixed(2);

    return {
      area: area.toFixed(2),
      bricks: totalBricksWithWastage,
      cement: cementBags,
      sand: sandM3,
      crush: crushM3,
      baseBricks: Math.ceil(totalBricksBase)
    };
  }, [quantities, wastage]);

  const handleBridgeToQuote = () => {
    setInternalStage('wizard');
    setWizardStep(0);
  };


return (
<div className="max-w-7xl mx-auto py-24 relative overflow-hidden">
  <AnimatePresence mode="wait">
    {internalStage === 'calculator' ? (
      <motion.div
        key="calc-view"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
          {/* Inputs */}
          <div className="lg:col-span-5 space-y-10 bg-white/[0.02] border border-white/5 p-12 rounded-[50px] shadow-3xl relative">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-2.5 h-12 rounded-full" style={{ backgroundColor: accent }} />
              <div>
                <h3 className="text-2xl font-bold uppercase tracking-widest text-white leading-none">Project Scope</h3>
                <p className="text-[11px] text-white/30 uppercase tracking-[0.3em] mt-2 font-black italic">Define project geometry</p>
              </div>
            </div>

            <div className="space-y-10">
              <div className="group">
                <div className="flex justify-between mb-5 text-[11px] uppercase tracking-[0.4em] text-white/20 group-focus-within:text-white transition-all font-black">
                  <span>Total Length</span>
                  <span className="text-white font-mono text-lg">{quantities.length}m</span>
                </div>
                <input type="range" min="1" max="100" step="0.5" value={quantities.length} onChange={e => setQuantities({...quantities, length: parseFloat(e.target.value)})} className="w-full accent-orange-500 bg-white/5 rounded-full h-2 appearance-none cursor-pointer" style={{ accentColor: accent }} />
              </div>

              <div className="group">
                <div className="flex justify-between mb-5 text-[11px] uppercase tracking-[0.4em] text-white/20 group-focus-within:text-white transition-all font-black">
                  <span>Wall Height</span>
                  <span className="text-white font-mono text-lg">{quantities.height}m</span>
                </div>
                <input type="range" min="0.5" max="20" step="0.1" value={quantities.height} onChange={e => setQuantities({...quantities, height: parseFloat(e.target.value)})} className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer" style={{ accentColor: accent }} />
              </div>

              <div className="pt-6">
                <span className="text-[11px] uppercase tracking-[0.4em] text-white/20 block mb-6 font-black italic">Architecture Pattern</span>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { id: 'single', label: 'Single Skin', desc: '110mm Width' },
                    { id: 'double', label: 'Double Skin', desc: '220mm Width' }
                  ].map(t => (
                    <button key={t.id} onClick={() => setQuantities({...quantities, thicknessMode: t.id as any})} className={`p-8 rounded-[32px] border text-left transition-all duration-700 ${quantities.thicknessMode === t.id ? 'bg-white/10 border-white/20 shadow-2xl scale-102' : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'}`}>
                      <span className="block text-xs font-black uppercase tracking-widest text-white mb-2">{t.label}</span>
                      <span className="block text-[10px] uppercase tracking-widest text-white/25 font-bold">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-black/40 border border-white/5 rounded-[40px] flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.3em] text-white/25 font-black block mb-2 underline underline-offset-4 decoration-white/10">Wastage Tolerance</span>
                  <span className="text-[9px] uppercase tracking-[0.4em] text-white/10 font-bold italic tracking-tighter">QS Safety Margin</span>
                </div>
                <div className="flex items-center gap-4">
                  {[5, 10, 15].map(v => (
                    <button key={v} onClick={() => setWastage(v)} className={`w-14 h-14 rounded-2xl text-[11px] font-black flex items-center justify-center transition-all duration-700 ${wastage === v ? 'bg-white text-black shadow-2xl scale-110' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white'}`}>
                      {v}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-7 space-y-12">
            <div className="bg-[#0c0c0c] border border-white/8 p-14 rounded-[60px] shadow-[0_60px_120px_rgba(0,0,0,0.8)] relative overflow-hidden group min-h-[500px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 blur-[150px] rounded-full -mr-48 -mt-48 transition-all duration-1000 group-hover:bg-orange-500/10" style={{ backgroundColor: `${accent}08` }} />
              
              <div className="relative z-10">
                <div className="flex items-center gap-6 mb-16 text-white/15">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[12px] uppercase tracking-[0.6em] font-black italic">Quantification Report</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 px-4">
                  <div className="flex flex-col gap-3 border-l-2 border-white/5 pl-10 hover:border-white/20 transition-all duration-700">
                    <span className="text-[11px] uppercase tracking-[0.5em] text-white/20 font-black italic">Execution Area</span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-7xl font-mono text-white tracking-tighter leading-none">{results.area}</span>
                      <span className="text-2xl text-white/20 font-serif italic">m²</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-l-2 border-white/5 pl-10 hover:border-white/20 transition-all duration-700">
                    <span className="text-[11px] uppercase tracking-[0.5em] text-white/20 font-black italic">Unit Requirement</span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-7xl font-mono text-white tracking-tighter leading-none">{results.bricks}</span>
                      <span className="text-sm text-white/20 font-serif italic uppercase tracking-[0.4em] font-black">Bricks</span>
                    </div>
                  </div>

                  <div className="space-y-2 pl-10">
                    <span className="text-[11px] uppercase tracking-[0.4em] text-white/20 font-black">Standard Cement Bags</span>
                    <div className="flex items-baseline gap-4">
                      <span className="text-5xl font-mono text-white tracking-tighter">{results.cement}</span>
                      <span className="text-[11px] text-white/25 uppercase tracking-[0.4em] font-black">50kg SABS bags</span>
                    </div>
                  </div>

                  <div className="space-y-2 pl-10">
                    <span className="text-[11px] uppercase tracking-[0.4em] text-white/20 font-black">Aggregate Composition</span>
                    <div className="flex items-center gap-10">
                       <div className="flex items-baseline gap-3">
                         <span className="text-5xl font-mono text-white tracking-tighter">{results.sand}</span>
                         <span className="text-[10px] text-white/15 uppercase tracking-widest font-black italic">Sand m³</span>
                       </div>
                       <div className="flex items-baseline gap-3">
                         <span className="text-5xl font-mono text-white tracking-tighter">{results.crush}</span>
                         <span className="text-[10px] text-white/15 uppercase tracking-widest font-black italic">Crush m³</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="mt-20 flex flex-col md:flex-row gap-6 px-4">
                   <button 
                    onClick={handleBridgeToQuote}
                    className="flex-2 py-7 bg-white text-black rounded-[2.5rem] text-sm font-black uppercase tracking-[0.6em] hover:bg-orange-500 hover:text-white hover:shadow-[0_20px_80px_rgba(251,146,60,0.4)] transition-all flex items-center justify-center gap-5 active:scale-95 group/btn"
                   >
                      <Quote size={20} className="group-hover/btn:rotate-12 transition-transform" />
                      Proceed to Quote Wizard
                   </button>
                   <button 
                     onClick={() => document.getElementById('directory-section')?.scrollIntoView({ behavior: 'smooth' })}
                     className="flex-1 py-7 bg-white/[0.05] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08] hover:border-white/20 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-4 active:scale-95"
                   >
                      <MapPin size={18} className="text-orange-400 group-hover:scale-110 transition-transform" />
                      Local Resellers
                   </button>
                </div>
              </div>
            </div>

            <div className="p-10 bg-black/40 border border-white/5 rounded-[40px] flex items-center gap-10 shadow-2xl">
               <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                 <Construction size={28} className="text-white/20" />
               </div>
               <p className="text-[11px] text-white/25 uppercase tracking-widest leading-[2.2] font-black italic">
                  Engineering Notice: Calculations are deterministic models based on standard mortar consistency. Site conditions, bond patterns, and joint width may require professional adjustment.
               </p>
            </div>
          </div>
        </div>
      </motion.div>
    ) : (
      <motion.div
        key="wizard-view"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-[80vh] flex flex-col items-center justify-center py-20"
      >
         <div className="w-full max-w-6xl bg-[#0c0c0c] border border-orange-500/20 p-8 md:p-20 rounded-[80px] shadow-[0_80px_160px_rgba(0,0,0,1)] relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.05),transparent)] pointer-events-none" />
            
            <button 
              onClick={() => {
                if (wizardStep === 0) setInternalStage('calculator');
                else setWizardStep(prev => prev - 1);
              }}
              className="absolute top-12 left-12 flex items-center gap-4 text-[10px] uppercase tracking-[0.5em] font-black text-white/30 hover:text-white transition-all group z-20"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              {wizardStep === 0 ? 'Back to Scope' : 'Previous Step'}
            </button>

            {/* Stepper Progress */}
            <div className="flex items-center justify-center gap-4 mb-20">
               {[0, 1, 2, 3].map(s => (
                  <div key={s} className="flex items-center gap-4">
                     <div className={`w-12 h-1.5 rounded-full transition-all duration-1000 ${s <= wizardStep ? 'bg-orange-500' : 'bg-white/10'}`} />
                     {s < 3 && <div className="w-2 h-2 rounded-full bg-white/5" />}
                  </div>
               ))}
            </div>

            <AnimatePresence mode="wait">
               {wizardStep === 0 && (
                 <motion.div key="step-0" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <div className="text-center mb-16 px-12">
                       <h2 className="text-6xl font-['Anton'] uppercase text-white mb-8 tracking-tighter">Choose Your Material</h2>
                       <p className="text-white/30 text-[11px] uppercase tracking-[0.5em] leading-[2.5] italic max-w-2xl mx-auto font-bold">
                          Select the series to fulfill your <span className="text-white">{results.bricks}</span> bricks requirement. Prices are regional estimates.
                       </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
                       {[
                         { id: 'serengeti', name: 'Serengeti Series', price: 12.50, img: 'https://images.unsplash.com/photo-1590069230002-70cc884999f1?w=400&q=80' },
                         { id: 'kalahari', name: 'Kalahari Series', price: 14.80, img: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?w=400&q=80' },
                         { id: 'zambezi', name: 'Zambezi Series', price: 11.90, img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80' }
                       ].map((p) => (
                         <div 
                           key={p.id} 
                           onClick={() => setSelectedProduct(p)}
                           className={`bg-white/[0.02] border-2 rounded-[50px] p-10 group transition-all cursor-pointer relative overflow-hidden ${selectedProduct?.id === p.id ? 'border-orange-500 bg-white/5' : 'border-white/5 hover:border-white/10 hover:bg-white/[0.03]'}`}
                         >
                            <div className="aspect-[4/3] rounded-[32px] overflow-hidden mb-8 shadow-2xl">
                               <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                            </div>
                            <div className="flex justify-between items-start">
                               <div>
                                  <h4 className="text-xs font-black uppercase tracking-widest text-white mb-3">{p.name}</h4>
                                  <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">R{p.price.toFixed(2)} / unit</span>
                               </div>
                               <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${selectedProduct?.id === p.id ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/10 group-hover:text-white/30'}`}>
                                  {selectedProduct?.id === p.id ? <Check size={20} /> : <Plus size={20} />}
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>

                    <div className="flex justify-center">
                       <button 
                         disabled={!selectedProduct}
                         onClick={() => setWizardStep(1)}
                         className="px-16 py-8 bg-white text-black rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.6em] hover:bg-orange-500 hover:text-white hover:shadow-[0_20px_80px_rgba(251,146,60,0.4)] transition-all flex items-center gap-6 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group"
                       >
                          Configure Logistics
                          <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                       </button>
                    </div>
                 </motion.div>
               )}

               {wizardStep === 1 && (
                 <motion.div key="step-1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-16">
                    <div className="text-center">
                       <h2 className="text-6xl font-['Anton'] uppercase text-white mb-4 tracking-tighter">Fulfillment Method</h2>
                       <p className="text-white/30 text-[10px] uppercase tracking-[0.5em] font-bold">Choose how you wish to receive your inventory</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
                       {[
                         { id: 'delivery', label: 'Express Delivery', icon: Construction, desc: 'Routed via local fleet partners' },
                         { id: 'collection', label: 'Factory Collection', icon: Building2, desc: 'Collect directly from dispatch' }
                       ].map(m => (
                         <button 
                           key={m.id} 
                           onClick={() => setFulfillmentType(m.id as any)}
                           className={`p-12 rounded-[50px] border-2 text-left transition-all relative overflow-hidden group ${fulfillmentType === m.id ? 'bg-orange-500/10 border-orange-500 shadow-3xl' : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/5'}`}
                         >
                            <m.icon size={48} className={`mb-8 ${fulfillmentType === m.id ? 'text-orange-400' : 'text-white/20'}`} />
                            <h4 className="text-lg font-black uppercase text-white mb-3 tracking-widest">{m.label}</h4>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 leading-loose">{m.desc}</p>
                         </button>
                       ))}
                    </div>

                    {fulfillmentType === 'collection' && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto p-12 bg-white/[0.03] border border-orange-500/20 rounded-[40px] text-center">
                         <div className="flex items-center justify-center gap-6 mb-8 text-orange-400">
                            <Sparkles size={24} />
                            <span className="text-[12px] uppercase tracking-[0.6em] font-black">Bulk Efficiency Discount</span>
                         </div>
                         <p className="text-[11px] text-white/40 uppercase tracking-[0.4em] leading-[2.2] mb-10 italic">
                            Factory collections of <span className="text-white">{" > "}10 pallets</span> receive <span className="text-orange-400">2.5% discount</span>. Units over <span className="text-white">20 pallets</span> unlock <span className="text-orange-400">5% discount</span>.
                         </p>
                         <div className="space-y-6">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-white/30">
                               <span>Volume Slider</span>
                               <span className="text-white">{results.bricks} Units</span>
                            </div>
                            <input type="range" min="1000" max="50000" step="500" value={results.bricks} className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-not-allowed" disabled />
                            <p className="text-[9px] text-orange-500/60 uppercase tracking-[0.4em] font-bold">Volume linked to QS Calculation</p>
                         </div>
                      </motion.div>
                    )}

                    <div className="flex justify-center">
                       <button 
                         onClick={() => setWizardStep(fulfillmentType === 'delivery' ? 2 : 3)}
                         className="px-16 py-8 bg-white text-black rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.6em] hover:bg-orange-500 hover:text-white transition-all active:scale-95 group"
                       >
                          {fulfillmentType === 'delivery' ? 'Optimize Load' : 'Generate Final Quote'}
                          <ArrowRight size={18} className="ml-4 group-hover:translate-x-2 transition-transform" />
                       </button>
                    </div>
                 </motion.div>
               )}

               {wizardStep === 2 && (
                 <motion.div key="step-2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-16">
                    <div className="text-center max-w-3xl mx-auto">
                       <h2 className="text-6xl font-['Anton'] uppercase text-white mb-6 tracking-tighter">Truck Fill Optimization</h2>
                       <p className="text-white/30 text-[11px] uppercase tracking-[0.5em] leading-[2.5] italic font-bold">
                          Fulfilling with half-empty trucks increases cost per unit. Adjust your volume or add companion products to maximize logistical efficiency.
                       </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                       <div className="space-y-10">
                          <div className="p-12 bg-white/[0.03] border border-white/10 rounded-[50px] relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl pointer-events-none" />
                             <span className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-black block mb-6 italic">Current Load Profile</span>
                             <div className="flex items-center justify-between mb-8">
                                <span className="text-sm font-black uppercase tracking-widest text-white">Logistics Efficiency</span>
                                <span className="text-2xl font-mono text-orange-500">62%</span>
                             </div>
                             <div className="h-4 bg-white/5 rounded-full overflow-hidden mb-6">
                                <motion.div initial={{ width: 0 }} animate={{ width: '62%' }} transition={{ duration: 1.5, ease: 'circOut' }} className="h-full bg-orange-500" />
                             </div>
                             <p className="text-[9px] uppercase tracking-[0.3em] text-white/20 italic">Estimated surcharge: R2.40 / unit due to low truck-fill.</p>
                          </div>

                          <div className="p-10 border border-orange-500/20 rounded-[40px] bg-orange-500/[0.02]">
                             <p className="text-[11px] text-orange-400 uppercase tracking-[0.4em] font-black mb-6 flex items-center gap-4">
                                <Sparkles size={16} />
                                Maximization Logic
                             </p>
                             <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] leading-loose">
                                Fill the remaining <span className="text-white">38%</span> of the truck with adjacent products from the same factory (Tiles, Lintels, or Pavers) to drop delivery rate to <span className="text-green-400">R0.00</span> per additional item.
                             </p>
                          </div>
                       </div>

                       <div className="bg-white/5 p-12 rounded-[60px] border border-white/10 space-y-12">
                          <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-8">Add Companion Materials</h4>
                          <div className="space-y-6">
                             {[
                               { name: 'Classic Paving', price: 'R8.50', stock: '24 Pallets' },
                               { name: 'Reinforced Lintels', price: 'R245', stock: 'In Stock' }
                             ].map((c, i) => (
                               <div key={i} className="flex items-center justify-between p-6 bg-black/40 rounded-3xl border border-white/5 group hover:border-orange-500/30 transition-all cursor-pointer">
                                  <div className="flex items-center gap-5">
                                     <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-orange-500 group-hover:scale-110 transition-all">
                                        <Plus size={18} className="text-white/20 group-hover:text-white" />
                                     </div>
                                     <div>
                                        <span className="block text-[11px] font-black uppercase text-white mb-1">{c.name}</span>
                                        <span className="block text-[9px] uppercase tracking-widest text-white/30">{c.stock}</span>
                                     </div>
                                  </div>
                                  <span className="text-[11px] font-mono text-orange-500">{c.price}</span>
                               </div>
                             ))}
                          </div>
                          <button onClick={() => setWizardStep(3)} className="w-full py-7 bg-orange-500 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.6em] hover:bg-orange-400 transition-all shadow-2xl active:scale-95">Complete Manifest</button>
                       </div>
                    </div>
                 </motion.div>
               )}

               {wizardStep === 3 && (
                 <motion.div key="step-3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                    <div className="w-24 h-24 rounded-[30px] bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-10 shadow-[0_0_80px_rgba(34,197,94,0.15)]">
                       <Check size={48} className="text-green-500" />
                    </div>
                    <h2 className="text-7xl font-['Anton'] uppercase text-white mb-8 tracking-tighter">Manifest Finalized</h2>
                    <p className="text-[12px] text-white/30 uppercase tracking-[0.5em] leading-[2.5] italic max-w-xl mx-auto mb-16 font-bold">
                       Logistical parameters and unit requirements have been locked. Your <span className="text-white italic">Branded Quote v1.02</span> is ready for authentication.
                    </p>

                    <div className="max-w-2xl mx-auto bg-white/[0.02] border border-white/10 rounded-[50px] p-12 mb-16 text-left relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-8">
                          <Quote size={40} className="text-white/[0.03] group-hover:text-orange-500/10 transition-colors" />
                       </div>
                       <h4 className="text-[11px] uppercase tracking-[0.6em] text-white/20 font-black mb-10">Financial Summary</h4>
                       <div className="space-y-8">
                          <div className="flex justify-between items-baseline border-b border-white/5 pb-6">
                             <span className="text-[10px] uppercase tracking-widest text-white/40">Subtotal ({selectedProduct?.name})</span>
                             <span className="text-xl font-mono text-white">R{(results.bricks * (selectedProduct?.price || 0)).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-baseline border-b border-white/5 pb-6">
                             <span className="text-[10px] uppercase tracking-widest text-white/40">Logistics ({fulfillmentType})</span>
                             <span className="text-xl font-mono text-white">{fulfillmentType === 'delivery' ? 'R4,850.00' : 'R0.00'}</span>
                          </div>
                          <div className="flex justify-between items-baseline">
                             <span className="text-[12px] uppercase tracking-[0.5em] text-orange-500 font-black">Total Amount</span>
                             <span className="text-4xl font-mono text-white">R{(results.bricks * (selectedProduct?.price || 0) + (fulfillmentType === 'delivery' ? 4850 : 0)).toLocaleString()}</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                       <button 
                         onClick={() => {
                           const newItem = {
                             id: 'quote-' + Date.now(),
                             name: `Branded Quote: ${selectedProduct?.name}`,
                             category: 'bricks' as const,
                             rawQty: results.bricks,
                             uomQty: results.bricks,
                             pricePerUnit: selectedProduct?.price || 0,
                             image: selectedProduct?.img || '',
                             color: 'Standard'
                           };
                           setCart(prev => [...prev, newItem]);
                           setIsCartWizardOpen(true);
                         }}
                         className="px-16 py-8 bg-white text-black rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.6em] hover:bg-orange-500 hover:text-white transition-all shadow-3xl active:scale-95 group"
                       >
                          Add to Cart & Checkout
                          <Check size={18} className="ml-4 group-hover:scale-125 transition-transform" />
                       </button>
                       <button className="px-16 py-8 bg-white/5 text-white/30 border border-white/10 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] hover:bg-white/10 hover:text-white transition-all flex items-center gap-4">
                          <FileText size={18} />
                          Download PDF
                       </button>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
         </div>
      </motion.div>

    )}
  </AnimatePresence>

  <div id="directory-section">
    <ProfessionalsSection 
      title="Fulfillment Directory" 
      label="Regional Partners" 
      profs={CONTRACTORS} 
      accent={accent} 
      allowFilter
    />
  </div>
</div>
);
}

// ─── Sub-Component: Plan Analyzer ─────────────────────────────────────────────
function PlanAnalyzer({ accent }: { accent: string }) {

  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles([...files, ...newFiles]);
  };

  const startAnalysis = () => {
    setAnalyzing(true);
    const stages = [
      'Initializing Neural Engine...',
      'Rasterizing PDF Layers...',
      'Detecting Wall Geometry...',
      'Quantifying Material Volume...',
      'Finalizing Manifest...'
    ];
    
    stages.forEach((s, i) => {
      setTimeout(() => setAnalysisStatus(s), i * 600);
    });

    setTimeout(() => {
      setAnalyzing(false);
      setComplete(true);
    }, 3500);
  };

  return (
    <div className="max-w-5xl mx-auto py-12">
       {!complete ? (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-12">
               <div className="relative">
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-4 px-6 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
                     <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                     <span className="text-[10px] uppercase tracking-[0.4em] text-blue-400 font-black">AI Processing Engine</span>
                  </motion.div>
                  <h3 className="text-5xl font-['Anton'] uppercase text-white mb-6 leading-none">Architectural<br/>Extraction</h3>
                  <p className="text-[11px] text-white/30 uppercase tracking-[0.4em] max-w-sm leading-loose italic">
                    Submit structural plans for deterministic material quantification and precision cost modeling.
                  </p>
               </div>

               <div 
                 className="aspect-[4/3] rounded-[50px] border-2 border-dashed border-white/10 bg-white/[0.01] hover:bg-white/[0.04] hover:border-blue-500/40 transition-all duration-1000 cursor-pointer flex flex-col items-center justify-center gap-8 group relative overflow-hidden"
                 onClick={() => document.getElementById('plan-upload')?.click()}
               >
                  <div className="absolute inset-0 bg-blue-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input type="file" id="plan-upload" className="hidden" multiple onChange={handleUpload} />
                  <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-blue-500/30 transition-all duration-700 shadow-3xl">
                    <Upload size={32} className="text-white/20 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div className="text-center relative z-10">
                    <span className="block text-[12px] text-white uppercase tracking-[0.5em] font-black mb-2">Initialize Upload</span>
                    <span className="block text-[9px] text-white/20 uppercase tracking-[0.4em] font-bold">PDF / DWG / JPEG Support</span>
                  </div>
               </div>
            </div>

            <div className="flex flex-col">
               <div className="flex-1 bg-[#0c0c0c] border border-white/8 rounded-[50px] p-12 flex flex-col shadow-3xl">
                  <div className="flex items-center justify-between mb-10">
                     <h4 className="text-[11px] uppercase tracking-[0.5em] text-white/30 font-black">Submission Queue</h4>
                     <span className="text-[10px] text-white/20 font-mono tracking-widest">{files.length} Manifests Loaded</span>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <AnimatePresence>
                      {files.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-10 gap-6">
                           <FileText size={40} className="text-white/[0.03]" />
                           <span className="text-[10px] text-white/10 uppercase tracking-[0.5em] font-black italic">Awaiting technical documents...</span>
                        </div>
                      ) : (
                        files.map((f, i) => (
                           <motion.div key={`${f.name}-${i}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center justify-between p-5 bg-white/[0.03] rounded-3xl border border-white/5 group hover:border-white/20 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                   <FileUp size={16} className="text-blue-400" />
                                </div>
                                <div>
                                   <span className="text-[11px] text-white font-mono block mb-1 truncate max-w-[200px]">{f.name}</span>
                                   <span className="text-[8px] text-white/20 uppercase tracking-widest font-black">{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
                                </div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, idx) => idx !== i)); }} className="w-10 h-10 rounded-full flex items-center justify-center text-white/10 hover:text-red-400 hover:bg-red-500/5 transition-all">
                                <Trash2 size={16} />
                              </button>
                           </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {files.length > 0 && (
                    <div className="space-y-4 mt-12">
                      <button 
                        onClick={startAnalysis}
                        disabled={analyzing}
                        className="w-full py-7 bg-blue-500 text-black rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.6em] hover:bg-blue-400 transition-all flex items-center justify-center gap-4 shadow-2xl overflow-hidden active:scale-95 disabled:opacity-50"
                      >
                        {analyzing ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-[3px] border-black/20 border-t-black rounded-full" />
                        ) : (
                          <>
                            <Sparkles size={18} />
                            Extract Parameters
                          </>
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {analyzing && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4"
                          >
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse shrink-0" />
                            <span className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">{analysisStatus}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
               </div>
            </div>
         </div>
       ) : (
         <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0c0c0c] border border-blue-500/30 p-24 rounded-[60px] text-center backdrop-blur-3xl shadow-[0_60px_150px_rgba(0,0,0,1)] max-w-4xl mx-auto">
            <div className="w-32 h-32 rounded-[40px] bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-12 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
               <Check size={56} className="text-blue-400" />
            </div>
            <h2 className="text-6xl font-['Anton'] uppercase tracking-tight text-white mb-8">Parameters Extracted</h2>
            <p className="text-[12px] text-white/30 uppercase tracking-[0.5em] max-w-lg mx-auto leading-[2.5] mb-16 font-bold italic">
               Project geometry and specifications have been successfully harvested. Detailed BOM and Material Quoting visible in your private portal.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 max-w-lg mx-auto">
               <button className="flex-1 py-7 bg-white text-black rounded-3xl text-[10px] font-black uppercase tracking-[0.5em] hover:bg-blue-400 transition-all shadow-2xl active:scale-95">Go to Portal</button>
               <button onClick={() => { setComplete(false); setFiles([]); }} className="flex-1 py-7 bg-white/5 text-white/40 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] border border-white/10 hover:bg-white/10 hover:text-white transition-all">New Submission</button>
            </div>
         </motion.div>
       )}

       {/* New Section: Architectural Network */}
       <ProfessionalsSection 
         title="Architectural Network" 
         label="Structural Partners" 
         profs={ARCHITECTS} 
         accent={accent} 
       />
    </div>
  );
}

// ─── Main Showcase Page ───────────────────────────────────────────────────────
export function StudioShowcase() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const vol = VOLUMES[activeIdx];
  const navigate = useNavigate();
  const location = useLocation();
  const { designId } = useParams();
  const query = new URLSearchParams(location.search);
  const modeParam = query.get('mode') as StudioMode;

  useEffect(() => {
    if (designId) {
      setActiveIdx(0);
    } else if (modeParam) {
      const foundIdx = VOLUMES.findIndex(v => v.mode === modeParam);
      if (foundIdx !== -1) setActiveIdx(foundIdx);
    }
  }, [designId, modeParam]);

  const nav = (dir: 1 | -1) => {
    setActiveIdx(prev => Math.max(0, Math.min(2, prev + dir)));
  };

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-[#22c55e] selection:text-black scroll-smooth">
      <NavigationBar />

      {/* ── Cinematic Hero (Fixed for Snap) ── */}
      <div className="relative h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <img src={vol.bgImg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-[#050505]/50 to-[#050505]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-transparent" />
            
            <div className="absolute inset-0 opacity-20 flex items-center justify-center flex-col gap-10">
               {Array.from({length: 8}).map((_, i) => (
                 <motion.div key={i} animate={{ x: [Math.random() * 300, Math.random() * -300], y: [Math.random() * 150, Math.random() * -150], opacity: [0.05, 0.2, 0.05] }} transition={{ duration: 15 + i * 3, repeat: Infinity, ease: 'easeInOut' }} className="w-1.5 h-1.5 bg-white rounded-full blur-[1px]" />
               ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 flex flex-col justify-end px-8 md:px-24 pb-24 pt-32">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-12 max-w-[1700px] mx-auto w-full relative z-10">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div key={`meta-${activeIdx}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-12 h-px bg-white/20" />
                    <p className="text-[12px] uppercase tracking-[0.5em] font-black" style={{ color: vol.accent }}>
                      {vol.vol} — {vol.label}
                    </p>
                  </div>
                  
                  <h1 className="text-7xl md:text-[8.5vw] font-serif font-light text-white leading-[0.8] tracking-tighter mb-12">
                    {vol.headline[0]}<br />
                    <span className="italic opacity-30" style={{ color: vol.accent }}>{vol.headline[1]}</span>
                  </h1>

                  <div className="flex flex-col md:flex-row md:items-center gap-12">
                    <p className="text-white/35 text-[12px] uppercase tracking-[0.4em] max-w-sm leading-[2.8] font-black italic">
                      {vol.sub}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col items-end gap-12">
              <AnimatePresence mode="wait">
                <motion.div key={`stats-${activeIdx}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.5 }} className="flex gap-16">
                  {vol.stats.map(s => (
                    <div key={s.label} className="text-right group">
                      <div className="text-[11px] text-white/20 uppercase tracking-[0.4em] font-black mb-3 group-hover:text-white/40 transition-colors uppercase">{s.label}</div>
                      <div className="text-6xl font-mono text-white tracking-tighter group-hover:scale-110 transition-transform origin-right">{s.val}</div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center gap-6">
                <button onClick={() => nav(-1)} disabled={activeIdx === 0} className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all disabled:opacity-5 disabled:cursor-not-allowed group shadow-2xl">
                  <ChevronLeft size={28} className="group-hover:-translate-x-1.5 transition-transform" />
                </button>

                <div className="flex items-center gap-5">
                  {VOLUMES.map((v, i) => (
                    <button key={i} onClick={() => setActiveIdx(i)} className="flex flex-col items-center gap-4 group">
                      <div className="h-[4px] w-14 rounded-full transition-all duration-1000" style={{ backgroundColor: i === activeIdx ? vol.accent : 'rgba(255,255,255,0.08)' }} />
                      <span className="text-[9px] font-mono uppercase tracking-[0.4em] font-black transition-all duration-500" style={{ color: i === activeIdx ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)' }}>
                        Vol.0{i + 1}
                      </span>
                    </button>
                  ))}
                </div>

                <button onClick={() => nav(1)} disabled={activeIdx === 2} className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all disabled:opacity-5 disabled:cursor-not-allowed group shadow-2xl">
                  <ChevronRight size={28} className="group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-5 opacity-40 pointer-events-none group">
            <span className="text-[10px] uppercase tracking-[0.6em] font-black text-white italic group-hover:opacity-100 transition-opacity">Discover Below</span>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-[1px] h-16 bg-gradient-to-b from-white via-white/50 to-transparent" />
          </div>
        </div>
      </div>

      {/* ── Content Section (Scroll-in tools based on activeIdx) ── */}
      <div className="relative bg-transparent min-h-screen">
          <div className="max-w-[1700px] mx-auto px-8 md:px-24">
             <AnimatePresence mode="wait">
                <motion.div 
                   key={activeIdx}
                   initial={{ opacity: 0, y: 50 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                   {activeIdx === 0 && <CustomizeStudio hideNav />}
                   {activeIdx === 1 && <PlanAnalyzer accent="#60a5fa" />}
                   {activeIdx === 2 && <QSCalculator accent="#fb923c" />}
                </motion.div>
             </AnimatePresence>
          </div>
      </div>
    </div>
  );
}
