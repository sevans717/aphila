--
-- PostgreSQL database cluster dump
--

\restrict WZfNhHTbHVuSuhOVbfRSIPyqWDDVabHnX7hJkJ6CalzSjooLrNyX8zhHHmbHfZa

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:i1dPVvo8X6hhOiskHjHCBw==$JD/cslvh+Kt8kff4Z6fUbqR3hp2uHZr133YnKH8XDFE=:+1872gxZGltQaqvH7jsUXJsKUIxRLJ5hQ+PU2HWxBEY=';

--
-- User Configurations
--








\unrestrict WZfNhHTbHVuSuhOVbfRSIPyqWDDVabHnX7hJkJ6CalzSjooLrNyX8zhHHmbHfZa

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict dwY6p64esbVUt3PZXwAwuseFKY6YNZUAxRpgPVVaEsyBkFc1iSJVGqZnfggvlQw

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict dwY6p64esbVUt3PZXwAwuseFKY6YNZUAxRpgPVVaEsyBkFc1iSJVGqZnfggvlQw

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict ylnX0IP862Dwq3JV9O3cDAxmhSWsfmNv6wOs8NpXZoDCnbNuiYMsTblj6ypDIRQ

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict ylnX0IP862Dwq3JV9O3cDAxmhSWsfmNv6wOs8NpXZoDCnbNuiYMsTblj6ypDIRQ

--
-- Database "sav3" dump
--

--
-- PostgreSQL database dump
--

\restrict HgUrqqjPHUHgF8DmPFhP9CDEuWGthsGEfTruscfaXEFitrOeGGvJn3PEiYvSDUP

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: sav3; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE sav3 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE sav3 OWNER TO postgres;

\unrestrict HgUrqqjPHUHgF8DmPFhP9CDEuWGthsGEfTruscfaXEFitrOeGGvJn3PEiYvSDUP
\connect sav3
\restrict HgUrqqjPHUHgF8DmPFhP9CDEuWGthsGEfTruscfaXEFitrOeGGvJn3PEiYvSDUP

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ActivityType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ActivityType" AS ENUM (
    'TYPING',
    'VIEWING_PROFILE',
    'VIEWING_MATCH',
    'VIEWING_MESSAGE',
    'VIEWING_POST',
    'VIEWING_STORY',
    'SEARCHING',
    'EDITING_PROFILE',
    'UPLOADING_MEDIA'
);


ALTER TYPE public."ActivityType" OWNER TO postgres;

--
-- Name: AdminActionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AdminActionType" AS ENUM (
    'BAN',
    'UNBAN',
    'WARNING',
    'DELETE_CONTENT'
);


ALTER TYPE public."AdminActionType" OWNER TO postgres;

--
-- Name: BoostStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BoostStatus" AS ENUM (
    'SCHEDULED',
    'ACTIVE',
    'EXPIRED',
    'CANCELLED'
);


ALTER TYPE public."BoostStatus" OWNER TO postgres;

--
-- Name: BoostType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BoostType" AS ENUM (
    'PROFILE',
    'COMMUNITY'
);


ALTER TYPE public."BoostType" OWNER TO postgres;

--
-- Name: CategoryType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CategoryType" AS ENUM (
    'ART',
    'FASHION',
    'FOOD',
    'SPORTS',
    'MUSIC',
    'GAMING',
    'TECH',
    'TRAVEL',
    'CASUAL',
    'SERIOUS',
    'FRIENDS',
    'FUN',
    'OTHER'
);


ALTER TYPE public."CategoryType" OWNER TO postgres;

--
-- Name: CommunityVisibility; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CommunityVisibility" AS ENUM (
    'PUBLIC',
    'PRIVATE',
    'SECRET'
);


ALTER TYPE public."CommunityVisibility" OWNER TO postgres;

--
-- Name: DevicePlatform; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DevicePlatform" AS ENUM (
    'IOS',
    'ANDROID',
    'WEB'
);


ALTER TYPE public."DevicePlatform" OWNER TO postgres;

--
-- Name: FriendshipStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FriendshipStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'BLOCKED'
);


ALTER TYPE public."FriendshipStatus" OWNER TO postgres;

--
-- Name: Gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER'
);


ALTER TYPE public."Gender" OWNER TO postgres;

--
-- Name: LikeType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LikeType" AS ENUM (
    'LIKE',
    'LOVE',
    'LAUGH',
    'WOW',
    'SAD',
    'ANGRY'
);


ALTER TYPE public."LikeType" OWNER TO postgres;

--
-- Name: MatchStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MatchStatus" AS ENUM (
    'ACTIVE',
    'UNMATCHED',
    'BLOCKED'
);


ALTER TYPE public."MatchStatus" OWNER TO postgres;

--
-- Name: MediaType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MediaType" AS ENUM (
    'IMAGE',
    'VIDEO',
    'GIF',
    'OTHER'
);


ALTER TYPE public."MediaType" OWNER TO postgres;

--
-- Name: MembershipRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MembershipRole" AS ENUM (
    'MEMBER',
    'MODERATOR',
    'ADMIN'
);


ALTER TYPE public."MembershipRole" OWNER TO postgres;

--
-- Name: MessageStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MessageStatus" AS ENUM (
    'SENDING',
    'SENT',
    'DELIVERED',
    'READ',
    'FAILED'
);


ALTER TYPE public."MessageStatus" OWNER TO postgres;

--
-- Name: Orientation; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Orientation" AS ENUM (
    'STRAIGHT',
    'GAY',
    'BISEXUAL',
    'OTHER'
);


ALTER TYPE public."Orientation" OWNER TO postgres;

--
-- Name: PostType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PostType" AS ENUM (
    'REGULAR',
    'STORY',
    'REEL',
    'POLL',
    'EVENT',
    'ANNOUNCEMENT'
);


ALTER TYPE public."PostType" OWNER TO postgres;

--
-- Name: PostVisibility; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PostVisibility" AS ENUM (
    'PUBLIC',
    'FRIENDS',
    'COMMUNITY',
    'PRIVATE'
);


ALTER TYPE public."PostVisibility" OWNER TO postgres;

--
-- Name: PresenceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PresenceStatus" AS ENUM (
    'ONLINE',
    'AWAY',
    'OFFLINE'
);


ALTER TYPE public."PresenceStatus" OWNER TO postgres;

--
-- Name: ShareType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ShareType" AS ENUM (
    'REPOST',
    'DIRECT',
    'EXTERNAL',
    'STORY',
    'COPY_LINK'
);


ALTER TYPE public."ShareType" OWNER TO postgres;

--
-- Name: SubscriptionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubscriptionType" AS ENUM (
    'FREE',
    'PREMIUM',
    'PLUS'
);


ALTER TYPE public."SubscriptionType" OWNER TO postgres;

--
-- Name: VerificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."VerificationStatus" AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED'
);


ALTER TYPE public."VerificationStatus" OWNER TO postgres;

--
-- Name: VerificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."VerificationType" AS ENUM (
    'EMAIL',
    'PHONE',
    'SELFIE'
);


ALTER TYPE public."VerificationType" OWNER TO postgres;

--
-- Name: refresh_analytics_views(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.refresh_analytics_views() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_engagement_metrics;
    REFRESH MATERIALIZED VIEW mv_popular_content;
    REFRESH MATERIALIZED VIEW mv_daily_activity_metrics;
END;
$$;


ALTER FUNCTION public.refresh_analytics_views() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _UserInterests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_UserInterests" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_UserInterests" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: admin_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_actions (
    id text NOT NULL,
    "adminId" text NOT NULL,
    "targetUserId" text NOT NULL,
    action public."AdminActionType" NOT NULL,
    reason text NOT NULL,
    details text,
    "isActive" boolean DEFAULT true NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.admin_actions OWNER TO postgres;

--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analytics_events (
    id text NOT NULL,
    "userId" text,
    "eventType" text NOT NULL,
    "eventData" jsonb,
    metadata jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sessionId" text
);


ALTER TABLE public.analytics_events OWNER TO postgres;

--
-- Name: blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocks (
    id text NOT NULL,
    "blockerId" text NOT NULL,
    "blockedId" text NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.blocks OWNER TO postgres;

--
-- Name: boosts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.boosts (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."BoostType" NOT NULL,
    "categoryId" text,
    "communityId" text,
    "startAt" timestamp(3) without time zone NOT NULL,
    "endAt" timestamp(3) without time zone NOT NULL,
    status public."BoostStatus" DEFAULT 'SCHEDULED'::public."BoostStatus" NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.boosts OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    type public."CategoryType",
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: category_memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.category_memberships (
    id text NOT NULL,
    "userId" text NOT NULL,
    "categoryId" text NOT NULL,
    role public."MembershipRole" DEFAULT 'MEMBER'::public."MembershipRole" NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.category_memberships OWNER TO postgres;

--
-- Name: charges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.charges (
    id text NOT NULL,
    "invoiceId" text,
    "stripeChargeId" text NOT NULL,
    "paymentIntentId" text,
    amount integer,
    currency text,
    status text,
    "paymentMethod" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.charges OWNER TO postgres;

--
-- Name: collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collections (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    description text,
    "isPublic" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.collections OWNER TO postgres;

--
-- Name: comment_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_likes (
    id text NOT NULL,
    "userId" text NOT NULL,
    "commentId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.comment_likes OWNER TO postgres;

--
-- Name: communities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.communities (
    id text NOT NULL,
    "categoryId" text,
    "ownerId" text NOT NULL,
    name text NOT NULL,
    description text,
    visibility public."CommunityVisibility" DEFAULT 'PUBLIC'::public."CommunityVisibility" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.communities OWNER TO postgres;

--
-- Name: community_memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.community_memberships (
    id text NOT NULL,
    "userId" text NOT NULL,
    "communityId" text NOT NULL,
    role public."MembershipRole" DEFAULT 'MEMBER'::public."MembershipRole" NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.community_memberships OWNER TO postgres;

--
-- Name: community_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.community_messages (
    id text NOT NULL,
    "communityId" text NOT NULL,
    "senderId" text NOT NULL,
    content text NOT NULL,
    "messageType" text DEFAULT 'text'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "editedAt" timestamp(3) without time zone
);


ALTER TABLE public.community_messages OWNER TO postgres;

--
-- Name: content_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content_tags (
    id text NOT NULL,
    name text NOT NULL,
    category text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.content_tags OWNER TO postgres;

--
-- Name: content_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content_views (
    id text NOT NULL,
    "userId" text NOT NULL,
    "postId" text,
    "storyId" text,
    duration integer,
    "viewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.content_views OWNER TO postgres;

--
-- Name: device_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device_tokens (
    id text NOT NULL,
    "userId" text NOT NULL,
    "deviceId" text NOT NULL,
    token text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    platform public."DevicePlatform" NOT NULL
);


ALTER TABLE public.device_tokens OWNER TO postgres;

--
-- Name: devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devices (
    id text NOT NULL,
    "userId" text NOT NULL,
    "fcmToken" text,
    "deviceId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastUsedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    platform public."DevicePlatform" NOT NULL
);


ALTER TABLE public.devices OWNER TO postgres;

--
-- Name: filter_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.filter_settings (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    "minAge" integer,
    "maxAge" integer,
    "maxDistance" integer,
    orientation public."Orientation",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.filter_settings OWNER TO postgres;

--
-- Name: friendships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friendships (
    id text NOT NULL,
    "requesterId" text NOT NULL,
    "addresseeId" text NOT NULL,
    status public."FriendshipStatus" DEFAULT 'PENDING'::public."FriendshipStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "respondedAt" timestamp(3) without time zone
);


ALTER TABLE public.friendships OWNER TO postgres;

--
-- Name: interests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interests (
    id text NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE public.interests OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id text NOT NULL,
    "userId" text,
    "subscriptionId" text,
    "stripeInvoiceId" text NOT NULL,
    "amountPaid" integer,
    currency text,
    status text,
    "invoicePdf" text,
    "hostedInvoiceUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.likes (
    id text NOT NULL,
    "likerId" text NOT NULL,
    "likedId" text NOT NULL,
    "isSuper" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.likes OWNER TO postgres;

--
-- Name: matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.matches (
    id text NOT NULL,
    "initiatorId" text NOT NULL,
    "receiverId" text NOT NULL,
    status public."MatchStatus" DEFAULT 'ACTIVE'::public."MatchStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.matches OWNER TO postgres;

--
-- Name: media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media (
    id text NOT NULL,
    url text NOT NULL,
    type text NOT NULL,
    "messageId" text,
    "thumbnailUrl" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.media OWNER TO postgres;

--
-- Name: media_assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_assets (
    id text NOT NULL,
    "userId" text NOT NULL,
    url text NOT NULL,
    type public."MediaType" DEFAULT 'IMAGE'::public."MediaType" NOT NULL,
    "isFavorite" boolean DEFAULT false NOT NULL,
    "usedInProfile" boolean DEFAULT false NOT NULL,
    width integer,
    height integer,
    duration integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.media_assets OWNER TO postgres;

--
-- Name: media_bookmarks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_bookmarks (
    id text NOT NULL,
    "userId" text NOT NULL,
    "mediaId" text NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.media_bookmarks OWNER TO postgres;

--
-- Name: media_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_shares (
    id text NOT NULL,
    "userId" text NOT NULL,
    "mediaId" text NOT NULL,
    "shareType" public."ShareType" DEFAULT 'DIRECT'::public."ShareType" NOT NULL,
    platform text,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.media_shares OWNER TO postgres;

--
-- Name: media_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_tags (
    id text NOT NULL,
    "mediaId" text NOT NULL,
    "tagId" text NOT NULL
);


ALTER TABLE public.media_tags OWNER TO postgres;

--
-- Name: message_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message_reactions (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "userId" text NOT NULL,
    reaction text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.message_reactions OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id text NOT NULL,
    "matchId" text NOT NULL,
    "senderId" text NOT NULL,
    "receiverId" text NOT NULL,
    content text NOT NULL,
    "messageType" text DEFAULT 'text'::text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "clientNonce" text,
    "parentId" text,
    status public."MessageStatus" DEFAULT 'SENT'::public."MessageStatus" NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_likes (
    id text NOT NULL,
    "userId" text NOT NULL,
    "postId" text NOT NULL,
    type public."LikeType" DEFAULT 'LIKE'::public."LikeType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.post_likes OWNER TO postgres;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id text NOT NULL,
    "authorId" text NOT NULL,
    "communityId" text,
    content text,
    type public."PostType" DEFAULT 'REGULAR'::public."PostType" NOT NULL,
    visibility public."PostVisibility" DEFAULT 'PUBLIC'::public."PostVisibility" NOT NULL,
    "likesCount" integer DEFAULT 0 NOT NULL,
    "commentsCount" integer DEFAULT 0 NOT NULL,
    "sharesCount" integer DEFAULT 0 NOT NULL,
    "viewsCount" integer DEFAULT 0 NOT NULL,
    "isEdited" boolean DEFAULT false NOT NULL,
    "editedAt" timestamp(3) without time zone,
    "isPinned" boolean DEFAULT false NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: mv_daily_activity_metrics; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_daily_activity_metrics AS
 SELECT date(activity_date) AS activity_date,
    count(DISTINCT user_id) AS daily_active_users,
    count(DISTINCT
        CASE
            WHEN (activity_type = 'POST'::text) THEN user_id
            ELSE NULL::text
        END) AS users_posted,
    count(DISTINCT
        CASE
            WHEN (activity_type = 'LIKE'::text) THEN user_id
            ELSE NULL::text
        END) AS users_liked,
    count(DISTINCT
        CASE
            WHEN (activity_type = 'MESSAGE'::text) THEN user_id
            ELSE NULL::text
        END) AS users_messaged,
    count(*) AS total_activities
   FROM ( SELECT posts."authorId" AS user_id,
            posts."createdAt" AS activity_date,
            'POST'::text AS activity_type
           FROM public.posts
        UNION ALL
         SELECT post_likes."userId" AS user_id,
            post_likes."createdAt" AS activity_date,
            'LIKE'::text AS activity_type
           FROM public.post_likes
        UNION ALL
         SELECT messages."senderId" AS user_id,
            messages."createdAt" AS activity_date,
            'MESSAGE'::text AS activity_type
           FROM public.messages) activities
  WHERE (activity_date >= (CURRENT_DATE - '90 days'::interval))
  GROUP BY (date(activity_date))
  ORDER BY (date(activity_date)) DESC
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_daily_activity_metrics OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "displayName" text NOT NULL,
    bio text,
    birthdate timestamp(3) without time zone NOT NULL,
    gender public."Gender" NOT NULL,
    orientation public."Orientation" NOT NULL,
    location text,
    "locationGeography" text,
    latitude double precision,
    longitude double precision,
    "maxDistance" integer DEFAULT 50 NOT NULL,
    "ageMin" integer DEFAULT 18 NOT NULL,
    "ageMax" integer DEFAULT 65 NOT NULL,
    "showMe" public."Orientation" DEFAULT 'STRAIGHT'::public."Orientation" NOT NULL,
    "isVisible" boolean DEFAULT true NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    avatar text
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: mv_popular_content; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_popular_content AS
 SELECT po.id AS post_id,
    po."authorId" AS user_id,
    p."displayName" AS author_name,
    count(DISTINCT pl.id) AS like_count,
    po."createdAt" AS created_at,
    ((count(DISTINCT pl.id))::numeric * 1.0) AS engagement_score
   FROM (((public.posts po
     JOIN public.users u ON ((po."authorId" = u.id)))
     JOIN public.profiles p ON ((u.id = p."userId")))
     LEFT JOIN public.post_likes pl ON ((po.id = pl."postId")))
  WHERE (po.visibility = 'PUBLIC'::public."PostVisibility")
  GROUP BY po.id, po."authorId", p."displayName", po."createdAt"
 HAVING (count(DISTINCT pl.id) > 0)
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_popular_content OWNER TO postgres;

--
-- Name: mv_user_engagement_metrics; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_user_engagement_metrics AS
 SELECT u.id AS user_id,
    p."displayName" AS display_name,
    count(DISTINCT po.id) AS total_posts,
    count(DISTINCT pl.id) AS total_likes_received,
    count(DISTINCT m.id) AS total_messages_sent,
    count(DISTINCT f.id) AS total_friends,
    max(u."lastLogin") AS last_activity,
    u."createdAt" AS user_joined_at
   FROM (((((public.users u
     LEFT JOIN public.profiles p ON ((u.id = p."userId")))
     LEFT JOIN public.posts po ON ((u.id = po."authorId")))
     LEFT JOIN public.post_likes pl ON ((po.id = pl."postId")))
     LEFT JOIN public.messages m ON ((u.id = m."senderId")))
     LEFT JOIN public.friendships f ON (((u.id = f."requesterId") OR (u.id = f."addresseeId"))))
  WHERE (u."isActive" = true)
  GROUP BY u.id, p."displayName", u."createdAt"
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_user_engagement_metrics OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    data jsonb,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.photos (
    id text NOT NULL,
    "userId" text NOT NULL,
    url text NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.photos OWNER TO postgres;

--
-- Name: post_bookmarks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_bookmarks (
    id text NOT NULL,
    "userId" text NOT NULL,
    "postId" text NOT NULL,
    "collectionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.post_bookmarks OWNER TO postgres;

--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_comments (
    id text NOT NULL,
    "userId" text NOT NULL,
    "postId" text NOT NULL,
    "parentId" text,
    content text NOT NULL,
    "mediaUrl" text,
    "likesCount" integer DEFAULT 0 NOT NULL,
    "repliesCount" integer DEFAULT 0 NOT NULL,
    "isEdited" boolean DEFAULT false NOT NULL,
    "editedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.post_comments OWNER TO postgres;

--
-- Name: post_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_media (
    id text NOT NULL,
    "postId" text NOT NULL,
    "mediaId" text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    caption text
);


ALTER TABLE public.post_media OWNER TO postgres;

--
-- Name: post_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_reports (
    id text NOT NULL,
    "reporterId" text NOT NULL,
    "postId" text NOT NULL,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.post_reports OWNER TO postgres;

--
-- Name: post_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_shares (
    id text NOT NULL,
    "userId" text NOT NULL,
    "postId" text NOT NULL,
    "shareType" public."ShareType" DEFAULT 'REPOST'::public."ShareType" NOT NULL,
    platform text,
    comment text,
    "communityId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.post_shares OWNER TO postgres;

--
-- Name: post_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_tags (
    id text NOT NULL,
    "postId" text NOT NULL,
    "tagId" text NOT NULL
);


ALTER TABLE public.post_tags OWNER TO postgres;

--
-- Name: presence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.presence (
    id text NOT NULL,
    "userId" text NOT NULL,
    status public."PresenceStatus" DEFAULT 'OFFLINE'::public."PresenceStatus" NOT NULL,
    "lastSeen" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastActivity" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "deviceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.presence OWNER TO postgres;

--
-- Name: privacy_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.privacy_settings (
    id text NOT NULL,
    "userId" text NOT NULL,
    "showAge" boolean DEFAULT true NOT NULL,
    "showDistance" boolean DEFAULT true NOT NULL,
    searchable boolean DEFAULT true NOT NULL,
    "allowMessagesFrom" text DEFAULT 'matches'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.privacy_settings OWNER TO postgres;

--
-- Name: processed_webhook_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.processed_webhook_events (
    id text NOT NULL,
    "eventId" text NOT NULL,
    provider text DEFAULT 'stripe'::text NOT NULL,
    payload jsonb NOT NULL,
    "receivedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.processed_webhook_events OWNER TO postgres;

--
-- Name: push_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.push_notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    "deviceId" text NOT NULL,
    "deviceTokenId" text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    data jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    "errorMessage" text,
    "sentAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.push_notifications OWNER TO postgres;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id text NOT NULL,
    "reporterId" text NOT NULL,
    "reportedId" text NOT NULL,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: search_queries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.search_queries (
    id text NOT NULL,
    "userId" text NOT NULL,
    query text NOT NULL,
    results integer DEFAULT 0 NOT NULL,
    clicked boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.search_queries OWNER TO postgres;

--
-- Name: stories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stories (
    id text NOT NULL,
    "userId" text NOT NULL,
    "mediaId" text NOT NULL,
    caption text,
    duration integer DEFAULT 24 NOT NULL,
    "viewsCount" integer DEFAULT 0 NOT NULL,
    "isHighlight" boolean DEFAULT false NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    content text,
    "isPublic" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.stories OWNER TO postgres;

--
-- Name: story_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.story_views (
    id text NOT NULL,
    "storyId" text NOT NULL,
    "viewerId" text NOT NULL,
    "viewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.story_views OWNER TO postgres;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."SubscriptionType" DEFAULT 'FREE'::public."SubscriptionType" NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "autoRenew" boolean DEFAULT false NOT NULL,
    "stripeCustomerId" text,
    "stripePriceId" text,
    "stripeSubscriptionId" text,
    "lastInvoiceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- Name: topic_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.topic_subscriptions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "deviceId" text NOT NULL,
    "deviceTokenId" text NOT NULL,
    topic text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.topic_subscriptions OWNER TO postgres;

--
-- Name: user_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_activities (
    id text NOT NULL,
    "presenceId" text NOT NULL,
    type public."ActivityType" NOT NULL,
    "targetId" text,
    metadata jsonb,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endedAt" timestamp(3) without time zone
);


ALTER TABLE public.user_activities OWNER TO postgres;

--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_settings (
    id text NOT NULL,
    "userId" text NOT NULL,
    "darkMode" boolean DEFAULT false NOT NULL,
    "showOnlineStatus" boolean DEFAULT true NOT NULL,
    "hudCompact" boolean DEFAULT false NOT NULL,
    "enableSounds" boolean DEFAULT true NOT NULL,
    "notificationPreferences" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_settings OWNER TO postgres;

--
-- Name: verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."VerificationType" NOT NULL,
    status public."VerificationStatus" DEFAULT 'PENDING'::public."VerificationStatus" NOT NULL,
    data text,
    "verifiedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    attempts integer DEFAULT 0 NOT NULL,
    "maxAttempts" integer DEFAULT 3 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.verifications OWNER TO postgres;

--
-- Data for Name: _UserInterests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_UserInterests" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
de308193-c9c8-4995-9cec-c11d5e7b5026	238c08a08618450c9b5e4d124b6ac7dcd90ad957e30ac8f22ad87ad6e5011ac4	2025-08-29 22:08:38.23769+00	20250828005510_baseline_complete_schema	\N	\N	2025-08-29 22:08:35.088501+00	1
4c346587-6040-49b2-86e3-ed0972b962df	2b9bda44ba0e78b6ab8ad13b105abe7f4ecdbc8516a5e5876145566d749f32eb	2025-08-29 22:08:38.353449+00	20250828005541_add_analytics_views	\N	\N	2025-08-29 22:08:38.241643+00	1
b3717a21-e1aa-480a-836c-f60a03c77578	82921373d6529a07786ca8a3912bdb4594139af3cac27b5f92406292f23a04b5	2025-08-29 22:08:38.443701+00	20250828221335_add_database_constraints	\N	\N	2025-08-29 22:08:38.358905+00	1
a5688d4d-96a9-4b13-984b-0dede7e4f1e0	75b4930a79d22851ef3d552138bdbba293bbf361ab85767c80e710ebf73fdd5b	2025-08-29 22:08:38.640552+00	20250829200109_x_xx_sav3	\N	\N	2025-08-29 22:08:38.448171+00	1
\.


--
-- Data for Name: admin_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_actions (id, "adminId", "targetUserId", action, reason, details, "isActive", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: analytics_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analytics_events (id, "userId", "eventType", "eventData", metadata, "timestamp", "sessionId") FROM stdin;
\.


--
-- Data for Name: blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blocks (id, "blockerId", "blockedId", reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: boosts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.boosts (id, "userId", type, "categoryId", "communityId", "startAt", "endAt", status, priority, "createdAt") FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, slug, name, description, type, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: category_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.category_memberships (id, "userId", "categoryId", role, "joinedAt") FROM stdin;
\.


--
-- Data for Name: charges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.charges (id, "invoiceId", "stripeChargeId", "paymentIntentId", amount, currency, status, "paymentMethod", "createdAt") FROM stdin;
\.


--
-- Data for Name: collections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.collections (id, "userId", name, description, "isPublic", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: comment_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_likes (id, "userId", "commentId", "createdAt") FROM stdin;
\.


--
-- Data for Name: communities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.communities (id, "categoryId", "ownerId", name, description, visibility, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: community_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.community_memberships (id, "userId", "communityId", role, "joinedAt") FROM stdin;
\.


--
-- Data for Name: community_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.community_messages (id, "communityId", "senderId", content, "messageType", "createdAt", "editedAt") FROM stdin;
\.


--
-- Data for Name: content_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.content_tags (id, name, category, "isSystem", "createdAt") FROM stdin;
\.


--
-- Data for Name: content_views; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.content_views (id, "userId", "postId", "storyId", duration, "viewedAt") FROM stdin;
\.


--
-- Data for Name: device_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.device_tokens (id, "userId", "deviceId", token, "isActive", "createdAt", "updatedAt", platform) FROM stdin;
\.


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.devices (id, "userId", "fcmToken", "deviceId", "isActive", "lastUsedAt", "createdAt", "updatedAt", platform) FROM stdin;
\.


--
-- Data for Name: filter_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.filter_settings (id, "userId", name, "minAge", "maxAge", "maxDistance", orientation, "createdAt") FROM stdin;
\.


--
-- Data for Name: friendships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.friendships (id, "requesterId", "addresseeId", status, "createdAt", "respondedAt") FROM stdin;
\.


--
-- Data for Name: interests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interests (id, name, description) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, "userId", "subscriptionId", "stripeInvoiceId", "amountPaid", currency, status, "invoicePdf", "hostedInvoiceUrl", "createdAt") FROM stdin;
\.


--
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.likes (id, "likerId", "likedId", "isSuper", "createdAt") FROM stdin;
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.matches (id, "initiatorId", "receiverId", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.media (id, url, type, "messageId", "thumbnailUrl", metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: media_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.media_assets (id, "userId", url, type, "isFavorite", "usedInProfile", width, height, duration, "createdAt") FROM stdin;
\.


--
-- Data for Name: media_bookmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.media_bookmarks (id, "userId", "mediaId", tags, "createdAt") FROM stdin;
\.


--
-- Data for Name: media_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.media_shares (id, "userId", "mediaId", "shareType", platform, comment, "createdAt") FROM stdin;
\.


--
-- Data for Name: media_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.media_tags (id, "mediaId", "tagId") FROM stdin;
\.


--
-- Data for Name: message_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.message_reactions (id, "messageId", "userId", reaction, "createdAt") FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, "matchId", "senderId", "receiverId", content, "messageType", "isRead", "readAt", "createdAt", "clientNonce", "parentId", status, "updatedAt") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, "userId", type, title, body, data, "isRead", "createdAt") FROM stdin;
\.


--
-- Data for Name: photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.photos (id, "userId", url, "isPrimary", "order", "createdAt") FROM stdin;
\.


--
-- Data for Name: post_bookmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_bookmarks (id, "userId", "postId", "collectionId", "createdAt") FROM stdin;
\.


--
-- Data for Name: post_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_comments (id, "userId", "postId", "parentId", content, "mediaUrl", "likesCount", "repliesCount", "isEdited", "editedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_likes (id, "userId", "postId", type, "createdAt") FROM stdin;
\.


--
-- Data for Name: post_media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_media (id, "postId", "mediaId", "order", caption) FROM stdin;
\.


--
-- Data for Name: post_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_reports (id, "reporterId", "postId", reason, details, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: post_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_shares (id, "userId", "postId", "shareType", platform, comment, "communityId", "createdAt") FROM stdin;
\.


--
-- Data for Name: post_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_tags (id, "postId", "tagId") FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, "authorId", "communityId", content, type, visibility, "likesCount", "commentsCount", "sharesCount", "viewsCount", "isEdited", "editedAt", "isPinned", "isArchived", "createdAt", "updatedAt", "isPublic") FROM stdin;
\.


--
-- Data for Name: presence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.presence (id, "userId", status, "lastSeen", "lastActivity", "isActive", "deviceId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: privacy_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.privacy_settings (id, "userId", "showAge", "showDistance", searchable, "allowMessagesFrom", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: processed_webhook_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.processed_webhook_events (id, "eventId", provider, payload, "receivedAt") FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, "userId", "displayName", bio, birthdate, gender, orientation, location, "locationGeography", latitude, longitude, "maxDistance", "ageMin", "ageMax", "showMe", "isVisible", "isVerified", "createdAt", "updatedAt", avatar) FROM stdin;
\.


--
-- Data for Name: push_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.push_notifications (id, "userId", "deviceId", "deviceTokenId", title, body, data, status, "errorMessage", "sentAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, "reporterId", "reportedId", reason, details, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: search_queries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.search_queries (id, "userId", query, results, clicked, "createdAt") FROM stdin;
\.


--
-- Data for Name: stories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stories (id, "userId", "mediaId", caption, duration, "viewsCount", "isHighlight", "expiresAt", "createdAt", content, "isPublic") FROM stdin;
\.


--
-- Data for Name: story_views; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.story_views (id, "storyId", "viewerId", "viewedAt") FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, "userId", type, "isActive", "startDate", "endDate", "autoRenew", "stripeCustomerId", "stripePriceId", "stripeSubscriptionId", "lastInvoiceId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: topic_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.topic_subscriptions (id, "userId", "deviceId", "deviceTokenId", topic, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_activities (id, "presenceId", type, "targetId", metadata, "startedAt", "endedAt") FROM stdin;
\.


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_settings (id, "userId", "darkMode", "showOnlineStatus", "hudCompact", "enableSounds", "notificationPreferences", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, "isActive", "isAdmin", "lastLogin", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verifications (id, "userId", type, status, data, "verifiedAt", "expiresAt", attempts, "maxAttempts", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: _UserInterests _UserInterests_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_UserInterests"
    ADD CONSTRAINT "_UserInterests_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: admin_actions admin_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_pkey PRIMARY KEY (id);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (id);


--
-- Name: boosts boosts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boosts
    ADD CONSTRAINT boosts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: category_memberships category_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_memberships
    ADD CONSTRAINT category_memberships_pkey PRIMARY KEY (id);


--
-- Name: charges charges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_pkey PRIMARY KEY (id);


--
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (id);


--
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- Name: communities communities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_pkey PRIMARY KEY (id);


--
-- Name: community_memberships community_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_memberships
    ADD CONSTRAINT community_memberships_pkey PRIMARY KEY (id);


--
-- Name: community_messages community_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_messages
    ADD CONSTRAINT community_messages_pkey PRIMARY KEY (id);


--
-- Name: content_tags content_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_tags
    ADD CONSTRAINT content_tags_pkey PRIMARY KEY (id);


--
-- Name: content_views content_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_views
    ADD CONSTRAINT content_views_pkey PRIMARY KEY (id);


--
-- Name: device_tokens device_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: filter_settings filter_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.filter_settings
    ADD CONSTRAINT filter_settings_pkey PRIMARY KEY (id);


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);


--
-- Name: interests interests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interests
    ADD CONSTRAINT interests_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);


--
-- Name: media_bookmarks media_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_bookmarks
    ADD CONSTRAINT media_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: media_shares media_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_shares
    ADD CONSTRAINT media_shares_pkey PRIMARY KEY (id);


--
-- Name: media_tags media_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_tags
    ADD CONSTRAINT media_tags_pkey PRIMARY KEY (id);


--
-- Name: message_reactions message_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- Name: post_bookmarks post_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_bookmarks
    ADD CONSTRAINT post_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: post_media post_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT post_media_pkey PRIMARY KEY (id);


--
-- Name: post_reports post_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_reports
    ADD CONSTRAINT post_reports_pkey PRIMARY KEY (id);


--
-- Name: post_shares post_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_shares
    ADD CONSTRAINT post_shares_pkey PRIMARY KEY (id);


--
-- Name: post_tags post_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_tags
    ADD CONSTRAINT post_tags_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: presence presence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presence
    ADD CONSTRAINT presence_pkey PRIMARY KEY (id);


--
-- Name: privacy_settings privacy_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.privacy_settings
    ADD CONSTRAINT privacy_settings_pkey PRIMARY KEY (id);


--
-- Name: processed_webhook_events processed_webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processed_webhook_events
    ADD CONSTRAINT processed_webhook_events_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: push_notifications push_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_notifications
    ADD CONSTRAINT push_notifications_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: search_queries search_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_queries
    ADD CONSTRAINT search_queries_pkey PRIMARY KEY (id);


--
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (id);


--
-- Name: story_views story_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT story_views_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: topic_subscriptions topic_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topic_subscriptions
    ADD CONSTRAINT topic_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_activities user_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activities
    ADD CONSTRAINT user_activities_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verifications verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_pkey PRIMARY KEY (id);


--
-- Name: _UserInterests_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_UserInterests_B_index" ON public."_UserInterests" USING btree ("B");


--
-- Name: analytics_events_eventType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "analytics_events_eventType_idx" ON public.analytics_events USING btree ("eventType");


--
-- Name: analytics_events_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX analytics_events_timestamp_idx ON public.analytics_events USING btree ("timestamp");


--
-- Name: analytics_events_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "analytics_events_userId_idx" ON public.analytics_events USING btree ("userId");


--
-- Name: blocks_blockedId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "blocks_blockedId_idx" ON public.blocks USING btree ("blockedId");


--
-- Name: blocks_blockerId_blockedId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "blocks_blockerId_blockedId_key" ON public.blocks USING btree ("blockerId", "blockedId");


--
-- Name: boosts_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "boosts_categoryId_idx" ON public.boosts USING btree ("categoryId");


--
-- Name: boosts_communityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "boosts_communityId_idx" ON public.boosts USING btree ("communityId");


--
-- Name: boosts_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "boosts_userId_idx" ON public.boosts USING btree ("userId");


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: categories_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX categories_type_idx ON public.categories USING btree (type);


--
-- Name: category_memberships_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "category_memberships_categoryId_idx" ON public.category_memberships USING btree ("categoryId");


--
-- Name: category_memberships_userId_categoryId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "category_memberships_userId_categoryId_key" ON public.category_memberships USING btree ("userId", "categoryId");


--
-- Name: charges_invoiceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "charges_invoiceId_idx" ON public.charges USING btree ("invoiceId");


--
-- Name: charges_stripeChargeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "charges_stripeChargeId_key" ON public.charges USING btree ("stripeChargeId");


--
-- Name: collections_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "collections_userId_idx" ON public.collections USING btree ("userId");


--
-- Name: comment_likes_userId_commentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "comment_likes_userId_commentId_key" ON public.comment_likes USING btree ("userId", "commentId");


--
-- Name: communities_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "communities_categoryId_idx" ON public.communities USING btree ("categoryId");


--
-- Name: communities_ownerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "communities_ownerId_idx" ON public.communities USING btree ("ownerId");


--
-- Name: community_memberships_communityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "community_memberships_communityId_idx" ON public.community_memberships USING btree ("communityId");


--
-- Name: community_memberships_userId_communityId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "community_memberships_userId_communityId_key" ON public.community_memberships USING btree ("userId", "communityId");


--
-- Name: community_messages_communityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "community_messages_communityId_idx" ON public.community_messages USING btree ("communityId");


--
-- Name: community_messages_senderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "community_messages_senderId_idx" ON public.community_messages USING btree ("senderId");


--
-- Name: content_tags_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX content_tags_name_key ON public.content_tags USING btree (name);


--
-- Name: content_views_postId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "content_views_postId_idx" ON public.content_views USING btree ("postId");


--
-- Name: content_views_storyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "content_views_storyId_idx" ON public.content_views USING btree ("storyId");


--
-- Name: content_views_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "content_views_userId_idx" ON public.content_views USING btree ("userId");


--
-- Name: device_tokens_deviceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "device_tokens_deviceId_idx" ON public.device_tokens USING btree ("deviceId");


--
-- Name: device_tokens_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "device_tokens_isActive_idx" ON public.device_tokens USING btree ("isActive");


--
-- Name: device_tokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX device_tokens_token_key ON public.device_tokens USING btree (token);


--
-- Name: device_tokens_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "device_tokens_userId_idx" ON public.device_tokens USING btree ("userId");


--
-- Name: devices_deviceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "devices_deviceId_key" ON public.devices USING btree ("deviceId");


--
-- Name: devices_fcmToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "devices_fcmToken_key" ON public.devices USING btree ("fcmToken");


--
-- Name: devices_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "devices_userId_idx" ON public.devices USING btree ("userId");


--
-- Name: filter_settings_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "filter_settings_userId_idx" ON public.filter_settings USING btree ("userId");


--
-- Name: filter_settings_userId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "filter_settings_userId_name_key" ON public.filter_settings USING btree ("userId", name);


--
-- Name: friendships_addresseeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "friendships_addresseeId_idx" ON public.friendships USING btree ("addresseeId");


--
-- Name: friendships_requesterId_addresseeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "friendships_requesterId_addresseeId_key" ON public.friendships USING btree ("requesterId", "addresseeId");


--
-- Name: idx_mv_daily_activity_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mv_daily_activity_date ON public.mv_daily_activity_metrics USING btree (activity_date);


--
-- Name: idx_mv_popular_content_engagement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_popular_content_engagement ON public.mv_popular_content USING btree (engagement_score DESC);


--
-- Name: idx_mv_popular_content_recent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_popular_content_recent ON public.mv_popular_content USING btree (created_at DESC);


--
-- Name: idx_mv_user_engagement_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mv_user_engagement_user_id ON public.mv_user_engagement_metrics USING btree (user_id);


--
-- Name: interests_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX interests_name_key ON public.interests USING btree (name);


--
-- Name: invoices_stripeInvoiceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "invoices_stripeInvoiceId_key" ON public.invoices USING btree ("stripeInvoiceId");


--
-- Name: invoices_subscriptionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoices_subscriptionId_idx" ON public.invoices USING btree ("subscriptionId");


--
-- Name: invoices_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoices_userId_idx" ON public.invoices USING btree ("userId");


--
-- Name: likes_likedId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "likes_likedId_idx" ON public.likes USING btree ("likedId");


--
-- Name: likes_likerId_likedId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "likes_likerId_likedId_key" ON public.likes USING btree ("likerId", "likedId");


--
-- Name: matches_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "matches_createdAt_idx" ON public.matches USING btree ("createdAt");


--
-- Name: matches_initiatorId_receiverId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "matches_initiatorId_receiverId_key" ON public.matches USING btree ("initiatorId", "receiverId");


--
-- Name: matches_receiverId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "matches_receiverId_idx" ON public.matches USING btree ("receiverId");


--
-- Name: matches_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX matches_status_idx ON public.matches USING btree (status);


--
-- Name: media_assets_isFavorite_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "media_assets_isFavorite_idx" ON public.media_assets USING btree ("isFavorite");


--
-- Name: media_assets_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "media_assets_userId_idx" ON public.media_assets USING btree ("userId");


--
-- Name: media_bookmarks_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "media_bookmarks_userId_idx" ON public.media_bookmarks USING btree ("userId");


--
-- Name: media_bookmarks_userId_mediaId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "media_bookmarks_userId_mediaId_key" ON public.media_bookmarks USING btree ("userId", "mediaId");


--
-- Name: media_messageId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "media_messageId_idx" ON public.media USING btree ("messageId");


--
-- Name: media_shares_mediaId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "media_shares_mediaId_idx" ON public.media_shares USING btree ("mediaId");


--
-- Name: media_shares_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "media_shares_userId_idx" ON public.media_shares USING btree ("userId");


--
-- Name: media_tags_mediaId_tagId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "media_tags_mediaId_tagId_key" ON public.media_tags USING btree ("mediaId", "tagId");


--
-- Name: message_reactions_messageId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "message_reactions_messageId_idx" ON public.message_reactions USING btree ("messageId");


--
-- Name: message_reactions_messageId_userId_reaction_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "message_reactions_messageId_userId_reaction_key" ON public.message_reactions USING btree ("messageId", "userId", reaction);


--
-- Name: message_reactions_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "message_reactions_userId_idx" ON public.message_reactions USING btree ("userId");


--
-- Name: messages_isRead_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "messages_isRead_idx" ON public.messages USING btree ("isRead");


--
-- Name: messages_matchId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "messages_matchId_createdAt_idx" ON public.messages USING btree ("matchId", "createdAt");


--
-- Name: messages_parentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "messages_parentId_idx" ON public.messages USING btree ("parentId");


--
-- Name: messages_receiverId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "messages_receiverId_idx" ON public.messages USING btree ("receiverId");


--
-- Name: messages_senderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "messages_senderId_idx" ON public.messages USING btree ("senderId");


--
-- Name: notifications_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_userId_idx" ON public.notifications USING btree ("userId");


--
-- Name: photos_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "photos_userId_idx" ON public.photos USING btree ("userId");


--
-- Name: post_bookmarks_collectionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "post_bookmarks_collectionId_idx" ON public.post_bookmarks USING btree ("collectionId");


--
-- Name: post_bookmarks_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "post_bookmarks_userId_idx" ON public.post_bookmarks USING btree ("userId");


--
-- Name: post_bookmarks_userId_postId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "post_bookmarks_userId_postId_key" ON public.post_bookmarks USING btree ("userId", "postId");


--
-- Name: post_comments_parentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "post_comments_parentId_idx" ON public.post_comments USING btree ("parentId");


--
-- Name: post_comments_postId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "post_comments_postId_idx" ON public.post_comments USING btree ("postId");


--
-- Name: post_comments_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "post_comments_userId_idx" ON public.post_comments USING btree ("userId");


--
-- Name: post_likes_postId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "post_likes_postId_idx" ON public.post_likes USING btree ("postId");


--
-- Name: post_likes_userId_postId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "post_likes_userId_postId_key" ON public.post_likes USING btree ("userId", "postId");


--
-- Name: post_media_postId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "post_media_postId_idx" ON public.post_media USING btree ("postId");


--
-- Name: post_media_postId_mediaId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "post_media_postId_mediaId_key" ON public.post_media USING btree ("postId", "mediaId");


--
-- Name: post_reports_postId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "post_reports_postId_idx" ON public.post_reports USING btree ("postId");


--
-- Name: post_reports_reporterId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "post_reports_reporterId_idx" ON public.post_reports USING btree ("reporterId");


--
-- Name: post_shares_postId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "post_shares_postId_idx" ON public.post_shares USING btree ("postId");


--
-- Name: post_shares_shareType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "post_shares_shareType_idx" ON public.post_shares USING btree ("shareType");


--
-- Name: post_shares_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "post_shares_userId_idx" ON public.post_shares USING btree ("userId");


--
-- Name: post_tags_postId_tagId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "post_tags_postId_tagId_key" ON public.post_tags USING btree ("postId", "tagId");


--
-- Name: posts_authorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "posts_authorId_idx" ON public.posts USING btree ("authorId");


--
-- Name: posts_communityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "posts_communityId_idx" ON public.posts USING btree ("communityId");


--
-- Name: posts_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "posts_createdAt_idx" ON public.posts USING btree ("createdAt");


--
-- Name: posts_visibility_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX posts_visibility_idx ON public.posts USING btree (visibility);


--
-- Name: presence_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "presence_isActive_idx" ON public.presence USING btree ("isActive");


--
-- Name: presence_lastSeen_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "presence_lastSeen_idx" ON public.presence USING btree ("lastSeen");


--
-- Name: presence_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX presence_status_idx ON public.presence USING btree (status);


--
-- Name: presence_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "presence_userId_key" ON public.presence USING btree ("userId");


--
-- Name: privacy_settings_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "privacy_settings_userId_key" ON public.privacy_settings USING btree ("userId");


--
-- Name: processed_webhook_events_eventId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "processed_webhook_events_eventId_idx" ON public.processed_webhook_events USING btree ("eventId");


--
-- Name: processed_webhook_events_eventId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "processed_webhook_events_eventId_key" ON public.processed_webhook_events USING btree ("eventId");


--
-- Name: profiles_birthdate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX profiles_birthdate_idx ON public.profiles USING btree (birthdate);


--
-- Name: profiles_gender_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX profiles_gender_idx ON public.profiles USING btree (gender);


--
-- Name: profiles_isVerified_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profiles_isVerified_idx" ON public.profiles USING btree ("isVerified");


--
-- Name: profiles_isVisible_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profiles_isVisible_idx" ON public.profiles USING btree ("isVisible");


--
-- Name: profiles_latitude_longitude_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX profiles_latitude_longitude_idx ON public.profiles USING btree (latitude, longitude);


--
-- Name: profiles_locationGeography_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profiles_locationGeography_idx" ON public.profiles USING btree ("locationGeography");


--
-- Name: profiles_orientation_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX profiles_orientation_idx ON public.profiles USING btree (orientation);


--
-- Name: profiles_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "profiles_userId_key" ON public.profiles USING btree ("userId");


--
-- Name: push_notifications_deviceTokenId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "push_notifications_deviceTokenId_idx" ON public.push_notifications USING btree ("deviceTokenId");


--
-- Name: push_notifications_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX push_notifications_status_idx ON public.push_notifications USING btree (status);


--
-- Name: push_notifications_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "push_notifications_userId_idx" ON public.push_notifications USING btree ("userId");


--
-- Name: search_queries_query_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX search_queries_query_idx ON public.search_queries USING btree (query);


--
-- Name: search_queries_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "search_queries_userId_idx" ON public.search_queries USING btree ("userId");


--
-- Name: stories_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stories_expiresAt_idx" ON public.stories USING btree ("expiresAt");


--
-- Name: stories_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stories_userId_idx" ON public.stories USING btree ("userId");


--
-- Name: story_views_storyId_viewerId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "story_views_storyId_viewerId_key" ON public.story_views USING btree ("storyId", "viewerId");


--
-- Name: subscriptions_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "subscriptions_userId_key" ON public.subscriptions USING btree ("userId");


--
-- Name: topic_subscriptions_deviceTokenId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "topic_subscriptions_deviceTokenId_idx" ON public.topic_subscriptions USING btree ("deviceTokenId");


--
-- Name: topic_subscriptions_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "topic_subscriptions_isActive_idx" ON public.topic_subscriptions USING btree ("isActive");


--
-- Name: topic_subscriptions_topic_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX topic_subscriptions_topic_idx ON public.topic_subscriptions USING btree (topic);


--
-- Name: topic_subscriptions_userId_topic_deviceTokenId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "topic_subscriptions_userId_topic_deviceTokenId_key" ON public.topic_subscriptions USING btree ("userId", topic, "deviceTokenId");


--
-- Name: user_activities_presenceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_activities_presenceId_idx" ON public.user_activities USING btree ("presenceId");


--
-- Name: user_activities_targetId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_activities_targetId_idx" ON public.user_activities USING btree ("targetId");


--
-- Name: user_activities_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_activities_type_idx ON public.user_activities USING btree (type);


--
-- Name: user_settings_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "user_settings_userId_key" ON public.user_settings USING btree ("userId");


--
-- Name: users_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "users_createdAt_idx" ON public.users USING btree ("createdAt");


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "users_isActive_idx" ON public.users USING btree ("isActive");


--
-- Name: users_lastLogin_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "users_lastLogin_idx" ON public.users USING btree ("lastLogin");


--
-- Name: verifications_userId_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "verifications_userId_type_key" ON public.verifications USING btree ("userId", type);


--
-- Name: _UserInterests _UserInterests_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_UserInterests"
    ADD CONSTRAINT "_UserInterests_A_fkey" FOREIGN KEY ("A") REFERENCES public.interests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _UserInterests _UserInterests_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_UserInterests"
    ADD CONSTRAINT "_UserInterests_B_fkey" FOREIGN KEY ("B") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: admin_actions admin_actions_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT "admin_actions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: admin_actions admin_actions_targetUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT "admin_actions_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: analytics_events analytics_events_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: blocks blocks_blockedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT "blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blocks blocks_blockerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT "blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: boosts boosts_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boosts
    ADD CONSTRAINT "boosts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: boosts boosts_communityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boosts
    ADD CONSTRAINT "boosts_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES public.communities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: boosts boosts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boosts
    ADD CONSTRAINT "boosts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: category_memberships category_memberships_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_memberships
    ADD CONSTRAINT "category_memberships_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: category_memberships category_memberships_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_memberships
    ADD CONSTRAINT "category_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: charges charges_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT "charges_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: collections collections_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT "comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public.post_comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT "comment_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: communities communities_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT "communities_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: communities communities_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT "communities_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: community_memberships community_memberships_communityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_memberships
    ADD CONSTRAINT "community_memberships_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES public.communities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: community_memberships community_memberships_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_memberships
    ADD CONSTRAINT "community_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: community_messages community_messages_communityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_messages
    ADD CONSTRAINT "community_messages_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES public.communities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: community_messages community_messages_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_messages
    ADD CONSTRAINT "community_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: content_views content_views_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_views
    ADD CONSTRAINT "content_views_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: content_views content_views_storyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_views
    ADD CONSTRAINT "content_views_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES public.stories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: content_views content_views_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_views
    ADD CONSTRAINT "content_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: device_tokens device_tokens_deviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT "device_tokens_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES public.devices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: device_tokens device_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: devices devices_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: filter_settings filter_settings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.filter_settings
    ADD CONSTRAINT "filter_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: friendships friendships_addresseeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT "friendships_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: friendships friendships_requesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT "friendships_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES public.subscriptions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoices invoices_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: likes likes_likedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT "likes_likedId_fkey" FOREIGN KEY ("likedId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: likes likes_likerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT "likes_likerId_fkey" FOREIGN KEY ("likerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: matches matches_initiatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT "matches_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: matches matches_receiverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT "matches_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media_assets media_assets_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT "media_assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media_bookmarks media_bookmarks_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_bookmarks
    ADD CONSTRAINT "media_bookmarks_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media_bookmarks media_bookmarks_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_bookmarks
    ADD CONSTRAINT "media_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media media_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT "media_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media_shares media_shares_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_shares
    ADD CONSTRAINT "media_shares_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media_shares media_shares_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_shares
    ADD CONSTRAINT "media_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media_tags media_tags_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_tags
    ADD CONSTRAINT "media_tags_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media_tags media_tags_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_tags
    ADD CONSTRAINT "media_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public.content_tags(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: message_reactions message_reactions_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: message_reactions message_reactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT "message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_matchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_receiverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: photos photos_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT "photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_bookmarks post_bookmarks_collectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_bookmarks
    ADD CONSTRAINT "post_bookmarks_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES public.collections(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: post_bookmarks post_bookmarks_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_bookmarks
    ADD CONSTRAINT "post_bookmarks_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_bookmarks post_bookmarks_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_bookmarks
    ADD CONSTRAINT "post_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_comments post_comments_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT "post_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.post_comments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: post_comments post_comments_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT "post_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_comments post_comments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT "post_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_likes post_likes_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT "post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_likes post_likes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT "post_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_media post_media_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT "post_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_media post_media_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT "post_media_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_reports post_reports_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_reports
    ADD CONSTRAINT "post_reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_reports post_reports_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_reports
    ADD CONSTRAINT "post_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_shares post_shares_communityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_shares
    ADD CONSTRAINT "post_shares_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES public.communities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: post_shares post_shares_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_shares
    ADD CONSTRAINT "post_shares_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_shares post_shares_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_shares
    ADD CONSTRAINT "post_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_tags post_tags_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_tags
    ADD CONSTRAINT "post_tags_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_tags post_tags_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_tags
    ADD CONSTRAINT "post_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public.content_tags(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: posts posts_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: posts posts_communityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "posts_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES public.communities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: presence presence_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presence
    ADD CONSTRAINT "presence_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: privacy_settings privacy_settings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.privacy_settings
    ADD CONSTRAINT "privacy_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: profiles profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: push_notifications push_notifications_deviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_notifications
    ADD CONSTRAINT "push_notifications_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES public.devices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: push_notifications push_notifications_deviceTokenId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_notifications
    ADD CONSTRAINT "push_notifications_deviceTokenId_fkey" FOREIGN KEY ("deviceTokenId") REFERENCES public.device_tokens(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: push_notifications push_notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_notifications
    ADD CONSTRAINT "push_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reports reports_reportedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "reports_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reports reports_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: search_queries search_queries_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_queries
    ADD CONSTRAINT "search_queries_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stories stories_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT "stories_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stories stories_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT "stories_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: story_views story_views_storyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT "story_views_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES public.stories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: story_views story_views_viewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT "story_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: topic_subscriptions topic_subscriptions_deviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topic_subscriptions
    ADD CONSTRAINT "topic_subscriptions_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES public.devices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: topic_subscriptions topic_subscriptions_deviceTokenId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topic_subscriptions
    ADD CONSTRAINT "topic_subscriptions_deviceTokenId_fkey" FOREIGN KEY ("deviceTokenId") REFERENCES public.device_tokens(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: topic_subscriptions topic_subscriptions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topic_subscriptions
    ADD CONSTRAINT "topic_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_activities user_activities_presenceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activities
    ADD CONSTRAINT "user_activities_presenceId_fkey" FOREIGN KEY ("presenceId") REFERENCES public.presence(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_settings user_settings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: verifications verifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT "verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mv_daily_activity_metrics; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: postgres
--

REFRESH MATERIALIZED VIEW public.mv_daily_activity_metrics;


--
-- Name: mv_popular_content; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: postgres
--

REFRESH MATERIALIZED VIEW public.mv_popular_content;


--
-- Name: mv_user_engagement_metrics; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: postgres
--

REFRESH MATERIALIZED VIEW public.mv_user_engagement_metrics;


--
-- PostgreSQL database dump complete
--

\unrestrict HgUrqqjPHUHgF8DmPFhP9CDEuWGthsGEfTruscfaXEFitrOeGGvJn3PEiYvSDUP

--
-- PostgreSQL database cluster dump complete
--

