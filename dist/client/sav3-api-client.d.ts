import { AxiosInstance, AxiosResponse } from 'axios';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
        retryable?: boolean;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
        version: string;
        responseTime?: number;
    };
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface BatchOperation {
    id: string;
    operation: 'create' | 'update' | 'delete';
    resource: string;
    data?: any;
    params?: any;
}
export interface UploadProgress {
    sessionId: string;
    progress: number;
    uploadedBytes: number;
    totalBytes: number;
    estimatedTimeRemaining?: number;
}
export interface ClientConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
    retryAttempts?: number;
    retryDelay?: number;
    onTokenExpired?: () => Promise<string | null>;
    onProgress?: (progress: number) => void;
}
export type RequestInterceptor = (config: any) => any | Promise<any>;
export type ResponseInterceptor = (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
export type ErrorInterceptor = (error: any) => Promise<any>;
export declare class Sav3ApiClient {
    private client;
    private config;
    private authToken;
    constructor(config: ClientConfig);
    private setupInterceptors;
    private shouldRetry;
    private delay;
    private generateRequestId;
    setAuthToken(token: string): void;
    clearAuthToken(): void;
    login(email: string, password: string): Promise<any>;
    register(userData: {
        email: string;
        password: string;
        username: string;
        firstName?: string;
        lastName?: string;
    }): Promise<any>;
    refreshToken(refreshToken: string): Promise<any>;
    logout(): Promise<any>;
    getProfile(): Promise<any>;
    updateProfile(updates: any): Promise<any>;
    updateLocation(latitude: number, longitude: number): Promise<any>;
    getNearbyUsers(radius?: number): Promise<any>;
    getNearbyEvents(radius?: number): Promise<any>;
    uploadMedia(file: File | Blob, type?: 'image' | 'video' | 'audio' | 'document'): Promise<any>;
    startChunkedUpload(filename: string, totalSize: number, uploadType?: 'image' | 'video' | 'audio' | 'document'): Promise<any>;
    uploadChunk(sessionId: string, chunkIndex: number, chunkData: Blob): Promise<any>;
    completeChunkedUpload(sessionId: string, uploadType?: 'image' | 'video' | 'audio' | 'document'): Promise<any>;
    getUploadProgress(sessionId: string): Promise<UploadProgress>;
    sendMessage(recipientId: string, content: string, type?: 'text' | 'image' | 'file'): Promise<any>;
    getMessages(conversationId: string, page?: number, limit?: number): Promise<any>;
    getCommunities(page?: number, limit?: number): Promise<any>;
    joinCommunity(communityId: string): Promise<any>;
    leaveCommunity(communityId: string): Promise<any>;
    sendMessageFallback(recipientId: string, content: string): Promise<any>;
    updatePresence(status: 'online' | 'away' | 'offline', deviceInfo?: any): Promise<any>;
    getQueuedMessages(): Promise<any>;
    executeBatch(operations: BatchOperation[]): Promise<any>;
    syncData(lastSync: string): Promise<any>;
    bulkFetch(requests: {
        resource: string;
        ids: string[];
    }[]): Promise<any>;
    registerDevice(deviceToken: string, platform: 'ios' | 'android'): Promise<any>;
    updateNotificationPreferences(preferences: any): Promise<any>;
    trackEvent(event: string, properties?: any): Promise<any>;
    getConfig(): Promise<any>;
    getFeatureFlags(): Promise<any>;
    healthCheck(): Promise<any>;
    addRequestInterceptor(interceptor: RequestInterceptor): number;
    addResponseInterceptor(interceptor: ResponseInterceptor, errorInterceptor?: ErrorInterceptor): number;
    getAxiosInstance(): AxiosInstance;
}
//# sourceMappingURL=sav3-api-client.d.ts.map