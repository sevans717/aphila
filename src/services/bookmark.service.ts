import { prisma } from "../lib/prisma";

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
  type?: "post" | "media";
  dateFrom?: Date;
  dateTo?: Date;
  hasNotes?: boolean;
}

export interface BookmarkSearchParams {
  query?: string;
  userId: string;
  filters?: BookmarkFilters;
  sortBy?: "created" | "updated" | "relevance";
  sortOrder?: "asc" | "desc";
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
  operation: "move" | "delete" | "tag" | "untag";
  targetCollectionId?: string;
  tags?: string[];
}

export interface BookmarkExportData {
  collections: Array<{
    name: string;
    description?: string;
    bookmarks: Array<{
      type: "post" | "media";
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
  static async createCollection(params: {
    userId: string;
    name: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<CollectionWithDetails> {
    const collection = await prisma.collection.create({
      data: {
        userId: params.userId,
        name: params.name,
        description: params.description,
        isPublic: params.isPublic ?? false,
      },
    });
    return this.mapCollection({ ...collection, _count: { bookmarks: 0 } });
  }

  static async getUserCollections(
    userId: string
  ): Promise<CollectionWithDetails[]> {
    const collections = await prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return collections.map((c: any) =>
      this.mapCollection({ ...c, _count: { bookmarks: 0 } })
    );
  }

  static async getCollectionById(
    collectionId: string,
    userId: string
  ): Promise<CollectionWithDetails | null> {
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });
    return collection
      ? this.mapCollection({ ...collection, _count: { bookmarks: 0 } })
      : null;
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
  static async togglePostBookmark(
    userId: string,
    postId: string,
    collectionId?: string | null
  ): Promise<ToggleResult> {
    const existing = await prisma.postBookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.postBookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    let data: any = { userId, postId };
    if (collectionId) {
      const owns = await (prisma as any).collection.findFirst({
        where: { id: collectionId, userId },
      });
      if (owns) data.collectionId = collectionId;
    }

    const bookmark = await prisma.postBookmark.create({
      data,
    });
    return { bookmarked: true, bookmarkId: bookmark.id };
  }

  // Media bookmarks
  static async toggleMediaBookmark(
    userId: string,
    mediaId: string
  ): Promise<ToggleResult> {
    const existing = await prisma.mediaBookmark.findUnique({
      where: { userId_mediaId: { userId, mediaId } },
    });

    if (existing) {
      await prisma.mediaBookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    const bookmark = await prisma.mediaBookmark.create({
      data: { userId, mediaId },
    });
    return { bookmarked: true, bookmarkId: bookmark.id };
  }

  static async getBookmarkStats(userId: string): Promise<BookmarkStats> {
    const [postCount, mediaCount, collectionsCount] = await Promise.all([
      prisma.postBookmark.count({ where: { userId } }),
      prisma.mediaBookmark.count({ where: { userId } }),
      prisma.collection.count({ where: { userId } }),
    ]);

    return {
      totalPostBookmarks: postCount,
      totalMediaBookmarks: mediaCount,
      collectionsCount,
    };
  }

  // Listing & search
  static async listBookmarks(
    params: BookmarkSearchParams
  ): Promise<{ items: BookmarkWithDetails[]; total: number }> {
    const limit = Math.min(params.limit ?? 25, 200);
    const offset = params.offset ?? 0;

    const where: any = { userId: params.userId };
    if (params.filters) {
      const f = params.filters;
      if (f.collectionId) where.collectionId = f.collectionId;
      if (f.type === "post") where.postId = { not: null };
      if (f.type === "media") where.mediaId = { not: null };
      if (f.hasNotes === true) where.notes = { not: null };
      if (f.dateFrom || f.dateTo) where.createdAt = {};
      if (f.dateFrom) where.createdAt.gte = f.dateFrom;
      if (f.dateTo) where.createdAt.lte = f.dateTo;
      if (f.tags && f.tags.length) where.tags = { hasSome: f.tags };
    }

    if (params.query) {
      // simple full-text like filtering on post content or media caption
      where.OR = [
        { post: { content: { contains: params.query, mode: "insensitive" } } },
        { media: { caption: { contains: params.query, mode: "insensitive" } } },
      ];
    }

    // Prisma does not have a unified `Bookmark` model in this schema. Query post and media bookmarks separately.
    const sortField = params.sortBy === "updated" ? "updatedAt" : "createdAt";

    if (params.filters?.type === "post") {
      const [total, items] = await Promise.all([
        prisma.postBookmark.count({ where }),
        prisma.postBookmark.findMany({
          where,
          include: {
            post: {
              include: {
                mediaAssets: { include: { media: true } },
                author: { include: { profile: true } },
              },
            },
            collection: true,
          },
          orderBy: { [sortField]: params.sortOrder ?? "desc" } as any,
          take: limit,
          skip: offset,
        }),
      ]);

      const mapped = items.map((b: any) => ({
        id: b.id,
        userId: b.userId,
        postId: b.postId || undefined,
        mediaId: undefined,
        collectionId: b.collectionId || undefined,
        notes: undefined,
        tags: [],
        createdAt: b.createdAt,
        post: b.post
          ? {
              id: b.post.id,
              content: b.post.content || undefined,
              media: (b.post.mediaAssets || []).map((m: any) => ({
                id: m.media.id,
                url: m.media.url,
                type: m.media.type,
              })),
              user: {
                id: b.post.author?.id,
                profile: { displayName: b.post.author?.profile?.displayName },
              },
            }
          : undefined,
        media: undefined,
        collection: b.collection
          ? {
              id: b.collection.id,
              name: b.collection.name,
              color: b.collection.color || undefined,
            }
          : undefined,
      }));
      return { items: mapped, total };
    }

    if (params.filters?.type === "media") {
      const [total, items] = await Promise.all([
        prisma.mediaBookmark.count({ where }),
        prisma.mediaBookmark.findMany({
          where,
          include: { media: true },
          orderBy: { [sortField]: params.sortOrder ?? "desc" } as any,
          take: limit,
          skip: offset,
        }),
      ]);

      const mapped = items.map((b: any) => ({
        id: b.id,
        userId: b.userId,
        postId: undefined,
        mediaId: b.mediaId || undefined,
        collectionId: undefined,
        notes: undefined,
        tags: b.tags || [],
        createdAt: b.createdAt,
        post: undefined,
        media: b.media
          ? {
              id: b.media.id,
              url: b.media.url,
              type: b.media.type,
              caption: b.media.caption || undefined,
            }
          : undefined,
        collection: undefined,
      }));
      return { items: mapped, total };
    }

    // Combined listing: fetch both types, merge and sort in-memory, then paginate
    const [postTotal, mediaTotal, postItems, mediaItems] = await Promise.all([
      prisma.postBookmark.count({ where }),
      prisma.mediaBookmark.count({ where }),
      prisma.postBookmark.findMany({
        where,
        include: {
          post: {
            include: {
              mediaAssets: { include: { media: true } },
              author: { include: { profile: true } },
            },
          },
          collection: true,
        },
        orderBy: { [sortField]: params.sortOrder ?? "desc" } as any,
        take: 1000,
      }),
      prisma.mediaBookmark.findMany({
        where,
        include: { media: true },
        orderBy: { [sortField]: params.sortOrder ?? "desc" } as any,
        take: 1000,
      }),
    ]);

    const mappedPosts = postItems.map((b: any) => ({
      id: b.id,
      userId: b.userId,
      postId: b.postId || undefined,
      mediaId: undefined,
      collectionId: b.collectionId || undefined,
      notes: undefined,
      tags: [],
      createdAt: b.createdAt,
      post: b.post
        ? {
            id: b.post.id,
            content: b.post.content || undefined,
            media: (b.post.mediaAssets || []).map((m: any) => ({
              id: m.media.id,
              url: m.media.url,
              type: m.media.type,
            })),
            user: {
              id: b.post.author?.id,
              profile: { displayName: b.post.author?.profile?.displayName },
            },
          }
        : undefined,
      media: undefined,
      collection: b.collection
        ? {
            id: b.collection.id,
            name: b.collection.name,
            color: b.collection.color || undefined,
          }
        : undefined,
    }));

    const mappedMedia = mediaItems.map((b: any) => ({
      id: b.id,
      userId: b.userId,
      postId: undefined,
      mediaId: b.mediaId || undefined,
      collectionId: undefined,
      notes: undefined,
      tags: b.tags || [],
      createdAt: b.createdAt,
      post: undefined,
      media: b.media
        ? {
            id: b.media.id,
            url: b.media.url,
            type: b.media.type,
            caption: b.media.caption || undefined,
          }
        : undefined,
      collection: undefined,
    }));

    const combined: any[] = mappedPosts.concat(mappedMedia as any);
    combined.sort(
      (a, b) =>
        (b.createdAt.getTime
          ? b.createdAt.getTime()
          : new Date(b.createdAt).getTime()) -
        (a.createdAt.getTime
          ? a.createdAt.getTime()
          : new Date(a.createdAt).getTime())
    );
    const total = postTotal + mediaTotal;
    const page = combined.slice(offset, offset + limit);
    return { items: page, total };
  }

  static async listCollectionsWithCounts(
    userId: string
  ): Promise<CollectionWithDetails[]> {
    const cols = await prisma.collection.findMany({
      where: { userId },
      include: { _count: { select: { bookmarks: true } } },
      orderBy: { createdAt: "desc" },
    });
    return cols.map((c: any) =>
      this.mapCollection({
        ...c,
        _count: { bookmarks: c._count?.bookmarks ?? 0 },
      })
    );
  }

  static async getCollectionAnalytics(
    collectionId: string
  ): Promise<CollectionAnalytics> {
    // Collections in this schema are tied to post bookmarks only.
    const total = await prisma.postBookmark.count({ where: { collectionId } });
    const posts = total;
    const media = 0;

    const bookmarksByMonth = await prisma.$queryRaw`
      SELECT to_char("createdAt", 'YYYY-MM') AS month, count(*)::int AS count
      FROM "post_bookmarks"
      WHERE "collectionId" = ${collectionId}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `;

    const mostUsedTags: Array<{ tag: string; count: number }> = [];

    return {
      collectionId,
      totalBookmarks: total,
      bookmarksByType: { posts, media },
      bookmarksByMonth: (bookmarksByMonth as any).map((r: any) => ({
        month: r.month,
        count: Number(r.count),
      })),
      mostUsedTags,
      shareCount: 0,
      viewCount: 0,
    };
  }
}
