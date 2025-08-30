import axios from "axios";

// Types
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
  operation: "create" | "update" | "delete";
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

export interface PresignResponse {
  uploadUrl: string;
  key: string;
  expiresIn: number;
  method: "PUT" | "SERVER";
  headers?: Record<string, string> | null;
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

// Interceptor types
export type RequestInterceptor = (config: any) => any | Promise<any>;
export type ResponseInterceptor = (response: any) => any | Promise<any>;
export type ErrorInterceptor = (error: any) => Promise<any>;

export class Sav3ApiClient {
  private client: any;
  private config: ClientConfig;
  private authToken: string | null = null;

  constructor(config: ClientConfig) {
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...this.config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth token and request ID
    this.client.interceptors.request.use(
      async (config: any) => {
        // Add auth token
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Add request ID for tracking
        config.headers["X-Request-ID"] = this.generateRequestId();

        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Response interceptor for error handling and retries
    this.client.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        const originalRequest = error.config;

        // Handle 401 - token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.config.onTokenExpired) {
            try {
              const newToken = await this.config.onTokenExpired();
              if (newToken) {
                this.setAuthToken(newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return this.client(originalRequest);
              }
            } catch (tokenError) {
              // Token refresh failed, reject the original request
              console.error("Token refresh failed:", tokenError);
              return Promise.reject(error);
            }
          }
        }

        // Handle retryable errors (5xx, network errors)
        if (this.shouldRetry(error) && !originalRequest._retryCount) {
          originalRequest._retryCount = 0;
        }

        if (originalRequest._retryCount < this.config.retryAttempts!) {
          originalRequest._retryCount++;

          // Wait before retrying
          await this.delay(
            this.config.retryDelay! * originalRequest._retryCount
          );

          return this.client(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx status codes
    return (
      !error.response ||
      error.response.status >= 500 ||
      error.code === "ECONNABORTED" ||
      error.code === "NETWORK_ERROR"
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Auth methods
  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  // Authentication API
  async login(email: string, password: string) {
    const response = await this.client.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  }

  async register(userData: {
    email: string;
    password: string;
    username: string;
    firstName?: string;
    lastName?: string;
  }) {
    const response = await this.client.post("/auth/register", userData);
    return response.data;
  }

  async refreshToken(refreshToken: string) {
    const response = await this.client.post("/auth/refresh", {
      refreshToken,
    });
    return response.data;
  }

  async logout() {
    const response = await this.client.post("/auth/logout");
    this.clearAuthToken();
    return response.data;
  }

  // User API
  async getProfile() {
    const response = await this.client.get("/me");
    return response.data;
  }

  async updateProfile(updates: any) {
    const response = await this.client.put("/me", updates);
    return response.data;
  }

  // Geospatial API
  async updateLocation(latitude: number, longitude: number) {
    const response = await this.client.post("/geospatial/location", {
      latitude,
      longitude,
    });
    return response.data;
  }

  async getNearbyUsers(radius: number = 5000) {
    const response = await this.client.get("/geospatial/nearby/users", {
      params: { radius },
    });
    return response.data;
  }

  async getNearbyEvents(radius: number = 5000) {
    const response = await this.client.get("/geospatial/nearby/events", {
      params: { radius },
    });
    return response.data;
  }

  // Media API
  async uploadMedia(
    file: File | Blob,
    type: "image" | "video" | "audio" | "document" = "image"
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await this.client.post("/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent: any) => {
        if (this.config.onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          this.config.onProgress(progress);
        }
      },
    });
    return response.data;
  }

  // Presign + direct upload helpers
  async presignUpload(
    filename: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<PresignResponse> {
    const response = await this.client.post("/media/presign", {
      filename,
      contentType,
      expiresIn,
    });
    return response.data.data as PresignResponse;
  }

  async uploadToPresignedUrl(
    uploadUrl: string,
    file: File | Blob,
    headers?: Record<string, string>,
    onProgress?: (progress: number) => void
  ) {
    // Use axios directly to upload to the full URL returned by presign
    const response = await axios.put(uploadUrl, file, {
      headers: {
        ...(headers || {}),
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
    } as any);

    return response.status >= 200 && response.status < 300;
  }

  // Chunked upload for large files
  async startChunkedUpload(
    filename: string,
    totalSize: number,
    uploadType: "image" | "video" | "audio" | "document" = "image"
  ) {
    const response = await this.client.post("/media/chunked/start", {
      filename,
      totalSize,
      uploadType,
    });
    return response.data;
  }

  async uploadChunk(sessionId: string, chunkIndex: number, chunkData: Blob) {
    const formData = new FormData();
    formData.append("chunk", chunkData);
    formData.append("sessionId", sessionId);
    formData.append("chunkIndex", chunkIndex.toString());

    const response = await this.client.post("/media/chunked/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  async completeChunkedUpload(
    sessionId: string,
    uploadType: "image" | "video" | "audio" | "document" = "image"
  ) {
    const response = await this.client.post("/media/chunked/complete", {
      sessionId,
      uploadType,
    });
    return response.data;
  }

  async getUploadProgress(sessionId: string): Promise<UploadProgress> {
    const response = await this.client.get(
      `/media/chunked/progress/${sessionId}`
    );
    return response.data.data;
  }

  // Messaging API
  async sendMessage(
    recipientId: string,
    content: string,
    type: "text" | "image" | "file" = "text"
  ) {
    const response = await this.client.post("/messaging/send", {
      recipientId,
      content,
      type,
    });
    return response.data;
  }

  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const response = await this.client.get("/messaging/messages", {
      params: { conversationId, page, limit },
    });
    return response.data;
  }

  // Communities API
  async getCommunities(page: number = 1, limit: number = 10) {
    const response = await this.client.get("/communities", {
      params: { page, limit },
    });
    return response.data;
  }

  async joinCommunity(communityId: string) {
    const response = await this.client.post(`/communities/${communityId}/join`);
    return response.data;
  }

  async leaveCommunity(communityId: string) {
    const response = await this.client.post(
      `/communities/${communityId}/leave`
    );
    return response.data;
  }

  // Real-time fallback API
  async sendMessageFallback(recipientId: string, content: string) {
    const response = await this.client.post("/realtime/send-message", {
      recipientId,
      content,
    });
    return response.data;
  }

  async updatePresence(
    status: "online" | "away" | "offline",
    deviceInfo?: any
  ) {
    const response = await this.client.post("/realtime/presence", {
      status,
      deviceInfo,
    });
    return response.data;
  }

  async getQueuedMessages() {
    const response = await this.client.get("/realtime/queued-messages");
    return response.data;
  }

  // Batch operations
  async executeBatch(operations: BatchOperation[]) {
    const response = await this.client.post("/batch/operations", {
      operations,
    });
    return response.data;
  }

  async syncData(lastSync: string) {
    const response = await this.client.post("/batch/sync", {
      lastSync,
    });
    return response.data;
  }

  async bulkFetch(requests: { resource: string; ids: string[] }[]) {
    const response = await this.client.post("/batch/fetch", {
      requests,
    });
    return response.data;
  }

  // Push notifications
  async registerDevice(deviceToken: string, platform: "ios" | "android") {
    const response = await this.client.post("/notifications/register", {
      deviceToken,
      platform,
    });
    return response.data;
  }

  async updateNotificationPreferences(preferences: any) {
    const response = await this.client.put(
      "/notifications/preferences",
      preferences
    );
    return response.data;
  }

  // Analytics
  async trackEvent(event: string, properties?: any) {
    const response = await this.client.post("/analytics/events", {
      event,
      properties,
    });
    return response.data;
  }

  // Config
  async getConfig() {
    const response = await this.client.get("/config");
    return response.data;
  }

  async getFeatureFlags() {
    const response = await this.client.get("/config/features");
    return response.data;
  }

  // Utility methods
  async healthCheck() {
    const response = await this.client.get("/health");
    return response.data;
  }

  // Add custom interceptors
  addRequestInterceptor(interceptor: RequestInterceptor) {
    return this.client.interceptors.request.use(interceptor);
  }

  addResponseInterceptor(
    interceptor: ResponseInterceptor,
    errorInterceptor?: ErrorInterceptor
  ) {
    return this.client.interceptors.response.use(interceptor, errorInterceptor);
  }

  // Get the raw axios instance for advanced usage
  getAxiosInstance(): any {
    return this.client;
  }
}
