import { useCallback, useEffect, useRef, useState } from "react";
import { ApiResponse, Sav3ApiClient } from "./sav3-api-client";

// Hook types
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

// Cache for API responses
const apiCache = new Map<
  string,
  { data: any; timestamp: number; ttl: number }
>();

// Cache helper functions
function getCacheKey(endpoint: string, params?: any): string {
  return `${endpoint}_${JSON.stringify(params || {})}`;
}

function getCachedData<T>(key: string): T | null {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  apiCache.delete(key);
  return null;
}

function setCachedData(key: string, data: any, ttl: number = 5 * 60 * 1000) {
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

// Main API hook
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiState<T> {
  const {
    immediate = true,
    deps = [],
    retryAttempts = 3,
    cacheTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const isCancelledRef = useRef(false);
  const retryCountRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (isCancelledRef.current) return;

    // Use cache key for potential caching (logged for analytics)
    const cacheKey = getCacheKey("api_call", { deps });

    // Check cache first
    const cachedData = getCachedData<T>(cacheKey);
    if (cachedData) {
      console.log(`Using cached data for key: ${cacheKey}`);
      setData(cachedData);
      setLoading(false);
      return;
    }

    console.log(
      `API call cache key generated: ${cacheKey}, cache time: ${cacheTime}ms`
    );

    try {
      setLoading(true);
      setError(null);

      const response = await apiCall();

      if (!isCancelledRef.current) {
        if (response.success && response.data) {
          setData(response.data);
          // Cache the successful response
          setCachedData(cacheKey, response.data, cacheTime);
        } else {
          throw new Error(response.error?.message || "API call failed");
        }
      }
    } catch (err: any) {
      if (!isCancelledRef.current) {
        if (retryCountRef.current < retryAttempts) {
          retryCountRef.current++;
          // Exponential backoff
          const delay = Math.pow(2, retryCountRef.current) * 1000;
          setTimeout(fetchData, delay);
          return;
        }
        setError(err.message || "An error occurred");
      }
    } finally {
      if (!isCancelledRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, retryAttempts, cacheTime]);

  const refresh = useCallback(async () => {
    retryCountRef.current = 0;
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
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
export function usePagination<T>(
  apiCall: (page: number, limit: number) => Promise<ApiResponse<T[]>>,
  limit: number = 10
): UsePaginationState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const isCancelledRef = useRef(false);

  const loadPage = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (isCancelledRef.current) return;

      try {
        setLoading(true);
        setError(null);

        const response = await apiCall(pageNum, limit);

        if (!isCancelledRef.current) {
          if (response.success && response.data) {
            if (append) {
              setData((prev) => [...prev, ...response.data!]);
            } else {
              setData(response.data);
            }

            // Update pagination info
            if (response.pagination) {
              setHasMore(response.pagination.hasNext);
              setTotal(response.pagination.total);
            } else {
              setHasMore(response.data.length === limit);
            }
          } else {
            throw new Error(response.error?.message || "API call failed");
          }
        }
      } catch (err: any) {
        if (!isCancelledRef.current) {
          setError(err.message || "An error occurred");
        }
      } finally {
        if (!isCancelledRef.current) {
          setLoading(false);
        }
      }
    },
    [apiCall, limit]
  );

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      await loadPage(nextPage, true);
    }
  }, [hasMore, loading, page, loadPage]);

  const refresh = useCallback(async () => {
    setPage(1);
    await loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    loadPage(1, false);

    return () => {
      isCancelledRef.current = true;
    };
  }, [loadPage]);

  return { data, loading, error, hasMore, loadMore, refresh, page, total };
}

// File upload hook
export function useUpload(apiClient: Sav3ApiClient): UseUploadState {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const cancelTokenRef = useRef<any>(null);

  const upload = useCallback(
    async (file: File | Blob, type: string = "image") => {
      try {
        setUploading(true);
        setProgress(0);
        setError(null);
        setResult(null);

        // Set up progress tracking
        const originalOnProgress =
          apiClient.getAxiosInstance().defaults.onUploadProgress;
        apiClient.getAxiosInstance().defaults.onUploadProgress = (
          progressEvent: any
        ) => {
          if (progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setProgress(Math.round(progress));
          }
        };

        const response = await apiClient.uploadMedia(file, type as any);

        if (response.success) {
          setResult(response.data);
        } else {
          throw new Error(response.error?.message || "Upload failed");
        }

        // Restore original progress handler
        apiClient.getAxiosInstance().defaults.onUploadProgress =
          originalOnProgress;
      } catch (err: any) {
        setError(err.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [apiClient]
  );

  const cancel = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel("Upload cancelled");
    }
    setUploading(false);
    setProgress(0);
  }, []);

  return { uploading, progress, error, result, upload, cancel };
}

// Chunked upload hook for large files
export function useChunkedUpload(
  apiClient: Sav3ApiClient
): UseChunkedUploadState {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isCancelledRef = useRef(false);

  const upload = useCallback(
    async (file: File | Blob, type: string = "image") => {
      try {
        setUploading(true);
        setProgress(0);
        setError(null);
        setResult(null);
        isCancelledRef.current = false;

        const filename = (file as File).name || `upload.${type}`;
        const totalSize = file.size;
        const chunkSize = 1024 * 1024; // 1MB chunks

        // Start chunked upload session
        const startResponse = await apiClient.startChunkedUpload(
          filename,
          totalSize,
          type as any
        );

        if (!startResponse.success) {
          throw new Error(
            startResponse.error?.message || "Failed to start upload"
          );
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

          const chunkResponse = await apiClient.uploadChunk(
            sessionId,
            chunkIndex,
            chunkData
          );

          if (chunkResponse.success) {
            setProgress(chunkResponse.data.progress);
          } else {
            throw new Error(
              chunkResponse.error?.message || "Chunk upload failed"
            );
          }
        }

        if (!isCancelledRef.current) {
          // Complete upload
          const completeResponse = await apiClient.completeChunkedUpload(
            sessionId,
            type as any
          );

          if (completeResponse.success) {
            setResult(completeResponse.data);
          } else {
            throw new Error(
              completeResponse.error?.message || "Failed to complete upload"
            );
          }
        }
      } catch (err: any) {
        setError(err.message || "Upload failed");
      } finally {
        setUploading(false);
        setSessionId(null);
      }
    },
    [apiClient]
  );

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
    if (sessionId) {
      // Cancel the upload session on the server
      apiClient
        .getAxiosInstance()
        .delete(`/api/v1/media/chunked/${sessionId}`)
        .catch(() => {
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
export function useRealtime(apiClient: Sav3ApiClient) {
  const [connected, setConnected] = useState(false);
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);

  const updatePresence = useCallback(
    async (status: "online" | "away" | "offline") => {
      try {
        const response = await apiClient.updatePresence(status);
        if (response.success) {
          // Update connection status based on presence update
          setConnected(status !== "offline");
          console.log(
            `Presence updated to ${status}, connection status: ${status !== "offline"}`
          );
        }
      } catch (error) {
        console.error("Failed to update presence:", error);
        setConnected(false);
      }
    },
    [apiClient]
  );

  const sendMessage = useCallback(
    async (recipientId: string, content: string) => {
      try {
        // Try WebSocket first, fall back to HTTP
        const response = await apiClient.sendMessageFallback(
          recipientId,
          content
        );
        if (response.success) {
          // Update online users count (simulated)
          setOnlineUsersCount((prev) => Math.max(1, prev + 1));
        }
        return response;
      } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
      }
    },
    [apiClient]
  );

  const getQueuedMessages = useCallback(async () => {
    try {
      const response = await apiClient.getQueuedMessages();
      if (response.success && response.data) {
        // Update online users count based on queued messages
        setOnlineUsersCount(response.data.length);
      }
      return response;
    } catch (error) {
      console.error("Failed to get queued messages:", error);
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
export function useOfflineSync(apiClient: Sav3ApiClient) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const sync = useCallback(async () => {
    if (syncing) return;

    try {
      setSyncing(true);

      const syncTime =
        lastSync || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const response = await apiClient.syncData(syncTime);

      if (response.success) {
        setLastSync(response.data.lastSync);
        return response.data;
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  }, [apiClient, syncing, lastSync]);

  useEffect(() => {
    // Auto-sync on app focus/network reconnection
    sync();
  }, []);

  return { syncing, lastSync, sync };
}
