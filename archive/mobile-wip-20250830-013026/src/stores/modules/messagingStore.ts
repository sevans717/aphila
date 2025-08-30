import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Conversation,
  Message,
  MessageStatus,
  TypingIndicator,
  MessageReaction,
  VoiceMessage,
  MessageAttachment,
} from "../../types/messaging";
import { User } from "../../types/user";

interface MessagingState {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;

  // Messages
  messages: Record<string, Message[]>; // conversationId -> messages
  messageQueue: Message[]; // Offline queue

  // Real-time state
  typingIndicators: TypingIndicator[];
  onlineUsers: Set<string>;
  deliveryReceipts: Record<string, MessageStatus>;

  // Voice messages
  voiceRecording: {
    isRecording: boolean;
    duration: number;
    conversationId: string | null;
  };

  // UI state
  isLoadingConversations: boolean;
  isLoadingMessages: Record<string, boolean>;
  searchQuery: string;
  filteredConversations: Conversation[];

  // Notifications
  unreadCounts: Record<string, number>;
  totalUnreadCount: number;

  // Settings
  messageSettings: {
    readReceipts: boolean;
    typingIndicators: boolean;
    mediaAutoDownload: boolean;
    voiceAutoPlay: boolean;
  };
}

interface MessagingActions {
  // Conversation management
  loadConversations: () => Promise<void>;
  createConversation: (participants: string[]) => Promise<string>;
  setActiveConversation: (conversationId: string | null) => void;
  deleteConversation: (conversationId: string) => void;

  // Message management
  loadMessages: (conversationId: string, offset?: number) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    attachments?: MessageAttachment[]
  ) => Promise<void>;
  sendVoiceMessage: (
    conversationId: string,
    voiceMessage: VoiceMessage
  ) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;

  // Message reactions
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;

  // Real-time features
  setTyping: (conversationId: string, isTyping: boolean) => void;
  updateOnlineStatus: (userIds: string[], isOnline: boolean) => void;
  markMessageAsDelivered: (messageId: string) => void;
  markMessageAsRead: (messageId: string) => void;
  markConversationAsRead: (conversationId: string) => void;

  // Voice recording
  startVoiceRecording: (conversationId: string) => void;
  stopVoiceRecording: () => void;
  updateRecordingDuration: (duration: number) => void;

  // Search and filtering
  searchConversations: (query: string) => void;
  clearSearch: () => void;

  // Settings
  updateMessageSettings: (
    settings: Partial<MessagingState["messageSettings"]>
  ) => void;

  // Offline support
  addToQueue: (message: Message) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;

  // Cleanup
  clearMessagingData: () => void;
}

type MessagingStore = MessagingState & MessagingActions;

export const useMessagingStore = create<MessagingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      conversations: [],
      activeConversationId: null,
      messages: {},
      messageQueue: [],
      typingIndicators: [],
      onlineUsers: new Set(),
      deliveryReceipts: {},
      voiceRecording: {
        isRecording: false,
        duration: 0,
        conversationId: null,
      },
      isLoadingConversations: false,
      isLoadingMessages: {},
      searchQuery: "",
      filteredConversations: [],
      unreadCounts: {},
      totalUnreadCount: 0,
      messageSettings: {
        readReceipts: true,
        typingIndicators: true,
        mediaAutoDownload: true,
        voiceAutoPlay: false,
      },

      // Actions
      loadConversations: async () => {
        set({ isLoadingConversations: true });
        try {
          // TODO: Implement API call
          // const conversations = await MessagingService.getConversations();
          // set({ conversations, filteredConversations: conversations });
          set({ isLoadingConversations: false });
        } catch (error) {
          console.error("Failed to load conversations:", error);
          set({ isLoadingConversations: false });
        }
      },

      createConversation: async (participants: string[]) => {
        try {
          // TODO: Implement API call
          // const conversation = await MessagingService.createConversation(participants);
          // set(state => ({
          //   conversations: [conversation, ...state.conversations],
          //   filteredConversations: [conversation, ...state.filteredConversations],
          // }));
          // return conversation.id;
          const conversationId = `conv_${Date.now()}`;
          return conversationId;
        } catch (error) {
          console.error("Failed to create conversation:", error);
          throw error;
        }
      },

      setActiveConversation: (conversationId: string | null) => {
        set({ activeConversationId: conversationId });
        if (conversationId) {
          get().markConversationAsRead(conversationId);
        }
      },

      deleteConversation: (conversationId: string) => {
        set((state) => {
          const { [conversationId]: deleted, ...remainingMessages } =
            state.messages;
          const { [conversationId]: deletedCount, ...remainingCounts } =
            state.unreadCounts;

          return {
            conversations: state.conversations.filter(
              (conv) => conv.id !== conversationId
            ),
            filteredConversations: state.filteredConversations.filter(
              (conv) => conv.id !== conversationId
            ),
            messages: remainingMessages,
            unreadCounts: remainingCounts,
            totalUnreadCount: state.totalUnreadCount - (deletedCount || 0),
            activeConversationId:
              state.activeConversationId === conversationId
                ? null
                : state.activeConversationId,
          };
        });
      },

      loadMessages: async (conversationId: string, offset = 0) => {
        set((state) => ({
          isLoadingMessages: {
            ...state.isLoadingMessages,
            [conversationId]: true,
          },
        }));

        try {
          // TODO: Implement API call
          // const messages = await MessagingService.getMessages(conversationId, offset);
          // set(state => ({
          //   messages: {
          //     ...state.messages,
          //     [conversationId]: offset === 0 ? messages : [...(state.messages[conversationId] || []), ...messages],
          //   },
          //   isLoadingMessages: { ...state.isLoadingMessages, [conversationId]: false },
          // }));
          set((state) => ({
            isLoadingMessages: {
              ...state.isLoadingMessages,
              [conversationId]: false,
            },
          }));
        } catch (error) {
          console.error("Failed to load messages:", error);
          set((state) => ({
            isLoadingMessages: {
              ...state.isLoadingMessages,
              [conversationId]: false,
            },
          }));
        }
      },

      sendMessage: async (
        conversationId: string,
        content: string,
        attachments?: MessageAttachment[]
      ) => {
        const message: Message = {
          id: `msg_${Date.now()}`,
          conversationId,
          senderId: "current_user", // TODO: Get from user store
          content,
          type: "text",
          status: "sending",
          replyTo: undefined,
          mentions: [],
          reactions: [],
          attachments: attachments || [],
          metadata: {
            isEdited: false,
            isForwarded: false,
            isEncrypted: false,
            priority: "normal",
          },
          editHistory: [],
          sentAt: new Date().toISOString(),
          deliveredAt: undefined,
          readAt: undefined,
          updatedAt: new Date().toISOString(),
        };

        // Optimistically add message
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [
              ...(state.messages[conversationId] || []),
              message,
            ],
          },
        }));

        try {
          // TODO: Implement API call
          // const sentMessage = await MessagingService.sendMessage(message);
          // set(state => ({
          //   messages: {
          //     ...state.messages,
          //     [conversationId]: state.messages[conversationId].map(msg =>
          //       msg.id === message.id ? sentMessage : msg
          //     ),
          //   },
          // }));

          // Simulate sent status
          setTimeout(() => {
            set((state) => ({
              messages: {
                ...state.messages,
                [conversationId]:
                  state.messages[conversationId]?.map((msg) =>
                    msg.id === message.id
                      ? { ...msg, status: "sent" as MessageStatus }
                      : msg
                  ) || [],
              },
            }));
          }, 1000);
        } catch (error) {
          console.error("Failed to send message:", error);
          // Mark as failed and add to queue for retry
          set((state) => ({
            messages: {
              ...state.messages,
              [conversationId]:
                state.messages[conversationId]?.map((msg) =>
                  msg.id === message.id
                    ? { ...msg, status: "failed" as MessageStatus }
                    : msg
                ) || [],
            },
            messageQueue: [...state.messageQueue, message],
          }));
        }
      },

      sendVoiceMessage: async (
        conversationId: string,
        voiceMessage: VoiceMessage
      ) => {
        const message: Message = {
          id: `msg_${Date.now()}`,
          conversationId,
          senderId: "current_user",
          content: "",
          type: "voice",
          status: "sending",
          replyTo: undefined,
          mentions: [],
          reactions: [],
          attachments: [
            {
              id: `att_${Date.now()}`,
              type: "voice_note",
              url: voiceMessage.url,
              fileName: "voice_message.mp3",
              fileSize: 0, // TODO: Calculate actual size
              mimeType: "audio/mpeg",
              duration: voiceMessage.duration,
            },
          ],
          metadata: {
            isEdited: false,
            isForwarded: false,
            isEncrypted: false,
            priority: "normal",
          },
          editHistory: [],
          sentAt: new Date().toISOString(),
          deliveredAt: undefined,
          readAt: undefined,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [
              ...(state.messages[conversationId] || []),
              message,
            ],
          },
        }));

        try {
          // TODO: Implement voice message upload and API call
          setTimeout(() => {
            set((state) => ({
              messages: {
                ...state.messages,
                [conversationId]:
                  state.messages[conversationId]?.map((msg) =>
                    msg.id === message.id
                      ? { ...msg, status: "sent" as MessageStatus }
                      : msg
                  ) || [],
              },
            }));
          }, 2000);
        } catch (error) {
          console.error("Failed to send voice message:", error);
        }
      },

      editMessage: (messageId: string, newContent: string) => {
        set((state) => {
          const newMessages = { ...state.messages };
          Object.keys(newMessages).forEach((conversationId) => {
            newMessages[conversationId] = newMessages[conversationId].map(
              (msg) =>
                msg.id === messageId
                  ? { ...msg, content: newContent, editedAt: new Date() }
                  : msg
            );
          });
          return { messages: newMessages };
        });
      },

      deleteMessage: (messageId: string) => {
        set((state) => {
          const newMessages = { ...state.messages };
          Object.keys(newMessages).forEach((conversationId) => {
            newMessages[conversationId] = newMessages[conversationId].filter(
              (msg) => msg.id !== messageId
            );
          });
          return { messages: newMessages };
        });
      },

      addReaction: (messageId: string, emoji: string) => {
        set((state) => {
          const newMessages = { ...state.messages };
          Object.keys(newMessages).forEach((conversationId) => {
            newMessages[conversationId] = newMessages[conversationId].map(
              (msg) => {
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
              }
            );
          });
          return { messages: newMessages };
        });
      },

      removeReaction: (messageId: string, emoji: string) => {
        set((state) => {
          const newMessages = { ...state.messages };
          Object.keys(newMessages).forEach((conversationId) => {
            newMessages[conversationId] = newMessages[conversationId].map(
              (msg) => {
                if (msg.id === messageId) {
                  msg.reactions =
                    msg.reactions?.filter(
                      (reaction) =>
                        !(
                          reaction.emoji === emoji &&
                          reaction.userId === "current_user"
                        )
                    ) || [];
                }
                return msg;
              }
            );
          });
          return { messages: newMessages };
        });
      },

      setTyping: (conversationId: string, isTyping: boolean) => {
        const userId = "current_user"; // TODO: Get from user store

        if (isTyping) {
          set((state) => {
            const existing = state.typingIndicators.find(
              (indicator) =>
                indicator.conversationId === conversationId &&
                indicator.userId === userId
            );

            if (!existing) {
              return {
                typingIndicators: [
                  ...state.typingIndicators,
                  {
                    conversationId,
                    userId,
                    isTyping: true,
                    startedAt: new Date().toISOString(),
                  },
                ],
              };
            }
            return state;
          });
        } else {
          set((state) => ({
            typingIndicators: state.typingIndicators.filter(
              (indicator) =>
                !(
                  indicator.conversationId === conversationId &&
                  indicator.userId === userId
                )
            ),
          }));
        }
      },

      updateOnlineStatus: (userIds: string[], isOnline: boolean) => {
        set((state) => {
          const newOnlineUsers = new Set(state.onlineUsers);
          userIds.forEach((userId) => {
            if (isOnline) {
              newOnlineUsers.add(userId);
            } else {
              newOnlineUsers.delete(userId);
            }
          });
          return { onlineUsers: newOnlineUsers };
        });
      },

      markMessageAsDelivered: (messageId: string) => {
        set((state) => ({
          deliveryReceipts: {
            ...state.deliveryReceipts,
            [messageId]: "delivered",
          },
        }));
      },

      markMessageAsRead: (messageId: string) => {
        set((state) => ({
          deliveryReceipts: { ...state.deliveryReceipts, [messageId]: "read" },
        }));
      },

      markConversationAsRead: (conversationId: string) => {
        set((state) => {
          const unreadCount = state.unreadCounts[conversationId] || 0;
          const { [conversationId]: deleted, ...remainingCounts } =
            state.unreadCounts;

          return {
            unreadCounts: remainingCounts,
            totalUnreadCount: Math.max(0, state.totalUnreadCount - unreadCount),
          };
        });
      },

      startVoiceRecording: (conversationId: string) => {
        set({
          voiceRecording: {
            isRecording: true,
            duration: 0,
            conversationId,
          },
        });
      },

      stopVoiceRecording: () => {
        set({
          voiceRecording: {
            isRecording: false,
            duration: 0,
            conversationId: null,
          },
        });
      },

      updateRecordingDuration: (duration: number) => {
        set((state) => ({
          voiceRecording: { ...state.voiceRecording, duration },
        }));
      },

      searchConversations: (query: string) => {
        set((state) => {
          if (!query.trim()) {
            return {
              searchQuery: query,
              filteredConversations: state.conversations,
            };
          }

          const filtered = state.conversations.filter(
            (conversation) =>
              conversation.participants.some((participant) =>
                participant.userId.toLowerCase().includes(query.toLowerCase())
              ) ||
              conversation.lastMessage?.content
                .toLowerCase()
                .includes(query.toLowerCase())
          );

          return { searchQuery: query, filteredConversations: filtered };
        });
      },

      clearSearch: () => {
        set((state) => ({
          searchQuery: "",
          filteredConversations: state.conversations,
        }));
      },

      updateMessageSettings: (
        settings: Partial<MessagingState["messageSettings"]>
      ) => {
        set((state) => ({
          messageSettings: { ...state.messageSettings, ...settings },
        }));
      },

      addToQueue: (message: Message) => {
        set((state) => ({
          messageQueue: [...state.messageQueue, message],
        }));
      },

      processQueue: async () => {
        const { messageQueue } = get();
        if (messageQueue.length === 0) return;

        // TODO: Implement queue processing
        // for (const message of messageQueue) {
        //   try {
        //     await MessagingService.sendMessage(message);
        //   } catch (error) {
        //     console.error('Failed to send queued message:', error);
        //   }
        // }

        set({ messageQueue: [] });
      },

      clearQueue: () => {
        set({ messageQueue: [] });
      },

      clearMessagingData: () => {
        set({
          conversations: [],
          activeConversationId: null,
          messages: {},
          messageQueue: [],
          typingIndicators: [],
          onlineUsers: new Set(),
          deliveryReceipts: {},
          isLoadingConversations: false,
          isLoadingMessages: {},
          searchQuery: "",
          filteredConversations: [],
          unreadCounts: {},
          totalUnreadCount: 0,
        });
      },
    }),
    {
      name: "messaging-store",
      partialize: (state) => ({
        conversations: state.conversations,
        messages: state.messages,
        unreadCounts: state.unreadCounts,
        totalUnreadCount: state.totalUnreadCount,
        messageSettings: state.messageSettings,
        messageQueue: state.messageQueue,
      }),
    }
  )
);
