import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";

interface PreferenceSetting {
  id: string;
  title: string;
  description: string;
  type: "toggle" | "select";
  value: boolean | string;
  options?: string[];
}

const PreferencesSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<PreferenceSetting[]>([
    {
      id: "push_notifications",
      title: "Push Notifications",
      description: "Receive notifications for matches and messages",
      type: "toggle",
      value: true,
    },
    {
      id: "email_notifications",
      title: "Email Notifications",
      description: "Receive email updates about your account",
      type: "toggle",
      value: false,
    },
    {
      id: "location_services",
      title: "Location Services",
      description: "Allow access to location for better matches",
      type: "toggle",
      value: true,
    },
    {
      id: "dark_mode",
      title: "Dark Mode",
      description: "Use dark theme throughout the app",
      type: "toggle",
      value: true,
    },
    {
      id: "distance_unit",
      title: "Distance Unit",
      description: "Choose your preferred unit for distances",
      type: "select",
      value: "km",
      options: ["km", "miles"],
    },
    {
      id: "language",
      title: "Language",
      description: "Select your preferred language",
      type: "select",
      value: "en",
      options: ["en", "es", "fr", "de"],
    },
    {
      id: "age_range",
      title: "Age Range",
      description: "Set your preferred age range for matches",
      type: "select",
      value: "18-35",
      options: ["18-25", "18-35", "25-40", "30-50", "40+"],
    },
    {
      id: "max_distance",
      title: "Maximum Distance",
      description: "Maximum distance for potential matches",
      type: "select",
      value: "50km",
      options: ["10km", "25km", "50km", "100km", "Unlimited"],
    },
  ]);

  const updateSetting = (id: string, value: boolean | string) => {
    setSettings((prevSettings) =>
      prevSettings.map((setting) =>
        setting.id === id ? { ...setting, value } : setting
      )
    );
  };

  const renderSetting = (setting: PreferenceSetting) => {
    return (
      <View key={setting.id} style={styles.settingItem}>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{setting.title}</Text>
          <Text style={styles.settingDescription}>{setting.description}</Text>
          {setting.type === "select" && (
            <View style={styles.optionsContainer}>
              {setting.options?.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    setting.value === option && styles.selectedOption,
                  ]}
                  onPress={() => updateSetting(setting.id, option)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      setting.value === option && styles.selectedOptionText,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {setting.type === "toggle" && (
          <Switch
            value={setting.value as boolean}
            onValueChange={(value) => updateSetting(setting.id, value)}
            trackColor={{ false: "#374151", true: "#6366f1" }}
            thumbColor={setting.value ? "#ffffff" : "#9ca3af"}
          />
        )}
      </View>
    );
  };

  const settingSections = [
    {
      id: "notifications",
      title: "Notifications",
      settings: settings.filter((s) => s.id.includes("notification")),
    },
    {
      id: "privacy",
      title: "Privacy & Location",
      settings: settings.filter((s) => s.id === "location_services"),
    },
    {
      id: "appearance",
      title: "Appearance",
      settings: settings.filter((s) => s.id === "dark_mode"),
    },
    {
      id: "matching",
      title: "Matching Preferences",
      settings: settings.filter((s) =>
        ["distance_unit", "age_range", "max_distance"].includes(s.id)
      ),
    },
    {
      id: "general",
      title: "General",
      settings: settings.filter((s) => s.id === "language"),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Preferences & Settings</Text>
        <Text style={styles.subtitle}>Customize your app experience</Text>

        {settingSections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.settings.map(renderSetting)}
          </View>
        ))}

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.7}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

        {/* Reset to Defaults */}
        <TouchableOpacity style={styles.resetButton} activeOpacity={0.7}>
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
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
    color: "#8b5cf6",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 30,
  },
  section: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 16,
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionButton: {
    backgroundColor: "#374151",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  selectedOption: {
    backgroundColor: "#8b5cf6",
  },
  optionText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  selectedOptionText: {
    color: "#ffffff",
  },
  saveButton: {
    backgroundColor: "#8b5cf6",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  resetButton: {
    backgroundColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6b7280",
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  resetButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PreferencesSettingsScreen;
