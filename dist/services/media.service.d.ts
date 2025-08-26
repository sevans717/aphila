import { MediaType } from '@prisma/client';
interface UploadResult {
    id: string;
    url: string;
    type: MediaType;
    width?: number;
    height?: number;
    duration?: number;
    size?: number;
    mimeType?: string;
    thumbnailUrl?: string;
}
interface FileUpload {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}
interface UploadProgress {
    sessionId: string;
    progress: number;
    uploadedBytes: number;
    totalBytes: number;
    estimatedTimeRemaining?: number;
}
export declare class MediaService {
    private static readonly UPLOAD_DIR;
    private static readonly THUMBNAIL_DIR;
    private static readonly CHUNK_SIZE;
    private static s3;
    private static uploadSessions;
    static initializeUploadDir(): Promise<void>;
    static uploadFile(file: FileUpload, userId: string, uploadType?: string): Promise<UploadResult>;
    static deleteFile(url: string): Promise<void>;
    private static getMediaType;
    private static extractImageMetadata;
    private static extractVideoMetadata;
    static uploadProfilePhoto(file: FileUpload, userId: string, isPrimary?: boolean): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        url: string;
        isPrimary: boolean;
        order: number;
    }>;
    static getUserMedia(userId: string, options?: {
        type?: MediaType;
        limit?: number;
        offset?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        url: string;
        type: import(".prisma/client").$Enums.MediaType;
        isFavorite: boolean;
        usedInProfile: boolean;
        width: number | null;
        height: number | null;
        duration: number | null;
    }[]>;
    static deleteMedia(mediaId: string, userId: string): Promise<{
        success: boolean;
    }>;
    static getSignedUrl(key: string, expiresIn?: number): Promise<string>;
    static getMediaById(mediaId: string): Promise<({
        user: {
            id: string;
            profile: {
                displayName: string;
            } | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        url: string;
        type: import(".prisma/client").$Enums.MediaType;
        isFavorite: boolean;
        usedInProfile: boolean;
        width: number | null;
        height: number | null;
        duration: number | null;
    }) | null>;
    static updateMediaMetadata(mediaId: string, userId: string, metadata: {
        isFavorite?: boolean;
        usedInProfile?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        url: string;
        type: import(".prisma/client").$Enums.MediaType;
        isFavorite: boolean;
        usedInProfile: boolean;
        width: number | null;
        height: number | null;
        duration: number | null;
    }>;
    static getFileInfo(filename: string): Promise<string>;
    static cleanupOldFiles(olderThanDays?: number): Promise<{
        cleaned: number;
    }>;
    static getUploadStats(userId?: string): Promise<{
        total: number;
        byType: Record<string, number>;
        recentUploads: number;
    }>;
    /**
     * Start a chunked upload session for large files
     */
    static startChunkedUpload(userId: string, filename: string, totalSize: number, chunkSize?: number): string;
    /**
     * Upload a chunk for a session
     */
    static uploadChunk(sessionId: string, chunkIndex: number, chunkData: Buffer): UploadProgress;
    /**
     * Complete chunked upload and assemble file
     */
    static completeChunkedUpload(sessionId: string, uploadType?: 'image' | 'video' | 'audio' | 'document'): Promise<UploadResult>;
    /**
     * Get upload progress for a session
     */
    static getUploadProgress(sessionId: string): UploadProgress | null;
    /**
     * Cancel upload session
     */
    static cancelUploadSession(sessionId: string): boolean;
    /**
     * Get MIME type from file extension
     */
    private static getMimeTypeFromExtension;
    /**
     * Generate thumbnail for images and videos
     */
    static generateThumbnail(mediaId: string, type: MediaType): Promise<string | null>;
}
export {};
//# sourceMappingURL=media.service.d.ts.map