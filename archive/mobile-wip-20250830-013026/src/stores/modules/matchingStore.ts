import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  User,
  Match,
  SwipeAction,
  MatchPreferences,
  CompatibilityScore,
} from "../../types/matching";
import { Location } from "../../types/user";

interface MatchingState {
  // Current user's profile queue
  profileQueue: User[];
  currentProfileIndex: number;

  // Matches and interactions
  matches: Match[];
  pendingMatches: Match[];
  swipeHistory: SwipeAction[];

  // User preferences
  matchPreferences: MatchPreferences;

  // Location-based matching
  currentLocation: Location | null;
  nearbyUsers: User[];
  searchRadius: number;

  // Matching algorithm state
  compatibilityScores: Record<string, CompatibilityScore>;
  boostedProfiles: User[];
  superLikesRemaining: number;

  // UI state
  isLoading: boolean;
  swipeDirection: "left" | "right" | null;
  showMatchAnimation: boolean;
  undoAvailable: boolean;

  // Statistics
  totalSwipes: number;
  totalMatches: number;
  todaySwipes: number;
  todayMatches: number;
}

interface MatchingActions {
  // Profile management
  loadProfileQueue: () => Promise<void>;
  nextProfile: () => void;

  // Swiping actions
  swipeLeft: (userId: string) => Promise<void>;
  swipeRight: (userId: string) => Promise<void>;
  superLike: (userId: string) => Promise<void>;
  undoLastSwipe: () => void;

  // Match management
  loadMatches: () => Promise<void>;
  removeMatch: (matchId: string) => void;

  // Preferences
  updateMatchPreferences: (preferences: Partial<MatchPreferences>) => void;

  // Location
  updateLocation: (location: Location) => void;
  updateSearchRadius: (radius: number) => void;
  loadNearbyUsers: () => Promise<void>;

  // Compatibility
  calculateCompatibility: (userId: string) => Promise<CompatibilityScore>;

  // Reset and cleanup
  resetSwipeSession: () => void;
  clearMatchingData: () => void;
}

type MatchingStore = MatchingState & MatchingActions;

export const useMatchingStore = create<MatchingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      profileQueue: [],
      currentProfileIndex: 0,
      matches: [],
      pendingMatches: [],
      swipeHistory: [],
      matchPreferences: {
        discovery: {
          mode: "standard",
          range: 50,
          showOnlyActive: false,
          includeRecentlyJoined: true,
          prioritizeCompatibility: true,
          enableSmartDiscovery: true,
        },
        filters: {
          ageRange: { min: 18, max: 99 },
          distanceRange: 50,
          verifiedOnly: false,
          activeUsersOnly: false,
          premiumUsersOnly: false,
          excludeSeenProfiles: true,
          interests: [],
        },
        algorithm: {
          compatibilityWeight: 0.4,
          distanceWeight: 0.2,
          activityWeight: 0.1,
          popularityWeight: 0.1,
          freshnessWeight: 0.2,
          learningEnabled: true,
        },
        limits: {
          dailyLikes: 100,
          dailySuperLikes: 5,
          maxMatches: 500,
          messageLimit: 1000,
          boostCredits: 0,
        },
      },
      currentLocation: null,
      nearbyUsers: [],
      searchRadius: 50,
      compatibilityScores: {},
      boostedProfiles: [],
      superLikesRemaining: 5,
      isLoading: false,
      swipeDirection: null,
      showMatchAnimation: false,
      undoAvailable: false,
      totalSwipes: 0,
      totalMatches: 0,
      todaySwipes: 0,
      todayMatches: 0,

      // Actions
      loadProfileQueue: async () => {
        set({ isLoading: true });
        try {
          // TODO: Implement API call to load profile queue
          // const profiles = await MatchingService.getProfileQueue();
          // set({ profileQueue: profiles, isLoading: false });
          set({ isLoading: false });
        } catch (error) {
          console.error("Failed to load profile queue:", error);
          set({ isLoading: false });
        }
      },

      nextProfile: () => {
        const { currentProfileIndex, profileQueue } = get();
        if (currentProfileIndex < profileQueue.length - 1) {
          set({ currentProfileIndex: currentProfileIndex + 1 });
        } else {
          // Load more profiles if needed
          get().loadProfileQueue();
        }
      },

      swipeLeft: async (userId: string) => {
        set({ swipeDirection: "left" });
        const swipeAction: SwipeAction = {
          id: `swipe_${Date.now()}`,
          targetUserId: userId,
          action: "dislike",
          timestamp: new Date().toISOString(),
          context: {
            source: "discovery",
            position: 0,
            viewDuration: 0,
            imagesSeen: 0,
            bioRead: false,
          },
        };

        set((state) => ({
          swipeHistory: [swipeAction, ...state.swipeHistory],
          todaySwipes: state.todaySwipes + 1,
          totalSwipes: state.totalSwipes + 1,
          undoAvailable: true,
        }));

        get().nextProfile();
        setTimeout(() => set({ swipeDirection: null }), 300);
      },

      swipeRight: async (userId: string) => {
        set({ swipeDirection: "right" });
        const swipeAction: SwipeAction = {
          id: `swipe_${Date.now()}`,
          targetUserId: userId,
          action: "like",
          timestamp: new Date().toISOString(),
          context: {
            source: "discovery",
            position: 0,
            viewDuration: 0,
            imagesSeen: 0,
            bioRead: false,
          },
        };

        set((state) => ({
          swipeHistory: [swipeAction, ...state.swipeHistory],
          todaySwipes: state.todaySwipes + 1,
          totalSwipes: state.totalSwipes + 1,
          undoAvailable: true,
        }));

        // TODO: Check for match
        // const isMatch = await MatchingService.checkMatch(userId);
        // if (isMatch) {
        //   set(state => ({
        //     showMatchAnimation: true,
        //     todayMatches: state.todayMatches + 1,
        //     totalMatches: state.totalMatches + 1,
        //   }));
        // }

        get().nextProfile();
        setTimeout(() => set({ swipeDirection: null }), 300);
      },

      superLike: async (userId: string) => {
        const { superLikesRemaining } = get();
        if (superLikesRemaining <= 0) return;

        const swipeAction: SwipeAction = {
          id: `swipe_${Date.now()}`,
          targetUserId: userId,
          action: "super_like",
          timestamp: new Date().toISOString(),
          context: {
            source: "discovery",
            position: 0,
            viewDuration: 0,
            imagesSeen: 0,
            bioRead: false,
          },
        };

        set((state) => ({
          swipeHistory: [swipeAction, ...state.swipeHistory],
          superLikesRemaining: state.superLikesRemaining - 1,
          todaySwipes: state.todaySwipes + 1,
          totalSwipes: state.totalSwipes + 1,
        }));

        get().nextProfile();
      },

      undoLastSwipe: () => {
        const { swipeHistory } = get();
        if (swipeHistory.length === 0) return;

        const lastSwipe = swipeHistory[0];
        set((state) => ({
          swipeHistory: state.swipeHistory.slice(1),
          currentProfileIndex: Math.max(0, state.currentProfileIndex - 1),
          undoAvailable: state.swipeHistory.length > 1,
        }));

        if (lastSwipe.action === "super_like") {
          set((state) => ({
            superLikesRemaining: state.superLikesRemaining + 1,
          }));
        }
      },

      loadMatches: async () => {
        try {
          // TODO: Implement API call to load matches
          // const matches = await MatchingService.getMatches();
          // set({ matches });
        } catch (error) {
          console.error("Failed to load matches:", error);
        }
      },

      removeMatch: (matchId: string) => {
        set((state) => ({
          matches: state.matches.filter((match) => match.id !== matchId),
        }));
      },

      updateMatchPreferences: (preferences: Partial<MatchPreferences>) => {
        set((state) => ({
          matchPreferences: { ...state.matchPreferences, ...preferences },
        }));
      },

      updateLocation: (location: Location) => {
        set({ currentLocation: location });
        get().loadNearbyUsers();
      },

      updateSearchRadius: (radius: number) => {
        set({ searchRadius: radius });
        get().loadNearbyUsers();
      },

      loadNearbyUsers: async () => {
        try {
          // TODO: Implement API call to load nearby users
          // const nearbyUsers = await MatchingService.getNearbyUsers(location, radius);
          // set({ nearbyUsers });
        } catch (error) {
          console.error("Failed to load nearby users:", error);
        }
      },

      calculateCompatibility: async (
        userId: string
      ): Promise<CompatibilityScore> => {
        try {
          // TODO: Implement compatibility calculation
          // const score = await MatchingService.calculateCompatibility(userId);
          // set(state => ({
          //   compatibilityScores: { ...state.compatibilityScores, [userId]: score },
          // }));
          // return score;
          return {
            overall: 85,
            breakdown: {
              interests: 80,
              location: 90,
              activity: 85,
              preferences: 80,
              personality: 85,
            },
            reasons: [
              "High interest compatibility",
              "Close proximity",
              "Similar activity levels",
            ],
          };
        } catch (error) {
          console.error("Failed to calculate compatibility:", error);
          return {
            overall: 0,
            breakdown: {
              interests: 0,
              location: 0,
              activity: 0,
              preferences: 0,
              personality: 0,
            },
            reasons: ["Error calculating compatibility"],
          };
        }
      },

      resetSwipeSession: () => {
        set({
          currentProfileIndex: 0,
          swipeHistory: [],
          undoAvailable: false,
          swipeDirection: null,
          showMatchAnimation: false,
        });
      },

      clearMatchingData: () => {
        set({
          profileQueue: [],
          currentProfileIndex: 0,
          matches: [],
          pendingMatches: [],
          swipeHistory: [],
          nearbyUsers: [],
          compatibilityScores: {},
          boostedProfiles: [],
          isLoading: false,
          swipeDirection: null,
          showMatchAnimation: false,
          undoAvailable: false,
        });
      },
    }),
    {
      name: "matching-store",
      partialize: (state) => ({
        matchPreferences: state.matchPreferences,
        searchRadius: state.searchRadius,
        totalSwipes: state.totalSwipes,
        totalMatches: state.totalMatches,
        superLikesRemaining: state.superLikesRemaining,
      }),
    }
  )
);
