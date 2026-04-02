import { Prisma } from '../generated/prisma/client';
import { prisma } from './client.ts';
import { productData } from '../src/catalog/productData.ts';

const familyKeys = ['cladding-tiles', 'bricks', 'paving', 'breeze-blocks'] as const;

async function main() {
  for (const key of familyKeys) {
    const family = productData[key];

    await prisma.productFamily.upsert({
      where: { key },
      update: {
        brand: family.brand,
        productName: family.productName,
        categoryLabel: family.category,
        primaryCta: family.primaryCta,
        materialStory: family.materialStory as Prisma.InputJsonValue,
        technicalSpec: family.technical as Prisma.InputJsonValue,
        showcase: family.showcase as Prisma.InputJsonValue,
        topSellers: family.topSellers as Prisma.InputJsonValue,
      },
      create: {
        key,
        brand: family.brand,
        productName: family.productName,
        categoryLabel: family.category,
        primaryCta: family.primaryCta,
        materialStory: family.materialStory as Prisma.InputJsonValue,
        technicalSpec: family.technical as Prisma.InputJsonValue,
        showcase: family.showcase as Prisma.InputJsonValue,
        topSellers: family.topSellers as Prisma.InputJsonValue,
      },
    });

    await prisma.product.deleteMany({ where: { familyKey: key } });

    if (family.catalog.length > 0) {
      await prisma.product.createMany({
        data: family.catalog.map((item) => ({
          id: item.id,
          familyKey: key,
          name: item.name,
          mood: 'mood' in item ? item.mood ?? null : null,
          category: 'category' in item ? item.category ?? null : null,
          subCategory: 'subCategory' in item ? item.subCategory ?? null : null,
          colorHex: 'color' in item ? item.color ?? null : null,
          priceText: 'price' in item ? item.price ?? null : null,
          description: item.description,
          region: 'region' in item ? item.region ?? null : null,
          imageUrls: item.images as Prisma.InputJsonValue,
          specs: item.specs as Prisma.InputJsonValue,
        })),
      });
    }
  }

  await prisma.visualLabConfig.upsert({
    where: { key: 'default' },
    update: {
      title: productData.visualLab.title,
      subtitle: productData.visualLab.subtitle,
      groutColors: productData.visualLab.groutColors as Prisma.InputJsonValue,
      layouts: productData.visualLab.layouts as Prisma.InputJsonValue,
      lighting: productData.visualLab.lighting as Prisma.InputJsonValue,
    },
    create: {
      key: 'default',
      title: productData.visualLab.title,
      subtitle: productData.visualLab.subtitle,
      groutColors: productData.visualLab.groutColors as Prisma.InputJsonValue,
      layouts: productData.visualLab.layouts as Prisma.InputJsonValue,
      lighting: productData.visualLab.lighting as Prisma.InputJsonValue,
    },
  });

  const [familyCount, productCount] = await prisma.$transaction([
    prisma.productFamily.count(),
    prisma.product.count(),
  ]);

  console.log(`Seeded ${familyCount} product families and ${productCount} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
