import axios from "axios";
import type {
  ApiResponse,
  User,
  AuthTokens,
  LoginForm,
  RegisterForm,
  Post,
  PostForm,
  Comment,
  Community,
  Category,
  Conversation,
  Message,
  Notification,
  MediaItem,
  Location,
  NearbyUser,
  SearchResult,
  SearchFilters,
} from "../types/index.js";

// Define axios instance type with proper generics
type AxiosInstance = ReturnType<typeof axios.create>;

export class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor(baseURL: string = "http://localhost:3002") {
    this.client = axios.create({
      baseURL: `${baseURL}/api/v1`,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: any) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        config.headers["X-Request-ID"] = this.generateRequestId();
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: any) => response.data,
      async (error: any) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearAuth();
            throw refreshError;
          }
        }

        throw error;
      }
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Auth Management
  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem("sav3_auth_token", token);
  }

  clearAuth() {
    this.authToken = null;
    localStorage.removeItem("sav3_auth_token");
    localStorage.removeItem("sav3_refresh_token");
  }

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  async login(
    data: LoginForm
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = (await this.client.post(
      "/auth/login",
      data
    )) as unknown as ApiResponse<{ user: User; tokens: AuthTokens }>;
    if (response.success && response.data?.tokens) {
      this.setAuthToken(response.data.tokens.accessToken);
      localStorage.setItem(
        "sav3_refresh_token",
        response.data.tokens.refreshToken
      );
    }
    return response;
  }

  async register(
    data: RegisterForm
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = (await this.client.post(
      "/auth/register",
      data
    )) as unknown as ApiResponse<{ user: User; tokens: AuthTokens }>;
    if (response.success && response.data?.tokens) {
      this.setAuthToken(response.data.tokens.accessToken);
      localStorage.setItem(
        "sav3_refresh_token",
        response.data.tokens.refreshToken
      );
    }
    return response;
  }

  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    const refreshToken = localStorage.getItem("sav3_refresh_token");
    if (!refreshToken) throw new Error("No refresh token available");

    const response = (await this.client.post("/auth/refresh", {
      refreshToken,
    })) as unknown as ApiResponse<AuthTokens>;
    if (response.success && response.data) {
      this.setAuthToken(response.data.accessToken);
      localStorage.setItem("sav3_refresh_token", response.data.refreshToken);
    }
    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = (await this.client.post(
      "/auth/logout"
    )) as unknown as ApiResponse;
    this.clearAuth();
    return response;
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    const response = (await this.client.post("/auth/forgot-password", {
      email,
    })) as unknown as ApiResponse;
    return response;
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    const response = (await this.client.post("/auth/reset-password", {
      token,
      password,
    })) as unknown as ApiResponse;
    return response;
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    const response = (await this.client.post("/auth/verify-email", {
      token,
    })) as unknown as ApiResponse;
    return response;
  }

  // ==========================================
  // USER ENDPOINTS
  // ==========================================

  async getProfile(): Promise<ApiResponse<User>> {
    const response = (await this.client.get(
      "/me"
    )) as unknown as ApiResponse<User>;
    return response;
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    const response = (await this.client.put(
      "/me",
      updates
    )) as unknown as ApiResponse<User>;
    return response;
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    const response = (await this.client.get(
      `/users/${userId}`
    )) as unknown as ApiResponse<User>;
    return response;
  }

  async getUserByUsername(username: string): Promise<ApiResponse<User>> {
    const response = (await this.client.get(
      `/users/username/${username}`
    )) as unknown as ApiResponse<User>;
    return response;
  }

  async followUser(userId: string): Promise<ApiResponse> {
    const response = (await this.client.post(
      `/users/${userId}/follow`
    )) as unknown as ApiResponse;
    return response;
  }

  async unfollowUser(userId: string): Promise<ApiResponse> {
    const response = (await this.client.delete(
      `/users/${userId}/follow`
    )) as unknown as ApiResponse;
    return response;
  }

  async getFollowers(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<User[]>> {
    const response = (await this.client.get(`/users/${userId}/followers`, {
      params: { page, limit },
    })) as unknown as ApiResponse<User[]>;
    return response;
  }

  async getFollowing(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<User[]>> {
    const response = (await this.client.get(`/users/${userId}/following`, {
      params: { page, limit },
    })) as unknown as ApiResponse<User[]>;
    return response;
  }

  // ==========================================
  // POSTS ENDPOINTS
  // ==========================================

  async getFeed(page = 1, limit = 20): Promise<ApiResponse<Post[]>> {
    const response = (await this.client.get("/posts/feed", {
      params: { page, limit },
    })) as unknown as ApiResponse<Post[]>;
    return response;
  }

  async getPostById(postId: string): Promise<ApiResponse<Post>> {
    const response = (await this.client.get(
      `/posts/${postId}`
    )) as unknown as ApiResponse<Post>;
    return response;
  }

  async createPost(data: PostForm): Promise<ApiResponse<Post>> {
    const formData = new FormData();
    formData.append("content", data.content);
    formData.append("visibility", data.visibility);

    if (data.categories) {
      data.categories.forEach((cat: any) =>
        formData.append("categories[]", cat)
      );
    }

    if (data.location) {
      formData.append("location", JSON.stringify(data.location));
    }

    if (data.communityId) {
      formData.append("communityId", data.communityId);
    }

    if (data.mediaFiles) {
      data.mediaFiles.forEach((file: any) => formData.append("media", file));
    }

    const response = (await this.client.post("/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })) as unknown as ApiResponse<Post>;
    return response;
  }

  async updatePost(
    postId: string,
    updates: Partial<PostForm>
  ): Promise<ApiResponse<Post>> {
    const response = (await this.client.put(
      `/posts/${postId}`,
      updates
    )) as unknown as ApiResponse<Post>;
    return response;
  }

  async deletePost(postId: string): Promise<ApiResponse> {
    const response = (await this.client.delete(
      `/posts/${postId}`
    )) as unknown as ApiResponse;
    return response;
  }

  async likePost(postId: string): Promise<ApiResponse> {
    const response = (await this.client.post(
      `/posts/${postId}/like`
    )) as unknown as ApiResponse;
    return response;
  }

  async unlikePost(postId: string): Promise<ApiResponse> {
    const response = (await this.client.delete(
      `/posts/${postId}/like`
    )) as unknown as ApiResponse;
    return response;
  }

  async sharePost(
    postId: string,
    content?: string
  ): Promise<ApiResponse<Post>> {
    const response = (await this.client.post(`/posts/${postId}/share`, {
      content,
    })) as unknown as ApiResponse<Post>;
    return response;
  }

  async getPostComments(
    postId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<Comment[]>> {
    const response = (await this.client.get(`/posts/${postId}/comments`, {
      params: { page, limit },
    })) as unknown as ApiResponse<Comment[]>;
    return response;
  }

  async createComment(
    postId: string,
    content: string,
    parentId?: string
  ): Promise<ApiResponse<Comment>> {
    const response = (await this.client.post(`/posts/${postId}/comments`, {
      content,
      parentId,
    })) as unknown as ApiResponse<Comment>;
    return response;
  }

  async getUserPosts(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<Post[]>> {
    const response = (await this.client.get(`/users/${userId}/posts`, {
      params: { page, limit },
    })) as unknown as ApiResponse<Post[]>;
    return response;
  }

  // ==========================================
  // MEDIA ENDPOINTS
  // ==========================================

  async uploadMedia(
    file: File,
    type: "image" | "video" | "audio" | "document" = "image"
  ): Promise<ApiResponse<MediaItem>> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = (await this.client.post("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })) as unknown as ApiResponse<MediaItem>;
    return response;
  }

  async getMediaItem(mediaId: string): Promise<ApiResponse<MediaItem>> {
    const response = (await this.client.get(
      `/media/${mediaId}`
    )) as unknown as ApiResponse<MediaItem>;
    return response;
  }

  async deleteMediaItem(mediaId: string): Promise<ApiResponse> {
    const response = (await this.client.delete(
      `/media/${mediaId}`
    )) as unknown as ApiResponse;
    return response;
  }

  async getUserMedia(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<MediaItem[]>> {
    const response = (await this.client.get(`/users/${userId}/media`, {
      params: { page, limit },
    })) as unknown as ApiResponse<MediaItem[]>;
    return response;
  }

  // ==========================================
  // MESSAGING ENDPOINTS
  // ==========================================

  async getConversations(
    page = 1,
    limit = 20
  ): Promise<ApiResponse<Conversation[]>> {
    const response = (await this.client.get("/conversations", {
      params: { page, limit },
    })) as unknown as ApiResponse<Conversation[]>;
    return response;
  }

  async getOrCreateConversation(
    participantIds: string[]
  ): Promise<ApiResponse<Conversation>> {
    const response = (await this.client.post("/conversations", {
      participantIds,
    })) as unknown as ApiResponse<Conversation>;
    return response;
  }

  async getConversationMessages(
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<ApiResponse<Message[]>> {
    const response = (await this.client.get(
      `/conversations/${conversationId}/messages`,
      {
        params: { page, limit },
      }
    )) as unknown as ApiResponse<Message[]>;
    return response;
  }

  async sendMessage(
    conversationId: string,
    content: string,
    type: "text" | "image" | "file" | "audio" = "text",
    mediaUrl?: string
  ): Promise<ApiResponse<Message>> {
    const response = (await this.client.post(
      `/conversations/${conversationId}/messages`,
      {
        content,
        type,
        mediaUrl,
      }
    )) as unknown as ApiResponse<Message>;
    return response;
  }

  async markMessagesAsRead(
    conversationId: string,
    messageIds: string[]
  ): Promise<ApiResponse> {
    const response = (await this.client.put(
      `/conversations/${conversationId}/read`,
      {
        messageIds,
      }
    )) as unknown as ApiResponse;
    return response;
  }

  // ==========================================
  // COMMUNITY ENDPOINTS
  // ==========================================

  async getCommunities(
    page = 1,
    limit = 20,
    category?: string
  ): Promise<ApiResponse<Community[]>> {
    const response = (await this.client.get("/communities", {
      params: { page, limit, category },
    })) as unknown as ApiResponse<Community[]>;
    return response;
  }

  async getCommunityById(communityId: string): Promise<ApiResponse<Community>> {
    const response = (await this.client.get(
      `/communities/${communityId}`
    )) as unknown as ApiResponse<Community>;
    return response;
  }

  async createCommunity(
    data: Partial<Community>
  ): Promise<ApiResponse<Community>> {
    const response = (await this.client.post(
      "/communities",
      data
    )) as unknown as ApiResponse<Community>;
    return response;
  }

  async updateCommunity(
    communityId: string,
    updates: Partial<Community>
  ): Promise<ApiResponse<Community>> {
    const response = (await this.client.put(
      `/communities/${communityId}`,
      updates
    )) as unknown as ApiResponse<Community>;
    return response;
  }

  async joinCommunity(communityId: string): Promise<ApiResponse> {
    const response = (await this.client.post(
      `/communities/${communityId}/join`
    )) as unknown as ApiResponse;
    return response;
  }

  async leaveCommunity(communityId: string): Promise<ApiResponse> {
    const response = (await this.client.post(
      `/communities/${communityId}/leave`
    )) as unknown as ApiResponse;
    return response;
  }

  async getCommunityMembers(
    communityId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<User[]>> {
    const response = (await this.client.get(
      `/communities/${communityId}/members`,
      {
        params: { page, limit },
      }
    )) as unknown as ApiResponse<User[]>;
    return response;
  }

  async getCommunityPosts(
    communityId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<Post[]>> {
    const response = (await this.client.get(
      `/communities/${communityId}/posts`,
      {
        params: { page, limit },
      }
    )) as unknown as ApiResponse<Post[]>;
    return response;
  }

  // ==========================================
  // CATEGORY ENDPOINTS
  // ==========================================

  async getCategories(): Promise<ApiResponse<Category[]>> {
    const response = (await this.client.get(
      "/categories"
    )) as unknown as ApiResponse<Category[]>;
    return response;
  }

  async getCategoryById(categoryId: string): Promise<ApiResponse<Category>> {
    const response = (await this.client.get(
      `/categories/${categoryId}`
    )) as unknown as ApiResponse<Category>;
    return response;
  }

  async getCategoryPosts(
    categoryId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<Post[]>> {
    const response = (await this.client.get(`/categories/${categoryId}/posts`, {
      params: { page, limit },
    })) as unknown as ApiResponse<Post[]>;
    return response;
  }

  // ==========================================
  // GEOSPATIAL ENDPOINTS
  // ==========================================

  async updateLocation(location: Location): Promise<ApiResponse> {
    const response = (await this.client.post(
      "/geospatial/location",
      location
    )) as unknown as ApiResponse;
    return response;
  }

  async getNearbyUsers(
    radius = 5000,
    limit = 50
  ): Promise<ApiResponse<NearbyUser[]>> {
    const response = (await this.client.get("/geospatial/nearby/users", {
      params: { radius, limit },
    })) as unknown as ApiResponse<NearbyUser[]>;
    return response;
  }

  async getNearbyPosts(
    radius = 5000,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<Post[]>> {
    const response = (await this.client.get("/geospatial/nearby/posts", {
      params: { radius, page, limit },
    })) as unknown as ApiResponse<Post[]>;
    return response;
  }

  async getNearbyEvents(
    radius = 5000,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<any[]>> {
    const response = (await this.client.get("/geospatial/nearby/events", {
      params: { radius, page, limit },
    })) as unknown as ApiResponse<any[]>;
    return response;
  }

  // ==========================================
  // SEARCH ENDPOINTS
  // ==========================================

  async search(
    query: string,
    filters?: SearchFilters,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<SearchResult[]>> {
    const response = (await this.client.post("/search", {
      query,
      filters,
      page,
      limit,
    })) as unknown as ApiResponse<SearchResult[]>;
    return response;
  }

  async searchUsers(
    query: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<User[]>> {
    const response = (await this.client.get("/search/users", {
      params: { q: query, page, limit },
    })) as unknown as ApiResponse<User[]>;
    return response;
  }

  async searchPosts(
    query: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<Post[]>> {
    const response = (await this.client.get("/search/posts", {
      params: { q: query, page, limit },
    })) as unknown as ApiResponse<Post[]>;
    return response;
  }

  async searchCommunities(
    query: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<Community[]>> {
    const response = (await this.client.get("/search/communities", {
      params: { q: query, page, limit },
    })) as unknown as ApiResponse<Community[]>;
    return response;
  }

  // ==========================================
  // NOTIFICATION ENDPOINTS
  // ==========================================

  async getNotifications(
    page = 1,
    limit = 20
  ): Promise<ApiResponse<Notification[]>> {
    const response = (await this.client.get("/notifications", {
      params: { page, limit },
    })) as unknown as ApiResponse<Notification[]>;
    return response;
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    const response = (await this.client.put(
      `/notifications/${notificationId}/read`
    )) as unknown as ApiResponse;
    return response;
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    const response = (await this.client.put(
      "/notifications/read-all"
    )) as unknown as ApiResponse;
    return response;
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse> {
    const response = (await this.client.delete(
      `/notifications/${notificationId}`
    )) as unknown as ApiResponse;
    return response;
  }

  // ==========================================
  // ANALYTICS ENDPOINTS
  // ==========================================

  async trackEvent(
    event: string,
    properties?: Record<string, any>
  ): Promise<ApiResponse> {
    const response = (await this.client.post("/analytics/events", {
      event,
      properties,
    })) as unknown as ApiResponse;
    return response;
  }

  async getUserAnalytics(): Promise<ApiResponse<any>> {
    const response = (await this.client.get(
      "/analytics/user"
    )) as unknown as ApiResponse<any>;
    return response;
  }

  // ==========================================
  // CONFIG ENDPOINTS
  // ==========================================

  async getConfig(): Promise<ApiResponse<any>> {
    const response = (await this.client.get(
      "/config"
    )) as unknown as ApiResponse<any>;
    return response;
  }

  async getFeatureFlags(): Promise<ApiResponse<any>> {
    const response = (await this.client.get(
      "/config/features"
    )) as unknown as ApiResponse<any>;
    return response;
  }

  // ==========================================
  // HEALTH ENDPOINTS
  // ==========================================

  async healthCheck(): Promise<ApiResponse> {
    const response = (await this.client.get(
      "/health"
    )) as unknown as ApiResponse;
    return response;
  }

  async getStatus(): Promise<ApiResponse> {
    const response = (await this.client.get(
      "/status"
    )) as unknown as ApiResponse;
    return response;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;
