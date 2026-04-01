import React, { useState, useRef, useEffect } from 'react';
import { productData } from '../catalog/productData';
import { ArrowLeft, Upload, Save, Share2, Wand2, Layers, Grid, Palette, Maximize2, Sun, Contrast, Image as ImageIcon, Check, X, ChevronRight, Info, FileText, Sparkles, Quote } from 'lucide-react';
import { useVisualLab } from './VisualLabContext';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationBar } from './NavigationBar';
import { Link, useParams, useNavigate } from 'react-router-dom';

export function CustomizeStudio({ hideNav = false }: { hideNav?: boolean }) {
  const { designId } = useParams();
  const navigate = useNavigate();
  const { 
    activeGrout, setActiveGrout, 
    activeLayout, setActiveLayout, 
    activeLighting, setActiveLighting,
    addDesign, updateDesign, designs
  } = useVisualLab();

  const [mode, setMode] = useState<'deterministic' | 'ai'>('deterministic');
  const [appMode, setAppMode] = useState('full-wall');
  const [scale, setScale] = useState(1);
  const [blend, setBlend] = useState(0.8);
  const [intensity, setIntensity] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [activeProduct, setActiveProduct] = useState(productData['cladding-tiles'].catalog[0]);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [designName, setDesignName] = useState('New Design Concept');
  const [roomType, setRoomType] = useState('Interior');
  const [designNotes, setDesignNotes] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isQuoteRequested, setIsQuoteRequested] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load design if designId exists
  useEffect(() => {
    if (designId) {
      const design = designs.find(d => d.id === designId);
      if (design) {
        setDesignName(design.name);
        setRoomType(design.roomType);
        setDesignNotes(design.notes || '');
        setIsPublic(design.isPublic);
        setIsQuoteRequested(design.isQuoteRequested || false);
        if (design.settings) {
          setActiveGrout(design.settings.grout);
          setActiveLayout(design.settings.layout);
          setActiveLighting(design.settings.lighting);
          setAppMode(design.settings.applicationMode);
          setScale(design.settings.scale);
          setBlend(design.settings.blend);
          setIntensity(design.settings.intensity);
          if (design.settings.product) setActiveProduct(design.settings.product);
          if (design.settings.baseImage) setBaseImage(design.settings.baseImage);
        }
      }
    }
  }, [designId, designs]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBaseImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    const designData = {
      name: designName,
      roomType,
      notes: designNotes,
      isPublic,
      isQuoteRequested,
      status: (isQuoteRequested ? 'quote-requested' : isPublic ? 'published' : 'draft') as 'draft' | 'published' | 'quote-requested',
      settings: {
        grout: activeGrout,
        layout: activeLayout,
        lighting: activeLighting,
        product: activeProduct,
        applicationMode: appMode,
        scale,
        blend,
        intensity,
        baseImage: baseImage || undefined
      }
    };

    setTimeout(() => {
      if (designId) {
        updateDesign(designId, designData);
      } else {
        const newDesign = {
          id: Math.random().toString(36).substr(2, 9),
          ...designData,
          createdAt: new Date().toISOString(),
        };
        addDesign(newDesign as any);
      }
      setIsSaving(false);
      setShowSaveModal(false);
      // Redirect to portal
      navigate('/portal/designs');
    }, 1000);
  };

  const handlePublish = () => {
    setIsPublic(true);
    setIsSaving(true);
    
    const designData = {
      name: designName,
      roomType,
      notes: designNotes,
      isPublic: true,
      isQuoteRequested,
      status: 'published' as const,
      settings: {
        grout: activeGrout,
        layout: activeLayout,
        lighting: activeLighting,
        product: activeProduct,
        applicationMode: appMode,
        scale,
        blend,
        intensity,
        baseImage: baseImage || undefined
      }
    };

    setTimeout(() => {
      if (designId) {
        updateDesign(designId, designData);
      } else {
        const newDesign = {
          id: Math.random().toString(36).substr(2, 9),
          ...designData,
          createdAt: new Date().toISOString(),
        };
        addDesign(newDesign as any);
      }
      setIsSaving(false);
      setIsPublished(true);
      setTimeout(() => {
        setIsPublished(false);
        navigate('/portal/designs');
      }, 2000);
    }, 1000);
  };

  const activeColor = '#22c55e';
  const activeColorClass = 'text-[#22c55e]';
  const activeBorderClass = 'border-[#22c55e]';
  const activeBgClass = 'bg-[#22c55e]';

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans overflow-hidden flex flex-col selection:bg-[#22c55e] selection:text-white">
      {!hideNav && <NavigationBar />}
      
      <div className={`flex-1 flex flex-col md:flex-row ${hideNav ? 'pt-0' : 'pt-24'}`}>
        {/* Left Rail */}
        <aside className="w-full md:w-[420px] bg-[#0a0a0a] border-r border-white/5 flex flex-col z-20 h-[calc(100vh-96px)] overflow-y-auto shrink-0 custom-scrollbar relative shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
          <div className="p-8 space-y-10 pb-32">
            {/* Header */}
            <div className="relative pb-8 border-b border-white/5">
              <Link to="/" className="flex items-center gap-2 text-white/30 text-[9px] tracking-[0.2em] uppercase mb-8 hover:text-white transition-all group w-fit">
                <ArrowLeft size={10} className="group-hover:-translate-x-1 transition-transform" /> Back to Shop
              </Link>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-1.5 h-10 bg-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
                <h1 className="text-5xl font-['Anton'] tracking-tighter uppercase leading-[0.85]">Customize<br/>Studio</h1>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-[9px] text-white/40 uppercase tracking-[0.3em]">Lab Edition v1.0</span>
                <div className="w-1 h-1 rounded-full bg-[#22c55e]/30" />
                <span className="text-[9px] text-[#22c55e] uppercase tracking-[0.3em] font-bold">Deterministic Engine</span>
              </div>
            </div>

            {/* 1. Base Scene */}
            <section className="relative group">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[10px] text-white/30 tracking-[0.3em] uppercase flex items-center gap-2 font-bold">
                  <ImageIcon size={12} className="text-[#22c55e]/50" /> 01. Base Scene
                </h3>
                {baseImage && (
                  <button onClick={() => setBaseImage(null)} className="text-[9px] text-red-400/60 uppercase tracking-widest hover:text-red-400 transition-colors">Clear</button>
                )}
              </div>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-video rounded-2xl border transition-all duration-700 cursor-pointer flex flex-col items-center justify-center gap-4 group overflow-hidden shadow-inner ${baseImage ? 'border-white/10' : 'border-white/5 bg-white/[0.02] hover:border-[#22c55e]/40 hover:bg-[#22c55e]/5'}`}
              >
                {baseImage ? (
                  <>
                    <img src={baseImage} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-all duration-700 scale-105 group-hover:scale-100" alt="Base" />
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />
                    <div className="relative flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-2xl group-hover:scale-110 transition-transform">
                        <Upload size={18} className="text-white/60" />
                      </div>
                      <span className="text-[9px] text-white/40 uppercase tracking-[0.3em] font-bold group-hover:text-white transition-colors">Replace Scene</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/5 group-hover:border-[#22c55e]/30 group-hover:bg-[#22c55e]/10 transition-all duration-700 group-hover:scale-110">
                      <Upload size={20} className="text-white/10 group-hover:text-[#22c55e] transition-colors" />
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-white/30 uppercase tracking-[0.3em] mb-1 group-hover:text-white/60 transition-colors">Upload room photo</span>
                      <span className="block text-[8px] text-white/10 uppercase tracking-[0.3em]">JPG, PNG up to 10MB</span>
                    </div>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
              </div>
            </section>

            {/* 2. Product Selection */}
            <section>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[10px] text-white/30 tracking-[0.3em] uppercase flex items-center gap-2 font-bold">
                  <Grid size={12} className="text-[#22c55e]/50" /> 02. Select Product
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-[#22c55e] uppercase tracking-[0.3em] font-bold">{activeProduct.name}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2.5 mb-6">
                {productData['cladding-tiles'].catalog.slice(0, 8).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setActiveProduct(product)}
                    className={`aspect-square rounded-xl border transition-all duration-500 overflow-hidden relative group ${activeProduct.id === product.id ? 'border-[#22c55e] scale-105 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(34,197,94,0.1)]' : 'border-white/5 hover:border-white/20'}`}
                  >
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${product.images[0]})` }} />
                    <div className={`absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-colors ${activeProduct.id === product.id ? 'bg-transparent' : ''}`} />
                    {activeProduct.id === product.id && (
                      <div className="absolute inset-0 border-[1.5px] border-[#22c55e] rounded-xl pointer-events-none" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5 bg-white/[0.03] backdrop-blur-2xl rounded-2xl border border-white/10 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-[#22c55e]/10 transition-colors duration-700" />
                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-1.5 text-white/90">{activeProduct.name}</h4>
                      <div className="flex gap-3">
                        <span className="text-[8px] uppercase tracking-[0.3em] text-[#22c55e] font-bold">{activeProduct.mood}</span>
                        <span className="text-[8px] uppercase tracking-[0.3em] text-white/20">{activeProduct.specs.module}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#22c55e] font-mono font-bold tracking-tighter">{activeProduct.price}</span>
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2 mb-5 font-medium">
                    {activeProduct.description}
                  </p>
                  <button className="w-full py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-[9px] uppercase tracking-[0.3em] font-bold transition-all duration-500">
                    View Product Details
                  </button>
                </div>
              </div>
            </section>

            {/* 3. Generation Mode */}
            <section>
              <h3 className="text-[10px] text-white/30 tracking-[0.3em] uppercase flex items-center gap-2 mb-5 font-bold">
                <Wand2 size={12} className="text-[#22c55e]/50" /> 03. Generation Mode
              </h3>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-white/[0.02] rounded-2xl border border-white/5 shadow-inner">
                <button 
                  onClick={() => setMode('deterministic')}
                  className={`flex items-center justify-center gap-3 py-4 rounded-xl text-[9px] uppercase tracking-[0.3em] font-bold transition-all duration-700 ${mode === 'deterministic' ? 'bg-[#22c55e] text-black shadow-[0_10px_25px_rgba(34,197,94,0.2)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                >
                  <Layers size={14} /> Deterministic
                </button>
                <button 
                  onClick={() => setMode('ai')}
                  className={`flex items-center justify-center gap-3 py-4 rounded-xl text-[9px] uppercase tracking-[0.3em] font-bold transition-all duration-700 ${mode === 'ai' ? 'bg-[#22c55e] text-black shadow-[0_10px_25px_rgba(34,197,94,0.2)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                >
                  <Wand2 size={14} /> AI Enhanced
                </button>
              </div>
            </section>

            {mode === 'deterministic' ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                {/* Application Mode */}
                <section>
                  <h3 className="text-[10px] text-white/30 tracking-[0.3em] uppercase mb-5 font-bold">Application Mode</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {['Full Wall', 'Feature Wall', 'Backsplash', 'Floor', 'Facade/Panel'].map(m => (
                      <button 
                        key={m}
                        onClick={() => setAppMode(m.toLowerCase().replace(' ', '-').replace('/', '-'))}
                        className={`py-3.5 px-4 text-[9px] font-bold tracking-[0.3em] uppercase border rounded-xl transition-all duration-500 ${appMode === m.toLowerCase().replace(' ', '-').replace('/', '-') ? 'bg-[#22c55e] text-black border-[#22c55e] shadow-[0_10px_20px_rgba(34,197,94,0.15)]' : 'bg-white/[0.02] text-white/30 border-white/5 hover:border-white/20 hover:text-white'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Layout Pattern */}
                <section>
                  <h3 className="text-[10px] text-white/30 tracking-[0.3em] uppercase mb-5 font-bold">Layout Pattern</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {['Stretcher', 'Stack Bond', 'Herringbone'].map(l => (
                      <button 
                        key={l}
                        onClick={() => setActiveLayout(l.toLowerCase().replace(' ', '-'))}
                        className={`py-3.5 px-4 text-[9px] font-bold tracking-[0.3em] uppercase border rounded-xl transition-all duration-500 ${activeLayout === l.toLowerCase().replace(' ', '-') ? 'bg-[#22c55e] text-black border-[#22c55e] shadow-[0_10px_20px_rgba(34,197,94,0.15)]' : 'bg-white/[0.02] text-white/30 border-white/5 hover:border-white/20 hover:text-white'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Grout Color */}
                <section>
                  <h3 className="text-[10px] text-white/30 tracking-[0.3em] uppercase mb-5 font-bold">Grout Color</h3>
                  <div className="flex gap-6">
                    {productData.visualLab.groutColors.map(color => (
                      <button 
                        key={color.id}
                        onClick={() => setActiveGrout(color.id)}
                        className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-700 ${activeGrout === color.id ? 'scale-110' : 'hover:scale-105'}`}
                      >
                        <span className={`absolute inset-0 rounded-full border-[1.5px] transition-all duration-700 ${activeGrout === color.id ? 'border-[#22c55e]' : 'border-transparent group-hover:border-white/20'}`} style={{ transform: 'scale(1.3)' }} />
                        <span className="w-full h-full rounded-full shadow-2xl border border-white/10" style={{ backgroundColor: color.hex }} />
                        {activeGrout === color.id && (
                          <motion.div layoutId="groutCheck" className="absolute inset-0 flex items-center justify-center">
                            <Check size={14} className={color.id === 'light' ? 'text-black' : 'text-white'} />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Sliders */}
                <section className="space-y-10">
                  <div className="group">
                    <div className="flex justify-between mb-4">
                      <h3 className="text-[10px] text-white/30 tracking-[0.3em] uppercase group-hover:text-white/60 transition-colors flex items-center gap-2 font-bold">
                        <Maximize2 size={12} className="text-[#22c55e]/50" /> Scale
                      </h3>
                      <span className="text-[10px] text-[#22c55e] font-mono font-bold tracking-tighter">{scale.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.5" max="2" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full accent-[#22c55e] bg-white/[0.05] rounded-full h-1 appearance-none cursor-pointer hover:bg-white/10 transition-colors" />
                  </div>
                  <div className="group">
                    <div className="flex justify-between mb-4">
                      <h3 className="text-[10px] text-white/30 tracking-[0.3em] uppercase group-hover:text-white/60 transition-colors flex items-center gap-2 font-bold">
                        <Palette size={12} className="text-[#22c55e]/50" /> Blend Strength
                      </h3>
                      <span className="text-[10px] text-[#22c55e] font-mono font-bold tracking-tighter">{(blend * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={blend} onChange={(e) => setBlend(parseFloat(e.target.value))} className="w-full accent-[#22c55e] bg-white/[0.05] rounded-full h-1 appearance-none cursor-pointer hover:bg-white/10 transition-colors" />
                  </div>
                  <div className="group">
                    <div className="flex justify-between mb-4">
                      <h3 className="text-[10px] text-white/30 tracking-[0.3em] uppercase group-hover:text-white/60 transition-colors flex items-center gap-2 font-bold">
                        <Sun size={12} className="text-[#22c55e]/50" /> Light Intensity
                      </h3>
                      <span className="text-[10px] text-[#22c55e] font-mono font-bold tracking-tighter">{intensity.toFixed(1)}</span>
                    </div>
                    <input type="range" min="0" max="2" step="0.1" value={intensity} onChange={(e) => setIntensity(parseFloat(e.target.value))} className="w-full accent-[#22c55e] bg-white/[0.05] rounded-full h-1 appearance-none cursor-pointer hover:bg-white/10 transition-colors" />
                  </div>
                </section>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="p-6 bg-white/[0.03] border border-white/10 rounded-[24px] relative overflow-hidden shadow-2xl group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/5 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-[#22c55e]/10 transition-colors duration-700" />
                  <div className="absolute top-3 right-4 px-2.5 py-1 bg-[#22c55e]/10 rounded-full text-[8px] uppercase tracking-[0.2em] font-bold text-[#22c55e] border border-[#22c55e]/20">Advanced</div>
                  <div className="flex items-center gap-4 text-[#22c55e] mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#22c55e]/10 flex items-center justify-center border border-[#22c55e]/20 shadow-lg">
                      <Wand2 size={18} />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold">AI Enhanced Studio</span>
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                    Leverage generative AI to simulate complex architectural contexts, weathering, and atmospheric lighting.
                  </p>
                </div>
                
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] text-white/30 tracking-[0.3em] uppercase flex items-center gap-2 font-bold">
                      <FileText size={12} className="text-[#22c55e]/50" /> Creative Prompt
                    </h3>
                    <span className="text-[8px] text-white/10 uppercase tracking-[0.3em] font-bold">Optional</span>
                  </div>
                  <textarea 
                    placeholder="Describe the mood, lighting, or context... e.g. 'Soft morning light hitting a weathered brick wall in a minimalist loft'"
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-[11px] text-white placeholder:text-white/10 focus:outline-none focus:border-[#22c55e]/30 min-h-[140px] resize-none transition-all shadow-inner leading-relaxed"
                  />
                </section>

                <section>
                  <h3 className="text-[10px] text-white/30 tracking-[0.3em] uppercase mb-4 flex items-center gap-2 font-bold">
                    <ImageIcon size={12} className="text-[#22c55e]/50" /> Reference Assets
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="aspect-square border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 text-white/20 hover:text-white/60 hover:border-[#22c55e]/40 hover:bg-[#22c55e]/5 transition-all duration-700 group">
                      <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={18} />
                      </div>
                      <span className="text-[8px] uppercase tracking-[0.3em] font-bold">Upload Ref</span>
                    </button>
                    <div className="aspect-square bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center text-white/5">
                      <span className="text-[8px] uppercase tracking-[0.3em] font-bold">No Asset</span>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-[10px] text-white/30 tracking-[0.3em] uppercase flex items-center gap-2 font-bold">
                      <Sparkles size={12} className="text-[#22c55e]/50" /> Generated Variations
                    </h3>
                    <span className="text-[9px] text-[#22c55e] uppercase tracking-[0.3em] font-bold">0/4</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="aspect-video bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center group relative overflow-hidden shadow-inner">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <Sparkles size={18} className="text-white/[0.03] group-hover:text-[#22c55e]/20 transition-all duration-700 group-hover:scale-110" />
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-6 py-4.5 bg-[#22c55e] hover:bg-[#1eb054] text-black rounded-2xl text-[9px] uppercase tracking-[0.3em] font-bold transition-all duration-500 shadow-[0_10px_30px_rgba(34,197,94,0.2)]">
                    Generate AI Variations
                  </button>
                </section>
              </motion.div>
            )}

            {/* Actions */}
            <div className="fixed bottom-0 left-0 w-full md:w-[420px] p-8 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent z-30">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setShowSaveModal(true)}
                    className="flex items-center justify-center gap-3 py-4.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 rounded-2xl text-[9px] uppercase tracking-[0.4em] font-bold transition-all duration-500 group shadow-lg"
                  >
                    <Save size={14} className="text-white/20 group-hover:text-[#22c55e] transition-colors" /> 
                    <span className="text-white/60 group-hover:text-white transition-colors">Save Design</span>
                  </button>
                  <button 
                    onClick={handlePublish}
                    disabled={isPublished}
                    className={`flex items-center justify-center gap-3 py-4.5 rounded-2xl text-[9px] uppercase tracking-[0.4em] font-bold transition-all duration-700 shadow-xl ${isPublished ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : 'bg-white text-black hover:bg-white/90 border border-white'}`}
                  >
                    {isPublished ? (
                      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                        <Check size={14} /> Published
                      </motion.div>
                    ) : (
                      <>
                        <Share2 size={14} /> 
                        <span>Publish</span>
                      </>
                    )}
                  </button>
                </div>
                <button 
                  onClick={() => setIsQuoteRequested(!isQuoteRequested)}
                  className={`w-full py-4 rounded-2xl text-[9px] uppercase tracking-[0.4em] font-bold transition-all duration-500 border flex items-center justify-center gap-3 ${isQuoteRequested ? 'bg-[#22c55e]/5 border-[#22c55e]/30 text-[#22c55e]' : 'bg-transparent border-white/10 text-white/40 hover:border-white/30 hover:text-white'}`}
                >
                  <Quote size={14} />
                  {isQuoteRequested ? 'Quote Requested' : 'Request Project Quote'}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Preview Area */}
        <main className="flex-1 relative bg-[#050505] overflow-hidden flex items-center justify-center">
          {/* Empty State */}
          {!baseImage && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-12 text-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                className="relative"
              >
                <div className="w-40 h-40 rounded-[40px] bg-white/[0.02] flex items-center justify-center mb-10 relative group">
                  <div className="absolute inset-0 rounded-[40px] border border-white/10 group-hover:border-[#22c55e]/30 transition-all duration-1000 animate-pulse" />
                  <div className="absolute inset-4 rounded-[30px] border border-white/5 group-hover:border-[#22c55e]/20 transition-all duration-1000" />
                  <ImageIcon size={56} className="text-white/[0.05] group-hover:text-[#22c55e]/20 transition-all duration-1000 group-hover:scale-110" />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              >
                <h2 className="text-5xl font-['Anton'] uppercase tracking-tight text-white/10 mb-6 leading-none">Awaiting Base Scene</h2>
                <p className="text-[10px] text-white/10 max-w-sm uppercase tracking-[0.4em] leading-[2.2] mx-auto font-bold">
                  Upload a high-resolution room photo in the control panel to begin material simulation and architectural visualization.
                </p>
                <div className="mt-16 flex items-center justify-center gap-6">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/5" />
                  <span className="text-[9px] text-white/10 uppercase tracking-[0.6em] font-bold">Studio Ready</span>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/5" />
                </div>
              </motion.div>
            </div>
          )}

          {/* Preview Canvas */}
          <div className="relative w-full h-full flex items-center justify-center">
            {baseImage && (
              <motion.img 
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                src={baseImage} 
                className="absolute inset-0 w-full h-full object-cover" 
                alt="Base Scene" 
              />
            )}

            {/* Material Overlay */}
            <div 
              className={`absolute inset-0 transition-all duration-1000 ease-in-out flex items-center justify-center ${baseImage ? 'mix-blend-multiply' : ''}`}
              style={{ 
                opacity: baseImage ? blend : 1,
                filter: `brightness(${intensity}) contrast(${contrast})`,
                backgroundColor: baseImage ? 'transparent' : '#0a0a0a'
              }}
            >
              {/* Mock Deterministic Wall */}
              <div 
                className={`transition-all duration-1000 ease-in-out transform flex flex-col justify-center ${
                  appMode === 'backsplash' ? 'w-[100%] h-[40%] mt-[20%]' : 
                  appMode === 'floor' ? 'w-[150%] h-[150%] rotate-[60deg] scale-150 -translate-y-[20%]' :
                  appMode === 'feature-wall' ? 'w-[60%] h-[100%] border-x border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]' :
                  appMode === 'facade-panel' ? 'w-[40%] h-[80%] border border-white/20 shadow-2xl' :
                  'w-[150%] h-[150%] -rotate-3 scale-110'
                }`}
              >
                {Array.from({ length: 20 }).map((_, rowIdx) => (
                  <div 
                    key={rowIdx} 
                    className="flex whitespace-nowrap mb-[4px] transition-all duration-1000 ease-in-out"
                    style={{ 
                      marginLeft: activeLayout === 'stretcher' && rowIdx % 2 !== 0 ? `-${110 * scale}px` : '0',
                      marginBottom: `${8 * scale}px`,
                      transform: activeLayout === 'herringbone' ? `rotate(${rowIdx % 2 === 0 ? '45deg' : '-45deg'})` : 'none'
                    }}
                  >
                    {Array.from({ length: 12 }).map((_, colIdx) => {
                      const seed = (rowIdx * 12 + colIdx);
                      const pseudoRandom = (Math.sin(seed) + 1) / 2;
                      
                      const baseColor = activeProduct.color;
                      
                      return (
                        <div 
                          key={colIdx} 
                          className="rounded-[1px] relative overflow-hidden transition-all duration-700 shadow-2xl"
                          style={{
                            width: `${220 * scale}px`,
                            height: `${65 * scale}px`,
                            marginRight: `${8 * scale}px`,
                            backgroundColor: baseColor,
                            backgroundImage: `linear-gradient(${135 + pseudoRandom * 20}deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)`,
                            boxShadow: `
                              inset 0 1px 2px rgba(255,255,255,0.1), 
                              inset 0 -1px 4px rgba(0,0,0,0.5),
                              0 ${4 * scale}px ${8 * scale}px rgba(0,0,0,0.3)
                            `,
                            border: `1px solid ${productData.visualLab.groutColors.find(g => g.id === activeGrout)?.hex || '#333'}`,
                            filter: `brightness(${0.85 + pseudoRandom * 0.3}) contrast(${1 + pseudoRandom * 0.15})`
                          }}
                        >
                          {/* 2.5D Depth Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                          <div className="absolute inset-x-0 bottom-0 h-px bg-black/40 pointer-events-none" />
                          
                          {/* Texture Overlay */}
                          <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Controls Overlay */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30">
              <div className="flex bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 shadow-3xl">
                <button 
                  onClick={() => setIsSplitView(false)}
                  className={`px-8 py-2.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-500 ${!isSplitView ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'}`}
                >
                  Single View
                </button>
                <button 
                  onClick={() => setIsSplitView(true)}
                  className={`px-8 py-2.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-500 ${isSplitView ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'}`}
                >
                  Split View
                </button>
              </div>
              
              <button className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-500 shadow-3xl group">
                <Maximize2 size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Status Indicator */}
            <div className="absolute top-12 left-12 z-30 flex items-center gap-5 bg-black/60 backdrop-blur-2xl px-7 py-4 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-ping opacity-40" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white font-bold leading-none mb-1.5">Studio Active</span>
                <span className="text-[8px] uppercase tracking-[0.25em] text-white/30 leading-none font-medium">Real-time Simulation</span>
              </div>
              <div className="ml-4 pl-4 border-l border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-[#22c55e]/40 transition-colors" />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Save Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
            >
              <div className="p-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-4xl font-['Anton'] uppercase tracking-tight mb-2 leading-none">Save Design</h2>
                    <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] font-bold">Store this concept in your profile</p>
                  </div>
                  <button onClick={() => setShowSaveModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[9px] text-white/30 uppercase tracking-[0.3em] mb-3 block font-bold">Design Name</label>
                    <input 
                      type="text" 
                      value={designName}
                      onChange={(e) => setDesignName(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#22c55e]/40 transition-all placeholder:text-white/10"
                      placeholder="e.g. Minimalist Loft Exterior"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-white/30 uppercase tracking-[0.3em] mb-3 block font-bold">Project Type</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {['Interior', 'Exterior', 'Commercial'].map(t => (
                        <button 
                          key={t}
                          onClick={() => setRoomType(t)}
                          className={`py-3 text-[9px] uppercase tracking-[0.3em] font-bold border rounded-xl transition-all duration-500 ${roomType === t ? 'bg-white text-black border-white shadow-xl' : 'bg-white/[0.02] text-white/30 border-white/5 hover:border-white/20'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5 shadow-inner">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/80">Public Gallery</h4>
                        <button 
                          onClick={() => setIsPublic(!isPublic)}
                          className={`w-10 h-5 rounded-full transition-all duration-500 relative ${isPublic ? 'bg-[#22c55e]' : 'bg-white/10'}`}
                        >
                          <motion.div 
                            animate={{ x: isPublic ? 22 : 2 }}
                            className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm" 
                          />
                        </button>
                      </div>
                      <p className="text-[8px] text-white/20 uppercase tracking-widest leading-relaxed">Visible to the community</p>
                    </div>

                    <div 
                      onClick={() => setIsQuoteRequested(!isQuoteRequested)}
                      className={`p-5 rounded-2xl border transition-all duration-500 cursor-pointer ${isQuoteRequested ? 'bg-[#22c55e]/5 border-[#22c55e]/30 shadow-[0_0_20px_rgba(34,197,94,0.05)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/80">Request Quote</h4>
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-500 ${isQuoteRequested ? 'bg-[#22c55e] shadow-lg shadow-[#22c55e]/20' : 'bg-white/10'}`}>
                          {isQuoteRequested && <Check size={12} className="text-black" />}
                        </div>
                      </div>
                      <p className="text-[8px] text-white/20 uppercase tracking-widest leading-relaxed">Review and pricing</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-white/30 uppercase tracking-[0.3em] mb-3 block font-bold">Design Notes</label>
                    <textarea 
                      value={designNotes}
                      onChange={(e) => setDesignNotes(e.target.value)}
                      placeholder="Add specific details about this design..."
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#22c55e]/40 transition-all min-h-[80px] resize-none placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button 
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 py-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/20 rounded-2xl text-[10px] uppercase tracking-[0.4em] font-bold text-white/40 hover:text-white transition-all duration-500"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 py-5 bg-[#22c55e] hover:bg-[#1eb054] text-black rounded-2xl text-[10px] uppercase tracking-[0.4em] font-bold transition-all duration-500 shadow-[0_15px_40px_rgba(34,197,94,0.25)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isSaving ? (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
                      />
                    ) : (
                      <>
                        <Save size={14} className="group-hover:scale-110 transition-transform" />
                        Confirm & Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
