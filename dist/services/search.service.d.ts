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
export declare class SearchService {
    static searchAll(userId: string, query: string, limit?: number): Promise<{
        posts: any;
        users: any;
        communities: any;
    }>;
    static searchPosts(userId: string, query: string, options?: {
        limit?: number;
        cursor?: string;
    }): Promise<{
        items: any;
        nextCursor: string | undefined;
    }>;
    static searchUsers(userId: string, query: string, options?: {
        limit?: number;
        cursor?: string;
    }): Promise<{
        items: any;
        nextCursor: string | undefined;
    }>;
    static getSearchHistory(userId: string, limit?: number): Promise<any>;
    static clearSearchHistory(userId: string): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=search.service.d.ts.map