import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Category,
  UserPool,
  CategoryMembership,
  CategoryEvent,
  CategoryChat,
} from "../../types/community";
import { User } from "../../types/user";

interface CategoryState {
  // Categories
  categories: Category[];
  trendingCategories: Category[];
  recentCategories: Category[];

  // Current category context
  currentCategory: Category | null;
  categoryMembers: Record<string, User[]>;
  userPools: Record<string, UserPool>;

  // User memberships
  userMemberships: CategoryMembership[];
  joinedCategories: string[];

  // Category events
  categoryEvents: Record<string, CategoryEvent[]>;
  upcomingEvents: CategoryEvent[];

  // Category chat
  categoryChats: Record<string, CategoryChat>;

  // Search and filtering
  searchQuery: string;
  filteredCategories: Category[];
  categoryFilters: {
    type: "all" | "interests" | "location" | "activity";
    activity: "all" | "high" | "medium" | "low";
    distance: number;
    memberCount: { min: number; max: number };
  };

  // UI state
  isLoading: boolean;
  loadingCategories: Set<string>;
  error: string | null;

  // Statistics
  totalCategories: number;
  totalMemberships: number;
  activeChats: number;
}

interface CategoryActions {
  // Category management
  loadCategories: () => Promise<void>;
  loadTrendingCategories: () => Promise<void>;
  createCategory: (
    categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updateCategory: (
    categoryId: string,
    updates: Partial<Category>
  ) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Category membership
  joinCategory: (categoryId: string) => Promise<void>;
  leaveCategory: (categoryId: string) => Promise<void>;
  loadCategoryMembers: (categoryId: string) => Promise<void>;

  // User pools
  loadUserPool: (categoryId: string) => Promise<void>;
  updateUserPoolPreferences: (categoryId: string, preferences: any) => void;

  // Category events
  loadCategoryEvents: (categoryId: string) => Promise<void>;
  createEvent: (
    categoryId: string,
    eventData: Omit<CategoryEvent, "id" | "createdAt">
  ) => Promise<string>;
  joinEvent: (eventId: string) => Promise<void>;
  leaveEvent: (eventId: string) => Promise<void>;

  // Category chat
  loadCategoryChat: (categoryId: string) => Promise<void>;
  sendCategoryMessage: (categoryId: string, message: string) => Promise<void>;

  // Search and filtering
  searchCategories: (query: string) => void;
  applyFilters: (filters: Partial<CategoryState["categoryFilters"]>) => void;
  clearFilters: () => void;

  // Navigation
  setCurrentCategory: (category: Category | null) => void;

  // Statistics
  updateStatistics: () => void;

  // Cleanup
  clearCategoryData: () => void;
}

type CategoryStore = CategoryState & CategoryActions;

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      // Initial state
      categories: [],
      trendingCategories: [],
      recentCategories: [],
      currentCategory: null,
      categoryMembers: {},
      userPools: {},
      userMemberships: [],
      joinedCategories: [],
      categoryEvents: {},
      upcomingEvents: [],
      categoryChats: {},
      searchQuery: "",
      filteredCategories: [],
      categoryFilters: {
        type: "all",
        activity: "all",
        distance: 50,
        memberCount: { min: 0, max: 10000 },
      },
      isLoading: false,
      loadingCategories: new Set(),
      error: null,
      totalCategories: 0,
      totalMemberships: 0,
      activeChats: 0,

      // Actions
      loadCategories: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implement API call
          // const categories = await CategoryService.getCategories();
          // set({ categories, filteredCategories: categories, isLoading: false });
          set({ isLoading: false });
        } catch (error) {
          console.error("Failed to load categories:", error);
          set({ error: "Failed to load categories", isLoading: false });
        }
      },

      loadTrendingCategories: async () => {
        try {
          // TODO: Implement API call
          // const trendingCategories = await CategoryService.getTrendingCategories();
          // set({ trendingCategories });
        } catch (error) {
          console.error("Failed to load trending categories:", error);
        }
      },

      createCategory: async (categoryData) => {
        try {
          // TODO: Implement API call
          // const category = await CategoryService.createCategory(categoryData);
          const categoryId = `category_${Date.now()}`;
          const category: Category = {
            id: categoryId,
            ...categoryData,
            memberCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
          };

          set((state) => ({
            categories: [category, ...state.categories],
            filteredCategories: [category, ...state.filteredCategories],
          }));

          return categoryId;
        } catch (error) {
          console.error("Failed to create category:", error);
          throw error;
        }
      },

      updateCategory: async (
        categoryId: string,
        updates: Partial<Category>
      ) => {
        try {
          // TODO: Implement API call
          // await CategoryService.updateCategory(categoryId, updates);

          set((state) => ({
            categories: state.categories.map((cat) =>
              cat.id === categoryId
                ? { ...cat, ...updates, updatedAt: new Date().toISOString() }
                : cat
            ),
            filteredCategories: state.filteredCategories.map((cat) =>
              cat.id === categoryId
                ? { ...cat, ...updates, updatedAt: new Date().toISOString() }
                : cat
            ),
          }));
        } catch (error) {
          console.error("Failed to update category:", error);
          throw error;
        }
      },

      deleteCategory: async (categoryId: string) => {
        try {
          // TODO: Implement API call
          // await CategoryService.deleteCategory(categoryId);

          set((state) => ({
            categories: state.categories.filter((cat) => cat.id !== categoryId),
            filteredCategories: state.filteredCategories.filter(
              (cat) => cat.id !== categoryId
            ),
            joinedCategories: state.joinedCategories.filter(
              (id) => id !== categoryId
            ),
          }));
        } catch (error) {
          console.error("Failed to delete category:", error);
          throw error;
        }
      },

      joinCategory: async (categoryId: string) => {
        try {
          // TODO: Implement API call
          // await CategoryService.joinCategory(categoryId);

          const membership: CategoryMembership = {
            id: `membership_${Date.now()}`,
            userId: "current_user", // TODO: Get from user store
            categoryId,
            role: "member",
            status: "active",
            joinedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            preferences: {
              notifications: true,
              visibility: "public",
              allowDirectMessages: true,
              showOnlineStatus: true,
              autoJoinDiscussions: true,
            },
            stats: {
              postsCreated: 0,
              commentsCreated: 0,
              likesReceived: 0,
              likesGiven: 0,
              reportsReceived: 0,
              reportsGiven: 0,
              reputation: 0,
            },
          };

          set((state) => ({
            userMemberships: [...state.userMemberships, membership],
            joinedCategories: [...state.joinedCategories, categoryId],
            categories: state.categories.map((cat) =>
              cat.id === categoryId
                ? { ...cat, memberCount: cat.memberCount + 1 }
                : cat
            ),
          }));
        } catch (error) {
          console.error("Failed to join category:", error);
          throw error;
        }
      },

      leaveCategory: async (categoryId: string) => {
        try {
          // TODO: Implement API call
          // await CategoryService.leaveCategory(categoryId);

          set((state) => ({
            userMemberships: state.userMemberships.filter(
              (membership) => membership.categoryId !== categoryId
            ),
            joinedCategories: state.joinedCategories.filter(
              (id) => id !== categoryId
            ),
            categories: state.categories.map((cat) =>
              cat.id === categoryId
                ? { ...cat, memberCount: Math.max(0, cat.memberCount - 1) }
                : cat
            ),
          }));
        } catch (error) {
          console.error("Failed to leave category:", error);
          throw error;
        }
      },

      loadCategoryMembers: async (categoryId: string) => {
        set((state) => ({
          loadingCategories: new Set([...state.loadingCategories, categoryId]),
        }));

        try {
          // TODO: Implement API call
          // const members = await CategoryService.getCategoryMembers(categoryId);
          // set(state => ({
          //   categoryMembers: { ...state.categoryMembers, [categoryId]: members },
          //   loadingCategories: new Set([...state.loadingCategories].filter(id => id !== categoryId)),
          // }));
          set((state) => ({
            loadingCategories: new Set(
              [...state.loadingCategories].filter((id) => id !== categoryId)
            ),
          }));
        } catch (error) {
          console.error("Failed to load category members:", error);
          set((state) => ({
            loadingCategories: new Set(
              [...state.loadingCategories].filter((id) => id !== categoryId)
            ),
          }));
        }
      },

      loadUserPool: async (categoryId: string) => {
        try {
          // TODO: Implement API call
          // const userPool = await CategoryService.getUserPool(categoryId);
          const userPool: UserPool = {
            id: `pool_${categoryId}`,
            categoryId,
            users: [],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            userPools: { ...state.userPools, [categoryId]: userPool },
          }));
        } catch (error) {
          console.error("Failed to load user pool:", error);
        }
      },

      updateUserPoolPreferences: (categoryId: string, preferences: any) => {
        // UserPool doesn't have filters, so this function is not applicable
        console.log(
          "UserPool preferences update not supported:",
          categoryId,
          preferences
        );
      },

      loadCategoryEvents: async (categoryId: string) => {
        try {
          // TODO: Implement API call
          // const events = await CategoryService.getCategoryEvents(categoryId);
          // set(state => ({
          //   categoryEvents: { ...state.categoryEvents, [categoryId]: events },
          // }));
        } catch (error) {
          console.error("Failed to load category events:", error);
        }
      },

      createEvent: async (categoryId: string, eventData) => {
        try {
          // TODO: Implement API call
          const eventId = `event_${Date.now()}`;
          const event: CategoryEvent = {
            id: eventId,
            categoryId,
            type: "event",
            data: eventData,
            userId: "current_user", // TODO: Get from user store
            timestamp: new Date().toISOString(),
          };

          set((state) => ({
            categoryEvents: {
              ...state.categoryEvents,
              [categoryId]: [
                ...(state.categoryEvents[categoryId] || []),
                event,
              ],
            },
          }));

          return eventId;
        } catch (error) {
          console.error("Failed to create event:", error);
          throw error;
        }
      },

      joinEvent: async (eventId: string) => {
        try {
          // TODO: Implement API call
          // await CategoryService.joinEvent(eventId);
          console.log("Joined event:", eventId);
        } catch (error) {
          console.error("Failed to join event:", error);
          throw error;
        }
      },

      leaveEvent: async (eventId: string) => {
        try {
          // TODO: Implement API call
          // await CategoryService.leaveEvent(eventId);
          console.log("Left event:", eventId);
        } catch (error) {
          console.error("Failed to leave event:", error);
          throw error;
        }
      },

      loadCategoryChat: async (categoryId: string) => {
        try {
          // TODO: Implement API call
          // const chat = await CategoryService.getCategoryChat(categoryId);
          const chat: CategoryChat = {
            id: `chat_${categoryId}`,
            categoryId,
            type: "general",
            participants: [],
            messages: [],
            settings: {
              slowMode: false,
              slowModeInterval: 0,
              allowLinks: true,
              allowMedia: true,
              allowMentions: true,
              maxMessageLength: 2000,
              autoModeration: false,
            },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            categoryChats: { ...state.categoryChats, [categoryId]: chat },
          }));
        } catch (error) {
          console.error("Failed to load category chat:", error);
        }
      },

      sendCategoryMessage: async (categoryId: string, message: string) => {
        try {
          // TODO: Implement real-time message sending
          // await CategoryService.sendMessage(categoryId, message);
          console.log("Sent message to category:", categoryId, message);
        } catch (error) {
          console.error("Failed to send category message:", error);
          throw error;
        }
      },

      searchCategories: (query: string) => {
        set((state) => {
          if (!query.trim()) {
            return { searchQuery: query, filteredCategories: state.categories };
          }

          const filtered = state.categories.filter(
            (category) =>
              category.name.toLowerCase().includes(query.toLowerCase()) ||
              category.description
                .toLowerCase()
                .includes(query.toLowerCase()) ||
              category.tags.some((tag) =>
                tag.toLowerCase().includes(query.toLowerCase())
              )
          );

          return { searchQuery: query, filteredCategories: filtered };
        });
      },

      applyFilters: (filters: Partial<CategoryState["categoryFilters"]>) => {
        set((state) => {
          const newFilters = { ...state.categoryFilters, ...filters };

          let filtered = state.categories;

          if (newFilters.type !== "all") {
            // Category doesn't have a type property, so skip this filter
            // filtered = filtered.filter(
            //   (category) => category.type === newFilters.type
            // );
          }

          if (newFilters.activity !== "all") {
            filtered = filtered.filter((category) => {
              // TODO: Implement activity level filtering based on recent activity
              return true;
            });
          }

          filtered = filtered.filter(
            (category) =>
              category.memberCount >= newFilters.memberCount.min &&
              category.memberCount <= newFilters.memberCount.max
          );

          return {
            categoryFilters: newFilters,
            filteredCategories: filtered,
          };
        });
      },

      clearFilters: () => {
        set((state) => ({
          categoryFilters: {
            type: "all",
            activity: "all",
            distance: 50,
            memberCount: { min: 0, max: 10000 },
          },
          filteredCategories: state.categories,
        }));
      },

      setCurrentCategory: (category: Category | null) => {
        set({ currentCategory: category });
        if (category) {
          get().loadCategoryMembers(category.id);
          get().loadUserPool(category.id);
          get().loadCategoryEvents(category.id);
          get().loadCategoryChat(category.id);
        }
      },

      updateStatistics: () => {
        set((state) => ({
          totalCategories: state.categories.length,
          totalMemberships: state.userMemberships.length,
          activeChats: Object.keys(state.categoryChats).length,
        }));
      },

      clearCategoryData: () => {
        set({
          categories: [],
          trendingCategories: [],
          recentCategories: [],
          currentCategory: null,
          categoryMembers: {},
          userPools: {},
          userMemberships: [],
          joinedCategories: [],
          categoryEvents: {},
          upcomingEvents: [],
          categoryChats: {},
          searchQuery: "",
          filteredCategories: [],
          isLoading: false,
          loadingCategories: new Set(),
          error: null,
          totalCategories: 0,
          totalMemberships: 0,
          activeChats: 0,
        });
      },
    }),
    {
      name: "category-store",
      partialize: (state) => ({
        joinedCategories: state.joinedCategories,
        userMemberships: state.userMemberships,
        recentCategories: state.recentCategories,
        categoryFilters: state.categoryFilters,
        userPools: state.userPools,
      }),
    }
  )
);
