import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Heart, Bookmark, MapPin, Sparkles,
  CheckCircle, BookOpen, ArrowRight, X, Search, Star, Phone, Mail,
  Globe, Clock, HardHat, Building2, Palette, Layout, Users, GraduationCap,
  Layers, Share2, MessageCircle, ExternalLink
} from 'lucide-react';
import { NavigationBar } from './NavigationBar';
import { useNavigate, useParams } from 'react-router-dom';
import {
  COMMUNITY_CONTRACTORS as CONTRACTORS,
  COMMUNITY_POSTS as POSTS,
  KNOWLEDGE_ARTICLES as ARTICLES,
  type CommunityPost,
  type Contractor,
  type KnowledgeArticle,
} from '../community/publicCommunityContent';
import { usePublishedMarketingContent } from '../community/usePublishedMarketingContent';

// ─── Types ────────────────────────────────────────────────────────────────────
type SectionId = 0 | 1 | 2;

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

const COMMUNITY_LIKES_STORAGE_KEY = 'bts-community-liked-posts';

function readLikedCommunityPosts() {
  if (typeof window === 'undefined') return new Set<string>();

  try {
    const raw = window.localStorage.getItem(COMMUNITY_LIKES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set<string>();
  }
}

function formatEngagementCount(value: number) {
  return new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(value);
}

function getWhatsAppHref(contractor: Contractor) {
  const phoneDigits = contractor.phone?.replace(/[^\d]/g, '');
  if (!phoneDigits) return null;

  const normalized = phoneDigits.startsWith('0')
    ? `27${phoneDigits.slice(1)}`
    : phoneDigits;
  const text = encodeURIComponent(`Hi ${contractor.name}, I found your profile on Brick Tile Shop and would like to discuss a project.`);
  return `https://wa.me/${normalized}?text=${text}`;
}

function useCommunityPostLikes() {
  const [liked, setLiked] = useState<Set<string>>(() => readLikedCommunityPosts());

  const togglePostLike = useCallback((id: string) => {
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const isPostLiked = useCallback((id: string) => liked.has(id), [liked]);
  const getPostLikeCount = useCallback((post: CommunityPost) => post.stats.likes + (liked.has(post.id) ? 1 : 0), [liked]);

  useEffect(() => {
    window.localStorage.setItem(COMMUNITY_LIKES_STORAGE_KEY, JSON.stringify(Array.from(liked)));
  }, [liked]);

  return { getPostLikeCount, isPostLiked, togglePostLike };
}

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

function DirectoryQuickActions({
  contractor,
  onMessage,
}: {
  contractor: Contractor;
  onMessage: (contractor: Contractor) => void;
}) {
  const whatsappHref = getWhatsAppHref(contractor);
  const buttonClass = 'flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/30 transition-all hover:border-[#60a5fa]/30 hover:bg-[#60a5fa]/10 hover:text-white';

  return (
    <div className="flex flex-wrap gap-2">
      {contractor.phone ? (
        <a
          href={`tel:${contractor.phone}`}
          onClick={(event) => event.stopPropagation()}
          className={buttonClass}
          aria-label={`Call ${contractor.name}`}
          title={`Call ${contractor.name}`}
        >
          <Phone size={14} />
        </a>
      ) : null}
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className={buttonClass}
          aria-label={`WhatsApp ${contractor.name}`}
          title={`WhatsApp ${contractor.name}`}
        >
          <MessageCircle size={14} />
        </a>
      ) : null}
      {contractor.email ? (
        <a
          href={`mailto:${contractor.email}?subject=${encodeURIComponent(`Project enquiry via Brick Tile Shop`)}`}
          onClick={(event) => event.stopPropagation()}
          className={buttonClass}
          aria-label={`Email ${contractor.name}`}
          title={`Email ${contractor.name}`}
        >
          <Mail size={14} />
        </a>
      ) : null}
      {contractor.verified ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onMessage(contractor);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/10 text-[#7dffc1] transition-all hover:bg-[#22c55e] hover:text-black"
          aria-label={`Message ${contractor.name} in app`}
          title={`Message ${contractor.name} in app`}
        >
          <MessageCircle size={14} />
        </button>
      ) : null}
    </div>
  );
}

function DirectoryMessageModal({
  contractor,
  onClose,
}: {
  contractor: Contractor | null;
  onClose: () => void;
}) {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (!contractor) {
      setSenderName('');
      setSenderEmail('');
      setMessage('');
      setIsSent(false);
      return;
    }

    setMessage(`Hi ${contractor.name}, I found your profile on Brick Tile Shop and would like to discuss a project.`);
  }, [contractor]);

  return (
    <AnimatePresence>
      {contractor ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[240] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ y: 20, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.96, opacity: 0 }}
            className="w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-[#080808] shadow-[0_50px_140px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-start justify-between gap-5 border-b border-white/10 bg-white/[0.03] p-7">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#22c55e]">In-app profile message</p>
                <h3 className="mt-3 font-serif text-3xl leading-tight text-white">{contractor.name}</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/35">{contractor.city} · {contractor.region}</p>
              </div>
              <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-3 text-white/45 transition-all hover:bg-white/10 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {isSent ? (
              <div className="space-y-5 p-7 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#22c55e]/20 bg-[#22c55e]/10">
                  <CheckCircle size={24} className="text-[#22c55e]" />
                </div>
                <h4 className="font-serif text-2xl text-white">Message prepared</h4>
                <p className="mx-auto max-w-md text-sm leading-7 text-white/45">
                  This verified profile message has been captured in the app flow. When member messaging is connected to CRM/comms, this same action can create a real conversation thread.
                </p>
                <button type="button" onClick={onClose} className="w-full rounded-2xl bg-[#22c55e] px-5 py-4 text-[10px] font-black uppercase tracking-[0.32em] text-black transition-all hover:bg-[#7dffc1]">
                  Close
                </button>
              </div>
            ) : (
              <form
                className="space-y-5 p-7"
                onSubmit={(event) => {
                  event.preventDefault();
                  setIsSent(true);
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.26em] text-white/35">Your name</span>
                    <input value={senderName} onChange={(event) => setSenderName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#22c55e]/50" placeholder="Name" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.26em] text-white/35">Email</span>
                    <input value={senderEmail} onChange={(event) => setSenderEmail(event.target.value)} type="email" className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#22c55e]/50" placeholder="name@example.com" />
                  </label>
                </div>
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.26em] text-white/35">Message</span>
                  <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} className="custom-scrollbar w-full resize-none rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm leading-7 text-white outline-none transition-colors focus:border-[#22c55e]/50" />
                </label>
                <button type="submit" className="w-full rounded-2xl bg-[#22c55e] px-5 py-4 text-[10px] font-black uppercase tracking-[0.32em] text-black transition-all hover:bg-[#7dffc1]">
                  Send App Message
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CommunityCaseArticle({
  post,
  accent,
  liked,
  likeCount,
  onToggleLike,
}: {
  post: CommunityPost;
  accent: string;
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
}) {
  const cfg = POST_TYPE_CFG[post.type];
  const projectTone = post.type === 'built' ? 'Built case study' : post.type === 'concept' ? 'Concept case study' : 'Editorial case note';

  return (
    <div className="space-y-8">
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl">
        <img src={post.mediaUrl} alt={post.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest ${cfg.color}`}>
            <cfg.icon size={10} /> {projectTone}
          </span>
          <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-white/45">
            {post.category}
          </span>
        </div>
      </div>

      <div>
        <p className="mb-4 text-[9px] font-mono uppercase tracking-[0.38em]" style={{ color: accent }}>
          Community case / {post.date}
        </p>
        <h2 className="font-serif text-5xl leading-tight text-white">{post.title}</h2>
        <p className="mt-5 text-base font-light leading-8 text-white/50">{post.description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Likes', formatEngagementCount(likeCount)],
          ['Saves', formatEngagementCount(post.stats.saves)],
          ['Comments', formatEngagementCount(post.stats.comments)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
            <div className="font-mono text-2xl text-white">{value}</div>
            <div className="mt-1 text-[8px] font-black uppercase tracking-[0.28em] text-white/30">{label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#22c55e]/20 bg-[#22c55e]/10">
            <Users size={16} className="text-[#22c55e]" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white">{post.author.name}</p>
            <p className="mt-0.5 text-[9px] font-mono uppercase tracking-widest text-white/30">{post.author.role}</p>
          </div>
        </div>
        <div className="grid gap-5 text-sm leading-7 text-white/45 md:grid-cols-2">
          <p>
            This case is linked to {post.relatedCategoryKeys.map((key) => key.replace(/-/g, ' ')).join(', ')} and is used as a design reference for customers comparing product tone, texture, layout, and project fit.
          </p>
          <p>
            Tags and product cues help the BTS team connect this story to relevant catalog journeys, marketing assets, customer inspiration, and future member-led design submissions.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[9px] uppercase tracking-widest text-white/20">Material and design tags</p>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-white/40">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row">
        <button
          type="button"
          onClick={onToggleLike}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
            liked
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white'
          }`}
        >
          <Heart size={14} className={liked ? 'fill-red-400' : ''} />
          {liked ? 'Liked' : 'Like'} · {formatEngagementCount(likeCount)}
        </button>
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-all hover:border-white/20 hover:text-white"
        >
          <Share2 size={14} /> Share Case
        </button>
      </div>
    </div>
  );
}

function KnowledgeArticleReader({ article, accent }: { article: KnowledgeArticle; accent: string }) {
  return (
    <article className="space-y-8">
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl">
        <img src={article.coverImage} alt={article.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black" style={{ backgroundColor: accent }}>
            {article.type}
          </span>
          <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-white/45">
            {article.readTime} read
          </span>
        </div>
      </div>

      <header>
        <p className="mb-4 text-[9px] font-mono uppercase tracking-[0.38em]" style={{ color: accent }}>
          Knowledge & Insights / {article.category}
        </p>
        <h2 className="font-serif text-5xl leading-tight text-white">{article.title}</h2>
        <p className="mt-5 text-lg font-light leading-8 text-white/55">{article.excerpt}</p>
      </header>

      <div className="flex items-center gap-3 border-y border-white/5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5">
          <Users size={14} className="text-white/30" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white">{article.author}</p>
          <p className="mt-0.5 text-[9px] font-mono uppercase tracking-widest text-white/25">{article.date}</p>
        </div>
      </div>

      <div className="space-y-6">
        {article.body.map((paragraph, index) => (
          <p key={index} className="text-base font-light leading-8 text-white/55">
            {paragraph}
          </p>
        ))}
      </div>

      <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <p className="mb-4 text-[9px] font-black uppercase tracking-[0.32em] text-white/30">Key Takeaways</p>
        <div className="space-y-3">
          {article.takeaways.map((takeaway) => (
            <div key={takeaway} className="flex gap-3 rounded-2xl bg-black/30 px-4 py-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
              <span className="text-sm leading-6 text-white/55">{takeaway}</span>
            </div>
          ))}
        </div>
      </aside>

      <div className="space-y-3">
        <p className="text-[9px] uppercase tracking-widest text-white/20">Related product context</p>
        <div className="flex flex-wrap gap-2">
          {[...article.relatedCategoryKeys.map((key) => key.replace(/-/g, ' ')), ...article.relatedProductKeywords].map((tag) => (
            <span key={tag} className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-white/40">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function CommunityNotFoundPage({ label }: { label: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <NavigationBar />
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-8 py-32 text-center">
        <p className="mb-4 text-[10px] font-mono uppercase tracking-[0.4em] text-[#22c55e]">Community</p>
        <h1 className="font-serif text-5xl leading-tight text-white">{label} not found</h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-white/45">
          This community item may have moved or been unpublished. Return to the community hub to keep browsing current posts, articles, and partners.
        </p>
        <button
          type="button"
          onClick={() => navigate('/community')}
          className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/55 transition-all hover:border-[#22c55e]/30 hover:text-white"
        >
          <ChevronLeft size={14} /> Back To Community
        </button>
      </main>
    </div>
  );
}

function CommunityLoadingPage({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <NavigationBar />
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-8 py-32 text-center">
        <p className="mb-4 text-[10px] font-mono uppercase tracking-[0.4em] text-[#22c55e]">Community</p>
        <h1 className="font-serif text-5xl leading-tight text-white">Loading {label}</h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-white/45">
          Checking the public content feed for newly published Marketing Studio records.
        </p>
      </main>
    </div>
  );
}

export function CommunityPostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { getPostLikeCount, isPostLiked, togglePostLike } = useCommunityPostLikes();
  const { communityPosts, isLoading } = usePublishedMarketingContent();
  const post = [...communityPosts, ...POSTS].find((entry) => entry.id === postId);

  if (!post) {
    if (isLoading) {
      return <CommunityLoadingPage label="post" />;
    }
    return <CommunityNotFoundPage label="Post" />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <NavigationBar />
      <main className="relative overflow-hidden px-8 pb-24 pt-32 md:px-16">
        <div className="pointer-events-none absolute right-0 top-0 h-[520px] w-[520px] rounded-full bg-[#22c55e]/10 blur-[180px]" />
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigate('/community')}
            className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/45 transition-all hover:border-[#22c55e]/30 hover:text-white"
          >
            <ChevronLeft size={14} /> Back To Community
          </button>
          <CommunityCaseArticle
            post={post}
            accent="#22c55e"
            liked={isPostLiked(post.id)}
            likeCount={getPostLikeCount(post)}
            onToggleLike={() => togglePostLike(post.id)}
          />
        </div>
      </main>
    </div>
  );
}

export function KnowledgeArticlePage() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { knowledgeArticles, isLoading } = usePublishedMarketingContent();
  const article = [...knowledgeArticles, ...ARTICLES].find((entry) => entry.id === articleId);

  if (!article) {
    if (isLoading) {
      return <CommunityLoadingPage label="article" />;
    }
    return <CommunityNotFoundPage label="Article" />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <NavigationBar />
      <main className="relative overflow-hidden px-8 pb-24 pt-32 md:px-16">
        <div className="pointer-events-none absolute right-0 top-0 h-[520px] w-[520px] rounded-full bg-[#C5A059]/10 blur-[180px]" />
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigate('/community')}
            className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/45 transition-all hover:border-[#C5A059]/30 hover:text-white"
          >
            <ChevronLeft size={14} /> Back To Community
          </button>
          <KnowledgeArticleReader article={article} accent="#C5A059" />
        </div>
      </main>
    </div>
  );
}

// ─── Section 1: Community Grid ────────────────────────────────────────────────
function CommunityGrid({ accent, posts }: { accent: string; posts: CommunityPost[] }) {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [catFilter, setCatFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CommunityPost | null>(null);
  const [saved, setSaved] = useState(new Set<string>());
  const { getPostLikeCount, isPostLiked, togglePostLike } = useCommunityPostLikes();

  const cats = ['All', 'Residential', 'Commercial', 'Hospitality', 'Retail', 'Landscape'];

  const filtered = useMemo(() => posts.filter(p => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (catFilter !== 'All' && p.category !== catFilter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [typeFilter, catFilter, search, posts]);

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
          const isLiked = isPostLiked(post.id);
          const likeCount = getPostLikeCount(post);
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
                    <button onClick={e => { e.stopPropagation(); togglePostLike(post.id); }}
                      className={`flex items-center gap-1 text-[10px] font-mono transition-colors ${isLiked ? 'text-red-400' : 'text-white/25 hover:text-red-400'}`}>
                      <Heart size={11} className={isLiked ? 'fill-red-400 text-red-400' : ''} />
                      {formatEngagementCount(likeCount)}
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
          const isLiked = isPostLiked(post.id);
          const likeCount = getPostLikeCount(post);
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
                  type="button"
                  onClick={() => togglePostLike(post.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${isLiked ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white'}`}>
                  <Heart size={14} className={isLiked ? 'fill-red-400' : ''} /> {isLiked ? 'Liked' : 'Like'} · {formatEngagementCount(likeCount)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    navigate(`/community/posts/${post.id}`);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: accent, color: '#000' }}>
                  <ExternalLink size={14} /> View Full Post
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
function KnowledgeGrid({ accent, articles }: { accent: string; articles: KnowledgeArticle[] }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<KnowledgeArticle | null>(null);

  const typeFilters = ['all', 'guide', 'trend', 'news', 'blog', 'tips'] as const;
  const labels: Record<string, string> = { all: 'All Insights', guide: 'Guides', trend: 'Trends', news: 'News', blog: 'Blog', tips: 'Tips' };

  const filtered = useMemo(() =>
    articles.filter(a => filter === 'all' || a.type === filter), [articles, filter]);

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
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                navigate(`/community/articles/${art.id}`);
              }}
              className="w-full py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
              style={{ backgroundColor: accent, color: '#000' }}
            >
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
  const [messageTarget, setMessageTarget] = useState<Contractor | null>(null);

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
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/5 pt-4">
                <span className="text-[8px] font-mono uppercase tracking-[0.24em] text-white/20">Quick contact</span>
                <DirectoryQuickActions contractor={c} onMessage={setMessageTarget} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Contractor drawer */}
      <DetailDrawer item={selected} onClose={() => setSelected(null)}>
        {(c) => {
          const { label: typeLabel, Icon } = CTYPE_CFG[c.type];
          const collaborationHref = c.email
            ? `mailto:${c.email}?subject=${encodeURIComponent('Project collaboration via Brick Tile Shop')}`
            : getWhatsAppHref(c) ?? (c.phone ? `tel:${c.phone}` : null);
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
              <div className="rounded-2xl border border-white/8 p-6">
                <p className="mb-4 text-[9px] uppercase tracking-widest text-white/20">Quick Actions</p>
                <DirectoryQuickActions contractor={c} onMessage={setMessageTarget} />
              </div>
              {c.verified ? (
                <button
                  type="button"
                  onClick={() => setMessageTarget(c)}
                  className="w-full py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: accent, color: '#000' }}
                >
                  Request Collaboration
                </button>
              ) : collaborationHref ? (
                <a
                  href={collaborationHref}
                  target={collaborationHref.startsWith('http') ? '_blank' : undefined}
                  rel={collaborationHref.startsWith('http') ? 'noreferrer' : undefined}
                  className="block w-full rounded-xl py-4 text-center text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: accent, color: '#000' }}
                >
                  Request Collaboration
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl border border-white/10 py-4 text-[10px] font-bold uppercase tracking-widest text-white/25"
                >
                  Contact Details Pending
                </button>
              )}
            </div>
          );
        }}
      </DetailDrawer>
      <DirectoryMessageModal contractor={messageTarget} onClose={() => setMessageTarget(null)} />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function DesignCommunity() {
  const [activeIdx, setActiveIdx] = useState<SectionId>(0);
  const vol = VOLUMES[activeIdx];
  const publishedContent = usePublishedMarketingContent();
  const communityPosts = useMemo(() => [...publishedContent.communityPosts, ...POSTS], [publishedContent.communityPosts]);
  const knowledgeArticles = useMemo(() => [...publishedContent.knowledgeArticles, ...ARTICLES], [publishedContent.knowledgeArticles]);

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
            {activeIdx === 0 && <CommunityGrid accent={vol.accent} posts={communityPosts} />}
            {activeIdx === 1 && <KnowledgeGrid accent={vol.accent} articles={knowledgeArticles} />}
            {activeIdx === 2 && <DirectoryGrid accent={vol.accent} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
