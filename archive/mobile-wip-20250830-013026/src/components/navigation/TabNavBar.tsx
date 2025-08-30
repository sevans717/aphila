import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

const { width } = Dimensions.get("window");

interface TabNavBarProps {
  tabs?: Array<{
    key: string;
    label: string;
    route: string;
    icon?: string;
  }>;
  activeTab?: string;
  onTabPress?: (route: string) => void;
}

const TabNavBar: React.FC<TabNavBarProps> = ({
  tabs = [
    { key: "Match", label: "Match", route: "MatchScreen" },
    { key: "Category", label: "Category", route: "CategoryScreen" },
    { key: "Media", label: "Media", route: "MediaScreen" },
    { key: "Hub", label: "Hub", route: "HubScreen" },
    { key: "Profile", label: "Profile", route: "ProfileScreen" },
  ],
  activeTab,
  onTabPress,
}) => {
  const navigation = useNavigation();
  const route = useRoute();

  const handleTabPress = (tabRoute: string) => {
    if (onTabPress) {
      onTabPress(tabRoute);
    } else {
      navigation.navigate(tabRoute as never);
    }
  };

  const getActiveTab = () => {
    if (activeTab) return activeTab;

    // Determine active tab based on current route
    const currentRoute = route.name;
    const activeTabItem = tabs.find((tab) => {
      if (currentRoute === tab.route) return true;
      // Handle sub-routes
      if (currentRoute.startsWith(tab.route.replace("Screen", ""))) return true;
      return false;
    });

    return activeTabItem?.key || "";
  };

  const currentActiveTab = getActiveTab();

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = currentActiveTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
    backgroundColor: "transparent",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(31, 41, 55, 0.95)",
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
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 20,
    position: "relative",
  },
  activeTab: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  tabText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  activeTabText: {
    color: "#6366f1",
    fontWeight: "700",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 2,
    left: "50%",
    transform: [{ translateX: -10 }],
    width: 20,
    height: 2,
    backgroundColor: "#6366f1",
    borderRadius: 1,
  },
});

export default TabNavBar;
