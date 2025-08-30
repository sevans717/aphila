# Codebase Index

This document summarizes the current backend routes, frontend usage, and database schema to provide a single, consistent view across tiers.

## Backend API Surface

Base path: `/api/v1`

Sources: `src/routes/*.ts`

- analytics: POST `/analytics/event`, `/analytics/session/start`, `/analytics/session/end`, `/analytics/swipe`, `/analytics/feature`; GET `/analytics/metrics/users`, `/analytics/metrics/engagement`, `/analytics/metrics/platforms`, `/analytics/funnel`
- auth: POST `/auth/register`, `/auth/login`, `/auth/refresh`; GET `/auth/me`
- batch: POST `/batch/operations`, `/batch/sync`, `/batch/fetch`; GET `/batch/health`
- bookmarks: POST `/bookmarks/collections`, `/bookmarks/posts/:postId/toggle`, `/bookmarks/media/:mediaId/toggle`; GET `/bookmarks/collections`, `/bookmarks/stats`
- categories: GET `/categories/`, `/categories/:slug`; POST `/categories/:categoryId/join`; DELETE `/categories/:categoryId/leave`; GET `/categories/user/me`
- communities: GET `/communities/`, `/communities/:id`; POST `/communities/`, `/communities/:id/join`, `/communities/:id/messages`; DELETE `/communities/:id/leave`
- config: GET `/config/features`, `/config/version`, `/config/status`, `/config/maintenance`
- discovery: GET `/discovery/discover`, `/discovery/matches`, `/discovery/likes`; POST `/discovery/swipe`; GET `/discovery/communities`
- geospatial: POST `/geospatial/location`, `/geospatial/update-and-discover`; GET `/geospatial/location`, `/geospatial/nearby`, `/geospatial/discovery`, `/geospatial/in-range/:userId`
- media: POST `/media/chunked/start`, `/media/chunked/upload`, `/media/chunked/complete`, `/media/upload`, `/media/upload-multiple`; GET `/media/`, `/media/:mediaId`, `/media/chunked/progress/:sessionId`; DELETE `/media/:mediaId`, `/media/chunked/:sessionId`; PUT `/media/:mediaId/favorite`
- messaging: POST `/messaging/send`, `/messaging/message/:messageId/report`; GET `/messaging/match/:matchId`, `/messaging/unread-count`, `/messaging/match/:matchId/details`; PUT `/messaging/match/:matchId/read`; DELETE `/messaging/message/:messageId`
- mobile: POST `/mobile/device/register`, `/mobile/media/upload`, `/mobile/app/feedback`; DELETE `/mobile/device/unregister`, `/mobile/media/:mediaId`; GET `/mobile/notifications/preferences`, `/mobile/media`, `/mobile/media/:mediaId`, `/mobile/app/config`; PUT `/mobile/notifications/preferences`, `/mobile/media/:mediaId`
- moderation: POST `/moderation/report`; GET `/moderation/reports`, `/moderation/user/:userId/history`, `/moderation/user/:userId/suspended`; PUT `/moderation/reports/:reportId`
- notifications: POST `/notifications/register-device`, `/notifications/unregister-device`, `/notifications/test`, `/notifications/subscribe/:topic`, `/notifications/unsubscribe/:topic`, `/notifications/mark-read`, `/notifications/mark-all-read`; GET `/notifications/`, `/notifications/settings`; PUT `/notifications/settings`
- posts: GET `/posts/:postId`, `/posts/feed`; POST `/posts/`; PATCH `/posts/:postId`; DELETE `/posts/:postId`
- realtime: POST `/realtime/send-message`, `/realtime/broadcast`, `/realtime/presence`; GET `/realtime/presence/:userId`, `/realtime/queued-messages`, `/realtime/status`; DELETE `/realtime/queued-messages`
- search: GET `/search/`, `/search/posts`, `/search/users`, `/search/history`; DELETE `/search/history`
- sharing: POST `/sharing/post`, `/sharing/media`; GET `/sharing/my-shares`; DELETE `/sharing/:shareId`
- social: POST `/social/posts/:postId/comments`, `/social/posts/:postId/likes/toggle`, `/social/comments/:commentId/likes/toggle`; GET `/social/posts/:postId/comments`, `/social/comments/:commentId/replies`
- stories: POST `/stories/`, `/stories/:storyId/view`, `/stories/:storyId/reply`, `/stories/:storyId/highlight`, `/stories/cleanup/expired`; GET `/stories/:storyId`, `/stories/feed/latest`, `/stories/user/:userId`, `/stories/user/:userId/active`, `/stories/:storyId/viewers`, `/stories/:storyId/analytics`, `/stories/analytics/overview`, `/stories/discover/trending`, `/stories/discover/nearby`, `/stories/stats/global`; PUT `/stories/:storyId`; DELETE `/stories/:storyId`
- subscription: GET `/subscription/plans`, `/subscription/current`, `/subscription/usage`; POST `/subscription/subscribe`, `/subscription/cancel`, `/subscription/boost`
- user: PATCH `/user/`
- root: GET `/health`, `/me`

Auth middleware is applied to most non-public endpoints. Validation middleware is present on several routes.

Source for generated index: `tmp/route_service_issues.resolved.json`.

## Frontend Usage

<!-- ARCHIVED: Netlify functions proxy to backend (moved to archive/netlify):
  - `netlify/functions/auth-login.js` → `POST /api/v1/auth/login`
  - `netlify/functions/me.js` → `GET /api/v1/me`
  - `netlify/functions/posts-feed.js` → `GET /api/v1/posts/feed`
  - `netlify/functions/media-list.js` → `GET /api/v1/media`
- Netlify redirects: `/api/*` → `http://localhost:4000/api/v1/:splat`
-->

Direct API calls to backend services.

## Database Schema (Prisma)

Key models: `User`, `Profile`, `Photo`, `Interest`, `Like`, `Match`, `Message`, `Report`, `Block`, `Subscription`, `Verification`, `AdminAction`, `Notification`, `Device`, `Category`, `CategoryMembership`, `Community`, `CommunityMembership`, `CommunityMessage`, `Friendship`, `Boost`, `MediaAsset`, `UserSetting`, `PrivacySetting`, `FilterSetting`, `Post`, `PostMedia`, `PostLike`, `PostComment`, `CommentLike`, `PostBookmark`, `Collection`, `MediaBookmark`, `PostShare`, `MediaShare`, `Story`, `StoryView`, `ContentTag`, `PostTag`, `MediaTag`, `PostReport`, `ContentView`, `SearchQuery`.

Enums: `Gender`, `MatchStatus`, `Orientation`, `SubscriptionType`, `VerificationType`, `VerificationStatus`, `AdminActionType`, `CategoryType`, `CommunityVisibility`, `MembershipRole`, `FriendshipStatus`, `BoostType`, `BoostStatus`, `MediaType`, `PostType`, `PostVisibility`, `LikeType`, `ShareType`.

Datasource: PostgreSQL. Client: Prisma.
