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

const MatchScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleSectionPress = (screenName: string) => {
    navigation.navigate(screenName as never);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Match</Text>
        <Text style={styles.subtitle}>Find your perfect connection</Text>

        {/* MeeT Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => handleSectionPress("MeetSubScreen")}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>MeeT</Text>
          <Text style={styles.sectionDescription}>
            Discover new people in your area and start meaningful conversations.
          </Text>
          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Start Meeting →</Text>
          </View>
        </TouchableOpacity>

        {/* MatcH Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => handleSectionPress("MatchSubScreen")}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>MatcH</Text>
          <Text style={styles.sectionDescription}>
            View your matches and see who's interested in connecting with you.
          </Text>
          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View Matches →</Text>
          </View>
        </TouchableOpacity>

        {/* MessageS Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => handleSectionPress("MessageSubScreen")}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>MessageS</Text>
          <Text style={styles.sectionDescription}>
            Chat with your matches and build real connections.
          </Text>
          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Open Messages →</Text>
          </View>
        </TouchableOpacity>
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
  section: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#9ca3af",
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "flex-start",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default MatchScreen;
