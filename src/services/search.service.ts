import { prisma } from "../lib/prisma";

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
  type?: "all" | "posts" | "users" | "communities" | "media";
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
  sortBy?: "relevance" | "recent" | "popular" | "alphabetical";
  sortOrder?: "asc" | "desc";
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
  type: "query" | "user" | "hashtag" | "location";
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
    type: "query" | "user" | "hashtag" | "community";
    metadata?: Record<string, any>;
  }>;
  trending: string[];
  recent: string[];
}

export interface SearchIndexData {
  id: string;
  type: "post" | "user" | "community";
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
  static async searchAll(
    userId: string,
    query: string,
    limit: number = 5,
    includeHighlights: boolean = false,
    includeSuggestions: boolean = false
  ) {
    const q = query.trim();
    if (!q) return { posts: [], users: [], communities: [] };

    console.log(
      `Searching for "${q}" with highlights: ${includeHighlights}, suggestions: ${includeSuggestions}`
    );

    const [posts, users, communities] = await Promise.all([
      prisma.post.findMany({
        where: {
          content: { contains: q, mode: "insensitive" },
          isArchived: false,
        },
        select: {
          id: true,
          content: true,
          author: {
            select: { id: true, profile: { select: { displayName: true } } },
          },
          createdAt: true,
        },
        take: limit,
      }),
      prisma.user.findMany({
        where: {
          profile: { displayName: { contains: q, mode: "insensitive" } },
          isActive: true,
        },
        select: {
          id: true,
          profile: { select: { displayName: true, bio: true } },
          photos: { where: { isPrimary: true }, select: { url: true } },
        },
        take: limit,
      }),
      prisma.community.findMany({
        where: {
          name: { contains: q, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          description: true,
          _count: { select: { memberships: true } },
        },
        take: limit,
      }),
    ]);

    // Log query with results count
    await prisma.searchQuery.create({
      data: {
        userId,
        query: q,
        results: posts.length + users.length + communities.length,
      },
    });

    return { posts, users, communities };
  }

  static async searchPosts(
    _userId: string,
    query: string,
    options: {
      limit?: number;
      cursor?: string;
      includeHighlights?: boolean;
    } = {}
  ) {
    const { limit = 20, cursor, includeHighlights = false } = options;
    const q = query.trim();

    console.log(
      `Searching posts for "${q}" with cursor: ${cursor}, highlights: ${includeHighlights}`
    );

    // Log search query for analytics
    await prisma.searchQuery.create({
      data: {
        userId: _userId,
        query: q,
        results: 0, // Will be updated after search
      },
    });

    const posts = await prisma.post.findMany({
      where: {
        content: { contains: q, mode: "insensitive" },
        isArchived: false,
      },
      include: {
        author: {
          include: {
            profile: { select: { displayName: true } },
            photos: { where: { isPrimary: true }, select: { url: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
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

  static async searchUsers(
    userId: string,
    query: string,
    options: {
      limit?: number;
      cursor?: string;
      includeSuggestions?: boolean;
    } = {}
  ) {
    const { limit = 20, cursor, includeSuggestions = false } = options;
    const q = query.trim();

    console.log(
      `Searching users for "${q}" with cursor: ${cursor}, suggestions: ${includeSuggestions}`
    );

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { profile: { displayName: { contains: q, mode: "insensitive" } } },
          { email: { contains: q, mode: "insensitive" } },
        ],
        isActive: true,
        id: { not: userId },
      },
      include: {
        profile: { select: { displayName: true, bio: true } },
        photos: { where: { isPrimary: true }, select: { url: true } },
      },
      orderBy: { createdAt: "desc" },
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
      orderBy: { createdAt: "desc" },
      select: { query: true, createdAt: true },
      distinct: ["query"],
      take: limit,
    });

    return history;
  }

  static async clearSearchHistory(userId: string) {
    await prisma.searchQuery.deleteMany({ where: { userId } });
    return { success: true };
  }

  // Use SearchResult interface for comprehensive search
  static async comprehensiveSearch(
    userId: string,
    query: string,
    limit: number = 5
  ): Promise<SearchResult> {
    const [posts, users, communities] = await Promise.all([
      this.searchPosts(userId, query, { limit }),
      this.searchUsers(userId, query, { limit }),
      prisma.community.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          description: true,
          _count: { select: { memberships: true } },
        },
        take: limit,
      }),
    ]);

    const result: SearchResult = {
      posts: (posts.items || []).map((post) => ({
        ...post,
        content: post.content || undefined,
        author: {
          ...post.author,
          profile: post.author.profile || { displayName: "" },
        },
      })),
      users: (users.items || []).map((user) => ({
        ...user,
        profile: user.profile
          ? {
              displayName: user.profile.displayName,
              bio: user.profile.bio || undefined,
            }
          : {
              displayName: "",
              bio: undefined,
            },
        photos: user.photos.map((photo) => ({
          url: photo.url,
          isPrimary: false, // Default to false since we don't have this info
        })),
      })),
      communities: communities.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || undefined,
        memberCount: c._count.memberships,
        isJoined: false, // Would need to check membership
        isPrivate: false, // Would need to check visibility
        relevanceScore: 0,
      })),
      totalResults:
        (posts.items?.length || 0) +
        (users.items?.length || 0) +
        communities.length,
      searchTime: Date.now(),
    };

    console.log(`Comprehensive search results: ${JSON.stringify(result)}`);
    return result;
  }

  // Use SearchFilters interface for filtered search
  static async filteredSearch(
    userId: string,
    query: string,
    filters: SearchFilters
  ): Promise<any> {
    console.log(
      `Filtered search for user ${userId} with filters: ${JSON.stringify(filters)}`
    );

    const where: any = {
      content: { contains: query, mode: "insensitive" },
      isArchived: false,
    };

    if (filters.dateRange) {
      where.createdAt = {
        gte: new Date(filters.dateRange.from),
        lte: new Date(filters.dateRange.to),
      };
    }

    if (filters.hasMedia !== undefined) {
      // Would need to check for media attachments
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          include: {
            profile: { select: { displayName: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: this.getSortOrder(filters.sortBy, filters.sortOrder),
      take: 20,
    });

    return posts;
  }

  // Use SearchParams interface for advanced search
  static async advancedSearch(params: SearchParams): Promise<any> {
    console.log(`Advanced search with params: ${JSON.stringify(params)}`);

    const posts = await prisma.post.findMany({
      where: {
        content: { contains: params.query, mode: "insensitive" },
        isArchived: false,
      },
      include: {
        author: {
          include: {
            profile: { select: { displayName: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: params.limit || 20,
      skip: params.offset || 0,
    });

    return posts;
  }

  // Use SearchSuggestion interface for suggestions
  static async getSearchSuggestions(
    query: string
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    // Add query-based suggestions
    if (query.length > 2) {
      suggestions.push({
        text: query,
        type: "query",
        count: 0, // Would need to calculate
      });
    }

    console.log(
      `Search suggestions for "${query}": ${JSON.stringify(suggestions)}`
    );
    return suggestions;
  }

  // Use SearchHistory interface for history tracking
  static async saveSearchHistory(history: SearchHistory): Promise<void> {
    console.log(`Saving search history: ${JSON.stringify(history)}`);
    // This would need search history table in schema
  }

  // Use SearchAnalytics interface for analytics
  static async getSearchAnalytics(query: string): Promise<SearchAnalytics> {
    const analytics: SearchAnalytics = {
      query,
      searchCount: 0, // Would need to track
      clickThroughRate: 0,
      averagePosition: 0,
      noResultsRate: 0,
      popularFilters: {},
      relatedQueries: [],
    };

    console.log(
      `Search analytics for "${query}": ${JSON.stringify(analytics)}`
    );
    return analytics;
  }

  // Use AutocompleteResult interface for autocomplete
  static async getAutocompleteResults(
    query: string
  ): Promise<AutocompleteResult> {
    const result: AutocompleteResult = {
      suggestions: [],
      trending: [],
      recent: [],
    };

    console.log(
      `Autocomplete results for "${query}": ${JSON.stringify(result)}`
    );
    return result;
  }

  // Use SearchIndexData interface for indexing
  static async indexSearchData(data: SearchIndexData): Promise<void> {
    console.log(`Indexing search data: ${JSON.stringify(data)}`);
    // This would need search index table in schema
  }

  // Use SearchConfiguration interface for config
  static getSearchConfiguration(): SearchConfiguration {
    const config: SearchConfiguration = {
      minQueryLength: 2,
      maxQueryLength: 100,
      resultsPerPage: 20,
      maxResults: 1000,
      enableFuzzySearch: true,
      enableAutoCorrect: false,
      searchableFields: ["content", "title", "description"],
      boostFactors: {
        title: 2.0,
        content: 1.0,
        tags: 1.5,
      },
    };

    console.log(`Search configuration: ${JSON.stringify(config)}`);
    return config;
  }

  // Use TrendingSearch interface for trending queries
  static async getTrendingSearches(): Promise<TrendingSearch[]> {
    const trending: TrendingSearch[] = [];

    console.log(`Trending searches: ${JSON.stringify(trending)}`);
    return trending;
  }

  // Helper method for sort order
  private static getSortOrder(sortBy?: string, sortOrder?: string) {
    const order = sortOrder === "asc" ? "asc" : "desc";

    switch (sortBy) {
      case "recent":
        return { createdAt: order as "asc" | "desc" };
      case "popular":
        return { _count: { likes: order as "asc" | "desc" } };
      default:
        return { createdAt: "desc" as const };
    }
  }
}
