ALTER TABLE "Product"
ADD COLUMN "boxesPerPallet" INTEGER;

ALTER TABLE "PriceListImportRow"
ADD COLUMN "boxesPerPallet" INTEGER;

ALTER TABLE "LogisticsQuoteSnapshot"
ADD COLUMN "distanceSource" TEXT NOT NULL DEFAULT 'fallback';

UPDATE "Product"
SET "boxesPerPallet" = CASE
  WHEN "category" = 'CLADDING' AND "boxesPerPallet" IS NULL THEN 40
  ELSE "boxesPerPallet"
END;
