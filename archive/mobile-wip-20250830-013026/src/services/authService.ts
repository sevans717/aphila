import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthUser,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  AuthError,
  Permission,
} from "../types/auth";
import { apiClient } from "./apiClient";
import { ApiResponse } from "../types/api";

/**
 * Authentication Service
 * Handles user authentication, token management, and session lifecycle
 */
class AuthService {
  private currentUser: AuthUser | null = null;
  private authTokens: AuthTokens | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from storage
   */
  private async initializeAuth(): Promise<void> {
    try {
      const [storedUser, storedTokens] = await Promise.all([
        AsyncStorage.getItem("auth_user"),
        AsyncStorage.getItem("auth_tokens"),
      ]);

      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }

      if (storedTokens) {
        this.authTokens = JSON.parse(storedTokens);
        if (this.authTokens) {
          apiClient.setAuthTokens(this.authTokens);
        }

        // Start session monitoring
        this.startSessionMonitoring();

        // Validate current session
        await this.validateSession();
      }
    } catch (error) {
      console.error("Failed to initialize auth state:", error);
      await this.clearAuthData();
    }
  }

  /**
   * Login user with credentials
   */
  public async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const response: ApiResponse<{
        user: AuthUser;
        tokens: AuthTokens;
      }> = await apiClient.post("/auth/login", credentials);

      const { user, tokens } = response.data!;

      // Store auth data
      await this.setAuthData(user, tokens);

      // Start session monitoring
      this.startSessionMonitoring();

      return user;
    } catch (error) {
      throw new AuthError("LOGIN_FAILED", "Failed to login", {
        originalError: error,
      });
    }
  }

  /**
   * Register new user
   */
  public async register(registerData: RegisterData): Promise<AuthUser> {
    try {
      const response: ApiResponse<{
        user: AuthUser;
        tokens: AuthTokens;
      }> = await apiClient.post("/auth/register", registerData);

      const { user, tokens } = response.data!;

      // Store auth data
      await this.setAuthData(user, tokens);

      // Start session monitoring
      this.startSessionMonitoring();

      return user;
    } catch (error) {
      throw new AuthError("REGISTRATION_FAILED", "Failed to register", {
        originalError: error,
      });
    }
  }

  /**
   * Logout user
   */
  public async logout(): Promise<void> {
    try {
      if (this.authTokens) {
        // Notify server of logout
        await apiClient.post("/auth/logout", {
          refreshToken: this.authTokens.refreshToken,
        });
      }
    } catch (error) {
      console.error("Server logout failed:", error);
    } finally {
      await this.clearAuthData();
      this.stopSessionMonitoring();
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(): Promise<AuthTokens> {
    if (!this.authTokens?.refreshToken) {
      throw new AuthError("NO_REFRESH_TOKEN", "No refresh token available");
    }

    try {
      const response: ApiResponse<{
        tokens: AuthTokens;
      }> = await apiClient.post("/auth/refresh", {
        refreshToken: this.authTokens.refreshToken,
      });

      const { tokens } = response.data!;

      // Update stored tokens
      this.authTokens = tokens;
      await AsyncStorage.setItem("auth_tokens", JSON.stringify(tokens));
      apiClient.setAuthTokens(tokens);

      return tokens;
    } catch (error) {
      // Refresh failed, clear auth data
      await this.clearAuthData();
      throw new AuthError("TOKEN_REFRESH_FAILED", "Failed to refresh token", {
        originalError: error,
      });
    }
  }

  /**
   * Forgot password request
   */
  public async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post("/auth/forgot-password", { email });
    } catch (error) {
      throw new AuthError(
        "FORGOT_PASSWORD_FAILED",
        "Failed to send password reset email",
        { originalError: error }
      );
    }
  }

  /**
   * Reset password with token
   */
  public async resetPassword(
    token: string,
    newPassword: string
  ): Promise<void> {
    try {
      await apiClient.post("/auth/reset-password", {
        token,
        password: newPassword,
      });
    } catch (error) {
      throw new AuthError("PASSWORD_RESET_FAILED", "Failed to reset password", {
        originalError: error,
      });
    }
  }

  /**
   * Change password for authenticated user
   */
  public async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    this.requireAuth();

    try {
      await apiClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      throw new AuthError(
        "PASSWORD_CHANGE_FAILED",
        "Failed to change password",
        {
          originalError: error,
        }
      );
    }
  }

  /**
   * Verify email address
   */
  public async verifyEmail(token: string): Promise<void> {
    try {
      await apiClient.post("/auth/verify-email", { token });

      // Refresh user data after verification
      if (this.isAuthenticated()) {
        await this.refreshUserProfile();
      }
    } catch (error) {
      throw new AuthError(
        "EMAIL_VERIFICATION_FAILED",
        "Failed to verify email",
        { originalError: error }
      );
    }
  }

  /**
   * Resend email verification
   */
  public async resendEmailVerification(): Promise<void> {
    this.requireAuth();

    try {
      await apiClient.post("/auth/resend-verification");
    } catch (error) {
      throw new AuthError(
        "RESEND_VERIFICATION_FAILED",
        "Failed to resend verification email",
        { originalError: error }
      );
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(updates: Partial<AuthUser>): Promise<AuthUser> {
    this.requireAuth();

    try {
      const response: ApiResponse<AuthUser> = await apiClient.patch(
        "/auth/profile",
        updates
      );
      const updatedUser = response.data!;

      // Update stored user data
      this.currentUser = { ...this.currentUser!, ...updatedUser };
      await AsyncStorage.setItem("auth_user", JSON.stringify(this.currentUser));

      return this.currentUser;
    } catch (error) {
      throw new AuthError("PROFILE_UPDATE_FAILED", "Failed to update profile", {
        originalError: error,
      });
    }
  }

  /**
   * Refresh current user profile
   */
  public async refreshUserProfile(): Promise<AuthUser> {
    this.requireAuth();

    try {
      const response: ApiResponse<AuthUser> =
        await apiClient.get("/auth/profile");
      const user = response.data!;

      // Update stored user data
      this.currentUser = user;
      await AsyncStorage.setItem("auth_user", JSON.stringify(user));

      return user;
    } catch (error) {
      throw new AuthError(
        "PROFILE_REFRESH_FAILED",
        "Failed to refresh profile",
        {
          originalError: error,
        }
      );
    }
  }

  /**
   * Validate current session
   */
  public async validateSession(): Promise<boolean> {
    if (!this.authTokens) {
      return false;
    }

    try {
      await apiClient.get("/auth/validate");
      return true;
    } catch (error) {
      console.error("Session validation failed:", error);
      await this.clearAuthData();
      return false;
    }
  }

  /**
   * Delete user account
   */
  public async deleteAccount(password: string): Promise<void> {
    this.requireAuth();

    try {
      await apiClient.post("/auth/delete-account", { password });
      await this.clearAuthData();
    } catch (error) {
      throw new AuthError(
        "ACCOUNT_DELETION_FAILED",
        "Failed to delete account",
        { originalError: error }
      );
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!(this.currentUser && this.authTokens);
  }

  /**
   * Check if access token is expired
   */
  public isTokenExpired(): boolean {
    if (!this.authTokens?.expiresAt) {
      return true;
    }

    const expiresAt = new Date(this.authTokens.expiresAt);
    const now = new Date();

    // Add 5 minute buffer
    return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
  }

  /**
   * Get current user
   */
  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Get current auth tokens
   */
  public getAuthTokens(): AuthTokens | null {
    return this.authTokens;
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(permission: string | Permission): boolean {
    if (!this.currentUser) {
      return false;
    }
    if (typeof permission === "string") {
      return (
        this.currentUser.permissions?.some((p) => p.name === permission) ||
        false
      );
    }
    return (
      this.currentUser.permissions?.some(
        (p) =>
          p.name === permission.name &&
          p.action === permission.action &&
          p.resource === permission.resource
      ) || false
    );
  }

  /**
   * Check if user has specific role
   */
  public hasRole(role: string): boolean {
    if (!this.currentUser) {
      return false;
    }
    return this.currentUser.role === role;
  }

  /**
   * Get user's subscription status
   */
  // Subscription details are not present on AuthUser; these helpers can be added
  // later once subscription types exist. For now, conservatively return null/false.
  public getSubscriptionStatus(): string | null {
    return null;
  }

  public hasActiveSubscription(): boolean {
    return false;
  }

  /**
   * Private: Set authentication data
   */
  private async setAuthData(user: AuthUser, tokens: AuthTokens): Promise<void> {
    this.currentUser = user;
    this.authTokens = tokens;

    await Promise.all([
      AsyncStorage.setItem("auth_user", JSON.stringify(user)),
      AsyncStorage.setItem("auth_tokens", JSON.stringify(tokens)),
    ]);

    apiClient.setAuthTokens(tokens);
  }

  /**
   * Private: Clear authentication data
   */
  private async clearAuthData(): Promise<void> {
    this.currentUser = null;
    this.authTokens = null;

    await Promise.all([
      AsyncStorage.removeItem("auth_user"),
      AsyncStorage.removeItem("auth_tokens"),
    ]);

    apiClient.clearAuthTokens();
  }

  /**
   * Private: Start session monitoring
   */
  private startSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    // Check session every 5 minutes
    this.sessionCheckInterval = setInterval(
      async () => {
        if (this.isTokenExpired()) {
          try {
            await this.refreshToken();
          } catch (error) {
            console.error("Automatic token refresh failed:", error);
            // Session will be cleared by refreshToken method
          }
        }
      },
      5 * 60 * 1000
    );
  }

  /**
   * Private: Stop session monitoring
   */
  private stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Private: Require authentication
   */
  private requireAuth(): void {
    if (!this.isAuthenticated()) {
      throw new AuthError("NOT_AUTHENTICATED", "User must be authenticated");
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopSessionMonitoring();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
