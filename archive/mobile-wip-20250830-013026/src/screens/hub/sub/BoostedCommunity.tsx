import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";

interface BoostedProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  interests: string[];
  boostLevel: "gold" | "silver" | "bronze";
  online: boolean;
  matchRate: number;
}

interface BoostedGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  boostLevel: "gold" | "silver" | "bronze";
}

const BoostedCommunity: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profiles" | "groups">("profiles");

  const boostedProfiles: BoostedProfile[] = [
    {
      id: "1",
      name: "Sarah",
      age: 27,
      bio: "Adventure seeker and coffee enthusiast",
      interests: ["Travel", "Photography", "Coffee"],
      boostLevel: "gold",
      online: true,
      matchRate: 95,
    },
    {
      id: "2",
      name: "Mike",
      age: 30,
      bio: "Tech entrepreneur and fitness lover",
      interests: ["Technology", "Fitness", "Business"],
      boostLevel: "silver",
      online: true,
      matchRate: 88,
    },
    {
      id: "3",
      name: "Emma",
      age: 25,
      bio: "Artist and music producer",
      interests: ["Art", "Music", "Creativity"],
      boostLevel: "bronze",
      online: false,
      matchRate: 82,
    },
  ];

  const boostedGroups: BoostedGroup[] = [
    {
      id: "1",
      name: "Tech Innovators",
      description: "Connect with fellow tech enthusiasts",
      memberCount: 1250,
      category: "Technology",
      boostLevel: "gold",
    },
    {
      id: "2",
      name: "Fitness Community",
      description: "Stay motivated and achieve your goals",
      memberCount: 890,
      category: "Health",
      boostLevel: "silver",
    },
    {
      id: "3",
      name: "Creative Minds",
      description: "Share ideas and collaborate on projects",
      memberCount: 675,
      category: "Arts",
      boostLevel: "bronze",
    },
  ];

  const getBoostColor = (level: string) => {
    switch (level) {
      case "gold":
        return "#f59e0b";
      case "silver":
        return "#9ca3af";
      case "bronze":
        return "#d97706";
      default:
        return "#6b7280";
    }
  };

  const renderProfileCard = ({ item }: { item: BoostedProfile }) => (
    <View style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{item.name}</Text>
          <View style={styles.boostBadge}>
            <Text
              style={[
                styles.boostText,
                { color: getBoostColor(item.boostLevel) },
              ]}
            >
              {item.boostLevel.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={[styles.onlineIndicator, item.online && styles.online]} />
      </View>

      <Text style={styles.profileAge}>{item.age} years old</Text>
      <Text style={styles.profileBio}>{item.bio}</Text>

      <View style={styles.interestsContainer}>
        {item.interests.map((interest, index) => (
          <Text key={index} style={styles.interestTag}>
            {interest}
          </Text>
        ))}
      </View>

      <View style={styles.matchRateContainer}>
        <Text style={styles.matchRateLabel}>Match Rate</Text>
        <Text style={styles.matchRateValue}>{item.matchRate}%</Text>
      </View>

      <TouchableOpacity style={styles.connectButton} activeOpacity={0.7}>
        <Text style={styles.connectButtonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGroupCard = ({ item }: { item: BoostedGroup }) => (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupName}>{item.name}</Text>
        <View style={styles.boostBadge}>
          <Text
            style={[
              styles.boostText,
              { color: getBoostColor(item.boostLevel) },
            ]}
          >
            {item.boostLevel.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.groupDescription}>{item.description}</Text>

      <View style={styles.groupStats}>
        <Text style={styles.memberCount}>{item.memberCount} members</Text>
        <Text style={styles.categoryTag}>{item.category}</Text>
      </View>

      <TouchableOpacity style={styles.joinButton} activeOpacity={0.7}>
        <Text style={styles.joinButtonText}>Join Group</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Boosted Community</Text>
        <Text style={styles.subtitle}>
          Discover premium profiles and groups
        </Text>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
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
          <TouchableOpacity
            style={[styles.tab, activeTab === "groups" && styles.activeTab]}
            onPress={() => setActiveTab("groups")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "groups" && styles.activeTabText,
              ]}
            >
              Groups
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === "profiles" ? (
          <FlatList
            data={boostedProfiles}
            renderItem={renderProfileCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <FlatList
            data={boostedGroups}
            renderItem={renderGroupCard}
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
    color: "#f59e0b",
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
    backgroundColor: "#f59e0b",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
  },
  activeTabText: {
    color: "#000",
  },
  listContainer: {
    paddingBottom: 20,
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
  boostBadge: {
    backgroundColor: "#374151",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  boostText: {
    fontSize: 10,
    fontWeight: "bold",
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
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 12,
    lineHeight: 20,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  interestTag: {
    backgroundColor: "#374151",
    color: "#d1d5db",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  matchRateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  matchRateLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  matchRateValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f59e0b",
  },
  connectButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  connectButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  groupCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  groupDescription: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 12,
    lineHeight: 20,
  },
  groupStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  memberCount: {
    fontSize: 12,
    color: "#9ca3af",
  },
  categoryTag: {
    backgroundColor: "#374151",
    color: "#d1d5db",
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  joinButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  joinButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default BoostedCommunity;
