# SAV3 Database Capabilities & Functions Brief

## Overview

The SAV3 backend utilizes PostgreSQL with PostGIS extension as the primary database, managed through Prisma ORM. The database schema is comprehensive, supporting a full-featured social media platform with geospatial capabilities, real-time features, and enterprise-grade data management.

## Database Architecture

### Technology Stack

- **Database**: PostgreSQL 16+ with PostGIS 3.4+
- **ORM**: Prisma with type-safe database access
- **Connection Pooling**: PgBouncer for production optimization
- **Migration Management**: Prisma migrations with version control
- **Geospatial**: PostGIS for location-based features
- **Full-text Search**: PostgreSQL tsvector and GIN indexes

### Key Capabilities

#### Geospatial Features

- **PostGIS Integration**: Full geospatial support with GiST indexing
- **Location Queries**: Distance-based user discovery and content filtering
- **Geometry Types**: Point, Polygon, and Geography support with SRID 4326
- **Performance**: Optimized spatial queries with fallback to geolib library
- **Migration Support**: Backward compatibility during PostGIS migration

#### Advanced Data Model

- **48+ Database Models**: Comprehensive social media schema
- **Complex Relationships**: Many-to-many relationships with cascading rules
- **Audit System**: Comprehensive audit logging with history tracking
- **Materialized Views**: Performance optimization for expensive aggregations
- **Full-text Search**: Content indexing and search capabilities

## Schema Overview

### Core Models

#### User Management System

- **User**: Central authentication and profile management
- **Profile**: Extended user information with geospatial location data
- **Photo**: User photo management with primary/secondary classification
- **Interest**: User interests and preferences system
- **Device**: Push notification device registration
- **UserSetting**: User preferences and configuration
- **PrivacySetting**: Privacy controls and visibility settings
- **FilterSetting**: Discovery and matching filter preferences

#### Social Features

- **Post**: Content creation with media support
- **PostMedia**: Media attachment system for posts
- **PostLike**: Social interaction tracking
- **PostComment**: Threaded commenting system
- **CommentLike**: Comment interaction system
- **PostBookmark**: Content bookmarking and collections
- **Collection**: User-defined content organization
- **PostShare**: Content sharing and reposting
- **PostReport**: Content moderation and reporting

#### Real-time Communication

- **Match**: User matching system
- **Message**: Private messaging between matched users
- **Community**: Group communication and content sharing
- **CommunityMessage**: Community-based messaging
- **CommunityMembership**: Community participation management
- **Friendship**: Friend request and relationship management

#### Media Management

- **MediaAsset**: Comprehensive media storage and metadata
- **MediaBookmark**: Media organization and favorites
- **MediaShare**: Media sharing capabilities
- **MediaTag**: Content categorization for media

#### Ephemeral Content

- **Story**: 24-hour temporary content
- **StoryView**: Story consumption tracking
- **ContentView**: General content engagement analytics

#### Subscription & Payments

- **Subscription**: User subscription management
- **Invoice**: Payment processing and reconciliation
- **Charge**: Payment charge tracking
- **ProcessedWebhookEvent**: Stripe webhook idempotency

#### Moderation & Administration

- **Report**: User reporting system
- **Block**: User blocking functionality
- **AdminAction**: Administrative actions and moderation
- **Verification**: User verification system
- **PostReport**: Content reporting and moderation

#### Advanced Features

- **Category**: Content categorization system
- **CategoryMembership**: Category participation
- **Boost**: Content promotion and visibility enhancement
- **ContentTag**: AI-powered content tagging
- **PostTag**: Post categorization
- **SearchQuery**: Search analytics and optimization

#### Analytics & Metrics

- **Notification**: Push notification system
- **ContentView**: Content consumption analytics
- **SearchQuery**: Search behavior analysis

## Database Functions & Capabilities

### Geospatial Capabilities

#### Location-Based Discovery

```sql
-- PostGIS-enabled location queries
SELECT * FROM profiles
WHERE ST_DWithin(
  location_geography,
  ST_MakePoint(:longitude, :latitude)::geography,
  :maxDistance * 1000
);
```

#### Spatial Indexing

- GiST indexes on geography columns for optimal spatial queries
- Distance calculations with proper unit handling (kilometers)
- Location-based filtering and sorting

#### PostGIS Migration Strategy

- Backward compatibility during PostGIS migration
- Dual location storage (string + geography) during transition
- Seamless migration with data preservation

### Full-Text Search Implementation

#### Content Indexing

```sql
-- Full-text search setup
CREATE INDEX CONCURRENTLY idx_posts_content_fts
ON posts USING GIN (to_tsvector('english', content));

CREATE INDEX CONCURRENTLY idx_users_display_name_fts
ON profiles USING GIN (to_tsvector('english', display_name));
```

#### Search Capabilities

- Post content search
- User profile search
- Hashtag and mention indexing
- Relevance ranking and scoring

### Audit & History System

#### Change Tracking

- Automatic `createdAt` and `updatedAt` timestamps
- Audit triggers for critical table changes
- Comprehensive change history for compliance
- Data retention policies

#### Data Integrity

- Foreign key constraints with appropriate cascade rules
- Unique constraints for data consistency
- Check constraints for data validation
- Database-level validation before application logic

### Materialized Views

#### Performance Optimization

```sql
-- User engagement metrics
CREATE MATERIALIZED VIEW user_engagement AS
SELECT
  u.id,
  COUNT(p.id) as post_count,
  COUNT(pl.id) as like_count,
  COUNT(pc.id) as comment_count
FROM users u
LEFT JOIN posts p ON u.id = p.author_id
LEFT JOIN post_likes pl ON u.id = pl.user_id
LEFT JOIN post_comments pc ON u.id = pc.user_id
GROUP BY u.id;

-- Refresh strategy
REFRESH MATERIALIZED VIEW CONCURRENTLY user_engagement;
```

#### Analytics Support

- Real-time metrics without expensive joins
- Scheduled refresh for performance
- Incremental updates for large datasets

### Advanced Indexing Strategy

#### Composite Indexes

```sql
-- Optimized query patterns
CREATE INDEX idx_posts_author_created_at
ON posts (author_id, created_at DESC);

CREATE INDEX idx_messages_match_created_at
ON messages (match_id, created_at ASC);

CREATE INDEX idx_community_messages_community_created_at
ON community_messages (community_id, created_at DESC);
```

#### Partial Indexes

```sql
-- Active content only
CREATE INDEX idx_posts_active
ON posts (created_at DESC)
WHERE is_archived = false;

CREATE INDEX idx_stories_active
ON stories (created_at DESC)
WHERE expires_at > NOW();
```

### Connection Pooling & Performance

#### PgBouncer Configuration

- Connection pooling for high-concurrency scenarios
- Transaction pooling for Prisma optimization
- Connection limits and timeout management
- Health checks and monitoring

#### Query Optimization

- Strategic indexing based on query patterns
- Query plan analysis and optimization
- Connection pooling for reduced latency
- Prepared statements for repeated queries

## Migration & Deployment

### Migration Strategy

- **Prisma Migrations**: Version-controlled schema evolution
- **Zero-downtime**: Migration scripts designed for production
- **Rollback Support**: Migration reversal capabilities
- **Data Preservation**: Careful handling of data during schema changes

### Seed Data Management

```typescript
// Idempotent seed script
const seedData = [
  { name: "Technology", type: "TECH" },
  { name: "Food", type: "FOOD" },
  // ... categories
];

for (const category of seedData) {
  await prisma.category.upsert({
    where: { name: category.name },
    update: {},
    create: category,
  });
}
```

### Backup & Recovery

#### Backup Strategy

- **Automated Backups**: Daily database dumps
- **Incremental Backups**: WAL archiving for point-in-time recovery
- **Offsite Storage**: S3-compatible storage for backup retention
- **Encryption**: Encrypted backups for security

#### Recovery Procedures

- **Point-in-time Recovery**: WAL-based recovery capabilities
- **Failover Support**: Replica promotion for high availability
- **Data Validation**: Post-recovery data integrity checks
- **Testing**: Regular backup restoration testing

## Monitoring & Observability

### Database Metrics

- **Connection Pool Usage**: PgBouncer metrics
- **Query Performance**: Slow query identification
- **Storage Utilization**: Table and index size monitoring
- **Replication Lag**: Replica synchronization monitoring

### Health Checks

- **Database Connectivity**: Connection validation
- **PostGIS Functionality**: Geospatial feature verification
- **Migration Status**: Schema version validation
- **Backup Integrity**: Backup restoration verification

## Security Considerations

### Data Protection

- **Encryption**: Data-at-rest encryption
- **Access Control**: Role-based database access
- **Audit Logging**: Comprehensive audit trails
- **PII Handling**: Sensitive data protection

### Performance Security

- **Query Limits**: Prevent expensive queries
- **Connection Limits**: Prevent connection exhaustion
- **Resource Limits**: Memory and CPU usage controls
- **Monitoring**: Security event monitoring

## Scaling Considerations

### Vertical Scaling

- **Hardware Resources**: CPU, memory, storage optimization
- **Configuration Tuning**: PostgreSQL parameter optimization
- **Index Maintenance**: Regular index maintenance and rebuilding

### Horizontal Scaling

- **Read Replicas**: Read workload distribution
- **Sharding Strategy**: Data partitioning for large datasets
- **Connection Pooling**: Efficient connection management
- **Caching Layer**: Redis integration for performance

## Operational Procedures

### Maintenance Tasks

- **Index Rebuilding**: Regular index maintenance
- **Vacuum Operations**: Table maintenance and cleanup
- **Statistics Updates**: Query planner optimization
- **Backup Verification**: Regular backup integrity checks

### Troubleshooting

- **Query Analysis**: EXPLAIN plan analysis for slow queries
- **Lock Monitoring**: Lock contention identification
- **Connection Issues**: Connection pool monitoring
- **Storage Issues**: Disk space and I/O monitoring

## Conclusion

The SAV3 database architecture provides a robust, scalable foundation for a comprehensive social media platform. With PostGIS integration, advanced indexing strategies, and comprehensive audit capabilities, the database is well-prepared for production deployment and future growth.

The schema design demonstrates enterprise-grade data modeling with proper normalization, referential integrity, and performance optimization. The combination of PostgreSQL's advanced features with Prisma's type-safe ORM provides both developer productivity and operational excellence.

---

_Last Updated: $(date)_
_Document Version: 2.0_
