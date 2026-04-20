CREATE TYPE "ProductTestResultType" AS ENUM (
  'COMPRESSIVE_STRENGTH_MPA',
  'WATER_ABSORPTION_PERCENT',
  'LENGTH_MM_TESTED',
  'WIDTH_MM_TESTED',
  'HEIGHT_MM_TESTED',
  'DRY_MASS_KG',
  'WET_MASS_KG',
  'BREAKING_LOAD_KN'
);

ALTER TABLE "Product"
ADD COLUMN "latestTestReportUrl" TEXT,
ADD COLUMN "latestTestReportName" TEXT,
ADD COLUMN "latestTestLaboratoryName" TEXT,
ADD COLUMN "latestTestMethodStandard" TEXT,
ADD COLUMN "latestTestReportReference" TEXT,
ADD COLUMN "latestTestedAt" TIMESTAMP(3),
ADD COLUMN "latestTestIssuedAt" TIMESTAMP(3);

CREATE TABLE "ProductTestResult" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "resultType" "ProductTestResultType" NOT NULL,
  "resultValue" DECIMAL(12,4) NOT NULL,
  "resultUnit" TEXT NOT NULL,
  "notes" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductTestResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductTestResult_productId_resultType_key" ON "ProductTestResult"("productId", "resultType");
CREATE INDEX "ProductTestResult_productId_sortOrder_idx" ON "ProductTestResult"("productId", "sortOrder");

ALTER TABLE "ProductTestResult"
ADD CONSTRAINT "ProductTestResult_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
