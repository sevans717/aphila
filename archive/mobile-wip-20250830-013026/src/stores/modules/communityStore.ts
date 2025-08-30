import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CommunityChannel,
  CommunityMember,
  BoostedContent,
  TrendingItem,
  CommunityPost,
  PostType,
  PostMedia,
} from "../../types/community";
import { MessageReaction } from "../../types/messaging";
import { ChatMessage } from "../../types/messaging";

interface CommunityState {
  // Chat channels
  channels: CommunityChannel[];
  activeChannelId: string | null;
  channelMessages: Record<string, ChatMessage[]>;

  // Community members
  members: CommunityMember[];
  onlineMembers: Set<string>;
  moderators: Set<string>;
  admins: Set<string>;

  // Posts and content creation
  posts: CommunityPost[];
  draftPosts: Partial<CommunityPost>[];
  isCreatingPost: boolean;
  selectedCategoryId: string | null;

  // Boosted content
  boostedProfiles: BoostedContent[];
  boostedPosts: BoostedContent[];
  boostedCommunities: BoostedContent[];
  userBoosts: BoostedContent[];

  // Trending/Popular content
  trendingPosts: TrendingItem[];
  trendingProfiles: TrendingItem[];
  trendingHashtags: string[];
  trendingCommunities: TrendingItem[];
  viralContent: TrendingItem[];

  // Community engagement
  communityStats: {
    totalMembers: number;
    activeMembers: number;
    totalMessages: number;
    dailyActivity: number;
  };

  // User engagement
  userEngagement: {
    messagesCount: number;
    reactionsGiven: number;
    mentionsCount: number;
    boostsUsed: number;
  };

  // UI state
  isLoadingChannels: boolean;
  isLoadingBoosted: boolean;
  isLoadingTrending: boolean;
  selectedBoostType: "profile" | "post" | "community";

  // Chat state
  typingUsers: Record<string, Set<string>>; // channelId -> userIds
  unreadCounts: Record<string, number>;
}

interface CommunityActions {
  // Channel management
  loadChannels: () => Promise<void>;
  createChannel: (
    name: string,
    description: string,
    isPrivate?: boolean
  ) => Promise<string>;
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: (channelId: string) => Promise<void>;
  setActiveChannel: (channelId: string | null) => void;

  // Channel messaging
  loadChannelMessages: (channelId: string, offset?: number) => Promise<void>;
  sendChannelMessage: (
    channelId: string,
    content: string,
    mentions?: string[]
  ) => Promise<void>;
  deleteChannelMessage: (channelId: string, messageId: string) => void;
  reactToMessage: (channelId: string, messageId: string, emoji: string) => void;

  // Post creation and management
  createPost: (
    categoryId: string,
    content: string,
    title?: string,
    type?: PostType,
    media?: PostMedia[],
    tags?: string[]
  ) => Promise<string>;
  saveDraftPost: (draft: Partial<CommunityPost>) => string;
  loadPosts: (categoryId?: string) => Promise<void>;
  updatePost: (
    postId: string,
    updates: Partial<CommunityPost>
  ) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  setSelectedCategory: (categoryId: string | null) => void;

  // Member management
  loadMembers: () => Promise<void>;
  updateMemberRole: (
    memberId: string,
    role: "member" | "moderator" | "admin"
  ) => Promise<void>;
  kickMember: (memberId: string) => Promise<void>;
  banMember: (memberId: string, duration?: number) => Promise<void>;

  // Boosted content
  loadBoostedContent: () => Promise<void>;
  createBoost: (
    contentId: string,
    contentType: "profile" | "post" | "community",
    budget: number,
    duration: number
  ) => Promise<string>;
  updateBoost: (
    boostId: string,
    updates: Partial<BoostedContent>
  ) => Promise<void>;
  pauseBoost: (boostId: string) => Promise<void>;
  resumeBoost: (boostId: string) => Promise<void>;
  deleteBoost: (boostId: string) => Promise<void>;

  // Trending content
  loadTrendingContent: () => Promise<void>;
  loadTrendingHashtags: () => Promise<void>;
  reportTrendingItem: (itemId: string, reason: string) => Promise<void>;

  // Real-time features
  setUserTyping: (channelId: string, isTyping: boolean) => void;
  updateOnlineMembers: (memberIds: string[], isOnline: boolean) => void;
  markChannelAsRead: (channelId: string) => void;

  // Analytics and stats
  updateCommunityStats: () => Promise<void>;
  updateUserEngagement: () => Promise<void>;

  // Moderation
  moderateContent: (
    contentId: string,
    action: "approve" | "reject" | "flag"
  ) => Promise<void>;
  reportContent: (contentId: string, reason: string) => Promise<void>;

  // Cleanup
  clearCommunityData: () => void;
}

type CommunityStore = CommunityState & CommunityActions;

export const useCommunityStore = create<CommunityStore>()(
  persist(
    (set, get) => ({
      // Initial state
      channels: [],
      activeChannelId: null,
      channelMessages: {},
      members: [],
      onlineMembers: new Set(),
      moderators: new Set(),
      admins: new Set(),
      posts: [],
      draftPosts: [],
      isCreatingPost: false,
      selectedCategoryId: null,
      boostedProfiles: [],
      boostedPosts: [],
      boostedCommunities: [],
      userBoosts: [],
      trendingPosts: [],
      trendingProfiles: [],
      trendingHashtags: [],
      trendingCommunities: [],
      viralContent: [],
      communityStats: {
        totalMembers: 0,
        activeMembers: 0,
        totalMessages: 0,
        dailyActivity: 0,
      },
      userEngagement: {
        messagesCount: 0,
        reactionsGiven: 0,
        mentionsCount: 0,
        boostsUsed: 0,
      },
      isLoadingChannels: false,
      isLoadingBoosted: false,
      isLoadingTrending: false,
      selectedBoostType: "profile",
      typingUsers: {},
      unreadCounts: {},

      // Actions
      loadChannels: async () => {
        set({ isLoadingChannels: true });
        try {
          // TODO: Implement API call
          // const channels = await CommunityService.getChannels();
          // set({ channels, isLoadingChannels: false });
          set({ isLoadingChannels: false });
        } catch (error) {
          console.error("Failed to load channels:", error);
          set({ isLoadingChannels: false });
        }
      },

      createChannel: async (
        name: string,
        description: string,
        isPrivate = false
      ) => {
        try {
          // TODO: Implement API call
          const channelId = `channel_${Date.now()}`;
          const channel: CommunityChannel = {
            id: channelId,
            communityId: "default",
            name,
            description,
            type: "text",
            isPrivate,
            memberCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            channels: [...state.channels, channel],
          }));

          return channelId;
        } catch (error) {
          console.error("Failed to create channel:", error);
          throw error;
        }
      },

      joinChannel: async (channelId: string) => {
        try {
          // TODO: Implement API call
          set((state) => ({
            channels: state.channels.map((channel) =>
              channel.id === channelId
                ? { ...channel, memberCount: channel.memberCount + 1 }
                : channel
            ),
          }));
        } catch (error) {
          console.error("Failed to join channel:", error);
          throw error;
        }
      },

      leaveChannel: async (channelId: string) => {
        try {
          // TODO: Implement API call
          set((state) => ({
            channels: state.channels.map((channel) =>
              channel.id === channelId
                ? {
                    ...channel,
                    memberCount: Math.max(0, channel.memberCount - 1),
                  }
                : channel
            ),
            activeChannelId:
              state.activeChannelId === channelId
                ? null
                : state.activeChannelId,
          }));
        } catch (error) {
          console.error("Failed to leave channel:", error);
          throw error;
        }
      },

      setActiveChannel: (channelId: string | null) => {
        set({ activeChannelId: channelId });
        if (channelId) {
          get().loadChannelMessages(channelId);
          get().markChannelAsRead(channelId);
        }
      },

      loadChannelMessages: async (channelId: string, offset = 0) => {
        try {
          // TODO: Implement API call
          // const messages = await CommunityService.getChannelMessages(channelId, offset);
          // set(state => ({
          //   channelMessages: {
          //     ...state.channelMessages,
          //     [channelId]: offset === 0 ? messages : [...(state.channelMessages[channelId] || []), ...messages],
          //   },
          // }));
        } catch (error) {
          console.error("Failed to load channel messages:", error);
        }
      },

      sendChannelMessage: async (
        channelId: string,
        content: string,
        mentions = []
      ) => {
        const message: ChatMessage = {
          id: `msg_${Date.now()}`,
          conversationId: channelId,
          senderId: "current_user",
          content,
          type: "text",
          status: "sent",
          metadata: {
            isEdited: false,
            isForwarded: false,
            isEncrypted: false,
            priority: "normal",
          },
          mentions,
          reactions: [],
          attachments: [],
          editHistory: [],
          sentAt: new Date().toISOString(),
        };

        // Optimistically add message
        set((state) => ({
          channelMessages: {
            ...state.channelMessages,
            [channelId]: [...(state.channelMessages[channelId] || []), message],
          },
          userEngagement: {
            ...state.userEngagement,
            messagesCount: state.userEngagement.messagesCount + 1,
          },
        }));

        try {
          // TODO: Implement API call
          // await CommunityService.sendChannelMessage(channelId, message);
        } catch (error) {
          console.error("Failed to send channel message:", error);
          // Remove optimistic message on failure
          set((state) => ({
            channelMessages: {
              ...state.channelMessages,
              [channelId]:
                state.channelMessages[channelId]?.filter(
                  (msg) => msg.id !== message.id
                ) || [],
            },
          }));
        }
      },

      deleteChannelMessage: (channelId: string, messageId: string) => {
        set((state) => ({
          channelMessages: {
            ...state.channelMessages,
            [channelId]:
              state.channelMessages[channelId]?.filter(
                (msg) => msg.id !== messageId
              ) || [],
          },
        }));
      },

      reactToMessage: (channelId: string, messageId: string, emoji: string) => {
        set((state) => {
          const messages = state.channelMessages[channelId] || [];
          const updatedMessages = messages.map((msg) => {
            if (msg.id === messageId) {
              const existingReaction = msg.reactions?.find(
                (r) => r.emoji === emoji && r.userId === "current_user"
              );
              if (!existingReaction) {
                const newReaction: MessageReaction = {
                  id: `reaction_${Date.now()}`,
                  emoji,
                  userId: "current_user",
                  createdAt: new Date().toISOString(),
                };
                msg.reactions = [...(msg.reactions || []), newReaction];
              }
            }
            return msg;
          });

          return {
            channelMessages: {
              ...state.channelMessages,
              [channelId]: updatedMessages,
            },
            userEngagement: {
              ...state.userEngagement,
              reactionsGiven: state.userEngagement.reactionsGiven + 1,
            },
          };
        });
      },

      // Post creation and management
      createPost: async (
        categoryId: string,
        content: string,
        title?: string,
        type: PostType = "text",
        media: PostMedia[] = [],
        tags: string[] = []
      ) => {
        set({ isCreatingPost: true });
        try {
          const postId = `post_${Date.now()}`;
          const post: CommunityPost = {
            id: postId,
            categoryId,
            authorId: "current_user", // TODO: Get from auth
            title,
            content,
            type,
            media,
            tags,
            mentions: [],
            likes: 0,
            dislikes: 0,
            comments: 0,
            shares: 0,
            views: 0,
            isSticky: false,
            isLocked: false,
            isNSFW: false,
            moderationStatus: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // TODO: Implement API call
          // await CommunityService.createPost(post);

          set((state) => ({
            posts: [post, ...state.posts],
            isCreatingPost: false,
          }));

          return postId;
        } catch (error) {
          console.error("Failed to create post:", error);
          set({ isCreatingPost: false });
          throw error;
        }
      },

      saveDraftPost: (draft: Partial<CommunityPost>) => {
        const draftId = `draft_${Date.now()}`;
        const fullDraft: Partial<CommunityPost> = {
          ...draft,
          id: draftId,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          draftPosts: [...state.draftPosts, fullDraft],
        }));

        return draftId;
      },

      loadPosts: async (categoryId?: string) => {
        try {
          // TODO: Implement API call
          // const posts = categoryId
          //   ? await CommunityService.getPostsByCategory(categoryId)
          //   : await CommunityService.getAllPosts();
          // set({ posts });
        } catch (error) {
          console.error("Failed to load posts:", error);
        }
      },

      updatePost: async (postId: string, updates: Partial<CommunityPost>) => {
        try {
          // TODO: Implement API call
          // await CommunityService.updatePost(postId, updates);

          set((state) => ({
            posts: state.posts.map((post) =>
              post.id === postId
                ? { ...post, ...updates, updatedAt: new Date().toISOString() }
                : post
            ),
          }));
        } catch (error) {
          console.error("Failed to update post:", error);
          throw error;
        }
      },

      deletePost: async (postId: string) => {
        try {
          // TODO: Implement API call
          // await CommunityService.deletePost(postId);

          set((state) => ({
            posts: state.posts.filter((post) => post.id !== postId),
          }));
        } catch (error) {
          console.error("Failed to delete post:", error);
          throw error;
        }
      },

      setSelectedCategory: (categoryId: string | null) => {
        set({ selectedCategoryId: categoryId });
      },

      loadMembers: async () => {
        try {
          // TODO: Implement API call
          // const members = await CommunityService.getMembers();
          // set({ members });
        } catch (error) {
          console.error("Failed to load members:", error);
        }
      },

      updateMemberRole: async (
        memberId: string,
        role: "member" | "moderator" | "admin"
      ) => {
        try {
          // TODO: Implement API call
          set((state) => {
            const newModerators = new Set(state.moderators);
            const newAdmins = new Set(state.admins);

            // Remove from existing role sets
            newModerators.delete(memberId);
            newAdmins.delete(memberId);

            // Add to new role set
            if (role === "moderator") {
              newModerators.add(memberId);
            } else if (role === "admin") {
              newAdmins.add(memberId);
            }

            return {
              members: state.members.map((member) =>
                member.id === memberId ? { ...member, role } : member
              ),
              moderators: newModerators,
              admins: newAdmins,
            };
          });
        } catch (error) {
          console.error("Failed to update member role:", error);
          throw error;
        }
      },

      kickMember: async (memberId: string) => {
        try {
          // TODO: Implement API call
          set((state) => ({
            members: state.members.filter((member) => member.id !== memberId),
          }));
        } catch (error) {
          console.error("Failed to kick member:", error);
          throw error;
        }
      },

      banMember: async (memberId: string, duration?: number) => {
        try {
          // TODO: Implement API call with duration
          set((state) => ({
            members: state.members.filter((member) => member.id !== memberId),
          }));
        } catch (error) {
          console.error("Failed to ban member:", error);
          throw error;
        }
      },

      loadBoostedContent: async () => {
        set({ isLoadingBoosted: true });
        try {
          // TODO: Implement API calls
          // const boostedProfiles = await CommunityService.getBoostedProfiles();
          // const boostedPosts = await CommunityService.getBoostedPosts();
          // const boostedCommunities = await CommunityService.getBoostedCommunities();
          // const userBoosts = await CommunityService.getUserBoosts();
          // set({ boostedProfiles, boostedPosts, boostedCommunities, userBoosts });
          set({ isLoadingBoosted: false });
        } catch (error) {
          console.error("Failed to load boosted content:", error);
          set({ isLoadingBoosted: false });
        }
      },

      createBoost: async (
        contentId: string,
        contentType: "profile" | "post" | "community",
        budget: number,
        duration: number
      ) => {
        try {
          // TODO: Implement API call
          const boostId = `boost_${Date.now()}`;
          const boost: BoostedContent = {
            id: boostId,
            type: contentType,
            targetId: contentId,
            userId: "current_user",
            boostLevel: budget,
            expiresAt: new Date(
              Date.now() + duration * 24 * 60 * 60 * 1000
            ).toISOString(),
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            userBoosts: [...state.userBoosts, boost],
            userEngagement: {
              ...state.userEngagement,
              boostsUsed: state.userEngagement.boostsUsed + 1,
            },
          }));

          return boostId;
        } catch (error) {
          console.error("Failed to create boost:", error);
          throw error;
        }
      },

      updateBoost: async (
        boostId: string,
        updates: Partial<BoostedContent>
      ) => {
        try {
          // TODO: Implement API call
          set((state) => ({
            userBoosts: state.userBoosts.map((boost) =>
              boost.id === boostId ? { ...boost, ...updates } : boost
            ),
          }));
        } catch (error) {
          console.error("Failed to update boost:", error);
          throw error;
        }
      },

      pauseBoost: async (boostId: string) => {
        await get().updateBoost(boostId, {});
      },

      resumeBoost: async (boostId: string) => {
        await get().updateBoost(boostId, {});
      },

      deleteBoost: async (boostId: string) => {
        try {
          // TODO: Implement API call
          set((state) => ({
            userBoosts: state.userBoosts.filter(
              (boost) => boost.id !== boostId
            ),
          }));
        } catch (error) {
          console.error("Failed to delete boost:", error);
          throw error;
        }
      },

      loadTrendingContent: async () => {
        set({ isLoadingTrending: true });
        try {
          // TODO: Implement API calls
          // const trendingPosts = await CommunityService.getTrendingPosts();
          // const trendingProfiles = await CommunityService.getTrendingProfiles();
          // const trendingCommunities = await CommunityService.getTrendingCommunities();
          // const viralContent = await CommunityService.getViralContent();
          // set({ trendingPosts, trendingProfiles, trendingCommunities, viralContent });
          set({ isLoadingTrending: false });
        } catch (error) {
          console.error("Failed to load trending content:", error);
          set({ isLoadingTrending: false });
        }
      },

      loadTrendingHashtags: async () => {
        try {
          // TODO: Implement API call
          // const hashtags = await CommunityService.getTrendingHashtags();
          // set({ trendingHashtags: hashtags });
        } catch (error) {
          console.error("Failed to load trending hashtags:", error);
        }
      },

      reportTrendingItem: async (itemId: string, reason: string) => {
        try {
          // TODO: Implement API call
          console.log("Reported trending item:", itemId, reason);
        } catch (error) {
          console.error("Failed to report trending item:", error);
          throw error;
        }
      },

      setUserTyping: (channelId: string, isTyping: boolean) => {
        const userId = "current_user";

        set((state) => {
          const channelTyping = new Set(state.typingUsers[channelId] || []);

          if (isTyping) {
            channelTyping.add(userId);
          } else {
            channelTyping.delete(userId);
          }

          return {
            typingUsers: {
              ...state.typingUsers,
              [channelId]: channelTyping,
            },
          };
        });
      },

      updateOnlineMembers: (memberIds: string[], isOnline: boolean) => {
        set((state) => {
          const newOnlineMembers = new Set(state.onlineMembers);
          memberIds.forEach((memberId) => {
            if (isOnline) {
              newOnlineMembers.add(memberId);
            } else {
              newOnlineMembers.delete(memberId);
            }
          });
          return { onlineMembers: newOnlineMembers };
        });
      },

      markChannelAsRead: (channelId: string) => {
        set((state) => {
          const { [channelId]: deleted, ...remainingCounts } =
            state.unreadCounts;
          return { unreadCounts: remainingCounts };
        });
      },

      updateCommunityStats: async () => {
        try {
          // TODO: Implement API call
          // const stats = await CommunityService.getCommunityStats();
          // set({ communityStats: stats });
        } catch (error) {
          console.error("Failed to update community stats:", error);
        }
      },

      updateUserEngagement: async () => {
        try {
          // TODO: Implement API call
          // const engagement = await CommunityService.getUserEngagement();
          // set({ userEngagement: engagement });
        } catch (error) {
          console.error("Failed to update user engagement:", error);
        }
      },

      moderateContent: async (
        contentId: string,
        action: "approve" | "reject" | "flag"
      ) => {
        try {
          // TODO: Implement API call
          console.log("Moderated content:", contentId, action);
        } catch (error) {
          console.error("Failed to moderate content:", error);
          throw error;
        }
      },

      reportContent: async (contentId: string, reason: string) => {
        try {
          // TODO: Implement API call
          console.log("Reported content:", contentId, reason);
        } catch (error) {
          console.error("Failed to report content:", error);
          throw error;
        }
      },

      clearCommunityData: () => {
        set({
          channels: [],
          activeChannelId: null,
          channelMessages: {},
          members: [],
          onlineMembers: new Set(),
          moderators: new Set(),
          admins: new Set(),
          posts: [],
          draftPosts: [],
          isCreatingPost: false,
          selectedCategoryId: null,
          boostedProfiles: [],
          boostedPosts: [],
          boostedCommunities: [],
          userBoosts: [],
          trendingPosts: [],
          trendingProfiles: [],
          trendingHashtags: [],
          trendingCommunities: [],
          viralContent: [],
          communityStats: {
            totalMembers: 0,
            activeMembers: 0,
            totalMessages: 0,
            dailyActivity: 0,
          },
          userEngagement: {
            messagesCount: 0,
            reactionsGiven: 0,
            mentionsCount: 0,
            boostsUsed: 0,
          },
          typingUsers: {},
          unreadCounts: {},
        });
      },
    }),
    {
      name: "community-store",
      partialize: (state) => ({
        channels: state.channels,
        userBoosts: state.userBoosts,
        userEngagement: state.userEngagement,
        selectedBoostType: state.selectedBoostType,
        unreadCounts: state.unreadCounts,
      }),
    }
  )
);
