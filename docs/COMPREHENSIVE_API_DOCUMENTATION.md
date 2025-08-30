# SAV3 Backend API Documentation

<!-- markdownlint-disable MD013 -->

## Overview

The SAV3 Backend provides a comprehensive REST API for a dating application with real-time messaging capabilities. The API supports user authentication, profile management, discovery, matching, messaging, media uploads, and various social features.

**Base URL:** `http://localhost:4000` (development)
Production URL (production)
**Version:** v1
**Authentication:** JWT Bearer tokens required for protected endpoints

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Register User

```http
POST /auth/register
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

### Login User

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

### Get Current User

```http
GET /auth/me
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "profile": {
        "displayName": "John Doe",
        "bio": "Software developer",
        "location": "New York, NY",
        "latitude": 40.7128,
        "longitude": -74.006
      }
    }
  }
}
```

### Refresh Token

```http
POST /auth/refresh
```

**Request Body:**

```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

## Discovery & Matching

### Get Discovery Feed

```http
GET /discovery/discover
```

**Query Parameters:**

- `latitude` (number, optional): User's latitude for location-based discovery
- `longitude` (number, optional): User's longitude for location-based discovery
- `maxDistance` (number, optional): Maximum distance in kilometers
- `minAge` (number, optional): Minimum age filter
- `maxAge` (number, optional): Maximum age filter
- `orientation` (string, optional): Orientation filter
- `interests` (string, optional): Comma-separated interests
- `limit` (number, optional): Number of results to return (default: 20)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "user_id",
      "displayName": "Jane Smith",
      "age": 28,
      "bio": "Love hiking and photography",
      "orientation": "straight",
      "location": {
        "latitude": 40.7589,
        "longitude": -73.9851,
        "city": "New York",
        "country": "USA"
      },
      "photos": [
        {
          "id": "photo_id",
          "url": "https://example.com/photo.jpg",
          "isPrimary": true
        }
      ],
      "interests": ["hiking", "photography", "travel"],
      "compatibilityScore": 85,
      "isVerified": true,
      "distance": 5
    }
  ],
  "pagination": {
    "limit": 20,
    "hasMore": true
  }
}
```

### Swipe Action

```http
POST /discovery/swipe
```

**Request Body:**

```json
{
  "swipedId": "target_user_id",
  "isLike": true,
  "isSuper": false
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "match": {
      "id": "match_id",
      "status": "matched",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "isMatch": true
  }
}
```

### Get User Matches

```http
GET /discovery/matches
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "match_id",
      "user": {
        "id": "other_user_id",
        "displayName": "Jane Smith",
        "bio": "Love hiking",
        "photo": "https://example.com/photo.jpg"
      },
      "lastMessage": {
        "content": "Hey! How are you?",
        "sentAt": "2024-01-01T00:00:00.000Z",
        "isFromMe": false
      },
      "matchedAt": "2024-01-01T00:00:00.000Z",
      "status": "active"
    }
  ]
}
```

### Get Received Likes

```http
GET /discovery/likes
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "like_id",
      "user": {
        "id": "liker_user_id",
        "displayName": "John Doe",
        "bio": "Software developer",
        "photo": "https://example.com/photo.jpg"
      },
      "isSuper": false,
      "likedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Messaging

### Send Message

```http
POST /messaging/send
```

**Request Body:**

```json
{
  "receiverId": "recipient_user_id",
  "content": "Hello! How are you?",
  "messageType": "text"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "message_id",
    "senderId": "sender_user_id",
    "receiverId": "recipient_user_id",
    "content": "Hello! How are you?",
    "messageType": "text",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "sender": {
      "id": "sender_user_id",
      "displayName": "John Doe"
    }
  }
}
```

### Get Match Messages

```http
GET /messaging/match/:matchId
```

**Query Parameters:**

- `limit` (number, optional): Number of messages to return (default: 50)
- `before` (string, optional): Get messages before this message ID

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "message_id",
      "senderId": "sender_user_id",
      "receiverId": "recipient_user_id",
      "content": "Hello! How are you?",
      "messageType": "text",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "readAt": null,
      "isDeleted": false,
      "sender": {
        "id": "sender_user_id",
        "displayName": "John Doe"
      }
    }
  ],
  "pagination": {
    "hasMore": true
  }
}
```

### Mark Messages as Read

```http
PUT /messaging/match/:matchId/read
```

**Response (200):**

```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

### Get Unread Count

```http
GET /messaging/unread-count
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

### Delete Message

```http
DELETE /messaging/message/:messageId
```

**Response (200):**

```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

### Get Match Details

```http
GET /messaging/match/:matchId/details
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "match_id",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "otherUser": {
      "id": "other_user_id",
      "displayName": "Jane Smith",
      "bio": "Love hiking",
      "photo": "https://example.com/photo.jpg"
    },
    "messages": [
      {
        "id": "message_id",
        "senderId": "sender_user_id",
        "receiverId": "recipient_user_id",
        "content": "Hello!",
        "messageType": "text",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "readAt": "2024-01-01T00:05:00.000Z",
        "isDeleted": false,
        "sender": {
          "id": "sender_user_id",
          "displayName": "John Doe"
        }
      }
    ]
  }
}
```

### Report Message

```http
POST /messaging/message/:messageId/report
```

**Request Body:**

```json
{
  "reason": "Inappropriate content"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Message reported successfully"
}
```

## User Profile Management

### Update User Profile

```http
PATCH /user
```

**Request Body:**

```json
{
  "displayName": "John Doe",
  "bio": "Software developer who loves hiking",
  "location": "New York, NY",
  "latitude": 40.7128,
  "longitude": -74.006
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "displayName": "John Doe",
    "bio": "Software developer who loves hiking",
    "location": "New York, NY",
    "latitude": 40.7128,
    "longitude": -74.006,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Media Management

### Upload Media File

```http
POST /media/upload
```

**Content-Type:** `multipart/form-data`

**Form Data:**

- `file`: The media file (image/video)
- `type`: "profile" | "community" | "message" (optional, default: "profile")
- `description`: Description of the media (optional)

**Response (201):**

```json
{
  "id": "media_id",
  "url": "https://example.com/uploads/media_id.jpg",
  "type": "IMAGE",
  "width": 1920,
  "height": 1080,
  "duration": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Upload Multiple Files

```http
POST /media/upload-multiple
```

**Content-Type:** `multipart/form-data`

**Form Data:**

- `files`: Multiple media files (up to 10)
- `type`: "profile" | "community" | "message" (optional)

**Response (201):**

```json
{
  "files": [
    {
      "id": "media_id_1",
      "url": "https://example.com/uploads/media_id_1.jpg",
      "type": "IMAGE",
      "width": 1920,
      "height": 1080,
      "duration": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "media_id_2",
      "url": "https://example.com/uploads/media_id_2.jpg",
      "type": "IMAGE",
      "width": 800,
      "height": 600,
      "duration": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Generate Presigned Upload URL

```http
POST /media/presign
```

**Request Body:**

```json
{
  "filename": "my-photo.jpg",
  "contentType": "image/jpeg",
  "expiresIn": 3600
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "key": "uploads/user_id/my-photo.jpg",
    "bucket": "sav3-media",
    "expiresIn": 3600
  }
}
```

### Start Chunked Upload

```http
POST /media/chunked/start
```

**Request Body:**

```json
{
  "filename": "large-video.mp4",
  "totalSize": 104857600,
  "chunkSize": 1048576,
  "uploadType": "video"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "sessionId": "session_uuid",
    "filename": "large-video.mp4",
    "totalSize": 104857600,
    "chunkSize": 1048576,
    "uploadType": "video"
  }
}
```

### Upload Chunk

```http
POST /media/chunked/upload
```

**Content-Type:** `multipart/form-data`

**Form Data:**

- `chunk`: The chunk data
- `sessionId`: The upload session ID
- `chunkIndex`: The chunk index (starting from 0)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "sessionId": "session_uuid",
    "chunkIndex": 0,
    "progress": 0.01,
    "uploadedBytes": 1048576,
    "totalBytes": 104857600
  }
}
```

### Complete Chunked Upload

```http
POST /media/chunked/complete
```

**Request Body:**

```json
{
  "sessionId": "session_uuid",
  "uploadType": "video"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "media_id",
    "url": "https://example.com/uploads/media_id.mp4",
    "type": "VIDEO",
    "width": 1920,
    "height": 1080,
    "duration": 300,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Upload Progress

```http
GET /media/chunked/progress/:sessionId
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "sessionId": "session_uuid",
    "progress": 0.5,
    "uploadedBytes": 52428800,
    "totalBytes": 104857600,
    "chunksUploaded": 50,
    "totalChunks": 100
  }
}
```

### Cancel Upload Session

```http
DELETE /media/chunked/:sessionId
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "cancelled": true,
    "sessionId": "session_uuid"
  }
}
```

### Get User's Media Assets

```http
GET /media
```

**Query Parameters:**

- `type`: "image" | "video" | "other" (optional)
- `limit`: Number of results (optional, default: 20)
- `offset`: Pagination offset (optional, default: 0)

**Response (200):**

```json
{
  "media": [
    {
      "id": "media_id",
      "url": "https://example.com/uploads/media_id.jpg",
      "type": "IMAGE",
      "width": 1920,
      "height": 1080,
      "duration": null,
      "isFavorite": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Specific Media Asset

```http
GET /media/:mediaId
```

**Response (200):**

```json
{
  "id": "media_id",
  "url": "https://example.com/uploads/media_id.jpg",
  "type": "IMAGE",
  "width": 1920,
  "height": 1080,
  "duration": null,
  "isFavorite": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Delete Media Asset

```http
DELETE /media/:mediaId
```

**Response (200):**

```json
{
  "success": true,
  "message": "Media asset deleted successfully"
}
```

### Mark Media as Favorite

```http
PUT /media/:mediaId/favorite
```

**Request Body:**

```json
{
  "isFavorite": true
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Media added to favorites"
}
```

## WebSocket Events

The API supports real-time communication via Socket.IO. Connect to the WebSocket endpoint using your JWT token.

### Connection

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:4000", {
  auth: {
    token: "your_jwt_token",
  },
});
```

### Events

#### Join Match Room

```javascript
socket.emit("join_match", { matchId: "match_id" });
```

#### Leave Match Room

```javascript
socket.emit("leave_match", { matchId: "match_id" });
```

#### Send Message (WebSocket)

```javascript
socket.emit("send_message", {
  matchId: "match_id",
  content: "Hello!",
  messageType: "text",
  clientNonce: "unique_nonce",
});
```

#### Message Acknowledgment

```javascript
socket.on("message_ack", (data) => {
  console.log("Message sent:", data);
});
```

#### New Message

```javascript
socket.on("new_message", (message) => {
  console.log("New message:", message);
});
```

#### Message Error

```javascript
socket.on("message_error", (error) => {
  console.log("Message error:", error);
});
```

#### Typing Indicators

```javascript
socket.emit("typing_start", { matchId: "match_id" });
socket.emit("typing_stop", { matchId: "match_id" });
```

#### Mark Messages as Read (WebSocket)

```javascript
socket.emit("mark_read", { matchId: "match_id" });
```

#### Notifications

```javascript
socket.on("notification", (notification) => {
  console.log("Notification:", notification);
});
```

#### New Match

```javascript
socket.on("new_match", (match) => {
  console.log("New match:", match);
});
```

## Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

### Common Error Codes

- `VALIDATION_ERROR`: Invalid request data
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- Default: 100 requests per 15 minutes per IP
- Authenticated endpoints: 1000 requests per 15 minutes per user
- File uploads: 50 uploads per hour per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## File Upload Limits

- Maximum file size: 5MB (configurable via `MAX_FILE_SIZE`)
- Allowed file types: image/jpeg, image/png, image/gif, video/mp4
- Maximum files per upload: 10

## Pagination

Endpoints that return lists support pagination:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## Data Types

### User Object

```typescript
interface User {
  id: string;
  email: string;
  profile?: {
    displayName?: string;
    bio?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    birthdate?: string;
    orientation?: string;
    interests?: string[];
  };
  photos?: Photo[];
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Photo Object

```typescript
interface Photo {
  id: string;
  url: string;
  isPrimary: boolean;
  createdAt: string;
}
```

### Match Object

```typescript
interface Match {
  id: string;
  initiatorId: string;
  receiverId: string;
  status: "pending" | "matched" | "blocked";
  createdAt: string;
  updatedAt: string;
}
```

### Message Object

```typescript
interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  matchId: string;
  content: string;
  messageType: "text" | "image" | "gif" | "emoji";
  readAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Media Asset Object

```typescript
interface MediaAsset {
  id: string;
  userId: string;
  url: string;
  type: "IMAGE" | "VIDEO" | "OTHER";
  width?: number;
  height?: number;
  duration?: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Environment Variables

See `docs/API_ENV_INVENTORY.md` for a complete list of environment variables and their purposes.

## Development

### Health Check

```http
GET /health
```

**Response (200):**

```json
{
  "status": "ok",
  "ts": "2024-01-01T00:00:00.000Z"
}
```

### Getting Authenticated User Info

```http
GET /me
```

**Response (200):**

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "profile": {
      "displayName": "John Doe",
      "bio": "Software developer"
    }
  }
}
```

## SDKs and Client Libraries

The backend is designed to work seamlessly with:

- React Native/Expo mobile apps
- Web applications using fetch/axios
- Socket.IO clients for real-time features

## Support

For API support or questions:

- Check the error messages for specific guidance
- Review the WebSocket events for real-time features
- Ensure proper JWT token handling for authenticated requests
- Verify file upload limits and types before uploading media

---

_Last updated: January 2024_
_API Version: v1_
