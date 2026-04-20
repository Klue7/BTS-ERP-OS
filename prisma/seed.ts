import { Prisma } from '../generated/prisma/client';
import { prisma } from './client.ts';
import { inventorySeedFixtures } from '../src/inventory/fixtures.ts';
import { createDefaultBlueprintConfig, summarizeBlueprintConfig } from '../src/marketing/contracts.ts';
import { hashPassword } from '../src/server/vendor-auth.ts';

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

const businessDocumentTypeMap = {
  'Customer Quote': 'CUSTOMER_QUOTE',
  'Customer Order': 'CUSTOMER_ORDER',
  'Customer Invoice': 'CUSTOMER_INVOICE',
  'Purchase Order': 'PURCHASE_ORDER',
  'Goods Receipt': 'GOODS_RECEIPT',
  'Delivery Note': 'DELIVERY_NOTE',
  'Proof of Delivery': 'PROOF_OF_DELIVERY',
  'Supplier Invoice': 'SUPPLIER_INVOICE',
  'Credit Note': 'CREDIT_NOTE',
} as const;

const businessDocumentStatusMap = {
  Draft: 'DRAFT',
  Pending: 'PENDING',
  Issued: 'ISSUED',
  Sent: 'SENT',
  Confirmed: 'CONFIRMED',
  Partial: 'PARTIAL',
  Overdue: 'OVERDUE',
  Paid: 'PAID',
  Received: 'RECEIVED',
  Delivered: 'DELIVERED',
  Cancelled: 'CANCELLED',
  Expired: 'EXPIRED',
  Flagged: 'FLAGGED',
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

const marketingTemplateTypeMap = {
  'Product Card': 'PRODUCT_CARD',
  'Collection Highlight': 'COLLECTION_HIGHLIGHT',
  'Quote CTA': 'QUOTE_CTA',
} as const;

const marketingCampaignStatusMap = {
  Active: 'ACTIVE',
  Draft: 'DRAFT',
  Completed: 'COMPLETED',
  Scheduled: 'SCHEDULED',
} as const;

const marketingChannelMap = {
  Instagram: 'INSTAGRAM',
  Facebook: 'FACEBOOK',
  TikTok: 'TIKTOK',
  LinkedIn: 'LINKEDIN',
  Email: 'EMAIL',
  WhatsApp: 'WHATSAPP',
  Pinterest: 'PINTEREST',
} as const;

const marketingCalendarStatusMap = {
  Scheduled: 'SCHEDULED',
  Published: 'PUBLISHED',
  Failed: 'FAILED',
  Draft: 'DRAFT',
} as const;

const marketingPublishingStatusMap = {
  Queued: 'QUEUED',
  Publishing: 'PUBLISHING',
  Published: 'PUBLISHED',
  Failed: 'FAILED',
  Retrying: 'RETRYING',
} as const;

const marketingChannelHealthStatusMap = {
  Healthy: 'HEALTHY',
  Degraded: 'DEGRADED',
  Down: 'DOWN',
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

const distributionChannelMap = {
  'Meta Catalog': 'META_CATALOG',
  'WhatsApp Catalog': 'WHATSAPP_CATALOG',
  'Google Merchant Center': 'GOOGLE_MERCHANT_CENTER',
  'TikTok Shop': 'TIKTOK_SHOP',
} as const;

const distributionChannelTypeMap = {
  Catalog: 'CATALOG',
  Marketplace: 'MARKETPLACE',
  Messaging: 'MESSAGING',
} as const;

const distributionConnectionStatusMap = {
  'Not Connected': 'NOT_CONNECTED',
  Connected: 'CONNECTED',
  Degraded: 'DEGRADED',
  Error: 'ERROR',
} as const;

const distributionPublicationStatusMap = {
  'Not Posted': 'NOT_POSTED',
  Queued: 'QUEUED',
  Syncing: 'SYNCING',
  Live: 'LIVE',
  Paused: 'PAUSED',
  Failed: 'FAILED',
  Archived: 'ARCHIVED',
} as const;

const distributionSyncModeMap = {
  Manual: 'MANUAL',
  API: 'API',
} as const;

const productTestResultTypeMap = {
  'Compressive Strength (MPa)': 'COMPRESSIVE_STRENGTH_MPA',
  'Water Absorption (%)': 'WATER_ABSORPTION_PERCENT',
  'Tested Length (mm)': 'LENGTH_MM_TESTED',
  'Tested Width (mm)': 'WIDTH_MM_TESTED',
  'Tested Height (mm)': 'HEIGHT_MM_TESTED',
  'Dry Mass (kg)': 'DRY_MASS_KG',
  'Wet Mass (kg)': 'WET_MASS_KG',
  'Breaking Load (kN)': 'BREAKING_LOAD_KN',
} as const;

const customerSeedFixtures = [
  {
    key: 'CUST_001',
    name: 'John Doe',
    customerType: 'Retail',
    stage: 'Lead',
    email: 'john@example.com',
    phone: '+44 7700 900001',
  },
  {
    key: 'CUST_002',
    name: 'Sarah Smith',
    customerType: 'Trade',
    stage: 'Quote Sent',
    email: 'sarah@designbuild.com',
    phone: '+44 7700 900002',
  },
  {
    key: 'CUST_003',
    name: 'Mike Ross',
    customerType: 'Architect',
    stage: 'Won',
    email: 'mike@pearsonhardman.com',
    phone: '+44 7700 900003',
  },
  {
    key: 'CUST_004',
    name: 'Rachel Zane',
    customerType: 'Retail',
    stage: 'Lead',
    email: 'rachel@example.com',
    phone: '+44 7700 900004',
  },
] as const;

const customerSalesDocumentFixtures = [
  {
    key: 'QT-2026-001',
    type: 'Customer Quote',
    status: 'Issued',
    title: 'Quote for Autumn Cladding Tile',
    customerKey: 'CUST_001',
    supplierKey: 'VND_001',
    productReference: 'PRD_101',
    issuedAt: '2026-03-08T10:00:00.000Z',
    dueAt: '2026-03-15T10:00:00.000Z',
    totalAmount: 14880,
    balanceAmount: 14880,
    snapshot: {
      summary: 'Architect-facing cladding quote for a London residential wall package.',
      lineItems: [
        { sku: 'BTS-CLD-MOD-101', name: 'Travertine Horizon Cladding', quantity: 12, unit: 'm2', unitPriceZar: 1240, totalPriceZar: 14880 },
      ],
      notes: ['Pricing excludes final crane access confirmation.'],
    },
  },
  {
    key: 'ORD-2026-001',
    type: 'Customer Order',
    status: 'Confirmed',
    title: 'Confirmed order for Autumn Cladding Tile',
    customerKey: 'CUST_001',
    supplierKey: 'VND_001',
    productReference: 'PRD_101',
    issuedAt: '2026-03-10T09:00:00.000Z',
    dueAt: '2026-03-17T09:00:00.000Z',
    totalAmount: 14880,
    balanceAmount: 14880,
    parentKey: 'QT-2026-001',
    snapshot: {
      summary: 'Customer accepted quoted cladding scope and order converted for supplier procurement.',
      lineItems: [
        { sku: 'BTS-CLD-MOD-101', name: 'Travertine Horizon Cladding', quantity: 12, unit: 'm2', unitPriceZar: 1240, totalPriceZar: 14880 },
      ],
      notes: ['Factory collection converted to site delivery after route confirmation.'],
    },
  },
  {
    key: 'INV-2026-001',
    type: 'Customer Invoice',
    status: 'Overdue',
    title: 'Invoice for Autumn Cladding Tile order',
    customerKey: 'CUST_001',
    supplierKey: 'VND_001',
    productReference: 'PRD_101',
    issuedAt: '2026-03-12T08:30:00.000Z',
    dueAt: '2026-03-20T08:30:00.000Z',
    totalAmount: 14880,
    balanceAmount: 14880,
    parentKey: 'ORD-2026-001',
    snapshot: {
      summary: 'Customer invoice issued after order confirmation.',
      vatRatePct: 15,
      lineItems: [
        { sku: 'BTS-CLD-MOD-101', name: 'Travertine Horizon Cladding', quantity: 12, unit: 'm2', unitPriceZar: 1240, totalPriceZar: 14880 },
      ],
      notes: ['Invoice remains open pending receipt of final payment.'],
    },
  },
  {
    key: 'QT-2026-002',
    type: 'Customer Quote',
    status: 'Issued',
    title: 'Quote for Karoo Rustic NFX Brick',
    customerKey: 'CUST_002',
    supplierKey: 'VND_002',
    productReference: 'PRD_205',
    issuedAt: '2026-03-11T11:30:00.000Z',
    dueAt: '2026-03-18T11:30:00.000Z',
    totalAmount: 2100,
    balanceAmount: 2100,
    snapshot: {
      summary: 'Trade quote for a brick feature wall package with direct delivery.',
      lineItems: [
        { sku: 'BTS-BRK-NFX-205', name: 'Karoo Rustic NFX Brick', quantity: 1135, unit: 'piece', unitPriceZar: 1.85, totalPriceZar: 2099.75 },
      ],
      notes: ['Rounded to nearest full bundle for dispatch planning.'],
    },
  },
  {
    key: 'ORD-2026-002',
    type: 'Customer Order',
    status: 'Delivered',
    title: 'Delivered order for Karoo Rustic NFX Brick',
    customerKey: 'CUST_002',
    supplierKey: 'VND_002',
    productReference: 'PRD_205',
    issuedAt: '2026-03-12T12:00:00.000Z',
    dueAt: '2026-03-22T12:00:00.000Z',
    totalAmount: 2100,
    balanceAmount: 0,
    parentKey: 'QT-2026-002',
    snapshot: {
      summary: 'Trade brick order fulfilled and delivered.',
      lineItems: [
        { sku: 'BTS-BRK-NFX-205', name: 'Karoo Rustic NFX Brick', quantity: 1135, unit: 'piece', unitPriceZar: 1.85, totalPriceZar: 2099.75 },
      ],
      notes: ['Delivery note signed on site and attached to POD workflow.'],
    },
  },
  {
    key: 'INV-2026-002',
    type: 'Customer Invoice',
    status: 'Paid',
    title: 'Paid invoice for Karoo Rustic NFX Brick',
    customerKey: 'CUST_002',
    supplierKey: 'VND_002',
    productReference: 'PRD_205',
    issuedAt: '2026-03-15T09:00:00.000Z',
    dueAt: '2026-03-25T09:00:00.000Z',
    totalAmount: 2100,
    balanceAmount: 0,
    parentKey: 'ORD-2026-002',
    snapshot: {
      summary: 'Customer invoice settled in full.',
      vatRatePct: 15,
      lineItems: [
        { sku: 'BTS-BRK-NFX-205', name: 'Karoo Rustic NFX Brick', quantity: 1135, unit: 'piece', unitPriceZar: 1.85, totalPriceZar: 2099.75 },
      ],
      notes: ['Payment received and matched to customer ledger.'],
    },
  },
  {
    key: 'QT-2026-003',
    type: 'Customer Quote',
    status: 'Expired',
    title: 'Expired quote for Metro Breeze Clay Block',
    customerKey: 'CUST_004',
    supplierKey: 'VND_004',
    productReference: 'PRD_420',
    issuedAt: '2026-03-05T14:00:00.000Z',
    dueAt: '2026-03-12T14:00:00.000Z',
    totalAmount: 9600,
    balanceAmount: 9600,
    snapshot: {
      summary: 'Draft block quote expired during supplier onboarding delay.',
      lineItems: [
        { sku: 'BTS-BLK-BRZ-420', name: 'Metro Breeze Clay Block', quantity: 320, unit: 'piece', unitPriceZar: 30, totalPriceZar: 9600 },
      ],
      notes: ['Supplier onboarding blocker prevented order conversion.'],
    },
  },
] as const;

const purchaseOrderToDocumentStatusMap = {
  Draft: 'Draft',
  Sent: 'Sent',
  Confirmed: 'Confirmed',
  Shipped: 'Sent',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
} as const;

const goodsReceiptToDocumentStatusMap = {
  Pending: 'Pending',
  Partial: 'Partial',
  Received: 'Received',
  Cancelled: 'Cancelled',
} as const;

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function deriveCoverageMetrics(input: {
  category: keyof typeof categoryMap;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  coverageOrientation: keyof typeof coverageOrientationMap;
  piecesPerPallet?: number;
  boxesPerPallet?: number;
}) {
  let coverageFace = input.lengthMm * input.widthMm;

  if (input.coverageOrientation === 'Length x Height') {
    coverageFace = input.lengthMm * input.heightMm;
  } else if (input.coverageOrientation === 'Width x Height') {
    coverageFace = input.widthMm * input.heightMm;
  }

  const faceAreaM2 = coverageFace / 1_000_000;
  const unitsPerM2 =
    input.category === 'Cladding'
      ? (input.piecesPerPallet && input.boxesPerPallet ? input.piecesPerPallet / input.boxesPerPallet : 50)
      : input.category === 'Bricks'
        ? 55
        : faceAreaM2 > 0
          ? 1 / faceAreaM2
          : 0;

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
    prisma.marketingCommunityPost.deleteMany(),
    prisma.marketingAnalyticsSnapshot.deleteMany(),
    prisma.marketingChannelHealthSnapshot.deleteMany(),
    prisma.marketingPublishingJob.deleteMany(),
    prisma.marketingCalendarEntry.deleteMany(),
    prisma.marketingCampaignAsset.deleteMany(),
    prisma.marketingCampaignProduct.deleteMany(),
    prisma.marketingCampaign.deleteMany(),
    prisma.marketingTemplate.deleteMany(),
    prisma.businessDocument.deleteMany(),
    prisma.customerProfile.deleteMany(),
    prisma.logisticsQuoteSnapshot.deleteMany(),
    prisma.domainEventOutbox.deleteMany(),
    prisma.vendorSession.deleteMany(),
    prisma.vendorUser.deleteMany(),
    prisma.vendorDocument.deleteMany(),
    prisma.vendorContact.deleteMany(),
    prisma.vendorCommercialAccount.deleteMany(),
    prisma.vendorWorkflowEvent.deleteMany(),
    prisma.productTestResult.deleteMany(),
    prisma.productDistributionPublication.deleteMany(),
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
  const assetIdsByKey = new Map<string, string>();
  const purchaseOrderIdsByKey = new Map<string, string>();
  const goodsReceiptIdsByKey = new Map<string, string>();
  const businessDocumentIdsByKey = new Map<string, string>();
  const customerIdsByKey = new Map<string, string>();

  for (const customerFixture of customerSeedFixtures) {
    const customer = await prisma.customerProfile.create({
      data: {
        customerKey: customerFixture.key,
        name: customerFixture.name,
        customerType: customerFixture.customerType,
        stage: customerFixture.stage,
        email: customerFixture.email,
        phone: customerFixture.phone,
      },
    });

    customerIdsByKey.set(customerFixture.key, customer.id);
  }

  for (const supplierFixture of inventorySeedFixtures.suppliers) {
    const defaultCurrency = supplierFixture.terms.currency || 'ZAR';
    const supplierTypeKey = supplierFixture.type as keyof typeof supplierTypeMap;
    const supplierOrders = supplierFixture.orders as ReadonlyArray<{ amount: number }>;
    const vendorRole = supplierTypeKey === 'Manufacturer' || supplierTypeKey === 'Distributor' || supplierTypeKey === 'Wholesaler'
      ? 'PRODUCT_SUPPLIER'
      : 'TRANSPORT_PARTNER';
    const supplier = await prisma.supplier.create({
      data: {
        supplierKey: supplierFixture.key,
        name: supplierFixture.name,
        registeredName: supplierFixture.name,
        tradingName: supplierFixture.name,
        logoUrl: supplierFixture.logo,
        status: supplierStatusMap[supplierFixture.status],
        supplierType: supplierTypeMap[supplierTypeKey],
        vendorRoles: [vendorRole],
        capabilities: [...supplierFixture.capabilities],
        regionLabel: supplierFixture.region,
        leadTimeDays: supplierFixture.leadTimeDays || null,
        leadTimeLabel: supplierFixture.leadTimeLabel,
        rating: supplierFixture.rating || null,
        blocker: supplierFixture.blocker,
        defaultCurrency,
        vatRegistered: false,
        vatNumber: null,
        providesProducts: true,
        providesTransport: false,
        notes: null,
        contacts: asJson(supplierFixture.contacts),
        terms: asJson(supplierFixture.terms),
        performance: asJson(supplierFixture.performance),
        workflowMilestones: asJson(supplierFixture.workflowMilestones),
        orderSummary: asJson(supplierFixture.orders),
        historySummary: asJson(supplierFixture.history),
        commercialAccount: {
          create: {
            paymentTerms: supplierFixture.terms.payment,
            deliveryTerms: supplierFixture.terms.delivery,
            moq: supplierFixture.terms.moq,
            currency: defaultCurrency,
            incoterms: supplierFixture.terms.incoterms,
            creditLimitZar: 250000,
            currentCreditBalanceZar: supplierOrders.reduce((sum, order) => sum + order.amount, 0),
            vatRegistered: false,
            vatNumber: null,
          },
        },
      },
    });

    if (supplierFixture.contacts.length) {
      await prisma.vendorContact.createMany({
        data: supplierFixture.contacts.map((contact, index) => ({
          supplierId: supplier.id,
          department: contact.department,
          roleTitle: null,
          name: contact.name,
          email: contact.email.toLowerCase(),
          phone: contact.phone ?? null,
          preferredChannel: (
            contact.preferredChannel === 'Phone'
              ? 'PHONE'
              : contact.preferredChannel === 'WhatsApp'
                ? 'WHATSAPP'
                : contact.preferredChannel === 'Portal'
                  ? 'PORTAL'
                  : 'EMAIL'
          ) as 'EMAIL' | 'PHONE' | 'WHATSAPP' | 'PORTAL',
          notes: contact.notes ?? null,
          isPrimary: index === 0,
        })),
      });

      await prisma.vendorUser.create({
        data: {
          supplierId: supplier.id,
          email: supplierFixture.contacts[0].email.toLowerCase(),
          passwordHash: await hashPassword('password'),
          fullName: supplierFixture.contacts[0].name,
          roleLabel: 'Vendor Admin',
        },
      });
    }

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
    const latestTestReport = (productFixture.latestTestReport ?? null) as
      | {
          url?: string | null;
          name?: string | null;
          laboratoryName?: string | null;
          methodStandard?: string | null;
          reportReference?: string | null;
          testedAt?: string | null;
          issuedAt?: string | null;
        }
      | null;
    const coverage = deriveCoverageMetrics({
      category: productFixture.category,
      ...productFixture.dimensions,
      piecesPerPallet: productFixture.packaging.piecesPerPallet,
      boxesPerPallet: 'boxesPerPallet' in productFixture.packaging ? productFixture.packaging.boxesPerPallet : undefined,
    });
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
        latestTestReportUrl: latestTestReport?.url ?? null,
        latestTestReportName: latestTestReport?.name ?? null,
        latestTestLaboratoryName: latestTestReport?.laboratoryName ?? null,
        latestTestMethodStandard: latestTestReport?.methodStandard ?? null,
        latestTestReportReference: latestTestReport?.reportReference ?? null,
        latestTestedAt: latestTestReport?.testedAt ? new Date(latestTestReport.testedAt) : null,
        latestTestIssuedAt: latestTestReport?.issuedAt ? new Date(latestTestReport.issuedAt) : null,
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
        piecesPerPallet: productFixture.packaging.piecesPerPallet,
        boxesPerPallet: ('boxesPerPallet' in productFixture.packaging ? productFixture.packaging.boxesPerPallet : undefined) ?? null,
        palletsPerTruck: productFixture.packaging.palletsPerTruck,
        reorderPoint: 0,
      } as any,
    });

    productIdsByReference.set(productFixture.referenceId, product.id);
    productIdsByPublicSku.set(productFixture.publicSku, product.id);

    if (productFixture.testResults?.length) {
      await prisma.productTestResult.createMany({
        data: productFixture.testResults.map((result, index) => ({
          productId: product.id,
          resultType: productTestResultTypeMap[result.type],
          resultValue: result.value,
          resultUnit: result.unit,
          notes: result.notes ?? null,
          sortOrder: index,
        })),
      });
    }

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

    for (const distributionChannel of productFixture.distributionChannels ?? []) {
      const channelDetails = distributionChannel as {
        externalCatalogId?: string;
        externalListingId?: string;
        externalUrl?: string;
        lastSyncedAt?: string;
        lastSyncError?: string;
      };

      await prisma.productDistributionPublication.create({
        data: {
          productId: product.id,
          channel: distributionChannelMap[distributionChannel.channel],
          channelType: distributionChannelTypeMap[distributionChannel.type],
          connectionStatus: distributionConnectionStatusMap[distributionChannel.connectionStatus],
          publicationStatus: distributionPublicationStatusMap[distributionChannel.publicationStatus],
          syncMode: distributionSyncModeMap[distributionChannel.syncMode],
          externalCatalogId: channelDetails.externalCatalogId ?? null,
          externalListingId: channelDetails.externalListingId ?? null,
          externalUrl: channelDetails.externalUrl ?? null,
          lastSyncedAt: channelDetails.lastSyncedAt ? new Date(channelDetails.lastSyncedAt) : null,
          lastSyncError: channelDetails.lastSyncError ?? null,
          publishedAt:
            distributionChannel.publicationStatus === 'Live' && channelDetails.lastSyncedAt
              ? new Date(channelDetails.lastSyncedAt)
              : null,
          metadata: asJson({ seeded: true }),
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

      assetIdsByKey.set(assetFixture.key, asset.id);

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
      const primaryProductId =
        productIdsByPublicSku.get(purchaseOrderFixture.lines[0]?.publicSku) ??
        productIdsByReference.get(productFixture.referenceId);

      if (!primaryProductId) {
        throw new Error(`Missing primary product reference for purchase order ${purchaseOrderFixture.key}.`);
      }

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
      purchaseOrderIdsByKey.set(purchaseOrderFixture.key, purchaseOrder.id);

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

      const poDocument = await prisma.businessDocument.create({
        data: {
          documentKey: purchaseOrderFixture.key,
          documentType: businessDocumentTypeMap['Purchase Order'],
          status: businessDocumentStatusMap[purchaseOrderToDocumentStatusMap[purchaseOrderFixture.status]],
          title: `Purchase Order ${purchaseOrderFixture.key}`,
          supplierId: supplierIdsByKey.get(purchaseOrderFixture.supplierKey)!,
          productId: primaryProductId,
          purchaseOrderId: purchaseOrder.id,
          issuedAt: new Date(purchaseOrderFixture.orderedAt),
          totalAmount: purchaseOrderFixture.lines.reduce((total, line) => total + (line.quantity * line.unitCostZar), 0),
          balanceAmount: purchaseOrderFixture.lines.reduce((total, line) => total + (line.quantity * line.unitCostZar), 0),
          currency: purchaseOrderFixture.currency,
          snapshot: asJson({
            summary: `${purchaseOrderFixture.key} issued to supplier for deterministic procurement fulfillment.`,
            triggerSource: purchaseOrderFixture.triggerSource,
            triggerReference: purchaseOrderFixture.triggerReference,
            lineItems: purchaseOrderFixture.lines.map((line) => ({
              sku: line.publicSku,
              quantity: line.quantity,
              unitCostZar: line.unitCostZar,
              totalCostZar: line.quantity * line.unitCostZar,
            })),
          }),
        },
      });
      businessDocumentIdsByKey.set(purchaseOrderFixture.key, poDocument.id);

      if ('receipt' in purchaseOrderFixture && purchaseOrderFixture.receipt) {
        const goodsReceipt = await prisma.goodsReceipt.create({
          data: {
            receiptKey: purchaseOrderFixture.receipt.key,
            purchaseOrderId: purchaseOrder.id,
            receivedAt: new Date(purchaseOrderFixture.receipt.receivedAt),
            status: goodsReceiptStatusMap[purchaseOrderFixture.receipt.status],
            note: purchaseOrderFixture.receipt.note ?? null,
          },
        });
        goodsReceiptIdsByKey.set(purchaseOrderFixture.receipt.key, goodsReceipt.id);

        const receiptDocument = await prisma.businessDocument.create({
          data: {
            documentKey: purchaseOrderFixture.receipt.key,
            documentType: businessDocumentTypeMap['Goods Receipt'],
            status: businessDocumentStatusMap[goodsReceiptToDocumentStatusMap[purchaseOrderFixture.receipt.status]],
            title: `Goods Receipt ${purchaseOrderFixture.receipt.key}`,
            supplierId: supplierIdsByKey.get(purchaseOrderFixture.supplierKey)!,
            productId: primaryProductId,
            purchaseOrderId: purchaseOrder.id,
            goodsReceiptId: goodsReceipt.id,
            parentDocumentId: poDocument.id,
            issuedAt: new Date(purchaseOrderFixture.receipt.receivedAt),
            totalAmount: purchaseOrderFixture.lines.reduce((total, line) => total + (line.quantity * line.unitCostZar), 0),
            balanceAmount: 0,
            currency: purchaseOrderFixture.currency,
            snapshot: asJson({
              summary: `${purchaseOrderFixture.receipt.key} recorded against ${purchaseOrderFixture.key}.`,
              note: purchaseOrderFixture.receipt.note ?? null,
              lineItems: purchaseOrderFixture.lines.map((line) => ({
                sku: line.publicSku,
                quantity: line.quantity,
                unitCostZar: line.unitCostZar,
                totalCostZar: line.quantity * line.unitCostZar,
              })),
              linkedDocumentKeys: [purchaseOrderFixture.key],
            }),
          },
        });
        businessDocumentIdsByKey.set(purchaseOrderFixture.receipt.key, receiptDocument.id);
      }
    }
  }

  for (const documentFixture of customerSalesDocumentFixtures) {
    const parentKey = 'parentKey' in documentFixture ? documentFixture.parentKey : undefined;
    const parentDocumentId = parentKey ? businessDocumentIdsByKey.get(parentKey) ?? null : null;
    const customerId = customerIdsByKey.get(documentFixture.customerKey);
    const supplierId = supplierIdsByKey.get(documentFixture.supplierKey);
    const productId = productIdsByReference.get(documentFixture.productReference);

    if (!customerId || !supplierId || !productId) {
      throw new Error(`Missing business document linkage for ${documentFixture.key}.`);
    }

    const businessDocument = await prisma.businessDocument.create({
      data: {
        documentKey: documentFixture.key,
        documentType: businessDocumentTypeMap[documentFixture.type],
        status: businessDocumentStatusMap[documentFixture.status],
        title: documentFixture.title,
        customerId,
        supplierId,
        productId,
        parentDocumentId,
        issuedAt: new Date(documentFixture.issuedAt),
        dueAt: documentFixture.dueAt ? new Date(documentFixture.dueAt) : null,
        totalAmount: documentFixture.totalAmount,
        balanceAmount: documentFixture.balanceAmount,
        currency: 'ZAR',
        snapshot: asJson({
          ...documentFixture.snapshot,
          linkedDocumentKeys: parentKey ? [parentKey] : [],
        }),
      },
    });

    businessDocumentIdsByKey.set(documentFixture.key, businessDocument.id);
  }

  const marketingTemplates = [
    {
      key: 'TMP_001',
      name: 'Standard Product Card',
      description: 'Deterministic layout for single product showcase with price and CTA.',
      type: 'Product Card',
      destination: 'Instagram Post',
      thumbnail: 'https://picsum.photos/seed/tmp1/400/300',
      tags: ['Core', 'Product'],
      publicSurfaceEligible: false,
      allowedTargets: ['Instagram Post', 'Campaign Landing Visual'],
      status: 'Active',
    },
    {
      key: 'TMP_002',
      name: 'Public Hero Blueprint',
      description: 'Editorial hero blueprint for homepage storytelling with a premium CTA surface.',
      type: 'Collection Highlight',
      destination: 'Public Site Hero',
      thumbnail: 'https://picsum.photos/seed/tmp2/400/300',
      tags: ['Public', 'Hero'],
      publicSurfaceEligible: true,
      allowedTargets: ['home.hero', 'Public Site Hero'],
      status: 'Active',
    },
    {
      key: 'TMP_003',
      name: 'Quote CTA',
      description: 'Minimalist layout focusing on customer testimonials and direct action.',
      type: 'Quote CTA',
      destination: 'WhatsApp Share Card',
      thumbnail: 'https://picsum.photos/seed/tmp3/400/300',
      tags: ['Quote', 'Conversion'],
      publicSurfaceEligible: false,
      allowedTargets: ['WhatsApp Share Card', 'Instagram Post'],
      status: 'Active',
    },
    {
      key: 'TMP_004',
      name: 'Public Product Journey',
      description: 'Deterministic product-journey blueprint for storefront pricing, specs, and CTA presentation.',
      type: 'Product Card',
      destination: 'Public Product Section',
      thumbnail: 'https://picsum.photos/seed/tmp4/400/300',
      tags: ['Public', 'Journey', 'Storefront'],
      publicSurfaceEligible: true,
      allowedTargets: ['products.journey', 'Public Product Section'],
      status: 'Active',
    },
  ] as const;

  for (const templateFixture of marketingTemplates) {
    const blueprintConfig = createDefaultBlueprintConfig(templateFixture.type, templateFixture.destination);
    if (templateFixture.key === 'TMP_002') {
      blueprintConfig.behavior.showCollectionLabel = true;
      blueprintConfig.behavior.showCta = true;
    }
    if (templateFixture.key === 'TMP_004') {
      blueprintConfig.behavior.showCollectionLabel = true;
      blueprintConfig.behavior.showSpecStrip = true;
      blueprintConfig.behavior.showPrice = true;
      blueprintConfig.behavior.showCta = true;
      blueprintConfig.style.overlayMode = 'Glass Panel';
      blueprintConfig.style.backgroundTreatment = 'Blurred Backplate';
    }
    await prisma.marketingTemplate.create({
      data: {
        templateKey: templateFixture.key,
        name: templateFixture.name,
        description: templateFixture.description,
        templateType: marketingTemplateTypeMap[templateFixture.type],
        thumbnailUrl: templateFixture.thumbnail,
        blueprint: summarizeBlueprintConfig(blueprintConfig, templateFixture.destination),
        destination: templateFixture.destination,
        tags: asJson(templateFixture.tags),
        allowedTargets: asJson(templateFixture.allowedTargets),
        publicSurfaceEligible: templateFixture.publicSurfaceEligible,
        canvasWidth: blueprintConfig.canvas.width,
        canvasHeight: blueprintConfig.canvas.height,
        aspectRatio: blueprintConfig.canvas.aspectRatio,
        safeZone: asJson(blueprintConfig.canvas.safeZone),
        layoutJson: asJson(blueprintConfig.slots),
        styleJson: asJson(blueprintConfig.style),
        behaviorJson: asJson(blueprintConfig.behavior),
        status: templateFixture.status === 'Active' ? 'ACTIVE' : 'DRAFT',
      },
    });
  }

  const marketingCampaignFixtures = [
    {
      key: 'CMP_001',
      name: 'Spring Revival 2026',
      owner: 'Rikus Klue',
      description: 'Seasonal refresh focusing on outdoor cladding and tactile finish stories.',
      status: 'Active',
      startDate: '2026-03-01T08:00:00.000Z',
      endDate: '2026-05-31T17:00:00.000Z',
      channels: ['Instagram', 'Facebook', 'Pinterest'],
      linkedAssetKeys: ['AST_101_HERO', 'AST_101_PROJECT', 'AST_205_HERO'],
      linkedProductSkus: ['BTS-CLD-MOD-101', 'BTS-BRK-NFX-205'],
      budget: 'R 85,000',
      workflowNode: 'campaign.created',
    },
    {
      key: 'CMP_002',
      name: 'Luxury Obsidian Launch',
      owner: 'Sarah Chen',
      description: 'High-end launch stream for premium paving and dark material palettes.',
      status: 'Scheduled',
      startDate: '2026-04-15T08:00:00.000Z',
      endDate: '2026-06-15T17:00:00.000Z',
      channels: ['LinkedIn', 'Instagram', 'Email'],
      linkedAssetKeys: ['AST_310_PRIMARY', 'AST_310_GENERATED'],
      linkedProductSkus: ['BTS-PAV-BEV-310'],
      budget: 'R 125,000',
      workflowNode: 'campaign.created',
    },
    {
      key: 'CMP_003',
      name: 'Trade Discount Week',
      owner: 'Marcus Thorne',
      description: 'B2B outreach for commercial brick and block applications.',
      status: 'Draft',
      startDate: '2026-04-20T08:00:00.000Z',
      endDate: '2026-05-05T17:00:00.000Z',
      channels: ['LinkedIn', 'Email', 'WhatsApp'],
      linkedAssetKeys: ['AST_205_FACE', 'AST_420_PRIMARY'],
      linkedProductSkus: ['BTS-BRK-NFX-205', 'BTS-BLK-BRZ-420'],
      budget: 'R 48,000',
      workflowNode: 'campaign.created',
    },
  ] as const;

  const marketingCampaignIdsByKey = new Map<string, string>();

  for (const campaignFixture of marketingCampaignFixtures) {
    const campaign = await prisma.marketingCampaign.create({
      data: {
        campaignKey: campaignFixture.key,
        name: campaignFixture.name,
        owner: campaignFixture.owner,
        description: campaignFixture.description,
        status: marketingCampaignStatusMap[campaignFixture.status],
        startDate: new Date(campaignFixture.startDate),
        endDate: new Date(campaignFixture.endDate),
        channels: campaignFixture.channels.map((channel) => marketingChannelMap[channel]),
        budgetLabel: campaignFixture.budget,
        workflowNode: campaignFixture.workflowNode,
      },
    });

    marketingCampaignIdsByKey.set(campaignFixture.key, campaign.id);

    for (const publicSku of campaignFixture.linkedProductSkus) {
      const productId = productIdsByPublicSku.get(publicSku);
      if (!productId) {
        throw new Error(`Missing marketing product link for ${publicSku}.`);
      }

      await prisma.marketingCampaignProduct.create({
        data: {
          campaignId: campaign.id,
          productId,
        },
      });
    }

    for (const assetKey of campaignFixture.linkedAssetKeys) {
      const assetId = assetIdsByKey.get(assetKey);
      if (!assetId) {
        throw new Error(`Missing marketing asset link for ${assetKey}.`);
      }

      await prisma.marketingCampaignAsset.create({
        data: {
          campaignId: campaign.id,
          assetId,
        },
      });

      await prisma.assetLink.create({
        data: {
          assetId,
          linkType: 'CAMPAIGN',
          campaignKey: campaignFixture.key,
        },
      });
    }
  }

  const marketingCalendarFixtures = [
    { key: 'POST_001', title: 'Spring Hero IG', channel: 'Instagram', time: '14:00:00.000Z', date: '2026-03-27', status: 'Scheduled', assetKey: 'AST_101_HERO', campaignKey: 'CMP_001', workflowNode: 'post.scheduled' },
    { key: 'POST_002', title: 'Slate Promo FB', channel: 'Facebook', time: '12:30:00.000Z', date: '2026-03-27', status: 'Scheduled', assetKey: 'AST_205_HERO', campaignKey: 'CMP_001', workflowNode: 'post.scheduled' },
    { key: 'POST_003', title: 'Catalog Sync WA', channel: 'WhatsApp', time: '09:00:00.000Z', date: '2026-03-28', status: 'Published', assetKey: 'AST_205_FACE', campaignKey: 'CMP_003', workflowNode: 'post.scheduled' },
    { key: 'POST_004', title: 'TikTok Trend #1', channel: 'TikTok', time: '10:00:00.000Z', date: '2026-03-30', status: 'Scheduled', assetKey: 'AST_310_PRIMARY', campaignKey: 'CMP_002', workflowNode: 'post.scheduled' },
    { key: 'POST_005', title: 'LinkedIn B2B', channel: 'LinkedIn', time: '11:00:00.000Z', date: '2026-03-31', status: 'Draft', assetKey: 'AST_420_PRIMARY', campaignKey: 'CMP_003', workflowNode: 'post.scheduled' },
  ] as const;

  const marketingCalendarIdsByKey = new Map<string, string>();

  for (const postFixture of marketingCalendarFixtures) {
    const entry = await prisma.marketingCalendarEntry.create({
      data: {
        entryKey: postFixture.key,
        campaignId: marketingCampaignIdsByKey.get(postFixture.campaignKey) ?? null,
        assetId: assetIdsByKey.get(postFixture.assetKey) ?? null,
        title: postFixture.title,
        channel: marketingChannelMap[postFixture.channel],
        scheduledFor: new Date(`${postFixture.date}T${postFixture.time}`),
        status: marketingCalendarStatusMap[postFixture.status],
        workflowNode: postFixture.workflowNode,
      },
    });

    marketingCalendarIdsByKey.set(postFixture.key, entry.id);
  }

  const marketingPublishingFixtures = [
    { key: 'PUB_001', creativeName: 'Spring Hero IG', channel: 'Instagram', status: 'Published', timestamp: '2026-03-27T10:45:12.000Z', campaignKey: 'CMP_001', postKey: 'POST_001', workflowNode: 'publish.succeeded' },
    { key: 'PUB_002', creativeName: 'Catalog Sync WA', channel: 'WhatsApp', status: 'Publishing', timestamp: '2026-03-27T10:46:05.000Z', progress: 65, campaignKey: 'CMP_003', postKey: 'POST_003' },
    { key: 'PUB_003', creativeName: 'Slate Promo FB', channel: 'Facebook', status: 'Failed', timestamp: '2026-03-27T10:40:22.000Z', error: 'API_TIMEOUT', campaignKey: 'CMP_001', postKey: 'POST_002', workflowNode: 'publish.failed' },
    { key: 'PUB_004', creativeName: 'TikTok Trend #1', channel: 'TikTok', status: 'Queued', timestamp: '2026-03-27T10:47:00.000Z', campaignKey: 'CMP_002', postKey: 'POST_004', workflowNode: 'publish.queued' },
    { key: 'PUB_005', creativeName: 'LinkedIn B2B', channel: 'LinkedIn', status: 'Retrying', timestamp: '2026-03-27T10:42:15.000Z', progress: 20, campaignKey: 'CMP_003', postKey: 'POST_005' },
    { key: 'PUB_006', creativeName: 'Pinterest Board', channel: 'Pinterest', status: 'Queued', timestamp: '2026-03-27T10:48:30.000Z', campaignKey: 'CMP_001', workflowNode: 'publish.queued' },
  ] as const;

  for (const publishingFixture of marketingPublishingFixtures) {
    await prisma.marketingPublishingJob.create({
      data: {
        jobKey: publishingFixture.key,
        creativeName: publishingFixture.creativeName,
        channel: marketingChannelMap[publishingFixture.channel],
        status: marketingPublishingStatusMap[publishingFixture.status],
        queuedAt: new Date(publishingFixture.timestamp),
        progress: 'progress' in publishingFixture ? publishingFixture.progress ?? null : null,
        errorMessage: 'error' in publishingFixture ? publishingFixture.error ?? null : null,
        workflowNode: 'workflowNode' in publishingFixture ? publishingFixture.workflowNode ?? null : null,
        campaignId: publishingFixture.campaignKey ? marketingCampaignIdsByKey.get(publishingFixture.campaignKey) ?? null : null,
        calendarEntryId:
          'postKey' in publishingFixture && publishingFixture.postKey
            ? marketingCalendarIdsByKey.get(publishingFixture.postKey) ?? null
            : null,
      },
    });
  }

  const marketingHealthFixtures = [
    { channel: 'Instagram', status: 'Healthy', latency: 124, uptime: '99.99' },
    { channel: 'Facebook', status: 'Healthy', latency: 142, uptime: '99.98' },
    { channel: 'TikTok', status: 'Healthy', latency: 186, uptime: '99.95' },
    { channel: 'WhatsApp', status: 'Degraded', latency: 450, uptime: '99.20' },
    { channel: 'LinkedIn', status: 'Healthy', latency: 110, uptime: '99.99' },
    { channel: 'Pinterest', status: 'Healthy', latency: 152, uptime: '99.96' },
    { channel: 'Email', status: 'Healthy', latency: 96, uptime: '99.99' },
  ] as const;

  for (const healthFixture of marketingHealthFixtures) {
    await prisma.marketingChannelHealthSnapshot.create({
      data: {
        channel: marketingChannelMap[healthFixture.channel],
        status: marketingChannelHealthStatusMap[healthFixture.status],
        latencyMs: healthFixture.latency,
        uptimePct: healthFixture.uptime,
      },
    });
  }

  await prisma.marketingAnalyticsSnapshot.create({
    data: {
      snapshotKey: 'ANL_GLOBAL_001',
      scope: 'GLOBAL',
      label: 'Studio Overview',
      periodStart: new Date('2026-03-01T00:00:00.000Z'),
      periodEnd: new Date('2026-03-31T23:59:59.000Z'),
      leads: 728,
      quotes: 227,
      totalReach: 1203400,
      spendZar: 92000,
      roas: 4.1,
      publishedPosts: 9,
      conversionRatePct: 31.2,
      channelAttribution: asJson([
        { name: 'Instagram Ads', value: 45, color: 'blue' },
        { name: 'Google Search', value: 28, color: 'red' },
        { name: 'Direct Traffic', value: 15, color: 'green' },
        { name: 'Email Marketing', value: 12, color: 'purple' },
      ]),
      trend: asJson(Array.from({ length: 24 }).map((_, index) => ({
        label: `Day ${index + 1}`,
        leads: 18 + ((index * 7) % 22),
        quotes: 6 + ((index * 5) % 12),
      }))),
      topAsset: asJson({
        name: 'Travertine Horizon Hero',
        imageUrl: 'https://picsum.photos/seed/cladding_hero/1600/900',
        quotesGenerated: 128,
      }),
    },
  });

  const marketingCampaignAnalyticsFixtures = [
    { key: 'ANL_CMP_001', campaignKey: 'CMP_001', label: 'Spring Revival 2026', leads: 452, quotes: 128, reach: 640000, spend: 50000, roas: 4.2, publishedPosts: 3, conversionRatePct: 28.3 },
    { key: 'ANL_CMP_002', campaignKey: 'CMP_002', label: 'Luxury Obsidian Launch', leads: 184, quotes: 56, reach: 382000, spend: 12500, roas: 3.8, publishedPosts: 1, conversionRatePct: 30.4 },
    { key: 'ANL_CMP_003', campaignKey: 'CMP_003', label: 'Trade Discount Week', leads: 92, quotes: 34, reach: 181400, spend: 3000, roas: 5.1, publishedPosts: 2, conversionRatePct: 36.9 },
  ] as const;

  for (const analyticsFixture of marketingCampaignAnalyticsFixtures) {
    await prisma.marketingAnalyticsSnapshot.create({
      data: {
        snapshotKey: analyticsFixture.key,
        campaignId: marketingCampaignIdsByKey.get(analyticsFixture.campaignKey) ?? null,
        scope: 'CAMPAIGN',
        label: analyticsFixture.label,
        periodStart: new Date('2026-03-01T00:00:00.000Z'),
        periodEnd: new Date('2026-03-31T23:59:59.000Z'),
        leads: analyticsFixture.leads,
        quotes: analyticsFixture.quotes,
        totalReach: analyticsFixture.reach,
        spendZar: analyticsFixture.spend,
        roas: analyticsFixture.roas,
        publishedPosts: analyticsFixture.publishedPosts,
        conversionRatePct: analyticsFixture.conversionRatePct,
      },
    });
  }

  const marketingCommunityFixtures = [
    {
      key: 'POST_COMM_001',
      campaignKey: 'CMP_001',
      creatorName: 'Sarah Jenkins',
      creatorAvatarUrl: 'https://i.pravatar.cc/150?u=sarah',
      mediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80',
      mediaType: 'IMAGE',
      caption: 'Introducing our new Heritage Red Multi collection. Perfect for both modern and traditional builds. The texture speaks for itself.',
      internalLikes: 12,
      channelStats: [
        { channel: 'Instagram', status: 'Published', publishedAt: '2 hours ago', likes: 1245, comments: 84, saves: 320 },
        { channel: 'LinkedIn', status: 'Published', publishedAt: '2 hours ago', likes: 450, comments: 22, shares: 45 },
        { channel: 'Facebook', status: 'Published', publishedAt: '2 hours ago', likes: 890, comments: 45, shares: 112 },
      ],
      internalComments: [
        {
          id: 'C1',
          user: { name: 'Mike Ross', avatar: 'https://i.pravatar.cc/150?u=mike', role: 'Sales Lead' },
          content: 'Clients are already asking about this one. Great shot!',
          timestamp: '1 hour ago',
          likes: 4,
          replies: [
            {
              id: 'C1-1',
              user: { name: 'Sarah Jenkins', avatar: 'https://i.pravatar.cc/150?u=sarah', role: 'Marketing' },
              content: 'Thanks Mike! I will send you the high-res versions for your client presentations.',
              timestamp: '45 mins ago',
              likes: 2,
            },
          ],
        },
      ],
      createdAt: '2026-03-27T12:00:00.000Z',
    },
    {
      key: 'POST_COMM_002',
      campaignKey: 'CMP_002',
      creatorName: 'David Chen',
      creatorAvatarUrl: 'https://i.pravatar.cc/150?u=david',
      mediaUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80',
      mediaType: 'IMAGE',
      caption: 'Did you know? The firing temperature of our premium clay bricks directly impacts their water absorption rate.',
      internalLikes: 8,
      channelStats: [
        { channel: 'LinkedIn', status: 'Published', publishedAt: '1 day ago', likes: 820, comments: 56, shares: 120 },
        { channel: 'Email', status: 'Published', publishedAt: '1 day ago', opens: 4500, clicks: 850 },
      ],
      internalComments: [],
      createdAt: '2026-03-26T10:00:00.000Z',
    },
    {
      key: 'POST_COMM_003',
      campaignKey: 'CMP_003',
      creatorName: 'Sarah Jenkins',
      creatorAvatarUrl: 'https://i.pravatar.cc/150?u=sarah',
      mediaUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80',
      mediaType: 'IMAGE',
      caption: 'Trade partners: Our Q2 volume discount is now live. Log in to your portal to see updated pricing on all standard ranges.',
      internalLikes: 24,
      channelStats: [
        { channel: 'LinkedIn', status: 'Published', publishedAt: '2 days ago', likes: 310, comments: 12, shares: 18 },
        { channel: 'Facebook', status: 'Published', publishedAt: '2 days ago', likes: 150, comments: 5, shares: 8 },
        { channel: 'Instagram', status: 'Scheduled', publishedAt: 'Tomorrow, 09:00 AM' },
      ],
      internalComments: [
        {
          id: 'C3',
          user: { name: 'Tom Hardy', avatar: 'https://i.pravatar.cc/150?u=tom', role: 'Account Exec' },
          content: 'I will make sure to follow up with my top 10 accounts today.',
          timestamp: '1 day ago',
          likes: 5,
        },
      ],
      createdAt: '2026-03-25T09:00:00.000Z',
    },
  ] as const;

  for (const postFixture of marketingCommunityFixtures) {
    await prisma.marketingCommunityPost.create({
      data: {
        postKey: postFixture.key,
        campaignId: marketingCampaignIdsByKey.get(postFixture.campaignKey) ?? null,
        creatorName: postFixture.creatorName,
        creatorAvatarUrl: postFixture.creatorAvatarUrl,
        mediaUrl: postFixture.mediaUrl,
        mediaType: postFixture.mediaType,
        caption: postFixture.caption,
        internalLikes: postFixture.internalLikes,
        internalLikeActors: asJson([]),
        internalComments: asJson(postFixture.internalComments),
        channelStats: asJson(postFixture.channelStats),
        createdAt: new Date(postFixture.createdAt),
      },
    });
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
