-- CreateEnum
CREATE TYPE "MessagePlatform" AS ENUM ('X_TWITTER', 'TELEGRAM', 'DISCORD', 'INTERNAL_GAME', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('TEXT', 'MEDIA', 'COMMAND', 'GAME_ACTION', 'SYSTEM_NOTIFICATION');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('AGENT', 'HUMAN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('AGENT', 'HUMAN', 'GROUP', 'BROADCAST');

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "platform" "MessagePlatform" NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "senderHandle" TEXT,
    "recipientId" TEXT,
    "recipientType" "RecipientType",
    "content" TEXT NOT NULL,
    "contentType" "MessageContentType" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "threadId" TEXT,
    "replyToId" TEXT,
    "relatedEntityId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "actionTaken" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Message_externalId_key" ON "Message"("externalId");

-- CreateIndex
CREATE INDEX "Message_platform_externalId_idx" ON "Message"("platform", "externalId");

-- CreateIndex
CREATE INDEX "Message_senderId_platform_idx" ON "Message"("senderId", "platform");
