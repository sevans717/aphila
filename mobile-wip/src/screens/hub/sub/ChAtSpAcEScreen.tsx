import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  isCurrentUser: boolean;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  lastMessage: string;
  lastMessageTime: string;
}

const ChAtSpAcEScreen: React.FC = () => {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const chatRooms: ChatRoom[] = [
    {
      id: "general",
      name: "General Chat",
      description: "General discussions and community updates",
      memberCount: 1247,
      lastMessage: "Welcome to the community!",
      lastMessageTime: "2m ago",
    },
    {
      id: "tech",
      name: "Tech Talk",
      description: "Technology, programming, and innovation",
      memberCount: 856,
      lastMessage: "Anyone using React Native?",
      lastMessageTime: "5m ago",
    },
    {
      id: "gaming",
      name: "Gaming Hub",
      description: "Games, esports, and gaming culture",
      memberCount: 932,
      lastMessage: "New game recommendations?",
      lastMessageTime: "12m ago",
    },
    {
      id: "creative",
      name: "Creative Corner",
      description: "Art, music, and creative expression",
      memberCount: 654,
      lastMessage: "Sharing my latest artwork",
      lastMessageTime: "18m ago",
    },
  ];

  const mockMessages: ChatMessage[] = [
    {
      id: "1",
      user: "Alex",
      message: "Hey everyone! Welcome to the community chat!",
      timestamp: "10:30 AM",
      isCurrentUser: false,
    },
    {
      id: "2",
      user: "Jordan",
      message: "Thanks! This looks like a great place to connect",
      timestamp: "10:32 AM",
      isCurrentUser: false,
    },
    {
      id: "3",
      user: "You",
      message: "Excited to be here and meet new people!",
      timestamp: "10:35 AM",
      isCurrentUser: true,
    },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle sending message
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const renderChatRoom = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      style={[
        styles.chatRoomCard,
        activeRoom === item.id && styles.activeChatRoom,
      ]}
      onPress={() => setActiveRoom(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.chatRoomHeader}>
        <Text style={styles.chatRoomName}>{item.name}</Text>
        <Text style={styles.memberCount}>{item.memberCount} members</Text>
      </View>
      <Text style={styles.chatRoomDescription}>{item.description}</Text>
      <View style={styles.lastMessageContainer}>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
        <Text style={styles.lastMessageTime}>{item.lastMessageTime}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.isCurrentUser
          ? styles.currentUserMessage
          : styles.otherUserMessage,
      ]}
    >
      {!item.isCurrentUser && (
        <Text style={styles.messageUser}>{item.user}</Text>
      )}
      <View
        style={[
          styles.messageBubble,
          item.isCurrentUser
            ? styles.currentUserBubble
            : styles.otherUserBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isCurrentUser && styles.currentUserText,
          ]}
        >
          {item.message}
        </Text>
      </View>
      <Text style={styles.messageTime}>{item.timestamp}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {!activeRoom ? (
        // Chat Rooms List
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.title}>ChAtSpAcE</Text>
          <Text style={styles.subtitle}>Join community conversations</Text>

          <FlatList
            data={chatRooms}
            renderItem={renderChatRoom}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.chatRoomsList}
          />
        </ScrollView>
      ) : (
        // Active Chat Room
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setActiveRoom(null)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.chatTitle}>
              {chatRooms.find((room) => room.id === activeRoom)?.name}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <FlatList
            data={mockMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
          />

          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#6b7280"
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !message.trim() && styles.disabledButton,
              ]}
              onPress={handleSendMessage}
              disabled={!message.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#10b981",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 30,
  },
  chatRoomsList: {
    paddingBottom: 20,
  },
  chatRoomCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  activeChatRoom: {
    borderColor: "#10b981",
    backgroundColor: "#111827",
  },
  chatRoomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chatRoomName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  memberCount: {
    fontSize: 12,
    color: "#9ca3af",
  },
  chatRoomDescription: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 12,
    lineHeight: 20,
  },
  lastMessageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 12,
    color: "#6b7280",
    flex: 1,
  },
  lastMessageTime: {
    fontSize: 10,
    color: "#6b7280",
    marginLeft: 8,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#1f2937",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#10b981",
    fontSize: 16,
    fontWeight: "600",
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 50,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  currentUserMessage: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  otherUserMessage: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  messageUser: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
  },
  currentUserBubble: {
    backgroundColor: "#10b981",
  },
  otherUserBubble: {
    backgroundColor: "#374151",
  },
  messageText: {
    fontSize: 14,
    color: "#ffffff",
  },
  currentUserText: {
    color: "#ffffff",
  },
  messageTime: {
    fontSize: 10,
    color: "#6b7280",
  },
  messageInputContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1f2937",
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#374151",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    color: "#ffffff",
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#10b981",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#6b7280",
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ChAtSpAcEScreen;
