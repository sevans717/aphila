import { prisma } from '../lib/prisma';

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

export class BookmarkService {
  // Collections
  static async createCollection(params: { userId: string; name: string; description?: string; isPublic?: boolean }): Promise<CollectionWithDetails> {
    const collection = await prisma.collection.create({
      data: {
        userId: params.userId,
        name: params.name,
        description: params.description,
        isPublic: params.isPublic ?? false,
      }
    });
    return this.mapCollection({ ...collection, _count: { bookmarks: 0 } });
  }

  static async getUserCollections(userId: string): Promise<CollectionWithDetails[]> {
    const collections = await prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return collections.map((c: any) => this.mapCollection({ ...c, _count: { bookmarks: 0 } }));
  }

  static async getCollectionById(collectionId: string, userId: string): Promise<CollectionWithDetails | null> {
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId }
    });
    return collection ? this.mapCollection({ ...collection, _count: { bookmarks: 0 } }) : null;
  }

  private static mapCollection(c: any): CollectionWithDetails {
    return {
      id: c.id,
      name: c.name,
      description: c.description || undefined,
      isPublic: c.isPublic,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      itemsCount: c._count?.bookmarks ?? 0,
    };
  }

  // Post bookmarks
  static async togglePostBookmark(userId: string, postId: string, collectionId?: string | null): Promise<ToggleResult> {
    const existing = await prisma.postBookmark.findUnique({
      where: { userId_postId: { userId, postId } }
    });

    if (existing) {
      await prisma.postBookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    let data: any = { userId, postId };
    if (collectionId) {
      const owns = await (prisma as any).collection.findFirst({ where: { id: collectionId, userId } });
      if (owns) data.collectionId = collectionId;
    }

    const bookmark = await prisma.postBookmark.create({
      data
    });
    return { bookmarked: true, bookmarkId: bookmark.id };
  }

  // Media bookmarks
  static async toggleMediaBookmark(userId: string, mediaId: string): Promise<ToggleResult> {
    const existing = await prisma.mediaBookmark.findUnique({
      where: { userId_mediaId: { userId, mediaId } }
    });

    if (existing) {
      await prisma.mediaBookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    const bookmark = await prisma.mediaBookmark.create({
      data: { userId, mediaId }
    });
    return { bookmarked: true, bookmarkId: bookmark.id };
  }

  static async getBookmarkStats(userId: string): Promise<BookmarkStats> {
    const [postCount, mediaCount, collectionsCount] = await Promise.all([
      prisma.postBookmark.count({ where: { userId } }),
      prisma.mediaBookmark.count({ where: { userId } }),
      prisma.collection.count({ where: { userId } })
    ]);

    return {
      totalPostBookmarks: postCount,
      totalMediaBookmarks: mediaCount,
      collectionsCount
    };
  }

  // TODO: add methods for listing bookmarks by user / collection with pagination and filtering in later phases.
}
