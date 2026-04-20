import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  MousePointerClick, 
  Instagram, 
  Linkedin, 
  Facebook, 
  Mail, 
  Share2, 
  MoreHorizontal, 
  Clock, 
  Globe,
  X,
  Send,
  ExternalLink,
  BarChart3,
  Megaphone,
  Image as ImageIcon,
  Filter,
  History,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  MarketingChannel,
  MarketingCommunityChannelStats,
  MarketingCommunityComment,
  MarketingCommunityLikeActor,
  MarketingCommunityPostSummary,
} from '../marketing/contracts';

// --- MOCK DATA ---

type CommunityPost = MarketingCommunityPostSummary;

const MOCK_POSTS: CommunityPost[] = [
  {
    id: 'POST-001',
    campaignId: 'CAMP-2024-Q1-HERO',
    campaignName: 'Spring Collection Launch',
    calendarEntryIds: [],
    publishingJobIds: [],
    creator: {
      name: 'Sarah Jenkins',
      avatar: 'https://i.pravatar.cc/150?u=sarah'
    },
    mediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'Introducing our new Heritage Red Multi collection. Perfect for both modern and traditional builds. The texture speaks for itself. 🧱✨\n\n#BrickTileShop #Architecture #InteriorDesign #NewBuild',
    createdAt: '2 hours ago',
    internalLikes: 12,
    channels: [
      { channel: 'Instagram', status: 'Published', publishedAt: '2 hours ago', likes: 1245, comments: 84, saves: 320 },
      { channel: 'LinkedIn', status: 'Published', publishedAt: '2 hours ago', likes: 450, comments: 22, shares: 45 },
      { channel: 'Facebook', status: 'Published', publishedAt: '2 hours ago', likes: 890, comments: 45, shares: 112 }
    ],
    internalLikeActors: [],
    internalComments: [
      {
        id: 'C1',
        user: { name: 'Mike Ross', avatar: 'https://i.pravatar.cc/150?u=mike', role: 'Sales Lead' },
        content: 'Clients are already asking about this one. Great shot!',
        timestamp: '1 hour ago',
        likes: 4,
        replies: [
          {
            id: 'C1-1',
            user: { name: 'Sarah Jenkins', avatar: 'https://i.pravatar.cc/150?u=sarah', role: 'Marketing' },
            content: 'Thanks Mike! I will send you the high-res versions for your client presentations.',
            timestamp: '45 mins ago',
            likes: 2
          }
        ]
      },
      {
        id: 'C2',
        user: { name: 'Elena Rodriguez', avatar: 'https://i.pravatar.cc/150?u=elena', role: 'Inventory Mgr' },
        content: 'Stock levels are looking good for the expected demand.',
        timestamp: '45 mins ago',
        likes: 2
      }
    ]
  },
  {
    id: 'POST-002',
    campaignId: 'CAMP-EDU-04',
    campaignName: 'Material Masterclass',
    calendarEntryIds: [],
    publishingJobIds: [],
    creator: {
      name: 'David Chen',
      avatar: 'https://i.pravatar.cc/150?u=david'
    },
    mediaUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'Did you know? The firing temperature of our premium clay bricks directly impacts their water absorption rate. Here is a quick guide on choosing the right brick for high-moisture environments. 💧🏗️',
    createdAt: '1 day ago',
    internalLikes: 8,
    channels: [
      { channel: 'LinkedIn', status: 'Published', publishedAt: '1 day ago', likes: 820, comments: 56, shares: 120 },
      { channel: 'Email', status: 'Published', publishedAt: '1 day ago', opens: 4500, clicks: 850 }
    ],
    internalLikeActors: [],
    internalComments: []
  },
  {
    id: 'POST-003',
    campaignId: 'CAMP-PROMO-WK12',
    campaignName: 'Trade Discount Week',
    calendarEntryIds: [],
    publishingJobIds: [],
    creator: {
      name: 'Sarah Jenkins',
      avatar: 'https://i.pravatar.cc/150?u=sarah'
    },
    mediaUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'Trade partners: Our Q2 volume discount is now live. Log in to your portal to see updated pricing on all standard ranges. 📈🤝',
    createdAt: '2 days ago',
    internalLikes: 24,
    channels: [
      { channel: 'LinkedIn', status: 'Published', publishedAt: '2 days ago', likes: 310, comments: 12, shares: 18 },
      { channel: 'Facebook', status: 'Published', publishedAt: '2 days ago', likes: 150, comments: 5, shares: 8 },
      { channel: 'Instagram', status: 'Scheduled', publishedAt: 'Tomorrow, 09:00 AM' }
    ],
    internalLikeActors: [],
    internalComments: [
      {
        id: 'C3',
        user: { name: 'Tom Hardy', avatar: 'https://i.pravatar.cc/150?u=tom', role: 'Account Exec' },
        content: 'I will make sure to follow up with my top 10 accounts today.',
        timestamp: '1 day ago',
        likes: 5
      }
    ]
  }
];

// --- COMPONENTS ---

const ChannelIcon = ({ channel, size = 14 }: { channel: string, size?: number }) => {
  switch (channel) {
    case 'Instagram': return <Instagram size={size} />;
    case 'LinkedIn': return <Linkedin size={size} />;
    case 'Facebook': return <Facebook size={size} />;
    case 'Email': return <Mail size={size} />;
    default: return <Globe size={size} />;
  }
};

const formatNumber = (num: number) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

const CommentThread = ({ comment, isReply = false }: { comment: MarketingCommunityComment, isReply?: boolean }) => {
  const avatarSize = isReply ? "w-8 h-8" : "w-10 h-10";
  const hasReplies = comment.replies && comment.replies.length > 0;
  
  return (
    <div className={`flex gap-3 sm:gap-4 group`}>
      {/* Left Column: Avatar & Thread Line */}
      <div className="flex flex-col items-center">
        <img 
          src={comment.user.avatar} 
          alt={comment.user.name} 
          className={`${avatarSize} rounded-full border border-white/10 shrink-0 object-cover z-10 relative`} 
        />
        {hasReplies && (
          <div className="w-px bg-white/10 group-hover:bg-white/20 transition-colors flex-1 my-2" />
        )}
      </div>
      
      {/* Right Column: Content & Replies */}
      <div className="flex-1 pb-1">
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-sm font-bold text-white tracking-wide">{comment.user.name}</span>
          <span className="text-[9px] text-[#00ff88] px-1.5 py-0.5 rounded border border-[#00ff88]/20 bg-[#00ff88]/10 uppercase tracking-widest hidden sm:inline-block">
            {comment.user.role}
          </span>
          <span className="text-[10px] text-white/30 ml-auto font-mono">{comment.timestamp}</span>
        </div>
        
        {/* Body */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl rounded-tl-none p-3.5 mb-2 shadow-sm hover:bg-white/[0.04] transition-colors">
          <p className="text-sm text-white/80 leading-relaxed">
            {comment.content}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-4 text-[11px] font-bold text-white/40 px-2">
          <button className="hover:text-white transition-colors flex items-center gap-1.5">
            <Heart size={12} className={comment.likes > 0 ? "text-rose-500/70" : ""} /> 
            {comment.likes > 0 ? comment.likes : 'Like'}
          </button>
          <button className="hover:text-white transition-colors flex items-center gap-1.5">
            <MessageCircle size={12} /> Reply
          </button>
        </div>
        
        {/* Nested Replies */}
        {hasReplies && (
          <div className="mt-4 flex flex-col gap-4">
            {comment.replies!.map(reply => (
              <CommentThread key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const MarketingCommunityFeed = ({
  posts = MOCK_POSTS,
  onOpenCampaign,
  onOpenAsset,
  onOpenAnalytics,
  onOpenHistory,
  onOpenChannel,
  onLikePost,
  onCommentPost,
  internalLikeActorKey,
}: {
  posts?: CommunityPost[];
  onOpenCampaign?: (post: CommunityPost) => void;
  onOpenAsset?: (post: CommunityPost) => void;
  onOpenAnalytics?: (post: CommunityPost) => void;
  onOpenHistory?: (post: CommunityPost) => void;
  onOpenChannel?: (post: CommunityPost, channel: MarketingCommunityChannelStats) => void;
  onLikePost?: (post: CommunityPost) => Promise<void> | void;
  onCommentPost?: (post: CommunityPost, content: string) => Promise<void> | void;
  internalLikeActorKey?: string;
}) => {
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Scheduled' | 'Failed'>('All');
  const [channelFilter, setChannelFilter] = useState<MarketingChannel | 'All'>('All');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingLike, setIsSubmittingLike] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPost) {
      return;
    }

    const refreshed = posts.find((post) => post.id === selectedPost.id) ?? null;
    if (refreshed && refreshed !== selectedPost) {
      setSelectedPost(refreshed);
    }
  }, [posts, selectedPost]);

  // Calculate aggregated totals
  const getAggregatedStats = (post: CommunityPost) => {
    let internalLikes = post.internalLikes;
    let internalComments = post.internalComments.length;
    let externalLikes = 0;
    let externalComments = 0;
    let totalShares = 0;
    let totalSaves = 0;
    let totalClicks = 0;

    post.channels.forEach(ch => {
      if (ch.likes) externalLikes += ch.likes;
      if (ch.comments) externalComments += ch.comments;
      if (ch.shares) totalShares += ch.shares;
      if (ch.saves) totalSaves += ch.saves;
      if (ch.clicks) totalClicks += ch.clicks;
    });

    return { 
      internalLikes, internalComments,
      externalLikes, externalComments,
      totalLikes: internalLikes + externalLikes, 
      totalComments: internalComments + externalComments, 
      totalShares, totalSaves, totalClicks 
    };
  };

  const filteredPosts = posts.filter((post) => {
    const matchesStatus = statusFilter === 'All' ? true : post.channels.some((channel) => channel.status === statusFilter);
    const matchesChannel = channelFilter === 'All' ? true : post.channels.some((channel) => channel.channel === channelFilter);
    return matchesStatus && matchesChannel;
  });

  const hasViewerLikedPost = (post: CommunityPost) => {
    if (!internalLikeActorKey) {
      return false;
    }

    return post.internalLikeActors.some((actor: MarketingCommunityLikeActor) => actor.key === internalLikeActorKey);
  };

  const handleLikePost = async (post: CommunityPost) => {
    if (!onLikePost) {
      toast('Internal likes are not wired yet for this feed.');
      return;
    }

    try {
      const wasLiked = hasViewerLikedPost(post);
      setIsSubmittingLike(post.id);
      await onLikePost(post);
      toast.success(wasLiked ? 'Internal like removed.' : 'Internal like added.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to like this post.');
    } finally {
      setIsSubmittingLike(null);
    }
  };

  const handleSubmitComment = async () => {
    if (!selectedPost || !newComment.trim()) {
      return;
    }

    if (!onCommentPost) {
      toast('Internal commenting is not wired yet for this feed.');
      return;
    }

    try {
      setIsSubmittingComment(true);
      await onCommentPost(selectedPost, newComment.trim());
      setNewComment('');
      toast.success('Internal comment added.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add the comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Community Feed</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 text-[8px] font-bold uppercase tracking-widest text-[#00ff88]">
              <Activity size={10} /> Live Flow
            </div>
          </div>
          <p className="text-xs text-white/40">Internal view of published marketing content and aggregated engagement.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFilterOpen((current) => !current)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 flex flex-wrap items-center gap-3"
          >
            <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/25">Status</span>
            {(['All', 'Published', 'Scheduled', 'Failed'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setStatusFilter(option)}
                className={`px-3 py-1.5 rounded-lg border text-[9px] font-mono uppercase tracking-[0.22em] transition-colors ${
                  statusFilter === option
                    ? 'border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]'
                    : 'border-white/10 bg-black/20 text-white/45 hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
            <span className="ml-4 text-[9px] font-mono uppercase tracking-[0.22em] text-white/25">Channel</span>
            {(['All', 'Instagram', 'Facebook', 'LinkedIn', 'Email', 'TikTok', 'WhatsApp', 'Pinterest'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setChannelFilter(option)}
                className={`px-3 py-1.5 rounded-lg border text-[9px] font-mono uppercase tracking-[0.22em] transition-colors ${
                  channelFilter === option
                    ? 'border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]'
                    : 'border-white/10 bg-black/20 text-white/45 hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed Layout */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
        <div className="max-w-2xl mx-auto space-y-8">
          {filteredPosts.map((post) => {
            const stats = getAggregatedStats(post);
            const viewerHasLiked = hasViewerLikedPost(post);
            
            return (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all duration-500 group shadow-2xl relative"
              >
                {/* Subtle background glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Post Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/5 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={post.creator.avatar} alt={post.creator.name} className="w-12 h-12 rounded-full border border-white/10 object-cover" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0a0a0a] flex items-center justify-center border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-[#00ff88]" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white tracking-wide">{post.creator.name}</div>
                      <div className="text-[10px] text-white/40 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{post.createdAt}</span>
                        <span>•</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCampaign?.(post);
                          }}
                          className="flex items-center gap-1.5 text-[#00ff88] hover:text-[#00cc6a] transition-colors font-mono uppercase tracking-widest"
                        >
                          <Megaphone size={10} /> {post.campaignName}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-all">
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                {/* Post Content */}
                <div className="cursor-pointer relative z-10" onClick={() => setSelectedPost(post)}>
                  <p className="px-6 py-5 text-sm text-white/80 whitespace-pre-wrap leading-relaxed font-medium">
                    {post.caption}
                  </p>
                  
                  <div className="relative aspect-video bg-[#050505] border-y border-white/5 overflow-hidden">
                    <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all group-hover:scale-105 duration-700" />
                    
                    {/* Gradient Overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
                    
                    {/* Channel Badges Overlay */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      {post.channels.map((ch, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenChannel?.(post, ch);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md border text-[9px] font-bold uppercase tracking-widest shadow-lg ${
                          ch.status === 'Published' 
                            ? 'bg-black/60 border-white/10 text-white' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}
                        >
                          <ChannelIcon channel={ch.channel} size={12} />
                          {ch.channel}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Engagement Summary Bar */}
                <div className="px-6 py-4 border-b border-white/5 flex flex-col gap-3 bg-white/[0.01] relative z-10">
                  <div className="flex items-center justify-between text-[11px] text-white/40 font-medium">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-white/60 group-hover:text-white transition-colors" title={`${stats.internalLikes} Internal + ${stats.externalLikes} External`}>
                        <Heart size={14} className="text-rose-500/70" /> 
                        <span className="text-white/80 font-bold">{formatNumber(stats.totalLikes)}</span>
                        <span className="text-[9px] uppercase tracking-widest hidden sm:inline">Likes</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60 group-hover:text-white transition-colors" title={`${stats.internalComments} Internal + ${stats.externalComments} External`}>
                        <MessageCircle size={14} /> 
                        <span className="text-white/80 font-bold">{formatNumber(stats.totalComments)}</span>
                        <span className="text-[9px] uppercase tracking-widest hidden sm:inline">Comments</span>
                      </div>
                      {stats.totalShares > 0 && (
                        <div className="flex items-center gap-2 text-white/60 group-hover:text-white transition-colors">
                          <Share2 size={14} /> 
                          <span className="text-white/80 font-bold">{formatNumber(stats.totalShares)}</span>
                          <span className="text-[9px] uppercase tracking-widest hidden sm:inline">Shares</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Per-Channel Metric Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 mr-1">Sources:</span>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-mono text-white/60">
                      <Globe size={10} className="text-[#00ff88]" /> Internal
                    </div>
                    {post.channels.map((ch, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onOpenChannel?.(post, ch)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#111] border border-white/10 text-[9px] font-mono text-white/60 hover:text-white transition-colors"
                        title={ch.channel}
                      >
                        <ChannelIcon channel={ch.channel} size={10} />
                        {ch.status === 'Published' ? (
                          <span>{formatNumber((ch.likes || 0) + (ch.comments || 0) + (ch.shares || 0))} Engagements</span>
                        ) : (
                          <span className="text-amber-400/70">Scheduled</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Internal Action Row */}
                <div className="px-4 py-3 flex items-center justify-between relative z-10 bg-[#0a0a0a]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { void handleLikePost(post); }}
                      disabled={isSubmittingLike === post.id}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-40 ${
                        viewerHasLiked
                          ? 'bg-rose-500/12 border border-rose-500/25 text-rose-300 hover:bg-rose-500/18'
                          : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <Heart size={16} className={viewerHasLiked ? 'fill-current text-rose-400' : ''} />
                      {isSubmittingLike === post.id ? (viewerHasLiked ? 'Updating...' : 'Liking...') : viewerHasLiked ? 'Unlike' : 'Like'}
                    </button>
                    <button onClick={() => setSelectedPost(post)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2">
                      <MessageCircle size={16} /> Comment
                    </button>
                    <button
                      onClick={() => toast('Community saves stay internal for now.')}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                    >
                      <Bookmark size={16} /> Save
                    </button>
                  </div>
                  <button onClick={() => setSelectedPost(post)} className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#00ff88]/60 hover:text-[#00ff88] hover:bg-[#00ff88]/10 transition-all border border-transparent hover:border-[#00ff88]/20">
                    Open Thread
                  </button>
                </div>
              </motion.div>
            );
          })}
          {filteredPosts.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] px-8 py-12 text-center">
              <p className="text-sm text-white/55">No community posts match the active filters yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Post Detail Drawer */}
      <AnimatePresence>
        {selectedPost && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-[#0a0a0a] border-l border-white/10 z-50 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedPost(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/10">
                    <X size={18} />
                  </button>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white">Post Details</h3>
                    <div className="text-[10px] font-mono text-[#00ff88]/80 uppercase tracking-widest mt-0.5">{selectedPost.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onOpenAnalytics?.(selectedPost)}
                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <BarChart3 size={14} /> Analytics
                  </button>
                  <button 
                    onClick={() => onOpenHistory?.(selectedPost)}
                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <History size={14} /> History
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Original Post */}
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <img src={selectedPost.creator.avatar} alt={selectedPost.creator.name} className="w-12 h-12 rounded-full border border-white/10 object-cover" />
                      <div>
                        <div className="text-sm font-bold text-white tracking-wide">{selectedPost.creator.name}</div>
                        <div className="text-[10px] text-white/40 font-mono mt-0.5">{selectedPost.createdAt}</div>
                      </div>
                    </div>
                    {/* Linked Campaign & Asset */}
                    <div className="flex flex-col items-end gap-2">
                      <button 
                        onClick={() => onOpenCampaign?.(selectedPost)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors"
                      >
                        <Megaphone size={12} /> {selectedPost.campaignName}
                      </button>
                      <button 
                        onClick={() => onOpenAsset?.(selectedPost)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <ImageIcon size={12} /> View Source Asset
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed mb-6 font-medium">
                    {selectedPost.caption}
                  </p>
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#050505] shadow-2xl">
                    <img src={selectedPost.mediaUrl} alt="Post media" className="w-full h-auto" />
                  </div>
                </div>

                {/* Engagement Totals Summary */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center justify-between">
                    <span>Aggregated Engagement</span>
                    <span className="text-[8px] text-white/20 normal-case tracking-normal font-mono">External comments are count-only</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg relative overflow-hidden">
                      <Heart size={16} className="text-rose-500/70 mb-1" />
                      <div className="text-2xl font-mono text-white">{formatNumber(getAggregatedStats(selectedPost).totalLikes)}</div>
                      <div className="text-[9px] text-white/40 uppercase tracking-widest">Total Likes</div>
                      <div className="flex items-center gap-2 text-[8px] font-mono text-white/30 mt-2 pt-2 border-t border-white/5 w-full justify-center">
                        <span title="Internal Likes">{formatNumber(getAggregatedStats(selectedPost).internalLikes)} INT</span>
                        <span>•</span>
                        <span title="External Likes">{formatNumber(getAggregatedStats(selectedPost).externalLikes)} EXT</span>
                      </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg relative overflow-hidden">
                      <MessageCircle size={16} className="text-white/60 mb-1" />
                      <div className="text-2xl font-mono text-white">{formatNumber(getAggregatedStats(selectedPost).totalComments)}</div>
                      <div className="text-[9px] text-white/40 uppercase tracking-widest">Total Comments</div>
                      <div className="flex items-center gap-2 text-[8px] font-mono text-white/30 mt-2 pt-2 border-t border-white/5 w-full justify-center">
                        <span title="Internal Thread Comments">{formatNumber(getAggregatedStats(selectedPost).internalComments)} INT</span>
                        <span>•</span>
                        <span title="External Sync Counts">{formatNumber(getAggregatedStats(selectedPost).externalComments)} EXT</span>
                      </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg relative overflow-hidden">
                      <Share2 size={16} className="text-white/60 mb-1" />
                      <div className="text-2xl font-mono text-white">{formatNumber(getAggregatedStats(selectedPost).totalShares)}</div>
                      <div className="text-[9px] text-white/40 uppercase tracking-widest">Total Shares</div>
                      <div className="flex items-center gap-2 text-[8px] font-mono text-white/30 mt-2 pt-2 border-t border-white/5 w-full justify-center">
                        <span title="External Shares Only">{formatNumber(getAggregatedStats(selectedPost).totalShares)} EXT</span>
                      </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg relative overflow-hidden">
                      <Bookmark size={16} className="text-white/60 mb-1" />
                      <div className="text-2xl font-mono text-white">{formatNumber(getAggregatedStats(selectedPost).totalSaves)}</div>
                      <div className="text-[9px] text-white/40 uppercase tracking-widest">Total Saves</div>
                      <div className="flex items-center gap-2 text-[8px] font-mono text-white/30 mt-2 pt-2 border-t border-white/5 w-full justify-center">
                        <span title="External Saves Only">{formatNumber(getAggregatedStats(selectedPost).totalSaves)} EXT</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Channel Breakdown */}
                <div className="p-6 border-b border-white/5 bg-[#050505]">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Channel Breakdown</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedPost.channels.map((ch, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onOpenChannel?.(selectedPost, ch)}
                        className="w-full text-left bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col gap-4 shadow-sm hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white border border-white/10">
                              <ChannelIcon channel={ch.channel} size={14} />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-white tracking-wide">{ch.channel}</span>
                              {ch.status === 'Scheduled' && (
                                <div className="text-[10px] text-white/40 font-mono flex items-center gap-1.5 mt-0.5">
                                  <Clock size={10} /> {ch.publishedAt}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                            ch.status === 'Published' ? 'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]' :
                            ch.status === 'Scheduled' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                            'bg-white/5 border-white/10 text-white/40'
                          }`}>
                            {ch.status}
                          </span>
                        </div>
                        
                        {ch.status === 'Published' ? (
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3 border-t border-white/5">
                            {ch.likes !== undefined && (
                              <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                                <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Likes</div>
                                <div className="text-sm font-mono text-white">{formatNumber(ch.likes)}</div>
                              </div>
                            )}
                            {ch.comments !== undefined && (
                              <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                                <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Comments</div>
                                <div className="text-sm font-mono text-white">{formatNumber(ch.comments)}</div>
                              </div>
                            )}
                            {ch.shares !== undefined && (
                              <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                                <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Shares</div>
                                <div className="text-sm font-mono text-white">{formatNumber(ch.shares)}</div>
                              </div>
                            )}
                            {ch.saves !== undefined && (
                              <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                                <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Saves</div>
                                <div className="text-sm font-mono text-white">{formatNumber(ch.saves)}</div>
                              </div>
                            )}
                            {ch.clicks !== undefined && (
                              <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                                <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Clicks</div>
                                <div className="text-sm font-mono text-white">{formatNumber(ch.clicks)}</div>
                              </div>
                            )}
                            {ch.opens !== undefined && (
                              <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                                <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Opens</div>
                                <div className="text-sm font-mono text-white">{formatNumber(ch.opens)}</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="pt-3 border-t border-white/5 text-[10px] text-white/40 font-mono flex items-center gap-2">
                            <Clock size={12} /> Scheduled for {ch.publishedAt}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Internal Comments */}
                <div className="p-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6">Internal Thread</h4>
                  
                  <div className="space-y-6">
                    {selectedPost.internalComments.length === 0 ? (
                      <div className="text-center py-8 text-white/20 text-sm">
                        No internal comments yet. Be the first to start the discussion.
                      </div>
                    ) : (
                      selectedPost.internalComments.map(comment => (
                        <CommentThread key={comment.id} comment={comment} />
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-white/5 bg-[#050505] sticky bottom-0 z-20">
                <div className="flex items-end gap-3 bg-white/[0.02] border border-white/10 rounded-2xl p-2 focus-within:border-white/30 focus-within:bg-white/[0.04] transition-all shadow-inner">
                  <img src="https://i.pravatar.cc/150?u=current" alt="You" className="w-8 h-8 rounded-full border border-white/10 shrink-0 mb-1 ml-1 object-cover" />
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add an internal comment..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30 resize-none min-h-[40px] max-h-[120px] py-2.5 px-2"
                    rows={1}
                  />
                  <button 
                    onClick={() => { void handleSubmitComment(); }}
                    className={`p-2.5 rounded-xl transition-all mb-0.5 mr-0.5 ${newComment.trim() ? 'bg-[#00ff88] text-black hover:bg-[#00cc6a] shadow-[0_0_15px_rgba(0,255,136,0.3)]' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                    disabled={!newComment.trim() || isSubmittingComment}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
