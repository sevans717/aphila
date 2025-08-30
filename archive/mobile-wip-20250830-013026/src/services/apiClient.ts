import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiConfig } from "../config/api";
import { ApiError, ApiResponse, RequestOptions } from "../types/api";
import { AuthTokens } from "../types/auth";

/**
 * Enhanced API Client Service
 * Provides centralized HTTP client with authentication, error handling, and request/response transformation
 */
class ApiClientService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private authTokens: AuthTokens | null = null;
  private requestQueue: Array<() => Promise<any>> = [];
  private isRefreshingToken = false;

  constructor() {
    this.baseURL = ApiConfig.baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": `${ApiConfig.appName}/${ApiConfig.version}`,
    };
    this.loadStoredTokens();
  }

  /**
   * Load stored authentication tokens
   */
  private async loadStoredTokens(): Promise<void> {
    try {
      const storedTokens = await AsyncStorage.getItem("auth_tokens");
      if (storedTokens) {
        this.authTokens = JSON.parse(storedTokens);
      }
    } catch (error) {
      console.error("Failed to load stored tokens:", error);
    }
  }

  /**
   * Set authentication tokens
   */
  public setAuthTokens(tokens: AuthTokens): void {
    this.authTokens = tokens;
    AsyncStorage.setItem("auth_tokens", JSON.stringify(tokens));
  }

  /**
   * Clear authentication tokens
   */
  public clearAuthTokens(): void {
    this.authTokens = null;
    AsyncStorage.removeItem("auth_tokens");
  }

  /**
   * Get current authentication tokens
   */
  public getAuthTokens(): AuthTokens | null {
    return this.authTokens;
  }

  /**
   * Build headers for requests
   */
  private buildHeaders(
    customHeaders?: Record<string, string>
  ): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders };

    if (this.authTokens?.accessToken) {
      headers["Authorization"] = `Bearer ${this.authTokens.accessToken}`;
    }

    return headers;
  }

  /**
   * Build full URL
   */
  private buildURL(endpoint: string): string {
    // Handle absolute URLs
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }

    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${this.baseURL}${cleanEndpoint}`;
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.authTokens?.refreshToken) {
      return false;
    }

    if (this.isRefreshingToken) {
      // Wait for ongoing refresh
      return new Promise((resolve) => {
        const checkRefresh = () => {
          if (!this.isRefreshingToken) {
            resolve(!!this.authTokens?.accessToken);
          } else {
            setTimeout(checkRefresh, 100);
          }
        };
        checkRefresh();
      });
    }

    this.isRefreshingToken = true;

    try {
      const response = await fetch(this.buildURL("/auth/refresh"), {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify({
          refreshToken: this.authTokens.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setAuthTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || this.authTokens.refreshToken,
          expiresAt: data.expiresAt,
          tokenType: "Bearer",
        });
        return true;
      } else {
        this.clearAuthTokens();
        return false;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearAuthTokens();
      return false;
    } finally {
      this.isRefreshingToken = false;
    }
  }

  /**
   * Execute HTTP request with automatic token refresh
   */
  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, options);

      // Handle 401 Unauthorized - attempt token refresh
      if (response.status === 401 && retryCount === 0 && this.authTokens) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry with new token
          const newHeaders = this.buildHeaders(
            options.headers as Record<string, string>
          );
          return this.executeRequest<T>(
            url,
            { ...options, headers: newHeaders },
            1
          );
        }
      }

      const contentType = response.headers.get("content-type");
      let data: any = null;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error: ApiError = {
          status: response.status,
          statusText: response.statusText,
          message: (data && (data.message || data.error)) || "Request failed",
          code: (data && data.code) || String(response.status),
          details: data && data.details ? data.details : undefined,
          statusCode: response.status,
        } as any;
        throw error;
      }

      return {
        success: true,
        data,
        message: undefined,
        error: undefined,
        timestamp: new Date().toISOString(),
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      } as any;
    } catch (error) {
      if (error instanceof Error && !(error as any).status) {
        // Network or other errors
        const apiError: ApiError = {
          status: 0,
          statusCode: 0,
          statusText: "Network Error",
          code: "NETWORK_ERROR",
          message: error.message,
        } as any;
        throw apiError;
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  public async get<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, headers, signal, cache } = options;

    let url = this.buildURL(endpoint);

    // Add query parameters
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    const reqInit: RequestInit = {
      method: "GET",
      headers: this.buildHeaders(headers),
      signal,
      cache,
    };
    return this.executeRequest<T>(url, reqInit);
  }

  /**
   * POST request
   */
  public async post<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { headers, signal, cache } = options;
    const reqInit: RequestInit = {
      method: "POST",
      headers: this.buildHeaders(headers),
      body: data ? JSON.stringify(data) : undefined,
      signal,
      cache,
    };
    return this.executeRequest<T>(this.buildURL(endpoint), reqInit);
  }

  /**
   * PUT request
   */
  public async put<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { headers, signal, cache } = options;
    const reqInit: RequestInit = {
      method: "PUT",
      headers: this.buildHeaders(headers),
      body: data ? JSON.stringify(data) : undefined,
      signal,
      cache,
    };
    return this.executeRequest<T>(this.buildURL(endpoint), reqInit);
  }

  /**
   * PATCH request
   */
  public async patch<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { headers, signal, cache } = options;
    const reqInit: RequestInit = {
      method: "PATCH",
      headers: this.buildHeaders(headers),
      body: data ? JSON.stringify(data) : undefined,
      signal,
      cache,
    };
    return this.executeRequest<T>(this.buildURL(endpoint), reqInit);
  }

  /**
   * DELETE request
   */
  public async delete<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { headers, signal, cache } = options;
    const reqInit: RequestInit = {
      method: "DELETE",
      headers: this.buildHeaders(headers),
      signal,
      cache,
    };
    return this.executeRequest<T>(this.buildURL(endpoint), reqInit);
  }

  /**
   * Upload file with progress tracking
   */
  public async uploadFile<T>(
    endpoint: string,
    file: {
      uri: string;
      name: string;
      type: string;
    },
    additionalFields?: Record<string, string>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();

    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers = this.buildHeaders();
    delete headers["Content-Type"]; // Let browser set multipart boundary

    return this.executeRequest<T>(this.buildURL(endpoint), {
      method: "POST",
      headers,
      body: formData,
    });
  }

  /**
   * Download file
   */
  public async downloadFile(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<Blob> {
    const response = await this.get<any>(endpoint, options);
    // This would need platform-specific implementation
    throw new Error("File download not implemented for React Native");
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(error: ApiError): boolean {
    // Retry on network errors or 5xx server errors
    return error.status === 0 || (error.status >= 500 && error.status < 600);
  }

  /**
   * Request with retry logic
   */
  public async requestWithRetry<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<ApiResponse<T>> {
    let lastError: ApiError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as ApiError;

        if (attempt === maxRetries || !this.shouldRetry(lastError)) {
          throw lastError;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Batch requests
   */
  public async batchRequests<T>(
    requests: Array<() => Promise<ApiResponse<any>>>,
    options: {
      concurrent?: boolean;
      maxConcurrent?: number;
    } = {}
  ): Promise<Array<ApiResponse<any>>> {
    const { concurrent = true, maxConcurrent = 5 } = options;

    if (!concurrent) {
      // Sequential execution
      const results: Array<ApiResponse<any>> = [];
      for (const request of requests) {
        try {
          const result = await request();
          results.push(result);
        } catch (error) {
          results.push({ error: error as ApiError } as any);
        }
      }
      return results;
    }

    // Concurrent execution with limit
    const executeWithLimit = async (
      requestFn: () => Promise<ApiResponse<any>>
    ) => {
      try {
        return await requestFn();
      } catch (error) {
        return { error: error as ApiError } as any;
      }
    };

    const results: Array<ApiResponse<any>> = [];
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map((request) => executeWithLimit(request))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Cancel all pending requests (platform-specific implementation needed)
   */
  public cancelAllRequests(): void {
    // This would need AbortController implementation
    console.log("Request cancellation not implemented");
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.get("/health");
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API status and version info
   */
  public async getApiInfo(): Promise<{
    version: string;
    status: string;
    timestamp: string;
  }> {
    const response = await this.get<{
      version: string;
      status: string;
      timestamp: string;
    }>("/api/info");

    if (!response.data) {
      throw new Error("API info data not available");
    }

    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClientService();
export default apiClient;
