import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import TabNavBar from "../../components/navigation/TabNavBar";

const { width } = Dimensions.get("window");

interface Post {
  id: string;
  user: string;
  avatar: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
}

interface GalleryItem {
  id: string;
  image: string;
  type: "photo" | "video";
}

const MediaScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"gallery" | "posts" | "explore">(
    "gallery"
  );

  // Mock data - replace with real API data
  const mockPosts: Post[] = [
    {
      id: "1",
      user: "Alex Chen",
      avatar: "👤",
      image: "🏞️",
      caption: "Beautiful sunset at the beach! 🌅",
      likes: 42,
      comments: 8,
      timestamp: "2h ago",
    },
    {
      id: "2",
      user: "Jordan Smith",
      avatar: "👨",
      image: "🍜",
      caption: "Trying this amazing new restaurant downtown",
      likes: 28,
      comments: 5,
      timestamp: "4h ago",
    },
    {
      id: "3",
      user: "Taylor Swift",
      avatar: "👩",
      image: "🎵",
      caption: "New music coming soon! 🎸",
      likes: 156,
      comments: 23,
      timestamp: "6h ago",
    },
  ];

  const mockGallery: GalleryItem[] = [
    { id: "1", image: "🏞️", type: "photo" },
    { id: "2", image: "🍜", type: "photo" },
    { id: "3", image: "🎵", type: "photo" },
    { id: "4", image: "🏃", type: "photo" },
    { id: "5", image: "📸", type: "photo" },
    { id: "6", image: "🎨", type: "photo" },
  ];

  const handleSubNavigation = (screenName: string) => {
    navigation.navigate(screenName as never);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text style={styles.postAvatar}>{item.avatar}</Text>
        <View style={styles.postUserInfo}>
          <Text style={styles.postUser}>{item.user}</Text>
          <Text style={styles.postTime}>{item.timestamp}</Text>
        </View>
      </View>

      <View style={styles.postImage}>
        <Text style={styles.postImageEmoji}>{item.image}</Text>
      </View>

      <Text style={styles.postCaption}>{item.caption}</Text>

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>❤️ {item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>💬 {item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>📤 Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGalleryItem = ({ item }: { item: GalleryItem }) => (
    <TouchableOpacity style={styles.galleryItem}>
      <Text style={styles.galleryEmoji}>{item.image}</Text>
      {item.type === "video" && (
        <View style={styles.videoIndicator}>
          <Text style={styles.videoIcon}>▶️</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderExploreContent = () => (
    <View style={styles.exploreContainer}>
      <Text style={styles.exploreTitle}>Discover Content</Text>
      <View style={styles.exploreGrid}>
        {Array.from({ length: 9 }, (_, i) => (
          <TouchableOpacity key={i} style={styles.exploreItem}>
            <Text style={styles.exploreEmoji}>
              {["🏞️", "🍜", "🎵", "🏃", "📸", "🎨", "🌅", "🍕", "🎭"][i]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "gallery" && styles.activeTab]}
          onPress={() => setActiveTab("gallery")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "gallery" && styles.activeTabText,
            ]}
          >
            Gallery
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "posts" && styles.activeTab]}
          onPress={() => setActiveTab("posts")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "posts" && styles.activeTabText,
            ]}
          >
            Posts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "explore" && styles.activeTab]}
          onPress={() => setActiveTab("explore")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "explore" && styles.activeTabText,
            ]}
          >
            Explore
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "gallery" && (
        <FlatList
          data={mockGallery}
          renderItem={renderGalleryItem}
          keyExtractor={(item: GalleryItem) => item.id}
          numColumns={3}
          contentContainerStyle={styles.galleryContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === "posts" && (
        <FlatList
          data={mockPosts}
          renderItem={renderPost}
          keyExtractor={(item: Post) => item.id}
          contentContainerStyle={styles.postsContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === "explore" && renderExploreContent()}

      {/* Media Sub Navigation */}
      <View style={styles.subNavContainer}>
        <TouchableOpacity
          style={styles.subNavButton}
          onPress={() => handleSubNavigation("CameraSubScreen")}
        >
          <Text style={styles.subNavText}>📷 Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.subNavButton}
          onPress={() => handleSubNavigation("ContentSubScreen")}
        >
          <Text style={styles.subNavText}>📚 Content</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.subNavButton}
          onPress={() => handleSubNavigation("CreateSubScreen")}
        >
          <Text style={styles.subNavText}>🎨 Create</Text>
        </TouchableOpacity>
      </View>

      <TabNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 5,
    marginTop: 20,
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
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#2196f3",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "white",
  },
  galleryContainer: {
    padding: 10,
  },
  galleryItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 5,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "center",
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
  galleryEmoji: {
    fontSize: 40,
  },
  videoIndicator: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    padding: 2,
  },
  videoIcon: {
    fontSize: 12,
  },
  postsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  postCard: {
    backgroundColor: "white",
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
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  postAvatar: {
    fontSize: 30,
    marginRight: 10,
  },
  postUserInfo: {
    flex: 1,
  },
  postUser: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  postTime: {
    fontSize: 12,
    color: "#666",
  },
  postImage: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  postImageEmoji: {
    fontSize: 60,
  },
  postCaption: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  actionText: {
    fontSize: 14,
    color: "#666",
  },
  exploreContainer: {
    flex: 1,
    padding: 20,
  },
  exploreTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  exploreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  exploreItem: {
    width: (width - 60) / 3,
    aspectRatio: 1,
    backgroundColor: "white",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
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
  exploreEmoji: {
    fontSize: 40,
  },
  subNavContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subNavButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  subNavText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2196f3",
  },
});

export default MediaScreen;
