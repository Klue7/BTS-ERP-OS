-- CreateTable
CREATE TABLE "ProductFamily" (
    "key" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "categoryLabel" TEXT NOT NULL,
    "primaryCta" TEXT NOT NULL,
    "materialStory" JSONB NOT NULL,
    "technicalSpec" JSONB NOT NULL,
    "showcase" JSONB NOT NULL,
    "topSellers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductFamily_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "familyKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mood" TEXT,
    "category" TEXT,
    "subCategory" TEXT,
    "colorHex" TEXT,
    "priceText" TEXT,
    "description" TEXT NOT NULL,
    "region" TEXT,
    "imageUrls" JSONB NOT NULL,
    "specs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisualLabConfig" (
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "groutColors" JSONB NOT NULL,
    "layouts" JSONB NOT NULL,
    "lighting" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisualLabConfig_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Product_familyKey_idx" ON "Product"("familyKey");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_subCategory_idx" ON "Product"("subCategory");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_familyKey_fkey" FOREIGN KEY ("familyKey") REFERENCES "ProductFamily"("key") ON DELETE CASCADE ON UPDATE CASCADE;
