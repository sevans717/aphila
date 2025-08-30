-- Create materialized views for analytics and reporting
-- Migration: add-analytics-views

-- User engagement metrics view
CREATE MATERIALIZED VIEW mv_user_engagement_metrics AS
SELECT
    u.id as user_id,
    p."displayName" as display_name,
    COUNT(DISTINCT po.id) as total_posts,
    COUNT(DISTINCT pl.id) as total_likes_received,
    COUNT(DISTINCT m.id) as total_messages_sent,
    COUNT(DISTINCT f.id) as total_friends,
    MAX(u."lastLogin") as last_activity,
    u."createdAt" as user_joined_at
FROM "users" u
LEFT JOIN "profiles" p ON u.id = p."userId"
LEFT JOIN "posts" po ON u.id = po."authorId"
LEFT JOIN "post_likes" pl ON po.id = pl."postId"
LEFT JOIN "messages" m ON u.id = m."senderId"
LEFT JOIN "friendships" f ON u.id = f."requesterId" OR u.id = f."addresseeId"
WHERE u."isActive" = true
GROUP BY u.id, p."displayName", u."createdAt";

CREATE UNIQUE INDEX idx_mv_user_engagement_user_id ON mv_user_engagement_metrics (user_id);

-- Popular content view (posts with high engagement)
CREATE MATERIALIZED VIEW mv_popular_content AS
SELECT
    po.id as post_id,
    po."authorId" as user_id,
    p."displayName" as author_name,
    COUNT(DISTINCT pl.id) as like_count,
    po."createdAt" as created_at,
    -- Calculate engagement score
    (COUNT(DISTINCT pl.id) * 1.0) as engagement_score
FROM "posts" po
JOIN "users" u ON po."authorId" = u.id
JOIN "profiles" p ON u.id = p."userId"
LEFT JOIN "post_likes" pl ON po.id = pl."postId"
WHERE po."visibility" = 'PUBLIC'
GROUP BY po.id, po."authorId", p."displayName", po."createdAt"
HAVING COUNT(DISTINCT pl.id) > 0;

CREATE INDEX idx_mv_popular_content_engagement ON mv_popular_content (engagement_score DESC);
CREATE INDEX idx_mv_popular_content_recent ON mv_popular_content (created_at DESC);

-- Daily activity metrics view
CREATE MATERIALIZED VIEW mv_daily_activity_metrics AS
SELECT
    DATE(activity_date) as activity_date,
    COUNT(DISTINCT user_id) as daily_active_users,
    COUNT(DISTINCT CASE WHEN activity_type = 'POST' THEN user_id END) as users_posted,
    COUNT(DISTINCT CASE WHEN activity_type = 'LIKE' THEN user_id END) as users_liked,
    COUNT(DISTINCT CASE WHEN activity_type = 'MESSAGE' THEN user_id END) as users_messaged,
    COUNT(*) as total_activities
FROM (
    -- Posts
    SELECT "authorId" as user_id, "createdAt" as activity_date, 'POST' as activity_type FROM "posts"
    UNION ALL
    -- Likes
    SELECT "userId" as user_id, "createdAt" as activity_date, 'LIKE' as activity_type FROM "post_likes"
    UNION ALL
    -- Messages
    SELECT "senderId" as user_id, "createdAt" as activity_date, 'MESSAGE' as activity_type FROM "messages"
) activities
WHERE activity_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(activity_date)
ORDER BY activity_date DESC;

CREATE UNIQUE INDEX idx_mv_daily_activity_date ON mv_daily_activity_metrics (activity_date);

-- Refresh functions for materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_engagement_metrics;
    REFRESH MATERIALIZED VIEW mv_popular_content;
    REFRESH MATERIALIZED VIEW mv_daily_activity_metrics;
END;
$$ LANGUAGE plpgsql;
