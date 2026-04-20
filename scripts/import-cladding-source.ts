import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../prisma/client.ts';
import { getUploadsDirectory } from '../src/server/uploads.ts';

const SOURCE_ROOT = '/mnt/c/Users/rikus/OneDrive/Desktop/BTS-OS/Products/Cladding Tiles';
const SHARED_SPEC_PDF = path.join(SOURCE_ROOT, 'Brick Tile Shop Cladding Spesification Sheet.pdf');
const DEFAULT_DIMENSIONS = {
  lengthMm: 400,
  widthMm: 30,
  heightMm: 110,
  weightKg: 2.9,
  faceAreaM2: 0.044,
  unitsPerM2: 50,
};

type ImportedProductConfig = {
  publicSku: string;
  referenceId: string;
  folderName: string;
  name: string;
  collectionName: string;
  description: string;
  marketingCopy: string;
  sellPriceZar: number;
  unitCostZar: number;
  primary: string;
  gallery: string;
  face: string;
  hero: string;
  projects?: string[];
};

const PRODUCTS: ImportedProductConfig[] = [
  {
    publicSku: 'BTS-CLD-AUT-501',
    referenceId: 'PRD_501',
    folderName: 'Autumn',
    name: 'Autumn Cladding Tile',
    collectionName: 'Autumn',
    description:
      'Boasts a variety of rich colors from green to red, orange, yellow and brown, creating the grand finale to a perfect cladding space.',
    marketingCopy:
      'Autumn brings a layered seasonal palette into thin brick cladding, with warm tonal variation suited to high-impact feature walls and hospitality interiors.',
    sellPriceZar: 1245,
    unitCostZar: 790,
    primary: 'Autumn Brick Tile.jpg',
    gallery: 'Autumn Brick Tile.jpg',
    face: 'Autumn Face Brick Tile.jpg',
    hero: 'Autumn Thin Brick Skin.jpg',
  },
  {
    publicSku: 'BTS-CLD-KAL-502',
    referenceId: 'PRD_502',
    folderName: 'Kalahari',
    name: 'Kalahari Cladding Tile',
    collectionName: 'Kalahari',
    description:
      'Characterized by a relaxing warmth created by lush red tones, this cladding tile is intriguing and creates a beautiful place waiting to be enjoyed.',
    marketingCopy:
      'Kalahari leans into richer red-earth warmth for residential lounges, hospitality bars, and dramatic feature walls with a grounded African palette.',
    sellPriceZar: 1295,
    unitCostZar: 815,
    primary: 'Kalahari Thin Brick.png',
    gallery: 'Kalahari Brick Tile Kitchen By Brick Tile Shop.jpg',
    face: 'Kalahari1.png',
    hero: 'Kalahari Brick Tile Penthouse (By Brick Tile Shop).jpg',
    projects: [
      'Kalahari Brick Tile Fireplace By Brick Tile Shop.jpg',
      'Kalahari Brick Tile Reception (By Brick Tile Shop).jpg',
      'Kalahari Face Brick Cladding in Bedroom (By Brick Tile Shop).jpg',
      'Kalahari Brick Wall Tiles Outside (By Brick Tile Shop).jpg',
    ],
  },
  {
    publicSku: 'BTS-CLD-AGA-503',
    referenceId: 'PRD_503',
    folderName: 'Agate',
    name: 'Agate Cladding Tile',
    collectionName: 'Agate',
    description:
      'Agate cladding tile imported from the local source image library. Curated imagery is wired; descriptive and technical copy can be refined in the inventory drawer.',
    marketingCopy:
      'Agate reads cleaner and more polished in close-up applications, making it a useful live test SKU for storefront imagery, specs, and quote flows.',
    sellPriceZar: 1265,
    unitCostZar: 805,
    primary: 'Agate Brick Tile.jpg',
    gallery: 'Agate Brick Tile for Sale.jpg',
    face: 'Agate Satin Brick Tile.jpg',
    hero: 'Agate Thin Brick.jpg',
    projects: ['Agate Brick Slips.jpg'],
  },
];

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function copyToUploads(sourcePath: string, targetName: string) {
  const uploads = getUploadsDirectory();
  const destinationPath = path.join(uploads, targetName);
  await fs.copyFile(sourcePath, destinationPath);
  return `/api/uploads/${targetName}`;
}

async function resolveSourceFile(folder: string, filename: string) {
  const directPath = path.join(folder, filename);

  try {
    await fs.access(directPath);
    return directPath;
  } catch {
    const entries = await fs.readdir(folder, { recursive: true });
    const normalizedTarget = filename.toLowerCase();
    const matched = entries.find((entry) => entry.toString().toLowerCase() === normalizedTarget);
    if (matched) {
      return path.join(folder, matched.toString());
    }

    const basenameMatch = entries.find((entry) => path.basename(entry.toString()).toLowerCase() === normalizedTarget);
    if (basenameMatch) {
      return path.join(folder, basenameMatch.toString());
    }

    throw new Error(`Unable to resolve "${filename}" under "${folder}".`);
  }
}

async function importProduct(config: ImportedProductConfig, supplierId: string, originLocationId: string, reportUrl: string) {
  const folder = path.join(SOURCE_ROOT, config.folderName);
  const primaryPath = await resolveSourceFile(folder, config.primary);
  const galleryPath = await resolveSourceFile(folder, config.gallery);
  const facePath = await resolveSourceFile(folder, config.face);
  const heroPath = await resolveSourceFile(folder, config.hero);
  const primaryUrl = await copyToUploads(primaryPath, `${slug(config.folderName)}-primary${path.extname(primaryPath).toLowerCase()}`);
  const galleryUrl = await copyToUploads(galleryPath, `${slug(config.folderName)}-gallery${path.extname(galleryPath).toLowerCase()}`);
  const faceUrl = await copyToUploads(facePath, `${slug(config.folderName)}-face${path.extname(facePath).toLowerCase()}`);
  const heroUrl = await copyToUploads(heroPath, `${slug(config.folderName)}-hero${path.extname(heroPath).toLowerCase()}`);
  const projectUrls = await Promise.all(
    (config.projects ?? []).map(async (filename, index) => {
      const sourcePath = await resolveSourceFile(folder, filename);
      return copyToUploads(sourcePath, `${slug(config.folderName)}-project-${index + 1}${path.extname(sourcePath).toLowerCase()}`);
    },
    ),
  );

  const product = await prisma.product.upsert({
    where: { publicSku: config.publicSku },
    update: {
      referenceId: config.referenceId,
      name: config.name,
      category: 'CLADDING',
      productType: 'NATURAL',
      finish: null,
      collectionName: config.collectionName,
      presentationTags: ['Cladding', config.collectionName, 'Local Source Import'],
      lifecycleStatus: 'ACTIVE',
      publishStatus: 'PUBLISHED',
      inventoryMode: 'DROPSHIP',
      availabilityStatus: 'READY_TO_PROCURE',
      pricingUnit: 'M2',
      sellPriceZar: config.sellPriceZar,
      primaryImageUrl: primaryUrl,
      galleryImageUrl: galleryUrl,
      faceImageUrl: faceUrl,
      heroImageUrl: heroUrl,
      latestTestReportUrl: reportUrl,
      latestTestReportName: 'Brick Tile Shop Cladding Spesification Sheet.pdf',
      latestTestLaboratoryName: 'Brick Tile Shop Source Library',
      latestTestMethodStandard: 'Shared cladding specification sheet',
      latestTestReportReference: `${config.publicSku}-SOURCE-CLADDING-PDF`,
      description: config.description,
      marketingCopy: config.marketingCopy,
      technicalSpecifications: {
        Material: 'Clay Brick Tile',
        Use: 'Wall Cladding',
        Source: 'Desktop Local Source Import',
        SourceFolder: config.folderName,
      },
      lengthMm: DEFAULT_DIMENSIONS.lengthMm,
      widthMm: DEFAULT_DIMENSIONS.widthMm,
      heightMm: DEFAULT_DIMENSIONS.heightMm,
      coverageOrientation: 'LENGTH_X_HEIGHT',
      faceAreaM2: DEFAULT_DIMENSIONS.faceAreaM2,
      unitsPerM2: DEFAULT_DIMENSIONS.unitsPerM2,
      weightKg: DEFAULT_DIMENSIONS.weightKg,
      piecesPerPallet: 2000,
      boxesPerPallet: 40,
      palletsPerTruck: 24,
      reorderPoint: 0,
    },
    create: {
      referenceId: config.referenceId,
      publicSku: config.publicSku,
      name: config.name,
      category: 'CLADDING',
      productType: 'NATURAL',
      finish: null,
      collectionName: config.collectionName,
      presentationTags: ['Cladding', config.collectionName, 'Local Source Import'],
      lifecycleStatus: 'ACTIVE',
      publishStatus: 'PUBLISHED',
      inventoryMode: 'DROPSHIP',
      availabilityStatus: 'READY_TO_PROCURE',
      pricingUnit: 'M2',
      sellPriceZar: config.sellPriceZar,
      primaryImageUrl: primaryUrl,
      galleryImageUrl: galleryUrl,
      faceImageUrl: faceUrl,
      heroImageUrl: heroUrl,
      latestTestReportUrl: reportUrl,
      latestTestReportName: 'Brick Tile Shop Cladding Spesification Sheet.pdf',
      latestTestLaboratoryName: 'Brick Tile Shop Source Library',
      latestTestMethodStandard: 'Shared cladding specification sheet',
      latestTestReportReference: `${config.publicSku}-SOURCE-CLADDING-PDF`,
      description: config.description,
      marketingCopy: config.marketingCopy,
      technicalSpecifications: {
        Material: 'Clay Brick Tile',
        Use: 'Wall Cladding',
        Source: 'Desktop Local Source Import',
        SourceFolder: config.folderName,
      },
      lengthMm: DEFAULT_DIMENSIONS.lengthMm,
      widthMm: DEFAULT_DIMENSIONS.widthMm,
      heightMm: DEFAULT_DIMENSIONS.heightMm,
      coverageOrientation: 'LENGTH_X_HEIGHT',
      faceAreaM2: DEFAULT_DIMENSIONS.faceAreaM2,
      unitsPerM2: DEFAULT_DIMENSIONS.unitsPerM2,
      weightKg: DEFAULT_DIMENSIONS.weightKg,
      piecesPerPallet: 2000,
      boxesPerPallet: 40,
      palletsPerTruck: 24,
      reorderPoint: 0,
    },
  });

  await prisma.productSupplier.deleteMany({
    where: { productId: product.id },
  });

  await prisma.productSupplier.create({
    data: {
      productId: product.id,
      supplierId,
      originLocationId,
      isDefault: true,
      unitCostZar: config.unitCostZar,
      leadTimeDays: 7,
      minimumOrderQuantity: 1,
      paymentTerms: 'Quote Paid',
      incoterms: 'EXW',
    },
  });

  await prisma.productAsset.deleteMany({
    where: { primaryProductId: product.id },
  });

  const assets = [
    {
      assetKey: `${config.referenceId}_PRIMARY`,
      name: `${config.name} Primary`,
      imageUrl: primaryUrl,
      usageRoles: ['PRIMARY_IMAGE'],
    },
    {
      assetKey: `${config.referenceId}_GALLERY`,
      name: `${config.name} Gallery`,
      imageUrl: galleryUrl,
      usageRoles: ['GALLERY_IMAGE'],
    },
    {
      assetKey: `${config.referenceId}_FACE`,
      name: `${config.name} Face`,
      imageUrl: faceUrl,
      usageRoles: ['FACE_IMAGE'],
    },
    {
      assetKey: `${config.referenceId}_HERO`,
      name: `${config.name} Hero`,
      imageUrl: heroUrl,
      usageRoles: ['HERO_IMAGE'],
    },
    ...projectUrls.map((imageUrl, index) => ({
      assetKey: `${config.referenceId}_PROJECT_${index + 1}`,
      name: `${config.name} Project ${index + 1}`,
      imageUrl,
      usageRoles: ['PROJECT_IMAGE'],
    })),
  ];

  for (const asset of assets) {
    await prisma.productAsset.create({
      data: {
        assetKey: asset.assetKey,
        primaryProductId: product.id,
        name: asset.name,
        assetType: 'IMAGE',
        assetSource: 'DIRECT_UPLOAD',
        protectionLevel: 'PUBLISHABLE_VARIANT',
        approvalStatus: 'APPROVED',
        sizeLabel: 'Local Source Import',
        imageUrl: asset.imageUrl,
        usageRoles: asset.usageRoles as any,
        tags: ['Cladding', config.collectionName, 'Local Source Import'],
      },
    });
  }

  await prisma.productHistoryEvent.create({
    data: {
      productId: product.id,
      eventType: 'PRODUCT_UPDATED',
      actionLabel: 'Local Source Imported',
      userName: 'Local Source Import',
      details: `Imported from Desktop source folder "${config.folderName}"`,
      occurredAt: new Date(),
    },
  });

  return product.publicSku;
}

async function main() {
  const supplier = await prisma.supplier.findUnique({
    where: { supplierKey: 'VND_001' },
    include: { locations: true },
  });

  if (!supplier || !supplier.locations[0]) {
    throw new Error('Supplier VND_001 with an origin location is required before importing local cladding data.');
  }

  const reportUrl = await copyToUploads(SHARED_SPEC_PDF, 'source-cladding-shared-spec-sheet.pdf');

  await prisma.product.updateMany({
    where: {
      category: 'CLADDING',
      publicSku: {
        notIn: PRODUCTS.map((product) => product.publicSku),
      },
    },
    data: {
      publishStatus: 'READY',
    },
  });

  const importedSkus: string[] = [];
  for (const product of PRODUCTS) {
    importedSkus.push(await importProduct(product, supplier.id, supplier.locations[0].id, reportUrl));
  }

  console.log(
    JSON.stringify(
      {
        imported: importedSkus,
        reportUrl,
        sourceRoot: SOURCE_ROOT,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
