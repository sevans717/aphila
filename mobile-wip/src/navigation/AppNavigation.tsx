import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import screen components
import InitHomeScreen from "../screens/InitHomeScreen";
import MatchScreen from "../screens/match/MatchScreen";
import CategoryScreen from "../screens/category/CategoryScreen";
import MediaScreen from "../screens/media/MediaScreen";
import CamerAScreen from "../screens/media/sub/CamerAScreen";
import ContenTScreen from "../screens/media/sub/ContenTScreen";
import CreatEScreen from "../screens/media/sub/CreatEScreen";
import CommunityHubScreen from "../screens/hub/CommunityHubScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import PreferencesSettingsScreen from "../screens/profile/sub/PreferencesSettingsScreen";

// Import match sub screens
import MeeTScreen from "../screens/match/sub/MeeTScreen";
import MatcHScreen from "../screens/match/sub/MatcHScreen";
import MessageSScreen from "../screens/match/sub/MessageSScreen";

// Import hub sub screens
import ChAtSpAcEScreen from "../screens/hub/sub/ChAtSpAcEScreen";
import BoostedCommunity from "../screens/hub/sub/BoostedCommunity";
import PoPpeDScreen from "../screens/hub/sub/PoPpeDScreen";

// Import tile sub screens
import Tile1Screen from "../screens/category/sub/Tile1Screen";
import Tile2Screen from "../screens/category/sub/Tile2Screen";
import Tile3Screen from "../screens/category/sub/Tile3Screen";
import Tile4Screen from "../screens/category/sub/Tile4Screen";
import Tile5Screen from "../screens/category/sub/Tile5Screen";
import Tile6Screen from "../screens/category/sub/Tile6Screen";
import Tile7Screen from "../screens/category/sub/Tile7Screen";
import Tile8Screen from "../screens/category/sub/Tile8Screen";
import Tile9Screen from "../screens/category/sub/Tile9Screen";
import Tile10Screen from "../screens/category/sub/Tile10Screen";
import Tile11Screen from "../screens/category/sub/Tile11Screen";
import Tile12Screen from "../screens/category/sub/Tile12Screen";
import Tile13Screen from "../screens/category/sub/Tile13Screen";
import Tile14Screen from "../screens/category/sub/Tile14Screen";
import Tile15Screen from "../screens/category/sub/Tile15Screen";
import Tile16Screen from "../screens/category/sub/Tile16Screen";

// Import navigation components
import GlobalNavigation from "./GlobalNavigation";

// Import navigation types
import { RootNavigationParamList } from "./types";

const Stack = createNativeStackNavigator<RootNavigationParamList>();

const AppNavigation: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Hide headers for clean minimal design
          gestureEnabled: true,
        }}
      >
        {/* Initial Home Screen - Tap to reveal navigation */}
        <Stack.Screen name="InitHome" component={InitHomeScreen} />

        {/* Main Tab Screens */}
        <Stack.Screen
          name="MatchScreen"
          component={MatchScreen}
          options={{ title: "Match" }}
        />

        <Stack.Screen
          name="CategoryScreen"
          component={CategoryScreen}
          options={{ title: "Category" }}
        />

        <Stack.Screen
          name="MediaScreen"
          component={MediaScreen}
          options={{ title: "Media" }}
        />

        <Stack.Screen
          name="CamerAScreen"
          component={CamerAScreen}
          options={{ title: "Camera" }}
        />

        <Stack.Screen
          name="ContenTScreen"
          component={ContenTScreen}
          options={{ title: "Content" }}
        />

        <Stack.Screen
          name="CreatEScreen"
          component={CreatEScreen}
          options={{ title: "Create" }}
        />

        <Stack.Screen
          name="CommunityHubScreen"
          component={CommunityHubScreen}
          options={{ title: "Hub" }}
        />

        <Stack.Screen
          name="ProfileScreen"
          component={ProfileScreen}
          options={{ title: "Profile" }}
        />

        <Stack.Screen
          name="PreferencesSettingsScreen"
          component={PreferencesSettingsScreen}
          options={{ title: "Preferences & Settings" }}
        />

        {/* Match Sub Screens */}
        <Stack.Screen
          name="MeeTScreen"
          component={MeeTScreen}
          options={{ title: "MeeT" }}
        />
        <Stack.Screen
          name="MatcHScreen"
          component={MatcHScreen}
          options={{ title: "MatcH" }}
        />
        <Stack.Screen
          name="MessageSScreen"
          component={MessageSScreen}
          options={{ title: "MessageS" }}
        />

        {/* Tile Sub Screens */}
        <Stack.Screen
          name="Tile1Screen"
          component={Tile1Screen}
          options={{ title: "Tile 1" }}
        />
        <Stack.Screen
          name="Tile2Screen"
          component={Tile2Screen}
          options={{ title: "Tile 2" }}
        />
        <Stack.Screen
          name="Tile3Screen"
          component={Tile3Screen}
          options={{ title: "Tile 3" }}
        />
        <Stack.Screen
          name="Tile4Screen"
          component={Tile4Screen}
          options={{ title: "Tile 4" }}
        />
        <Stack.Screen
          name="Tile5Screen"
          component={Tile5Screen}
          options={{ title: "Tile 5" }}
        />
        <Stack.Screen
          name="Tile6Screen"
          component={Tile6Screen}
          options={{ title: "Tile 6" }}
        />
        <Stack.Screen
          name="Tile7Screen"
          component={Tile7Screen}
          options={{ title: "Tile 7" }}
        />
        <Stack.Screen
          name="Tile8Screen"
          component={Tile8Screen}
          options={{ title: "Tile 8" }}
        />
        <Stack.Screen
          name="Tile9Screen"
          component={Tile9Screen}
          options={{ title: "Tile 9" }}
        />
        <Stack.Screen
          name="Tile10Screen"
          component={Tile10Screen}
          options={{ title: "Tile 10" }}
        />
        <Stack.Screen
          name="Tile11Screen"
          component={Tile11Screen}
          options={{ title: "Tile 11" }}
        />
        <Stack.Screen
          name="Tile12Screen"
          component={Tile12Screen}
          options={{ title: "Tile 12" }}
        />
        <Stack.Screen
          name="Tile13Screen"
          component={Tile13Screen}
          options={{ title: "Tile 13" }}
        />
        <Stack.Screen
          name="Tile14Screen"
          component={Tile14Screen}
          options={{ title: "Tile 14" }}
        />
        <Stack.Screen
          name="Tile15Screen"
          component={Tile15Screen}
          options={{ title: "Tile 15" }}
        />
        <Stack.Screen
          name="Tile16Screen"
          component={Tile16Screen}
          options={{ title: "Tile 16" }}
        />
        <Stack.Screen
          name="ChAtSpAcEScreen"
          component={ChAtSpAcEScreen}
          options={{ title: "ChAtSpAcE" }}
        />

        <Stack.Screen
          name="BoostedContentScreen"
          component={BoostedCommunity}
          options={{ title: "Boosted" }}
        />

        <Stack.Screen
          name="PoPpeDScreen"
          component={PoPpeDScreen}
          options={{ title: "PoPpeD" }}
        />
      </Stack.Navigator>

      {/* Global Navigation - Home Button + TabNavBar */}
      <GlobalNavigation />
    </NavigationContainer>
  );
};

export default AppNavigation;
