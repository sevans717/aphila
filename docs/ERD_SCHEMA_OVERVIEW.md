# Database Schema Overview & ERD

## Core Entities and Relationships

### User Management

```text
User (Core Profile)
├── UserProfile (Extended profile data)
├── UserSettings (Privacy, notifications)
├── UserVerification (Email, phone, selfie verification)
├── UserLocation (Geospatial data)
├── UserInterest (Many-to-many with interests)
├── UserSubscription (Premium features)
└── UserDevice (Push notification tokens)
```

### Content & Media

```text
Post (User-generated content)
├── PostMedia (Images, videos attached to posts)
├── PostLike (User reactions to posts)
├── PostComment (Comments on posts)
├── PostShare (Sharing activity)
└── PostBookmark (User bookmarks)

Story (Ephemeral content)
├── StoryView (Who viewed stories)
└── StoryMedia (Story attachments)

Media (Centralized media storage)
├── MediaTag (Content tagging)
└── MediaMetadata (EXIF, dimensions, etc.)
```

### Social Features

```text
Friendship
├── FriendRequest (Pending connections)
└── UserBlock (Blocked users)

Match (Dating/connection system)
├── MatchPreference (User preferences)
├── MatchActivity (Match interactions)
└── SwipeHistory (Swipe tracking)
```

### Messaging

```text
Conversation (Chat containers)
├── Message (Individual messages)
├── MessageMedia (Message attachments)
├── MessageReaction (Message reactions)
└── ConversationParticipant (Multi-user chats)
```

### Community & Discovery

```text
Community (Groups/communities)
├── CommunityMember (Membership)
├── CommunityPost (Community-specific content)
├── CommunityRole (Admin, moderator roles)
└── CommunitySettings (Community configuration)

Category (Content categorization)
├── PostCategory (Post classifications)
└── CommunityCategory (Community types)
```

### Analytics & Engagement

```text
Analytics (Usage tracking)
├── UserActivity (User behavior)
├── PostAnalytics (Content performance)
└── EngagementMetrics (Platform metrics)

Notification
├── NotificationSetting (User preferences)
└── NotificationHistory (Delivery tracking)
```

## Key Enums

- `Gender`: MALE, FEMALE, OTHER
- `MatchStatus`: ACTIVE, UNMATCHED, BLOCKED
- `Orientation`: STRAIGHT, GAY, BISEXUAL, OTHER
- `SubscriptionType`: FREE, PREMIUM, PLUS
- `VerificationType`: EMAIL, PHONE, SELFIE
- `VerificationStatus`: PENDING, VERIFIED, REJECTED

## Important Relationships

- Users can have multiple posts, stories, and media
- Friendships are bidirectional (handled via application logic)
- Matches have preferences and activity tracking
- Conversations support both direct messages and group chats
- Communities have hierarchical roles and permissions
- All major entities support soft deletion via timestamps
- Geospatial data is stored for location-based matching

## Performance Considerations

- Indexes needed on user location data (geospatial)
- Full-text search indexes on post content
- Composite indexes on frequently queried combinations
- Partitioning considered for high-volume tables (messages, analytics)

---

_This overview is maintained alongside the Prisma schema.
See `prisma/schema.prisma` for complete model definitions._
