# 📱 **SAV3 Mobile Layout Architecture Outline**

## **📋 Overview**

This comprehensive outline defines the mobile layout architecture for SAV3, utilizing the existing NavWheel system and creating a cohesive React Native experience across iOS and Android platforms.

---

## **🏗️ Current Mobile Foundation**

### **Existing Architecture**

- **Framework**: Expo SDK 53 + React Native 0.79.5
- **Navigation**: React Navigation v7 + Custom NavWheel
- **Gestures**: React Native Gesture Handler + Reanimated v3
- **Layout**: Sav3Layout wrapper with black (#000) theme
- **Entry Point**: App_SAV3.tsx with NavigationProvider

### **Core Technologies**

- **Styling**: StyleSheet-based with glass blur effects
- **State Management**: React Context (Auth, Navigation)
- **Animations**: Reanimated v3 with spring physics
- **Safe Areas**: React Native Safe Area Context
- **Gestures**: Advanced gesture recognition system

---

## **🎨 Mobile Design System**

### **Theme & Visual Identity**

```typescript
const MobileTheme = {
  colors: {
    primary: "#000000", // Pure black background
    surface: "rgba(255,255,255,0.05)", // Glass surface
    accent: "#007AFF", // iOS-style blue accent
    text: "#FFFFFF", // White text
    textSecondary: "#A0A0A0", // Gray text
    border: "rgba(255,255,255,0.1)", // Subtle borders
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
};
```

### **Typography Scale**

```typescript
const Typography = {
  display: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
};
```

---

## **📱 Layout Components Architecture**

### **1. Root Layout Structure**

```typescript
// Core app wrapper with providers
<GestureHandlerRootView>
  <SafeAreaProvider>
    <SafeAreaView>
      <ErrorBoundary>
        <NavigationProvider>
          <AuthProvider>
            <Sav3Layout>
              <NavigationContainer>
                <StackNavigator />
              </NavigationContainer>
              <GlobalNavWheel />
            </Sav3Layout>
          </AuthProvider>
        </NavigationProvider>
      </ErrorBoundary>
    </SafeAreaView>
  </SafeAreaProvider>
</GestureHandlerRootView>
```

### **2. Screen Layout Templates**

#### **A. Full Screen Layout (Media, Posts)**

```typescript
const FullScreenLayout: React.FC = ({ children }) => (
  <View style={styles.fullScreen}>
    <StatusBar hidden />
    {children}
    <SafeAreaInsets />
  </View>
);

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  }
});
```

#### **B. Header + Content Layout (Profile, Settings)**

```typescript
const HeaderContentLayout: React.FC = ({
  title,
  headerActions,
  children
}) => (
  <View style={styles.container}>
    <MobileHeader
      title={title}
      actions={headerActions}
    />
    <ScrollView style={styles.content}>
      {children}
    </ScrollView>
    <SafeAreaInsets />
  </View>
);
```

#### **C. Tab-Based Layout (Categories, Communities)**

```typescript
const TabLayout: React.FC = ({ tabs, children }) => (
  <View style={styles.container}>
    <MobileTabBar tabs={tabs} />
    <View style={styles.tabContent}>
      {children}
    </View>
  </View>
);
```

---

## **🧭 Navigation System**

### **1. NavWheel Navigation (Primary)**

#### **NavWheel States**

- **Hidden**: Glass hint button visible at bottom
- **Closed**: Center button visible, ready for gestures
- **Opened**: Full wheel with navigation options

#### **NavWheel Interaction Flow**

```typescript
// Gesture handling flow
1. User swipes up from bottom → NavWheel appears (closed)
2. User drags center button → NavWheel opens with options
3. User drags to item → Item highlights with haptic feedback
4. User releases → Navigation occurs with smooth transition
5. NavWheel hides automatically after navigation
```

#### **NavWheel Layout Structure**

```typescript
const NavWheelLayout = {
  centerButton: {
    size: 77,
    position: "absolute",
    bottom: "33%", // Dynamic positioning
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
  },
  wheelItems: {
    radius: 120,
    itemCount: 5,
    itemSize: 60,
    spacing: 72, // degrees between items
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(10px)",
  },
};
```

### **2. Secondary Navigation**

#### **A. Stack Navigation (React Navigation)**

- Used for deep navigation within screens
- Maintains navigation history
- Supports back gestures and buttons

#### **B. Modal Navigation**

- Camera/media picker
- Full-screen overlays
- Settings panels

#### **C. Gesture Navigation**

- Swipe back to previous screen
- Pull-to-refresh on lists
- Swipe between tabs/content

---

## **📄 Screen Implementations**

### **1. Media Page (Primary)**

```typescript
const MediaPageLayout = () => (
  <FullScreenLayout>
    <MediaHeader />
    <MediaGrid>
      {/* Virtualized grid of media items */}
    </MediaGrid>
    <MediaActionBar />
  </FullScreenLayout>
);

// Grid layout with 3 columns
const MediaGrid = styled.ScrollView`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.sm}px;
`;

const MediaItem = styled.TouchableOpacity`
  width: ${width / 3 - 16}px;
  height: ${width / 3 - 16}px;
  margin: ${({ theme }) => theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.borderRadius.md}px;
  overflow: hidden;
`;
```

### **2. Profile Page**

```typescript
const ProfilePageLayout = () => (
  <HeaderContentLayout title="Profile">
    <ProfileHeader>
      <ProfileAvatar />
      <ProfileInfo />
      <ProfileActions />
    </ProfileHeader>

    <ProfileTabs>
      <Tab.Screen name="Posts" component={ProfilePosts} />
      <Tab.Screen name="Media" component={ProfileMedia} />
      <Tab.Screen name="About" component={ProfileAbout} />
    </ProfileTabs>
  </HeaderContentLayout>
);

const ProfileHeader = styled.View`
  padding: ${({ theme }) => theme.spacing.lg}px;
  align-items: center;
  background: rgba(255,255,255,0.05);
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;
```

### **3. Community Page**

```typescript
const CommunityPageLayout = () => (
  <TabLayout tabs={['Discover', 'Joined', 'Trending']}>
    <CommunityGrid>
      {communities.map(community => (
        <CommunityCard key={community.id} community={community} />
      ))}
    </CommunityGrid>
  </TabLayout>
);

const CommunityCard = styled.TouchableOpacity`
  background: rgba(255,255,255,0.05);
  border-radius: ${({ theme }) => theme.borderRadius.lg}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  margin: ${({ theme }) => theme.spacing.sm}px;
  backdrop-filter: blur(20px);
`;
```

### **4. Messaging Page (To Be Implemented)**

```typescript
const MessagingPageLayout = () => (
  <View style={styles.messagingContainer}>
    <MessagingHeader />
    <ConversationsList />
    <NewMessageFAB />
  </View>
);

const ConversationItem = styled.TouchableOpacity`
  flex-direction: row;
  padding: ${({ theme }) => theme.spacing.md}px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
`;
```

### **5. Categories Page**

```typescript
const CategoriesPageLayout = () => (
  <HeaderContentLayout title="Categories">
    <CategoryGrid>
      {categories.map(category => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </CategoryGrid>
  </HeaderContentLayout>
);
```

---

## **🎯 Component Library**

### **1. Core UI Components**

#### **MobileHeader**

```typescript
const MobileHeader: React.FC<{
  title: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}> = ({ title, leftAction, rightAction, transparent = false }) => (
  <HeaderContainer transparent={transparent}>
    <SafeAreaInsets />
    <HeaderContent>
      <HeaderLeft>{leftAction}</HeaderLeft>
      <HeaderTitle>{title}</HeaderTitle>
      <HeaderRight>{rightAction}</HeaderRight>
    </HeaderContent>
  </HeaderContainer>
);
```

#### **MobileCard**

```typescript
const MobileCard: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'glass' | 'solid';
}> = ({ children, onPress, variant = 'default' }) => (
  <CardContainer variant={variant} onPress={onPress}>
    {children}
  </CardContainer>
);
```

#### **MobileButton**

```typescript
const MobileButton: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}> = ({ title, onPress, variant = 'primary', size = 'md', icon }) => (
  <ButtonContainer variant={variant} size={size} onPress={onPress}>
    {icon && <ButtonIcon>{icon}</ButtonIcon>}
    <ButtonText variant={variant} size={size}>
      {title}
    </ButtonText>
  </ButtonContainer>
);
```

### **2. Specialized Components**

#### **MediaUploader**

```typescript
const MediaUploader: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);

  return (
    <UploaderContainer>
      <MediaGrid>
        {selectedMedia.map(item => (
          <MediaPreview key={item.id} item={item} />
        ))}
        <AddMediaButton onPress={openMediaPicker} />
      </MediaGrid>
      <UploadProgress />
    </UploaderContainer>
  );
};
```

#### **PullToRefresh**

```typescript
const PullToRefresh: React.FC<{
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}> = ({ onRefresh, children }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#FFFFFF"
        />
      }
    >
      {children}
    </ScrollView>
  );
};
```

---

## **⚡ Performance Optimizations**

### **1. Virtualization**

- Use FlashList for large lists (posts, media)
- Implement lazy loading for images
- Progressive loading for content

### **2. Memory Management**

- Image caching with react-native-fast-image
- Automatic memory cleanup for screens
- Optimized animations with native driver

### **3. Bundle Optimization**

- Code splitting by screen
- Dynamic imports for heavy features
- Asset optimization (WebP, smaller bundles)

---

## **🎨 Animation System**

### **1. Screen Transitions**

```typescript
const ScreenTransition = {
  gestureEnabled: true,
  animationTypeForReplace: "push",
  cardStyleInterpolator: ({ current, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
    };
  },
};
```

### **2. Micro-interactions**

```typescript
const useSpringAnimation = (value: boolean) => {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withSpring(value ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [value]);

  return animatedValue;
};
```

---

## **🔧 Implementation Priority**

### **Phase 1: Core Layout (1-2 days)**

1. ✅ Base Sav3Layout component (Complete)
2. ✅ GlobalNavWheel integration (Complete)
3. ⚠️ MobileHeader component (Needs styling)
4. ❌ MobileCard component (To implement)

### **Phase 2: Screen Implementation (3-4 days)**

1. ⚠️ MediaPage completion (Basic layout exists)
2. ❌ MessagingPage implementation
3. ⚠️ ProfilePage enhancement
4. ⚠️ CommunityPage completion
5. ⚠️ CategoriesPage completion

### **Phase 3: Component Library (2-3 days)**

1. ❌ Core UI components (Button, Card, Input)
2. ❌ Specialized components (MediaUploader, PullToRefresh)
3. ❌ Animation components
4. ❌ Gesture handlers

### **Phase 4: Polish & Optimization (1-2 days)**

1. ❌ Performance optimizations
2. ❌ Animation refinements
3. ❌ Accessibility features
4. ❌ Testing & bug fixes

---

## **📊 Current Status**

### **✅ Completed**

- React Native + Expo foundation
- Navigation system architecture
- NavWheel gesture system
- Basic page routing
- Error boundaries

### **⚠️ In Progress**

- Page implementations (basic structure)
- Theme system (partially implemented)
- Component styling

### **❌ Missing**

- Complete screen implementations
- UI component library
- Real-time features integration
- Media handling
- Performance optimizations

### **🎯 Success Metrics**

- 60fps smooth animations
- <100ms gesture response time
- Intuitive navigation patterns
- Cross-platform consistency
- Accessibility compliance

This mobile layout architecture provides a comprehensive foundation for building a polished, gesture-rich React Native experience that leverages the unique NavWheel system while maintaining platform conventions and performance standards.
