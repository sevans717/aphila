/**
 * Navigation Types
 * Defines all navigation structures, routes, parameters, and screen types
 */

// React Navigation types (will be available when packages are installed)
type NavigatorScreenParams<T> =
  T extends Record<string, any>
    ? { screen?: keyof T; params?: T[keyof T] }
    : undefined;

interface StackScreenProps<ParamList, RouteName extends keyof ParamList> {
  navigation: any;
  route: {
    key: string;
    name: RouteName;
    params: ParamList[RouteName];
  };
}

interface BottomTabScreenProps<ParamList, RouteName extends keyof ParamList> {
  navigation: any;
  route: {
    key: string;
    name: RouteName;
    params: ParamList[RouteName];
  };
}

// Root Navigation Types
export type RootStackParamList = {
  Boot: undefined;
  InitHome: undefined;
  Main: NavigatorScreenParams<TabParamList>;
  CategoryUserPool: { categoryId: string; categoryName: string };
  PreferencesSettings: undefined;
};

export type TabParamList = {
  Match: NavigatorScreenParams<MatchStackParamList>;
  Category: NavigatorScreenParams<CategoryStackParamList>;
  Media: NavigatorScreenParams<MediaStackParamList>;
  Hub: NavigatorScreenParams<HubStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Match Stack Types
export type MatchStackParamList = {
  MatchHome: undefined;
  Match: undefined;
  Meet: undefined;
  Message: undefined;
};

// Category Stack Types
export type CategoryStackParamList = {
  CategoryHome: undefined;
  Tile1: undefined;
  Tile2: undefined;
  Tile3: undefined;
  Tile4: undefined;
  Tile5: undefined;
  Tile6: undefined;
  Tile7: undefined;
  Tile8: undefined;
  Tile9: undefined;
  Tile10: undefined;
  Tile11: undefined;
  Tile12: undefined;
  Tile13: undefined;
  Tile14: undefined;
  Tile15: undefined;
  Tile16: undefined;
};

// Media Stack Types
export type MediaStackParamList = {
  MediaHome: undefined;
  Camera: undefined;
  Content: undefined;
  Create: undefined;
};

// Hub Stack Types
export type HubStackParamList = {
  HubHome: undefined;
  ChatSpace: undefined;
  Boosted: undefined;
  PoPpeD: undefined;
};

// Profile Stack Types
export type ProfileStackParamList = {
  ProfileHome: undefined;
  PreferencesSettings: undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;
export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<
  TabParamList,
  T
>;

export type MatchStackScreenProps<T extends keyof MatchStackParamList> =
  StackScreenProps<MatchStackParamList, T>;
export type CategoryStackScreenProps<T extends keyof CategoryStackParamList> =
  StackScreenProps<CategoryStackParamList, T>;
export type MediaStackScreenProps<T extends keyof MediaStackParamList> =
  StackScreenProps<MediaStackParamList, T>;
export type HubStackScreenProps<T extends keyof HubStackParamList> =
  StackScreenProps<HubStackParamList, T>;
export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  StackScreenProps<ProfileStackParamList, T>;

// Navigation State Types
export interface NavigationState {
  currentTab: keyof TabParamList;
  currentStack: string;
  currentScreen: string;
  previousScreen?: string;
  navigationHistory: NavigationHistoryEntry[];
  canGoBack: boolean;
}

export interface NavigationHistoryEntry {
  screenName: string;
  params?: Record<string, any>;
  timestamp: number;
  tabName?: keyof TabParamList;
  stackName?: string;
}

// Tab Bar Types
export interface TabBarConfig {
  id: keyof TabParamList;
  name: string;
  icon: TabBarIcon;
  activeColor: string;
  inactiveColor: string;
  badge?: TabBadge;
  isVisible: boolean;
  isDisabled: boolean;
}

export interface TabBarIcon {
  type: "ionicon" | "material" | "fontawesome" | "custom";
  name: string;
  size?: number;
  color?: string;
  customComponent?: React.ComponentType<any>;
}

export interface TabBadge {
  count?: number;
  showDot?: boolean;
  color?: string;
  textColor?: string;
  maxCount?: number;
}

// Screen Layout Types
export interface ScreenLayout {
  hasHeader: boolean;
  hasTabBar: boolean;
  hasFloatingButton: boolean;
  orientation: ScreenOrientation;
  statusBarStyle: StatusBarStyle;
  backgroundColor: string;
  safeAreaConfig: SafeAreaConfig;
}

export type ScreenOrientation = "portrait" | "landscape" | "auto";
export type StatusBarStyle = "default" | "light-content" | "dark-content";

export interface SafeAreaConfig {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

// Navigation Animation Types
export interface NavigationAnimation {
  type: AnimationType;
  duration: number;
  easing?: EasingType;
  customConfig?: Record<string, any>;
}

export type AnimationType =
  | "slide_from_right"
  | "slide_from_left"
  | "slide_from_bottom"
  | "fade"
  | "scale"
  | "flip"
  | "none"
  | "custom";

export type EasingType =
  | "linear"
  | "ease"
  | "ease_in"
  | "ease_out"
  | "ease_in_out"
  | "bounce";

// Deep Linking Types
export interface DeepLinkConfig {
  scheme: string;
  host: string;
  routes: DeepLinkRoute[];
  fallbackUrl?: string;
  universalLinks: UniversalLinkConfig;
}

export interface DeepLinkRoute {
  path: string;
  screen: string;
  params?: Record<string, any>;
  exact?: boolean;
  caseSensitive?: boolean;
}

export interface UniversalLinkConfig {
  domains: string[];
  appleAppSiteAssociation: Record<string, any>;
  androidAssetLinks: Record<string, any>;
}

// Navigation Context Types
export interface NavigationContextValue {
  state: NavigationState;
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  goToTab: (tab: keyof TabParamList) => void;
  reset: (routes: NavigationResetRoute[]) => void;
  setOptions: (options: ScreenOptions) => void;
  addListener: (type: string, callback: (...args: any[]) => void) => () => void;
}

export interface NavigationResetRoute {
  name: string;
  params?: Record<string, any>;
}

export interface ScreenOptions {
  title?: string;
  headerShown?: boolean;
  headerTitle?: string;
  headerLeft?: React.ComponentType<any>;
  headerRight?: React.ComponentType<any>;
  headerStyle?: Record<string, any>;
  headerTitleStyle?: Record<string, any>;
  tabBarVisible?: boolean;
  tabBarLabel?: string;
  tabBarIcon?: React.ComponentType<any>;
  gestureEnabled?: boolean;
  cardStyle?: Record<string, any>;
}

// Navigation Guards Types
export interface NavigationGuard {
  name: string;
  condition: (
    from: string,
    to: string,
    params?: any
  ) => boolean | Promise<boolean>;
  onBlock?: (from: string, to: string, params?: any) => void;
  priority: number;
}

export interface NavigationGuardContext {
  guards: NavigationGuard[];
  addGuard: (guard: NavigationGuard) => void;
  removeGuard: (name: string) => void;
  checkGuards: (from: string, to: string, params?: any) => Promise<boolean>;
}

// Screen Lifecycle Types
export interface ScreenLifecycle {
  onFocus?: () => void;
  onBlur?: () => void;
  onMount?: () => void;
  onUnmount?: () => void;
  onStateChange?: (state: any) => void;
}

// Modal Types
export interface ModalConfig {
  id: string;
  type: ModalType;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  options: ModalOptions;
}

export type ModalType =
  | "fullscreen"
  | "card"
  | "bottom_sheet"
  | "center"
  | "custom";

export interface ModalOptions {
  dismissible: boolean;
  backdrop: boolean;
  backdropOpacity?: number;
  animation?: NavigationAnimation;
  onDismiss?: () => void;
  onShow?: () => void;
  swipeGesture?: boolean;
  keyboardAvoidingView?: boolean;
}

// Gesture Types
export interface GestureConfig {
  enabled: boolean;
  direction: GestureDirection;
  distance: number;
  velocity: number;
  onGesture?: (gesture: GestureEvent) => void;
}

export type GestureDirection = "horizontal" | "vertical" | "both";

export interface GestureEvent {
  type: "swipe" | "pan" | "pinch" | "tap";
  direction?: "up" | "down" | "left" | "right";
  velocity: { x: number; y: number };
  distance: { x: number; y: number };
  scale?: number;
}

// Navigation Analytics Types
export interface NavigationAnalytics {
  screenViews: ScreenView[];
  userFlow: UserFlowStep[];
  sessionData: NavigationSession;
  dropOffPoints: DropOffPoint[];
}

export interface ScreenView {
  screenName: string;
  timestamp: number;
  duration?: number;
  params?: Record<string, any>;
  source: string;
}

export interface UserFlowStep {
  from: string;
  to: string;
  timestamp: number;
  method: "navigation" | "deeplink" | "back" | "tab";
  params?: Record<string, any>;
}

export interface NavigationSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  screenCount: number;
  tabSwitches: number;
  backActions: number;
  deepLinks: number;
}

export interface DropOffPoint {
  screenName: string;
  exitRate: number;
  commonExitActions: string[];
  avgTimeBeforeExit: number;
}

// Permission Types for Navigation
export interface NavigationPermissions {
  canAccess: (screen: string) => boolean;
  requiredRole?: string;
  requiredSubscription?: string;
  customCheck?: () => boolean | Promise<boolean>;
}

// Search and Filter Types for Navigation
export interface NavigationSearch {
  query: string;
  results: SearchResult[];
  filters: SearchFilter[];
  history: string[];
}

export interface SearchResult {
  screenName: string;
  title: string;
  description?: string;
  category: string;
  relevance: number;
  route: string;
  params?: Record<string, any>;
}

export interface SearchFilter {
  key: string;
  value: any;
  type: "text" | "boolean" | "number" | "date" | "select";
  options?: FilterOption[];
}

export interface FilterOption {
  label: string;
  value: any;
  count?: number;
}
