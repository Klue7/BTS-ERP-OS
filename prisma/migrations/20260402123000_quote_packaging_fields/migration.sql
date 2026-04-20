ALTER TABLE "Product"
ADD COLUMN "piecesPerPallet" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "palletsPerTruck" INTEGER NOT NULL DEFAULT 24;

ALTER TABLE "PriceListImportRow"
ADD COLUMN "piecesPerPallet" INTEGER,
ADD COLUMN "palletsPerTruck" INTEGER;

UPDATE "Product"
SET "piecesPerPallet" = CASE
  WHEN "category" = 'BRICKS' THEN 500
  WHEN "category" = 'PAVING' THEN 360
  WHEN "category" = 'BLOCKS' THEN 100
  ELSE 2080
END
WHERE "piecesPerPallet" = 1;

UPDATE "Product"
SET "palletsPerTruck" = 24
WHERE "palletsPerTruck" IS NULL OR "palletsPerTruck" <= 0;
