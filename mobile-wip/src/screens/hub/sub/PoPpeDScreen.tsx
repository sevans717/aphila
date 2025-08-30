import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";

interface TrendingPost {
  id: string;
  type: "profile" | "content" | "group";
  title: string;
  description: string;
  author: string;
  likes: number;
  comments: number;
  shares: number;
  trending: boolean;
  image?: string;
}

interface PopularProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  followers: number;
  matchRate: number;
  online: boolean;
  avatar?: string;
}

const PoPpeDScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"posts" | "profiles">("posts");

  const trendingPosts: TrendingPost[] = [
    {
      id: "1",
      type: "content",
      title: "Amazing sunset photography tips",
      description: "Learn how to capture stunning sunset shots with your phone",
      author: "PhotoMaster",
      likes: 1247,
      comments: 89,
      shares: 234,
      trending: true,
    },
    {
      id: "2",
      type: "group",
      title: "Weekend hiking group",
      description: "Join us for an epic hiking adventure this Saturday",
      author: "AdventureClub",
      likes: 892,
      comments: 156,
      shares: 67,
      trending: true,
    },
    {
      id: "3",
      type: "profile",
      title: "Creative artist seeking collaboration",
      description: "Digital artist looking for like-minded creators",
      author: "ArtisticSoul",
      likes: 654,
      comments: 43,
      shares: 28,
      trending: false,
    },
  ];

  const popularProfiles: PopularProfile[] = [
    {
      id: "1",
      name: "Alex Chen",
      age: 28,
      bio: "Tech entrepreneur and coffee lover",
      followers: 15420,
      matchRate: 96,
      online: true,
    },
    {
      id: "2",
      name: "Sarah Kim",
      age: 25,
      bio: "Travel blogger and food enthusiast",
      followers: 12890,
      matchRate: 92,
      online: true,
    },
    {
      id: "3",
      name: "Mike Johnson",
      age: 31,
      bio: "Fitness coach and wellness advocate",
      followers: 9876,
      matchRate: 89,
      online: false,
    },
  ];

  const renderPostCard = ({ item }: { item: TrendingPost }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postTypeContainer}>
          <Text style={styles.postType}>{item.type.toUpperCase()}</Text>
          {item.trending && <Text style={styles.trendingBadge}>🔥</Text>}
        </View>
        <Text style={styles.postAuthor}>by {item.author}</Text>
      </View>

      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postDescription}>{item.description}</Text>

      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>❤️</Text>
          <Text style={styles.statValue}>{item.likes}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>💬</Text>
          <Text style={styles.statValue}>{item.comments}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>↗️</Text>
          <Text style={styles.statValue}>{item.shares}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewButton} activeOpacity={0.7}>
        <Text style={styles.viewButtonText}>View</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProfileCard = ({ item }: { item: PopularProfile }) => (
    <View style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{item.name}</Text>
          <View
            style={[styles.onlineIndicator, item.online && styles.online]}
          />
        </View>
        <Text style={styles.profileAge}>{item.age}</Text>
      </View>

      <Text style={styles.profileBio}>{item.bio}</Text>

      <View style={styles.profileStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Followers</Text>
          <Text style={styles.statValue}>
            {item.followers.toLocaleString()}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Match Rate</Text>
          <Text style={styles.statValue}>{item.matchRate}%</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.followButton} activeOpacity={0.7}>
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>PoPpeD</Text>
        <Text style={styles.subtitle}>Popular and trending content</Text>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
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
            style={[styles.tab, activeTab === "profiles" && styles.activeTab]}
            onPress={() => setActiveTab("profiles")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "profiles" && styles.activeTabText,
              ]}
            >
              Profiles
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === "posts" ? (
          <FlatList
            data={trendingPosts}
            renderItem={renderPostCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <FlatList
            data={popularProfiles}
            renderItem={renderProfileCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ScrollView>
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
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 30,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#ef4444",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
  },
  activeTabText: {
    color: "#ffffff",
  },
  listContainer: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  postTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  postType: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ef4444",
    backgroundColor: "#374151",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  trendingBadge: {
    fontSize: 14,
  },
  postAuthor: {
    fontSize: 12,
    color: "#9ca3af",
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 16,
    lineHeight: 20,
  },
  postStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statValue: {
    fontSize: 12,
    color: "#9ca3af",
  },
  viewButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  viewButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  profileCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginRight: 12,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6b7280",
  },
  online: {
    backgroundColor: "#10b981",
  },
  profileAge: {
    fontSize: 14,
    color: "#9ca3af",
  },
  profileBio: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 16,
    lineHeight: 20,
  },
  profileStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  followButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  followButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PoPpeDScreen;
