import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMediaStore } from "../../stores/modules/mediaStore";
import { MediaItem } from "../../types/media";
import TabNavBar from "../../components/navigation/TabNavBar";

const ContentSubScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<
    "saves" | "favorites" | "store" | "personal"
  >("saves");

  // Media store hooks
  const {
    mediaItems,
    collections,
    loadMediaLibrary,
    isLoading,
    totalPhotos,
    totalVideos,
  } = useMediaStore();

  // Load media library on mount
  useEffect(() => {
    loadMediaLibrary();
  }, [loadMediaLibrary]);

  const renderContentItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity style={styles.contentItem} activeOpacity={0.7}>
      <View style={styles.contentThumbnail}>
        <Text style={styles.thumbnailText}>
          {item.type === "image" ? "📸" : item.type === "video" ? "🎥" : "📝"}
        </Text>
      </View>

      <View style={styles.contentInfo}>
        <Text style={styles.contentTitle}>
          {item.fileName || `Media ${item.id}`}
        </Text>
        <Text style={styles.contentDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <View style={styles.contentStats}>
          <Text style={styles.likesText}>❤️ {item.analytics.likes}</Text>
          <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.moreButton}>
        <Text style={styles.moreText}>⋯</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSavesContent = () => {
    // Mock saved content - in real app this would be from a saved collection
    const savedItems = mediaItems.slice(0, 5); // Mock: first 5 items as saved

    return (
      <FlatList
        data={savedItems}
        renderItem={renderContentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Your Saved Content</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved content yet</Text>
          </View>
        }
      />
    );
  };

  const renderFavoritesContent = () => {
    // Mock favorites - items with high engagement
    const favoriteItems = mediaItems.filter(
      (item) => item.analytics.likes > 10
    );

    return (
      <FlatList
        data={favoriteItems}
        renderItem={renderContentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Your Favorites</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No favorite content yet</Text>
          </View>
        }
      />
    );
  };

  const renderStoreContent = () => (
    <View style={styles.storeContainer}>
      <Text style={styles.sectionTitle}>Content Store</Text>
      <Text style={styles.storeDescription}>
        Discover premium content and digital products from creators
      </Text>

      <View style={styles.storeCategories}>
        <TouchableOpacity style={styles.storeCategory}>
          <Text style={styles.categoryIcon}>🎨</Text>
          <Text style={styles.categoryText}>Art</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.storeCategory}>
          <Text style={styles.categoryIcon}>📸</Text>
          <Text style={styles.categoryText}>Photography</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.storeCategory}>
          <Text style={styles.categoryIcon}>🎵</Text>
          <Text style={styles.categoryText}>Music</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.storeCategory}>
          <Text style={styles.categoryIcon}>📚</Text>
          <Text style={styles.categoryText}>Tutorials</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPersonalContent = () => (
    <FlatList
      data={mediaItems}
      renderItem={renderContentItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.contentList}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          <Text style={styles.sectionTitle}>Your Personal Content</Text>
          <View style={styles.personalStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mediaItems.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {mediaItems.reduce(
                  (sum, item) => sum + item.analytics.views,
                  0
                )}
              </Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {mediaItems.reduce(
                  (sum, item) => sum + item.analytics.likes,
                  0
                )}
              </Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No personal content yet</Text>
        </View>
      }
    />
  );

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
        <Text style={styles.headerTitle}>Content</Text>
        <View style={styles.headerSpacer} />
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
            Saves
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
            Favorites
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
            Store
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
            Personal
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "saves" && renderSavesContent()}
        {activeTab === "favorites" && renderFavoritesContent()}
        {activeTab === "store" && renderStoreContent()}
        {activeTab === "personal" && renderPersonalContent()}
      </View>

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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 5,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#6366f1",
  },
  tabText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  contentList: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 20,
  },
  contentItem: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  contentThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  thumbnailText: {
    fontSize: 24,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  contentDate: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 8,
  },
  contentStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  likesText: {
    fontSize: 12,
    color: "#ef4444",
  },
  typeText: {
    fontSize: 10,
    color: "#6b7280",
    backgroundColor: "#374151",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  moreButton: {
    padding: 8,
  },
  moreText: {
    fontSize: 20,
    color: "#9ca3af",
  },
  storeContainer: {
    flex: 1,
    padding: 20,
  },
  storeDescription: {
    fontSize: 16,
    color: "#9ca3af",
    lineHeight: 24,
    marginBottom: 30,
  },
  storeCategories: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  storeCategory: {
    width: "48%",
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
  },
  personalStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
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

export default ContentSubScreen;
