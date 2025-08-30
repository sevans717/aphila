import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import TabNavBar from "../../components/navigation/TabNavBar";
import { useUserStore } from "../../stores/modules/userStore";
import { UserPreferences } from "../../types/user";

const PreferencesSettingsScreen: React.FC = () => {
  const { user, preferences, isLoading, error, loadUser, updatePreferences } =
    useUserStore();

  useEffect(() => {
    if (!user) {
      loadUser();
    }
  }, [user, loadUser]);

  // Example: Toggle push notifications
  const handleTogglePushNotifications = async () => {
    if (!preferences) return;
    await updatePreferences({
      notifications: {
        ...preferences.notifications,
        push: {
          ...preferences.notifications.push,
          enabled: !preferences.notifications.push.enabled,
        },
      },
    });
  };

  // Example: Toggle location sharing
  const handleToggleLocation = async () => {
    if (!preferences) return;
    await updatePreferences({
      privacy: {
        ...preferences.privacy,
        shareLocation: !preferences.privacy.shareLocation,
      },
    });
  };

  // Example: Toggle dark mode
  const handleToggleDarkMode = async () => {
    if (!preferences) return;
    await updatePreferences({
      display: {
        ...preferences.display,
        theme: preferences.display.theme === "dark" ? "light" : "dark",
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!preferences) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No preferences found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Preferences & Settings</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>

        <View style={styles.settingsContainer}>
          {/* Push Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications for matches and messages
              </Text>
            </View>
            <Switch
              value={preferences.notifications.push.enabled}
              onValueChange={handleTogglePushNotifications}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={
                preferences.notifications.push.enabled ? "#2196f3" : "#f4f3f4"
              }
            />
          </View>

          {/* Location Sharing */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Location Sharing</Text>
              <Text style={styles.settingDescription}>
                Allow access to your location for better matches
              </Text>
            </View>
            <Switch
              value={preferences.privacy.shareLocation}
              onValueChange={handleToggleLocation}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={
                preferences.privacy.shareLocation ? "#2196f3" : "#f4f3f4"
              }
            />
          </View>

          {/* Dark Mode */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingDescription}>
                Switch to dark theme
              </Text>
            </View>
            <Switch
              value={preferences.display.theme === "dark"}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={
                preferences.display.theme === "dark" ? "#2196f3" : "#f4f3f4"
              }
            />
          </View>

          {/* More settings can be added here using preferences object */}
        </View>

        <View style={styles.dangerZone}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() =>
              Alert.alert("Logout", "Are you sure you want to logout?")
            }
          >
            <Text style={styles.dangerButtonText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() =>
              Alert.alert(
                "Delete Account",
                "This action cannot be undone. Are you sure?"
              )
            }
          >
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
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
  settingsContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
    marginTop: 10,
  },
  dangerZone: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  dangerButton: {
    backgroundColor: "#ffebee",
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  dangerButtonText: {
    color: "#d32f2f",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PreferencesSettingsScreen;
