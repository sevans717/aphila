import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

// Import your main navigation component
import { RootNavigator } from "./src/navigation/RootNavigator";

// Import theme and constants
import { theme, lightTheme, darkTheme } from "./src/config/theme.simple";

const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE_V1";

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();
  const scheme = useColorScheme();

  useEffect(() => {
    const restoreState = async () => {
      try {
        const initialUrl = null; // Could add deep linking URL here

        if (initialUrl == null) {
          // Only restore state if there's no deep link and app isn't cold starting
          const savedStateString = await AsyncStorage.getItem(
            NAVIGATION_PERSISTENCE_KEY
          );
          const state = savedStateString
            ? JSON.parse(savedStateString)
            : undefined;

          if (state !== undefined) {
            setInitialState(state);
          }
        }
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady]);

  const onStateChange = (state: any) => {
    AsyncStorage.setItem(NAVIGATION_PERSISTENCE_KEY, JSON.stringify(state));
  };

  if (!isReady) {
    return null; // Could add a splash screen here
  }

  // Create navigation theme based on current color scheme
  const navigationTheme = {
    ...(scheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      ...(scheme === "dark"
        ? darkTheme.navigation.colors
        : lightTheme.navigation.colors),
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer
        initialState={initialState}
        onStateChange={onStateChange}
        theme={navigationTheme}
        linking={{
          prefixes: ["sav3://"],
          config: {
            screens: {
              InitHome: "home",
              MatchScreen: "match",
              CategoryScreen: "category",
              MediaScreen: "media",
              CommunityHubScreen: "hub",
              ProfileScreen: "profile",
              MeeTScreen: "match/meet",
              MatcHScreen: "match/match",
              MessageSScreen: "match/message",
              CamerAScreen: "media/camera",
              ContenTScreen: "media/content",
              CreatEScreen: "media/create",
              Tile1Screen: "category/1",
              Tile2Screen: "category/2",
              Tile3Screen: "category/3",
              Tile4Screen: "category/4",
              Tile5Screen: "category/5",
              Tile6Screen: "category/6",
              Tile7Screen: "category/7",
              Tile8Screen: "category/8",
              Tile9Screen: "category/9",
              Tile10Screen: "category/10",
              Tile11Screen: "category/11",
              Tile12Screen: "category/12",
              Tile13Screen: "category/13",
              Tile14Screen: "category/14",
              Tile15Screen: "category/15",
              Tile16Screen: "category/16",
              BoostedContentScreen: "hub/boosted",
              PoPpeDScreen: "hub/popped",
              ChAtSpAcEScreen: "hub/chatspace",
              PreferencesSettingsScreen: "profile/settings",
            },
          },
        }}
      >
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
