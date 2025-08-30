import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMessagingStore } from "../../stores/modules/messagingStore";
import { Conversation, Message } from "../../types/messaging";
import TabNavBar from "../../components/navigation/TabNavBar";

const MessageSubScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messageText, setMessageText] = useState("");

  // Zustand store hooks
  const {
    conversations,
    messages,
    activeConversationId,
    isLoadingConversations,
    loadConversations,
    loadMessages,
    sendMessage,
    setActiveConversation,
  } = useMessagingStore();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      setActiveConversation(selectedConversation);
    }
  }, [selectedConversation, loadMessages, setActiveConversation]);

  const renderConversation = ({ item }: { item: Conversation }) => {
    // Get the other participant (assuming direct conversation)
    const otherParticipant = item.participants.find(
      (p) => p.userId !== "current_user"
    );
    const displayName = otherParticipant?.userId || "Unknown";
    const isOnline = otherParticipant?.isOnline || false;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => setSelectedConversation(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.conversationAvatar}>
          <Text style={styles.avatarText}>👤</Text>
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{displayName}</Text>
            <Text style={styles.conversationTime}>
              {item.lastMessage
                ? new Date(item.lastMessage.sentAt).toLocaleTimeString()
                : ""}
            </Text>
          </View>

          <View style={styles.conversationFooter}>
            <Text style={styles.conversationMessage} numberOfLines={1}>
              {item.lastMessage?.content || "No messages yet"}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isFromUser = item.senderId === "current_user";

    return (
      <View
        style={[
          styles.messageContainer,
          isFromUser ? styles.userMessage : styles.otherMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isFromUser ? styles.userMessageText : styles.otherMessageText,
          ]}
        >
          {item.content}
        </Text>
        <Text
          style={[
            styles.messageTime,
            isFromUser ? styles.userMessageTime : styles.otherMessageTime,
          ]}
        >
          {new Date(item.sentAt).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  const handleSendMessage = async () => {
    if (messageText.trim() && selectedConversation) {
      await sendMessage(selectedConversation, messageText.trim());
      setMessageText("");
    }
  };

  if (selectedConversation) {
    const conversation = conversations.find(
      (c) => c.id === selectedConversation
    );
    const conversationMessages = messages[selectedConversation] || [];

    return (
      <View style={styles.container}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.chatHeaderInfo}>
            <View style={styles.chatAvatar}>
              <Text style={styles.chatAvatarText}>👤</Text>
              {conversation?.participants.find(
                (p) => p.userId !== "current_user"
              )?.isOnline && <View style={styles.chatOnlineIndicator} />}
            </View>
            <View>
              <Text style={styles.chatName}>
                {conversation?.participants.find(
                  (p) => p.userId !== "current_user"
                )?.userId || "Unknown"}
              </Text>
              <Text style={styles.chatStatus}>
                {conversation?.participants.find(
                  (p) => p.userId !== "current_user"
                )?.isOnline
                  ? "Online"
                  : "Offline"}
              </Text>
            </View>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* Messages */}
        <FlatList
          data={conversationMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Text style={styles.sendButtonText}>📤</Text>
          </TouchableOpacity>
        </View>

        <TabNavBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Conversations List */}
      {isLoadingConversations ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.conversationsContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No conversations yet</Text>
            </View>
          }
        />
      )}

      <TabNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerSpacer: {
    width: 60,
  },
  conversationsContainer: {
    padding: 20,
  },
  conversationItem: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
  },
  onlineIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    borderWidth: 2,
    borderColor: "#000",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  conversationTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  conversationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  conversationMessage: {
    fontSize: 14,
    color: "#9ca3af",
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: "#6366f1",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  chatHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatAvatarText: {
    fontSize: 16,
  },
  chatOnlineIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    borderWidth: 2,
    borderColor: "#000",
  },
  chatName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  chatStatus: {
    fontSize: 12,
    color: "#10b981",
  },
  messagesContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  messageContainer: {
    maxWidth: "80%",
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#6366f1",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#1f2937",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#ffffff",
  },
  otherMessageText: {
    color: "#d1d5db",
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userMessageTime: {
    color: "#e0e7ff",
    alignSelf: "flex-end",
  },
  otherMessageTime: {
    color: "#9ca3af",
    alignSelf: "flex-start",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#1f2937",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  sendButtonText: {
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
  },
});

export default MessageSubScreen;
