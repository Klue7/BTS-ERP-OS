import { prisma } from '../prisma/client.ts';

async function main() {
  const [productCount, supplierCount, assetCount, stockMovementCount, rateCardCount] = await prisma.$transaction([
    prisma.product.count(),
    prisma.supplier.count(),
    prisma.productAsset.count(),
    prisma.stockMovement.count(),
    prisma.logisticsRateCard.count(),
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        products: productCount,
        suppliers: supplierCount,
        assets: assetCount,
        stockMovements: stockMovementCount,
        logisticsRateCards: rateCardCount,
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
