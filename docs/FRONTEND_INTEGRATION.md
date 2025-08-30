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
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const api = axios.create({
  baseURL: "http://10.0.2.2:3000/api", // Android emulator: use 10.0.2.2 for localhost
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
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
import AsyncStorage from "@react-native-async-storage/async-storage";

// On login success:
await AsyncStorage.setItem("token", response.data.token);
```

### 3.2. Authenticated Requests

- The API client above will automatically attach the token from `AsyncStorage`.

### 3.3. Token Refresh & Rotation (recommended)

To keep mobile sessions stable and secure, the backend issues both an access `token` and a `refreshToken` on login/register. The `Sav3ApiClient` supports an `onTokenExpired` callback that you can use to transparently refresh tokens when the access token expires.

Example wiring using `AsyncStorage` and the `Sav3ApiClient`:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Sav3ApiClient } from "../../sav3-backend/src/client/sav3-api-client";

const api = new Sav3ApiClient({
  baseURL: "http://192.168.1.100:4000",
  onTokenExpired: async () => {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    try {
      const res = await fetch(
        `${api.getAxiosInstance().defaults.baseURL}/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        }
      );
      if (!res.ok) return null;
      const body = await res.json();
      // Persist new tokens
      await AsyncStorage.setItem("token", body.token);
      if (body.refreshToken)
        await AsyncStorage.setItem("refreshToken", body.refreshToken);
      return body.token as string;
    } catch (err) {
      return null;
    }
  },
});

// After login/register, store both tokens:
// await AsyncStorage.setItem('token', loginRes.token);
// await AsyncStorage.setItem('refreshToken', loginRes.refreshToken);
```

Notes:

- The `onTokenExpired` function should return the new access token (string) or `null` if refresh failed.
- Rotate refresh tokens on the server to reduce replay risk; the backend will return a new `refreshToken` on `/auth/refresh`.
- Keep `refreshToken` secure (use secure/device storage) and allow users to revoke sessions server-side.

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
import { api } from "./client";

export const fetchPosts = () => api.get("/posts");
export const createPost = (data) => api.post("/posts", data);
// ...other methods
```

### Media: Direct-to-S3 (Presigned URL) Example

Frontend flow:

- Call `POST /api/v1/media/presign` with `filename` and `contentType` to receive a presigned URL.
- If `method === 'PUT'`, upload directly to the returned `uploadUrl` with `PUT` and the provided `Content-Type` header.
- If `method === 'SERVER'`, fall back to the server `/media/upload` endpoint (multipart form upload).

Example (React Native using `Sav3ApiClient`):

```typescript
// pick a file using expo-image-picker or similar
const file = /* Blob or File */;
const filename = 'profile.jpg';
const contentType = 'image/jpeg';

const presign = await apiClient.presignUpload(filename, contentType);
if (presign.method === 'PUT') {
  // Upload directly to S3
  await apiClient.uploadToPresignedUrl(presign.uploadUrl, file, presign.headers, (p) => {
    console.log('upload progress', p);
  });
  // Optionally inform backend about the new media key if needed
} else {
  // Server fallback - send multipart/form-data to /media/upload
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.getAxiosInstance().post('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
```

Notes:

- For large files prefer chunked upload endpoints in `/media/chunked/*`.
- Ensure CORS on your S3 bucket allows PUT from your app origin or use credentialed uploads through a proxy in production.

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
import { io } from "socket.io-client";
const socket = io("http://10.0.2.2:3000"); // Android emulator
```

> On a real device, use your computer's LAN IP.

## Haptics / Vibration Integration (Socket.IO)

The backend may emit `haptic` events over Socket.IO to signal short device vibrations or haptic feedback for important UX moments (for example: chat iteration completion, delivery confirmation, or actions requiring human confirmation).

- **Event name**: `haptic`
- **Direction**: server -> client (targeted to a single user's connected socket)
- **Payload (recommended)**:

```json
{
  "type": "selection|success|warning|error|custom",
  "duration": 40, // optional ms for simple vibrate fallback
  "pattern": [30, 50, 30], // optional vibration pattern (web/Android fallback)
  "source": "chat|notification|system",
  "meta": { "reason": "iteration_complete", "id": "abc123" }
}
```

Client behavior (recommended):

- **React Native (Expo / `expo-haptics`)**: prefer high-level APIs. Examples:

```typescript
import * as Haptics from "expo-haptics";

socket.on("haptic", (p) => {
  if (!p || !p.type) return;
  switch (p.type) {
    case "selection":
      Haptics.selectionAsync();
      break;
    case "success":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case "warning":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case "error":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case "custom":
      // Expo Haptics does not support arbitrary vibration patterns.
      // fallback to Vibration API on native if available.
      // import { Vibration } from 'react-native'
      break;
  }
});
```

- **Web / PWA fallback**: use the Vibration API where supported.

```javascript
socket.on("haptic", (p) => {
  if (!navigator.vibrate) return;
  if (p && Array.isArray(p.pattern)) navigator.vibrate(p.pattern);
  else navigator.vibrate(p.duration || 40);
});
```

Best practices and safety:

- **Throttle & rate-limit**: the server must enforce rate limits for `haptic` emits to avoid abuse and battery drain.
- **User opt-out**: expose a user setting (notifications/haptics) and respect it on the client and server.
- **Respect device settings**: do not force vibrations if the OS or user has disabled them.
- **Short & meaningful**: use concise patterns (<= 200ms total) and reserve for important events.
- **Acknowledge when needed**: optional client ack (`socket.emit('haptic:ack', { id, meta })`) to help server avoid retries.
- **Security**: authenticate socket connections and validate payloads server-side before emitting.

Server notes:

- Emit only to the authenticated user's sockets (use socket rooms or user-id mapping).
- Validate payload shape and enforce allowed `type` values.
- Use existing rate-limiting and anti-spam middleware for haptic events.

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
