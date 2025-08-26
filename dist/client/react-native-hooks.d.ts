import { ApiResponse, Sav3ApiClient } from './sav3-api-client';
export interface UseApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}
export interface UseApiOptions {
    immediate?: boolean;
    deps?: any[];
    retryAttempts?: number;
    cacheTime?: number;
}
export interface UsePaginationState<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    page: number;
    total: number;
}
export interface UseUploadState {
    uploading: boolean;
    progress: number;
    error: string | null;
    result: any | null;
    upload: (file: File | Blob, type?: string) => Promise<void>;
    cancel: () => void;
}
export interface UseChunkedUploadState {
    uploading: boolean;
    progress: number;
    error: string | null;
    result: any | null;
    sessionId: string | null;
    upload: (file: File | Blob, type?: string) => Promise<void>;
    cancel: () => void;
}
export declare function useApi<T>(apiCall: () => Promise<ApiResponse<T>>, options?: UseApiOptions): UseApiState<T>;
export declare function usePagination<T>(apiCall: (page: number, limit: number) => Promise<ApiResponse<T[]>>, limit?: number): UsePaginationState<T>;
export declare function useUpload(apiClient: Sav3ApiClient): UseUploadState;
export declare function useChunkedUpload(apiClient: Sav3ApiClient): UseChunkedUploadState;
export declare function useRealtime(apiClient: Sav3ApiClient): {
    connected: boolean;
    onlineUsersCount: number;
    updatePresence: (status: "online" | "away" | "offline") => Promise<void>;
    sendMessage: (recipientId: string, content: string) => Promise<any>;
    getQueuedMessages: () => Promise<any>;
};
export declare function useOfflineSync(apiClient: Sav3ApiClient): {
    syncing: boolean;
    lastSync: string | null;
    sync: () => Promise<any>;
};
//# sourceMappingURL=react-native-hooks.d.ts.map