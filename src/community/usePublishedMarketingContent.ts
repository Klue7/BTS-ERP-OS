import { useEffect, useMemo, useState } from 'react';
import { fetchPublishedMarketingContent } from '../marketing/api';
import type { MarketingContentPostSummary } from '../marketing/contracts';
import type { CommunityPost, KnowledgeArticle, StorefrontCommunityCategoryKey } from './publicCommunityContent';

const VALID_CATEGORY_KEYS = new Set<StorefrontCommunityCategoryKey>(['cladding-tiles', 'bricks', 'paving', 'breeze-blocks']);

function normalizeCategoryKeys(keys: string[]): StorefrontCommunityCategoryKey[] {
  const normalized = keys.filter((key): key is StorefrontCommunityCategoryKey => VALID_CATEGORY_KEYS.has(key as StorefrontCommunityCategoryKey));
  return normalized.length > 0 ? normalized : ['cladding-tiles'];
}

function toKnowledgeArticle(content: MarketingContentPostSummary): KnowledgeArticle {
  const type = ['guide', 'trend', 'news', 'tips', 'blog'].includes(content.type) ? content.type : 'blog';

  return {
    id: content.id,
    type: type as KnowledgeArticle['type'],
    title: content.title,
    excerpt: content.excerpt,
    coverImage: content.coverImage,
    readTime: content.readTime,
    category: content.category,
    author: content.author,
    featured: content.featured,
    date: content.date,
    body: content.body,
    takeaways: content.takeaways,
    relatedCategoryKeys: normalizeCategoryKeys(content.relatedCategoryKeys),
    relatedProductKeywords: content.relatedProductKeywords,
  };
}

function toCommunityPost(content: MarketingContentPostSummary): CommunityPost {
  const postType = ['editorial', 'concept', 'built'].includes(content.type) ? content.type : 'editorial';

  return {
    id: content.id,
    type: postType as CommunityPost['type'],
    title: content.title,
    description: content.excerpt,
    mediaUrl: content.coverImage,
    author: {
      name: content.author,
      role: content.authorRole ?? 'BTS Editorial',
    },
    category: content.category,
    tags: content.tags,
    date: content.date,
    stats: { likes: 0, saves: 0, comments: 0 },
    relatedCategoryKeys: normalizeCategoryKeys(content.relatedCategoryKeys),
    relatedProductKeywords: content.relatedProductKeywords,
  };
}

export function usePublishedMarketingContent() {
  const [contentPosts, setContentPosts] = useState<MarketingContentPostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchPublishedMarketingContent()
      .then((records) => {
        if (!cancelled) {
          setContentPosts(records);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContentPosts([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const knowledgeArticles = useMemo(
    () => contentPosts
      .filter((content) => content.status === 'Published' && content.targetSurface === 'Knowledge & Insights')
      .map(toKnowledgeArticle),
    [contentPosts],
  );

  const communityPosts = useMemo(
    () => contentPosts
      .filter((content) => content.status === 'Published' && content.targetSurface === 'Design & Build')
      .map(toCommunityPost),
    [contentPosts],
  );

  return {
    contentPosts,
    knowledgeArticles,
    communityPosts,
    isLoading,
  };
}
