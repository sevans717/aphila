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
    private static minioClient;
    private static mediaProxyUrl;
    private static uploadSessions;
    static initializeUploadDir(): Promise<void>;
    static uploadFile(file: FileUpload, userId: string, _uploadType?: string): Promise<UploadResult>;
    static deleteFile(url: string): Promise<void>;
    private static uploadToMinIO;
    private static uploadViaMediaProxy;
    private static deleteViaMediaProxy;
    private static extractKeyFromMinIOUrl;
    private static extractKeyFromMediaProxyUrl;
    private static getMediaType;
    private static extractImageMetadata;
    private static extractVideoMetadata;
    static uploadProfilePhoto(file: FileUpload, userId: string, isPrimary?: boolean): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        url: string;
        isPrimary: boolean;
        order: number;
    }>;
    static getUserMedia(userId: string, options?: {
        type?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.MediaType;
        createdAt: Date;
        duration: number | null;
        url: string;
        isFavorite: boolean;
        usedInProfile: boolean;
        width: number | null;
        height: number | null;
    }[]>;
    static deleteMedia(mediaId: string, userId: string): Promise<any>;
    static getSignedUrl(key: string, expiresIn?: number): Promise<string>;
    /**
     * Generate a presigned upload URL for direct uploads.
     * Supports MinIO and server-side fallback.
     */
    static generatePresignedUploadUrl(userId: string, filename: string, contentType: string, expiresIn?: number): Promise<{
        uploadUrl: string;
        key: string;
        expiresIn: number;
        method: "PUT" | "POST" | "SERVER";
        headers?: Record<string, string> | null;
    }>;
    static getMediaById(mediaId: string): Promise<({
        user: {
            id: string;
            profile: {
                displayName: string;
            } | null;
        };
    } & {
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.MediaType;
        createdAt: Date;
        duration: number | null;
        url: string;
        isFavorite: boolean;
        usedInProfile: boolean;
        width: number | null;
        height: number | null;
    }) | null>;
    /**
     * Update media metadata
     */
    static updateMediaMetadata(mediaId: string, userId: string, metadata: {
        isFavorite?: boolean;
        usedInProfile?: boolean;
    }): Promise<any>;
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