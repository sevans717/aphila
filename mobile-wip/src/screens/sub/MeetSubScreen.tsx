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
import { useMatchingStore } from "../../stores/modules/matchingStore";
import { User } from "../../types/matching";
import TabNavBar from "../../components/navigation/TabNavBar";

const MeetSubScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"new" | "nearby" | "tailored">(
    "new"
  );

  const {
    profileQueue,
    nearbyUsers,
    isLoading,
    loadProfileQueue,
    loadNearbyUsers,
    currentLocation,
    searchRadius,
  } = useMatchingStore();

  useEffect(() => {
    if (activeTab === "new" && profileQueue.length === 0) {
      loadProfileQueue();
    } else if (activeTab === "nearby" && nearbyUsers.length === 0) {
      loadNearbyUsers();
    }
  }, [
    activeTab,
    profileQueue.length,
    nearbyUsers.length,
    loadProfileQueue,
    loadNearbyUsers,
  ]);

  const getProfilesForTab = (): User[] => {
    switch (activeTab) {
      case "new":
        return profileQueue;
      case "nearby":
        return nearbyUsers;
      case "tailored":
        // For tailored, combine and sort by compatibility (simplified)
        return [...profileQueue, ...nearbyUsers].slice(0, 10);
      default:
        return [];
    }
  };

  const renderProfile = ({ item }: { item: User }) => {
    const mainImage =
      item.profileImages.find((img) => img.isMain) || item.profileImages[0];
    const distance = item.location.distance || 0;

    return (
      <TouchableOpacity style={styles.profileCard} activeOpacity={0.7}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImage}>
            {mainImage ? (
              <Text style={styles.profileImageText}>📷</Text> // Placeholder for actual image
            ) : (
              <Text style={styles.profileImageText}>👤</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {item.firstName}, {item.age}
            </Text>
            <Text style={styles.profileDistance}>
              {distance > 0
                ? `${distance.toFixed(1)} km away`
                : "Distance unknown"}
            </Text>
            <Text style={styles.lastActive}>
              {item.isOnline ? "Online now" : "Recently active"}
            </Text>
          </View>
          <TouchableOpacity style={styles.messageButton}>
            <Text style={styles.messageButtonText}>💬</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.profileBio}>{item.bio}</Text>

        <View style={styles.interestsContainer}>
          {item.interests.slice(0, 3).map((interest, index) => (
            <View key={index} style={styles.interestTag}>
              <Text style={styles.interestText}>{interest.name}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const renderNewContent = () => (
    <FlatList
      data={getProfilesForTab()}
      renderItem={renderProfile}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        isLoading ? (
          <Text style={styles.loadingText}>Loading profiles...</Text>
        ) : (
          <Text style={styles.emptyText}>No new profiles available</Text>
        )
      }
    />
  );

  const renderNearbyContent = () => (
    <FlatList
      data={getProfilesForTab().sort(
        (a, b) => (a.location.distance || 0) - (b.location.distance || 0)
      )}
      renderItem={renderProfile}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        isLoading ? (
          <Text style={styles.loadingText}>Finding nearby users...</Text>
        ) : (
          <Text style={styles.emptyText}>No nearby users found</Text>
        )
      }
    />
  );

  const renderTailoredContent = () => (
    <View style={styles.tailoredContainer}>
      <Text style={styles.tailoredTitle}>Personalized Picks</Text>
      <Text style={styles.tailoredDescription}>
        Based on your preferences and activity, here are people you might
        connect with:
      </Text>
      <FlatList
        data={getProfilesForTab()}
        renderItem={renderProfile}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <Text style={styles.loadingText}>Finding tailored matches...</Text>
          ) : (
            <Text style={styles.emptyText}>No tailored matches available</Text>
          )
        }
      />
    </View>
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
        <Text style={styles.headerTitle}>Meet</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "new" && styles.activeTab]}
          onPress={() => setActiveTab("new")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "new" && styles.activeTabText,
            ]}
          >
            New
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "nearby" && styles.activeTab]}
          onPress={() => setActiveTab("nearby")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "nearby" && styles.activeTabText,
            ]}
          >
            Nearby
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "tailored" && styles.activeTab]}
          onPress={() => setActiveTab("tailored")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "tailored" && styles.activeTabText,
            ]}
          >
            Tailored
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "new" && renderNewContent()}
        {activeTab === "nearby" && renderNearbyContent()}
        {activeTab === "tailored" && renderTailoredContent()}
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
    fontSize: 16,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileImageText: {
    fontSize: 24,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  profileDistance: {
    fontSize: 14,
    color: "#10b981",
    marginBottom: 2,
  },
  lastActive: {
    fontSize: 12,
    color: "#9ca3af",
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
  },
  messageButtonText: {
    fontSize: 16,
  },
  profileBio: {
    fontSize: 14,
    color: "#d1d5db",
    lineHeight: 20,
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  interestTag: {
    backgroundColor: "#374151",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  interestText: {
    color: "#9ca3af",
    fontSize: 12,
  },
  tailoredContainer: {
    flex: 1,
    padding: 20,
  },
  tailoredTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  tailoredDescription: {
    fontSize: 16,
    color: "#9ca3af",
    lineHeight: 24,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 20,
  },
});

export default MeetSubScreen;
