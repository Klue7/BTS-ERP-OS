import { useEffect, useMemo, useState } from 'react';
import { fetchInventoryProductDetails } from '../inventory/api';
import type { InventoryProductDetail, ProductTestResultSnapshot } from '../inventory/contracts';
import { productData } from './productData';
import {
  computeProductQuoteRates,
  formatStoredPriceLabel,
  type ProductQuoteModel,
} from '../pricing/quoteEngine';

export type StorefrontCategoryKey = 'cladding-tiles' | 'bricks' | 'paving' | 'breeze-blocks';

export type StorefrontCatalogItem = {
  id: string;
  inventoryProductId: string;
  publicSku: string;
  name: string;
  mood?: string;
  category?: string;
  subCategory?: string;
  color: string;
  price: string;
  description: string;
  image: string;
  images: string[];
  faceImageUrl?: string;
  specs: {
    module: string;
    coverage: string;
    selection: string;
    boxDetail: string;
  };
  technicalTests: ProductTestResultSnapshot[];
  specSheetUrl?: string;
  region?: string;
  quoteModel: ProductQuoteModel;
  commerce: {
    storedPriceLabel: string;
    pricePerPieceLabel: string;
    pricePerSqmLabel: string;
    pricePerBoxLabel?: string;
    pricePerPalletLabel: string;
  };
};

type StorefrontCategoryData = Record<string, any>;
type StorefrontData = Record<StorefrontCategoryKey, StorefrontCategoryData>;

const categoryKeyByInventoryCategory: Record<string, StorefrontCategoryKey> = {
  Cladding: 'cladding-tiles',
  Bricks: 'bricks',
  Paving: 'paving',
  Blocks: 'breeze-blocks',
};

const earthyPalette = ['#8b4513', '#a0522d', '#4b3621', '#d2b48c', '#5d4037', '#6b1b1b', '#708090', '#b87333', '#7c5a3a', '#556b2f'];
const finishColorMap: Record<string, string> = {
  Travertine: '#b08968',
  Ribbed: '#7f5539',
  Smooth: '#9c6644',
  Satin: '#8d99ae',
  Rustic: '#6f4e37',
  Variation: '#8a6d5a',
};
const typeColorMap: Record<string, string> = {
  Classic: '#8b4513',
  Modern: '#708090',
  Natural: '#b08968',
  Premium: '#4b3621',
  NFP: '#a0522d',
  NFX: '#d2b48c',
  FBA: '#8b4513',
  FBS: '#708090',
  FBX: '#b22222',
  Maxi: '#5d4037',
  Bevel: '#7c5a3a',
  'Split-Bevel': '#8d6e63',
  Interlocking: '#556b2f',
  Cement: '#808080',
  Breeze: '#d4c4a8',
  Clay: '#a0522d',
};

let storefrontCache: StorefrontData | null = null;
let storefrontPromise: Promise<StorefrontData> | null = null;
const storefrontListeners = new Set<() => void>();

const fallbackCategoryDefaults: Record<
  StorefrontCategoryKey,
  {
    pricingUnit: ProductQuoteModel['pricingUnit'];
    unitsPerM2: number;
    weightPerPieceKg: number;
    piecesPerPallet: number;
    boxesPerPallet?: number;
    palletsPerTruck: number;
  }
> = {
  'cladding-tiles': {
    pricingUnit: 'm2',
    unitsPerM2: 50,
    weightPerPieceKg: 0.3,
    piecesPerPallet: 2000,
    boxesPerPallet: 40,
    palletsPerTruck: 24,
  },
  bricks: {
    pricingUnit: 'piece',
    unitsPerM2: 55,
    weightPerPieceKg: 3.1,
    piecesPerPallet: 500,
    palletsPerTruck: 24,
  },
  paving: {
    pricingUnit: 'piece',
    unitsPerM2: 50,
    weightPerPieceKg: 2.8,
    piecesPerPallet: 360,
    palletsPerTruck: 24,
  },
  'breeze-blocks': {
    pricingUnit: 'piece',
    unitsPerM2: 12.5,
    weightPerPieceKg: 7.8,
    piecesPerPallet: 100,
    palletsPerTruck: 24,
  },
};

function hashIndex(value: string, modulo: number) {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash % modulo;
}

function getDeterministicColor(detail: InventoryProductDetail) {
  return (
    (detail.finish ? finishColorMap[detail.finish] : undefined) ??
    typeColorMap[detail.productType] ??
    earthyPalette[hashIndex(`${detail.category}:${detail.productType}:${detail.name}`, earthyPalette.length)]
  );
}

function uniqueUrls(urls: Array<string | null | undefined>) {
  return Array.from(new Set(urls.filter((url): url is string => Boolean(url && url.trim()))));
}

function buildGallery(detail: InventoryProductDetail) {
  return uniqueUrls([
    detail.requiredMedia.heroImageUrl,
    detail.requiredMedia.primaryImageUrl,
    detail.requiredMedia.galleryImageUrl,
    detail.requiredMedia.faceImageUrl,
    ...detail.media.map((asset) => asset.img),
  ]);
}

function formatPrice(value: number) {
  return `R ${value.toFixed(2)}`;
}

function parsePriceString(value: unknown) {
  const numeric = parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeLegacyImage(item: Record<string, any>) {
  return item.image ?? item.images?.[0] ?? '';
}

function buildModule(detail: InventoryProductDetail) {
  return `${detail.dimensions.lengthMm}mm x ${detail.dimensions.widthMm}mm x ${detail.dimensions.heightMm}mm`;
}

function buildCoverage(detail: InventoryProductDetail) {
  const units = Math.max(1, Math.ceil(detail.dimensions.unitsPerM2 || 0));
  const unitLabel = detail.category === 'Bricks' ? 'bricks' : detail.category === 'Cladding' ? 'tiles' : detail.category === 'Paving' ? 'pavers' : 'blocks';
  const boxSuffix = detail.category === 'Cladding' ? ' • 1 box / sqm' : '';
  return `${units} ${unitLabel} / sqm${boxSuffix}`;
}

function buildBoxDetail(detail: InventoryProductDetail) {
  if (detail.category === 'Cladding') {
    return `Incl VAT • 1 box = 1 m² • ${detail.packaging.boxesPerPallet} boxes / pallet`;
  }

  return `Incl VAT • ${buildCoverage(detail)} • ${detail.packaging.piecesPerPallet} units / pallet`;
}

function buildCatalogItem(detail: InventoryProductDetail): StorefrontCatalogItem {
  const images = buildGallery(detail);
  const categoryKey = categoryKeyByInventoryCategory[detail.category];
  const quoteModel: ProductQuoteModel = {
    inventoryProductId: detail.id,
    name: detail.name,
    categoryKey,
    pricingUnit: detail.pricing.unit,
    sellPriceZar: detail.pricing.sellPriceZar,
    unitsPerM2: detail.dimensions.unitsPerM2,
    weightPerPieceKg: detail.dimensions.weightKg,
    piecesPerPallet: detail.packaging.piecesPerPallet,
    boxesPerPallet: detail.packaging.boxesPerPallet,
    palletsPerTruck: detail.packaging.palletsPerTruck,
    logistics: {
      costPricePerKm: detail.logistics.costPricePerKm ?? 25,
      sellPricePerKm: detail.logistics.sellPricePerKm ?? 35,
      fixedFee: detail.logistics.fixedFee ?? 0,
      minimumCharge: detail.logistics.minimumCharge ?? 0,
      originRegion: detail.logistics.defaultOriginRegion,
      originCity: detail.logistics.defaultOriginCity,
    },
  };
  const rates = computeProductQuoteRates(quoteModel);

  return {
    id: detail.id.toLowerCase(),
    inventoryProductId: detail.id,
    publicSku: detail.publicSku,
    name: detail.name,
    mood: detail.category === 'Bricks' ? undefined : detail.productType,
    category: detail.category === 'Bricks' ? detail.category : undefined,
    subCategory: detail.category === 'Bricks' ? detail.productType : undefined,
    color: getDeterministicColor(detail),
    price: formatStoredPriceLabel(quoteModel),
    description: detail.marketingCopy.trim() || detail.description,
    image: images[0] ?? detail.primaryImageUrl,
    images,
    faceImageUrl: detail.requiredMedia.faceImageUrl ?? detail.requiredMedia.primaryImageUrl ?? images[0],
    specs: {
      module: buildModule(detail),
      coverage: buildCoverage(detail),
      selection: detail.finish ?? detail.productType,
      boxDetail: buildBoxDetail(detail),
    },
    technicalTests: detail.testResults,
    specSheetUrl: `/api/inventory/products/${detail.id}/spec-sheet.pdf`,
    region: detail.suppliers[0]?.region,
    quoteModel,
    commerce: {
      storedPriceLabel: formatStoredPriceLabel(quoteModel),
      pricePerPieceLabel: `${formatPrice(rates.pricePerPieceZar)} / ${detail.category === 'Bricks' ? 'brick' : detail.category === 'Paving' ? 'paver' : detail.category === 'Blocks' ? 'block' : 'tile'}`,
      pricePerSqmLabel: `${formatPrice(rates.pricePerSqmZar)} / m²`,
      pricePerBoxLabel: detail.category === 'Cladding' ? `${formatPrice(rates.pricePerBoxZar)} / box` : undefined,
      pricePerPalletLabel: `${formatPrice(rates.pricePerPalletZar)} / pallet`,
    },
  };
}

function buildFallbackCatalogItem(categoryKey: StorefrontCategoryKey, item: Record<string, any>): StorefrontCatalogItem {
  const defaults = fallbackCategoryDefaults[categoryKey];
  const quoteModel: ProductQuoteModel = {
    name: item.name,
    categoryKey,
    pricingUnit: defaults.pricingUnit,
    sellPriceZar: parsePriceString(item.price),
    unitsPerM2: defaults.unitsPerM2,
    weightPerPieceKg: defaults.weightPerPieceKg,
    piecesPerPallet: defaults.piecesPerPallet,
    boxesPerPallet: defaults.boxesPerPallet ?? null,
    palletsPerTruck: defaults.palletsPerTruck,
    logistics: {
      costPricePerKm: 25,
      sellPricePerKm: 35,
      fixedFee: 0,
      minimumCharge: 0,
      originRegion: item.region,
    },
  };
  const rates = computeProductQuoteRates(quoteModel);
  const image = normalizeLegacyImage(item);

  return {
    id: item.id,
    inventoryProductId: item.inventoryProductId ?? item.id,
    publicSku: item.publicSku ?? item.id?.toUpperCase?.() ?? item.name.toUpperCase().replace(/\s+/g, '-'),
    name: item.name,
    mood: item.mood,
    category: item.category,
    subCategory: item.subCategory,
    color: item.color,
    price: formatStoredPriceLabel(quoteModel),
    description: item.description,
    image,
    images: Array.isArray(item.images) ? item.images : image ? [image] : [],
    faceImageUrl: image,
    specs: {
      module: item.specs?.module ?? '',
      coverage: item.specs?.coverage ?? (categoryKey === 'cladding-tiles' ? '50 tiles / sqm • 1 box / sqm' : `${defaults.unitsPerM2} units / sqm`),
      selection: item.specs?.selection ?? item.subCategory ?? item.mood ?? '',
      boxDetail:
        item.specs?.boxDetail ??
        (categoryKey === 'cladding-tiles'
          ? `Incl VAT • 1 box = 1 m² • ${rates.boxesPerPallet} boxes / pallet`
          : `Incl VAT • ${rates.sqmPerPallet.toFixed(2)} m² / pallet • ${defaults.piecesPerPallet} units / pallet`),
    },
    technicalTests: [],
    region: item.region,
    quoteModel,
    commerce: {
      storedPriceLabel: formatStoredPriceLabel(quoteModel),
      pricePerPieceLabel: `${formatPrice(rates.pricePerPieceZar)} / ${categoryKey === 'bricks' ? 'brick' : categoryKey === 'paving' ? 'paver' : categoryKey === 'breeze-blocks' ? 'block' : 'tile'}`,
      pricePerSqmLabel: `${formatPrice(rates.pricePerSqmZar)} / m²`,
      pricePerBoxLabel: categoryKey === 'cladding-tiles' ? `${formatPrice(rates.pricePerBoxZar)} / box` : undefined,
      pricePerPalletLabel: `${formatPrice(rates.pricePerPalletZar)} / pallet`,
    },
  };
}

function normalizeFallbackCategoryData(categoryKey: StorefrontCategoryKey, category: Record<string, any>): StorefrontCategoryData {
  return {
    ...category,
    catalog: Array.isArray(category.catalog)
      ? category.catalog.map((item: Record<string, any>) => buildFallbackCatalogItem(categoryKey, item))
      : [],
  };
}

function getBaseStorefrontData() {
  return {
    'cladding-tiles': normalizeFallbackCategoryData('cladding-tiles', productData['cladding-tiles'] as Record<string, any>),
    bricks: normalizeFallbackCategoryData('bricks', productData.bricks as Record<string, any>),
    paving: normalizeFallbackCategoryData('paving', productData.paving as Record<string, any>),
    'breeze-blocks': normalizeFallbackCategoryData('breeze-blocks', productData['breeze-blocks'] as Record<string, any>),
  } as StorefrontData;
}

function buildCategoryData(
  categoryKey: StorefrontCategoryKey,
  details: InventoryProductDetail[],
): StorefrontCategoryData {
  const fallback = productData[categoryKey] as Record<string, any>;
  const catalog = details.map((detail) => buildCatalogItem(detail));
  const heroProduct = details[0];
  const heroImages = buildGallery(heroProduct);

  return {
    ...fallback,
    productName: heroProduct.name,
    category:
      categoryKey === 'cladding-tiles'
        ? 'Thin Brick Tiles'
        : categoryKey === 'bricks'
          ? 'Solid Clay Bricks'
          : categoryKey === 'paving'
            ? 'Architectural Paving'
            : 'Architectural Blocks',
    materialStory: {
      ...fallback.materialStory,
      title: heroProduct.name.toUpperCase(),
      subtitle: (heroProduct.finish ?? heroProduct.productType).toUpperCase(),
      description: heroProduct.marketingCopy.trim() || heroProduct.description,
      metrics: [
        {
          value: `${heroProduct.dimensions.weightKg.toFixed(2)}kg`,
          label: 'UNIT WEIGHT',
          description: `Deterministic order weight is computed from the stored per-unit weight for ${heroProduct.name}.`,
        },
        {
          value: `${heroProduct.dimensions.unitsPerM2.toFixed(2)}`,
          label: 'UNITS / M²',
          description: `Coverage is calculated from ${buildModule(heroProduct)} using ${heroProduct.dimensions.coverageOrientation}.`,
        },
      ],
    },
    technical: {
      ...fallback.technical,
      specs: [
        { label: 'LENGTH', value: `${heroProduct.dimensions.lengthMm}mm`, position: { x: -1, y: 1 } },
        { label: 'WIDTH', value: `${heroProduct.dimensions.widthMm}mm`, position: { x: -1, y: -1 } },
        { label: 'HEIGHT', value: `${heroProduct.dimensions.heightMm}mm`, position: { x: 1, y: 1 } },
        { label: 'FINISH', value: heroProduct.finish ?? heroProduct.productType, position: { x: 1, y: -1 } },
      ],
    },
    showcase: {
      ...fallback.showcase,
      title: `${heroProduct.name.toUpperCase()}\nIN CONTEXT`,
      description: heroProduct.marketingCopy.trim() || heroProduct.description,
      image: heroImages[0] ?? fallback.showcase.image,
      application: heroProduct.category,
      mortarJoint: heroProduct.finish ?? fallback.showcase.mortarJoint,
    },
    topSellers: catalog.slice(0, 4).map((item, index) => ({
      id: item.id,
      name: item.name.toUpperCase(),
      price: item.price,
      image: item.image,
      tag: index === 0 ? 'PUBLISHED' : 'LIVE',
    })),
    catalog,
    ...(categoryKey === 'bricks' ? { brickTypesGuide: fallback.brickTypesGuide, cementBrickSpecs: fallback.cementBrickSpecs } : {}),
  };
}

async function loadStorefrontData() {
  if (storefrontCache) {
    return storefrontCache;
  }

  if (!storefrontPromise) {
    storefrontPromise = fetchInventoryProductDetails()
      .then((details) => {
        const baseData = getBaseStorefrontData();
        const published = details.filter((detail) => detail.publishStatus === 'Published');

        if (published.length === 0) {
          storefrontCache = baseData;
          return storefrontCache;
        }

        const grouped = published.reduce<Record<StorefrontCategoryKey, InventoryProductDetail[]>>(
          (accumulator, detail) => {
            const key = categoryKeyByInventoryCategory[detail.category];
            accumulator[key].push(detail);
            return accumulator;
          },
          {
            'cladding-tiles': [],
            bricks: [],
            paving: [],
            'breeze-blocks': [],
          },
        );

        storefrontCache = {
          ...baseData,
          'cladding-tiles': grouped['cladding-tiles'].length > 0 ? buildCategoryData('cladding-tiles', grouped['cladding-tiles']) : baseData['cladding-tiles'],
          bricks: grouped.bricks.length > 0 ? buildCategoryData('bricks', grouped.bricks) : baseData.bricks,
          paving: grouped.paving.length > 0 ? buildCategoryData('paving', grouped.paving) : baseData.paving,
          'breeze-blocks':
            grouped['breeze-blocks'].length > 0 ? buildCategoryData('breeze-blocks', grouped['breeze-blocks']) : baseData['breeze-blocks'],
        } as StorefrontData;

        return storefrontCache;
      })
      .catch(() => {
        storefrontCache = getBaseStorefrontData();
        return storefrontCache;
      })
      .finally(() => {
        storefrontPromise = null;
      });
  }

  return storefrontPromise;
}

export function useStorefrontCatalogData() {
  const [data, setData] = useState<StorefrontData>(storefrontCache ?? getBaseStorefrontData());
  const [isLoading, setIsLoading] = useState(!storefrontCache);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const listener = () => {
      setRefreshToken((current) => current + 1);
      setIsLoading(true);
    };

    storefrontListeners.add(listener);
    return () => {
      storefrontListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    let active = true;

    void loadStorefrontData().then((next) => {
      if (!active) {
        return;
      }
      setData(next);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [refreshToken]);

  return { data, isLoading };
}

export function useStorefrontCategoryData(activeCategory: StorefrontCategoryKey) {
  const { data, isLoading } = useStorefrontCatalogData();
  const categoryData = useMemo(() => data[activeCategory], [activeCategory, data]);
  return { categoryData, isLoading };
}

export function invalidateStorefrontCatalogData() {
  storefrontCache = null;
  storefrontPromise = null;
  storefrontListeners.forEach((listener) => listener());
}
