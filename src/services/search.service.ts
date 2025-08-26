import { prisma } from '../lib/prisma';

export interface SearchResult {
  posts: PostSearchResult[];
  users: UserSearchResult[];
  communities: CommunitySearchResult[];
  totalResults: number;
  searchTime: number;
  suggestions?: string[];
}

export interface PostSearchResult {
  id: string;
  content?: string;
  author: {
    id: string;
    profile: {
      displayName: string;
    };
  };
  media?: Array<{
    id: string;
    url: string;
    type: string;
    thumbnailUrl?: string;
  }>;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  relevanceScore?: number;
  highlightedContent?: string;
}

export interface UserSearchResult {
  id: string;
  profile: {
    displayName: string;
    bio?: string;
    verified?: boolean;
  };
  photos: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  followersCount?: number;
  isFollowing?: boolean;
  mutualFriendsCount?: number;
  relevanceScore?: number;
}

export interface CommunitySearchResult {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  isJoined?: boolean;
  isPrivate: boolean;
  category?: {
    id: string;
    name: string;
  };
  bannerUrl?: string;
  relevanceScore?: number;
}

export interface SearchFilters {
  type?: 'all' | 'posts' | 'users' | 'communities' | 'media';
  dateRange?: {
    from: Date;
    to: Date;
  };
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  categories?: string[];
  tags?: string[];
  verified?: boolean;
  hasMedia?: boolean;
  sortBy?: 'relevance' | 'recent' | 'popular' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  query: string;
  userId: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  includeHighlights?: boolean;
  includeSuggestions?: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'user' | 'hashtag' | 'location';
  count?: number;
  metadata?: Record<string, any>;
}

export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  filters?: SearchFilters;
  resultsCount: number;
  timestamp: Date;
  clickedResults?: Array<{
    type: string;
    id: string;
    position: number;
  }>;
}

export interface SearchAnalytics {
  query: string;
  searchCount: number;
  clickThroughRate: number;
  averagePosition: number;
  noResultsRate: number;
  popularFilters: Record<string, number>;
  relatedQueries: Array<{
    query: string;
    count: number;
  }>;
}

export interface AutocompleteResult {
  suggestions: Array<{
    text: string;
    type: 'query' | 'user' | 'hashtag' | 'community';
    metadata?: Record<string, any>;
  }>;
  trending: string[];
  recent: string[];
}

export interface SearchIndexData {
  id: string;
  type: 'post' | 'user' | 'community';
  title: string;
  content: string;
  tags: string[];
  metadata: Record<string, any>;
  popularity: number;
  lastUpdated: Date;
}

export interface SearchConfiguration {
  minQueryLength: number;
  maxQueryLength: number;
  resultsPerPage: number;
  maxResults: number;
  enableFuzzySearch: boolean;
  enableAutoCorrect: boolean;
  searchableFields: string[];
  boostFactors: Record<string, number>;
}

export interface TrendingSearch {
  query: string;
  count: number;
  growth: number;
  category?: string;
  regions: Record<string, number>;
}

export class SearchService {
  static async searchAll(userId: string, query: string, limit: number = 5) {
    const q = query.trim();
    if (!q) return { posts: [], users: [], communities: [] };

    const [posts, users, communities] = await Promise.all([
      prisma.post.findMany({ 
        where: { 
          content: { contains: q, mode: 'insensitive' },
          isArchived: false
        }, 
        select: { 
          id: true, 
          content: true,
          author: { select: { id: true, profile: { select: { displayName: true } } } },
          createdAt: true
        }, 
        take: limit 
      }),
      prisma.user.findMany({ 
        where: { 
          profile: { displayName: { contains: q, mode: 'insensitive' } },
          isActive: true
        }, 
        select: { 
          id: true, 
          profile: { select: { displayName: true, bio: true } },
          photos: { where: { isPrimary: true }, select: { url: true } }
        }, 
        take: limit 
      }),
      prisma.community.findMany({ 
        where: { 
          name: { contains: q, mode: 'insensitive' }
        }, 
        select: { 
          id: true, 
          name: true, 
          description: true,
          _count: { select: { memberships: true } }
        }, 
        take: limit 
      }),
    ]);

    // Log query with results count
    await prisma.searchQuery.create({ 
      data: { 
        userId, 
        query: q, 
        results: posts.length + users.length + communities.length 
      } 
    });

    return { posts, users, communities };
  }

  static async searchPosts(userId: string, query: string, options: { limit?: number; cursor?: string } = {}) {
    const { limit = 20, cursor } = options;
    const q = query.trim();
    
    const posts = await prisma.post.findMany({
      where: {
        content: { contains: q, mode: 'insensitive' },
        isArchived: false
      },
      include: {
        author: { 
          include: { 
            profile: { select: { displayName: true } },
            photos: { where: { isPrimary: true }, select: { url: true } }
          }
        },
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    let nextCursor: string | undefined;
    if (posts.length > limit) {
      const next = posts.pop();
      nextCursor = next?.id;
    }

    return { items: posts, nextCursor };
  }

  static async searchUsers(userId: string, query: string, options: { limit?: number; cursor?: string } = {}) {
    const { limit = 20, cursor } = options;
    const q = query.trim();
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { profile: { displayName: { contains: q, mode: 'insensitive' } } },
          { email: { contains: q, mode: 'insensitive' } }
        ],
        isActive: true,
        id: { not: userId }
      },
      include: {
        profile: { select: { displayName: true, bio: true } },
        photos: { where: { isPrimary: true }, select: { url: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    let nextCursor: string | undefined;
    if (users.length > limit) {
      const next = users.pop();
      nextCursor = next?.id;
    }

    return { items: users, nextCursor };
  }

  static async getSearchHistory(userId: string, limit: number = 10) {
    const history = await prisma.searchQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { query: true, createdAt: true },
      distinct: ['query'],
      take: limit
    });

    return history;
  }

  static async clearSearchHistory(userId: string) {
    await prisma.searchQuery.deleteMany({ where: { userId } });
    return { success: true };
  }
}
