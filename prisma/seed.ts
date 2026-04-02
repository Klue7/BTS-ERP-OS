import { Prisma } from '../generated/prisma/client';
import { prisma } from './client.ts';
import { inventorySeedFixtures } from '../src/inventory/fixtures.ts';

const productTypeMap = {
  Brick: 'BRICK',
  Tile: 'TILE',
  Paver: 'PAVER',
  Stone: 'STONE',
  Slab: 'SLAB',
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

const stockMovementTypeMap = {
  Receipt: 'RECEIPT',
  Reservation: 'RESERVATION',
  Release: 'RELEASE',
  Issue: 'ISSUE',
  Return: 'RETURN',
  Adjustment: 'ADJUSTMENT',
  Cancellation: 'CANCELLATION',
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

const assetRoleMap = {
  hero: 'HERO',
  gallery: 'GALLERY',
  installation: 'INSTALLATION',
  detail: 'DETAIL',
  campaign: 'CAMPAIGN',
  '3d_ready': 'THREE_D_READY',
  model: 'MODEL',
  publishable_variant: 'PUBLISHABLE_VARIANT',
  face_texture: 'FACE_TEXTURE',
  detail_texture: 'DETAIL_TEXTURE',
  quote_render: 'QUOTE_RENDER',
  marketing_variant: 'MARKETING_VARIANT',
  model_reference: 'MODEL_REFERENCE',
  render: 'RENDER',
  pbr_texture: 'PBR_TEXTURE',
} as const;

const productHistoryEventTypeMap = {
  'Product Created': 'PRODUCT_CREATED',
  'Product Updated': 'PRODUCT_UPDATED',
  'Stock Updated': 'STOCK_UPDATED',
  'Price Adjusted': 'PRICE_ADJUSTED',
  'Status Changed': 'STATUS_CHANGED',
  'Asset Approved': 'ASSET_APPROVED',
  'Low Stock Alert': 'LOW_STOCK_ALERT',
  'Campaign Linked': 'CAMPAIGN_LINKED',
  'Import Applied': 'IMPORT_APPLIED',
} as const;

const assetLinkTypeMap = {
  PRODUCT: 'PRODUCT',
  CAMPAIGN: 'CAMPAIGN',
} as const;

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
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
  const productIdsByReference = new Map<string, string>();
  const assetIdsByKey = new Map<string, string>();
  const rateCardIdsByKey = new Map<string, string>();

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
    const rateCard = await prisma.logisticsRateCard.create({
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

    rateCardIdsByKey.set(rateCardFixture.key, rateCard.id);
  }

  for (const productFixture of inventorySeedFixtures.products) {
    const product = await prisma.product.create({
      data: {
        referenceId: productFixture.referenceId,
        sku: productFixture.sku,
        name: productFixture.name,
        productType: productTypeMap[productFixture.productType],
        commercialCategory: productFixture.commercialCategory,
        collectionName: productFixture.collection,
        presentationTags: [...productFixture.tags],
        lifecycleStatus: lifecycleStatusMap[productFixture.status],
        publishStatus: publishStatusMap[productFixture.publishStatus],
        unit: productFixture.unit,
        baseSellPrice: productFixture.sellPrice,
        currency: 'GBP',
        primaryImageUrl: productFixture.primaryImageUrl,
        description: productFixture.description,
        marketingCopy: productFixture.marketingCopy || null,
        technicalSpecifications: asJson(productFixture.specifications),
        dimensionsText: productFixture.dimensionsText,
        weightKg: productFixture.weightKg ?? null,
        reorderPoint: productFixture.reorderPoint,
      },
    });

    productIdsByReference.set(productFixture.referenceId, product.id);

    for (const supplierLink of productFixture.supplierLinks) {
      await prisma.productSupplier.create({
        data: {
          productId: product.id,
          supplierId: supplierIdsByKey.get(supplierLink.supplierKey)!,
          originLocationId: locationIdsByKey.get(supplierLink.locationKey)!,
          isDefault: supplierLink.isDefault,
          unitCost: supplierLink.unitCost,
          currency: supplierLink.currency,
          leadTimeDays: supplierLink.leadTimeDays,
          minimumOrderQuantity: supplierLink.minimumOrderQuantity,
          paymentTerms: supplierLink.paymentTerms,
          incoterms: supplierLink.incoterms,
        },
      });
    }

    for (const movement of productFixture.stockMovements) {
      await prisma.stockMovement.create({
        data: {
          movementKey: movement.key,
          productId: product.id,
          movementType: stockMovementTypeMap[movement.type],
          quantity: movement.quantity,
          occurredAt: new Date(movement.occurredAt),
          note: movement.note,
          referenceType: movement.referenceType,
          referenceId: movement.referenceId,
        },
      });
    }

    for (const historyEvent of productFixture.history) {
      await prisma.productHistoryEvent.create({
        data: {
          productId: product.id,
          eventType: productHistoryEventTypeMap[historyEvent.type],
          actionLabel: historyEvent.action,
          userName: historyEvent.user,
          occurredAt: new Date(historyEvent.occurredAt),
        },
      });
    }

    for (const purchaseOrder of productFixture.purchaseOrders) {
      const createdPurchaseOrder = await prisma.purchaseOrder.create({
        data: {
          orderKey: purchaseOrder.key,
          supplierId: supplierIdsByKey.get(purchaseOrder.supplierKey)!,
          originLocationId: locationIdsByKey.get(purchaseOrder.locationKey)!,
          status: purchaseOrderStatusMap[purchaseOrder.status],
          currency: purchaseOrder.currency,
          orderedAt: new Date(purchaseOrder.orderedAt),
          totalAmount: purchaseOrder.lines.reduce((total, line) => total + (line.quantity * line.unitCost), 0),
        },
      });

      for (const line of purchaseOrder.lines) {
        await prisma.purchaseOrderLine.create({
          data: {
            purchaseOrderId: createdPurchaseOrder.id,
            productId: productIdsByReference.get(productFixture.referenceId)!,
            quantity: line.quantity,
            unitCost: line.unitCost,
            totalCost: line.quantity * line.unitCost,
          },
        });
      }

      await prisma.goodsReceipt.create({
        data: {
          receiptKey: purchaseOrder.receipt.key,
          purchaseOrderId: createdPurchaseOrder.id,
          receivedAt: new Date(purchaseOrder.receipt.receivedAt),
          status: goodsReceiptStatusMap[purchaseOrder.receipt.status],
          note: purchaseOrder.receipt.note,
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
          protectionLevel: assetProtectionMap[assetFixture.protectionLevel],
          approvalStatus: assetStatusMap[assetFixture.status],
          sizeLabel: assetFixture.size,
          imageUrl: assetFixture.img,
          usageRoles: assetFixture.usageRoles.map((role) => assetRoleMap[role]),
          completeness: assetFixture.completeness ?? null,
          isThreeDReady: assetFixture.is3DReady ?? false,
          watermarkProfile: 'watermarkProfile' in assetFixture ? assetFixture.watermarkProfile ?? null : null,
          backgroundTransparent: 'backgroundTransparent' in assetFixture ? assetFixture.backgroundTransparent ?? null : null,
          workflowNode: assetFixture.workflowNode ?? null,
          pipeline: 'pipeline' in assetFixture && assetFixture.pipeline ? asJson(assetFixture.pipeline) : undefined,
          tags: [...assetFixture.tags],
        },
      });

      assetIdsByKey.set(assetFixture.key, asset.id);
    }
  }

  for (const productFixture of inventorySeedFixtures.products) {
    for (const assetFixture of productFixture.assets) {
      const assetId = assetIdsByKey.get(assetFixture.key)!;

      if ('parentKey' in assetFixture && assetFixture.parentKey) {
        await prisma.productAsset.update({
          where: { id: assetId },
          data: { parentAssetId: assetIdsByKey.get(assetFixture.parentKey)! },
        });
      }

      for (const linkedProductId of assetFixture.linkProducts) {
        await prisma.assetLink.create({
          data: {
            assetId,
            linkType: assetLinkTypeMap.PRODUCT,
            productId: productIdsByReference.get(linkedProductId)!,
          },
        });
      }

      for (const linkedCampaignId of assetFixture.linkCampaigns) {
        await prisma.assetLink.create({
          data: {
            assetId,
            linkType: assetLinkTypeMap.CAMPAIGN,
            campaignKey: linkedCampaignId,
          },
        });
      }
    }
  }

  const [productCount, supplierCount, assetCount, movementCount] = await prisma.$transaction([
    prisma.product.count(),
    prisma.supplier.count(),
    prisma.productAsset.count(),
    prisma.stockMovement.count(),
  ]);

  console.log(`Seeded ${productCount} products, ${supplierCount} suppliers, ${assetCount} assets, and ${movementCount} stock movements.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
