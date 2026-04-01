import React, { useState, useMemo } from 'react';
import { useVisualLab } from './VisualLabContext';
import { NavigationBar } from './NavigationBar';
import { Footer } from './Footer';
import { productData } from '../catalog/productData';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, ArrowRight, ExternalLink, Building2, Home, Briefcase, Filter, Sparkles, LayoutGrid, List, ChevronRight, Quote, Share2, X, Download, ShieldCheck, Lock, Eye, ShoppingBag, ArrowUpRight, User, Layers } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Watermark Component for shared variants
const WatermarkOverlay = () => (
  <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
    <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
      <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
      <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-white/80">Brick Tile Shop • Verified Project</span>
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

export function BuiltProjects() {
  const { projects, setIsQuoteWizardOpen, setSelectedCatalogItem, setIsCustomizeMode, setActiveCategory: setContextCategory } = useVisualLab();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedProjectForShare, setSelectedProjectForShare] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<any>(null);

  const categories = ['All', 'Residential', 'Commercial', 'Hospitality', 'Public Space'];
  const productCategories = ['All', 'Cladding Tiles', 'Bricks', 'Paving'];

  const allProducts = useMemo(() => {
    return [
      ...(productData['cladding-tiles'].catalog || []),
      ...(productData['bricks']?.catalog || []),
      ...(productData['paving']?.catalog || [])
    ];
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Only show approved or featured projects in public gallery
      if ((p.status !== 'approved' && p.status !== 'featured') || !p.isPublic) return false;

      const matchesType = activeFilter === 'All' || p.projectType === activeFilter;
      
      // Category matching logic (simplified for mock)
      const matchesCategory = activeCategory === 'All' || (
        activeCategory === 'Cladding Tiles' && p.products.some(id => id.includes('tile') || id.includes('serengeti') || id.includes('zambezi')) ||
        activeCategory === 'Bricks' && p.products.some(id => id.includes('brick')) ||
        activeCategory === 'Paving' && p.products.some(id => id.includes('paver'))
      );

      const matchesSearch = searchQuery === '' || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.attribution?.architect?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesCategory && matchesSearch;
    });
  }, [projects, activeFilter, activeCategory, searchQuery]);

  const handleShare = (project: any) => {
    setSelectedProjectForShare(project);
    setIsShareModalOpen(true);
  };

  const handleViewDetail = (project: any) => {
    setSelectedProjectForDetail(project);
    setIsDetailModalOpen(true);
  };
  const handleRequestQuote = (project: any) => {
    // Find the first product used in the project to pre-select it in the wizard
    if (project.products && project.products.length > 0) {
      const product = allProducts.find(p => p.id === project.products[0]);
      if (product) {
        setSelectedCatalogItem(product);
      }
    }
    setIsQuoteWizardOpen(true);
  };

  const handleStartFromLook = (project: any) => {
    if (project.products && project.products.length > 0) {
      const product = allProducts.find(p => p.id === project.products[0]);
      if (product) {
        setSelectedCatalogItem(product);
        const category = product.id.includes('brick') ? 'bricks' : product.id.includes('paver') ? 'paving' : 'cladding-tiles';
        setContextCategory(category);
        setIsCustomizeMode(true);
        navigate('/customize');
      }
    }
  };

  const handleViewProduct = (pId: string) => {
    const product = allProducts.find(p => p.id === pId);
    if (product) {
      setSelectedCatalogItem(product);
      const category = product.id.includes('brick') ? 'bricks' : product.id.includes('paver') ? 'paving' : 'cladding-tiles';
      setContextCategory(category);
      navigate('/catalog');
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-[#22c55e] selection:text-white">
      <NavigationBar />
      
      {/* SEO Metadata Surface (Hidden) */}
      <div className="sr-only" aria-hidden="true">
        <title>Built Projects Gallery | Brick Tile Shop</title>
        <meta name="description" content="Explore our portfolio of completed architectural projects featuring premium brick tiles and clay bricks from Brick Tile Shop." />
        <link rel="canonical" href="https://bricktileshop.com/built-projects" />
      </div>

      <main className="pt-32 pb-24 px-8 md:px-16">
        {/* Breadcrumbs */}
        <nav className="max-w-7xl mx-auto mb-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 font-bold">
          <Link to="/" className="hover:text-[#22c55e] transition-colors">Home</Link>
          <ChevronRight size={10} />
          <span className="text-white/60">Built Projects</span>
        </nav>

        {/* Header Section */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#22c55e]/10 flex items-center justify-center border border-[#22c55e]/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                  <Building2 size={24} className="text-[#22c55e]" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#22c55e]">Case Study Showcase</span>
              </div>
              <h1 className="text-7xl md:text-9xl font-['Anton'] tracking-tighter uppercase leading-[0.85] mb-8">
                BUILT<br/>PROJECTS
              </h1>
              <p className="text-white/40 text-sm uppercase tracking-[0.2em] leading-relaxed max-w-xl">
                A curated collection of real-world architectural excellence. Explore completed installations featuring Brick Tile Shop premium materials across residential and commercial landscapes.
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-8">
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-[#050505] overflow-hidden bg-neutral-800">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Architect" />
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-2 border-[#050505] bg-[#111] flex items-center justify-center text-[10px] font-bold text-white/40">
                  +42
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white mb-1">250+</div>
                <div className="text-[10px] text-white/20 uppercase tracking-widest">Architectural Partners</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="max-w-7xl mx-auto mb-16 space-y-8 border-y border-white/5 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">Filter by Project Type</div>
              <div className="flex flex-wrap gap-2">
                {categories.map(filter => (
                  <button 
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-6 py-3 rounded-full text-[9px] uppercase tracking-[0.2em] font-bold transition-all border ${activeFilter === filter ? 'bg-white text-black border-white shadow-[0_10px_30px_rgba(255,255,255,0.1)]' : 'bg-transparent text-white/30 border-white/10 hover:border-white/30 hover:text-white'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">Filter by Product Category</div>
              <div className="flex flex-wrap gap-2">
                {productCategories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-3 rounded-full text-[9px] uppercase tracking-[0.2em] font-bold transition-all border ${activeCategory === cat ? 'bg-[#22c55e] text-black border-[#22c55e] shadow-[0_10px_30px_rgba(34,197,94,0.1)]' : 'bg-transparent text-white/30 border-white/10 hover:border-white/30 hover:text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-8 border-t border-white/5">
            <div className="relative w-full md:w-96">
              <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, locations, architects..." 
                className="bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-4 text-[11px] uppercase tracking-widest text-white focus:outline-none focus:border-[#22c55e]/50 w-full transition-all"
              />
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-[10px] uppercase tracking-widest text-white/20 font-bold">
                Showing <span className="text-white">{filteredProjects.length}</span> Results
              </div>
              <div className="flex bg-white/5 rounded-full p-1.5 border border-white/5">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-full transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div 
                key={project.id}
                layout
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="group relative flex flex-col"
              >
                {/* Image Container */}
                <div 
                  className="aspect-[16/10] overflow-hidden rounded-3xl relative mb-8 shadow-2xl cursor-pointer"
                  onClick={() => handleViewDetail(project)}
                >
                  <img 
                    src={project.images.publishVariant} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    alt={project.title} 
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Overlay Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 p-10 flex flex-col justify-end">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?u=${project.id}`} alt="Architect" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/60 mb-0.5">Architectural Partner</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-white">
                          {project.attribution?.architect || 'Private Client'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleViewDetail(project); }}
                        className="flex-1 py-4 bg-white text-black rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#22c55e] transition-all flex items-center justify-center gap-2"
                      >
                        View Case Study <ChevronRight size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleShare(project); }}
                        className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                      >
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[8px] uppercase tracking-[0.3em] font-bold text-white">
                      {project.projectType}
                    </div>
                    {project.status === 'featured' && (
                      <div className="px-4 py-2 bg-[#22c55e] border border-[#22c55e]/30 rounded-full text-[8px] uppercase tracking-[0.3em] font-bold text-black flex items-center gap-2">
                        <Sparkles size={10} /> Featured Project
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="px-4">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex-1 pr-8">
                      <h3 className="text-2xl font-bold tracking-tight mb-4 group-hover:text-[#22c55e] transition-colors line-clamp-1">{project.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-white/20 text-[9px] uppercase tracking-[0.2em] font-bold">
                        <span className="flex items-center gap-2"><MapPin size={10} className="text-[#22c55e]/60" /> {project.location}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="flex items-center gap-2 text-white/40"><Layers size={10} className="text-white/20" /> {project.projectType}</span>
                        {project.attribution?.architect && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="flex items-center gap-2">
                              <Building2 size={10} className="text-white/10" />
                              <span className="text-white/40">{project.attribution.architect}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-[8px] uppercase tracking-[0.2em] text-white/10 mb-3 font-bold">Materials</div>
                      <div className="flex -space-x-2">
                        {project.products.slice(0, 3).map((pId: string, i: number) => {
                          const product = allProducts.find(p => p.id === pId);
                          return (
                            <button 
                              key={i} 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProduct(pId);
                              }}
                              className="w-9 h-9 rounded-xl border-2 border-[#050505] bg-neutral-900 overflow-hidden group/prod relative shadow-2xl transition-all hover:scale-110 hover:z-10" 
                              title={`View ${product?.name || pId}`}
                            >
                              <img src={product?.images?.[0] || `https://picsum.photos/seed/${pId}/100/100`} alt="Product" className="w-full h-full object-cover opacity-60 group-hover/prod:opacity-100 transition-all" />
                              <div className="absolute inset-0 bg-[#22c55e]/80 opacity-0 group-hover/prod:opacity-100 transition-opacity flex items-center justify-center">
                                <ArrowUpRight size={12} className="text-black" />
                              </div>
                            </button>
                          );
                        })}
                        {project.products.length > 3 && (
                          <div className="w-9 h-9 rounded-xl border-2 border-[#050505] bg-[#141414] flex items-center justify-center text-[9px] font-bold text-white/40 backdrop-blur-sm shadow-2xl">
                            +{project.products.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-white/40 text-[11px] uppercase tracking-widest leading-relaxed line-clamp-2 mb-8">
                    {project.description}
                  </p>

                  <div className="flex flex-col gap-4 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <button 
                          onClick={() => handleRequestQuote(project)}
                          className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#22c55e] hover:text-white transition-colors flex items-center gap-2 group/cta"
                        >
                          <Quote size={12} className="group-hover/cta:rotate-12 transition-transform" />
                          Request Quote <ArrowRight size={12} className="group-hover/cta:translate-x-1 transition-transform" />
                        </button>
                        <button 
                          onClick={() => handleStartFromLook(project)}
                          className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/60 hover:text-[#22c55e] transition-colors flex items-center gap-2 group/look"
                        >
                          <Sparkles size={12} className="group-hover/look:scale-110 transition-transform" />
                          Start From This Look
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleShare(project)}
                          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
                          title="Share Project"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] uppercase tracking-widest text-white/20">Case Ref: {project.id.toUpperCase()}</span>
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={10} className="text-[#22c55e]/40" />
                        <span className="text-[8px] uppercase tracking-widest text-white/20">Verified Installation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Load More */}
        <div className="mt-32 flex flex-col items-center gap-8">
          <div className="h-px w-32 bg-white/10" />
          <button className="group flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] font-bold text-white/40 hover:text-white transition-all">
            Explore All Projects <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </main>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedProjectForDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="fixed inset-0 bg-black/95 backdrop-blur-2xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl z-10"
            >
              {/* SEO Metadata Surface (Hidden) */}
              <div className="sr-only" aria-hidden="true">
                <h3>{selectedProjectForDetail.title} | {selectedProjectForDetail.location}</h3>
                <p>{selectedProjectForDetail.description}</p>
                <span>Architect: {selectedProjectForDetail.attribution?.architect}</span>
              </div>

              <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
                {/* Visual Area */}
                <div className="flex-1 bg-neutral-900 relative overflow-hidden group">
                  <img 
                    src={selectedProjectForDetail.images.publishVariant} 
                    className="w-full h-full object-cover"
                    alt={selectedProjectForDetail.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Image Navigation/Badges */}
                  <div className="absolute top-8 left-8 flex flex-col gap-3">
                    <div className="px-5 py-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold text-white flex items-center gap-3">
                      <MapPin size={12} className="text-[#22c55e]" />
                      {selectedProjectForDetail.location}
                    </div>
                    <div className="px-5 py-2.5 bg-[#22c55e] border border-[#22c55e]/30 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold text-black flex items-center gap-3">
                      <ShieldCheck size={12} />
                      Verified Installation
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsDetailModalOpen(false)}
                    className="absolute top-8 right-8 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content Area */}
                <div className="w-full lg:w-[450px] bg-[#0a0a0a] p-10 lg:p-12 overflow-y-auto border-l border-white/5 flex flex-col">
                  {/* Breadcrumbs inside modal */}
                  <nav className="mb-10 flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/30 font-bold">
                    <span>Projects</span>
                    <ChevronRight size={8} />
                    <span className="text-white/60">{selectedProjectForDetail.projectType}</span>
                  </nav>

                  <div className="mb-10">
                    <h2 className="text-4xl font-['Anton'] tracking-tighter uppercase leading-none mb-6">
                      {selectedProjectForDetail.title}
                    </h2>
                    <p className="text-white/40 text-sm uppercase tracking-[0.2em] leading-relaxed">
                      {selectedProjectForDetail.description}
                    </p>
                  </div>

                  {/* Attribution Section */}
                  <div className="grid grid-cols-2 gap-8 mb-12 py-8 border-y border-white/5">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/20 mb-3">Architectural Partner</div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <User size={14} className="text-white/40" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-white">
                          {selectedProjectForDetail.attribution?.architect || 'Private Client'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/20 mb-3">Completion Date</div>
                      <div className="text-xs font-bold uppercase tracking-widest text-white">
                        {new Date(selectedProjectForDetail.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Materials Specification */}
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Material Specification</h3>
                      <button className="text-[9px] uppercase tracking-widest text-[#22c55e] hover:underline">Download Spec</button>
                    </div>
                    <div className="space-y-3">
                      {selectedProjectForDetail.products.map((pId: string) => {
                        const product = allProducts.find(p => p.id === pId);
                        if (!product) return null;
                        return (
                          <button 
                            key={pId}
                            onClick={() => handleViewProduct(pId)}
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group/item hover:border-[#22c55e]/30 transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-800">
                                <img src={product.images[0]} className="w-full h-full object-cover" alt={product.name} />
                              </div>
                              <div className="text-left">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-white group-hover/item:text-[#22c55e] transition-colors">{product.name}</div>
                                <div className="text-[8px] uppercase tracking-widest text-white/20">
                                  {(product as any).mood || (product as any).category || 'Premium Material'}
                                </div>
                              </div>
                            </div>
                            <ArrowUpRight size={14} className="text-white/20 group-hover/item:text-white transition-all group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Actions */}
                  <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
                    <button 
                      onClick={() => handleRequestQuote(selectedProjectForDetail)}
                      className="w-full py-5 bg-[#22c55e] text-black rounded-2xl text-[11px] uppercase tracking-[0.3em] font-black hover:bg-white transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                    >
                      <Quote size={16} /> Request Project Quote
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleStartFromLook(selectedProjectForDetail)}
                        className="py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all"
                      >
                        <Sparkles size={14} /> Start From Look
                      </button>
                      <button 
                        onClick={() => { setIsDetailModalOpen(false); handleShare(selectedProjectForDetail); }}
                        className="py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all"
                      >
                        <Share2 size={14} /> Share Project
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && selectedProjectForShare && (
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
                    src={selectedProjectForShare.images.shareVariant} 
                    className="w-full h-full object-cover"
                    alt="Share Preview"
                  />
                  <WatermarkOverlay />
                  
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Project Ref</div>
                      <div className="text-xs font-bold text-white uppercase tracking-widest">{selectedProjectForShare.title}</div>
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

      <Footer />
    </div>
  );
}
