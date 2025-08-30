import { useCallback } from "react";
import { useDesktopStore } from "@/store";
import { apiClient } from "@/services/api";
import { LoginForm, RegisterForm, User } from "@/types";

export const useAuth = () => {
  const { user, isAuthenticated, setUser, setAuthenticated, clearUser } =
    useDesktopStore();

  const login = useCallback(
    async (credentials: LoginForm) => {
      try {
        const response = await apiClient.login(credentials);
        if (response.success && response.data) {
          const { user: userData, tokens } = response.data;
          setUser(userData);
          setAuthenticated(true);
          apiClient.setAuthToken(tokens.accessToken);
          return { success: true, user: userData };
        }
        return {
          success: false,
          error: response.error?.message || "Login failed",
        };
      } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "Login failed" };
      }
    },
    [setUser, setAuthenticated]
  );

  const register = useCallback(
    async (userData: RegisterForm) => {
      try {
        const response = await apiClient.register(userData);
        if (response.success && response.data) {
          const { user: newUser, tokens } = response.data;
          setUser(newUser);
          setAuthenticated(true);
          apiClient.setAuthToken(tokens.accessToken);
          return { success: true, user: newUser };
        }
        return {
          success: false,
          error: response.error?.message || "Registration failed",
        };
      } catch (error) {
        console.error("Registration error:", error);
        return { success: false, error: "Registration failed" };
      }
    },
    [setUser, setAuthenticated]
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearUser();
      apiClient.clearAuth();
    }
  }, [clearUser]);

  const updateProfile = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return { success: false, error: "Not authenticated" };

      try {
        const response = await apiClient.updateProfile(updates);
        if (response.success && response.data) {
          setUser(response.data);
          return { success: true, user: response.data };
        }
        return {
          success: false,
          error: response.error?.message || "Update failed",
        };
      } catch (error) {
        console.error("Profile update error:", error);
        return { success: false, error: "Update failed" };
      }
    },
    [user, setUser]
  );

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
  };
};
