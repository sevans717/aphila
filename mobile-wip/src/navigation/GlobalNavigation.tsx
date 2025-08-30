import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

const GlobalNavigation: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const currentRoute = route.name;

  const tabs = [
    { key: "Match", label: "Match", route: "MatchScreen" },
    { key: "Category", label: "Category", route: "CategoryScreen" },
    { key: "Media", label: "Media", route: "CamerAScreen" },
    { key: "Hub", label: "Hub", route: "CommunityHubScreen" },
    { key: "Profile", label: "Profile", route: "ProfileScreen" },
  ];

  const handleTabPress = (routeName: string) => {
    navigation.navigate(routeName as never);
  };

  const handleHomePress = () => {
    navigation.navigate("InitHome" as never);
  };

  // Don't show navigation on InitHome screen
  if (currentRoute === "InitHome") {
    return null;
  }

  return (
    <>
      {/* Home Button - Top Center Header */}
      <View style={styles.homeButtonContainer}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleHomePress}
          activeOpacity={0.7}
        >
          <View style={styles.homeIcon}>
            <View style={styles.homeIconRoof} />
            <View style={styles.homeIconBase} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation Bar - Bottom */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                currentRoute === tab.route && styles.activeTab,
              ]}
              onPress={() => handleTabPress(tab.route)}
            >
              <Text
                style={[
                  styles.tabText,
                  currentRoute === tab.route && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  homeButtonContainer: {
    position: "absolute",
    top: 20, // Lowered 20px from top
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1001,
  },
  homeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  homeIcon: {
    width: 20,
    height: 18,
    position: "relative",
  },
  homeIconRoof: {
    position: "absolute",
    top: 0,
    left: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#6366f1",
  },
  homeIconBase: {
    position: "absolute",
    bottom: 0,
    left: 4,
    width: 12,
    height: 10,
    backgroundColor: "#6366f1",
    borderRadius: 1,
  },
  tabBarContainer: {
    position: "absolute",
    bottom: 20, // Raised slightly for convenience
    left: 10,
    right: 10,
    zIndex: 1000,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#6366f1",
  },
  tabText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#ffffff",
  },
});

export default GlobalNavigation;
