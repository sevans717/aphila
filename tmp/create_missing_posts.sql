CREATE TABLE IF NOT EXISTS public.posts (
  id text PRIMARY KEY,
  authorId text NOT NULL,
  communityId text,
  content text,
  type text NOT NULL DEFAULT 'REGULAR',
  visibility text NOT NULL DEFAULT 'PUBLIC',
  likesCount integer NOT NULL DEFAULT 0,
  commentsCount integer NOT NULL DEFAULT 0,
  sharesCount integer NOT NULL DEFAULT 0,
  viewsCount integer NOT NULL DEFAULT 0,
  isEdited boolean NOT NULL DEFAULT false,
  editedAt timestamp(3),
  isPinned boolean NOT NULL DEFAULT false,
  isArchived boolean NOT NULL DEFAULT false,
  createdAt timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.post_likes (
  id text PRIMARY KEY,
  userId text NOT NULL,
  postId text NOT NULL,
  type text NOT NULL DEFAULT 'LIKE',
  createdAt timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_likes_postId_fkey') THEN
    ALTER TABLE public.post_likes ADD CONSTRAINT post_likes_postId_fkey FOREIGN KEY (postId) REFERENCES public.posts(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_likes_userId_fkey') THEN
    ALTER TABLE public.post_likes ADD CONSTRAINT post_likes_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
