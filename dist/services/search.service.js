"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const prisma_1 = require("../lib/prisma");
class SearchService {
    static async searchAll(userId, query, limit = 5, includeHighlights = false, includeSuggestions = false) {
        const q = query.trim();
        if (!q)
            return { posts: [], users: [], communities: [] };
        console.log(`Searching for "${q}" with highlights: ${includeHighlights}, suggestions: ${includeSuggestions}`);
        const [posts, users, communities] = await Promise.all([
            prisma_1.prisma.post.findMany({
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
            prisma_1.prisma.user.findMany({
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
            prisma_1.prisma.community.findMany({
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
        await prisma_1.prisma.searchQuery.create({
            data: {
                userId,
                query: q,
                results: posts.length + users.length + communities.length,
            },
        });
        return { posts, users, communities };
    }
    static async searchPosts(_userId, query, options = {}) {
        const { limit = 20, cursor, includeHighlights = false } = options;
        const q = query.trim();
        console.log(`Searching posts for "${q}" with cursor: ${cursor}, highlights: ${includeHighlights}`);
        // Log search query for analytics
        await prisma_1.prisma.searchQuery.create({
            data: {
                userId: _userId,
                query: q,
                results: 0, // Will be updated after search
            },
        });
        const posts = await prisma_1.prisma.post.findMany({
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
        let nextCursor;
        if (posts.length > limit) {
            const next = posts.pop();
            nextCursor = next?.id;
        }
        return { items: posts, nextCursor };
    }
    static async searchUsers(userId, query, options = {}) {
        const { limit = 20, cursor, includeSuggestions = false } = options;
        const q = query.trim();
        console.log(`Searching users for "${q}" with cursor: ${cursor}, suggestions: ${includeSuggestions}`);
        const users = await prisma_1.prisma.user.findMany({
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
        let nextCursor;
        if (users.length > limit) {
            const next = users.pop();
            nextCursor = next?.id;
        }
        return { items: users, nextCursor };
    }
    static async getSearchHistory(userId, limit = 10) {
        const history = await prisma_1.prisma.searchQuery.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: { query: true, createdAt: true },
            distinct: ["query"],
            take: limit,
        });
        return history;
    }
    static async clearSearchHistory(userId) {
        await prisma_1.prisma.searchQuery.deleteMany({ where: { userId } });
        return { success: true };
    }
    // Use SearchResult interface for comprehensive search
    static async comprehensiveSearch(userId, query, limit = 5) {
        const [posts, users, communities] = await Promise.all([
            this.searchPosts(userId, query, { limit }),
            this.searchUsers(userId, query, { limit }),
            prisma_1.prisma.community.findMany({
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
        const result = {
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
            totalResults: (posts.items?.length || 0) +
                (users.items?.length || 0) +
                communities.length,
            searchTime: Date.now(),
        };
        console.log(`Comprehensive search results: ${JSON.stringify(result)}`);
        return result;
    }
    // Use SearchFilters interface for filtered search
    static async filteredSearch(userId, query, filters) {
        console.log(`Filtered search for user ${userId} with filters: ${JSON.stringify(filters)}`);
        const where = {
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
        const posts = await prisma_1.prisma.post.findMany({
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
    static async advancedSearch(params) {
        console.log(`Advanced search with params: ${JSON.stringify(params)}`);
        const posts = await prisma_1.prisma.post.findMany({
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
    static async getSearchSuggestions(query) {
        const suggestions = [];
        // Add query-based suggestions
        if (query.length > 2) {
            suggestions.push({
                text: query,
                type: "query",
                count: 0, // Would need to calculate
            });
        }
        console.log(`Search suggestions for "${query}": ${JSON.stringify(suggestions)}`);
        return suggestions;
    }
    // Use SearchHistory interface for history tracking
    static async saveSearchHistory(history) {
        console.log(`Saving search history: ${JSON.stringify(history)}`);
        // This would need search history table in schema
    }
    // Use SearchAnalytics interface for analytics
    static async getSearchAnalytics(query) {
        const analytics = {
            query,
            searchCount: 0, // Would need to track
            clickThroughRate: 0,
            averagePosition: 0,
            noResultsRate: 0,
            popularFilters: {},
            relatedQueries: [],
        };
        console.log(`Search analytics for "${query}": ${JSON.stringify(analytics)}`);
        return analytics;
    }
    // Use AutocompleteResult interface for autocomplete
    static async getAutocompleteResults(query) {
        const result = {
            suggestions: [],
            trending: [],
            recent: [],
        };
        console.log(`Autocomplete results for "${query}": ${JSON.stringify(result)}`);
        return result;
    }
    // Use SearchIndexData interface for indexing
    static async indexSearchData(data) {
        console.log(`Indexing search data: ${JSON.stringify(data)}`);
        // This would need search index table in schema
    }
    // Use SearchConfiguration interface for config
    static getSearchConfiguration() {
        const config = {
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
    static async getTrendingSearches() {
        const trending = [];
        console.log(`Trending searches: ${JSON.stringify(trending)}`);
        return trending;
    }
    // Helper method for sort order
    static getSortOrder(sortBy, sortOrder) {
        const order = sortOrder === "asc" ? "asc" : "desc";
        switch (sortBy) {
            case "recent":
                return { createdAt: order };
            case "popular":
                return { _count: { likes: order } };
            default:
                return { createdAt: "desc" };
        }
    }
}
exports.SearchService = SearchService;
//# sourceMappingURL=search.service.js.map