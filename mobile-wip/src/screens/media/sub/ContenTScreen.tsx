import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

interface ContentItem {
  id: string;
  title: string;
  type: "photo" | "video" | "post";
  thumbnail: string;
  date: string;
}

const ContenTScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<
    "saves" | "favorites" | "store" | "personal"
  >("saves");

  // Mock data - replace with real API data
  const mockSaves: ContentItem[] = [
    {
      id: "1",
      title: "Beautiful Sunset",
      type: "photo",
      thumbnail: "🌅",
      date: "2 days ago",
    },
    {
      id: "2",
      title: "Cooking Tutorial",
      type: "video",
      thumbnail: "👨‍🍳",
      date: "1 week ago",
    },
    {
      id: "3",
      title: "Travel Tips",
      type: "post",
      thumbnail: "✈️",
      date: "3 days ago",
    },
  ];

  const mockFavorites: ContentItem[] = [
    {
      id: "4",
      title: "Mountain View",
      type: "photo",
      thumbnail: "🏔️",
      date: "5 days ago",
    },
    {
      id: "5",
      title: "Music Playlist",
      type: "post",
      thumbnail: "🎵",
      date: "1 day ago",
    },
  ];

  const mockStoreItems: ContentItem[] = [
    {
      id: "6",
      title: "Premium Filter Pack",
      type: "post",
      thumbnail: "🎨",
      date: "New",
    },
    {
      id: "7",
      title: "Video Editing Template",
      type: "video",
      thumbnail: "🎬",
      date: "Featured",
    },
    {
      id: "8",
      title: "Photography Guide",
      type: "post",
      thumbnail: "📸",
      date: "Bestseller",
    },
  ];

  const mockPersonal: ContentItem[] = [
    {
      id: "9",
      title: "My First Photo",
      type: "photo",
      thumbnail: "📷",
      date: "2 weeks ago",
    },
    {
      id: "10",
      title: "Personal Vlog",
      type: "video",
      thumbnail: "🎥",
      date: "1 week ago",
    },
    {
      id: "11",
      title: "Life Update",
      type: "post",
      thumbnail: "📝",
      date: "3 days ago",
    },
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case "saves":
        return mockSaves;
      case "favorites":
        return mockFavorites;
      case "store":
        return mockStoreItems;
      case "personal":
        return mockPersonal;
      default:
        return mockSaves;
    }
  };

  const renderContentItem = ({ item }: { item: ContentItem }) => (
    <TouchableOpacity style={styles.contentItem} activeOpacity={0.7}>
      <View style={styles.itemThumbnail}>
        <Text style={styles.thumbnailEmoji}>{item.thumbnail}</Text>
        {item.type === "video" && (
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>▶️</Text>
          </View>
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.itemDate}>{item.date}</Text>
        <Text style={styles.itemType}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </Text>
      </View>

      <TouchableOpacity style={styles.itemAction}>
        <Text style={styles.actionText}>
          {activeTab === "store" ? "🛒" : activeTab === "saves" ? "💾" : "❤️"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>
        {activeTab === "saves"
          ? "💾"
          : activeTab === "favorites"
            ? "❤️"
            : activeTab === "store"
              ? "🛒"
              : "📁"}
      </Text>
      <Text style={styles.emptyTitle}>
        {activeTab === "saves"
          ? "No Saved Content"
          : activeTab === "favorites"
            ? "No Favorites Yet"
            : activeTab === "store"
              ? "Store Coming Soon"
              : "No Personal Content"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "saves"
          ? "Save content you want to view later"
          : activeTab === "favorites"
            ? "Add content to your favorites"
            : activeTab === "store"
              ? "Browse premium content and tools"
              : "Create and upload your own content"}
      </Text>
    </View>
  );

  const currentData = getCurrentData();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "saves" && styles.activeTab]}
          onPress={() => setActiveTab("saves")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "saves" && styles.activeTabText,
            ]}
          >
            💾 Saves
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "favorites" && styles.activeTab]}
          onPress={() => setActiveTab("favorites")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "favorites" && styles.activeTabText,
            ]}
          >
            ❤️ Favorites
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "store" && styles.activeTab]}
          onPress={() => setActiveTab("store")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "store" && styles.activeTabText,
            ]}
          >
            🛒 Store
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "personal" && styles.activeTab]}
          onPress={() => setActiveTab("personal")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "personal" && styles.activeTabText,
            ]}
          >
            📁 Personal
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      <FlatList
        data={currentData}
        renderItem={renderContentItem}
        keyExtractor={(item: ContentItem) => item.id}
        contentContainerStyle={styles.contentList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Quick Actions */}
      {activeTab === "store" && (
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>🎨 Premium Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>📚 Templates</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "personal" && (
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>📤 Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>📝 Create Post</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 15,
    borderRadius: 25,
    padding: 5,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#2196f3",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "white",
  },
  contentList: {
    padding: 15,
    paddingTop: 0,
  },
  contentItem: {
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
  itemThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  thumbnailEmoji: {
    fontSize: 30,
  },
  videoBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff5252",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  videoBadgeText: {
    fontSize: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  itemDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  itemType: {
    fontSize: 12,
    color: "#2196f3",
    fontWeight: "500",
  },
  itemAction: {
    padding: 10,
  },
  actionText: {
    fontSize: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  quickActions: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 15,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: "#2196f3",
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 5,
    alignItems: "center",
  },
  quickActionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ContenTScreen;
