import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import TabNavBar from "../../components/navigation/TabNavBar";
import { useCommunityStore } from "../../stores/modules/communityStore";

const ChatSpaceSubScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    channels,
    isLoadingChannels,
    loadChannels,
    channelMessages,
    members,
  } = useCommunityStore();

  useEffect(() => {
    if (channels.length === 0) {
      loadChannels();
    }
  }, []);

  const getLastMessage = (channelId: string) => {
    const msgs = channelMessages[channelId] || [];
    if (msgs.length === 0) return null;
    const last = msgs[msgs.length - 1];
    return last;
  };

  const renderChatRoom = ({ item }: { item: (typeof channels)[0] }) => {
    const lastMessage = getLastMessage(item.id);
    const memberCount = item.memberCount;
    return (
      <TouchableOpacity style={styles.chatRoomCard}>
        <View style={styles.chatRoomHeader}>
          <Text style={styles.chatRoomName}>{item.name}</Text>
          <Text style={styles.chatRoomMembers}>{memberCount} members</Text>
        </View>
        <Text style={styles.chatRoomDescription}>{item.description || ""}</Text>
        <View style={styles.chatRoomFooter}>
          <Text style={styles.lastMessage}>
            {lastMessage ? lastMessage.content : "No messages yet."}
          </Text>
          <Text style={styles.timestamp}>
            {lastMessage
              ? new Date(lastMessage.sentAt).toLocaleTimeString()
              : ""}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>ChatSpace</Text>
        <Text style={styles.subtitle}>Join community conversations</Text>

        {isLoadingChannels ? (
          <ActivityIndicator
            size="large"
            color="#2196f3"
            style={{ marginTop: 40 }}
          />
        ) : channels.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#888", marginTop: 40 }}>
            No channels found.
          </Text>
        ) : (
          <FlatList
            data={channels}
            renderItem={renderChatRoom}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScrollView>

      <TabNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  chatList: {
    paddingBottom: 20,
  },
  chatRoomCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
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
    color: "#333",
    flex: 1,
  },
  chatRoomMembers: {
    fontSize: 12,
    color: "#666",
  },
  chatRoomDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  chatRoomFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  timestamp: {
    fontSize: 10,
    color: "#999",
  },
});

export default ChatSpaceSubScreen;
