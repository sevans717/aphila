import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import TabNavBar from "../../components/navigation/TabNavBar";
import { useMatchingStore } from "../../stores/modules/matchingStore";

interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  image: string;
  compatibility: number;
  distance: string;
}

const MatchSubScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Zustand store hooks
  const {
    profileQueue,
    currentProfileIndex,
    isLoading,
    loadProfileQueue,
    swipeLeft,
    swipeRight,
    nextProfile,
  } = useMatchingStore();

  // Load potential matches on component mount
  useEffect(() => {
    if (profileQueue.length === 0) {
      loadProfileQueue();
    }
  }, [loadProfileQueue, profileQueue.length]);

  const handleSwipe = async (direction: "left" | "right") => {
    if (!profileQueue.length) return;

    const currentProfile = profileQueue[currentProfileIndex];

    try {
      if (direction === "left") {
        await swipeLeft(currentProfile.id);
      } else {
        await swipeRight(currentProfile.id);
      }
    } catch (error) {
      console.error("Error swiping profile:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Finding matches...</Text>
      </View>
    );
  }

  if (!profileQueue.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No more profiles to show</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => loadProfileQueue()}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentProfile = profileQueue[currentProfileIndex];

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
        <Text style={styles.headerTitle}>Match</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileImage}>
          <Text style={styles.profileImageText}>
            {currentProfile.profileImages?.[0]?.thumbnailUrl || "👤"}
          </Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {currentProfile.firstName}, {currentProfile.age}
          </Text>
          <Text style={styles.profileDistance}>
            {currentProfile.location.city}, {currentProfile.location.state}
          </Text>
          <Text style={styles.profileBio}>
            {currentProfile.bio || "No bio available"}
          </Text>

          <View style={styles.compatibilityContainer}>
            <Text style={styles.compatibilityText}>
              {Math.floor(Math.random() * 40) + 60}% Match
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => handleSwipe("left")}
        >
          <Text style={styles.actionButtonText}>❌ Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.matchButton]}
          onPress={() => handleSwipe("right")}
        >
          <Text style={styles.actionButtonText}>❤️ Match</Text>
        </TouchableOpacity>
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
  profileCard: {
    flex: 1,
    margin: 20,
    backgroundColor: "#1f2937",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  profileImageText: {
    fontSize: 60,
  },
  profileInfo: {
    alignItems: "center",
    flex: 1,
  },
  profileName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  profileDistance: {
    fontSize: 16,
    color: "#9ca3af",
    marginBottom: 12,
  },
  profileBio: {
    fontSize: 16,
    color: "#d1d5db",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  compatibilityContainer: {
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  compatibilityText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  passButton: {
    backgroundColor: "#dc2626",
  },
  matchButton: {
    backgroundColor: "#10b981",
  },
  actionButtonText: {
    fontSize: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: "#9ca3af",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  emptyText: {
    fontSize: 18,
    color: "#9ca3af",
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default MatchSubScreen;
