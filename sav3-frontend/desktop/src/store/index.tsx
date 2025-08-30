import {
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
} from "react";
import { User } from "@/types";

// App state
interface DesktopState {
  user: User | null;
  isAuthenticated: boolean;
  authToken: string | null;
  isLoading: boolean;
  sidebarOpen: boolean;
  theme: "light" | "dark";
}

interface DesktopActions {
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  clearUser: () => void;
  setAuthToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  logout: () => void;
}

export interface DesktopStore extends DesktopState, DesktopActions {}

// Context
const DesktopStoreContext = createContext<DesktopStore | null>(null);

export const DesktopStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<DesktopState>({
    user: null,
    isAuthenticated: false,
    authToken: null,
    isLoading: false,
    sidebarOpen: true,
    theme: "light",
  });

  // Initialize from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sav3-desktop-store");
      if (saved) {
        const parsed = JSON.parse(saved);
        setState((prevState) => ({
          ...prevState,
          user: parsed.user || null,
          isAuthenticated: !!parsed.user && !!parsed.authToken,
          authToken: parsed.authToken || null,
          theme: parsed.theme || "light",
          sidebarOpen:
            parsed.sidebarOpen !== undefined ? parsed.sidebarOpen : true,
        }));
      }
    } catch (error) {
      console.warn("Failed to load store from localStorage:", error);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      const toSave = {
        user: state.user,
        authToken: state.authToken,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      };
      localStorage.setItem("sav3-desktop-store", JSON.stringify(toSave));
    } catch (error) {
      console.warn("Failed to save store to localStorage:", error);
    }
  }, [state.user, state.authToken, state.theme, state.sidebarOpen]);

  // Actions
  const setUser = useCallback((user: User | null) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const setAuthenticated = useCallback((isAuthenticated: boolean) => {
    setState((prev) => ({ ...prev, isAuthenticated }));
  }, []);

  const clearUser = useCallback(() => {
    setState((prev) => ({
      ...prev,
      user: null,
      isAuthenticated: false,
      authToken: null,
    }));
  }, []);

  const setAuthToken = useCallback((authToken: string | null) => {
    setState((prev) => ({ ...prev, authToken }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setSidebarOpen = useCallback((sidebarOpen: boolean) => {
    setState((prev) => ({ ...prev, sidebarOpen }));
  }, []);

  const setTheme = useCallback((theme: "light" | "dark") => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const logout = useCallback(() => {
    setState((prev) => ({
      ...prev,
      user: null,
      isAuthenticated: false,
      authToken: null,
    }));
  }, []);

  const store: DesktopStore = {
    ...state,
    setUser,
    setAuthenticated,
    clearUser,
    setAuthToken,
    setLoading,
    setSidebarOpen,
    setTheme,
    logout,
  };

  return (
    <DesktopStoreContext.Provider value={store}>
      {children}
    </DesktopStoreContext.Provider>
  );
};

// Hook to use the store
export const useDesktopStore = () => {
  const store = useContext(DesktopStoreContext);
  if (!store) {
    throw new Error(
      "useDesktopStore must be used within a DesktopStoreProvider"
    );
  }
  return store;
};
