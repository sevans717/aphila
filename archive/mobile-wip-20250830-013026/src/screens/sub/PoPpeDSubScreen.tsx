import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import TabNavBar from "../../components/navigation/TabNavBar";
import { useCommunityStore } from "../../stores/modules/communityStore";

const PoPpeDSubScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"hot" | "trending" | "popular">(
    "hot"
  );
  const {
    trendingPosts,
    trendingProfiles,
    trendingCommunities,
    viralContent,
    isLoadingTrending,
    loadTrendingContent,
  } = useCommunityStore();

  useEffect(() => {
    if (
      trendingPosts.length === 0 &&
      trendingProfiles.length === 0 &&
      trendingCommunities.length === 0 &&
      viralContent.length === 0
    ) {
      loadTrendingContent();
    }
  }, []);

  // Merge all trending items for demo (real app would have tabs for each type)
  const allTrending = [
    ...trendingPosts.map((item) => ({ ...item, displayType: "post" })),
    ...trendingProfiles.map((item) => ({ ...item, displayType: "profile" })),
    ...trendingCommunities.map((item) => ({
      ...item,
      displayType: "community",
    })),
    ...viralContent.map((item) => ({ ...item, displayType: "viral" })),
  ];

  const getFilteredItems = () => {
    switch (activeTab) {
      case "hot":
        return allTrending.slice(0, 10); // Just show first 10 for demo
      case "trending":
        return allTrending.filter((item) => item.score && item.score > 50);
      case "popular":
        return allTrending.filter((item) => item.score && item.score > 100);
      default:
        return allTrending;
    }
  };

  const renderTrendingItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.trendingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemAvatar}>🔥</Text>
        <View style={styles.trendingBadge}>
          <Text style={styles.trendingText}>
            {item.displayType?.toUpperCase() || "TREND"}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.itemTitle}>{item.id}</Text>
        <Text style={styles.itemDescription}>Score: {item.score}</Text>
        <View style={styles.statsContainer}>
          {item.category && (
            <Text style={styles.statText}>Category: {item.category}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionButtonText}>View</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "hot" && styles.activeTab]}
          onPress={() => setActiveTab("hot")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "hot" && styles.activeTabText,
            ]}
          >
            🔥 Hot
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "trending" && styles.activeTab]}
          onPress={() => setActiveTab("trending")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "trending" && styles.activeTabText,
            ]}
          >
            📈 Trending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "popular" && styles.activeTab]}
          onPress={() => setActiveTab("popular")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "popular" && styles.activeTabText,
            ]}
          >
            ⭐ Popular
          </Text>
        </TouchableOpacity>
      </View>

      {isLoadingTrending ? (
        <ActivityIndicator
          size="large"
          color="#2196f3"
          style={{ marginTop: 40 }}
        />
      ) : getFilteredItems().length === 0 ? (
        <Text style={{ textAlign: "center", color: "#888", marginTop: 40 }}>
          No trending items found.
        </Text>
      ) : (
        <FlatList
          data={getFilteredItems()}
          renderItem={renderTrendingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

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
    backgroundColor: "#ff6b6b",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "white",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },
  trendingCard: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  itemAvatar: {
    fontSize: 40,
  },
  trendingBadge: {
    backgroundColor: "#ff6b6b",
    borderRadius: 15,
    padding: 5,
  },
  trendingText: {
    fontSize: 16,
  },
  cardContent: {
    marginBottom: 15,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 15,
  },
  statText: {
    fontSize: 12,
    color: "#666",
  },
  actionButton: {
    backgroundColor: "#2196f3",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default PoPpeDSubScreen;
