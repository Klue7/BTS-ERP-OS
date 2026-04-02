import { prisma } from '../prisma/client.ts';

async function main() {
  const [familyCount, productCount, visualLabCount] = await prisma.$transaction([
    prisma.productFamily.count(),
    prisma.product.count(),
    prisma.visualLabConfig.count(),
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        productFamilies: familyCount,
        products: productCount,
        visualLabConfigs: visualLabCount,
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
