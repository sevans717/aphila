# Database Schema Notes & Constraints

## Foreign Key Cascade Policies

### User Relations

- **UserProfile → User**: `ON DELETE CASCADE` - Profile deleted when user deleted
- **UserSettings → User**: `ON DELETE CASCADE` - Settings deleted when user deleted
- **UserLocation → User**: `ON DELETE CASCADE` - Location deleted when user deleted
- **UserVerification → User**: `ON DELETE CASCADE` - Verification records deleted when user deleted
- **UserSubscription → User**: `ON DELETE CASCADE` - Subscriptions deleted when user deleted

### Content Relations

- **Post → User**: `ON DELETE CASCADE` - Posts deleted when user deleted
- **PostMedia → Post**: `ON DELETE CASCADE` - Media deleted when post deleted
- **PostLike → Post**: `ON DELETE CASCADE` - Likes deleted when post deleted
- **PostLike → User**: `ON DELETE CASCADE` - Likes deleted when user deleted
- **PostComment → Post**: `ON DELETE CASCADE` - Comments deleted when post deleted
- **PostComment → User**: `ON DELETE CASCADE` - Comments deleted when user deleted

### Messaging Relations

- **Message → User**: `ON DELETE CASCADE` - Messages deleted when user deleted
- **Message → Conversation**: `ON DELETE CASCADE` - Messages deleted when conversation deleted
- **ConversationParticipant → User**: `ON DELETE CASCADE` - Participants removed when user deleted
- **ConversationParticipant → Conversation**: `ON DELETE CASCADE` - Participants removed when conversation deleted

### Social Relations

- **Friendship → User**: `ON DELETE CASCADE` - Friendships deleted when either user deleted
- **Match → User**: `ON DELETE CASCADE` - Matches deleted when either user deleted
- **UserBlock → User**: `ON DELETE CASCADE` - Blocks deleted when either user deleted

## Database-Level Constraints

### Data Integrity Constraints

- **User age range**: Age must be between 13 and 100 years
- **Email format**: Email must match valid email regex pattern
- **Display name length**: Display name 1-50 characters
- **Post content validation**: Either title or body must have content
- **Message content validation**: Either content or media_url must be present
- **Media file size**: File size must be positive and ≤ 100MB
- **Subscription dates**: `expires_at` must be after `created_at`
- **Geospatial bounds**: Latitude [-90, 90], Longitude [-180, 180]

### Business Logic Constraints

- **Self-friendship prevention**: Users cannot friend themselves
- **Self-matching prevention**: Users cannot match with themselves
- **Unique active subscription**: Only one active subscription per user
- **Unique friendship pairs**: Prevents duplicate friendships between same users

### Performance Constraints

- **Partial indexes**: Optimized indexes for active/verified users only
- **Composite indexes**: Multi-column indexes for common query patterns
- **GIN indexes**: Full-text search on posts and user profiles
- **GIST indexes**: Geospatial indexing for location-based queries

## Audit System

### Audit Triggers

- **Enabled for tables**: User, Post, Message, Friendship, UserSubscription
- **Operations tracked**: INSERT, UPDATE, DELETE
- **Data captured**: Old values, new values, user context, timestamps
- **Metadata**: IP address, user agent, session ID (set by application)

### Application Context

To enable audit tracking, application must set these context variables:

```sql
-- Set before operations
SELECT set_config('myapp.current_user_id', 'user123', true);
SELECT set_config('myapp.client_ip', '192.168.1.1', true);
```

## Materialized Views

### mv_user_engagement_metrics

- **Purpose**: User activity and engagement statistics
- **Refresh**: Should be refreshed daily
- **Indexes**: Unique index on user_id

### mv_popular_content

- **Purpose**: High-engagement posts and trending content
- **Refresh**: Should be refreshed hourly during peak hours
- **Indexes**: Engagement score (DESC), creation date (DESC)

### mv_daily_activity_metrics

- **Purpose**: Daily platform activity statistics
- **Refresh**: Should be refreshed daily after midnight
- **Indexes**: Unique index on activity_date

### mv_community_engagement

- **Purpose**: Community growth and engagement metrics
- **Refresh**: Should be refreshed daily
- **Indexes**: Unique index on community_id

### Refresh Schedule

```sql
-- Refresh all materialized views
SELECT refresh_analytics_views();

-- Or refresh individually
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_engagement_metrics;
```

## Index Strategy

### Primary Indexes

- **Location-based queries**: GIST indexes on geospatial data
- **Full-text search**: GIN indexes on searchable text fields
- **Temporal queries**: B-tree indexes on timestamp fields with DESC ordering
- **Status filtering**: Partial indexes for active/verified records only

### Composite Indexes

- **User activity**: `(user_id, created_at DESC)` for user timeline queries
- **Content discovery**: `(visibility, created_at DESC)` for public content
- **Engagement tracking**: `(user_id, is_read, created_at DESC)` for notifications

## Backup and Retention

### Database Backups

- **Format**: PostgreSQL custom format (compressed)
- **Frequency**: Daily automated backups
- **Retention**: 30 days for regular backups, 1 year for monthly snapshots
- **Storage**: Local backups with optional cloud sync

### Audit Log Retention

- **High-value tables**: 2 years retention (User, UserSubscription)
- **Content tables**: 1 year retention (Post, Message)
- **Activity tables**: 6 months retention (PostLike, PostComment)
- **Cleanup**: Automated monthly cleanup of old audit records

## Security Considerations

### Row Level Security (RLS)

- **User data**: Users can only access their own profile data
- **Private content**: Posts respect visibility settings
- **Community access**: Community content restricted to members
- **Admin access**: Special policies for administrative operations

### Data Encryption

- **At rest**: Database-level encryption for sensitive fields
- **In transit**: TLS for all database connections
- **Application level**: Sensitive fields encrypted before storage

## Migration Guidelines

### Zero-Downtime Migrations

- **Index creation**: Always use `CONCURRENTLY` for production
- **Column additions**: Add columns as nullable first, then populate
- **Constraint additions**: Add as `NOT VALID` first, then validate
- **Large table changes**: Consider partitioning or batched updates

### Testing Migrations

- **Staging environment**: Always test migrations on production-like data
- **Performance impact**: Measure migration time and lock duration
- **Rollback plan**: Every migration should have a rollback script
- **Data validation**: Verify data integrity after migration

---

_This document should be updated whenever schema changes are made.
Last updated: August 2025_
