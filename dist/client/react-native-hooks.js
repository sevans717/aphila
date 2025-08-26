"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useApi = useApi;
exports.usePagination = usePagination;
exports.useUpload = useUpload;
exports.useChunkedUpload = useChunkedUpload;
exports.useRealtime = useRealtime;
exports.useOfflineSync = useOfflineSync;
const react_1 = require("react");
// Cache for API responses
const apiCache = new Map();
// Cache helper functions
function getCacheKey(endpoint, params) {
    return `${endpoint}_${JSON.stringify(params || {})}`;
}
function getCachedData(key) {
    const cached = apiCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
    }
    apiCache.delete(key);
    return null;
}
function setCachedData(key, data, ttl = 5 * 60 * 1000) {
    apiCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
    });
}
// Main API hook
function useApi(apiCall, options = {}) {
    const { immediate = true, deps = [], retryAttempts = 3, cacheTime = 5 * 60 * 1000, // 5 minutes
     } = options;
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(immediate);
    const [error, setError] = (0, react_1.useState)(null);
    const isCancelledRef = (0, react_1.useRef)(false);
    const retryCountRef = (0, react_1.useRef)(0);
    const fetchData = (0, react_1.useCallback)(async () => {
        if (isCancelledRef.current)
            return;
        try {
            setLoading(true);
            setError(null);
            const response = await apiCall();
            if (!isCancelledRef.current) {
                if (response.success && response.data) {
                    setData(response.data);
                }
                else {
                    throw new Error(response.error?.message || 'API call failed');
                }
            }
        }
        catch (err) {
            if (!isCancelledRef.current) {
                if (retryCountRef.current < retryAttempts) {
                    retryCountRef.current++;
                    // Exponential backoff
                    const delay = Math.pow(2, retryCountRef.current) * 1000;
                    setTimeout(fetchData, delay);
                    return;
                }
                setError(err.message || 'An error occurred');
            }
        }
        finally {
            if (!isCancelledRef.current) {
                setLoading(false);
            }
        }
    }, [apiCall, retryAttempts]);
    const refresh = (0, react_1.useCallback)(async () => {
        retryCountRef.current = 0;
        await fetchData();
    }, [fetchData]);
    (0, react_1.useEffect)(() => {
        if (immediate) {
            fetchData();
        }
        return () => {
            isCancelledRef.current = true;
        };
    }, deps);
    return { data, loading, error, refresh };
}
// Pagination hook
function usePagination(apiCall, limit = 10) {
    const [data, setData] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [page, setPage] = (0, react_1.useState)(1);
    const [hasMore, setHasMore] = (0, react_1.useState)(true);
    const [total, setTotal] = (0, react_1.useState)(0);
    const isCancelledRef = (0, react_1.useRef)(false);
    const loadPage = (0, react_1.useCallback)(async (pageNum, append = false) => {
        if (isCancelledRef.current)
            return;
        try {
            setLoading(true);
            setError(null);
            const response = await apiCall(pageNum, limit);
            if (!isCancelledRef.current) {
                if (response.success && response.data) {
                    if (append) {
                        setData(prev => [...prev, ...response.data]);
                    }
                    else {
                        setData(response.data);
                    }
                    // Update pagination info
                    if (response.pagination) {
                        setHasMore(response.pagination.hasNext);
                        setTotal(response.pagination.total);
                    }
                    else {
                        setHasMore(response.data.length === limit);
                    }
                }
                else {
                    throw new Error(response.error?.message || 'API call failed');
                }
            }
        }
        catch (err) {
            if (!isCancelledRef.current) {
                setError(err.message || 'An error occurred');
            }
        }
        finally {
            if (!isCancelledRef.current) {
                setLoading(false);
            }
        }
    }, [apiCall, limit]);
    const loadMore = (0, react_1.useCallback)(async () => {
        if (hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            await loadPage(nextPage, true);
        }
    }, [hasMore, loading, page, loadPage]);
    const refresh = (0, react_1.useCallback)(async () => {
        setPage(1);
        await loadPage(1, false);
    }, [loadPage]);
    (0, react_1.useEffect)(() => {
        loadPage(1, false);
        return () => {
            isCancelledRef.current = true;
        };
    }, [loadPage]);
    return { data, loading, error, hasMore, loadMore, refresh, page, total };
}
// File upload hook
function useUpload(apiClient) {
    const [uploading, setUploading] = (0, react_1.useState)(false);
    const [progress, setProgress] = (0, react_1.useState)(0);
    const [error, setError] = (0, react_1.useState)(null);
    const [result, setResult] = (0, react_1.useState)(null);
    const cancelTokenRef = (0, react_1.useRef)(null);
    const upload = (0, react_1.useCallback)(async (file, type = 'image') => {
        try {
            setUploading(true);
            setProgress(0);
            setError(null);
            setResult(null);
            // Set up progress tracking
            const originalOnProgress = apiClient.getAxiosInstance().defaults.onUploadProgress;
            apiClient.getAxiosInstance().defaults.onUploadProgress = (progressEvent) => {
                if (progressEvent.total) {
                    const progress = (progressEvent.loaded / progressEvent.total) * 100;
                    setProgress(Math.round(progress));
                }
            };
            const response = await apiClient.uploadMedia(file, type);
            if (response.success) {
                setResult(response.data);
            }
            else {
                throw new Error(response.error?.message || 'Upload failed');
            }
            // Restore original progress handler
            apiClient.getAxiosInstance().defaults.onUploadProgress = originalOnProgress;
        }
        catch (err) {
            setError(err.message || 'Upload failed');
        }
        finally {
            setUploading(false);
        }
    }, [apiClient]);
    const cancel = (0, react_1.useCallback)(() => {
        if (cancelTokenRef.current) {
            cancelTokenRef.current.cancel('Upload cancelled');
        }
        setUploading(false);
        setProgress(0);
    }, []);
    return { uploading, progress, error, result, upload, cancel };
}
// Chunked upload hook for large files
function useChunkedUpload(apiClient) {
    const [uploading, setUploading] = (0, react_1.useState)(false);
    const [progress, setProgress] = (0, react_1.useState)(0);
    const [error, setError] = (0, react_1.useState)(null);
    const [result, setResult] = (0, react_1.useState)(null);
    const [sessionId, setSessionId] = (0, react_1.useState)(null);
    const isCancelledRef = (0, react_1.useRef)(false);
    const upload = (0, react_1.useCallback)(async (file, type = 'image') => {
        try {
            setUploading(true);
            setProgress(0);
            setError(null);
            setResult(null);
            isCancelledRef.current = false;
            const filename = file.name || `upload.${type}`;
            const totalSize = file.size;
            const chunkSize = 1024 * 1024; // 1MB chunks
            // Start chunked upload session
            const startResponse = await apiClient.startChunkedUpload(filename, totalSize, type);
            if (!startResponse.success) {
                throw new Error(startResponse.error?.message || 'Failed to start upload');
            }
            const sessionId = startResponse.data.sessionId;
            setSessionId(sessionId);
            // Upload chunks
            const totalChunks = Math.ceil(totalSize / chunkSize);
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                if (isCancelledRef.current) {
                    break;
                }
                const start = chunkIndex * chunkSize;
                const end = Math.min(start + chunkSize, totalSize);
                const chunkData = file.slice(start, end);
                const chunkResponse = await apiClient.uploadChunk(sessionId, chunkIndex, chunkData);
                if (chunkResponse.success) {
                    setProgress(chunkResponse.data.progress);
                }
                else {
                    throw new Error(chunkResponse.error?.message || 'Chunk upload failed');
                }
            }
            if (!isCancelledRef.current) {
                // Complete upload
                const completeResponse = await apiClient.completeChunkedUpload(sessionId, type);
                if (completeResponse.success) {
                    setResult(completeResponse.data);
                }
                else {
                    throw new Error(completeResponse.error?.message || 'Failed to complete upload');
                }
            }
        }
        catch (err) {
            setError(err.message || 'Upload failed');
        }
        finally {
            setUploading(false);
            setSessionId(null);
        }
    }, [apiClient]);
    const cancel = (0, react_1.useCallback)(() => {
        isCancelledRef.current = true;
        if (sessionId) {
            // Cancel the upload session on the server
            apiClient.getAxiosInstance().delete(`/api/v1/media/chunked/${sessionId}`).catch(() => {
                // Ignore errors when cancelling
            });
        }
        setUploading(false);
        setProgress(0);
        setSessionId(null);
    }, [apiClient, sessionId]);
    return { uploading, progress, error, result, sessionId, upload, cancel };
}
// Real-time connection hook
function useRealtime(apiClient) {
    const [connected, setConnected] = (0, react_1.useState)(false);
    const [onlineUsersCount, setOnlineUsersCount] = (0, react_1.useState)(0);
    const updatePresence = (0, react_1.useCallback)(async (status) => {
        try {
            await apiClient.updatePresence(status);
        }
        catch (error) {
            console.error('Failed to update presence:', error);
        }
    }, [apiClient]);
    const sendMessage = (0, react_1.useCallback)(async (recipientId, content) => {
        try {
            // Try WebSocket first, fall back to HTTP
            return await apiClient.sendMessageFallback(recipientId, content);
        }
        catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    }, [apiClient]);
    const getQueuedMessages = (0, react_1.useCallback)(async () => {
        try {
            return await apiClient.getQueuedMessages();
        }
        catch (error) {
            console.error('Failed to get queued messages:', error);
            return null;
        }
    }, [apiClient]);
    return {
        connected,
        onlineUsersCount,
        updatePresence,
        sendMessage,
        getQueuedMessages,
    };
}
// Offline sync hook
function useOfflineSync(apiClient) {
    const [syncing, setSyncing] = (0, react_1.useState)(false);
    const [lastSync, setLastSync] = (0, react_1.useState)(null);
    const sync = (0, react_1.useCallback)(async () => {
        if (syncing)
            return;
        try {
            setSyncing(true);
            const syncTime = lastSync || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const response = await apiClient.syncData(syncTime);
            if (response.success) {
                setLastSync(response.data.lastSync);
                return response.data;
            }
        }
        catch (error) {
            console.error('Sync failed:', error);
        }
        finally {
            setSyncing(false);
        }
    }, [apiClient, syncing, lastSync]);
    (0, react_1.useEffect)(() => {
        // Auto-sync on app focus/network reconnection
        sync();
    }, []);
    return { syncing, lastSync, sync };
}
//# sourceMappingURL=react-native-hooks.js.map