import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RootNavigationParamList, TabNavigationParamList } from "./types";
import GlobalNavigation from "./GlobalNavigation";

// Import screens
import InitHomeScreen from "../screens/InitHomeScreen";

// Import screen placeholders - will be created if they don't exist
import MatchScreen from "../screens/match/MatchScreen";
import CategoryScreen from "../screens/category/CategoryScreen";
import MediaScreen from "../screens/media/MediaScreen";
import CommunityHubScreen from "../screens/hub/CommunityHubScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";

// Match sub-screens
import MeeTScreen from "../screens/match/sub/MeeTScreen";
import MatcHScreen from "../screens/match/sub/MatcHScreen";
import MessageSScreen from "../screens/match/sub/MessageSScreen";

// New Match sub-screens
import MatchSubScreen from "../screens/sub/MatchSubScreen";
import MeetSubScreen from "../screens/sub/MeetSubScreen";
import MessageSubScreen from "../screens/sub/MessageSubScreen";

// Media sub-screens
import CamerAScreen from "../screens/media/sub/CamerAScreen";
import ContenTScreen from "../screens/media/sub/ContenTScreen";
import CreatEScreen from "../screens/media/sub/CreatEScreen";

// Category tile screens
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

// Hub sub-screens
import BoostedContentScreen from "../screens/hub/sub/BoostedCommunity";
import PoPpeDScreen from "../screens/hub/sub/PoPpeDScreen";
import ChAtSpAcEScreen from "../screens/hub/sub/ChAtSpAcEScreen";

// New Hub sub-screens
import ChatSpaceSubScreen from "../screens/sub/ChatSpaceSubScreen";
import BoostedSubScreen from "../screens/sub/BoostedSubScreen";
import PoPpeDSubScreen from "../screens/sub/PoPpeDSubScreen";

// Profile sub-screens
import PreferencesSettingsScreen from "../screens/profile/sub/PreferencesSettingsScreen";

const RootStack = createNativeStackNavigator<RootNavigationParamList>();

const TabNavigator = createBottomTabNavigator<TabNavigationParamList>();

const MainTabNavigator: React.FC = () => {
  return (
    <>
      <TabNavigator.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" }, // Hide default tab bar, using GlobalNavigation instead
        }}
      >
        <TabNavigator.Screen name="MatchScreen" component={MatchScreen} />
        <TabNavigator.Screen name="CategoryScreen" component={CategoryScreen} />
        <TabNavigator.Screen name="MediaScreen" component={MediaScreen} />
        <TabNavigator.Screen
          name="CommunityHubScreen"
          component={CommunityHubScreen}
        />
        <TabNavigator.Screen name="ProfileScreen" component={ProfileScreen} />
      </TabNavigator.Navigator>
      <GlobalNavigation />
    </>
  );
};

export const RootNavigator: React.FC = () => {
  return (
    <RootStack.Navigator
      initialRouteName="InitHome"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: "slide_from_right",
      }}
    >
      {/* Initial home screen */}
      <RootStack.Screen name="InitHome" component={InitHomeScreen} />

      {/* Main tab navigator */}
      <RootStack.Screen name="Main" component={MainTabNavigator} />

      {/* Individual screens for direct navigation */}
      <RootStack.Screen name="MatchScreen" component={MatchScreen} />
      <RootStack.Screen name="CategoryScreen" component={CategoryScreen} />
      <RootStack.Screen name="MediaScreen" component={MediaScreen} />
      <RootStack.Screen
        name="CommunityHubScreen"
        component={CommunityHubScreen}
      />
      <RootStack.Screen name="ProfileScreen" component={ProfileScreen} />

      {/* Match sub-screens */}
      <RootStack.Screen name="MeeTScreen" component={MeeTScreen} />
      <RootStack.Screen name="MatcHScreen" component={MatcHScreen} />
      <RootStack.Screen name="MessageSScreen" component={MessageSScreen} />

      {/* New Match sub-screens */}
      <RootStack.Screen name="MatchSubScreen" component={MatchSubScreen} />
      <RootStack.Screen name="MeetSubScreen" component={MeetSubScreen} />
      <RootStack.Screen name="MessageSubScreen" component={MessageSubScreen} />

      {/* Media sub-screens */}
      <RootStack.Screen name="CamerAScreen" component={CamerAScreen} />
      <RootStack.Screen name="ContenTScreen" component={ContenTScreen} />
      <RootStack.Screen name="CreatEScreen" component={CreatEScreen} />

      {/* Category tile screens */}
      <RootStack.Screen name="Tile1Screen" component={Tile1Screen} />
      <RootStack.Screen name="Tile2Screen" component={Tile2Screen} />
      <RootStack.Screen name="Tile3Screen" component={Tile3Screen} />
      <RootStack.Screen name="Tile4Screen" component={Tile4Screen} />
      <RootStack.Screen name="Tile5Screen" component={Tile5Screen} />
      <RootStack.Screen name="Tile6Screen" component={Tile6Screen} />
      <RootStack.Screen name="Tile7Screen" component={Tile7Screen} />
      <RootStack.Screen name="Tile8Screen" component={Tile8Screen} />
      <RootStack.Screen name="Tile9Screen" component={Tile9Screen} />
      <RootStack.Screen name="Tile10Screen" component={Tile10Screen} />
      <RootStack.Screen name="Tile11Screen" component={Tile11Screen} />
      <RootStack.Screen name="Tile12Screen" component={Tile12Screen} />
      <RootStack.Screen name="Tile13Screen" component={Tile13Screen} />
      <RootStack.Screen name="Tile14Screen" component={Tile14Screen} />
      <RootStack.Screen name="Tile15Screen" component={Tile15Screen} />
      <RootStack.Screen name="Tile16Screen" component={Tile16Screen} />

      {/* Hub sub-screens */}
      <RootStack.Screen
        name="BoostedContentScreen"
        component={BoostedContentScreen}
      />
      <RootStack.Screen name="PoPpeDScreen" component={PoPpeDScreen} />
      <RootStack.Screen name="ChAtSpAcEScreen" component={ChAtSpAcEScreen} />

      {/* New Hub sub-screens */}
      <RootStack.Screen
        name="ChatSpaceSubScreen"
        component={ChatSpaceSubScreen}
      />
      <RootStack.Screen name="BoostedSubScreen" component={BoostedSubScreen} />
      <RootStack.Screen name="PoPpeDSubScreen" component={PoPpeDSubScreen} />

      {/* Profile sub-screens */}
      <RootStack.Screen
        name="PreferencesSettingsScreen"
        component={PreferencesSettingsScreen}
      />
    </RootStack.Navigator>
  );
};
