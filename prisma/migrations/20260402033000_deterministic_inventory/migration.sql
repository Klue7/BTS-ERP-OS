-- CreateEnum
CREATE TYPE "ProductLifecycleStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "ProductPublishStatus" AS ENUM ('NOT_READY', 'READY', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('BRICK', 'TILE', 'PAVER', 'STONE', 'SLAB');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'ONBOARDING', 'DELAYED', 'RESTOCKING', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('SUPPLIER_ORIGIN', 'WAREHOUSE', 'CUSTOMER_DESTINATION');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('IMAGE', 'VIDEO', 'THREE_D_ASSET', 'THREE_D_RENDER', 'MODEL');

-- CreateEnum
CREATE TYPE "AssetProtectionLevel" AS ENUM ('PROTECTED_ORIGINAL', 'MANAGED_VARIANT', 'PUBLISHABLE_VARIANT');

-- CreateEnum
CREATE TYPE "AssetApprovalStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'ARCHIVED', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "AssetRole" AS ENUM ('HERO', 'GALLERY', 'INSTALLATION', 'DETAIL', 'CAMPAIGN', 'THREE_D_READY', 'MODEL', 'PUBLISHABLE_VARIANT', 'FACE_TEXTURE', 'DETAIL_TEXTURE', 'QUOTE_RENDER', 'MARKETING_VARIANT', 'MODEL_REFERENCE', 'RENDER', 'PBR_TEXTURE');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('RECEIPT', 'RESERVATION', 'RELEASE', 'ISSUE', 'RETURN', 'ADJUSTMENT', 'CANCELLATION');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GoodsReceiptStatus" AS ENUM ('PENDING', 'PARTIAL', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportSourceType" AS ENUM ('CSV', 'XLSX', 'JSON', 'MANUAL');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('STAGED', 'APPLIED', 'FAILED');

-- CreateEnum
CREATE TYPE "AssetLinkType" AS ENUM ('PRODUCT', 'CAMPAIGN');

-- CreateEnum
CREATE TYPE "ProductHistoryEventType" AS ENUM ('PRODUCT_CREATED', 'PRODUCT_UPDATED', 'STOCK_UPDATED', 'PRICE_ADJUSTED', 'STATUS_CHANGED', 'ASSET_APPROVED', 'LOW_STOCK_ALERT', 'CAMPAIGN_LINKED', 'IMPORT_APPLIED');

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_familyKey_fkey";

-- DropIndex
DROP INDEX "Product_category_idx";

-- DropIndex
DROP INDEX "Product_familyKey_idx";

-- DropIndex
DROP INDEX "Product_subCategory_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
DROP COLUMN "colorHex",
DROP COLUMN "familyKey",
DROP COLUMN "imageUrls",
DROP COLUMN "mood",
DROP COLUMN "priceText",
DROP COLUMN "region",
DROP COLUMN "specs",
DROP COLUMN "subCategory",
ADD COLUMN     "baseSellPrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "collectionName" TEXT,
ADD COLUMN     "commercialCategory" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'GBP',
ADD COLUMN     "dimensionsText" TEXT,
ADD COLUMN     "lifecycleStatus" "ProductLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "marketingCopy" TEXT,
ADD COLUMN     "presentationTags" TEXT[],
ADD COLUMN     "primaryImageUrl" TEXT NOT NULL,
ADD COLUMN     "productType" "ProductType" NOT NULL,
ADD COLUMN     "publishStatus" "ProductPublishStatus" NOT NULL DEFAULT 'NOT_READY',
ADD COLUMN     "referenceId" TEXT NOT NULL,
ADD COLUMN     "reorderPoint" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sku" TEXT NOT NULL,
ADD COLUMN     "technicalSpecifications" JSONB NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'm2',
ADD COLUMN     "weightKg" DECIMAL(10,2);

-- DropTable
DROP TABLE "ProductFamily";

-- DropTable
DROP TABLE "VisualLabConfig";

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "supplierKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "supplierType" "SupplierType" NOT NULL,
    "capabilities" TEXT[],
    "regionLabel" TEXT NOT NULL,
    "leadTimeDays" INTEGER,
    "leadTimeLabel" TEXT,
    "rating" DECIMAL(3,2),
    "blocker" TEXT,
    "contacts" JSONB,
    "terms" JSONB,
    "performance" JSONB,
    "workflowMilestones" JSONB,
    "orderSummary" JSONB,
    "historySummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FulfillmentLocation" (
    "id" TEXT NOT NULL,
    "locationKey" TEXT NOT NULL,
    "supplierId" TEXT,
    "type" "LocationType" NOT NULL,
    "label" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FulfillmentLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSupplier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "originLocationId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "leadTimeDays" INTEGER,
    "minimumOrderQuantity" INTEGER,
    "paymentTerms" TEXT,
    "incoterms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "movementKey" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "movementType" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "orderKey" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "originLocationId" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "orderedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderLine" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "receiptKey" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "status" "GoodsReceiptStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListImportBatch" (
    "id" TEXT NOT NULL,
    "batchKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sourceType" "ImportSourceType" NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'STAGED',
    "rowCount" INTEGER NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceListImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListImportRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productTypeLabel" TEXT NOT NULL,
    "commercialCategory" TEXT NOT NULL,
    "collectionName" TEXT,
    "description" TEXT,
    "sellPrice" DECIMAL(10,2),
    "unitCost" DECIMAL(10,2),
    "currency" TEXT,
    "unit" TEXT,
    "tags" TEXT[],
    "rawData" JSONB NOT NULL,
    "actionTaken" TEXT,
    "errorMessage" TEXT,
    "appliedProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceListImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAsset" (
    "id" TEXT NOT NULL,
    "assetKey" TEXT NOT NULL,
    "primaryProductId" TEXT,
    "name" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "protectionLevel" "AssetProtectionLevel" NOT NULL,
    "approvalStatus" "AssetApprovalStatus" NOT NULL,
    "sizeLabel" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "usageRoles" "AssetRole"[],
    "parentAssetId" TEXT,
    "completeness" INTEGER,
    "isThreeDReady" BOOLEAN NOT NULL DEFAULT false,
    "watermarkProfile" TEXT,
    "backgroundTransparent" BOOLEAN,
    "workflowNode" TEXT,
    "pipeline" JSONB,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetLink" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "linkType" "AssetLinkType" NOT NULL,
    "productId" TEXT,
    "campaignKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductHistoryEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "eventType" "ProductHistoryEventType" NOT NULL,
    "actionLabel" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "details" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductHistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsRateCard" (
    "id" TEXT NOT NULL,
    "rateKey" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "originLocationId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "costPerKm" DECIMAL(10,2) NOT NULL,
    "sellPricePerKm" DECIMAL(10,2) NOT NULL,
    "fixedFee" DECIMAL(10,2) NOT NULL,
    "minimumCharge" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogisticsRateCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsQuoteSnapshot" (
    "id" TEXT NOT NULL,
    "quoteKey" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "originLocationId" TEXT NOT NULL,
    "rateCardId" TEXT,
    "destinationLabel" TEXT NOT NULL,
    "distanceKm" DECIMAL(10,2) NOT NULL,
    "costPerKm" DECIMAL(10,2) NOT NULL,
    "sellPricePerKm" DECIMAL(10,2) NOT NULL,
    "fixedFee" DECIMAL(10,2) NOT NULL,
    "minimumCharge" DECIMAL(10,2) NOT NULL,
    "logisticsCost" DECIMAL(10,2) NOT NULL,
    "logisticsSellPrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogisticsQuoteSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_supplierKey_key" ON "Supplier"("supplierKey");

-- CreateIndex
CREATE INDEX "Supplier_status_idx" ON "Supplier"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FulfillmentLocation_locationKey_key" ON "FulfillmentLocation"("locationKey");

-- CreateIndex
CREATE INDEX "FulfillmentLocation_type_idx" ON "FulfillmentLocation"("type");

-- CreateIndex
CREATE UNIQUE INDEX "FulfillmentLocation_supplierId_label_key" ON "FulfillmentLocation"("supplierId", "label");

-- CreateIndex
CREATE INDEX "ProductSupplier_supplierId_idx" ON "ProductSupplier"("supplierId");

-- CreateIndex
CREATE INDEX "ProductSupplier_originLocationId_idx" ON "ProductSupplier"("originLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSupplier_productId_supplierId_key" ON "ProductSupplier"("productId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_movementKey_key" ON "StockMovement"("movementKey");

-- CreateIndex
CREATE INDEX "StockMovement_productId_occurredAt_idx" ON "StockMovement"("productId", "occurredAt");

-- CreateIndex
CREATE INDEX "StockMovement_movementType_idx" ON "StockMovement"("movementType");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderKey_key" ON "PurchaseOrder"("orderKey");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_orderedAt_idx" ON "PurchaseOrder"("supplierId", "orderedAt");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_productId_idx" ON "PurchaseOrderLine"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_receiptKey_key" ON "GoodsReceipt"("receiptKey");

-- CreateIndex
CREATE INDEX "GoodsReceipt_purchaseOrderId_idx" ON "GoodsReceipt"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListImportBatch_batchKey_key" ON "PriceListImportBatch"("batchKey");

-- CreateIndex
CREATE INDEX "PriceListImportRow_batchId_rowNumber_idx" ON "PriceListImportRow"("batchId", "rowNumber");

-- CreateIndex
CREATE INDEX "PriceListImportRow_sku_idx" ON "PriceListImportRow"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAsset_assetKey_key" ON "ProductAsset"("assetKey");

-- CreateIndex
CREATE INDEX "ProductAsset_primaryProductId_idx" ON "ProductAsset"("primaryProductId");

-- CreateIndex
CREATE INDEX "ProductAsset_approvalStatus_idx" ON "ProductAsset"("approvalStatus");

-- CreateIndex
CREATE INDEX "AssetLink_assetId_linkType_idx" ON "AssetLink"("assetId", "linkType");

-- CreateIndex
CREATE INDEX "AssetLink_productId_idx" ON "AssetLink"("productId");

-- CreateIndex
CREATE INDEX "AssetLink_campaignKey_idx" ON "AssetLink"("campaignKey");

-- CreateIndex
CREATE INDEX "ProductHistoryEvent_productId_occurredAt_idx" ON "ProductHistoryEvent"("productId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsRateCard_rateKey_key" ON "LogisticsRateCard"("rateKey");

-- CreateIndex
CREATE INDEX "LogisticsRateCard_supplierId_isActive_idx" ON "LogisticsRateCard"("supplierId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsQuoteSnapshot_quoteKey_key" ON "LogisticsQuoteSnapshot"("quoteKey");

-- CreateIndex
CREATE INDEX "LogisticsQuoteSnapshot_productId_createdAt_idx" ON "LogisticsQuoteSnapshot"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "LogisticsQuoteSnapshot_supplierId_idx" ON "LogisticsQuoteSnapshot"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_referenceId_key" ON "Product"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_productType_idx" ON "Product"("productType");

-- CreateIndex
CREATE INDEX "Product_commercialCategory_idx" ON "Product"("commercialCategory");

-- CreateIndex
CREATE INDEX "Product_lifecycleStatus_idx" ON "Product"("lifecycleStatus");

-- AddForeignKey
ALTER TABLE "FulfillmentLocation" ADD CONSTRAINT "FulfillmentLocation_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_originLocationId_fkey" FOREIGN KEY ("originLocationId") REFERENCES "FulfillmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_originLocationId_fkey" FOREIGN KEY ("originLocationId") REFERENCES "FulfillmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListImportRow" ADD CONSTRAINT "PriceListImportRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PriceListImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListImportRow" ADD CONSTRAINT "PriceListImportRow_appliedProductId_fkey" FOREIGN KEY ("appliedProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAsset" ADD CONSTRAINT "ProductAsset_primaryProductId_fkey" FOREIGN KEY ("primaryProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAsset" ADD CONSTRAINT "ProductAsset_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES "ProductAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetLink" ADD CONSTRAINT "AssetLink_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "ProductAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetLink" ADD CONSTRAINT "AssetLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductHistoryEvent" ADD CONSTRAINT "ProductHistoryEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsRateCard" ADD CONSTRAINT "LogisticsRateCard_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsRateCard" ADD CONSTRAINT "LogisticsRateCard_originLocationId_fkey" FOREIGN KEY ("originLocationId") REFERENCES "FulfillmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsQuoteSnapshot" ADD CONSTRAINT "LogisticsQuoteSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsQuoteSnapshot" ADD CONSTRAINT "LogisticsQuoteSnapshot_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsQuoteSnapshot" ADD CONSTRAINT "LogisticsQuoteSnapshot_originLocationId_fkey" FOREIGN KEY ("originLocationId") REFERENCES "FulfillmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsQuoteSnapshot" ADD CONSTRAINT "LogisticsQuoteSnapshot_rateCardId_fkey" FOREIGN KEY ("rateCardId") REFERENCES "LogisticsRateCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

