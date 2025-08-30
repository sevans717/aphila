/*
  Warnings:

  - Added the required column `updatedAt` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."PresenceStatus" AS ENUM ('ONLINE', 'AWAY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('TYPING', 'VIEWING_PROFILE', 'VIEWING_MATCH', 'VIEWING_MESSAGE', 'VIEWING_POST', 'VIEWING_STORY', 'SEARCHING', 'EDITING_PROFILE', 'UPLOADING_MEDIA');

-- AlterTable
ALTER TABLE "public"."messages" ADD COLUMN     "clientNonce" TEXT,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "status" "public"."MessageStatus" NOT NULL DEFAULT 'SENT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."presence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."PresenceStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_activities" (
    "id" TEXT NOT NULL,
    "presenceId" TEXT NOT NULL,
    "type" "public"."ActivityType" NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "messageId" TEXT,
    "thumbnailUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "presence_userId_key" ON "public"."presence"("userId");

-- CreateIndex
CREATE INDEX "presence_status_idx" ON "public"."presence"("status");

-- CreateIndex
CREATE INDEX "presence_lastSeen_idx" ON "public"."presence"("lastSeen");

-- CreateIndex
CREATE INDEX "presence_isActive_idx" ON "public"."presence"("isActive");

-- CreateIndex
CREATE INDEX "user_activities_presenceId_idx" ON "public"."user_activities"("presenceId");

-- CreateIndex
CREATE INDEX "user_activities_type_idx" ON "public"."user_activities"("type");

-- CreateIndex
CREATE INDEX "user_activities_targetId_idx" ON "public"."user_activities"("targetId");

-- CreateIndex
CREATE INDEX "message_reactions_messageId_idx" ON "public"."message_reactions"("messageId");

-- CreateIndex
CREATE INDEX "message_reactions_userId_idx" ON "public"."message_reactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_reaction_key" ON "public"."message_reactions"("messageId", "userId", "reaction");

-- CreateIndex
CREATE INDEX "media_messageId_idx" ON "public"."media"("messageId");

-- CreateIndex
CREATE INDEX "messages_parentId_idx" ON "public"."messages"("parentId");

-- AddForeignKey
ALTER TABLE "public"."presence" ADD CONSTRAINT "presence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_activities" ADD CONSTRAINT "user_activities_presenceId_fkey" FOREIGN KEY ("presenceId") REFERENCES "public"."presence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_reactions" ADD CONSTRAINT "message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media" ADD CONSTRAINT "media_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
