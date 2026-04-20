import { prisma } from '../prisma/client.ts';

async function main() {
  const [
    productCount,
    supplierCount,
    assetCount,
    purchaseOrderCount,
    stockMovementCount,
    rateCardCount,
    campaignCount,
    templateCount,
    scheduledPostCount,
    publishingJobCount,
    pendingDomainEvents,
    publishedDomainEvents,
  ] = await prisma.$transaction([
    prisma.product.count(),
    prisma.supplier.count(),
    prisma.productAsset.count(),
    prisma.purchaseOrder.count(),
    prisma.stockMovement.count(),
    prisma.logisticsRateCard.count(),
    prisma.marketingCampaign.count(),
    prisma.marketingTemplate.count(),
    prisma.marketingCalendarEntry.count(),
    prisma.marketingPublishingJob.count(),
    prisma.domainEventOutbox.count({ where: { status: 'PENDING' } }),
    prisma.domainEventOutbox.count({ where: { status: 'PUBLISHED' } }),
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        products: productCount,
        suppliers: supplierCount,
        assets: assetCount,
        purchaseOrders: purchaseOrderCount,
        stockMovements: stockMovementCount,
        logisticsRateCards: rateCardCount,
        marketingCampaigns: campaignCount,
        marketingTemplates: templateCount,
        marketingCalendarEntries: scheduledPostCount,
        marketingPublishingJobs: publishingJobCount,
        pendingDomainEvents,
        publishedDomainEvents,
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
