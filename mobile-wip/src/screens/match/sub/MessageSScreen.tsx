import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";

interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  timestamp: string;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: Message[];
}

const MessageSScreen: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [newMessage, setNewMessage] = useState("");

  // Mock data - replace with real API data
  const mockConversations: Conversation[] = [
    {
      id: "1",
      name: "Alex",
      lastMessage: "Hey! How's your weekend going?",
      timestamp: "2 min ago",
      unreadCount: 2,
      messages: [
        {
          id: "1",
          text: "Hi there! I saw we matched 😊",
          sender: "other",
          timestamp: "10 min ago",
        },
        {
          id: "2",
          text: "Hey! Yeah, I noticed that too. How are you?",
          sender: "me",
          timestamp: "8 min ago",
        },
        {
          id: "3",
          text: "I'm doing great! Just finished a hike. You?",
          sender: "other",
          timestamp: "5 min ago",
        },
        {
          id: "4",
          text: "Hey! How's your weekend going?",
          sender: "other",
          timestamp: "2 min ago",
        },
      ],
    },
    {
      id: "2",
      name: "Jordan",
      lastMessage: "That sounds amazing! Tell me more",
      timestamp: "1 hour ago",
      unreadCount: 0,
      messages: [
        {
          id: "1",
          text: "I love your guitar playing in your profile!",
          sender: "me",
          timestamp: "2 hours ago",
        },
        {
          id: "2",
          text: "Thanks! I've been playing for about 5 years now",
          sender: "other",
          timestamp: "1.5 hours ago",
        },
        {
          id: "3",
          text: "That's awesome! Any favorite bands?",
          sender: "me",
          timestamp: "1.2 hours ago",
        },
        {
          id: "4",
          text: "That sounds amazing! Tell me more",
          sender: "other",
          timestamp: "1 hour ago",
        },
      ],
    },
    {
      id: "3",
      name: "Taylor",
      lastMessage: "Let's try that new restaurant downtown",
      timestamp: "3 hours ago",
      unreadCount: 1,
      messages: [
        {
          id: "1",
          text: "I saw you're into cooking too!",
          sender: "me",
          timestamp: "4 hours ago",
        },
        {
          id: "2",
          text: "Yes! Love experimenting with new recipes",
          sender: "other",
          timestamp: "3.5 hours ago",
        },
        {
          id: "3",
          text: "Let's try that new restaurant downtown",
          sender: "other",
          timestamp: "3 hours ago",
        },
      ],
    },
  ];

  const selectedConv = mockConversations.find(
    (conv) => conv.id === selectedConversation
  );

  const sendMessage = () => {
    if (newMessage.trim() && selectedConv) {
      // In a real app, this would send the message to the backend
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => setSelectedConversation(item.id)}
    >
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.name}</Text>
          <Text style={styles.conversationTime}>{item.timestamp}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "me" ? styles.myMessage : styles.otherMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.messageTime}>{item.timestamp}</Text>
    </View>
  );

  if (selectedConversation && selectedConv) {
    return (
      <View style={styles.container}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.chatTitle}>{selectedConv.name}</Text>
        </View>

        {/* Messages */}
        <FlatList
          data={selectedConv.messages}
          renderItem={renderMessage}
          keyExtractor={(item: Message) => item.id}
          contentContainerStyle={styles.messagesContainer}
          inverted={false}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>

      <FlatList
        data={mockConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item: Conversation) => item.id}
        contentContainerStyle={styles.conversationsContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
    color: "#333",
  },
  conversationsContainer: {
    padding: 20,
  },
  conversationItem: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  conversationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  conversationTime: {
    fontSize: 12,
    color: "#666",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
  },
  unreadBadge: {
    backgroundColor: "#ff5252",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: "#2196f3",
    fontWeight: "500",
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  messagesContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    maxWidth: "80%",
    marginBottom: 10,
    padding: 12,
    borderRadius: 18,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2196f3",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  messageTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  sendButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MessageSScreen;
