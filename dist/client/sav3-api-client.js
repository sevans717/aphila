"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sav3ApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
class Sav3ApiClient {
    client;
    config;
    authToken = null;
    constructor(config) {
        this.config = {
            timeout: 10000,
            retryAttempts: 3,
            retryDelay: 1000,
            ...config,
        };
        this.client = axios_1.default.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...this.config.headers,
            },
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        // Request interceptor for auth token and request ID
        this.client.interceptors.request.use(async (config) => {
            // Add auth token
            if (this.authToken) {
                config.headers.Authorization = `Bearer ${this.authToken}`;
            }
            // Add request ID for tracking
            config.headers['X-Request-ID'] = this.generateRequestId();
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor for error handling and retries
        this.client.interceptors.response.use((response) => response, async (error) => {
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
                    }
                    catch (tokenError) {
                        // Token refresh failed, reject the original request
                        return Promise.reject(error);
                    }
                }
            }
            // Handle retryable errors (5xx, network errors)
            if (this.shouldRetry(error) && !originalRequest._retryCount) {
                originalRequest._retryCount = 0;
            }
            if (originalRequest._retryCount < this.config.retryAttempts) {
                originalRequest._retryCount++;
                // Wait before retrying
                await this.delay(this.config.retryDelay * originalRequest._retryCount);
                return this.client(originalRequest);
            }
            return Promise.reject(error);
        });
    }
    shouldRetry(error) {
        // Retry on network errors or 5xx status codes
        return !error.response ||
            error.response.status >= 500 ||
            error.code === 'ECONNABORTED' ||
            error.code === 'NETWORK_ERROR';
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Auth methods
    setAuthToken(token) {
        this.authToken = token;
    }
    clearAuthToken() {
        this.authToken = null;
    }
    // Authentication API
    async login(email, password) {
        const response = await this.client.post('/api/v1/auth/login', {
            email,
            password,
        });
        return response.data;
    }
    async register(userData) {
        const response = await this.client.post('/api/v1/auth/register', userData);
        return response.data;
    }
    async refreshToken(refreshToken) {
        const response = await this.client.post('/api/v1/auth/refresh', {
            refreshToken,
        });
        return response.data;
    }
    async logout() {
        const response = await this.client.post('/api/v1/auth/logout');
        this.clearAuthToken();
        return response.data;
    }
    // User API
    async getProfile() {
        const response = await this.client.get('/api/v1/me');
        return response.data;
    }
    async updateProfile(updates) {
        const response = await this.client.put('/api/v1/me', updates);
        return response.data;
    }
    // Geospatial API
    async updateLocation(latitude, longitude) {
        const response = await this.client.post('/api/v1/geospatial/location', {
            latitude,
            longitude,
        });
        return response.data;
    }
    async getNearbyUsers(radius = 5000) {
        const response = await this.client.get('/api/v1/geospatial/nearby/users', {
            params: { radius },
        });
        return response.data;
    }
    async getNearbyEvents(radius = 5000) {
        const response = await this.client.get('/api/v1/geospatial/nearby/events', {
            params: { radius },
        });
        return response.data;
    }
    // Media API
    async uploadMedia(file, type = 'image') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        const response = await this.client.post('/api/v1/media/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (this.config.onProgress && progressEvent.total) {
                    const progress = (progressEvent.loaded / progressEvent.total) * 100;
                    this.config.onProgress(progress);
                }
            },
        });
        return response.data;
    }
    // Chunked upload for large files
    async startChunkedUpload(filename, totalSize, uploadType = 'image') {
        const response = await this.client.post('/api/v1/media/chunked/start', {
            filename,
            totalSize,
            uploadType,
        });
        return response.data;
    }
    async uploadChunk(sessionId, chunkIndex, chunkData) {
        const formData = new FormData();
        formData.append('chunk', chunkData);
        formData.append('sessionId', sessionId);
        formData.append('chunkIndex', chunkIndex.toString());
        const response = await this.client.post('/api/v1/media/chunked/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
    async completeChunkedUpload(sessionId, uploadType = 'image') {
        const response = await this.client.post('/api/v1/media/chunked/complete', {
            sessionId,
            uploadType,
        });
        return response.data;
    }
    async getUploadProgress(sessionId) {
        const response = await this.client.get(`/api/v1/media/chunked/progress/${sessionId}`);
        return response.data.data;
    }
    // Messaging API
    async sendMessage(recipientId, content, type = 'text') {
        const response = await this.client.post('/api/v1/messaging/send', {
            recipientId,
            content,
            type,
        });
        return response.data;
    }
    async getMessages(conversationId, page = 1, limit = 20) {
        const response = await this.client.get('/api/v1/messaging/messages', {
            params: { conversationId, page, limit },
        });
        return response.data;
    }
    // Communities API
    async getCommunities(page = 1, limit = 10) {
        const response = await this.client.get('/api/v1/communities', {
            params: { page, limit },
        });
        return response.data;
    }
    async joinCommunity(communityId) {
        const response = await this.client.post(`/api/v1/communities/${communityId}/join`);
        return response.data;
    }
    async leaveCommunity(communityId) {
        const response = await this.client.post(`/api/v1/communities/${communityId}/leave`);
        return response.data;
    }
    // Real-time fallback API
    async sendMessageFallback(recipientId, content) {
        const response = await this.client.post('/api/v1/realtime/send-message', {
            recipientId,
            content,
        });
        return response.data;
    }
    async updatePresence(status, deviceInfo) {
        const response = await this.client.post('/api/v1/realtime/presence', {
            status,
            deviceInfo,
        });
        return response.data;
    }
    async getQueuedMessages() {
        const response = await this.client.get('/api/v1/realtime/queued-messages');
        return response.data;
    }
    // Batch operations
    async executeBatch(operations) {
        const response = await this.client.post('/api/v1/batch/operations', {
            operations,
        });
        return response.data;
    }
    async syncData(lastSync) {
        const response = await this.client.post('/api/v1/batch/sync', {
            lastSync,
        });
        return response.data;
    }
    async bulkFetch(requests) {
        const response = await this.client.post('/api/v1/batch/fetch', {
            requests,
        });
        return response.data;
    }
    // Push notifications
    async registerDevice(deviceToken, platform) {
        const response = await this.client.post('/api/v1/notifications/register', {
            deviceToken,
            platform,
        });
        return response.data;
    }
    async updateNotificationPreferences(preferences) {
        const response = await this.client.put('/api/v1/notifications/preferences', preferences);
        return response.data;
    }
    // Analytics
    async trackEvent(event, properties) {
        const response = await this.client.post('/api/v1/analytics/events', {
            event,
            properties,
        });
        return response.data;
    }
    // Config
    async getConfig() {
        const response = await this.client.get('/api/v1/config');
        return response.data;
    }
    async getFeatureFlags() {
        const response = await this.client.get('/api/v1/config/features');
        return response.data;
    }
    // Utility methods
    async healthCheck() {
        const response = await this.client.get('/health');
        return response.data;
    }
    // Add custom interceptors
    addRequestInterceptor(interceptor) {
        return this.client.interceptors.request.use(interceptor);
    }
    addResponseInterceptor(interceptor, errorInterceptor) {
        return this.client.interceptors.response.use(interceptor, errorInterceptor);
    }
    // Get the raw axios instance for advanced usage
    getAxiosInstance() {
        return this.client;
    }
}
exports.Sav3ApiClient = Sav3ApiClient;
//# sourceMappingURL=sav3-api-client.js.map