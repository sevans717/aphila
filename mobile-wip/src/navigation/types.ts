// Navigation types for the simplified app layout structure
export type TabNavigationParamList = {
  MatchScreen: undefined;
  CategoryScreen: undefined;
  MediaScreen: undefined;
  CommunityHubScreen: undefined;
  ProfileScreen: undefined;
};

export type MatchStackParamList = {
  MatchPage: undefined;
  MeeT: undefined;
  MatcH: undefined;
  MessageS: undefined;
};

export type CategoryStackParamList = {
  TileS: undefined;
};

export type MediaStackParamList = {
  CamerA: undefined;
  ContenT: undefined;
  CreatE: undefined;
};

export type HubStackParamList = {
  CommunityHub: undefined;
  BoostedContent: undefined;
  PoPpeD: undefined;
  ChAtSpAcE: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  PreferencesSettings: undefined;
};

// Root navigation type combining all stacks
export type RootNavigationParamList = {
  InitHome: undefined;
  Main: undefined;
  MatchScreen: undefined;
  CategoryScreen: undefined;
  MediaScreen: undefined;
  CamerAScreen: undefined;
  ContenTScreen: undefined;
  CreatEScreen: undefined;
  CommunityHubScreen: undefined;
  ProfileScreen: undefined;
  PreferencesSettingsScreen: undefined;
  // Match sub screens
  MatchSubScreen: undefined;
  MeetSubScreen: undefined;
  MessageSubScreen: undefined;
  MeeTScreen: undefined;
  MatcHScreen: undefined;
  MessageSScreen: undefined;
  // Tile sub screens
  Tile1Screen: undefined;
  Tile2Screen: undefined;
  Tile3Screen: undefined;
  Tile4Screen: undefined;
  Tile5Screen: undefined;
  Tile6Screen: undefined;
  Tile7Screen: undefined;
  Tile8Screen: undefined;
  Tile9Screen: undefined;
  Tile10Screen: undefined;
  Tile11Screen: undefined;
  Tile12Screen: undefined;
  Tile13Screen: undefined;
  Tile14Screen: undefined;
  Tile15Screen: undefined;
  Tile16Screen: undefined;
  // Hub sub-screens
  BoostedContentScreen: undefined;
  PoPpeDScreen: undefined;
  ChAtSpAcEScreen: undefined;
  ChatSpaceSubScreen: undefined;
  BoostedSubScreen: undefined;
  PoPpeDSubScreen: undefined;
};
