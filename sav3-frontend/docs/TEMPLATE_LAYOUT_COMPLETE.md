# SAV3 Template Layout - Complete Feature Integration

## 🎨 Layout Overview

This template layout incorporates all database, backend, and frontend features into a comprehensive, tab-based navigation system that works across both desktop and mobile platforms.

### Navigation Philosophy

- **Tabs Instead of NavWheel**: Clean, accessible tab-based navigation
- **Consistent Cross-Platform**: Same navigation pattern on desktop and mobile
- **Feature-Complete**: Every implemented feature accessible through intuitive navigation
- **Scalable**: Easy to add new features without navigation complexity

## 📱 Mobile Layout Template

### Tab Structure (Bottom Navigation)

```tsx
// TabNavigation.tsx - 5 Main Tabs
const MainTabs = {
  Home: {
    icon: "Home",
    label: "Home",
    badge: unreadCount,
    screens: ["Feed", "Stories", "Discovery"],
  },
  Social: {
    icon: "Users",
    label: "Social",
    badge: friendRequests,
    screens: ["Friends", "Communities", "Matches", "Nearby"],
  },
  Create: {
    icon: "Plus",
    label: "Create",
    screens: ["NewPost", "NewStory", "Camera", "Upload"],
  },
  Messages: {
    icon: "MessageCircle",
    label: "Messages",
    badge: unreadMessages,
    screens: ["Conversations", "Requests", "Groups"],
  },
  Profile: {
    icon: "User",
    label: "Profile",
    badge: notifications,
    screens: ["MyProfile", "Settings", "Bookmarks", "Analytics"],
  },
};
```

### Screen Hierarchy by Tab

#### 🏠 Home Tab

**Main Screen**: Feed

- **Feed SubTabs**:
  - "For You" (personalized algorithm feed)
  - "Following" (posts from followed users)
  - "Trending" (popular posts)
  - "Categories" (filtered by interest categories)

**Stories Bar**: Horizontal scrolling stories at top

- Own story creation button
- Friends' stories with view indicators
- Story highlights from followed users

**Discovery Panel**: Pull-to-reveal discovery features

- Nearby users (geospatial)
- Suggested users based on interests
- Featured communities
- Trending hashtags

#### 👥 Social Tab

**Main Screen**: Social Hub

- **Friends SubTabs**:
  - "Friends" (accepted friendships)
  - "Requests" (pending friend requests)
  - "Suggestions" (friend suggestions based on mutual connections)
  - "Find Friends" (search and discovery)

**Communities Section**:

- Joined communities list
- Recommended communities
- Create community button
- Community search

**Matching System** (if dating features enabled):

- Like/pass interface
- Mutual matches
- Boost status
- Match preferences

**Nearby Users** (geospatial):

- Map view of nearby users
- List view with distance
- Location-based discovery settings

#### ➕ Create Tab

**Main Screen**: Creation Hub

- **Post Creation**:
  - Text post composer
  - Photo/video selector
  - Media editing tools
  - Privacy settings
  - Category selection
  - Location tagging

**Story Creation**:

- Camera interface
- Photo/video capture
- Story editing tools
- Highlight creation
- Story privacy settings

**Quick Actions**:

- Camera shortcut
- Gallery import
- Draft posts
- Scheduled posts

#### 💬 Messages Tab

**Main Screen**: Conversations List

- **Conversations SubTabs**:
  - "All" (all conversations)
  - "Unread" (unread messages)
  - "Groups" (group conversations)
  - "Requests" (message requests from non-friends)

**Conversation Features**:

- Real-time messaging
- Media sharing
- Message reactions
- Read receipts
- Typing indicators
- Voice messages
- Video calls (if implemented)

**Message Management**:

- Search conversations
- Archive conversations
- Mute notifications
- Block/report users

#### 👤 Profile Tab

**Main Screen**: My Profile

- Profile header with photos
- Bio and interest tags
- Stats (posts, friends, matches)
- Recent activity feed

**SubSections**:

- **My Content**:
  - "Posts" (my posts grid)
  - "Stories" (story highlights)
  - "Media" (photos and videos)
  - "Bookmarks" (saved content)

- **Collections**:
  - Bookmark collections
  - Saved posts by category
  - Shared collections

- **Settings & Privacy**:
  - Account settings
  - Privacy controls
  - Notification preferences
  - Subscription management
  - Analytics dashboard (engagement metrics)

- **Safety & Support**:
  - Blocked users
  - Report history
  - Help & support
  - Terms & privacy policy

### Mobile Layout Components

```tsx
// MobileLayout.tsx
export const MobileLayout: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, notifications, unreadMessages, friendRequests } =
    useMobileStore();

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* Header - Context Sensitive */}
      <Header
        user={user}
        notifications={notifications}
        onNotificationPress={() => navigateToNotifications()}
        onSearchPress={() => navigateToSearch()}
      />

      {/* Main Content Area */}
      <View style={styles.content}>{children}</View>

      {/* Tab Navigation */}
      <TabNavigation
        tabs={MainTabs}
        badges={{
          Home: notifications?.length || 0,
          Social: friendRequests?.length || 0,
          Messages: unreadMessages?.length || 0,
          Profile: user?.unreadNotifications || 0,
        }}
      />

      {/* Floating Action Button - Context Sensitive */}
      <FloatingActionButton
        actions={getFABActions(currentTab)}
        onPress={handleFABPress}
      />
    </View>
  );
};
```

## 🖥️ Desktop Layout Template

### Sidebar Navigation (Left Panel)

```tsx
// DesktopSidebar.tsx
const SidebarSections = {
  main: [
    { icon: "Home", label: "Home", route: "/", badge: unreadCount },
    { icon: "Compass", label: "Discover", route: "/discover" },
    { icon: "Users", label: "Social", route: "/social", badge: friendRequests },
    {
      icon: "MessageCircle",
      label: "Messages",
      route: "/messages",
      badge: unreadMessages,
    },
    {
      icon: "Bell",
      label: "Notifications",
      route: "/notifications",
      badge: notifications,
    },
  ],
  content: [
    { icon: "Bookmark", label: "Bookmarks", route: "/bookmarks" },
    { icon: "Collection", label: "Collections", route: "/collections" },
    { icon: "Camera", label: "Stories", route: "/stories" },
    { icon: "Share2", label: "Shared", route: "/shared" },
  ],
  management: [
    { icon: "Settings", label: "Settings", route: "/settings" },
    { icon: "BarChart3", label: "Analytics", route: "/analytics" },
    { icon: "Shield", label: "Privacy", route: "/privacy" },
    { icon: "CreditCard", label: "Subscription", route: "/subscription" },
  ],
};
```

### Main Content Area (Center Panel)

**Dynamic Content Based on Route**:

- Full-width content area
- Context-sensitive headers
- Breadcrumb navigation for deep pages
- Quick action toolbar

### Right Panel (Context Panel)

**Context-Sensitive Information**:

- **Home**: Trending topics, suggested users, activity feed
- **Social**: Friend suggestions, community recommendations, nearby users
- **Messages**: Conversation info, shared media, message search
- **Profile**: Profile stats, recent activity, quick actions

### Desktop Layout Structure

```tsx
// DesktopLayout.tsx
export const DesktopLayout: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, currentRoute, sidebarCollapsed } = useDesktopStore();

  return (
    <div className="desktop-layout">
      {/* Top Bar */}
      <TopBar
        user={user}
        searchProps={{
          placeholder: "Search posts, users, communities...",
          onSearch: handleGlobalSearch,
          suggestions: searchSuggestions,
        }}
        actions={[
          { icon: "Plus", label: "Create", onClick: openCreateModal },
          {
            icon: "Bell",
            label: "Notifications",
            badge: notifications?.length,
          },
          { icon: "Settings", label: "Settings", onClick: openSettings },
        ]}
      />

      {/* Main Content Grid */}
      <div className="main-grid">
        {/* Left Sidebar */}
        <Sidebar
          sections={SidebarSections}
          currentRoute={currentRoute}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          user={user}
        />

        {/* Center Content */}
        <main className="content-area">
          <ContentHeader
            breadcrumb={getBreadcrumb(currentRoute)}
            actions={getContextActions(currentRoute)}
          />
          <div className="content-body">{children}</div>
        </main>

        {/* Right Context Panel */}
        <ContextPanel
          route={currentRoute}
          user={user}
          data={getContextData(currentRoute)}
        />
      </div>

      {/* Modals & Overlays */}
      <ModalManager />
      <NotificationToast />
    </div>
  );
};
```

## 🔄 Feature Integration Mapping

### Database Features → UI Components

```tsx
// Feature mapping showing how database models connect to UI
const FeatureMapping = {
  // User & Profile System
  User: {
    components: ["UserCard", "ProfileHeader", "UserAvatar"],
    screens: ["Profile", "Settings", "EditProfile"],
    features: ["authentication", "profile_management"],
  },

  // Content System
  Post: {
    components: ["PostCard", "PostComposer", "PostStats"],
    screens: ["Feed", "PostDetail", "CreatePost"],
    features: ["content_creation", "social_interactions"],
  },

  // Social Interactions
  Like: {
    components: ["LikeButton", "LikesList", "PostStats"],
    screens: ["Feed", "PostDetail", "Analytics"],
    features: ["engagement", "social_validation"],
  },

  // Messaging System
  Message: {
    components: ["MessageBubble", "ConversationList", "MessageComposer"],
    screens: ["Messages", "Conversation", "MessageRequests"],
    features: ["real_time_chat", "media_sharing"],
  },

  // Stories System
  Story: {
    components: ["StoryViewer", "StoryComposer", "StoriesBar"],
    screens: ["Stories", "CreateStory", "StoryHighlights"],
    features: ["temporary_content", "story_analytics"],
  },

  // Bookmarks & Collections
  Bookmark: {
    components: ["BookmarkButton", "BookmarksList", "CollectionGrid"],
    screens: ["Bookmarks", "Collections", "BookmarkDetail"],
    features: ["content_saving", "organization"],
  },

  // Search & Discovery
  SearchQuery: {
    components: ["SearchBar", "SearchResults", "SearchHistory"],
    screens: ["Search", "Discover", "SearchDetail"],
    features: ["global_search", "content_discovery"],
  },

  // Analytics & Insights
  AnalyticsEvent: {
    components: ["AnalyticsChart", "MetricCard", "InsightPanel"],
    screens: ["Analytics", "Insights", "Reports"],
    features: ["data_visualization", "performance_metrics"],
  },
};
```

### Backend APIs → Frontend Actions

```tsx
// API integration showing backend endpoints connected to frontend actions
const APIIntegration = {
  // Authentication Flow
  auth: {
    endpoints: ["/api/auth/login", "/api/auth/register", "/api/auth/refresh"],
    actions: ["login", "register", "logout", "refreshToken"],
    components: ["LoginForm", "RegisterForm", "AuthGuard"],
  },

  // Content Management
  posts: {
    endpoints: ["/api/posts", "/api/posts/:id", "/api/social/posts/:id/like"],
    actions: ["createPost", "updatePost", "deletePost", "likePost"],
    components: ["PostComposer", "PostCard", "PostActions"],
  },

  // Social Features
  social: {
    endpoints: ["/api/social/posts/:id/comments", "/api/social/posts/:id/like"],
    actions: ["addComment", "likePost", "sharePost"],
    components: ["CommentSection", "LikeButton", "ShareModal"],
  },

  // Real-time Features
  messaging: {
    endpoints: ["/api/messaging/send", "/api/messaging/conversations"],
    websocket: "/ws/messages",
    actions: ["sendMessage", "getConversations", "markAsRead"],
    components: ["MessageComposer", "ConversationList", "MessageBubble"],
  },

  // Discovery & Search
  search: {
    endpoints: ["/api/search", "/api/search/users", "/api/discovery/feed"],
    actions: ["globalSearch", "searchUsers", "getDiscoveryFeed"],
    components: ["SearchBar", "SearchResults", "DiscoveryFeed"],
  },
};
```

## 🎯 Component Library Architecture

### Core Components

```tsx
// Shared component system across mobile and desktop
export const CoreComponents = {
  // Layout Components
  Layout: { Mobile: "MobileLayout", Desktop: "DesktopLayout" },
  Navigation: { Mobile: "TabNavigation", Desktop: "Sidebar" },
  Header: { Mobile: "MobileHeader", Desktop: "TopBar" },

  // Content Components
  Post: {
    Card: "PostCard",
    Composer: "PostComposer",
    Actions: "PostActions",
    Stats: "PostStats",
  },

  // User Components
  User: {
    Avatar: "UserAvatar",
    Card: "UserCard",
    Profile: "ProfileHeader",
    Settings: "UserSettings",
  },

  // Media Components
  Media: {
    Image: "MediaImage",
    Video: "MediaVideo",
    Gallery: "MediaGallery",
    Uploader: "MediaUploader",
  },

  // Social Components
  Social: {
    Like: "LikeButton",
    Comment: "CommentSection",
    Share: "ShareButton",
    Reaction: "ReactionButton",
  },

  // Communication Components
  Message: {
    Bubble: "MessageBubble",
    Composer: "MessageComposer",
    List: "ConversationList",
    Status: "MessageStatus",
  },

  // Discovery Components
  Discovery: {
    Feed: "DiscoveryFeed",
    Search: "SearchBar",
    Results: "SearchResults",
    Filters: "SearchFilters",
  },

  // Analytics Components
  Analytics: {
    Chart: "AnalyticsChart",
    Metric: "MetricCard",
    Insight: "InsightPanel",
    Report: "ReportView",
  },
};
```

## 📊 State Management Architecture

### Global State Structure

```tsx
// Unified state management across platforms
interface AppState {
  // Authentication State
  auth: {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    loading: boolean;
  };

  // Content State
  content: {
    posts: Post[];
    stories: Story[];
    bookmarks: Bookmark[];
    collections: Collection[];
    currentFeed: "forYou" | "following" | "trending";
  };

  // Social State
  social: {
    friends: User[];
    friendRequests: FriendRequest[];
    matches: Match[];
    communities: Community[];
    nearbyUsers: User[];
  };

  // Communication State
  messaging: {
    conversations: Conversation[];
    unreadCount: number;
    activeConversation: string | null;
    typing: Record<string, boolean>;
  };

  // Discovery State
  discovery: {
    searchQuery: string;
    searchResults: SearchResults;
    searchHistory: SearchQuery[];
    discoveryFeed: Post[];
    filters: SearchFilters;
  };

  // Analytics State
  analytics: {
    userMetrics: UserMetrics;
    engagementData: EngagementData;
    conversionFunnel: ConversionData;
    customEvents: AnalyticsEvent[];
  };

  // UI State
  ui: {
    theme: "light" | "dark";
    sidebarCollapsed: boolean;
    activeTab: string;
    modals: Record<string, boolean>;
    notifications: Notification[];
  };

  // Settings State
  settings: {
    privacy: PrivacySettings;
    notifications: NotificationSettings;
    preferences: UserPreferences;
    subscription: Subscription | null;
  };
}
```

## 🚀 Implementation Guidelines

### Mobile Implementation Priority

1. **Tab Navigation Setup** - Implement bottom tab navigation
2. **Core Screens** - Build out main screens for each tab
3. **API Integration** - Connect all screens to backend APIs
4. **Real-time Features** - Implement WebSocket connections
5. **Push Notifications** - Set up notification handling
6. **Media Features** - Camera integration and media handling
7. **Offline Support** - Implement offline-first architecture
8. **Performance Optimization** - Optimize for mobile performance

### Desktop Implementation Priority

1. **Sidebar Navigation** - Replace current navigation with full sidebar
2. **Content Areas** - Implement three-panel layout
3. **Context Panels** - Add right-panel context information
4. **Modal System** - Implement modal management
5. **Search Integration** - Global search functionality
6. **Notification System** - Desktop notification handling
7. **Analytics Dashboard** - Admin and user analytics
8. **Responsive Design** - Ensure responsiveness across screen sizes

### Cross-Platform Consistency

- **Design Tokens** - Shared colors, typography, spacing
- **Component API** - Consistent component interfaces
- **State Management** - Unified state structure
- **API Client** - Shared API communication layer
- **Theme System** - Consistent theming across platforms
- **Navigation Patterns** - Similar navigation logic
- **Error Handling** - Consistent error states and messages
- **Loading States** - Unified loading indicators

This template layout provides a comprehensive foundation that integrates every database model, backend API endpoint, and frontend feature into a cohesive, tab-based navigation system that works seamlessly across both mobile and desktop platforms.
