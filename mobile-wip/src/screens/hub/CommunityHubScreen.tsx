import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import TabNavBar from "../../components/navigation/TabNavBar";

const CommunityHubScreen: React.FC = () => {
  const navigation = useNavigation();

  const hubSections = [
    {
      id: "chatspace",
      title: "ChAtSpAcE",
      description: "Community discussions and conversations",
      icon: "💬",
      color: "#10b981",
      posts: "2.1K messages",
      screenName: "ChatSpaceSubScreen",
    },
    {
      id: "boosted",
      title: "Boosted",
      description: "Featured community content and trending posts",
      icon: "⭐",
      color: "#f59e0b",
      posts: "1.2K posts",
      screenName: "BoostedSubScreen",
    },
    {
      id: "popped",
      title: "PoPpeD",
      description: "Popular content from the community",
      icon: "🔥",
      color: "#ef4444",
      posts: "856 posts",
      screenName: "PoPpeDSubScreen",
    },
  ];

  const trendingTopics = [
    "#TechInnovation",
    "#CreativeArts",
    "#FitnessJourney",
    "#FoodieAdventures",
    "#TravelStories",
  ];

  const handleSectionPress = (screenName: string) => {
    navigation.navigate(screenName as never);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Hub</Text>
        <Text style={styles.subtitle}>Connect with the community</Text>

        {/* Hub Sections */}
        <View style={styles.sectionsContainer}>
          {hubSections.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.sectionCard, { borderColor: section.color }]}
              onPress={() => handleSectionPress(section.screenName)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.sectionIcon, { backgroundColor: section.color }]}
              >
                <Text style={styles.iconText}>{section.icon}</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDescription}>
                  {section.description}
                </Text>
                <Text style={styles.sectionStats}>{section.posts}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.sectionButton,
                  { backgroundColor: section.color },
                ]}
                onPress={() => handleSectionPress(section.screenName)}
              >
                <Text style={styles.sectionButtonText}>Explore</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending Topics */}
        <View style={styles.trendingContainer}>
          <Text style={styles.trendingTitle}>Trending Topics</Text>
          <View style={styles.topicsContainer}>
            {trendingTopics.map((topic, index) => (
              <TouchableOpacity
                key={index}
                style={styles.topicTag}
                activeOpacity={0.7}
              >
                <Text style={styles.topicText}>{topic}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Community Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12.5K</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>45.2K</Text>
            <Text style={styles.statLabel}>Posts Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>8.9K</Text>
            <Text style={styles.statLabel}>New Members</Text>
          </View>
        </View>
      </ScrollView>

      <TabNavBar />
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
    paddingTop: 80, // Account for home button
    paddingHorizontal: 20,
    paddingBottom: 100, // Account for tab bar
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6366f1",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 40,
  },
  sectionsContainer: {
    marginBottom: 30,
  },
  sectionCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 16,
    marginBottom: 4,
  },
  sectionStats: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "600",
  },
  sectionButton: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sectionButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  trendingContainer: {
    marginBottom: 30,
  },
  trendingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  topicTag: {
    backgroundColor: "#374151",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  topicText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
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
    textAlign: "center",
  },
});

export default CommunityHubScreen;
