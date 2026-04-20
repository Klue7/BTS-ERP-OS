import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  COMMUNITY_POSTS,
  KNOWLEDGE_ARTICLES,
  matchesCommunityProductContext,
  type CommunityPost,
  type KnowledgeArticle,
  type StorefrontCommunityCategoryKey,
} from '../community/publicCommunityContent';
import { usePublishedMarketingContent } from '../community/usePublishedMarketingContent';
import { useStorefrontCategoryData } from '../catalog/storefrontData';
import { useVisualLab } from './VisualLabContext';

type ProductKnowledgeItem =
  | { kind: 'article'; item: KnowledgeArticle }
  | { kind: 'post'; item: CommunityPost };

type ActiveFilter = 'all' | 'guides' | 'projects' | 'trends';

const CATEGORY_COPY: Record<StorefrontCommunityCategoryKey, { label: string; descriptor: string; accent: string }> = {
  'cladding-tiles': {
    label: 'Cladding Tiles',
    descriptor: 'installation guides, feature-wall ideas, sealing notes, and real cladding projects',
    accent: '#22c55e',
  },
  bricks: {
    label: 'Bricks',
    descriptor: 'bond patterns, mortar decisions, facade precedents, and heritage build notes',
    accent: '#C5A059',
  },
  paving: {
    label: 'Paving',
    descriptor: 'base preparation, courtyard layouts, exterior detailing, and landscape project notes',
    accent: '#60a5fa',
  },
  'breeze-blocks': {
    label: 'Breeze Blocks',
    descriptor: 'privacy screens, airflow design, terracotta rhythm, and architectural screen references',
    accent: '#fb923c',
  },
};

const ARTICLE_ACCENT: Record<KnowledgeArticle['type'], string> = {
  guide: '#C5A059',
  trend: '#22c55e',
  news: '#60a5fa',
  tips: '#e879f9',
  blog: '#fb923c',
};

const POST_TYPE_META: Record<CommunityPost['type'], { label: string; className: string; Icon: typeof BookOpen }> = {
  editorial: { label: 'Editorial', className: 'bg-white/10 text-white/60', Icon: BookOpen },
  concept: { label: 'Concept', className: 'bg-blue-500/20 text-blue-300', Icon: Sparkles },
  built: { label: 'Built', className: 'bg-[#22c55e]/20 text-[#22c55e]', Icon: CheckCircle },
};

function getProductTerms(selectedCatalogItem: any | null, categoryItems: any[]) {
  const selectedTerms = selectedCatalogItem
    ? [
        selectedCatalogItem.name,
        selectedCatalogItem.publicSku,
        selectedCatalogItem.mood,
        selectedCatalogItem.category,
        selectedCatalogItem.subCategory,
        selectedCatalogItem.description,
      ]
    : [];

  const categoryTerms = categoryItems.flatMap((item) => [
    item.name,
    item.publicSku,
    item.mood,
    item.category,
    item.subCategory,
  ]);

  return Array.from(new Set([...selectedTerms, ...categoryTerms].filter(Boolean).map(String)));
}

function getItemId(entry: ProductKnowledgeItem) {
  return `${entry.kind}-${entry.item.id}`;
}

function getItemImage(entry: ProductKnowledgeItem) {
  return entry.kind === 'article' ? entry.item.coverImage : entry.item.mediaUrl;
}

function getItemTitle(entry: ProductKnowledgeItem) {
  return entry.item.title;
}

function getItemDescription(entry: ProductKnowledgeItem) {
  return entry.kind === 'article' ? entry.item.excerpt : entry.item.description;
}

function DetailDrawer({
  selected,
  onClose,
  accent,
  onOpenCommunity,
}: {
  selected: ProductKnowledgeItem | null;
  onClose: () => void;
  accent: string;
  onOpenCommunity: () => void;
}) {
  return (
    <AnimatePresence>
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] flex justify-end"
        >
          <button
            type="button"
            aria-label="Close guide detail"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 240 }}
            className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#090909] shadow-[0_0_80px_rgba(0,0,0,0.9)]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#090909]/95 px-6 py-5 backdrop-blur-md sm:px-8">
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/30">
                Product Knowledge
              </span>
              <button type="button" onClick={onClose} className="rounded-full bg-white/5 p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-8 p-6 sm:p-8">
              <div className="aspect-[16/9] overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <img src={getItemImage(selected)} alt={getItemTitle(selected)} className="h-full w-full object-cover" />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {selected.kind === 'article' ? (
                  <>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ARTICLE_ACCENT[selected.item.type] }} />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">
                      {selected.item.type} / {selected.item.category}
                    </span>
                    <span className="text-[9px] font-mono text-white/20">{selected.item.readTime} read</span>
                  </>
                ) : (
                  <>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest ${POST_TYPE_META[selected.item.type].className}`}>
                      {React.createElement(POST_TYPE_META[selected.item.type].Icon, { size: 10 })}
                      {POST_TYPE_META[selected.item.type].label}
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/25">{selected.item.category}</span>
                    {selected.item.location ? (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-white/25">
                        <MapPin size={9} />
                        {selected.item.location}
                      </span>
                    ) : null}
                  </>
                )}
              </div>

              <h2 className="font-serif text-4xl font-light leading-tight text-white">{getItemTitle(selected)}</h2>

              <div className="flex items-center gap-4 border-y border-white/5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Users size={15} className="text-white/35" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white">
                    {selected.kind === 'article' ? selected.item.author : selected.item.author.name}
                  </p>
                  <p className="mt-0.5 text-[9px] font-mono uppercase tracking-widest text-white/30">
                    {selected.kind === 'article' ? selected.item.date : selected.item.author.role}
                  </p>
                </div>
              </div>

              <p className="text-base font-light leading-relaxed text-white/55">{getItemDescription(selected)}</p>

              <button
                type="button"
                onClick={onOpenCommunity}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[10px] font-black uppercase tracking-[0.24em] text-black transition-transform hover:scale-[1.015]"
                style={{ backgroundColor: accent }}
              >
                Open In Community
                <ExternalLink size={14} />
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ProductKnowledgeSection() {
  const navigate = useNavigate();
  const { activeCategory, selectedCatalogItem } = useVisualLab();
  const { categoryData } = useStorefrontCategoryData(activeCategory);
  const [filter, setFilter] = useState<ActiveFilter>('all');
  const [selected, setSelected] = useState<ProductKnowledgeItem | null>(null);
  const [liked, setLiked] = useState(new Set<string>());
  const [saved, setSaved] = useState(new Set<string>());
  const publishedContent = usePublishedMarketingContent();

  const categoryMeta = CATEGORY_COPY[activeCategory];
  const categoryItems = categoryData?.catalog ?? [];
  const knowledgeArticles = useMemo(
    () => [...publishedContent.knowledgeArticles, ...KNOWLEDGE_ARTICLES],
    [publishedContent.knowledgeArticles],
  );
  const communityPosts = useMemo(
    () => [...publishedContent.communityPosts, ...COMMUNITY_POSTS],
    [publishedContent.communityPosts],
  );

  const content = useMemo<ProductKnowledgeItem[]>(() => {
    const productTerms = getProductTerms(selectedCatalogItem, categoryItems);
    const articleEntries: ProductKnowledgeItem[] = knowledgeArticles
      .filter((article) => matchesCommunityProductContext(article, activeCategory, productTerms))
      .map((article) => ({ kind: 'article', item: article }));
    const postEntries: ProductKnowledgeItem[] = communityPosts
      .filter((post) => matchesCommunityProductContext(post, activeCategory, productTerms))
      .map((post) => ({ kind: 'post', item: post }));

    return [...articleEntries, ...postEntries].sort((a, b) => {
      const aFeatured = a.kind === 'article' && a.item.featured ? 1 : 0;
      const bFeatured = b.kind === 'article' && b.item.featured ? 1 : 0;
      return bFeatured - aFeatured;
    });
  }, [activeCategory, categoryItems, communityPosts, knowledgeArticles, selectedCatalogItem]);

  const filteredContent = useMemo(() => {
    if (filter === 'guides') {
      return content.filter((entry) => entry.kind === 'article' && ['guide', 'tips'].includes(entry.item.type));
    }
    if (filter === 'projects') {
      return content.filter((entry) => entry.kind === 'post');
    }
    if (filter === 'trends') {
      return content.filter((entry) => entry.kind === 'article' && ['trend', 'news', 'blog'].includes(entry.item.type));
    }
    return content;
  }, [content, filter]);

  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const featured = filteredContent[0] ?? content[0];
  const rest = filteredContent.filter((entry) => getItemId(entry) !== getItemId(featured));

  return (
    <section id="product-guides" className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,197,94,0.14),transparent_28%),radial-gradient(circle_at_85%_35%,rgba(197,160,89,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,rgba(0,0,0,0.55))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-24 sm:px-8 lg:px-12 lg:py-28">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.36em]" style={{ color: categoryMeta.accent }}>
              Community Intelligence / {categoryMeta.label}
            </p>
            <h2 className="font-serif text-5xl font-light leading-none tracking-tight text-white md:text-7xl">
              Product guides,<br />
              <span className="italic text-white/25">built proof.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/45">
              Related community posts and technical guides are matched to {selectedCatalogItem?.name ?? categoryMeta.label}: {categoryMeta.descriptor}.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <div className="grid grid-cols-2 gap-3 sm:flex">
              {[
                ['all', 'All'],
                ['guides', 'Guides'],
                ['projects', 'Projects'],
                ['trends', 'Trends'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id as ActiveFilter)}
                  className="rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                  style={{
                    backgroundColor: filter === id ? categoryMeta.accent : 'transparent',
                    borderColor: filter === id ? categoryMeta.accent : 'rgba(255,255,255,0.1)',
                    color: filter === id ? '#050505' : 'rgba(255,255,255,0.38)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate('/community')}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/45 transition-all hover:border-white/25 hover:text-white"
            >
              Open Community
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          {featured ? (
            <motion.article
              key={getItemId(featured)}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              onClick={() => setSelected(featured)}
              className="group relative min-h-[420px] cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c0c0c] shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
            >
              <img src={getItemImage(featured)} alt={getItemTitle(featured)} className="absolute inset-0 h-full w-full object-cover opacity-60 transition-all duration-700 group-hover:scale-105 group-hover:opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                <span className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest text-black" style={{ backgroundColor: categoryMeta.accent }}>
                  Featured
                </span>
                <span className="rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-white/45 backdrop-blur-md">
                  {featured.kind === 'article' ? featured.item.category : featured.item.category}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="mb-3 flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-white/35">
                  {featured.kind === 'article' ? (
                    <>
                      <Clock size={11} />
                      {featured.item.readTime} read / {featured.item.type}
                    </>
                  ) : (
                    <>
                      <Users size={11} />
                      {featured.item.author.name} / {featured.item.type}
                    </>
                  )}
                </div>
                <h3 className="max-w-2xl font-serif text-4xl font-light leading-tight text-white transition-colors group-hover:text-[#22c55e] md:text-5xl">
                  {getItemTitle(featured)}
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/45">{getItemDescription(featured)}</p>
              </div>
            </motion.article>
          ) : null}

          <div data-free-scroll className="grid max-h-none grid-cols-1 gap-4 overflow-visible lg:max-h-[620px] lg:overflow-y-auto lg:pr-2">
            {rest.slice(0, 5).map((entry, index) => {
              const id = getItemId(entry);
              const isLiked = liked.has(id);
              const isSaved = saved.has(id);

              return (
                <motion.article
                  key={id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelected(entry)}
                  className="group grid cursor-pointer grid-cols-[112px_1fr] overflow-hidden rounded-2xl border border-white/5 bg-[#0c0c0c] transition-all hover:border-white/15 sm:grid-cols-[148px_1fr]"
                >
                  <div className="relative min-h-36 overflow-hidden">
                    <img src={getItemImage(entry)} alt={getItemTitle(entry)} className="h-full w-full object-cover opacity-65 transition-all duration-700 group-hover:scale-105 group-hover:opacity-85" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
                  </div>

                  <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        {entry.kind === 'article' ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ARTICLE_ACCENT[entry.item.type] }} />
                            <span className="text-[8px] font-mono uppercase tracking-widest text-white/25">
                              {entry.item.type} / {entry.item.readTime}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-widest ${POST_TYPE_META[entry.item.type].className}`}>
                              {POST_TYPE_META[entry.item.type].label}
                            </span>
                            <span className="text-[8px] font-mono uppercase tracking-widest text-white/25">{entry.item.category}</span>
                          </>
                        )}
                      </div>
                      <h4 className="line-clamp-2 text-base font-light leading-snug text-white transition-colors group-hover:text-[#22c55e]">
                        {getItemTitle(entry)}
                      </h4>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/35">{getItemDescription(entry)}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-white/25">
                        {entry.kind === 'article' ? entry.item.author : entry.item.author.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSet(setLiked, id);
                          }}
                          className="flex items-center gap-1 text-[10px] font-mono text-white/25 transition-colors hover:text-red-400"
                        >
                          <Heart size={11} className={isLiked ? 'fill-red-400 text-red-400' : ''} />
                          {entry.kind === 'post' ? entry.item.stats.likes + (isLiked ? 1 : 0) : ''}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSet(setSaved, id);
                          }}
                          className="text-white/25 transition-colors hover:text-[#22c55e]"
                        >
                          <Bookmark size={11} className={isSaved ? 'fill-[#22c55e] text-[#22c55e]' : ''} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>

      <DetailDrawer
        selected={selected}
        onClose={() => setSelected(null)}
        accent={categoryMeta.accent}
        onOpenCommunity={() => navigate('/community')}
      />
    </section>
  );
}
