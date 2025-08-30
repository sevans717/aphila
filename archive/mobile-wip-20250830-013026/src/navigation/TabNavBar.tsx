import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

interface TabNavBarProps {
  currentRoute: string;
}

const TabNavBar: React.FC<TabNavBarProps> = ({ currentRoute }) => {
  const navigation = useNavigation();

  const tabs = [
    { key: "Match", label: "Match", route: "MatchScreen" },
    { key: "Category", label: "Category", route: "CategoryScreen" },
    { key: "Media", label: "Media", route: "CamerAScreen" },
    { key: "Hub", label: "Hub", route: "CommunityHubScreen" },
    { key: "Profile", label: "Profile", route: "ProfileScreen" },
  ];

  const handleTabPress = (route: string) => {
    navigation.navigate(route as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, currentRoute === tab.route && styles.activeTab]}
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
  );
};

const styles = StyleSheet.create({
  container: {
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

export default TabNavBar;
