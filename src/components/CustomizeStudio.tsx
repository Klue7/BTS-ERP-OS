import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Boxes,
  Building2,
  Camera,
  Check,
  Eye,
  Image as ImageIcon,
  Layers,
  Lock,
  Palette,
  Quote,
  Save,
  Share2,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { NavigationBar } from './NavigationBar';
import { useVisualLab } from './VisualLabContext';
import { productData } from '../catalog/productData';
import { buildStudioCreativePath } from '../creative/routes';

const roomPresets = [
  {
    id: 'interior',
    label: 'Interior Feature Wall',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1400&auto=format&fit=crop',
  },
  {
    id: 'kitchen',
    label: 'Kitchen / Dining',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1400&auto=format&fit=crop',
  },
  {
    id: 'patio',
    label: 'Outdoor Patio',
    image: 'https://images.unsplash.com/photo-1517231426071-2940212f3bc3?q=80&w=1400&auto=format&fit=crop',
  },
];

const applicationModes = [
  { id: 'full', label: 'Full Wall', description: 'Apply product rhythm across the main wall plane.' },
  { id: 'accent', label: 'Accent Strip', description: 'Create a focused cladding band or feature zone.' },
  { id: 'fireplace', label: 'Fireplace / Niche', description: 'Use product face as a hero material insert.' },
] as const;

export function CustomizeStudio({ hideNav = false }: { hideNav?: boolean }) {
  const navigate = useNavigate();
  const { designId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isLoggedIn,
    userRole,
    setIsLoginPageOpen,
    setPostLoginRedirect,
    activeGrout,
    setActiveGrout,
    activeLayout,
    setActiveLayout,
    activeLighting,
    setActiveLighting,
    addDesign,
    setSelectedCatalogItem,
    setIsQuoteWizardOpen,
  } = useVisualLab();

  const catalogProducts = useMemo(() => productData['cladding-tiles'].catalog.slice(0, 6), []);
  const [selectedProduct, setSelectedProduct] = useState(catalogProducts[0]);
  const [selectedRoom, setSelectedRoom] = useState(roomPresets[0]);
  const [applicationMode, setApplicationMode] = useState<(typeof applicationModes)[number]['id']>('full');
  const [customRoomImage, setCustomRoomImage] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('My BTS interior concept');
  const [notes, setNotes] = useState('Testing product face, grout tone, and room lighting before requesting a quote.');
  const [scale, setScale] = useState(1);
  const [blend, setBlend] = useState(82);

  const previewImage = customRoomImage ?? selectedRoom.image;
  const activeProductImage = selectedProduct.images?.[0] ?? previewImage;
  const isEmployee = isLoggedIn && userRole === 'employee';

  const requireCustomerSession = () => {
    if (isLoggedIn) return true;
    setPostLoginRedirect('/customize');
    setIsLoginPageOpen(true);
    toast('Sign in to save your studio concept', {
      description: 'Customer profiles keep saved concepts, quote requests, and community submissions together.',
    });
    return false;
  };

  const handleUploadRoom = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Upload a room image so the studio can build a visual concept.');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setCustomRoomImage(objectUrl);
    toast.success('Room image loaded into the studio preview.');
  };

  const createDesignRecord = (publish: boolean) => {
    if (!requireCustomerSession()) return;

    const createdAt = new Date().toISOString();
    const communityVisibility = publish ? 'public' as const : 'private' as const;
    const status = publish ? 'published' as const : 'draft' as const;
    const moderationStatus = publish ? 'approved' as const : 'none' as const;
    const nextDesign = {
      id: `design-${Date.now()}`,
      name: projectName.trim() || `${selectedProduct.name} room concept`,
      roomType: selectedRoom.label,
      notes,
      isPublic: publish,
      communityVisibility,
      publicSlug: publish ? `${selectedProduct.id}-${Date.now()}` : undefined,
      sourceModule: 'studio' as const,
      isQuoteRequested: false,
      status,
      moderationStatus,
      createdAt,
      publishedAt: publish ? createdAt : undefined,
      metrics: publish ? { views: 0, saves: 0, shares: 0 } : undefined,
      author: { name: userRole === 'employee' ? 'BTS Studio' : 'Customer Studio', id: userRole ?? 'guest' },
      settings: {
        grout: activeGrout,
        layout: activeLayout,
        lighting: activeLighting,
        product: selectedProduct,
        applicationMode,
        scale,
        blend: blend / 100,
        intensity: 1,
        baseImage: previewImage,
        renderUrl: previewImage,
        shareUrl: previewImage,
      },
    };

    addDesign(nextDesign);
    toast.success(publish ? 'Concept published to the community feed.' : 'Concept saved to your profile.');
    if (publish) {
      navigate('/community?type=generated_design');
    }
  };

  const handleShare = async () => {
    const shareText = `Brick Tile Shop studio concept: ${projectName} using ${selectedProduct.name}.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: projectName,
          text: shareText,
          url: window.location.href,
        });
        return;
      }
      await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      toast.success('Studio concept share link copied.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('Could not open sharing for this concept.');
    }
  };

  const handleRequestQuote = () => {
    setSelectedCatalogItem(selectedProduct);
    setIsQuoteWizardOpen(true);
    toast.success(`${selectedProduct.name} loaded into the quote flow.`);
  };

  const targetStudioPath = buildStudioCreativePath({
    mode: 'visualizer',
    legacyDesignId: designId ?? null,
  });

  const handleOpenEmployeeStudio = () => {
    if (isEmployee) {
      navigate(targetStudioPath);
      return;
    }

    setPostLoginRedirect(targetStudioPath);
    setIsLoginPageOpen(true);
    toast('Employee access required', {
      description: 'The internal Creative Studio is still available for BTS staff and marketing operations.',
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {!hideNav ? <NavigationBar /> : null}

      <div className={`${hideNav ? 'py-20' : 'pt-28 pb-20'} px-6 md:px-10`}>
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-[42px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_34%),linear-gradient(135deg,#101010_0%,#050505_52%,#0c0c0c_100%)] p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] md:p-10"
          >
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
            <div className="relative z-10 grid gap-8 xl:grid-cols-[0.78fr_1.22fr]">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 rounded-full border border-[#22c55e]/20 bg-[#22c55e]/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.35em] text-[#22c55e]">
                  <Sparkles size={14} />
                  Customer Studio
                </div>

                <div>
                  <h1 className="text-4xl font-serif font-bold uppercase tracking-tight text-white md:text-6xl">
                    Design With
                    <span className="block text-white/35">Real BTS Faces</span>
                  </h1>
                  <p className="mt-5 max-w-xl text-sm leading-8 text-white/55">
                    Upload a room photo or use a preset scene, select a Brick Tile Shop product face, tune the visual direction,
                    then save it to your profile, publish it to the community, share it, or request a quote.
                  </p>
                </div>

                {designId ? (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4">
                    <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-300">Legacy Design Route</p>
                    <p className="mt-3 text-sm leading-7 text-white/65">
                      This link references legacy design <span className="font-mono text-white">{designId}</span>. The concept can now be recreated,
                      saved, and shared through this customer studio.
                    </p>
                  </div>
                ) : null}

                <div className="rounded-[30px] border border-white/10 bg-black/30 p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/45">Concept Name</p>
                    <Eye size={16} className="text-[#22c55e]" />
                  </div>
                  <input
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition-colors focus:border-[#22c55e]/40"
                  />
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/70 outline-none transition-colors focus:border-[#22c55e]/40"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => createDesignRecord(false)}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/80 transition-all hover:border-white/20 hover:bg-white/10"
                  >
                    <Save size={15} />
                    Save Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => createDesignRecord(true)}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#22c55e] px-5 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-black transition-all hover:bg-[#1eb862]"
                  >
                    <Share2 size={15} />
                    Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => { void handleShare(); }}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/80 transition-all hover:border-white/20 hover:bg-white/10"
                  >
                    <Share2 size={15} />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestQuote}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl border border-[#22c55e]/20 bg-[#22c55e]/10 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#22c55e] transition-all hover:bg-[#22c55e]/15"
                  >
                    <Quote size={15} />
                    Quote
                  </button>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <div className="relative min-h-[560px] overflow-hidden rounded-[38px] border border-white/10 bg-black shadow-[0_40px_110px_rgba(0,0,0,0.65)]">
                  <img src={previewImage} alt={selectedRoom.label} className="absolute inset-0 h-full w-full object-cover opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-black/80" />
                  <div
                    className="absolute left-[9%] top-[18%] h-[58%] w-[52%] rounded-[28px] border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.45)] transition-all duration-700"
                    style={{
                      backgroundColor: selectedProduct.color,
                      opacity: blend / 100,
                      transform: `scale(${scale}) rotate(-1.5deg)`,
                      backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(0deg, rgba(0,0,0,0.22) 1px, transparent 1px), url(${activeProductImage})`,
                      backgroundSize: activeLayout === 'herringbone' ? '90px 42px, 90px 42px, cover' : '120px 38px, 120px 38px, cover',
                      mixBlendMode: activeLighting === 'interior' ? 'soft-light' : 'multiply',
                    }}
                  />
                  <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-[9px] font-mono uppercase tracking-[0.3em] text-white/65 backdrop-blur-md">
                    {selectedProduct.name} / {applicationMode}
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: 'Product', value: selectedProduct.name, icon: Boxes },
                      { label: 'Layout', value: activeLayout, icon: Layers },
                      { label: 'Lighting', value: activeLighting, icon: Camera },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-md">
                        <item.icon size={14} className="mb-3 text-[#22c55e]" />
                        <p className="text-[8px] uppercase tracking-[0.28em] text-white/30">{item.label}</p>
                        <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-widest text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[30px] border border-white/10 bg-black/35 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/35">Room Source</p>
                      <Upload size={15} className="text-white/30" />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        handleUploadRoom(event.target.files);
                        event.currentTarget.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mb-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white/60 transition-all hover:border-[#22c55e]/35 hover:text-white"
                    >
                      <ImageIcon size={15} />
                      Upload Room
                    </button>
                    <div className="grid gap-2">
                      {roomPresets.map((room) => (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => {
                            setSelectedRoom(room);
                            setCustomRoomImage(null);
                          }}
                          className={`flex items-center gap-3 rounded-2xl border p-2 text-left transition-all ${
                            selectedRoom.id === room.id && !customRoomImage
                              ? 'border-[#22c55e]/30 bg-[#22c55e]/10'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                          }`}
                        >
                          <img src={room.image} alt="" className="h-12 w-14 rounded-xl object-cover" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{room.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-white/10 bg-black/35 p-5">
                    <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.3em] text-white/35">Product Face</p>
                    <div className="grid grid-cols-2 gap-2">
                      {catalogProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                          className={`rounded-2xl border p-3 text-left transition-all ${
                            selectedProduct.id === product.id
                              ? 'border-[#22c55e]/35 bg-[#22c55e]/10'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                          }`}
                        >
                          <div className="mb-3 h-10 rounded-xl" style={{ backgroundColor: product.color }} />
                          <p className="truncate text-[9px] font-bold uppercase tracking-widest text-white">{product.name}</p>
                          <p className="mt-1 text-[8px] uppercase tracking-widest text-white/30">{product.price}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-white/10 bg-black/35 p-5">
                    <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.3em] text-white/35">Controls</p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[8px] uppercase tracking-widest text-white/30">Application</label>
                        <div className="mt-2 grid gap-2">
                          {applicationModes.map((mode) => (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => setApplicationMode(mode.id)}
                              className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                                applicationMode === mode.id ? 'border-[#22c55e]/30 bg-[#22c55e]/10' : 'border-white/10 bg-white/[0.02]'
                              }`}
                            >
                              <p className="text-[9px] font-bold uppercase tracking-widest text-white">{mode.label}</p>
                              <p className="mt-1 text-[9px] leading-4 text-white/35">{mode.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex justify-between text-[8px] uppercase tracking-widest text-white/30">
                          <span>Scale</span>
                          <span>{scale.toFixed(2)}x</span>
                        </div>
                        <input type="range" min="0.8" max="1.18" step="0.01" value={scale} onChange={(event) => setScale(Number(event.target.value))} className="w-full accent-[#22c55e]" />
                      </div>
                      <div>
                        <div className="mb-2 flex justify-between text-[8px] uppercase tracking-widest text-white/30">
                          <span>Blend</span>
                          <span>{blend}%</span>
                        </div>
                        <input type="range" min="45" max="100" step="1" value={blend} onChange={(event) => setBlend(Number(event.target.value))} className="w-full accent-[#22c55e]" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ['light', 'Light Grout'],
                          ['dark', 'Dark Grout'],
                        ].map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setActiveGrout(id)}
                            className={`rounded-xl border px-3 py-3 text-[8px] font-bold uppercase tracking-widest ${
                              activeGrout === id ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]' : 'border-white/10 bg-white/[0.02] text-white/45'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                        {[
                          ['stretcher', 'Stretcher'],
                          ['herringbone', 'Herringbone'],
                        ].map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setActiveLayout(id)}
                            className={`rounded-xl border px-3 py-3 text-[8px] font-bold uppercase tracking-widest ${
                              activeLayout === id ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]' : 'border-white/10 bg-white/[0.02] text-white/45'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveLighting(activeLighting === 'interior' ? 'daylight' : 'interior')}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white/60 transition-all hover:border-white/20 hover:text-white"
                      >
                        <Palette size={14} />
                        {activeLighting === 'interior' ? 'Daylight' : 'Interior'} Lighting
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              {
                icon: Wand2,
                title: 'AI-Assisted Restyle',
                body: 'Use the selected room, product face, layout and lighting as the creative brief.',
              },
              {
                icon: Building2,
                title: 'Quote Connected',
                body: 'Move from visual intent into the quote flow without losing the chosen product context.',
              },
              {
                icon: Share2,
                title: 'Community Ready',
                body: 'Published concepts flow into the design community and customer profile history.',
              },
              {
                icon: Lock,
                title: 'Ops Studio Link',
                body: 'BTS staff can still open the internal Creative Studio when production editing is needed.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
                <item.icon size={18} className="mb-5 text-[#22c55e]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/45">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/30 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">Internal production path</p>
              <p className="mt-2 text-sm text-white/45">For staff-only cutouts, scene jobs, Asset Lab outputs, and marketing exports.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenEmployeeStudio}
              className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Internal Creative Studio
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
