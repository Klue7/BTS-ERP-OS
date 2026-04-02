-- Reset disposable bootstrap inventory data before normalizing the schema.
TRUNCATE TABLE
  "LogisticsQuoteSnapshot",
  "AssetLink",
  "ProductAsset",
  "PriceListImportRow",
  "PriceListImportBatch",
  "GoodsReceipt",
  "PurchaseOrderLine",
  "PurchaseOrder",
  "StockMovement",
  "ProductHistoryEvent",
  "ProductSupplier",
  "Product"
RESTART IDENTITY CASCADE;

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('CLADDING', 'BRICKS', 'PAVING', 'BLOCKS');

-- CreateEnum
CREATE TYPE "ProductFinish" AS ENUM ('TRAVERTINE', 'RIBBED', 'SMOOTH', 'SATIN', 'RUSTIC', 'VARIATION');

-- CreateEnum
CREATE TYPE "InventoryMode" AS ENUM ('DROPSHIP');

-- CreateEnum
CREATE TYPE "ProductAvailabilityStatus" AS ENUM ('READY_TO_PROCURE', 'SUPPLIER_DELAYED', 'SUPPLIER_ONBOARDING', 'MISSING_SUPPLIER');

-- CreateEnum
CREATE TYPE "PricingUnit" AS ENUM ('M2', 'PIECE', 'PALLET');

-- CreateEnum
CREATE TYPE "CoverageOrientation" AS ENUM ('LENGTH_X_WIDTH', 'LENGTH_X_HEIGHT', 'WIDTH_X_HEIGHT');

-- CreateEnum
CREATE TYPE "AssetSource" AS ENUM ('DIRECT_UPLOAD', 'ASSET_LIBRARY', 'MARKETING_TOOL', 'COMMUNITY_SUBMISSION', 'STUDIO_PUBLISHED');

-- AlterEnum
BEGIN;
CREATE TYPE "AssetRole_new" AS ENUM ('PRIMARY_IMAGE', 'GALLERY_IMAGE', 'FACE_IMAGE', 'HERO_IMAGE', 'ASSET_2_5D', 'ASSET_3D', 'PROJECT_IMAGE', 'GENERATED_IMAGE', 'GALLERY_EXTRA', 'INSTALLATION', 'DETAIL', 'CAMPAIGN');
ALTER TABLE "ProductAsset" ALTER COLUMN "usageRoles" TYPE "AssetRole_new"[] USING ("usageRoles"::text::"AssetRole_new"[]);
ALTER TYPE "AssetRole" RENAME TO "AssetRole_old";
ALTER TYPE "AssetRole_new" RENAME TO "AssetRole";
DROP TYPE "public"."AssetRole_old";
COMMIT;

-- AlterEnum
ALTER TYPE "AssetType" ADD VALUE 'TWO_POINT_FIVE_D_ASSET';

-- AlterEnum
BEGIN;
CREATE TYPE "ProductHistoryEventType_new" AS ENUM ('PRODUCT_CREATED', 'PRODUCT_UPDATED', 'STOCK_UPDATED', 'PRICE_ADJUSTED', 'STATUS_CHANGED', 'ASSET_ATTACHED', 'PROCUREMENT_TRIGGERED', 'IMPORT_APPLIED');
ALTER TABLE "ProductHistoryEvent" ALTER COLUMN "eventType" TYPE "ProductHistoryEventType_new" USING ("eventType"::text::"ProductHistoryEventType_new");
ALTER TYPE "ProductHistoryEventType" RENAME TO "ProductHistoryEventType_old";
ALTER TYPE "ProductHistoryEventType_new" RENAME TO "ProductHistoryEventType";
DROP TYPE "public"."ProductHistoryEventType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProductType_new" AS ENUM ('CLASSIC', 'MODERN', 'NATURAL', 'PREMIUM', 'NFP', 'NFX', 'FBA', 'FBS', 'FBX', 'MAXI', 'BEVEL', 'SPLIT_BEVEL', 'INTERLOCKING', 'CEMENT', 'BREEZE', 'CLAY');
ALTER TABLE "Product" ALTER COLUMN "productType" TYPE "ProductType_new" USING ("productType"::text::"ProductType_new");
ALTER TYPE "ProductType" RENAME TO "ProductType_old";
ALTER TYPE "ProductType_new" RENAME TO "ProductType";
DROP TYPE "public"."ProductType_old";
COMMIT;

-- DropIndex
DROP INDEX "PriceListImportRow_sku_idx";

-- DropIndex
DROP INDEX "Product_commercialCategory_idx";

-- DropIndex
DROP INDEX "Product_sku_key";

-- AlterTable
ALTER TABLE "LogisticsQuoteSnapshot" ALTER COLUMN "currency" SET DEFAULT 'ZAR';

-- AlterTable
ALTER TABLE "LogisticsRateCard" ALTER COLUMN "currency" SET DEFAULT 'ZAR';

-- AlterTable
ALTER TABLE "PriceListImportRow" DROP COLUMN "commercialCategory",
DROP COLUMN "currency",
DROP COLUMN "sellPrice",
DROP COLUMN "sku",
DROP COLUMN "unit",
DROP COLUMN "unitCost",
ADD COLUMN     "categoryLabel" TEXT NOT NULL,
ADD COLUMN     "faceImageUrl" TEXT,
ADD COLUMN     "finishLabel" TEXT,
ADD COLUMN     "galleryImageUrl" TEXT,
ADD COLUMN     "heightMm" INTEGER,
ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "lengthMm" INTEGER,
ADD COLUMN     "linkedSupplierKey" TEXT,
ADD COLUMN     "pricingUnit" TEXT,
ADD COLUMN     "primaryImageUrl" TEXT,
ADD COLUMN     "publicSku" TEXT NOT NULL,
ADD COLUMN     "sellPriceZar" DECIMAL(10,2),
ADD COLUMN     "unitCostZar" DECIMAL(10,2),
ADD COLUMN     "weightKg" DECIMAL(10,3),
ADD COLUMN     "widthMm" INTEGER;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "baseSellPrice",
DROP COLUMN "commercialCategory",
DROP COLUMN "currency",
DROP COLUMN "dimensionsText",
DROP COLUMN "sku",
DROP COLUMN "unit",
ADD COLUMN     "availabilityStatus" "ProductAvailabilityStatus" NOT NULL DEFAULT 'MISSING_SUPPLIER',
ADD COLUMN     "category" "ProductCategory" NOT NULL,
ADD COLUMN     "coverageOrientation" "CoverageOrientation",
ADD COLUMN     "faceAreaM2" DECIMAL(10,4),
ADD COLUMN     "faceImageUrl" TEXT,
ADD COLUMN     "finish" "ProductFinish",
ADD COLUMN     "galleryImageUrl" TEXT,
ADD COLUMN     "heightMm" INTEGER,
ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "inventoryMode" "InventoryMode" NOT NULL DEFAULT 'DROPSHIP',
ADD COLUMN     "lengthMm" INTEGER,
ADD COLUMN     "pricingUnit" "PricingUnit" NOT NULL DEFAULT 'M2',
ADD COLUMN     "publicSku" TEXT NOT NULL,
ADD COLUMN     "sellPriceZar" DECIMAL(10,2),
ADD COLUMN     "unitsPerM2" DECIMAL(10,4),
ADD COLUMN     "widthMm" INTEGER,
ALTER COLUMN "primaryImageUrl" DROP NOT NULL,
ALTER COLUMN "weightKg" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "ProductAsset" ADD COLUMN     "assetSource" "AssetSource" NOT NULL DEFAULT 'DIRECT_UPLOAD';

-- AlterTable
ALTER TABLE "ProductSupplier" DROP COLUMN "currency",
DROP COLUMN "unitCost",
ADD COLUMN     "unitCostZar" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "triggerReference" TEXT,
ADD COLUMN     "triggerSource" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'ZAR';

-- AlterTable
ALTER TABLE "PurchaseOrderLine" DROP COLUMN "totalCost",
DROP COLUMN "unitCost",
ADD COLUMN     "totalCostZar" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "unitCostZar" DECIMAL(10,2) NOT NULL;

-- CreateIndex
CREATE INDEX "PriceListImportRow_publicSku_idx" ON "PriceListImportRow"("publicSku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_publicSku_key" ON "Product"("publicSku");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_availabilityStatus_idx" ON "Product"("availabilityStatus");
