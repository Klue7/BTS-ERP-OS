import { Prisma } from '../generated/prisma/client';
import { prisma } from './client.ts';
import { inventorySeedFixtures } from '../src/inventory/fixtures.ts';

const categoryMap = {
  Cladding: 'CLADDING',
  Bricks: 'BRICKS',
  Paving: 'PAVING',
  Blocks: 'BLOCKS',
} as const;

const productTypeMap = {
  Classic: 'CLASSIC',
  Modern: 'MODERN',
  Natural: 'NATURAL',
  Premium: 'PREMIUM',
  NFP: 'NFP',
  NFX: 'NFX',
  FBA: 'FBA',
  FBS: 'FBS',
  FBX: 'FBX',
  Maxi: 'MAXI',
  Bevel: 'BEVEL',
  'Split-Bevel': 'SPLIT_BEVEL',
  Interlocking: 'INTERLOCKING',
  Cement: 'CEMENT',
  Breeze: 'BREEZE',
  Clay: 'CLAY',
} as const;

const finishMap = {
  Travertine: 'TRAVERTINE',
  Ribbed: 'RIBBED',
  Smooth: 'SMOOTH',
  Satin: 'SATIN',
  Rustic: 'RUSTIC',
  Variation: 'VARIATION',
} as const;

const lifecycleStatusMap = {
  Active: 'ACTIVE',
  Draft: 'DRAFT',
  Archived: 'ARCHIVED',
  'Out of Stock': 'OUT_OF_STOCK',
} as const;

const publishStatusMap = {
  'Not Ready': 'NOT_READY',
  Ready: 'READY',
  Published: 'PUBLISHED',
} as const;

const pricingUnitMap = {
  m2: 'M2',
  piece: 'PIECE',
  pallet: 'PALLET',
} as const;

const coverageOrientationMap = {
  'Length x Width': 'LENGTH_X_WIDTH',
  'Length x Height': 'LENGTH_X_HEIGHT',
  'Width x Height': 'WIDTH_X_HEIGHT',
} as const;

const supplierStatusMap = {
  Active: 'ACTIVE',
  Onboarding: 'ONBOARDING',
  Delayed: 'DELAYED',
  Restocking: 'RESTOCKING',
  Inactive: 'INACTIVE',
} as const;

const supplierTypeMap = {
  Manufacturer: 'MANUFACTURER',
  Distributor: 'DISTRIBUTOR',
  Wholesaler: 'WHOLESALER',
} as const;

const locationTypeMap = {
  'Supplier Origin': 'SUPPLIER_ORIGIN',
  Warehouse: 'WAREHOUSE',
  'Customer Destination': 'CUSTOMER_DESTINATION',
} as const;

const purchaseOrderStatusMap = {
  Draft: 'DRAFT',
  Sent: 'SENT',
  Confirmed: 'CONFIRMED',
  Shipped: 'SHIPPED',
  Delivered: 'DELIVERED',
  Cancelled: 'CANCELLED',
} as const;

const goodsReceiptStatusMap = {
  Pending: 'PENDING',
  Partial: 'PARTIAL',
  Received: 'RECEIVED',
  Cancelled: 'CANCELLED',
} as const;

const assetTypeMap = {
  Image: 'IMAGE',
  Video: 'VIDEO',
  '2.5D Asset': 'TWO_POINT_FIVE_D_ASSET',
  '3D Asset': 'THREE_D_ASSET',
  '3D Render': 'THREE_D_RENDER',
  Model: 'MODEL',
} as const;

const assetProtectionMap = {
  'Protected Original': 'PROTECTED_ORIGINAL',
  'Managed Variant': 'MANAGED_VARIANT',
  'Publishable Variant': 'PUBLISHABLE_VARIANT',
} as const;

const assetStatusMap = {
  Draft: 'DRAFT',
  Review: 'REVIEW',
  Approved: 'APPROVED',
  Archived: 'ARCHIVED',
  Restricted: 'RESTRICTED',
} as const;

const assetSourceMap = {
  'Direct Upload': 'DIRECT_UPLOAD',
  'Asset Library': 'ASSET_LIBRARY',
  'Marketing Tool': 'MARKETING_TOOL',
  'Community Submission': 'COMMUNITY_SUBMISSION',
  'Studio Published': 'STUDIO_PUBLISHED',
} as const;

const assetRoleMap = {
  primary_image: 'PRIMARY_IMAGE',
  gallery_image: 'GALLERY_IMAGE',
  face_image: 'FACE_IMAGE',
  hero_image: 'HERO_IMAGE',
  asset_2_5d: 'ASSET_2_5D',
  asset_3d: 'ASSET_3D',
  project_image: 'PROJECT_IMAGE',
  generated_image: 'GENERATED_IMAGE',
  gallery_extra: 'GALLERY_EXTRA',
  installation: 'INSTALLATION',
  detail: 'DETAIL',
  campaign: 'CAMPAIGN',
} as const;

const productHistoryEventTypeMap = {
  'Product Created': 'PRODUCT_CREATED',
  'Product Updated': 'PRODUCT_UPDATED',
  'Stock Updated': 'STOCK_UPDATED',
  'Price Adjusted': 'PRICE_ADJUSTED',
  'Status Changed': 'STATUS_CHANGED',
  'Asset Attached': 'ASSET_ATTACHED',
  'Procurement Triggered': 'PROCUREMENT_TRIGGERED',
  'Import Applied': 'IMPORT_APPLIED',
} as const;

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function deriveCoverageMetrics(dimensions: {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  coverageOrientation: keyof typeof coverageOrientationMap;
}) {
  let coverageFace = dimensions.lengthMm * dimensions.widthMm;

  if (dimensions.coverageOrientation === 'Length x Height') {
    coverageFace = dimensions.lengthMm * dimensions.heightMm;
  } else if (dimensions.coverageOrientation === 'Width x Height') {
    coverageFace = dimensions.widthMm * dimensions.heightMm;
  }

  const faceAreaM2 = coverageFace / 1_000_000;
  const unitsPerM2 = faceAreaM2 > 0 ? 1 / faceAreaM2 : 0;

  return {
    faceAreaM2: Number(faceAreaM2.toFixed(4)),
    unitsPerM2: Number(unitsPerM2.toFixed(4)),
  };
}

function mapAvailabilityStatus(status: keyof typeof supplierStatusMap) {
  switch (status) {
    case 'Active':
      return 'READY_TO_PROCURE' as const;
    case 'Onboarding':
      return 'SUPPLIER_ONBOARDING' as const;
    case 'Delayed':
    case 'Restocking':
      return 'SUPPLIER_DELAYED' as const;
    default:
      return 'MISSING_SUPPLIER' as const;
  }
}

async function clearDatabase() {
  await prisma.$transaction([
    prisma.logisticsQuoteSnapshot.deleteMany(),
    prisma.assetLink.deleteMany(),
    prisma.productAsset.deleteMany(),
    prisma.priceListImportRow.deleteMany(),
    prisma.priceListImportBatch.deleteMany(),
    prisma.goodsReceipt.deleteMany(),
    prisma.purchaseOrderLine.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.stockMovement.deleteMany(),
    prisma.productHistoryEvent.deleteMany(),
    prisma.productSupplier.deleteMany(),
    prisma.logisticsRateCard.deleteMany(),
    prisma.fulfillmentLocation.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.product.deleteMany(),
  ]);
}

async function main() {
  await clearDatabase();

  const supplierIdsByKey = new Map<string, string>();
  const locationIdsByKey = new Map<string, string>();
  const supplierStatusByKey = new Map<string, keyof typeof supplierStatusMap>();
  const productIdsByReference = new Map<string, string>();
  const productIdsByPublicSku = new Map<string, string>();

  for (const supplierFixture of inventorySeedFixtures.suppliers) {
    const supplier = await prisma.supplier.create({
      data: {
        supplierKey: supplierFixture.key,
        name: supplierFixture.name,
        logoUrl: supplierFixture.logo,
        status: supplierStatusMap[supplierFixture.status],
        supplierType: supplierTypeMap[supplierFixture.type],
        capabilities: [...supplierFixture.capabilities],
        regionLabel: supplierFixture.region,
        leadTimeDays: supplierFixture.leadTimeDays || null,
        leadTimeLabel: supplierFixture.leadTimeLabel,
        rating: supplierFixture.rating || null,
        blocker: supplierFixture.blocker,
        contacts: asJson(supplierFixture.contacts),
        terms: asJson(supplierFixture.terms),
        performance: asJson(supplierFixture.performance),
        workflowMilestones: asJson(supplierFixture.workflowMilestones),
        orderSummary: asJson(supplierFixture.orders),
        historySummary: asJson(supplierFixture.history),
      },
    });

    supplierIdsByKey.set(supplierFixture.key, supplier.id);
    supplierStatusByKey.set(supplierFixture.key, supplierFixture.status);

    for (const locationFixture of supplierFixture.locations) {
      const location = await prisma.fulfillmentLocation.create({
        data: {
          locationKey: locationFixture.key,
          supplierId: supplier.id,
          type: locationTypeMap[locationFixture.type],
          label: locationFixture.label,
          country: locationFixture.country,
          region: locationFixture.region,
          city: locationFixture.city,
          latitude: locationFixture.latitude ?? null,
          longitude: locationFixture.longitude ?? null,
        },
      });

      locationIdsByKey.set(locationFixture.key, location.id);
    }
  }

  for (const rateCardFixture of inventorySeedFixtures.logisticsRateCards) {
    await prisma.logisticsRateCard.create({
      data: {
        rateKey: rateCardFixture.key,
        supplierId: supplierIdsByKey.get(rateCardFixture.supplierKey)!,
        originLocationId: locationIdsByKey.get(rateCardFixture.locationKey)!,
        currency: rateCardFixture.currency,
        costPerKm: rateCardFixture.costPerKm,
        sellPricePerKm: rateCardFixture.sellPricePerKm,
        fixedFee: rateCardFixture.fixedFee,
        minimumCharge: rateCardFixture.minimumCharge,
      },
    });
  }

  for (const productFixture of inventorySeedFixtures.products) {
    const coverage = deriveCoverageMetrics(productFixture.dimensions);
    const availabilityStatus = mapAvailabilityStatus(supplierStatusByKey.get(productFixture.supplierLink.supplierKey) ?? 'Inactive');

    const product = await prisma.product.create({
      data: {
        referenceId: productFixture.referenceId,
        publicSku: productFixture.publicSku,
        name: productFixture.name,
        category: categoryMap[productFixture.category],
        productType: productTypeMap[productFixture.productType],
        finish: productFixture.finish ? finishMap[productFixture.finish] : null,
        collectionName: productFixture.collection,
        presentationTags: [...productFixture.tags],
        lifecycleStatus: lifecycleStatusMap[productFixture.status],
        publishStatus: publishStatusMap[productFixture.publishStatus],
        inventoryMode: 'DROPSHIP',
        availabilityStatus,
        pricingUnit: pricingUnitMap[productFixture.pricingUnit],
        sellPriceZar: productFixture.sellPriceZar,
        primaryImageUrl: productFixture.primaryImageUrl,
        galleryImageUrl: productFixture.galleryImageUrl,
        faceImageUrl: productFixture.faceImageUrl,
        heroImageUrl: productFixture.heroImageUrl,
        description: productFixture.description,
        marketingCopy: productFixture.marketingCopy || null,
        technicalSpecifications: asJson(productFixture.specifications),
        lengthMm: productFixture.dimensions.lengthMm,
        widthMm: productFixture.dimensions.widthMm,
        heightMm: productFixture.dimensions.heightMm,
        coverageOrientation: coverageOrientationMap[productFixture.dimensions.coverageOrientation],
        faceAreaM2: coverage.faceAreaM2,
        unitsPerM2: coverage.unitsPerM2,
        weightKg: productFixture.dimensions.weightKg,
        reorderPoint: 0,
      },
    });

    productIdsByReference.set(productFixture.referenceId, product.id);
    productIdsByPublicSku.set(productFixture.publicSku, product.id);

    await prisma.productSupplier.create({
      data: {
        productId: product.id,
        supplierId: supplierIdsByKey.get(productFixture.supplierLink.supplierKey)!,
        originLocationId: locationIdsByKey.get(productFixture.supplierLink.locationKey)!,
        isDefault: true,
        unitCostZar: productFixture.supplierLink.unitCostZar,
        leadTimeDays: productFixture.supplierLink.leadTimeDays,
        minimumOrderQuantity: productFixture.supplierLink.minimumOrderQuantity,
        paymentTerms: productFixture.supplierLink.paymentTerms,
        incoterms: productFixture.supplierLink.incoterms,
      },
    });

    for (const historyEvent of productFixture.history) {
      await prisma.productHistoryEvent.create({
        data: {
          productId: product.id,
          eventType: productHistoryEventTypeMap[historyEvent.type],
          actionLabel: historyEvent.action,
          userName: historyEvent.user,
          details: 'details' in historyEvent ? historyEvent.details ?? null : null,
          occurredAt: new Date(historyEvent.occurredAt),
        },
      });
    }

    for (const assetFixture of productFixture.assets) {
      const asset = await prisma.productAsset.create({
        data: {
          assetKey: assetFixture.key,
          primaryProductId: product.id,
          name: assetFixture.name,
          assetType: assetTypeMap[assetFixture.type],
          assetSource: assetSourceMap[assetFixture.source],
          protectionLevel: assetProtectionMap[assetFixture.protectionLevel],
          approvalStatus: assetStatusMap[assetFixture.status],
          sizeLabel: assetFixture.size,
          imageUrl: assetFixture.img,
          usageRoles: [assetRoleMap[assetFixture.role]],
          completeness:
            'completeness' in assetFixture && typeof assetFixture.completeness === 'number'
              ? assetFixture.completeness
              : null,
          isThreeDReady: 'is3DReady' in assetFixture ? assetFixture.is3DReady ?? false : false,
          workflowNode: null,
          pipeline: 'pipeline' in assetFixture && assetFixture.pipeline ? asJson(assetFixture.pipeline) : undefined,
          tags: [...assetFixture.tags],
        },
      });

      await prisma.assetLink.create({
        data: {
          assetId: asset.id,
          linkType: 'PRODUCT',
          productId: product.id,
        },
      });
    }
  }

  for (const productFixture of inventorySeedFixtures.products) {
    for (const purchaseOrderFixture of productFixture.purchaseOrders) {
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          orderKey: purchaseOrderFixture.key,
          supplierId: supplierIdsByKey.get(purchaseOrderFixture.supplierKey)!,
          originLocationId: locationIdsByKey.get(purchaseOrderFixture.locationKey)!,
          status: purchaseOrderStatusMap[purchaseOrderFixture.status],
          currency: purchaseOrderFixture.currency,
          triggerSource: purchaseOrderFixture.triggerSource,
          triggerReference: purchaseOrderFixture.triggerReference,
          orderedAt: new Date(purchaseOrderFixture.orderedAt),
          totalAmount: purchaseOrderFixture.lines.reduce((total, line) => total + (line.quantity * line.unitCostZar), 0),
        },
      });

      for (const line of purchaseOrderFixture.lines) {
        const productId = productIdsByPublicSku.get(line.publicSku) ?? productIdsByReference.get(productFixture.referenceId);
        if (!productId) {
          throw new Error(`Missing product reference for purchase order line ${line.publicSku}.`);
        }

        await prisma.purchaseOrderLine.create({
          data: {
            purchaseOrderId: purchaseOrder.id,
            productId,
            quantity: line.quantity,
            unitCostZar: line.unitCostZar,
            totalCostZar: line.quantity * line.unitCostZar,
          },
        });
      }

      if ('receipt' in purchaseOrderFixture && purchaseOrderFixture.receipt) {
        await prisma.goodsReceipt.create({
          data: {
            receiptKey: purchaseOrderFixture.receipt.key,
            purchaseOrderId: purchaseOrder.id,
            receivedAt: new Date(purchaseOrderFixture.receipt.receivedAt),
            status: goodsReceiptStatusMap[purchaseOrderFixture.receipt.status],
            note: purchaseOrderFixture.receipt.note ?? null,
          },
        });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
