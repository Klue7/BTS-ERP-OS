import React, { createContext, useContext, useState } from 'react';

interface Design {
  id: string;
  name: string;
  roomType: string;
  notes: string;
  isPublic: boolean;
  communityVisibility: 'public' | 'private' | 'unlisted';
  publicSlug?: string;
  sourceModule: 'studio' | 'projects' | 'marketing';
  isQuoteRequested: boolean;
  status: 'draft' | 'submitted' | 'published' | 'archived' | 'quote-requested';
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged' | 'none';
  createdAt: string;
  publishedAt?: string;
  isFeatured?: boolean;
  metrics?: {
    views: number;
    saves: number;
    shares: number;
  };
  author?: {
    name: string;
    id: string;
  };
  settings: {
    grout: string;
    layout: string;
    lighting: string;
    product: any;
    applicationMode: string;
    scale: number;
    blend: number;
    intensity: number;
    baseImage?: string;
    renderUrl?: string; // Managed derivative for public view
    shareUrl?: string; // Watermarked variant
  };
}

interface Project {
  id: string;
  title: string;
  projectType: string;
  location?: string;
  description: string;
  images: {
    original: string;
    publishVariant: string;
    shareVariant: string;
  };
  products: string[]; // Linked product IDs
  attribution?: {
    architect?: string;
    designer?: string;
    decorator?: string;
  };
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'featured' | 'archived';
  isPublic: boolean;
  communityVisibility: 'public' | 'private' | 'unlisted';
  publicSlug?: string;
  sourceModule: 'studio' | 'projects' | 'marketing';
  createdAt: string;
  publishedAt?: string;
  metrics?: {
    views: number;
    saves: number;
    shares: number;
  };
}

export interface CartItem {
  id: string;
  name: string;
  category: 'cladding-tiles' | 'bricks' | 'paving' | 'breeze-blocks';
  rawQty: number;
  uomQty: number;
  pricePerUnit: number;
  image: string;
  color: string;
}

interface VisualLabState {
  activeGrout: string;
  setActiveGrout: (id: string) => void;
  activeLayout: string;
  setActiveLayout: (id: string) => void;
  activeLighting: string;
  setActiveLighting: (id: string) => void;
  currentSection: string;
  setCurrentSection: (section: string) => void;
  isCustomizeMode: boolean;
  setIsCustomizeMode: (mode: boolean) => void;
  activeCategory: 'cladding-tiles' | 'bricks' | 'paving' | 'breeze-blocks';
  setActiveCategory: (category: 'cladding-tiles' | 'bricks' | 'paving' | 'breeze-blocks') => void;
  selectedCatalogItem: any | null;
  setSelectedCatalogItem: (item: any | null) => void;
  isQuoteWizardOpen: boolean;
  setIsQuoteWizardOpen: (open: boolean) => void;
  isProductDetailsOpen: boolean;
  setIsProductDetailsOpen: (open: boolean) => void;
  isDeliveryWizardOpen: boolean;
  setIsDeliveryWizardOpen: (open: boolean) => void;
  quoteQuantity: number;
  setQuoteQuantity: (qty: number) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  isLoginPageOpen: boolean;
  setIsLoginPageOpen: (open: boolean) => void;
  userRole: 'customer' | 'employee' | null;
  setUserRole: (role: 'customer' | 'employee' | null) => void;
  isViewingPortal: boolean;
  setIsViewingPortal: (viewing: boolean) => void;

  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  isCartWizardOpen: boolean;
  setIsCartWizardOpen: (open: boolean) => void;

  isEstimating: boolean;
  setIsEstimating: (estimating: boolean) => void;
  designs: Design[];
  addDesign: (design: Design) => void;
  updateDesign: (id: string, updates: Partial<Design>) => void;
  deleteDesign: (id: string) => void;
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  orders: any[];
  quotes: any[];
  btsCoins: number;
  setBtsCoins: React.Dispatch<React.SetStateAction<number>>;
}

const VisualLabContext = createContext<VisualLabState | undefined>(undefined);

export function VisualLabProvider({ children }: { children: React.ReactNode }) {
  const [activeGrout, setActiveGrout] = useState('light');
  const [activeLayout, setActiveLayout] = useState('stretcher');
  const [activeLighting, setActiveLighting] = useState('daylight');
  const [currentSection, setCurrentSection] = useState('hero');
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'cladding-tiles' | 'bricks' | 'paving' | 'breeze-blocks'>('cladding-tiles');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any | null>(null);
  const [isQuoteWizardOpen, setIsQuoteWizardOpen] = useState(false);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [isDeliveryWizardOpen, setIsDeliveryWizardOpen] = useState(false);
  const [quoteQuantity, setQuoteQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartWizardOpen, setIsCartWizardOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginPageOpen, setIsLoginPageOpen] = useState(false);
  const [userRole, setUserRole] = useState<'customer' | 'employee' | null>(null);
  const [isViewingPortal, setIsViewingPortal] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [btsCoins, setBtsCoins] = useState(0);
  const [designs, setDesigns] = useState<Design[]>([
      {
        id: 'd1',
        name: 'Modern Loft Kitchen',
        roomType: 'Interior',
        notes: 'Industrial feel with exposed brick.',
        isPublic: true,
        communityVisibility: 'public',
        publicSlug: 'modern-loft-kitchen-d1',
        sourceModule: 'studio',
        isQuoteRequested: false,
        status: 'published',
        moderationStatus: 'approved',
        isFeatured: true,
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        metrics: { views: 1240, saves: 45, shares: 12 },
        author: { name: 'Alex Rivera', id: 'u1' },
        settings: {
          grout: 'dark',
          layout: 'stretcher',
          lighting: 'daylight',
          product: { id: 'p1', name: 'Carbon Black' },
          applicationMode: 'full',
          scale: 1,
          blend: 0.8,
          intensity: 1,
          baseImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop',
          renderUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop',
          shareUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop'
        }
      },
      {
        id: 'd2',
        name: 'Coastal Patio Concept',
        roomType: 'Exterior',
        notes: 'Light and airy for a beach house.',
        isPublic: true,
        communityVisibility: 'public',
        publicSlug: 'coastal-patio-concept-d2',
        sourceModule: 'studio',
        isQuoteRequested: true,
        status: 'submitted',
        moderationStatus: 'pending',
        createdAt: new Date().toISOString(),
        author: { name: 'Sarah Jenkins', id: 'u2' },
        settings: {
          grout: 'light',
          layout: 'herringbone',
          lighting: 'golden-hour',
          product: { id: 'p2', name: 'Sandstone Beige' },
          applicationMode: 'accent',
          scale: 1.2,
          blend: 0.7,
          intensity: 0.9,
          baseImage: 'https://images.unsplash.com/photo-1517231426071-2940212f3bc3?q=80&w=1200&auto=format&fit=crop',
          renderUrl: 'https://images.unsplash.com/photo-1517231426071-2940212f3bc3?q=80&w=1200&auto=format&fit=crop',
          shareUrl: 'https://images.unsplash.com/photo-1517231426071-2940212f3bc3?q=80&w=1200&auto=format&fit=crop'
        }
      }
  ]);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'pr1',
      title: 'The Glass House Residence',
      projectType: 'Residential',
      location: 'Melbourne, AU',
      description: 'A stunning contemporary home featuring extensive use of BTS Serengeti Brick Tiles for the main facade and interior feature walls. The rich red-clay finish provides a warm, earthen register that complements the glass and steel structure.',
      images: {
        original: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1600&auto=format&fit=crop',
        publishVariant: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop',
        shareVariant: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop'
      },
      products: ['serengeti'],
      attribution: { architect: 'Studio Linear', designer: 'Marcus Thorne' },
      status: 'featured',
      isPublic: true,
      communityVisibility: 'public',
      publicSlug: 'the-glass-house-residence-pr1',
      sourceModule: 'projects',
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      metrics: { views: 3420, saves: 128, shares: 56 }
    },
    {
      id: 'pr2',
      title: 'Urban Office HQ',
      projectType: 'Commercial',
      location: 'London, UK',
      description: 'Industrial-style office renovation using Zambezi Brown tiles to create a warm, professional atmosphere. The granular finish captures the essence of traditional masonry while maintaining a modern profile.',
      images: {
        original: 'https://images.unsplash.com/photo-1517231426071-2940212f3bc3?q=80&w=1600&auto=format&fit=crop',
        publishVariant: 'https://images.unsplash.com/photo-1517231426071-2940212f3bc3?q=80&w=1200&auto=format&fit=crop',
        shareVariant: 'https://images.unsplash.com/photo-1517231426071-2940212f3bc3?q=80&w=800&auto=format&fit=crop'
      },
      products: ['zambezi-brown'],
      attribution: { designer: 'Elena Rossi' },
      status: 'approved',
      isPublic: true,
      communityVisibility: 'public',
      publicSlug: 'urban-office-hq-pr2',
      sourceModule: 'projects',
      createdAt: new Date().toISOString()
    },
    {
      id: 'pr3',
      title: 'The Pavilion Hotel',
      projectType: 'Hospitality',
      location: 'Cape Town, SA',
      description: 'A luxury boutique hotel featuring Serengeti Bricks for its structural masonry. The full-depth bricks provide a sense of permanence and heritage to the new wing.',
      images: {
        original: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1600&auto=format&fit=crop',
        publishVariant: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop',
        shareVariant: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop'
      },
      products: ['serengeti-brick'],
      attribution: { architect: 'OVD Architects', designer: 'Julian Venter' },
      status: 'approved',
      isPublic: true,
      communityVisibility: 'public',
      publicSlug: 'the-pavilion-hotel-pr3',
      sourceModule: 'projects',
      createdAt: new Date().toISOString()
    },
    {
      id: 'pr4',
      title: 'Civic Plaza Library',
      projectType: 'Public Space',
      location: 'Berlin, DE',
      description: 'A public library project utilizing Kalahari Brick Tiles for its interior feature walls, creating a calm and focused environment with desert-sand tones.',
      images: {
        original: 'https://images.unsplash.com/photo-1590069230002-70cc884999f1?q=80&w=1600&auto=format&fit=crop',
        publishVariant: 'https://images.unsplash.com/photo-1590069230002-70cc884999f1?q=80&w=1200&auto=format&fit=crop',
        shareVariant: 'https://images.unsplash.com/photo-1590069230002-70cc884999f1?q=80&w=800&auto=format&fit=crop'
      },
      products: ['kalahari'],
      attribution: { architect: 'Bauhaus Modern' },
      status: 'approved',
      isPublic: true,
      communityVisibility: 'public',
      publicSlug: 'civic-plaza-library-pr4',
      sourceModule: 'projects',
      createdAt: new Date().toISOString()
    }
  ]);

  const [orders] = useState([
    { id: 'ORD-7291', date: 'Mar 12, 2026', status: 'In Production', total: '$4,250.00', items: 2, tracking: 'BTS-TRK-9921' },
    { id: 'ORD-6102', date: 'Feb 28, 2026', status: 'Delivered', total: '$1,820.00', items: 1, tracking: 'BTS-TRK-8810' },
  ]);

  const [quotes] = useState([
    { id: 'QTE-4412', date: 'Mar 25, 2026', status: 'Pending Review', total: '$3,100.00', items: 3 },
    { id: 'QTE-3391', date: 'Mar 18, 2026', status: 'Expired', total: '$1,200.00', items: 1 },
  ]);

  const addDesign = (design: Design) => setDesigns(prev => [design, ...prev]);
  const updateDesign = (id: string, updates: Partial<Design>) => 
    setDesigns(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  const deleteDesign = (id: string) => 
    setDesigns(prev => prev.filter(d => d.id !== id));

  const addProject = (project: Project) => setProjects(prev => [project, ...prev]);
  const updateProject = (id: string, updates: Partial<Project>) => 
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  const deleteProject = (id: string) => 
    setProjects(prev => prev.filter(p => p.id !== id));

  return (
    <VisualLabContext.Provider value={{
      activeGrout, setActiveGrout,
      activeLayout, setActiveLayout,
      activeLighting, setActiveLighting,
      currentSection, setCurrentSection,
      isCustomizeMode, setIsCustomizeMode,
      activeCategory, setActiveCategory,
      selectedCatalogItem, setSelectedCatalogItem,
      isQuoteWizardOpen, setIsQuoteWizardOpen,
      isProductDetailsOpen, setIsProductDetailsOpen,
      isDeliveryWizardOpen, setIsDeliveryWizardOpen,
      quoteQuantity, setQuoteQuantity,
      isLoggedIn, setIsLoggedIn,
      isLoginPageOpen, setIsLoginPageOpen,
      userRole, setUserRole,
      isViewingPortal, setIsViewingPortal,
      cart, setCart,
      isCartWizardOpen, setIsCartWizardOpen,
      isEstimating, setIsEstimating,
      designs, addDesign, updateDesign, deleteDesign,
      projects, addProject, updateProject, deleteProject,
      orders, quotes,
      btsCoins, setBtsCoins
    }}>
      {children}
    </VisualLabContext.Provider>
  );
}

export function useVisualLab() {
  const context = useContext(VisualLabContext);
  if (!context) {
    throw new Error('useVisualLab must be used within a VisualLabProvider');
  }
  return context;
}

export function useTheme() {
  const { activeCategory } = useVisualLab();
  
  if (activeCategory === 'bricks') {
    return {
      primaryColor: '#eab308',
      textClass: 'text-[#eab308]',
      bgClass: 'bg-[#eab308]',
      borderClass: 'border-[#eab308]',
      hoverTextClass: 'hover:text-[#eab308]',
      hoverBorderClass: 'hover:border-[#eab308]',
      hoverBgClass: 'hover:bg-[#eab308]',
    };
  }
  
  if (activeCategory === 'paving') {
    return {
      primaryColor: '#14b8a6', // Teal 500
      textClass: 'text-[#14b8a6]',
      bgClass: 'bg-[#14b8a6]',
      borderClass: 'border-[#14b8a6]',
      hoverTextClass: 'hover:text-[#14b8a6]',
      hoverBorderClass: 'hover:border-[#14b8a6]',
      hoverBgClass: 'hover:bg-[#14b8a6]',
    };
  }
  
  if (activeCategory === 'breeze-blocks') {
    return {
      primaryColor: '#ef4444', // Red 500
      textClass: 'text-[#ef4444]',
      bgClass: 'bg-[#ef4444]',
      borderClass: 'border-[#ef4444]',
      hoverTextClass: 'hover:text-[#ef4444]',
      hoverBorderClass: 'hover:border-[#ef4444]',
      hoverBgClass: 'hover:bg-[#ef4444]',
    };
  }

  // Default to cladding-tiles
  return {
    primaryColor: '#22c55e', // Green 500
    textClass: 'text-[#22c55e]',
    bgClass: 'bg-[#22c55e]',
    borderClass: 'border-[#22c55e]',
    hoverTextClass: 'hover:text-[#22c55e]',
    hoverBorderClass: 'hover:border-[#22c55e]',
    hoverBgClass: 'hover:bg-[#22c55e]',
  };
}
