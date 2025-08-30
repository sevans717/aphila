import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserPreferences } from "../../types/user";

interface UserState {
  user: User | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
}

interface UserActions {
  loadUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetUser: () => void;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      preferences: null,
      isLoading: false,
      error: null,

      loadUser: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Replace with actual API call
          // const user = await UserService.getCurrentUser();
          // set({ user, preferences: user.preferences, isLoading: false });
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || "Failed to load user",
            isLoading: false,
          });
        }
      },

      updateUser: async (updates: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Replace with actual API call
          // const updatedUser = await UserService.updateUser(updates);
          // set({ user: updatedUser, preferences: updatedUser.preferences, isLoading: false });
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || "Failed to update user",
            isLoading: false,
          });
        }
      },

      updatePreferences: async (updates: Partial<UserPreferences>) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Replace with actual API call
          // const updatedPreferences = await UserService.updatePreferences(updates);
          // set((state) => ({
          //   preferences: { ...state.preferences, ...updatedPreferences },
          //   isLoading: false,
          // }));
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || "Failed to update preferences",
            isLoading: false,
          });
        }
      },

      resetUser: () => {
        set({ user: null, preferences: null, isLoading: false, error: null });
      },
    }),
    {
      name: "user-store",
      partialize: (state) => ({
        user: state.user,
        preferences: state.preferences,
      }),
    }
  )
);
