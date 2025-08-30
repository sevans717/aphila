import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import TabNavBar from "../components/navigation/TabNavBar";

const InitHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [showNavigation, setShowNavigation] = useState(false);

  const handleScreenTap = () => {
    setShowNavigation(true);
  };

  const handleTabPress = (routeName: string) => {
    navigation.navigate(routeName as never);
  };

  return (
    <View style={styles.container}>
      {showNavigation && (
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowNavigation(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.tapArea}
        onPress={handleScreenTap}
        activeOpacity={0.9}
        disabled={showNavigation}
      >
        <Text style={styles.title}>SAV3</Text>
        <Text
          style={[styles.subtitle, showNavigation && styles.subtitleWithNav]}
        >
          {showNavigation ? "Choose your path" : "Tap to begin your journey"}
        </Text>
      </TouchableOpacity>

      {showNavigation && <TabNavBar onTabPress={handleTabPress} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  tapArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#9ca3af",
    opacity: 0.8,
  },
  subtitleWithNav: {
    marginBottom: 60,
  },
  backButtonContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 1000,
  },
  backButton: {
    backgroundColor: "#1f2937",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  backButtonText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default InitHomeScreen;
