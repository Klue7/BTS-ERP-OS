import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Image,
  Newspaper,
  Sparkles,
} from 'lucide-react';
import type {
  CreateMarketingContentPostInput,
  MarketingAssetSummary,
  MarketingCampaignSummary,
  MarketingContentPostSummary,
  MarketingContentSurface,
  MarketingContentType,
} from '../marketing/contracts';

const KNOWLEDGE_TYPES: Array<{ id: MarketingContentType; label: string }> = [
  { id: 'guide', label: 'Guide' },
  { id: 'trend', label: 'Trend' },
  { id: 'news', label: 'Industry News' },
  { id: 'tips', label: 'Tips' },
  { id: 'blog', label: 'Blog' },
];

const COMMUNITY_TYPES: Array<{ id: MarketingContentType; label: string }> = [
  { id: 'editorial', label: 'Editorial Post' },
  { id: 'concept', label: 'Concept Post' },
  { id: 'built', label: 'Built Case' },
];

const CATEGORY_OPTIONS = ['Architecture', 'Technical', 'Sustainability', 'Maintenance', 'Innovation', 'Residential', 'Commercial'];
const PRODUCT_CATEGORY_KEYS = [
  { id: 'cladding-tiles', label: 'Cladding' },
  { id: 'bricks', label: 'Bricks' },
  { id: 'paving', label: 'Paving' },
  { id: 'breeze-blocks', label: 'Breeze' },
];

function splitCsv(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildDraft(input: {
  topic: string;
  title: string;
  type: MarketingContentType;
  category: string;
  selectedAsset?: MarketingAssetSummary;
  aiDirection: string;
}) {
  const topic = input.topic.trim() || input.title.trim() || 'Brick Tile Shop material guide';
  const title = input.title.trim() || `${topic}: ${input.type === 'news' ? 'Industry Update' : input.type === 'trend' ? 'Material Trend Report' : input.type === 'blog' ? 'Field Notes' : 'Practical Guide'}`;
  const sourceLine = input.selectedAsset
    ? `The selected asset, ${input.selectedAsset.name}, gives this post a real visual anchor and keeps the public card connected to Asset Lab reuse.`
    : 'The post is generated from the topic first, then can be strengthened with an approved Asset Lab image before publishing.';

  return {
    title,
    excerpt: `${topic} distilled into a BTS ${input.type} with clear product context, customer education value, and a publish-ready visual direction.`,
    body: [
      `${topic} matters because customers need material choices that are visual, practical, and commercially clear. This ${input.category.toLowerCase()} article frames the subject around Brick Tile Shop product truth instead of generic inspiration.`,
      sourceLine,
      `The content should help a customer choose, quote, or brief a project with more confidence. ${input.aiDirection.trim() ? `Editorial direction: ${input.aiDirection.trim()}` : 'Keep the tone calm, specific, and useful for South African residential and light commercial projects.'}`,
    ],
    takeaways: [
      `Use ${topic} as a practical decision point, not only a style reference.`,
      input.selectedAsset ? `Anchor the story visually around ${input.selectedAsset.name}.` : 'Add a strong approved image before final publishing where possible.',
      'Publish only when the post helps a customer take the next step.',
    ],
  };
}

export function MarketingContentStudio({
  assets,
  campaigns,
  contentPosts,
  isSaving,
  onCreateContentPost,
}: {
  assets: MarketingAssetSummary[];
  campaigns: MarketingCampaignSummary[];
  contentPosts: MarketingContentPostSummary[];
  isSaving: boolean;
  onCreateContentPost: (input: CreateMarketingContentPostInput) => Promise<MarketingContentPostSummary>;
}) {
  const navigate = useNavigate();
  const [targetSurface, setTargetSurface] = useState<MarketingContentSurface>('Knowledge & Insights');
  const [type, setType] = useState<MarketingContentType>('guide');
  const [topic, setTopic] = useState('Exterior cladding selection');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technical');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [tags, setTags] = useState('cladding, guide, exterior');
  const [keywords, setKeywords] = useState('cladding, brick, exterior, feature wall');
  const [relatedCategoryKeys, setRelatedCategoryKeys] = useState<string[]>(['cladding-tiles']);
  const [aiDirection, setAiDirection] = useState('');
  const [draftRevision, setDraftRevision] = useState(0);

  const typeOptions = targetSurface === 'Design & Build' ? COMMUNITY_TYPES : KNOWLEDGE_TYPES;
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId);
  const recentContent = contentPosts.slice(0, 6);
  const draft = useMemo(
    () => buildDraft({ topic, title, type, category, selectedAsset, aiDirection }),
    [aiDirection, category, selectedAsset, title, topic, type, draftRevision],
  );

  const publishPath = (record: MarketingContentPostSummary) =>
    record.targetSurface === 'Design & Build'
      ? `/community/posts/${record.id}`
      : `/community/articles/${record.id}`;

  const toggleCategoryKey = (key: string) => {
    setRelatedCategoryKeys((current) => (
      current.includes(key)
        ? current.filter((entry) => entry !== key)
        : [...current, key]
    ));
  };

  const handleSurfaceChange = (surface: MarketingContentSurface) => {
    setTargetSurface(surface);
    setType(surface === 'Design & Build' ? 'editorial' : 'guide');
    setCategory(surface === 'Design & Build' ? 'Residential' : 'Technical');
  };

  const handleSave = async (status: 'Draft' | 'Published') => {
    try {
      const saved = await onCreateContentPost({
        targetSurface,
        type,
        status,
        title: draft.title,
        topic,
        excerpt: draft.excerpt,
        body: draft.body,
        takeaways: draft.takeaways,
        coverImage: selectedAsset?.img,
        category,
        author: 'BTS Editorial',
        authorRole: targetSurface === 'Design & Build' ? 'Material Editor' : 'Editorial Desk',
        tags: splitCsv(tags),
        relatedCategoryKeys,
        relatedProductKeywords: splitCsv(keywords),
        sourceAssetId: selectedAssetId || undefined,
        campaignId: selectedCampaignId || undefined,
        aiDirection,
      });
      toast.success(status === 'Published' ? 'Content published to the public community pages.' : 'Content draft saved.');

      if (status === 'Published') {
        navigate(publishPath(saved));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save content.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.34em] text-[#00ff88]">Editorial Generator / Public Knowledge</p>
          <h1 className="font-serif text-4xl font-bold uppercase tracking-tighter text-white">Content Desk</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
            Generate guides, blogs, industry news, and design posts from Asset Lab media or a topic, then publish them into the same public cards used by Community.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center sm:flex">
          {[
            ['Assets Reused', assets.length],
            ['Published', contentPosts.filter((post) => post.status === 'Published').length],
            ['Drafts', contentPosts.filter((post) => post.status === 'Draft').length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <p className="font-serif text-2xl text-white">{value}</p>
              <p className="mt-1 text-[8px] font-mono uppercase tracking-[0.22em] text-white/30">{label}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)_330px]">
        <aside className="space-y-5 rounded-3xl border border-white/10 bg-[#0c0c0c] p-5">
          <div>
            <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.24em] text-white/30">Publish Destination</p>
            <div className="grid grid-cols-2 gap-2">
              {(['Knowledge & Insights', 'Design & Build'] as MarketingContentSurface[]).map((surface) => (
                <button
                  key={surface}
                  type="button"
                  onClick={() => handleSurfaceChange(surface)}
                  className={`rounded-2xl border px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] transition-all ${targetSurface === surface ? 'border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]' : 'border-white/10 bg-white/[0.02] text-white/35 hover:text-white'}`}
                >
                  {surface === 'Knowledge & Insights' ? 'Guides' : 'Posts'}
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/30">Topic</span>
            <input value={topic} onChange={(event) => setTopic(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-[#00ff88]/40" />
          </label>

          <label className="block space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/30">Optional Title Override</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Leave blank to generate" className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#00ff88]/40" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/30">Type</span>
              <select value={type} onChange={(event) => setType(event.target.value as MarketingContentType)} className="w-full rounded-2xl border border-white/10 bg-black/70 px-3 py-3 text-xs text-white outline-none focus:border-[#00ff88]/40">
                {typeOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/30">Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/70 px-3 py-3 text-xs text-white outline-none focus:border-[#00ff88]/40">
                {CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/30">AI Direction</span>
            <textarea value={aiDirection} onChange={(event) => setAiDirection(event.target.value)} rows={4} placeholder="Example: Make it practical for homeowners choosing cladding for coastal homes." className="custom-scrollbar w-full resize-none rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-[#00ff88]/40" />
          </label>

          <button
            type="button"
            onClick={() => setDraftRevision((value) => value + 1)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/10 px-5 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-[#00ff88] transition-all hover:bg-[#00ff88] hover:text-black"
          >
            <Sparkles size={14} /> Generate Draft
          </button>
        </aside>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c0c]">
          <div className="border-b border-white/10 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.28em] text-[#00ff88]">Live Public Preview</p>
                <h2 className="font-serif text-3xl leading-tight text-white">{draft.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">{draft.excerpt}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={isSaving} onClick={() => { void handleSave('Draft'); }} className="rounded-2xl border border-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/45 transition-all hover:text-white disabled:opacity-40">
                  Save Draft
                </button>
                <button type="button" disabled={isSaving} onClick={() => { void handleSave('Published'); }} className="rounded-2xl bg-[#00ff88] px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-black transition-all hover:bg-[#7dffc1] disabled:opacity-40">
                  Publish
                </button>
              </div>
            </div>
          </div>

          <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-[42%_1fr]">
            <div className="relative min-h-[320px] overflow-hidden bg-black">
              <img src={selectedAsset?.img ?? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80'} alt={draft.title} className="h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/60">{type} / {category}</span>
              </div>
            </div>
            <div className="space-y-6 p-7">
              <div className="flex flex-wrap gap-2">
                {splitCsv(tags).map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">{tag}</span>
                ))}
              </div>
              <div className="space-y-4">
                {draft.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-8 text-white/55">{paragraph}</p>
                ))}
              </div>
              <div className="rounded-3xl border border-[#00ff88]/10 bg-[#00ff88]/5 p-5">
                <p className="mb-4 text-[9px] font-black uppercase tracking-[0.24em] text-[#00ff88]">Key Takeaways</p>
                <div className="space-y-3">
                  {draft.takeaways.map((takeaway) => (
                    <div key={takeaway} className="flex gap-3 text-sm text-white/55">
                      <CheckCircle2 size={15} className="mt-1 shrink-0 text-[#00ff88]" />
                      <span>{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/30">Source Asset</p>
              <Image size={14} className="text-white/25" />
            </div>
            <div className="custom-scrollbar max-h-[330px] space-y-2 overflow-y-auto pr-1">
              <button type="button" onClick={() => setSelectedAssetId('')} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${!selectedAssetId ? 'border-[#00ff88]/30 bg-[#00ff88]/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white/25">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white">Topic Only</p>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/25">No image selected</p>
                </div>
              </button>
              {assets.slice(0, 12).map((asset) => (
                <button key={asset.id} type="button" onClick={() => setSelectedAssetId(asset.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${selectedAssetId === asset.id ? 'border-[#00ff88]/30 bg-[#00ff88]/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
                  <img src={asset.img} alt={asset.name} className="h-12 w-12 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold uppercase tracking-widest text-white">{asset.name}</p>
                    <p className="truncate text-[9px] font-mono uppercase tracking-widest text-white/25">{asset.protectionLevel}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] p-5">
            <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.24em] text-white/30">Routing</p>
            <label className="block space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25">Campaign Link</span>
              <select value={selectedCampaignId} onChange={(event) => setSelectedCampaignId(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/70 px-3 py-3 text-xs text-white outline-none focus:border-[#00ff88]/40">
                <option value="">No campaign</option>
                {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
              </select>
            </label>
            <div className="mt-4 space-y-3">
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25">Product Context</p>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_CATEGORY_KEYS.map((option) => (
                  <button key={option.id} type="button" onClick={() => toggleCategoryKey(option.id)} className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] ${relatedCategoryKeys.includes(option.id) ? 'border-[#00ff88]/30 bg-[#00ff88]/10 text-[#00ff88]' : 'border-white/10 text-white/30 hover:text-white'}`}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="mt-4 block space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25">Tags</span>
              <input value={tags} onChange={(event) => setTags(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-xs text-white outline-none focus:border-[#00ff88]/40" />
            </label>
            <label className="mt-4 block space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25">Product Keywords</span>
              <input value={keywords} onChange={(event) => setKeywords(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-xs text-white outline-none focus:border-[#00ff88]/40" />
            </label>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/30">Recent Content</p>
              <Newspaper size={14} className="text-white/25" />
            </div>
            <div className="space-y-2">
              {recentContent.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-6 text-white/35">No generated guides or posts yet. Publish the first one to seed the public cards.</p>
              ) : recentContent.map((post) => (
                <button key={post.id} type="button" onClick={() => post.status === 'Published' ? navigate(publishPath(post)) : undefined} className="w-full rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left transition-all hover:border-[#00ff88]/20">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#00ff88]">{post.status}</span>
                    <ArrowUpRight size={12} className="text-white/25" />
                  </div>
                  <p className="line-clamp-2 text-xs font-bold uppercase tracking-widest text-white">{post.title}</p>
                  <p className="mt-2 text-[9px] font-mono uppercase tracking-[0.18em] text-white/25">{post.type} / {post.targetSurface}</p>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
