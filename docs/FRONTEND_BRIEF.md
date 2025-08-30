# SAV3 Frontend Capabilities & Functions Brief

## Overview

The SAV3 frontend ecosystem consists of two primary applications: a React-based web application and a React Native mobile application built with Expo. Both applications are designed to provide a seamless, modern user experience for the social media platform, with comprehensive feature coverage and responsive design principles.

## Architecture & Technology Stack

### Web Application

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for development and production builds
- **Hosting**: Netlify with serverless functions
- **Routing**: React Router for client-side navigation
- **State Management**: React Context API with custom hooks
- **Styling**: CSS Modules with responsive design principles
- **Forms**: React Hook Form with validation
- **HTTP Client**: Axios with interceptors for authentication

### Mobile Application

- **Framework**: React Native with Expo
- **Development Platform**: Expo Application Services (EAS)
- **Navigation**: React Navigation with stack and tab navigators
- **State Management**: React Context API and local state
- **Styling**: StyleSheet API with responsive design
- **Native Features**: Camera, location, push notifications
- **Build System**: EAS Build for iOS and Android

### Shared Infrastructure

- **Static Assets**: Centralized in `public/` directory
- **Serverless Functions**: Netlify functions for backend integration
- **Environment Management**: Environment-specific configuration
- **Code Organization**: Barrel exports for clean imports

## Web Application Architecture

### Application Structure

```text
sav3-frontend/
├── public/                    # Static assets
│   ├── manifest.json         # Web app manifest
│   ├── main.tsx             # Application entry point
│   └── client/               # Client-side assets
│       └── placeholder.txt
├── netlify/
│   ├── functions/            # Serverless functions
│   │   ├── get-recommendations.js
│   │   ├── media-list.js
│   │   ├── me.js
│   │   └── posts-feed.js
│   └── toml                 # Netlify configuration
├── src/                      # Application source
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── context/            # React context providers
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript definitions
│   ├── styles/             # Global styles and themes
│   └── lib/                # External library configurations
└── package.json             # Dependencies and scripts
```

### Key Features

#### User Interface

- **Responsive Design**: Mobile-first approach with breakpoints
- **Component Library**: Reusable UI components for consistency
- **Theme System**: Light/dark mode support with CSS custom properties
- **Accessibility**: ARIA labels and keyboard navigation support
- **Performance**: Code splitting and lazy loading for optimal performance

#### Authentication Flow

```typescript
// Authentication context
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post("/auth/login", credentials);
    const { user, token } = response.data;
    localStorage.setItem("authToken", token);
    setUser(user);
  },
  logout: () => {
    localStorage.removeItem("authToken");
    setUser(null);
  },
});
```

#### API Integration

```typescript
// API client configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Netlify Integration

#### Serverless Functions

- **get-recommendations.js**: AI-powered content recommendations
- **media-list.js**: Media asset management and serving
- **me.js**: User profile and authentication helpers
- **posts-feed.js**: Social media feed generation and caching

#### Build Configuration

```toml
# netlify.toml
[build]
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## Mobile Application Architecture

### Mobile Application Structure

```text
sav3-frontend/mobile/
├── app.json                 # Expo configuration
├── App.tsx                  # Main application component
├── App_SAV3.tsx            # Alternative app entry point
├── eas.json                # EAS Build configuration
├── index_SAV3.ts           # Alternative index file
├── src/
│   ├── components/         # Reusable UI components
│   ├── screens/            # Screen components
│   ├── navigation/         # Navigation configuration
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── context/            # React context providers
│   ├── types/              # TypeScript definitions
│   ├── lib/                # External library configurations
│   │   └── apiClient.ts    # API client configuration
│   └── styles/             # Global styles and themes
├── pages/                  # Page barrel exports
│   └── index.ts           # Consolidated page exports
└── package.json            # Dependencies and scripts
```

### Navigation System

#### Stack Navigation

```typescript
// Navigation structure
const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

#### Tab Navigation

```typescript
// Main tab navigation
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Discover') {
            iconName = focused ? 'search' : 'search-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

### Native Features Integration

#### Camera Access

```typescript
// Camera integration
const [permission, requestPermission] = useCameraPermissions();

const takePhoto = async () => {
  if (!permission?.granted) {
    await requestPermission();
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled) {
    // Handle photo
    const asset = result.assets[0];
    await uploadMedia(asset.uri);
  }
};
```

#### Location Services

```typescript
// Location integration
const [location, setLocation] = useState<LocationObject | null>(null);

useEffect(() => {
  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setLocation(location);
  })();
}, []);
```

#### Push Notifications

```typescript
// Push notification setup
useEffect(() => {
  const getPushToken = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    // Send token to backend for push notifications
    await apiClient.post("/users/device-token", { token: token.data });
  };

  getPushToken();
}, []);
```

## Shared Components & Utilities

### Component Library

- **Button**: Consistent button styles with variants
- **Input**: Form input components with validation
- **Card**: Content containers with consistent styling
- **Modal**: Overlay dialogs and popups
- **Avatar**: User profile images with fallbacks
- **Loading**: Loading states and skeletons

### Custom Hooks

```typescript
// API hook example
function useApi(endpoint: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (params = {}) => {
      setLoading(true);
      try {
        const response = await apiClient.get(endpoint, { params });
        setData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  return { data, loading, error, fetchData };
}
```

### Utility Functions

```typescript
// Date formatting utility
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return d.toLocaleDateString();
};

// Image optimization utility
export const optimizeImage = (
  uri: string,
  width: number,
  height: number
): string => {
  return `${uri}?w=${width}&h=${height}&fit=crop&auto=format`;
};
```

## State Management

### Context Providers

```typescript
// Global app context
const AppContext = createContext<AppContextType>({
  user: null,
  theme: "light",
  notifications: [],
  setUser: (user) => {},
  setTheme: (theme) => {},
  addNotification: (notification) => {},
});

// Auth context
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: () => {},
  register: async () => {},
});
```

### Local State Management

- **useState**: Component-level state
- **useReducer**: Complex state transitions
- **useContext**: Global state sharing
- **Custom Hooks**: Encapsulated stateful logic

## Styling & Theming

### CSS Architecture (Web)

```css
/* CSS custom properties for theming */
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --background-color: #ffffff;
  --text-color: #212529;
  --border-radius: 8px;
  --spacing-unit: 8px;
}

/* Component-specific styles */
.button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: calc(var(--spacing-unit) * 2);
}

.button:hover {
  opacity: 0.9;
}
```

### StyleSheet Architecture (Mobile)

```typescript
// Theme configuration
export const theme = {
  colors: {
    primary: "#007bff",
    secondary: "#6c757d",
    background: "#ffffff",
    text: "#212529",
    error: "#dc3545",
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
  },
};

// Component styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.medium,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.medium,
    paddingHorizontal: theme.spacing.large,
    borderRadius: theme.borderRadius.medium,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
```

## Performance Optimization

### Web Performance

- **Code Splitting**: Route-based and component-based splitting
- **Lazy Loading**: Images and components loaded on demand
- **Caching**: Service worker for offline functionality
- **Optimization**: Image optimization and minification
- **Bundle Analysis**: Webpack bundle analyzer for optimization

### Mobile Performance

- **Image Optimization**: Automatic image compression and resizing
- **List Virtualization**: FlatList with optimized rendering
- **Memory Management**: Proper cleanup of subscriptions and timers
- **Native Modules**: Optimized native code for performance-critical features

## Testing Strategy

### Web Testing

- **Unit Tests**: Jest with React Testing Library
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Cypress for end-to-end user journeys
- **Visual Regression**: Chromatic for visual component testing

### Mobile Testing

- **Unit Tests**: Jest with React Native Testing Library
- **Integration Tests**: Detox for end-to-end testing
- **Device Testing**: Expo Go and physical device testing
- **Screenshot Testing**: Automated screenshot comparison

## Deployment & DevOps

### Web Deployment

```yaml
# GitHub Actions workflow
name: Deploy Web App
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --dir=dist --prod
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

### Mobile Deployment

```json
// EAS Build configuration
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "channel": "production"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id",
        "ascAppId": "your-app-store-connect-app-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account-key.json",
        "track": "internal"
      }
    }
  }
}
```

## Environment Management

### Environment Variables

```bash
# Web environment variables
REACT_APP_API_URL=https://api.sav3.com
REACT_APP_ENVIRONMENT=production
REACT_APP_SENTRY_DSN=https://...

# Mobile environment variables
APP_URL=https://api.sav3.com
FRONTEND_URL=https://app.sav3.com
SENTRY_DSN=https://...
```

### Configuration Loading

```typescript
// Environment configuration
export const config = {
  apiUrl: process.env.REACT_APP_API_URL || "http://localhost:3000",
  environment: process.env.REACT_APP_ENVIRONMENT || "development",
  sentryDsn: process.env.REACT_APP_SENTRY_DSN,
  features: {
    enableNotifications: process.env.REACT_APP_ENABLE_NOTIFICATIONS === "true",
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === "true",
  },
};
```

## Conclusion

The SAV3 frontend ecosystem provides a comprehensive, modern user experience across web and mobile platforms. With robust architecture, comprehensive feature coverage, and production-ready deployment configurations, the frontend applications are well-prepared for scalable, high-performance delivery.

The combination of React for web and React Native for mobile, along with modern development practices and comprehensive testing strategies, ensures a maintainable and extensible codebase that can grow with the platform's needs.

---

_Last Updated: $(date)_
_Document Version: 2.0_
