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

const getBoostColor = (level: number) => {
  // Map boostLevel (number) to color
  if (level >= 1000) return "#FFD700"; // premium
  if (level >= 500) return "#FFA500"; // gold
  if (level > 0) return "#C0C0C0"; // silver
  return "#666";
};

const BoostedSubScreen: React.FC = () => {
  const navigation = useNavigation();
  const { boostedProfiles, isLoadingBoosted, loadBoostedContent } =
    useCommunityStore();

  useEffect(() => {
    if (boostedProfiles.length === 0) {
      loadBoostedContent();
    }
  }, []);

  const renderBoostedProfile = ({
    item,
  }: {
    item: (typeof boostedProfiles)[0];
  }) => (
    <TouchableOpacity style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <Text style={styles.profileAvatar}>⭐</Text>
        <View style={styles.boostIndicator}>
          <Text
            style={[
              styles.boostText,
              { color: getBoostColor(item.boostLevel) },
            ]}
          >
            BOOST
          </Text>
        </View>
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>{item.targetId}</Text>
        <Text style={styles.profileLocation}>Profile ID: {item.targetId}</Text>
        <Text style={styles.profileBio}>
          Boost expires: {new Date(item.expiresAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.connectButton}>
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Profile</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Boosted Profiles</Text>
        <Text style={styles.subtitle}>Discover premium connections</Text>

        {isLoadingBoosted ? (
          <ActivityIndicator
            size="large"
            color="#2196f3"
            style={{ marginTop: 40 }}
          />
        ) : boostedProfiles.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#888", marginTop: 40 }}>
            No boosted profiles found.
          </Text>
        ) : (
          <FlatList
            data={boostedProfiles}
            renderItem={renderBoostedProfile}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.profileList}
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
  profileList: {
    paddingBottom: 20,
  },
  profileCard: {
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
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  profileAvatar: {
    fontSize: 50,
  },
  boostIndicator: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  boostText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  profileInfo: {
    marginBottom: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  interestTag: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 12,
    color: "#1976d2",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  connectButton: {
    backgroundColor: "#2196f3",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  connectButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  viewButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  viewButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default BoostedSubScreen;
