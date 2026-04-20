CREATE TYPE "ProductDistributionChannel" AS ENUM ('META_CATALOG', 'WHATSAPP_CATALOG', 'GOOGLE_MERCHANT_CENTER', 'TIKTOK_SHOP');
CREATE TYPE "DistributionChannelType" AS ENUM ('CATALOG', 'MARKETPLACE', 'MESSAGING');
CREATE TYPE "DistributionConnectionStatus" AS ENUM ('NOT_CONNECTED', 'CONNECTED', 'DEGRADED', 'ERROR');
CREATE TYPE "DistributionPublicationStatus" AS ENUM ('NOT_POSTED', 'QUEUED', 'SYNCING', 'LIVE', 'PAUSED', 'FAILED', 'ARCHIVED');
CREATE TYPE "DistributionSyncMode" AS ENUM ('MANUAL', 'API');

CREATE TABLE "ProductDistributionPublication" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "channel" "ProductDistributionChannel" NOT NULL,
    "channelType" "DistributionChannelType" NOT NULL,
    "connectionStatus" "DistributionConnectionStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "publicationStatus" "DistributionPublicationStatus" NOT NULL DEFAULT 'NOT_POSTED',
    "syncMode" "DistributionSyncMode" NOT NULL DEFAULT 'MANUAL',
    "externalCatalogId" TEXT,
    "externalListingId" TEXT,
    "externalUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "publishedAt" TIMESTAMP(3),
    "unpublishedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductDistributionPublication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductDistributionPublication_productId_channel_key" ON "ProductDistributionPublication"("productId", "channel");
CREATE INDEX "ProductDistributionPublication_channel_idx" ON "ProductDistributionPublication"("channel");
CREATE INDEX "ProductDistributionPublication_publicationStatus_idx" ON "ProductDistributionPublication"("publicationStatus");

ALTER TABLE "ProductDistributionPublication"
ADD CONSTRAINT "ProductDistributionPublication_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
