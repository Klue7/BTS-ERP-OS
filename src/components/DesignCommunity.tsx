import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Heart, Bookmark, MapPin, Sparkles,
  CheckCircle, BookOpen, ArrowRight, X, Search, Star, Phone, Mail,
  Globe, Clock, HardHat, Building2, Palette, Layout, Users, GraduationCap,
  Layers, Share2, MessageCircle, ExternalLink
} from 'lucide-react';
import { NavigationBar } from './NavigationBar';

// ─── Types ────────────────────────────────────────────────────────────────────
type SectionId = 0 | 1 | 2;

interface CommunityPost {
  id: string;
  type: 'editorial' | 'concept' | 'built';
  title: string;
  description: string;
  mediaUrl: string;
  author: { name: string; role: string };
  category: string;
  location?: string;
  tags: string[];
  date: string;
  stats: { likes: number; saves: number; comments: number };
}

interface KnowledgeArticle {
  id: string;
  type: 'guide' | 'trend' | 'news' | 'tips' | 'blog';
  title: string;
  excerpt: string;
  coverImage: string;
  readTime: string;
  category: string;
  author: string;
  featured: boolean;
  date: string;
}

interface Contractor {
  id: string;
  name: string;
  type: 'builder' | 'architect' | 'interior_designer' | 'landscape';
  region: string;
  city: string;
  specialties: string[];
  rating: number;
  projectCount: number;
  description: string;
  phone?: string;
  email?: string;
  website?: string;
  verified: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const POSTS: CommunityPost[] = [
  { id: 'p1', type: 'editorial', title: 'Minimalist Industrial Loft', description: 'Raw beauty of exposed brick and polished concrete in a modern urban setting. Curated by the BTS Editorial team for maximum atmospheric impact.', mediaUrl: 'https://images.unsplash.com/photo-1536376074432-bf1217709993?w=1200&q=80', author: { name: 'BTS Editorial', role: 'Curator' }, category: 'Residential', tags: ['Industrial', 'Minimalist'], date: '2024-03-20', stats: { likes: 3200, saves: 1240, comments: 45 } },
  { id: 'p2', type: 'concept', title: 'Coastal Retreat Concept', description: 'Customer-generated in the BTS Studio. Light-toned bricks and airy textures for a beachside feel. Designed for a private client in Hermanus.', mediaUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80', author: { name: 'Sarah Jenkins', role: 'Interior Designer' }, category: 'Residential', tags: ['Coastal', 'Light'], date: '2024-03-22', stats: { likes: 1500, saves: 850, comments: 28 } },
  { id: 'p3', type: 'built', title: 'The Urban Office HQ', description: 'Large-scale commercial façade featuring custom architectural bricks. A collaboration with Studio X resulting in this award-nominated structure.', mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80', author: { name: 'Studio X Architects', role: 'Architectural Partner' }, location: 'Cape Town, SA', category: 'Commercial', tags: ['Commercial', 'Office'], date: '2024-03-15', stats: { likes: 5600, saves: 2100, comments: 112 } },
  { id: 'p4', type: 'editorial', title: 'Terracotta Textures', description: 'The warmth of traditional terracotta meets contemporary design. A curated look into our Autumn collection by the BTS editorial team.', mediaUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80', author: { name: 'BTS Editorial', role: 'Curator' }, category: 'Retail', tags: ['Terracotta', 'Warm'], date: '2024-03-25', stats: { likes: 980, saves: 560, comments: 12 } },
  { id: 'p5', type: 'concept', title: 'Modern Farmhouse Kitchen', description: 'Rustic charm with sleek modern finishes. Designed in BTS Studio for a private residence — Antique White Brick as the hero material.', mediaUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80', author: { name: 'Michael Chen', role: 'Customer' }, category: 'Residential', tags: ['Farmhouse', 'Kitchen'], date: '2024-03-26', stats: { likes: 2100, saves: 1100, comments: 34 } },
  { id: 'p6', type: 'built', title: 'Heritage Home Restoration', description: "Preserving history with authentic heritage bricks. A meticulous restoration of a 1920s Victorian home in Johannesburg's heritage district.", mediaUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80', author: { name: 'Heritage Builders', role: 'Restoration Specialist' }, location: 'Johannesburg, SA', category: 'Hospitality', tags: ['Heritage', 'Restoration'], date: '2024-03-10', stats: { likes: 8900, saves: 3400, comments: 245 } },
];

const ARTICLES: KnowledgeArticle[] = [
  { id: 'a1', type: 'trend', title: 'The Resurgence of Terracotta in Modern Commercial Spaces', excerpt: 'How leading architects are utilizing warm, earthy tones to offset cold urban environments and create inviting public spaces.', coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', readTime: '5 min', category: 'Architecture', author: 'BTS Editorial', featured: true, date: '2024-03-26' },
  { id: 'a2', type: 'guide', title: 'Understanding Mortar Joints: A Technical Guide', excerpt: 'From flush to recessed — how different mortar joint profiles completely change the shadow play and aesthetic of your brickwork.', coverImage: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80', readTime: '8 min', category: 'Technical', author: 'Technical Team', featured: false, date: '2024-03-22' },
  { id: 'a3', type: 'news', title: 'Sustainable Firing Practices in 2024', excerpt: 'Brick Tile Shop announces carbon-offset initiatives and lower-emission kiln technologies across our core ranges.', coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', readTime: '3 min', category: 'Sustainability', author: 'BTS Corporate', featured: false, date: '2024-03-18' },
  { id: 'a4', type: 'tips', title: 'Sealing Exterior Cladding: Best Practices', excerpt: 'Protect your investment. Optimal sealing schedules and product recommendations for coastal vs. inland projects.', coverImage: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80', readTime: '6 min', category: 'Maintenance', author: 'Support Team', featured: false, date: '2024-03-15' },
  { id: 'a5', type: 'blog', title: 'The Future of Brick: Digital Craftsmanship', excerpt: 'Exploring the intersection of robotic masonry and traditional bricklaying in next-generation architectural façades.', coverImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', readTime: '7 min', category: 'Innovation', author: 'BTS Studio', featured: false, date: '2024-03-10' },
  { id: 'a6', type: 'guide', title: 'Choosing the Right Bond Pattern', excerpt: 'Stretcher, Flemish, English — a visual guide to selecting the bond pattern that tells the right story for your project.', coverImage: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80', readTime: '5 min', category: 'Design', author: 'BTS Studio', featured: false, date: '2024-03-05' },
];

const CONTRACTORS: Contractor[] = [
  { id: 'c1', name: 'Cape Construct Co.', type: 'builder', region: 'Western Cape', city: 'Cape Town', specialties: ['Residential', 'Cladding', 'Renovations'], rating: 4.9, projectCount: 124, description: 'Premium residential and commercial building specialists with 15+ years of cladding expertise along the Western Cape coastline.', phone: '+27 21 123 4567', email: 'info@capeconstruct.co.za', website: 'capeconstruct.co.za', verified: true },
  { id: 'c2', name: 'Studio X Architects', type: 'architect', region: 'Western Cape', city: 'Cape Town', specialties: ['Commercial', 'Modernist', 'Adaptive Reuse'], rating: 5.0, projectCount: 67, description: 'Award-winning architecture practice focused on contemporary material expression and spatial innovation. Partners with BTS on high-end façade projects.', phone: '+27 21 987 6543', email: 'projects@studiox.co.za', website: 'studiox.co.za', verified: true },
  { id: 'c3', name: 'Joburg Interiors', type: 'interior_designer', region: 'Gauteng', city: 'Johannesburg', specialties: ['Hospitality', 'Residential', 'Feature Walls'], rating: 4.8, projectCount: 89, description: 'Transforming spaces through material excellence. We work closely with BTS products on every residential and hospitality project.', email: 'hello@joburginteriors.co.za', verified: true },
  { id: 'c4', name: 'Durban Build Masters', type: 'builder', region: 'KwaZulu-Natal', city: 'Durban', specialties: ['Coastal', 'Commercial', 'Large Scale'], rating: 4.7, projectCount: 201, description: 'Leading building contractor for the KZN coastal region. Specialised in salt-resistant cladding systems and large-scale commercial construction.', phone: '+27 31 456 7890', email: 'build@durbanmasters.co.za', verified: true },
  { id: 'c5', name: 'Verdant Landscape Design', type: 'landscape', region: 'Gauteng', city: 'Pretoria', specialties: ['Landscape', 'Paving', 'Garden Paths'], rating: 4.6, projectCount: 55, description: 'Creating outdoor spaces that flow seamlessly with architectural language using BTS paving and brick ranges.', phone: '+27 12 345 6789', email: 'design@verdant.co.za', website: 'verdantdesign.co.za', verified: false },
  { id: 'c6', name: 'Ndlovu Architecture', type: 'architect', region: 'KwaZulu-Natal', city: 'Pietermaritzburg', specialties: ['Heritage', 'Residential', 'Community'], rating: 4.9, projectCount: 43, description: 'Celebrating African architectural heritage through contemporary material storytelling and sensitive site response.', email: 'info@ndlovuarch.co.za', verified: true },
  { id: 'c7', name: 'The Design Bureau', type: 'interior_designer', region: 'Western Cape', city: 'Stellenbosch', specialties: ['Boutique', 'Wine Estates', 'Feature Walls'], rating: 4.8, projectCount: 38, description: 'Boutique interior practice creating spaces where materiality meets narrative. Known for signature brick feature walls.', website: 'designbureau.co.za', email: 'studio@designbureau.co.za', verified: true },
  { id: 'c8', name: 'EcoStone Builders', type: 'builder', region: 'Eastern Cape', city: 'Gqeberha', specialties: ['Sustainable', 'Residential', 'Green Build'], rating: 4.5, projectCount: 77, description: 'Sustainable building specialists committed to eco-conscious material selection and low-waste construction practices.', phone: '+27 41 234 5678', verified: false },
];

// ─── Hero volume data ─────────────────────────────────────────────────────────
const VOLUMES = [
  {
    id: 0 as SectionId,
    vol: 'Volume 01',
    label: 'The Showcase',
    headline: ['Design &', 'Build'],
    sub: 'A unified destination for architectural vision, material innovation, and real-world built excellence.',
    accent: '#22c55e',
    stats: [{ val: '1.2k+', label: 'Built Projects' }, { val: '850+', label: 'Concepts' }],
    bgImg: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=80',
  },
  {
    id: 1 as SectionId,
    vol: 'Volume 02',
    label: 'The Journal',
    headline: ['Knowledge', '& Insights'],
    sub: 'Curated technical guides, material trends, and industry reports to elevate architectural discourse.',
    accent: '#C5A059',
    stats: [{ val: '40+', label: 'Articles' }, { val: '12', label: 'Categories' }],
    bgImg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80',
  },
  {
    id: 2 as SectionId,
    vol: 'Volume 03',
    label: 'Build With Experts',
    headline: ['The', 'Directory'],
    sub: 'Verified builders, architects, and interior designers per region — your trusted project partners.',
    accent: '#60a5fa',
    stats: [{ val: '120+', label: 'Listed Experts' }, { val: '9', label: 'Regions' }],
    bgImg: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80',
  },
];

// ─── Type config helpers ──────────────────────────────────────────────────────
const POST_TYPE_CFG = {
  editorial: { label: 'Editorial', color: 'bg-white/10 text-white/60', icon: BookOpen },
  concept: { label: 'Concept', color: 'bg-blue-500/20 text-blue-300', icon: Sparkles },
  built: { label: 'Built', color: 'bg-[#22c55e]/20 text-[#22c55e]', icon: CheckCircle },
};

const ART_TYPE_CFG: Record<KnowledgeArticle['type'], string> = {
  guide: '#C5A059', trend: '#22c55e', news: '#60a5fa', tips: '#e879f9', blog: '#fb923c',
};

const CTYPE_CFG: Record<Contractor['type'], { label: string; Icon: any }> = {
  builder: { label: 'Builder', Icon: HardHat },
  architect: { label: 'Architect', Icon: Building2 },
  interior_designer: { label: 'Interior Designer', Icon: Palette },
  landscape: { label: 'Landscape', Icon: Layout },
};

// ─── Shared: Right-side Detail Drawer ────────────────────────────────────────
function DetailDrawer<T extends { id: string }>({
  item, onClose, children
}: { item: T | null; onClose: () => void; children: (item: T) => React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex justify-end"
        >
          <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 240 }}
            className="relative w-full max-w-2xl h-full bg-[#0a0a0a] border-l border-white/8 overflow-y-auto shadow-[0_0_80px_rgba(0,0,0,0.9)]"
          >
            <div className="sticky top-0 z-10 flex justify-between items-center px-8 py-6 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/30">Detail View</span>
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors group">
                <X size={18} className="text-white/40 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
              </button>
            </div>
            <div className="p-8">
              {children(item)}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Section 1: Community Grid ────────────────────────────────────────────────
function CommunityGrid({ accent }: { accent: string }) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [catFilter, setCatFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CommunityPost | null>(null);
  const [liked, setLiked] = useState(new Set<string>());
  const [saved, setSaved] = useState(new Set<string>());

  const cats = ['All', 'Residential', 'Commercial', 'Hospitality', 'Retail', 'Landscape'];

  const filtered = useMemo(() => POSTS.filter(p => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (catFilter !== 'All' && p.category !== catFilter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [typeFilter, catFilter, search]);

  const toggle = useCallback((set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    set(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-1.5">
          {[['all', 'All Content'], ['editorial', 'Editorial'], ['concept', 'Concepts'], ['built', 'Built Projects']].map(([val, label]) => (
            <button key={val} onClick={() => setTypeFilter(val)}
              className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
              style={{ backgroundColor: typeFilter === val ? accent : 'transparent', color: typeFilter === val ? '#000' : 'rgba(255,255,255,0.3)' }}>
              {label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex gap-1.5 flex-wrap">
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest transition-all border ${catFilter === c ? 'border-white/30 text-white' : 'border-transparent text-white/25 hover:text-white/50'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="ml-auto relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="bg-white/5 border border-white/10 rounded-full pl-8 pr-4 py-2 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-white/25 w-44" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((post, i) => {
          const cfg = POST_TYPE_CFG[post.type];
          const isFirst = i === 0;
          return (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(post)}
              className={`group relative bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-white/15 transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] ${isFirst ? 'sm:col-span-2 lg:col-span-2' : ''}`}
            >
              <div className={`overflow-hidden ${isFirst ? 'aspect-[21/9]' : 'aspect-[4/3]'} relative`}>
                <img src={post.mediaUrl} alt={post.title}
                  className="w-full h-full object-cover opacity-65 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest backdrop-blur-md ${cfg.color}`}>
                    <cfg.icon size={9} /> {cfg.label}
                  </span>
                </div>
                {post.location && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] text-white/50 border border-white/10">
                    <MapPin size={8} />{post.location}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-serif font-light text-white text-lg leading-snug mb-2 group-hover:text-[#22c55e] transition-colors">{post.title}</h3>
                <p className="text-white/35 text-xs leading-relaxed line-clamp-2 mb-4">{post.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                      <Users size={9} className="text-white/40" />
                    </div>
                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{post.author.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={e => { e.stopPropagation(); toggle(setLiked, post.id); }}
                      className="flex items-center gap-1 text-[10px] font-mono text-white/25 hover:text-red-400 transition-colors">
                      <Heart size={11} className={liked.has(post.id) ? 'fill-red-400 text-red-400' : ''} />
                      {post.stats.likes + (liked.has(post.id) ? 1 : 0)}
                    </button>
                    <button onClick={e => { e.stopPropagation(); toggle(setSaved, post.id); }}
                      className="flex items-center gap-1 text-[10px] font-mono text-white/25 hover:text-[#22c55e] transition-colors">
                      <Bookmark size={11} className={saved.has(post.id) ? 'fill-[#22c55e] text-[#22c55e]' : ''} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      {/* Post drawer */}
      <DetailDrawer item={selected} onClose={() => setSelected(null)}>
        {(post) => {
          const cfg = POST_TYPE_CFG[post.type];
          return (
            <div className="space-y-8">
              <div className="aspect-[16/9] rounded-2xl overflow-hidden">
                <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${cfg.color}`}>
                  <cfg.icon size={10} /> {cfg.label}
                </span>
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{post.category}</span>
                {post.location && <span className="flex items-center gap-1 text-[9px] text-white/20 font-mono"><MapPin size={9} />{post.location}</span>}
              </div>
              <h2 className="text-4xl font-serif font-light text-white leading-tight">{post.title}</h2>
              <div className="flex items-center gap-4 py-4 border-y border-white/5">
                <div className="w-10 h-10 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center">
                  <Users size={16} className="text-[#22c55e]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white uppercase tracking-widest">{post.author.name}</p>
                  <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mt-0.5">{post.author.role}</p>
                </div>
              </div>
              <p className="text-white/50 text-base leading-relaxed font-light">{post.description}</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(t => (
                  <span key={t} className="px-3 py-1 bg-white/5 border border-white/8 rounded-full text-[9px] font-mono text-white/40 uppercase tracking-widest">{t}</span>
                ))}
              </div>
              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  onClick={() => toggle(setLiked, post.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${liked.has(post.id) ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white'}`}>
                  <Heart size={14} className={liked.has(post.id) ? 'fill-red-400' : ''} /> {liked.has(post.id) ? 'Liked' : 'Like'}
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: accent, color: '#000' }}>
                  <ExternalLink size={14} /> Explore Case
                </button>
              </div>
            </div>
          );
        }}
      </DetailDrawer>
    </>
  );
}

// ─── Section 2: Knowledge Grid ────────────────────────────────────────────────
function KnowledgeGrid({ accent }: { accent: string }) {
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<KnowledgeArticle | null>(null);

  const typeFilters = ['all', 'guide', 'trend', 'news', 'blog', 'tips'] as const;
  const labels: Record<string, string> = { all: 'All Insights', guide: 'Guides', trend: 'Trends', news: 'News', blog: 'Blog', tips: 'Tips' };

  const filtered = useMemo(() =>
    ARTICLES.filter(a => filter === 'all' || a.type === filter), [filter]);

  const featured = filtered.find(a => a.featured) || filtered[0];
  const rest = filtered.filter(a => a.id !== featured?.id);

  return (
    <>
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {typeFilters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border"
            style={{
              backgroundColor: filter === f ? accent : 'transparent',
              borderColor: filter === f ? accent : 'rgba(255,255,255,0.08)',
              color: filter === f ? '#000' : 'rgba(255,255,255,0.3)',
            }}>
            {labels[f]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Featured */}
        {featured && (
          <motion.article
            key={featured.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelected(featured)}
            className="md:row-span-2 group bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-white/15 transition-all flex flex-col"
          >
            <div className="aspect-[4/3] overflow-hidden relative flex-shrink-0">
              <img src={featured.coverImage} alt={featured.title}
                className="w-full h-full object-cover opacity-65 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-black" style={{ backgroundColor: accent }}>Featured</span>
                <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white/50 text-[9px] font-mono uppercase tracking-widest rounded-full border border-white/10">{featured.category}</span>
              </div>
            </div>
            <div className="p-7 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3 text-[9px] font-mono text-white/25">
                <Clock size={10} />{featured.readTime} read · {featured.date}
              </div>
              <h3 className="font-serif font-light text-white text-2xl leading-snug mb-3 group-hover:text-[#C5A059] transition-colors">{featured.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed flex-1">{featured.excerpt}</p>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <span className="text-[9px] font-mono text-white/25">{featured.author}</span>
                <span className="flex items-center gap-1.5 text-[9px] text-[#C5A059] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Read <ArrowRight size={11} /></span>
              </div>
            </div>
          </motion.article>
        )}
        {/* Grid list */}
        {rest.map((art, i) => (
          <motion.article key={art.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            onClick={() => setSelected(art)}
            className="group bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-white/15 transition-all flex flex-row h-32">
            <div className="w-32 flex-shrink-0 overflow-hidden">
              <img src={art.coverImage} alt={art.title} className="w-full h-full object-cover opacity-65 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700" />
            </div>
            <div className="flex flex-col justify-center p-5 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ART_TYPE_CFG[art.type] }} />
                <span className="text-[8px] font-mono text-white/25 uppercase tracking-widest">{art.type} · {art.readTime}</span>
              </div>
              <h4 className="text-sm font-light text-white leading-snug group-hover:text-[#C5A059] transition-colors line-clamp-2">{art.title}</h4>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Article drawer */}
      <DetailDrawer item={selected} onClose={() => setSelected(null)}>
        {(art) => (
          <div className="space-y-8">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden">
              <img src={art.coverImage} alt={art.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ART_TYPE_CFG[art.type] }} />
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{art.type} · {art.category}</span>
              <span className="text-[9px] font-mono text-white/20">{art.readTime} read</span>
            </div>
            <h2 className="text-4xl font-serif font-light text-white leading-tight">{art.title}</h2>
            <div className="flex items-center gap-3 py-4 border-y border-white/5">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <Users size={13} className="text-white/30" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white uppercase tracking-widest">{art.author}</p>
                <p className="text-[9px] font-mono text-white/25 mt-0.5">{art.date}</p>
              </div>
            </div>
            <p className="text-white/50 text-base leading-relaxed font-light">{art.excerpt}</p>
            <button className="w-full py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02]" style={{ backgroundColor: accent, color: '#000' }}>
              Read Full Article
            </button>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}

// ─── Section 3: Directory Grid ────────────────────────────────────────────────
function DirectoryGrid({ accent }: { accent: string }) {
  const [regionFilter, setRegionFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Contractor | null>(null);

  const regions = ['All', 'Western Cape', 'Gauteng', 'KwaZulu-Natal', 'Eastern Cape'];
  const types = [['all', 'All Types', Users], ['builder', 'Builders', HardHat], ['architect', 'Architects', Building2], ['interior_designer', 'Interiors', Palette], ['landscape', 'Landscape', Layout]] as const;

  const filtered = useMemo(() => CONTRACTORS.filter(c => {
    if (regionFilter !== 'All' && c.region !== regionFilter) return false;
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.city.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [regionFilter, typeFilter, search]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-1.5 flex-wrap">
          {types.map(([val, label, Icon]) => (
            <button key={val} onClick={() => setTypeFilter(val)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
              style={{ backgroundColor: typeFilter === val ? accent : 'transparent', color: typeFilter === val ? '#000' : 'rgba(255,255,255,0.3)' }}>
              <Icon size={11} />{label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex gap-1.5 flex-wrap">
          {regions.map(r => (
            <button key={r} onClick={() => setRegionFilter(r)}
              className={`px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest transition-all border ${regionFilter === r ? 'border-white/30 text-white' : 'border-transparent text-white/25 hover:text-white/50'}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="ml-auto relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or city…"
            className="bg-white/5 border border-white/10 rounded-full pl-8 pr-4 py-2 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-white/25 w-44" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c, i) => {
          const { label: typeLabel, Icon } = CTYPE_CFG[c.type];
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(c)}
              className="group bg-[#0c0c0c] border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-white/15 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center">
                    <Icon size={20} className="text-white/25" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white group-hover:text-[#60a5fa] transition-colors">{c.name}</h3>
                      {c.verified && <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" title="Verified" />}
                    </div>
                    <p className="text-[9px] font-mono text-white/25 mt-0.5 uppercase tracking-widest">{typeLabel} · {c.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-400 mb-0.5">
                    <Star size={10} className="fill-amber-400" />
                    <span className="text-[10px] font-mono">{c.rating}</span>
                  </div>
                  <span className="text-[8px] text-white/20 font-mono">{c.projectCount} proj.</span>
                </div>
              </div>
              <p className="text-white/35 text-xs leading-relaxed line-clamp-2 mb-3">{c.description}</p>
              <div className="flex flex-wrap gap-1">
                {c.specialties.slice(0, 3).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-white/5 text-white/25 text-[8px] font-mono uppercase tracking-widest rounded">{s}</span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Contractor drawer */}
      <DetailDrawer item={selected} onClose={() => setSelected(null)}>
        {(c) => {
          const { label: typeLabel, Icon } = CTYPE_CFG[c.type];
          return (
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
                  <Icon size={36} className="text-white/20" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-light text-white">{c.name}</h2>
                    {c.verified && <span className="px-2.5 py-1 bg-[#22c55e]/10 text-[#22c55e] text-[8px] font-bold uppercase tracking-widest rounded-full border border-[#22c55e]/20">Verified</span>}
                  </div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{typeLabel} · {c.city}, {c.region}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="text-sm font-mono text-white">{c.rating}</span>
                    <span className="text-white/20 text-xs">—</span>
                    <span className="text-white/30 text-xs">{c.projectCount} projects</span>
                  </div>
                </div>
              </div>
              <p className="text-white/50 text-base leading-relaxed font-light">{c.description}</p>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/20 mb-3">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {c.specialties.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-white/5 border border-white/8 text-white/45 text-[10px] font-mono uppercase tracking-widest rounded-lg">{s}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 p-6 space-y-4">
                <p className="text-[9px] uppercase tracking-widest text-white/20 mb-2">Get in Touch</p>
                {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors"><Phone size={15} className="text-white/20" /> {c.phone}</a>}
                {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors"><Mail size={15} className="text-white/20" /> {c.email}</a>}
                {c.website && <a href={`https://${c.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors"><Globe size={15} className="text-white/20" /> {c.website}</a>}
              </div>
              <button className="w-full py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02]" style={{ backgroundColor: accent, color: '#000' }}>
                Request Collaboration
              </button>
            </div>
          );
        }}
      </DetailDrawer>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function DesignCommunity() {
  const [activeIdx, setActiveIdx] = useState<SectionId>(0);
  const vol = VOLUMES[activeIdx];

  const nav = (dir: 1 | -1) => {
    setActiveIdx(prev => Math.max(0, Math.min(2, (prev + dir) as SectionId)) as SectionId);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <NavigationBar />

      {/* ── Cinematic Hero ── */}
      <div className="relative h-screen overflow-hidden">
        {/* Background image with parallax feel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img src={vol.bgImg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-[#050505]/50 to-[#050505]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Hero content */}
        <div className="absolute inset-0 flex flex-col justify-end px-8 md:px-20 pb-20 pt-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 max-w-7xl mx-auto w-full">
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`meta-${activeIdx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-[10px] uppercase tracking-[0.35em] mb-3 font-mono" style={{ color: vol.accent }}>
                    {vol.vol} — {vol.label}
                  </p>
                  <h1 className="text-7xl md:text-[7.5rem] font-serif font-light text-white leading-none tracking-tighter">
                    {vol.headline[0]}<br />
                    <span className="italic" style={{ color: `${vol.accent}33` }}>{vol.headline[1]}</span>
                  </h1>
                  <p className="text-white/40 text-sm mt-5 max-w-md leading-relaxed">{vol.sub}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col items-end gap-6">
              {/* Stats */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`stats-${activeIdx}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                  className="flex gap-10"
                >
                  {vol.stats.map(s => (
                    <div key={s.label} className="text-right">
                      <div className="text-[9px] text-white/30 uppercase tracking-widest font-mono mb-1">{s.label}</div>
                      <div className="text-3xl font-mono text-white">{s.val}</div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Arrow carousel nav */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => nav(-1)}
                  disabled={activeIdx === 0}
                  className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                >
                  <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>

                {/* Volume dots */}
                <div className="flex items-center gap-3">
                  {VOLUMES.map((v, i) => (
                    <button key={i} onClick={() => setActiveIdx(i as SectionId)}
                      className="flex flex-col items-center gap-1.5 group">
                      <div className="h-[2px] w-8 rounded-full transition-all duration-500"
                        style={{ backgroundColor: i === activeIdx ? vol.accent : 'rgba(255,255,255,0.15)' }} />
                      <span className="text-[7px] font-mono uppercase tracking-[0.2em] transition-colors duration-300"
                        style={{ color: i === activeIdx ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>
                        Vol.0{i + 1}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => nav(1)}
                  disabled={activeIdx === 2}
                  className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                >
                  <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
            <span className="text-[8px] uppercase tracking-[0.3em] font-mono text-white">Scroll</span>
            <div className="w-px h-8 bg-white/40 animate-pulse" />
          </div>
        </div>
      </div>

      {/* ── Content Section (below hero) ── */}
      <div className="max-w-7xl mx-auto px-8 md:px-16 py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            {activeIdx === 0 && <CommunityGrid accent={vol.accent} />}
            {activeIdx === 1 && <KnowledgeGrid accent={vol.accent} />}
            {activeIdx === 2 && <DirectoryGrid accent={vol.accent} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
