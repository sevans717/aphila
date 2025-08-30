import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";

interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  interests: string[];
  distance: string;
  isNew?: boolean;
  isNearby?: boolean;
  isTailored?: boolean;
}

const MeeTScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"new" | "nearby" | "tailored">(
    "new"
  );

  // Mock data - replace with real API data
  const mockProfiles: UserProfile[] = [
    {
      id: "1",
      name: "Alex",
      age: 28,
      bio: "Adventure seeker, coffee lover, and weekend hiker.",
      interests: ["Hiking", "Coffee", "Travel"],
      distance: "2.3 km",
      isNew: true,
      isNearby: true,
    },
    {
      id: "2",
      name: "Jordan",
      age: 25,
      bio: "Tech enthusiast by day, musician by night.",
      interests: ["Coding", "Music", "Gaming"],
      distance: "1.8 km",
      isNew: false,
      isNearby: true,
      isTailored: true,
    },
    {
      id: "3",
      name: "Taylor",
      age: 30,
      bio: "Foodie and fitness lover.",
      interests: ["Cooking", "Fitness", "Food"],
      distance: "3.1 km",
      isNew: true,
      isNearby: false,
      isTailored: true,
    },
    {
      id: "4",
      name: "Casey",
      age: 27,
      bio: "Book lover and yoga enthusiast.",
      interests: ["Books", "Yoga", "Meditation"],
      distance: "0.8 km",
      isNew: false,
      isNearby: true,
      isTailored: true,
    },
  ];

  const getFilteredProfiles = () => {
    switch (activeTab) {
      case "new":
        return mockProfiles.filter((profile) => profile.isNew);
      case "nearby":
        return mockProfiles.filter((profile) => profile.isNearby);
      case "tailored":
        return mockProfiles.filter((profile) => profile.isTailored);
      default:
        return mockProfiles;
    }
  };

  const renderProfileCard = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity style={styles.profileCard} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>
          {item.name}, {item.age}
        </Text>
        <Text style={styles.distance}>{item.distance}</Text>
      </View>

      <Text style={styles.bio} numberOfLines={2}>
        {item.bio}
      </Text>

      <View style={styles.interestsContainer}>
        {item.interests.slice(0, 3).map((interest, index) => (
          <View key={index} style={styles.interestTag}>
            <Text style={styles.interestText}>{interest}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.messageButton}>
        <Text style={styles.messageButtonText}>Say Hi! 👋</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const filteredProfiles = getFilteredProfiles();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MeeT People</Text>

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

      {/* Profile List */}
      <FlatList
        data={filteredProfiles}
        renderItem={renderProfileCard}
        keyExtractor={(item: UserProfile) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {activeTab} profiles available right now.
            </Text>
            <TouchableOpacity style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
    color: "#333",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 5,
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
  listContainer: {
    padding: 20,
    paddingTop: 0,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  distance: {
    fontSize: 14,
    color: "#666",
  },
  bio: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 15,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  interestTag: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 5,
  },
  interestText: {
    fontSize: 12,
    color: "#1976d2",
    fontWeight: "500",
  },
  messageButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
  },
  messageButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#2196f3",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MeeTScreen;
