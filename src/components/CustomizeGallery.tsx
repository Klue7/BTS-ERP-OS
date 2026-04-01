import React, { useState } from 'react';
import { productData } from '../catalog/productData';
import { Search, Filter, ArrowRight, Heart, Share2, Eye, User, Sparkles, LayoutGrid, List, X, Download, ShieldCheck, Lock, ExternalLink, ShoppingBag, Quote, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useVisualLab } from './VisualLabContext';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationBar } from './NavigationBar';
import { Footer } from './Footer';
import { Link, useNavigate } from 'react-router-dom';

// Watermark Component for shared variants
const WatermarkOverlay = () => (
  <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
    <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
      <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
      <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-white/80">Brick Tile Shop • Design Community</span>
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

export function CustomizeGallery() {
  const { designs, setIsQuoteWizardOpen, setSelectedCatalogItem, setIsCustomizeMode, setActiveCategory: setContextCategory } = useVisualLab();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'featured' | 'newest'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedDesignForShare, setSelectedDesignForShare] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDesignForDetail, setSelectedDesignForDetail] = useState<any>(null);

  const categories = ['All', 'Residential', 'Commercial', 'Interior', 'Exterior'];
  const products = ['All', 'Cladding Tiles', 'Bricks', 'Paving'];

  // Combine mock data with real designs from context
  const mockGalleryItems = [
    {
      id: '1',
      title: 'Modern Loft Kitchen',
      author: 'Studio Design Co.',
      product: 'Obsidian Matte',
      productCategory: 'Brick Tiles',
      image: 'https://picsum.photos/seed/kitchen/800/600',
      likes: 124,
      views: 1200,
      roomType: 'Interior',
      projectType: 'Residential',
      isFeatured: true,
      date: '2024-03-20'
    },
    {
      id: '2',
      title: 'Heritage Facade Restoration',
      author: 'Architectural Heritage',
      product: 'Classic Red Clay',
      productCategory: 'Clay Bricks',
      image: 'https://picsum.photos/seed/facade/800/600',
      likes: 89,
      views: 850,
      roomType: 'Exterior',
      projectType: 'Commercial',
      isFeatured: false,
      date: '2024-03-22'
    },
    {
      id: '3',
      title: 'Minimalist Office Lobby',
      author: 'Future Spaces',
      product: 'Concrete Honed',
      productCategory: 'Brick Tiles',
      image: 'https://picsum.photos/seed/lobby/800/600',
      likes: 210,
      views: 3400,
      roomType: 'Interior',
      projectType: 'Commercial',
      isFeatured: true,
      date: '2024-03-15'
    },
    {
      id: '4',
      title: 'Coastal Villa Patio',
      author: 'Oceanic Design',
      product: 'Sandstone Texture',
      productCategory: 'Stone Cladding',
      image: 'https://picsum.photos/seed/patio/800/600',
      likes: 156,
      views: 1800,
      roomType: 'Exterior',
      projectType: 'Residential',
      isFeatured: true,
      date: '2024-03-18'
    },
    {
      id: '5',
      title: 'Industrial Cafe Wall',
      author: 'Urban Brew',
      product: 'Charcoal Stack',
      productCategory: 'Brick Tiles',
      image: 'https://picsum.photos/seed/cafe/800/600',
      likes: 72,
      views: 600,
      roomType: 'Interior',
      projectType: 'Commercial',
      isFeatured: false,
      date: '2024-03-24'
    },
    {
      id: '6',
      title: 'Luxury Master Bathroom',
      author: 'Elegance Interiors',
      product: 'White Glazed',
      productCategory: 'Brick Tiles',
      image: 'https://picsum.photos/seed/bathroom/800/600',
      likes: 340,
      views: 5200,
      roomType: 'Interior',
      projectType: 'Residential',
      isFeatured: true,
      date: '2024-03-12'
    }
  ];

  const contextGalleryItems = designs
    .filter(d => d.status === 'published' && d.isPublic && d.moderationStatus === 'approved')
    .map(d => ({
      id: d.id,
      title: d.name,
      author: d.author?.name || 'Anonymous Designer',
      product: d.settings.product?.name || 'Custom Blend',
      productCategory: 'Brick Tiles',
      image: d.settings.renderUrl || d.settings.baseImage || 'https://picsum.photos/seed/design/800/600',
      likes: 0,
      views: 0,
      roomType: d.roomType,
      projectType: d.roomType === 'Commercial' ? 'Commercial' : 'Residential',
      isFeatured: d.isFeatured || false,
      date: d.createdAt
    }));

  const galleryItems = [...mockGalleryItems, ...contextGalleryItems];

  const filteredItems = galleryItems
    .filter(item => {
      if (activeFilter === 'All') return true;
      return item.projectType === activeFilter || item.roomType === activeFilter || item.productCategory === activeFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'featured') return a.isFeatured === b.isFeatured ? 0 : a.isFeatured ? -1 : 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const allProducts = React.useMemo(() => {
    return [
      ...(productData['cladding-tiles'].catalog || []),
      ...(productData['bricks']?.catalog || []),
      ...(productData['paving']?.catalog || [])
    ];
  }, []);

  const handleShare = (item: any) => {
    setSelectedDesignForShare(item);
    setIsShareModalOpen(true);
  };

  const handleViewDetail = (item: any) => {
    setSelectedDesignForDetail(item);
    setIsDetailModalOpen(true);
  };

  const handleUseLook = (item: any) => {
    // Find the product used in the design
    const product = allProducts.find(p => p.name === item.product || p.id === item.product);
    if (product) {
      setSelectedCatalogItem(product);
      const category = product.id.includes('brick') ? 'bricks' : product.id.includes('paver') ? 'paving' : 'cladding-tiles';
      setContextCategory(category);
      setIsCustomizeMode(true);
      navigate('/customize');
    } else {
      // Fallback if product not found by name
      navigate('/customize');
    }
  };

  const handleRequestQuote = (item: any) => {
    const product = allProducts.find(p => p.name === item.product || p.id === item.product);
    if (product) {
      setSelectedCatalogItem(product);
    }
    setIsQuoteWizardOpen(true);
  };

  const handleViewProduct = (productName: string) => {
    const product = allProducts.find(p => p.name === productName || p.id === productName);
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
        <title>Design Community | Brick Tile Shop</title>
        <meta name="description" content="Browse curated architectural designs from our community. Get inspired by creative uses of brick tiles and clay bricks." />
        <link rel="canonical" href="https://bricktileshop.com/gallery" />
      </div>

      <main className="pt-32 pb-24 px-8 md:px-16">
        {/* Breadcrumbs */}
        <nav className="max-w-7xl mx-auto mb-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 font-bold">
          <Link to="/" className="hover:text-[#22c55e] transition-colors">Home</Link>
          <ChevronRight size={10} className="text-white/20" />
          <span className="text-white/60">Design Community</span>
        </nav>

        {/* Header Section */}
        <div className="max-w-7xl mx-auto mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                  <Sparkles size={20} className="text-[#22c55e]" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#22c55e]">Inspiration Gallery</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-['Anton'] tracking-tighter uppercase leading-none mb-6">
                DESIGN<br/>COMMUNITY
              </h1>
              <p className="text-white/40 text-sm uppercase tracking-widest leading-relaxed">
                Explore curated designs from architects, designers, and customers using the Brick Tile Shop Customize Studio.
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-6">
              <Link 
                to="/customize"
                className="group flex items-center gap-4 bg-white text-black px-8 py-4 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-[#22c55e] transition-all"
              >
                Start Your Design <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-4 text-white/20 text-[10px] uppercase tracking-widest">
                <span>1.2k Designs Published</span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <span>8.4k Community Saves</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-y border-white/5 py-10">
          <div className="flex flex-col gap-6 w-full md:w-auto">
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Sort By:</span>
              <div className="flex bg-white/5 rounded-full p-1">
                <button 
                  onClick={() => setSortBy('featured')}
                  className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${sortBy === 'featured' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                  Featured
                </button>
                <button 
                  onClick={() => setSortBy('newest')}
                  className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${sortBy === 'newest' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                  Newest
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map(filter => (
                <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all border ${activeFilter === filter ? 'bg-[#22c55e] text-black border-[#22c55e]' : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-6 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
              <input 
                type="text" 
                placeholder="Search designs..." 
                className="bg-white/5 border border-white/10 rounded-full pl-10 pr-6 py-3 text-[10px] uppercase tracking-widest text-white focus:outline-none focus:border-[#22c55e]/50 w-full"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">View:</span>
              <div className="flex bg-white/5 rounded-full p-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden hover:border-[#22c55e]/30 transition-all"
              >
                {/* Image Container */}
                <div 
                  className="aspect-[4/3] overflow-hidden relative cursor-pointer"
                  onClick={() => handleViewDetail(item)}
                >
                  <img 
                    src={item.image} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt={item.title} 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Hover Actions */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-500">
                    <button 
                      onClick={(e) => { e.stopPropagation(); /* handleLike(item) */ }}
                      className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-[#22c55e] hover:text-black transition-all"
                    >
                      <Heart size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleShare(item); }}
                      className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUseLook(item); }}
                      className="w-full py-3 bg-white text-black rounded-xl text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-all"
                    >
                      Use This Look <Sparkles size={12} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight mb-3 group-hover:text-[#22c55e] transition-colors line-clamp-1">{item.title}</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[7px] font-bold text-white/40">
                          {item.author.charAt(0)}
                        </div>
                        <span className="text-white/40 text-[9px] uppercase tracking-widest font-bold">
                          {item.author}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[7px] uppercase tracking-[0.2em] text-white/20 font-bold">
                        {item.roomType}
                      </span>
                      <span className="text-[8px] uppercase tracking-[0.2em] text-[#22c55e] font-bold">
                        {item.projectType}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <button 
                      onClick={() => handleViewProduct(item.product)}
                      className="flex items-center gap-3 group/prod text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative shadow-lg">
                        <img src={item.image} className="w-full h-full object-cover opacity-30 group-hover/prod:opacity-100 transition-opacity" alt="Product" />
                        <div className="absolute inset-0 bg-[#22c55e]/80 opacity-0 group-hover/prod:opacity-100 transition-opacity flex items-center justify-center">
                          <ArrowUpRight size={12} className="text-black" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[7px] uppercase tracking-widest text-white/20 font-bold">Material</span>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-white/60 group-hover/prod:text-[#22c55e] transition-colors">
                          {item.product}
                        </span>
                      </div>
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end text-white/20 text-[8px] uppercase tracking-widest font-bold gap-1">
                        <span className="flex items-center gap-1.5"><Heart size={10} className="text-[#22c55e]/50" /> {item.likes}</span>
                        <span className="flex items-center gap-1.5"><Eye size={10} /> {item.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Load More */}
        <div className="mt-20 flex justify-center">
          <button className="px-12 py-5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white hover:border-white/30 transition-all">
            Load More Designs
          </button>
        </div>
      </main>

      {/* Design Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedDesignForDetail && (
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
                <h3>{selectedDesignForDetail.title} | Design by {selectedDesignForDetail.author}</h3>
                <p>Explore this community design featuring {selectedDesignForDetail.product} from Brick Tile Shop.</p>
              </div>

              <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
                {/* Visual Area */}
                <div className="flex-1 bg-neutral-900 relative overflow-hidden group">
                  <img 
                    src={selectedDesignForDetail.image} 
                    className="w-full h-full object-cover"
                    alt={selectedDesignForDetail.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Image Badges */}
                  <div className="absolute top-8 left-8 flex flex-col gap-3">
                    <div className="px-5 py-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold text-white flex items-center gap-3">
                      <Sparkles size={12} className="text-[#22c55e]" />
                      Community Design
                    </div>
                    <div className="px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold text-white/60">
                      {selectedDesignForDetail.roomType} • {selectedDesignForDetail.projectType}
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
                    <span>Community</span>
                    <ChevronRight size={8} />
                    <span className="text-white/60">{selectedDesignForDetail.roomType}</span>
                  </nav>

                  <div className="mb-10">
                    <h2 className="text-4xl font-['Anton'] tracking-tighter uppercase leading-none mb-6">
                      {selectedDesignForDetail.title}
                    </h2>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/40">
                        {selectedDesignForDetail.author.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/20 mb-0.5">Designed By</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-white">{selectedDesignForDetail.author}</div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-12">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-1">
                      <div className="text-lg font-bold text-white">{selectedDesignForDetail.likes}</div>
                      <div className="text-[8px] uppercase tracking-widest text-white/20">Community Saves</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-1">
                      <div className="text-lg font-bold text-white">{selectedDesignForDetail.views}</div>
                      <div className="text-[8px] uppercase tracking-widest text-white/20">Total Views</div>
                    </div>
                  </div>

                  {/* Material Context */}
                  <div className="mb-12">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 mb-6">Material Context</h3>
                    <button 
                      onClick={() => handleViewProduct(selectedDesignForDetail.product)}
                      className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group/item hover:border-[#22c55e]/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-800">
                          <img 
                            src={allProducts.find(p => p.name === selectedDesignForDetail.product || p.id === selectedDesignForDetail.product)?.images[0] || 'https://picsum.photos/seed/material/100/100'} 
                            className="w-full h-full object-cover" 
                            alt={selectedDesignForDetail.product} 
                          />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold uppercase tracking-widest text-white group-hover/item:text-[#22c55e] transition-colors">
                            {selectedDesignForDetail.product}
                          </div>
                          <div className="text-[9px] uppercase tracking-widest text-white/20">
                            {selectedDesignForDetail.productCategory}
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight size={16} className="text-white/20 group-hover/item:text-white transition-all group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5" />
                    </button>
                  </div>

                  {/* Primary Actions */}
                  <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
                    <button 
                      onClick={() => handleUseLook(selectedDesignForDetail)}
                      className="w-full py-5 bg-white text-black rounded-2xl text-[11px] uppercase tracking-[0.3em] font-black hover:bg-[#22c55e] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                    >
                      <Sparkles size={16} /> Start From This Look
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setIsQuoteWizardOpen(true)}
                        className="py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all"
                      >
                        <Quote size={14} /> Request Quote
                      </button>
                      <button 
                        onClick={() => { setIsDetailModalOpen(false); handleShare(selectedDesignForDetail); }}
                        className="py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all"
                      >
                        <Share2 size={14} /> Share Design
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
        {isShareModalOpen && selectedDesignForShare && (
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
                    src={selectedDesignForShare.image} 
                    className="w-full h-full object-cover"
                    alt="Share Preview"
                  />
                  <WatermarkOverlay />
                  
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Design Ref</div>
                      <div className="text-xs font-bold text-white uppercase tracking-widest">{selectedDesignForShare.title}</div>
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
                        This version includes a non-destructive watermark and design metadata for public sharing.
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
