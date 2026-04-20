import React, { useMemo, useState } from 'react';
import { productData } from '../catalog/productData';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Clock, Settings, LogOut, ChevronRight, CreditCard, ArrowLeft, Sparkles, LayoutGrid, FileText, Archive, ExternalLink, Copy, Eye, MoreVertical, Trash2, Building2, X, Upload, Plus, Share2, Home, CheckCircle2, AlertCircle, ShieldCheck, Download, Globe, Lock, MapPin, Layers, User, ShoppingBag, Palette, Coins, Ticket, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

// Watermark Component for shared variants
const WatermarkOverlay = () => (
  <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
    <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
      <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
      <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-white/80">Brick Tile Shop • Verified Design</span>
    </div>
    <div className="opacity-[0.03] rotate-[-35deg] scale-150 select-none pointer-events-none whitespace-nowrap">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="text-4xl font-black uppercase tracking-[1em] mb-12">
          BRICK TILE SHOP • BRICK TILE SHOP • BRICK TILE SHOP
        </div>
      ))}
    </div>
  </div>
);
import { useVisualLab } from './VisualLabContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchInventoryCustomerDocuments } from '../inventory/api';
import type { BusinessDocumentSummary, CustomerDocumentHistory } from '../inventory/contracts';
import { usePdfPreview } from './PdfPreviewContext';

export function CustomerPortal() {
  const {
    setIsLoggedIn,
    setUserRole,
    designs,
    projects,
    deleteDesign,
    addDesign,
    updateDesign,
    addProject,
    deleteProject,
    updateProject,
    orders,
    quotes,
    btsCoins,
    setBtsCoins,
    currentCustomerProfileId,
    setCurrentCustomerProfileId,
  } = useVisualLab();

  const stats = [
    { label: 'Total Orders', value: orders.length.toString(), icon: Package },
    { label: 'Saved Designs', value: designs.length.toString(), icon: Palette },
    { label: 'Built Projects', value: projects.length.toString(), icon: Building2 },
    { label: 'BTS Coins', value: btsCoins.toString(), icon: Coins },
  ];
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'designs' | 'projects' | 'posts' | 'orders' | 'settings' | 'coin-store'>(
    location.pathname.includes('/portal/designs') ? 'designs' : 
    location.pathname.includes('/portal/projects') ? 'projects' : 
    location.pathname.includes('/portal/posts') ? 'posts' :
    location.pathname.includes('/portal/orders') ? 'orders' :
    location.pathname.includes('/portal/settings') ? 'settings' : 
    location.pathname.includes('/portal/coin-store') ? 'coin-store' : 'overview'
  );
  const [designFilter, setDesignFilter] = useState<'all' | 'draft' | 'published' | 'quote-requested' | 'archived'>('all');
  const [projectFilter, setProjectFilter] = useState<'all' | 'draft' | 'approved' | 'featured' | 'archived'>('all');
  const [postFilter, setPostFilter] = useState<'all' | 'designs' | 'projects' | 'featured' | 'archived'>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [documentHistory, setDocumentHistory] = useState<CustomerDocumentHistory | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentSearch, setDocumentSearch] = useState('');
  const navigate = useNavigate();
  const { openPdfPreview } = usePdfPreview();

  const openCustomerDocumentPdf = (document: BusinessDocumentSummary) => {
    openPdfPreview({
      url: document.pdfUrl,
      title: document.key,
      subtitle: `${document.type} / ${document.status}`,
      fileName: `${document.key}.pdf`,
    });
  };

  React.useEffect(() => {
    let cancelled = false;

    if (!currentCustomerProfileId) {
      setDocumentHistory(null);
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      setIsLoadingDocuments(true);
      try {
        const payload = await fetchInventoryCustomerDocuments(currentCustomerProfileId);
        if (!cancelled) {
          setDocumentHistory(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setDocumentHistory(null);
          toast.error(error instanceof Error ? error.message : 'Failed to load customer document history.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDocuments(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [currentCustomerProfileId]);

  const filteredDocuments = useMemo(() => {
    const allDocuments = documentHistory?.documents ?? [];
    const query = documentSearch.trim().toLowerCase();

    if (!query) {
      return allDocuments;
    }

    return allDocuments.filter((document) =>
      document.key.toLowerCase().includes(query) ||
      document.title.toLowerCase().includes(query) ||
      document.type.toLowerCase().includes(query) ||
      (document.productName ?? '').toLowerCase().includes(query),
    );
  }, [documentHistory?.documents, documentSearch]);

  const orderDocuments = filteredDocuments.filter((document) =>
    document.type === 'Customer Order' || document.type === 'Customer Invoice',
  );
  const quoteDocuments = filteredDocuments.filter((document) => document.type === 'Customer Quote');

  // Project Upload Form State
  const [newProject, setNewProject] = useState({
    title: '',
    projectType: 'Residential',
    location: '',
    description: '',
    products: [] as string[],
    isPublic: false,
    attribution: {
      architect: '',
      designer: ''
    }
  });

  const handleProjectSubmit = () => {
    if (!newProject.title) return;

    const project: any = {
      id: `proj-${Date.now()}`,
      title: newProject.title,
      projectType: newProject.projectType,
      location: newProject.location,
      description: newProject.description,
      images: {
        original: 'https://picsum.photos/seed/newproj/1600/1200',
        publishVariant: 'https://picsum.photos/seed/newproj/1200/900',
        shareVariant: 'https://picsum.photos/seed/newproj/800/600'
      },
      products: newProject.products,
      attribution: newProject.attribution,
      status: newProject.isPublic ? 'submitted' : 'draft',
      isPublic: newProject.isPublic,
      createdAt: new Date().toISOString()
    };

    addProject(project);
    setIsUploadModalOpen(false);
    setNewProject({
      title: '',
      projectType: 'Residential',
      location: '',
      description: '',
      products: [],
      isPublic: false,
      attribution: {
        architect: '',
        designer: ''
      }
    });
  };

  const toggleProductTag = (productId: string) => {
    setNewProject(prev => ({
      ...prev,
      products: prev.products.includes(productId) 
        ? prev.products.filter(id => id !== productId)
        : [...prev.products, productId]
    }));
  };

  // Sync tab with URL if needed
  React.useEffect(() => {
    if (location.pathname.includes('/portal/designs')) {
      setActiveTab('designs');
    } else if (location.pathname.includes('/portal/projects')) {
      setActiveTab('projects');
    } else if (location.pathname.includes('/portal/posts')) {
      setActiveTab('posts');
    } else if (location.pathname.includes('/portal/orders')) {
      setActiveTab('orders');
    } else if (location.pathname.includes('/portal/settings')) {
      setActiveTab('settings');
    } else if (location.pathname.includes('/portal/coin-store')) {
      setActiveTab('coin-store');
    } else {
      setActiveTab('overview');
    }
  }, [location.pathname]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setCurrentCustomerProfileId(null);
    navigate('/');
  };

  const handleTabChange = (tab: 'overview' | 'designs' | 'projects' | 'posts' | 'orders' | 'settings' | 'coin-store') => {
    setActiveTab(tab);
    if (tab === 'overview') navigate('/portal');
    else navigate(`/portal/${tab}`);
  };

  const handleShare = (type: 'design' | 'project', item: any) => {
    setSelectedItem({ ...item, type });
    setIsShareModalOpen(true);
  };

  const handlePublishToggle = (type: 'design' | 'project', id: string) => {
    if (type === 'design') {
      const design = designs.find(d => d.id === id);
      if (!design) return;
      const isPublishing = !design.isPublic;
      updateDesign(id, { 
        status: isPublishing ? 'published' : 'draft',
        isPublic: isPublishing,
        moderationStatus: isPublishing ? 'pending' : 'none'
      });
    } else {
      const project = projects.find(p => p.id === id);
      if (!project) return;
      const isSubmitting = !project.isPublic;
      updateProject(id, { 
        status: isSubmitting ? 'submitted' : 'draft',
        isPublic: isSubmitting
      });
    }
  };

  const handleDuplicate = (design: any) => {
    const newDesign = {
      ...design,
      id: `design-${Date.now()}`,
      name: `${design.name} (Copy)`,
      createdAt: new Date().toISOString(),
      status: 'draft' as const
    };
    addDesign(newDesign);
  };

  const handleArchive = (id: string) => {
    updateDesign(id, { status: 'archived' });
  };

  const filteredDesigns = designs.filter(d => 
    designFilter === 'all' ? true : d.status === designFilter
  );

  const filteredProjects = projects.filter(p => 
    projectFilter === 'all' ? true : p.status === projectFilter
  );

  const publicPosts = [
    ...designs.filter(d => d.isPublic).map(d => ({ 
      ...d, 
      contentType: 'design' as const,
      moderationState: d.moderationStatus,
      sourceModule: d.sourceModule || 'Studio'
    })),
    ...projects.filter(p => p.isPublic).map(p => ({ 
      ...p, 
      contentType: 'project' as const,
      moderationState: p.status,
      sourceModule: p.sourceModule || 'Customer Portal'
    }))
  ].sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());

  const filteredPosts = publicPosts.filter(post => {
    if (postFilter === 'all') return true;
    if (postFilter === 'designs') return post.contentType === 'design';
    if (postFilter === 'projects') return post.contentType === 'project';
    if (postFilter === 'featured') return post.status === 'featured' || (post as any).isFeatured;
    if (postFilter === 'archived') return post.status === 'archived';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-20 px-6 md:px-16 selection:bg-[#22c55e] selection:text-white">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-serif font-bold text-white tracking-tighter mb-2 uppercase">CUSTOMER PORTAL</h1>
            <p className="text-white/40 text-xs uppercase tracking-[0.3em]">Manage your premium brick orders & designs</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to="/"
              className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={14} />
              Back to Site
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-bold tracking-widest uppercase text-red-400 hover:bg-red-500/20 transition-all"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e]">
                <stat.icon size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 mb-12 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'designs', label: 'My Designs' },
            { id: 'projects', label: 'My Projects' },
            { id: 'posts', label: 'My Posts' },
            { id: 'orders', label: 'Orders & Quotes' },
            { id: 'coin-store', label: 'BTS Coin Store' },
            { id: 'settings', label: 'Settings' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-8 py-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
            >
              {tab.label}
              {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Status Hero */}
              <section className="relative h-64 rounded-[32px] overflow-hidden border border-white/10 group">
                <img 
                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1600&auto=format&fit=crop" 
                  className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000"
                  alt="Status Background"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#22c55e]">Active Project Tracker</span>
                  </div>
                  <h2 className="text-4xl font-serif font-bold text-white tracking-tighter mb-4 uppercase">MODERN VILLA RESIDENCE</h2>
                  <div className="flex items-center gap-8">
                    <div className="space-y-1">
                      <p className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Current Phase</p>
                      <p className="text-xs font-bold text-white uppercase tracking-widest">In Production</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="space-y-1">
                      <p className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Est. Delivery</p>
                      <p className="text-xs font-bold text-white uppercase tracking-widest">April 05, 2026</p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  <section className="bg-white/5 border border-white/10 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-sm font-bold text-white uppercase tracking-widest">Recent Activity</h2>
                      <button onClick={() => handleTabChange('orders')} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors">View All Orders</button>
                    </div>
                    <div className="space-y-4">
                      {orders.slice(0, 2).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all group cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                              <Package size={18} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{order.id}</div>
                              <div className="text-[10px] text-white/30 uppercase tracking-widest">{order.date}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right hidden sm:block">
                              <div className="text-sm font-bold text-white">{order.total}</div>
                              <div className="text-[10px] text-[#22c55e] uppercase tracking-widest">{order.status}</div>
                            </div>
                            <ChevronRight size={18} className="text-white/20 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col justify-between h-48 group hover:border-[#22c55e]/30 transition-all cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#22c55e] transition-colors">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Billing Method</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">Visa ending in 4242</p>
                      </div>
                    </div>
                    <div onClick={() => handleTabChange('settings')} className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col justify-between h-48 group hover:border-[#22c55e]/30 transition-all cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#22c55e] transition-colors">
                        <Settings size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Account Settings</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">Manage your profile</p>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                  <section className="bg-white/5 border border-white/10 rounded-2xl p-8">
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Support</h2>
                    <div className="space-y-4">
                      <button className="w-full py-4 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/10 transition-all">
                        Contact Specialist
                      </button>
                      <button className="w-full py-4 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/10 transition-all">
                        Technical Docs
                      </button>
                    </div>
                  </section>
                  
                  <section className="bg-white/5 border border-white/10 rounded-2xl p-8">
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Project Progress</h2>
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                      <div className="absolute top-0 left-0 h-full bg-[#22c55e] w-3/4"></div>
                    </div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed">
                      Your current project "Modern Villa" is 75% complete. Shipping scheduled for April 5th.
                    </p>
                  </section>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'designs' ? (
            <motion.div 
              key="designs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-2">My Designs</h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Manage your architectural visions and quote requests</p>
                </div>
                <Link to="/customize" className="px-8 py-4 bg-[#22c55e] text-black rounded-full text-[10px] font-bold tracking-widest uppercase hover:opacity-90 transition-all shadow-lg shadow-[#22c55e]/10">
                  Create New Design
                </Link>
              </div>

              {/* Design Filters */}
              <div className="flex flex-wrap gap-2 border-b border-white/5 pb-6">
                {(['all', 'draft', 'published', 'quote-requested', 'archived'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDesignFilter(filter)}
                    className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${designFilter === filter ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
                  >
                    {filter.replace('-', ' ')}
                  </button>
                ))}
              </div>

              {filteredDesigns.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8">
                    <LayoutGrid size={32} className="text-white/10" />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">No Designs Found</h3>
                  <p className="text-white/30 text-xs uppercase tracking-widest mb-8 max-w-xs mx-auto">
                    {designFilter === 'all' 
                      ? "Start your journey in the Customize Studio to create and save your architectural visions."
                      : `You have no designs with the status "${designFilter}".`}
                  </p>
                  <Link to="/customize" className="text-[#22c55e] text-[10px] font-bold tracking-widest uppercase hover:underline">
                    Open Customize Studio
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDesigns.map((design) => (
                    <div key={design.id} className="bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden group hover:border-[#22c55e]/30 transition-all flex flex-col shadow-2xl relative">
                      <div className="aspect-[4/5] bg-neutral-900 relative overflow-hidden">
                        {design.settings.baseImage ? (
                          <img src={design.settings.baseImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" alt={design.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/5">
                            <LayoutGrid size={48} />
                          </div>
                        )}
                        
                        {/* Status Overlay */}
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                          <div className="flex flex-col gap-2">
                            <span className={`px-3 py-1.5 rounded-full text-[7px] uppercase tracking-[0.2em] font-bold border backdrop-blur-md ${
                              design.status === 'published' ? 'bg-[#22c55e] text-black border-[#22c55e]/30' : 
                              design.status === 'quote-requested' ? 'bg-blue-500 text-white border-blue-400/30' :
                              design.status === 'archived' ? 'bg-white/10 text-white/40 border-white/10' :
                              'bg-black/40 text-white/60 border-white/10'
                            }`}>
                              {design.status.replace('-', ' ')}
                            </span>
                            {!design.isPublic && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full w-fit">
                                <Lock size={8} className="text-white/40" />
                                <span className="text-[7px] uppercase tracking-widest font-bold text-white/40">Private</span>
                              </div>
                            )}
                          </div>

                          <div className="relative group/menu">
                            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
                              <MoreVertical size={16} />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-[#141414] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden backdrop-blur-xl">
                              <button 
                                onClick={() => handlePublishToggle('design', design.id)}
                                className="w-full px-5 py-4 text-left text-[9px] uppercase tracking-widest font-bold text-white/40 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all"
                              >
                                {design.isPublic ? <Lock size={14} className="text-red-400/50" /> : <Globe size={14} className="text-[#22c55e]/50" />} 
                                {design.isPublic ? 'Make Private' : 'Publish to Gallery'}
                              </button>
                              <button 
                                onClick={() => handleDuplicate(design)}
                                className="w-full px-5 py-4 text-left text-[9px] uppercase tracking-widest font-bold text-white/40 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all"
                              >
                                <Copy size={14} className="text-white/20" /> Duplicate
                              </button>
                              <div className="h-px bg-white/5 mx-2" />
                              {design.status !== 'archived' ? (
                                <button 
                                  onClick={() => handleArchive(design.id)}
                                  className="w-full px-5 py-4 text-left text-[9px] uppercase tracking-widest font-bold text-white/40 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all"
                                >
                                  <Archive size={14} className="text-white/20" /> Archive
                                </button>
                              ) : (
                                <button 
                                  onClick={() => updateDesign(design.id, { status: 'draft' })}
                                  className="w-full px-5 py-4 text-left text-[9px] uppercase tracking-widest font-bold text-white/40 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all"
                                >
                                  <FileText size={14} className="text-white/20" /> Restore
                                </button>
                              )}
                              <button 
                                onClick={() => deleteDesign(design.id)}
                                className="w-full px-5 py-4 text-left text-[9px] uppercase tracking-widest font-bold text-red-400/60 hover:text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-all"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-3 backdrop-blur-[2px]">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleShare('design', design)}
                              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                              title="Share"
                            >
                              <Share2 size={16} />
                            </button>
                            <Link 
                              to={`/customize?designId=${design.id}`}
                              className="w-10 h-10 rounded-full bg-[#22c55e] text-black flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                              title="Edit"
                            >
                              <ExternalLink size={16} />
                            </Link>
                          </div>
                          {design.status === 'quote-requested' && (
                            <div className="flex items-center gap-2 text-[#22c55e]">
                              <Clock size={12} />
                              <span className="text-[8px] uppercase tracking-widest font-bold">In Review</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-xl font-serif font-bold text-white tracking-tight mb-2 group-hover:text-[#22c55e] transition-colors uppercase">{design.name}</h3>
                            <div className="flex items-center gap-3 text-[8px] uppercase tracking-[0.2em] text-white/20 font-bold">
                              <span>{new Date(design.createdAt).toLocaleDateString()}</span>
                              <span className="w-1 h-1 rounded-full bg-white/10" />
                              <span>{design.settings.product?.name || 'Custom Material'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                              <span className="text-[7px] uppercase tracking-widest text-white/20 mb-1 font-bold">Views</span>
                              <span className="text-[10px] font-mono text-white/60">0</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[7px] uppercase tracking-widest text-white/20 mb-1 font-bold">Saves</span>
                              <span className="text-[10px] font-mono text-white/60">0</span>
                            </div>
                          </div>
                          <div className="flex -space-x-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0a0a0a] bg-white/5 overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?u=${design.id}${i}`} className="w-full h-full object-cover opacity-40" alt="Avatar" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'posts' ? (
            <motion.div 
              key="posts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-white tracking-tight mb-2 uppercase">Community Contributions</h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Your public architectural portfolio on Brick Tile Shop</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  <span className="text-[9px] font-bold text-[#22c55e] uppercase tracking-widest">Public Profile Active</span>
                </div>
              </div>

              {/* Simplified Post Filters */}
              <div className="flex flex-wrap gap-3 border-b border-white/5 pb-8">
                {(['all', 'designs', 'projects'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPostFilter(filter as any)}
                    className={`px-8 py-2.5 rounded-full text-[9px] uppercase tracking-[0.2em] font-bold transition-all border ${postFilter === filter ? 'bg-white text-black border-white' : 'bg-transparent text-white/30 border-white/10 hover:text-white hover:border-white/30'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {filteredPosts.length === 0 ? (() => {
                const hasPrivateContent = designs.length > 0 || projects.length > 0;
                const hasArchivedPosts = publicPosts.some(p => p.status === 'archived');
                const activePublicPosts = publicPosts.filter(p => p.status !== 'archived');

                if (activePublicPosts.length === 0 && postFilter === 'all' && hasArchivedPosts) {
                  return (
                    <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-[40px] p-24 text-center">
                      <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-10 border border-white/5">
                        <Archive size={40} className="text-white/10" />
                      </div>
                      <h3 className="text-2xl font-serif font-bold text-white uppercase tracking-tight mb-4">Your Portfolio is Resting</h3>
                      <p className="text-white/30 text-xs uppercase tracking-[0.2em] mb-10 max-w-sm mx-auto leading-relaxed">
                        All your community contributions are currently archived. Restore your favorite posts to make them visible to the public again.
                      </p>
                      <button 
                        onClick={() => setPostFilter('all')} // This is a fallback, maybe add an 'archived' filter if needed
                        className="px-10 py-4 bg-white text-black rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:scale-105 transition-transform"
                      >
                        Review Archive
                      </button>
                    </div>
                  );
                }

                if (publicPosts.length === 0 && hasPrivateContent) {
                  return (
                    <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-[40px] p-24 text-center">
                      <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-10 border border-white/5">
                        <Sparkles size={40} className="text-white/10" />
                      </div>
                      <h3 className="text-2xl font-serif font-bold text-white uppercase tracking-tight mb-4">Ready for the Spotlight?</h3>
                      <p className="text-white/30 text-xs uppercase tracking-[0.2em] mb-10 max-w-sm mx-auto leading-relaxed">
                        You have {designs.length + projects.length} items in your private workspace. Select your best work and publish it to the community to gain visibility.
                      </p>
                      <div className="flex flex-wrap justify-center gap-4">
                        <button 
                          onClick={() => setActiveTab('designs')}
                          className="px-8 py-4 bg-white text-black rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:scale-105 transition-transform"
                        >
                          Review My Designs
                        </button>
                        <button 
                          onClick={() => setActiveTab('projects')}
                          className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-white/10 transition-all"
                        >
                          Review My Projects
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-[40px] p-24 text-center">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-10 border border-white/5">
                      <Globe size={40} className="text-white/10" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white uppercase tracking-tight mb-4">Begin Your Architectural Legacy</h3>
                    <p className="text-white/30 text-xs uppercase tracking-[0.2em] mb-10 max-w-sm mx-auto leading-relaxed">
                      Your public portfolio is currently empty. Share your unique visions or completed projects to inspire the Brick Tile Shop community.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <button 
                        onClick={() => setActiveTab('designs')}
                        className="px-10 py-4 bg-[#22c55e] text-black rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:scale-105 transition-transform shadow-xl shadow-[#22c55e]/10"
                      >
                        Explore My Designs
                      </button>
                    </div>
                  </div>
                );
              })() : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredPosts.map((post) => (
                    <div key={post.id} className={`bg-white/[0.02] border rounded-[32px] overflow-hidden group transition-all duration-500 flex flex-col shadow-2xl relative ${post.status === 'featured' ? 'border-yellow-500/30 shadow-yellow-500/5' : 'border-white/5 hover:border-[#22c55e]/30'}`}>
                      <div className="aspect-[4/5] bg-neutral-900 relative overflow-hidden">
                        <img 
                          src={post.contentType === 'design' ? (post as any).settings.baseImage : (post as any).images.publishVariant} 
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" 
                          alt={post.contentType === 'design' ? (post as any).name : (post as any).title} 
                        />
                        
                        {/* Status & Type Badges */}
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
                              <div className="w-1 h-1 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]" />
                              <span className="text-[7px] uppercase tracking-[0.2em] font-bold text-white">Live on Community</span>
                            </div>
                            <div className="flex gap-2">
                              <span className={`px-3 py-1.5 rounded-full text-[7px] uppercase tracking-[0.2em] font-bold border backdrop-blur-md ${
                                post.contentType === 'design' ? 'bg-white text-black border-white' : 'bg-black/40 text-white/80 border-white/10'
                              }`}>
                                {post.contentType === 'design' ? 'Studio Design' : 'Built Project'}
                              </span>
                              <span className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-[7px] uppercase tracking-[0.2em] font-bold text-white/60">
                                {post.sourceModule}
                              </span>
                            </div>
                          </div>

                          {post.status === 'featured' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-black rounded-full shadow-lg shadow-yellow-500/20">
                              <Sparkles size={10} fill="currentColor" />
                              <span className="text-[7px] uppercase tracking-widest font-black">Featured</span>
                            </div>
                          )}
                        </div>

                        {/* Community Impact Overlay - Reveal on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-end p-8 backdrop-blur-[1px]">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex gap-8">
                              <div className="space-y-1">
                                <p className="text-[7px] uppercase tracking-widest text-white/40 font-bold">Total Reach</p>
                                <div className="flex items-center gap-2">
                                  <Eye size={12} className="text-[#22c55e]" />
                                  <span className="text-sm font-mono font-bold text-white">{(post as any).metrics?.views || 0}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[7px] uppercase tracking-widest text-white/40 font-bold">Community Saves</p>
                                <div className="flex items-center gap-2">
                                  <Archive size={12} className="text-[#22c55e]" />
                                  <span className="text-sm font-mono font-bold text-white">{(post as any).metrics?.saves || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <button 
                            className="w-full py-4 bg-white text-black rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#22c55e] transition-colors shadow-2xl"
                            onClick={() => handleShare(post.contentType, post)}
                          >
                            View Public Post
                          </button>
                        </div>
                      </div>

                      <div className="p-8 flex-1 flex flex-col">
                        <div className="mb-8">
                          <h3 className="text-2xl font-serif font-bold text-white tracking-tight mb-3 group-hover:text-[#22c55e] transition-colors uppercase leading-tight">
                            {post.contentType === 'design' ? (post as any).name : (post as any).title}
                          </h3>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Clock size={10} className="text-white/20" />
                              <span className="text-[8px] uppercase tracking-[0.2em] text-white/40 font-bold">
                                Published {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-1 h-1 rounded-full ${post.moderationState === 'approved' || post.moderationState === 'featured' ? 'bg-[#22c55e]' : 'bg-yellow-500'}`} />
                              <span className="text-[8px] uppercase tracking-[0.2em] text-white/40 font-bold">
                                {post.moderationState}
                              </span>
                            </div>
                            {post.contentType === 'project' && (
                              <div className="flex items-center gap-2">
                                <MapPin size={10} className="text-white/20" />
                                <span className="text-[8px] uppercase tracking-[0.2em] text-white/40 font-bold">{(post as any).location || 'Global'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3 group/link cursor-pointer">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover/link:text-[#22c55e] group-hover/link:bg-[#22c55e]/10 transition-all border border-white/5">
                              <ExternalLink size={14} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[7px] uppercase tracking-widest text-white/20 font-bold">Public URL</span>
                              <span className="text-[9px] font-bold text-white/60 group-hover/link:text-white transition-colors">bts.community/p/{(post as any).publicSlug || post.id}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handlePublishToggle(post.contentType, post.id)}
                            className="px-4 py-2 rounded-full border border-white/10 text-[8px] uppercase tracking-widest font-bold text-white/20 hover:text-red-400 hover:border-red-400/30 transition-all"
                          >
                            Unpublish
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'orders' ? (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-2">Orders & Quotes</h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Track your material procurement and estimates</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Active Orders */}
                <section className="space-y-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#22c55e]">Confirmed Orders</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-[#22c55e]/20 to-transparent" />
                    </div>
                    <input
                      value={documentSearch}
                      onChange={(event) => setDocumentSearch(event.target.value)}
                      placeholder="Search transaction history"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] uppercase tracking-widest text-white/70 outline-none transition-colors focus:border-[#22c55e]/40"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {documentHistory ? (
                      <>
                        {isLoadingDocuments ? (
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-[10px] uppercase tracking-widest text-white/35">
                            Loading transaction history...
                          </div>
                        ) : orderDocuments.length > 0 ? (
                          orderDocuments.map((document) => (
                            <div key={document.id} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#22c55e]/30 transition-all group">
                              <div className="flex flex-col md:flex-row justify-between gap-8">
                                <div className="flex gap-6">
                                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
                                    <Package size={32} />
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-white uppercase tracking-tight">{document.key}</h4>
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest">
                                      {new Date(document.issuedAt).toLocaleDateString('en-ZA')} • {document.type}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                      <span className="px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] text-[8px] font-bold uppercase tracking-widest rounded-full border border-[#22c55e]/20">
                                        {document.status}
                                      </span>
                                      {document.productName ? (
                                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                                          {document.productName}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col md:items-end justify-center gap-4">
                                  <div className="text-2xl font-bold text-white">R {document.totalAmount.toLocaleString()}</div>
                                  <button
                                    onClick={() => openCustomerDocumentPdf(document)}
                                    className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                  >
                                    Open PDF
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-[10px] uppercase tracking-widest text-white/35">
                            No orders or invoices found for this customer yet.
                          </div>
                        )}
                      </>
                    ) : orders.map((order) => (
                      <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#22c55e]/30 transition-all group">
                        <div className="flex flex-col md:flex-row justify-between gap-8">
                          <div className="flex gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
                              <Package size={32} />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-lg font-bold text-white uppercase tracking-tight">{order.id}</h4>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">Placed on {order.date} • {order.items} Items</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] text-[8px] font-bold uppercase tracking-widest rounded-full border border-[#22c55e]/20">
                                  {order.status}
                                </span>
                                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Tracking: {order.tracking}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col md:items-end justify-center gap-4">
                            <div className="text-2xl font-bold text-white">{order.total}</div>
                            <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/10 transition-all">
                              Download Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Quotes */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/20">Material Quotes</h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/5 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {documentHistory ? (
                      <>
                        {isLoadingDocuments ? (
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-[10px] uppercase tracking-widest text-white/35">
                            Loading quote history...
                          </div>
                        ) : quoteDocuments.length > 0 ? (
                          quoteDocuments.map((quote) => (
                            <div key={quote.id} className="bg-white/5 border border-white/5 rounded-2xl p-8 hover:border-white/20 transition-all group">
                              <div className="flex flex-col md:flex-row justify-between gap-8">
                                <div className="flex gap-6">
                                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/10">
                                    <FileText size={32} />
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-white/60 uppercase tracking-tight">{quote.key}</h4>
                                    <p className="text-[10px] text-white/20 uppercase tracking-widest">
                                      Issued on {new Date(quote.issuedAt).toLocaleDateString('en-ZA')} • {quote.type}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                      <span className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded-full border ${
                                        quote.status === 'Expired' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                      }`}>
                                        {quote.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col md:items-end justify-center gap-4">
                                  <div className="text-2xl font-bold text-white/40">R {quote.totalAmount.toLocaleString()}</div>
                                  <button
                                    onClick={() => openCustomerDocumentPdf(quote)}
                                    className="px-6 py-2 bg-[#22c55e] text-black rounded-full text-[9px] font-bold tracking-widest uppercase hover:opacity-90 transition-all"
                                  >
                                    Open PDF
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-[10px] uppercase tracking-widest text-white/35">
                            No quotes found for this customer yet.
                          </div>
                        )}
                      </>
                    ) : quotes.map((quote) => (
                      <div key={quote.id} className="bg-white/5 border border-white/5 rounded-2xl p-8 hover:border-white/20 transition-all group">
                        <div className="flex flex-col md:flex-row justify-between gap-8">
                          <div className="flex gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/10">
                              <FileText size={32} />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-lg font-bold text-white/60 uppercase tracking-tight">{quote.id}</h4>
                              <p className="text-[10px] text-white/20 uppercase tracking-widest">Requested on {quote.date} • {quote.items} Items</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded-full border ${
                                  quote.status === 'Expired' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                  {quote.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col md:items-end justify-center gap-4">
                            <div className="text-2xl font-bold text-white/40">{quote.total}</div>
                            {quote.status !== 'Expired' && (
                              <button className="px-6 py-2 bg-[#22c55e] text-black rounded-full text-[9px] font-bold tracking-widest uppercase hover:opacity-90 transition-all">
                                Convert to Order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          ) : activeTab === 'settings' ? (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              <div className="lg:col-span-2 space-y-12">
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/20">Profile Information</h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/5 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Full Name</label>
                      <input type="text" defaultValue="Alex Rivera" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs text-white focus:outline-none focus:border-[#22c55e]/50 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Email Address</label>
                      <input type="email" defaultValue="alex.rivera@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs text-white focus:outline-none focus:border-[#22c55e]/50 transition-all" />
                    </div>
                  </div>
                </section>

                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/20">Shipping Addresses</h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/5 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Main Residence</p>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest">123 Coastal Way, Cape Town, SA</p>
                        </div>
                      </div>
                      <button className="text-[10px] uppercase tracking-widest text-white/20 hover:text-white transition-colors">Edit</button>
                    </div>
                    <button className="w-full py-6 border border-dashed border-white/10 rounded-2xl text-[10px] uppercase tracking-widest font-bold text-white/20 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-3">
                      <Plus size={16} /> Add New Address
                    </button>
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <section className="bg-white/5 border border-white/10 rounded-2xl p-8">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Security</h3>
                  <div className="space-y-4">
                    <button className="w-full py-4 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/10 transition-all">
                      Change Password
                    </button>
                    <button className="w-full py-4 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/10 transition-all">
                      Two-Factor Auth
                    </button>
                  </div>
                </section>
                <section className="bg-red-500/5 border border-red-500/10 rounded-2xl p-8">
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2">Danger Zone</h3>
                  <p className="text-[10px] text-red-400/40 uppercase tracking-widest leading-relaxed mb-6">
                    Permanently delete your account and all associated data.
                  </p>
                  <button className="w-full py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold tracking-widest uppercase text-red-400 hover:bg-red-500/20 transition-all">
                    Delete Account
                  </button>
                </section>
              </div>
            </motion.div>
          ) : activeTab === 'projects' ? (
            <motion.div 
              key="projects"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-2">My Projects</h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Showcase your completed installations with Brick Tile Shop</p>
                </div>
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-8 py-4 bg-[#22c55e] text-black rounded-full text-[10px] font-bold tracking-widest uppercase hover:opacity-90 transition-all shadow-lg shadow-[#22c55e]/10 flex items-center gap-2"
                >
                  <Package size={14} /> Upload New Project
                </button>
              </div>

              {/* Project Filters */}
              <div className="flex flex-wrap gap-2 border-b border-white/5 pb-6">
                    {(['all', 'draft', 'approved', 'featured', 'archived'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setProjectFilter(filter)}
                        className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${projectFilter === filter ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
                      >
                        {filter.replace('-', ' ')}
                      </button>
                    ))}
              </div>

              {filteredProjects.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8">
                    <Building2 size={32} className="text-white/10" />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">No Projects Found</h3>
                  <p className="text-white/30 text-xs uppercase tracking-widest mb-8 max-w-xs mx-auto">
                    {projectFilter === 'all' 
                      ? "Share your completed projects to inspire the community and showcase your work."
                      : `You have no projects with the status "${projectFilter}".`}
                  </p>
                  <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="text-[#22c55e] text-[10px] font-bold tracking-widest uppercase hover:underline"
                  >
                    Upload Your First Project
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden group hover:border-[#22c55e]/30 transition-all flex flex-col shadow-2xl relative">
                      <div className="aspect-[4/5] bg-neutral-900 relative overflow-hidden">
                        <img src={project.images.publishVariant} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" alt={project.title} />
                        
                        {/* Status Overlay */}
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                          <div className="flex flex-col gap-2">
                            <span className={`px-3 py-1.5 rounded-full text-[7px] uppercase tracking-[0.2em] font-bold border backdrop-blur-md ${
                              project.status === 'approved' ? 'bg-[#22c55e] text-black border-[#22c55e]/30' : 
                              project.status === 'featured' ? 'bg-yellow-500 text-black border-yellow-400/30' :
                              project.status === 'submitted' ? 'bg-blue-500 text-white border-blue-400/30' :
                              project.status === 'rejected' ? 'bg-red-500 text-white border-red-400/30' :
                              'bg-black/40 text-white/60 border-white/10'
                            }`}>
                              {project.status}
                            </span>
                            {!project.isPublic && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full w-fit">
                                <Lock size={8} className="text-white/40" />
                                <span className="text-[7px] uppercase tracking-widest font-bold text-white/40">Private</span>
                              </div>
                            )}
                          </div>

                          <div className="relative group/menu">
                            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
                              <MoreVertical size={16} />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-52 bg-[#141414] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden backdrop-blur-xl">
                              <button 
                                onClick={() => handlePublishToggle('project', project.id)}
                                className="w-full px-5 py-4 text-left text-[9px] uppercase tracking-widest font-bold text-white/40 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all"
                              >
                                {project.isPublic ? <Lock size={14} className="text-red-400/50" /> : <Globe size={14} className="text-[#22c55e]/50" />} 
                                {project.isPublic ? 'Make Private' : 'Submit to Gallery'}
                              </button>
                              <div className="h-px bg-white/5 mx-2" />
                              <button 
                                onClick={() => deleteProject(project.id)}
                                className="w-full px-5 py-4 text-left text-[9px] uppercase tracking-widest font-bold text-red-400/60 hover:text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-all"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-3 backdrop-blur-[2px]">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleShare('project', project)}
                              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                              title="Share"
                            >
                              <Share2 size={16} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-[#22c55e] text-black flex items-center justify-center hover:scale-110 transition-transform shadow-xl" title="View Details">
                              <Eye size={16} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-white/60">
                            <MapPin size={12} />
                            <span className="text-[8px] uppercase tracking-widest font-bold">{project.location || 'Global'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-xl font-serif font-bold text-white tracking-tight mb-2 group-hover:text-[#22c55e] transition-colors uppercase">{project.title}</h3>
                            <div className="flex items-center gap-3 text-[8px] uppercase tracking-[0.2em] text-white/20 font-bold">
                              <span className="flex items-center gap-1.5">{project.projectType}</span>
                              <span className="w-1 h-1 rounded-full bg-white/10" />
                              <span className="flex items-center gap-1.5">{project.attribution?.architect || 'Private Owner'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                              <span className="text-[7px] uppercase tracking-widest text-white/20 mb-1 font-bold">Products</span>
                              <span className="text-[10px] font-mono text-white/60">{project.products?.length || 0}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[7px] uppercase tracking-widest text-white/20 mb-1 font-bold">Views</span>
                              <span className="text-[10px] font-mono text-white/60">0</span>
                            </div>
                          </div>
                          <div className="flex -space-x-2">
                            {project.products?.slice(0, 3).map((productId, i) => {
                              const allProducts = [
                                ...(productData['cladding-tiles'].catalog || []), 
                                ...(productData['bricks']?.catalog || []),
                                ...(productData['paving']?.catalog || [])
                              ];
                              const product = allProducts.find(p => p.id === productId);
                              return product ? (
                                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#0a0a0a] overflow-hidden bg-neutral-800 shadow-lg">
                                  <img src={product.images?.[0] || 'https://picsum.photos/seed/product/100/100'} className="w-full h-full object-cover opacity-80" alt={product.name} />
                                </div>
                              ) : null;
                            })}
                            {(project.products?.length || 0) > 3 && (
                              <div className="w-7 h-7 rounded-full border-2 border-[#0a0a0a] bg-[#141414] flex items-center justify-center text-[7px] font-bold text-white/40 shadow-lg">
                                +{(project.products?.length || 0) - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'coin-store' ? (
            <motion.div 
              key="coin-store"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-yellow-500/10 to-transparent p-8 rounded-[32px] border border-yellow-500/20">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-yellow-500 tracking-tight mb-2 uppercase flex items-center gap-3">
                    <Coins size={28} />
                    BTS Coin Store
                  </h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] max-w-md">
                    Redeem your daily rewards for exclusive discounts and features.
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-[10px] text-yellow-500/50 uppercase tracking-widest font-bold mb-1">Your Balance</div>
                  <div className="text-4xl font-mono font-bold text-yellow-500">{btsCoins}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { id: 'discount-5', title: '5% Order Discount', cost: 20, icon: Ticket, desc: 'Apply a 5% discount to your next tile or brick order.' },
                  { id: 'discount-2-5', title: '2.5% Order Discount', cost: 10, icon: Ticket, desc: 'Apply a 2.5% discount to your next tile or brick order.' },
                  { id: 'ai-gen', title: '3 Free AI Generations', cost: 15, icon: Sparkles, desc: 'Unlock 3 premium AI design generations in the Studio.' },
                  { id: 'showcase-ad', title: 'Homepage Showcase Ad', cost: 50, icon: ImageIcon, desc: 'Feature your project on the BTS homepage for 1 week.' },
                  { id: 'giveaway', title: 'x2 Giveaway Entry', cost: 15, icon: Package, desc: 'Double your chances in the next monthly product giveaway.' },
                ].map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col hover:border-yellow-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-6 group-hover:scale-110 transition-transform">
                      <item.icon size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">{item.title}</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed mb-6 flex-1">
                      {item.desc}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 text-yellow-500 font-bold">
                        <Coins size={14} />
                        <span className="text-xs">{item.cost}</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (btsCoins >= item.cost) {
                            setBtsCoins(btsCoins - item.cost);
                            toast.success(`Successfully redeemed: ${item.title}`);
                          } else {
                            toast.error('Not enough coins!');
                          }
                        }}
                        className={`px-4 py-2 rounded-full text-[9px] uppercase tracking-widest font-bold transition-all ${btsCoins >= item.cost ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Share Modal */}
        <AnimatePresence>
          {isShareModalOpen && selectedItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsShareModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="flex flex-col md:flex-row h-full">
                  {/* Preview Area */}
                  <div className="flex-1 bg-neutral-900 relative aspect-square md:aspect-auto overflow-hidden">
                    <img 
                      src={selectedItem.type === 'design' 
                        ? selectedItem.settings.renderUrl 
                        : selectedItem.images.shareVariant
                      } 
                      className="w-full h-full object-cover"
                      alt="Share Preview"
                    />
                    <WatermarkOverlay />
                    
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                      <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Project Ref</div>
                        <div className="text-xs font-bold text-white uppercase tracking-widest">{selectedItem.title || selectedItem.name}</div>
                      </div>
                    </div>
                  </div>

                  {/* Controls Area */}
                  <div className="w-full md:w-80 p-8 border-l border-white/5 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">Share Options</h3>
                      <button onClick={() => setIsShareModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-6 flex-1">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                          <ShieldCheck size={16} className="text-[#22c55e]" />
                          <span className="text-[10px] uppercase tracking-widest font-bold text-white">Managed Variant</span>
                        </div>
                        <p className="text-[9px] text-white/30 uppercase tracking-widest leading-relaxed">
                          This version includes a non-destructive watermark and project metadata for public sharing.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <button className="w-full py-4 bg-white text-black rounded-xl text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-3 hover:bg-[#22c55e] transition-all">
                          <Download size={14} /> Download Variant
                        </button>
                        <button className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                          <Share2 size={14} /> Copy Public Link
                        </button>
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <div className="text-[10px] uppercase tracking-widest text-white/20 mb-4">Direct Share</div>
                        <div className="grid grid-cols-4 gap-2">
                          {['Instagram', 'Pinterest', 'LinkedIn', 'X'].map(platform => (
                            <button key={platform} className="aspect-square bg-white/5 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all" title={platform}>
                              <ExternalLink size={16} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-3 text-white/20">
                        <Lock size={12} />
                        <span className="text-[8px] uppercase tracking-[0.2em] font-bold">Original Asset Protected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Project Upload Modal */}
        <AnimatePresence>
          {isUploadModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsUploadModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Upload Project</h2>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Share your completed installation</p>
                  </div>
                  <button 
                    onClick={() => setIsUploadModalOpen(false)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {/* Step 1: Basic Info */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Project Title</label>
                        <input 
                          type="text" 
                          value={newProject.title}
                          onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                          placeholder="e.g. Modern Coastal Villa" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs uppercase tracking-widest text-white focus:outline-none focus:border-[#22c55e]/50 transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Project Type</label>
                        <select 
                          value={newProject.projectType}
                          onChange={(e) => setNewProject({...newProject, projectType: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs uppercase tracking-widest text-white focus:outline-none focus:border-[#22c55e]/50 transition-all appearance-none"
                        >
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Hospitality">Hospitality</option>
                          <option value="Public Space">Public Space</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Location (Optional)</label>
                        <input 
                          type="text" 
                          value={newProject.location}
                          onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                          placeholder="e.g. Malibu, CA" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs uppercase tracking-widest text-white focus:outline-none focus:border-[#22c55e]/50 transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Architect / Designer</label>
                        <input 
                          type="text" 
                          value={newProject.attribution.architect}
                          onChange={(e) => setNewProject({...newProject, attribution: {...newProject.attribution, architect: e.target.value}})}
                          placeholder="e.g. Studio Linear" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs uppercase tracking-widest text-white focus:outline-none focus:border-[#22c55e]/50 transition-all" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Project Description</label>
                      <textarea 
                        rows={3} 
                        value={newProject.description}
                        onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                        placeholder="Tell us about the project and how BTS tiles were used..." 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs uppercase tracking-widest text-white focus:outline-none focus:border-[#22c55e]/50 transition-all resize-none" 
                      />
                    </div>
                  </div>

                  {/* Step 2: Media Upload */}
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Project Media</label>
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-[#22c55e]/30 transition-all cursor-pointer group">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 group-hover:bg-[#22c55e]/10 transition-all">
                        <Upload size={24} className="text-white/20 group-hover:text-[#22c55e] transition-all" />
                      </div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Drop high-res photos here</h3>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest">or click to browse files (Max 10MB per image)</p>
                    </div>
                  </div>

                  {/* Step 3: Product Tagging */}
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Linked Products</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        ...(productData['cladding-tiles'].catalog || []), 
                        ...(productData['bricks']?.catalog || []),
                        ...(productData['paving']?.catalog || [])
                      ].slice(0, 6).map(product => (
                        <button 
                          key={product.id}
                          onClick={() => toggleProductTag(product.id)}
                          className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all ${newProject.products.includes(product.id) ? 'bg-[#22c55e]/10 border-[#22c55e] text-[#22c55e]' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'}`}
                        >
                          <div className="w-full aspect-square rounded-lg overflow-hidden">
                            <img src={product.images?.[0] || 'https://picsum.photos/seed/prod/400/400'} className="w-full h-full object-cover" alt={product.name} />
                          </div>
                          <span className="text-[8px] uppercase tracking-widest font-bold text-center line-clamp-1">{product.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 4: Visibility */}
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-white mb-1">Submit to Public Gallery</h4>
                      <p className="text-[8px] uppercase tracking-widest text-white/30">Your project will be reviewed by our team before appearing in the community showcase.</p>
                    </div>
                    <button 
                      onClick={() => setNewProject({...newProject, isPublic: !newProject.isPublic})}
                      className={`w-12 h-6 rounded-full transition-all relative ${newProject.isPublic ? 'bg-[#22c55e]' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newProject.isPublic ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="p-8 bg-white/5 border-t border-white/5 flex justify-end gap-4">
                  <button 
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleProjectSubmit}
                    disabled={!newProject.title}
                    className={`px-10 py-4 bg-[#22c55e] text-black rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all shadow-lg shadow-[#22c55e]/10 ${!newProject.title ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                  >
                    Save Project
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Share Modal */}
        <AnimatePresence>
          {isShareModalOpen && selectedItem && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsShareModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
              >
                {/* Preview Area */}
                <div className="flex-1 bg-neutral-900 p-8 flex flex-col items-center justify-center relative min-h-[400px]">
                  <div className="relative w-full max-w-md aspect-[4/5] bg-white shadow-2xl overflow-hidden rounded-sm flex flex-col">
                    <div className="flex-1 relative overflow-hidden">
                      <img 
                        src={selectedItem.settings?.baseImage || selectedItem.images?.publishVariant || 'https://picsum.photos/seed/share/800/1000'} 
                        className="w-full h-full object-cover" 
                        alt="Preview" 
                      />
                      <div className="absolute top-6 left-6">
                        <div className="text-[8px] font-bold tracking-[0.4em] uppercase text-white drop-shadow-md">Brick Tile Shop</div>
                      </div>
                    </div>
                    <div className="p-6 bg-white text-black">
                      <div className="text-[10px] font-bold uppercase tracking-widest mb-1">{selectedItem.name || selectedItem.title}</div>
                      <div className="text-[8px] uppercase tracking-widest text-black/40">Design Concept • {new Date().toLocaleDateString()}</div>
                      <div className="mt-4 pt-4 border-t border-black/5 flex justify-between items-end">
                        <div>
                          <div className="text-[7px] uppercase tracking-widest text-black/30 mb-1">Featured Product</div>
                          <div className="text-[9px] font-bold uppercase tracking-widest">
                            {selectedItem.settings?.product?.name || 'Premium Cladding'}
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-black flex items-center justify-center text-white text-[6px] font-bold">BTS</div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-6 text-[10px] text-white/30 uppercase tracking-widest">Branded Export Preview</p>
                </div>

                {/* Controls Area */}
                <div className="w-full md:w-80 p-10 border-l border-white/5 flex flex-col">
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Share Design</h2>
                    <button onClick={() => setIsShareModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6 flex-1">
                    <div>
                      <label className="text-[9px] text-white/30 uppercase tracking-[0.3em] mb-4 block font-bold">Export Format</label>
                      <div className="grid grid-cols-1 gap-2">
                        {['Instagram Story (9:16)', 'Pinterest Pin (2:3)', 'Standard PDF'].map(f => (
                          <button key={f} className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-xl text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white hover:bg-white/10 text-left transition-all">
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-white/30 uppercase tracking-[0.3em] mb-4 block font-bold">Direct Link</label>
                      <div className="flex gap-2">
                        <input 
                          readOnly 
                          value={`https://bts.com/share/${selectedItem.id}`} 
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white/40 focus:outline-none"
                        />
                        <button className="p-3 bg-white/10 rounded-xl text-white hover:bg-[#22c55e] hover:text-black transition-all">
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-5 bg-[#22c55e] text-black rounded-2xl text-[10px] uppercase tracking-[0.4em] font-bold shadow-lg shadow-[#22c55e]/10 mt-10">
                    Download Asset
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
