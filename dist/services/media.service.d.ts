interface UploadResult {
    id: string;
    url: string;
    type: string;
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
    static uploadProfilePhoto(file: FileUpload, userId: string, isPrimary?: boolean): Promise<any>;
    static getUserMedia(userId: string, options?: {
        type?: string;
        limit?: number;
        offset?: number;
    }): Promise<any>;
    static deleteMedia(mediaId: string, userId: string): Promise<any>;
    static getSignedUrl(key: string, expiresIn?: number): Promise<string>;
    static getMediaById(mediaId: string): Promise<any>;
    static updateMediaMetadata(mediaId: string, userId: string, metadata: {
        isFavorite?: boolean;
        usedInProfile?: boolean;
    }): Promise<any>;
    static getFileInfo(filename: string): Promise<string>;
    static cleanupOldFiles(olderThanDays?: number): Promise<{
        cleaned: number;
    }>;
    static getUploadStats(userId?: string): Promise<{
        total: any;
        byType: any;
        recentUploads: any;
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
    static completeChunkedUpload(sessionId: string, uploadType?: "image" | "video" | "audio" | "document"): Promise<UploadResult>;
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
    static generateThumbnail(mediaId: string, type: string): Promise<string | null>;
}
export {};
//# sourceMappingURL=media.service.d.ts.map