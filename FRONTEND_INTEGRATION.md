
# React Native Integration Guide: SAV3 Backend

This guide provides a complete, step-by-step process for integrating your **React Native** mobile app with the SAV3 backend. It covers project scaffolding, API wiring, authentication, and end-to-end testing, including PowerShell scripts for Windows.

---

## 📦 1. Project Scaffold (React Native)

### 1.1. Prerequisites

- Node.js, npm, and PowerShell installed
- Android Studio/Xcode for device emulation (or a real device)

### 1.2. Scaffold the React Native Project

```pwsh
# In the parent directory
cd ..
npx react-native init sav3-mobile
cd sav3-mobile
```

### 1.3. Start the Metro Bundler

```pwsh
npx react-native start
```

### 1.4. Run on Android/iOS

```pwsh
# Android
npx react-native run-android
# iOS (Mac only)
npx react-native run-ios
```

---

## 🔗 2. API Client Setup (React Native)

### 2.1. Install HTTP Client

```pwsh
# In your React Native directory
npm install axios
# For secure storage (recommended for tokens)
npm install @react-native-async-storage/async-storage
```

### 2.2. Create API Client

- Create a file (e.g., `src/api/client.ts`) with base URL pointing to your backend:

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const api = axios.create({
  baseURL: 'http://10.0.2.2:3000/api', // Android emulator: use 10.0.2.2 for localhost
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

> **Note:** On a real device, use your computer's LAN IP for `baseURL` (e.g., `http://192.168.1.100:3000/api`).

---

## 🛠️ 3. Authentication Wiring (React Native)

### 3.1. User Registration & Login

- Use `/api/auth/register` and `/api/auth/login` endpoints.
- Store JWT securely using `AsyncStorage`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// On login success:
await AsyncStorage.setItem('token', response.data.token);
```

### 3.2. Authenticated Requests

- The API client above will automatically attach the token from `AsyncStorage`.

---

## 🗂️ 4. API Endpoints by Phase (Same as Web)

### **Phase 1: Posts**

- `GET /api/posts` — Fetch feed
- `POST /api/posts` — Create post
- `GET /api/posts/:postId` — View post
- `PATCH /api/posts/:postId` — Edit post
- `DELETE /api/posts/:postId` — Delete post

### **Phase 2: Social Interactions**

- `POST /api/social/posts/:postId/like` — Like/unlike
- `POST /api/social/posts/:postId/comments` — Add comment
- `GET /api/social/posts/:postId/comments` — List comments
- `PATCH /api/social/comments/:commentId` — Edit comment
- `DELETE /api/social/comments/:commentId` — Delete comment

### **Phase 3: Bookmarks**

- `GET /api/bookmarks` — List bookmarks
- `POST /api/bookmarks/toggle` — Toggle bookmark
- `POST /api/bookmarks/collections` — Create collection
- `GET /api/bookmarks/collections` — List collections

### **Phase 4: Sharing**

- `POST /api/sharing/posts` — Share post
- `POST /api/sharing/media` — Share media
- `GET /api/sharing/history` — Share history

### **Phase 5: Stories**

- `GET /api/stories` — List stories
- `POST /api/stories` — Create story
- `POST /api/stories/:storyId/view` — View story
- `GET /api/stories/:storyId` — Story details

### **Phase 6: Notifications**

- `GET /api/notifications` — List notifications
- `POST /api/notifications/mark-read` — Mark as read
- `GET /api/notifications/settings` — Get settings
- `PATCH /api/notifications/settings` — Update settings

### **Phase 7: Search**

- `GET /api/search` — Global search
- `GET /api/search/posts` — Search posts
- `GET /api/search/users` — Search users
- `GET /api/search/history` — Search history

### **Phase 8: Analytics**

- `POST /api/analytics/events` — Track event
- `GET /api/analytics/metrics/users` — User metrics
- `GET /api/analytics/metrics/engagement` — Engagement metrics

---

## 🧩 5. End-to-End Wiring Steps (React Native)

### 5.1. API Service Layer

- Create service files for each feature (e.g., `postService.ts`, `authService.ts`).
- Example:

```typescript
// src/api/postService.ts
import { api } from './client';

export const fetchPosts = () => api.get('/posts');
export const createPost = (data) => api.post('/posts', data);
// ...other methods
```

### 5.2. UI Integration

- Use service methods in your React Native components.
- Use hooks (e.g., `useEffect`, `useState`) to fetch data.
- Handle loading, error, and success states with React Native UI components.

### 5.3. Authentication Flow

- On login/register, store token in `AsyncStorage`.
- On logout, remove token from `AsyncStorage`.
- Use React Context or Redux for global auth state.

### 5.4. Real-Time Features (Optional)

- For stories, notifications, or chat, use WebSocket (Socket.IO) integration.
- Example:

```typescript
import { io } from 'socket.io-client';
const socket = io('http://10.0.2.2:3000'); // Android emulator
```

> On a real device, use your computer's LAN IP.

---

## 🧪 6. End-to-End Testing (React Native)

### 6.1. Manual Testing

- Use Postman or Insomnia to test all endpoints.
- Test on both emulator and real device for network access.

### 6.2. Automated Testing (Optional)

- Use Detox or Appium for React Native E2E tests.
- Example PowerShell script to run Detox (after setup):

```pwsh
npx detox test
```

---

## 🏁 7. Deployment Preparation (React Native)

### 7.1. Build Release APK (Android)

```pwsh
cd android
./gradlew assembleRelease
# APK will be in android/app/build/outputs/apk/release/
```

### 7.2. Build Release (iOS)

```pwsh
# On Mac only
cd ios
npx pod-install
xcodebuild -workspace sav3-mobile.xcworkspace -scheme sav3-mobile -configuration Release
```

### 7.3. Publish to App Store/Play Store

- Follow React Native docs for publishing.

---

## 📋 8. Troubleshooting & Tips (React Native)

- Always run scripts in the correct directory (`cd` as shown above).
- For Android emulator, use `10.0.2.2` as the backend host for localhost.
- For iOS simulator, use `localhost` or your LAN IP.
- For real devices, use your computer's LAN IP and ensure both are on the same network.
- Check CORS settings in backend if you see network errors.
- Use `.env` files for environment-specific configs (with `react-native-dotenv` if needed).
- Keep backend running (`npm start` in `sav3-backend`) during mobile development.
- Use `adb reverse tcp:3000 tcp:3000` to forward ports for Android if needed.

---

## ✅ 100% Complete Integration (React Native)

- All backend phases are fully wired for React Native mobile use.
- End-to-end flow: user registration → login → post → interact → bookmark → share → story → notification → search → analytics.
- Ready for production, QA, and further feature expansion.

---

**For any new feature, repeat the service layer and UI wiring steps above.**
