export interface CollectionWithDetails {
    id: string;
    name: string;
    description?: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    itemsCount: number;
}
export interface ToggleResult {
    bookmarked: boolean;
    bookmarkId?: string;
}
export interface BookmarkStats {
    totalPostBookmarks: number;
    totalMediaBookmarks: number;
    collectionsCount: number;
}
export interface CreateCollectionData {
    userId: string;
    name: string;
    description?: string;
    isPublic?: boolean;
    tags?: string[];
    color?: string;
}
export interface UpdateCollectionData {
    name?: string;
    description?: string;
    isPublic?: boolean;
    tags?: string[];
    color?: string;
}
export interface BookmarkData {
    userId: string;
    postId?: string;
    mediaId?: string;
    collectionId?: string;
    notes?: string;
    tags?: string[];
}
export interface BookmarkWithDetails {
    id: string;
    userId: string;
    postId?: string;
    mediaId?: string;
    collectionId?: string;
    notes?: string;
    tags: string[];
    createdAt: Date;
    post?: {
        id: string;
        content?: string;
        media: Array<{
            id: string;
            url: string;
            type: string;
        }>;
        user: {
            id: string;
            profile: {
                displayName: string;
            };
        };
    };
    media?: {
        id: string;
        url: string;
        type: string;
        caption?: string;
    };
    collection?: {
        id: string;
        name: string;
        color?: string;
    };
}
export interface CollectionShareSettings {
    isPublic: boolean;
    allowComments: boolean;
    allowLikes: boolean;
    shareableLink?: string;
    password?: string;
}
export interface BookmarkFilters {
    collectionId?: string;
    tags?: string[];
    type?: 'post' | 'media';
    dateFrom?: Date;
    dateTo?: Date;
    hasNotes?: boolean;
}
export interface BookmarkSearchParams {
    query?: string;
    userId: string;
    filters?: BookmarkFilters;
    sortBy?: 'created' | 'updated' | 'relevance';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}
export interface CollectionAnalytics {
    collectionId: string;
    totalBookmarks: number;
    bookmarksByType: {
        posts: number;
        media: number;
    };
    bookmarksByMonth: Array<{
        month: string;
        count: number;
    }>;
    mostUsedTags: Array<{
        tag: string;
        count: number;
    }>;
    shareCount: number;
    viewCount: number;
}
export interface BulkBookmarkOperation {
    bookmarkIds: string[];
    operation: 'move' | 'delete' | 'tag' | 'untag';
    targetCollectionId?: string;
    tags?: string[];
}
export interface BookmarkExportData {
    collections: Array<{
        name: string;
        description?: string;
        bookmarks: Array<{
            type: 'post' | 'media';
            url: string;
            title?: string;
            notes?: string;
            tags: string[];
            savedAt: Date;
        }>;
    }>;
    exportedAt: Date;
    totalBookmarks: number;
}
export declare class BookmarkService {
    static createCollection(params: {
        userId: string;
        name: string;
        description?: string;
        isPublic?: boolean;
    }): Promise<CollectionWithDetails>;
    static getUserCollections(userId: string): Promise<CollectionWithDetails[]>;
    static getCollectionById(collectionId: string, userId: string): Promise<CollectionWithDetails | null>;
    private static mapCollection;
    static togglePostBookmark(userId: string, postId: string, collectionId?: string | null): Promise<ToggleResult>;
    static toggleMediaBookmark(userId: string, mediaId: string): Promise<ToggleResult>;
    static getBookmarkStats(userId: string): Promise<BookmarkStats>;
}
//# sourceMappingURL=bookmark.service.d.ts.map