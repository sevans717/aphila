import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

const Tile16Screen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Tile 16</Text>
        <Text style={styles.subtitle}>Content for Tile 16</Text>

        <View style={styles.contentArea}>
          <Text style={styles.description}>
            This is the detailed view for Tile 16. Add your specific content
            here.
          </Text>
        </View>
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
  contentArea: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default Tile16Screen;
