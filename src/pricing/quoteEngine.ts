import type { InventoryPricingUnit } from '../inventory/contracts';

export type QuoteCategoryKey = 'cladding-tiles' | 'bricks' | 'paving' | 'breeze-blocks';
export type QuoteQuantityUnit = 'piece' | 'm2' | 'box' | 'pallet';
export type MeasureUnit = 'm' | 'mm';
export type DistanceResolutionSource = 'live' | 'fallback';

export interface ProductQuoteModel {
  inventoryProductId?: string;
  name: string;
  categoryKey: QuoteCategoryKey;
  pricingUnit: InventoryPricingUnit;
  sellPriceZar: number;
  unitsPerM2: number;
  weightPerPieceKg: number;
  piecesPerPallet: number;
  palletsPerTruck: number;
  boxesPerPallet?: number | null;
  logistics: {
    costPricePerKm?: number;
    sellPricePerKm: number;
    fixedFee?: number;
    minimumCharge?: number;
    originRegion?: string;
    originCity?: string;
    originLatitude?: number | null;
    originLongitude?: number | null;
  };
}

export interface ProductQuoteRates {
  pricePerPieceZar: number;
  pricePerSqmZar: number;
  pricePerBoxZar: number;
  pricePerPalletZar: number;
  sqmPerBox: number;
  piecesPerBox: number;
  boxesPerPallet: number;
  boxesPerTruck: number;
  sqmPerPallet: number;
  piecesPerTruck: number;
  sqmPerTruck: number;
  weightPerPalletKg: number;
  weightPerTruckKg: number;
}

export interface QuoteEstimationInput {
  width: number;
  height: number;
  unit: MeasureUnit;
  wastage: number;
}

export interface QuoteEstimationResult {
  totalArea: number;
  totalAreaWithWastage: number;
  tileQuantity: number;
  palletQuantity: number;
  totalMass: number;
  totalInvestment: number;
  formattedArea: string;
  formattedQuantity: string;
  formattedMass: string;
  formattedInvestment: string;
}

export interface DistanceResolution {
  distanceKm: number;
  source: DistanceResolutionSource;
  provider?: string;
}

export interface QuoteBreakdown {
  quoteUnit: QuoteQuantityUnit;
  quoteUnitQuantity: number;
  minimumQuoteUnitQuantity: number;
  pieces: number;
  sqm: number;
  boxes: number;
  pallets: number;
  orderWeightKg: number;
  productTotalZar: number;
  deliveryTotalZar: number;
  discountZar: number;
  discountPercent: number;
  totalZar: number;
  pricePerPieceDeliveredZar: number;
  pricePerSqmDeliveredZar: number;
  pricePerBoxDeliveredZar: number;
  pricePerPalletDeliveredZar: number;
  savingsPercent: number;
  distanceKm: number;
  distanceSource: DistanceResolutionSource;
  isFullTruck: boolean;
  rates: ProductQuoteRates;
}

type Coordinates = { latitude: number; longitude: number };

const SA_REGION_COORDINATES: Record<string, Coordinates> = {
  gauteng: { latitude: -26.2708, longitude: 28.1123 },
  'north west': { latitude: -26.6639, longitude: 25.2838 },
  limpopo: { latitude: -23.4013, longitude: 29.4179 },
  mpumalanga: { latitude: -25.5653, longitude: 30.5279 },
  'free state': { latitude: -28.4541, longitude: 26.7968 },
  kzn: { latitude: -28.5305, longitude: 30.8958 },
  'kwazulu-natal': { latitude: -28.5305, longitude: 30.8958 },
  'northern cape': { latitude: -29.0467, longitude: 21.8569 },
  'eastern cape': { latitude: -32.2968, longitude: 26.4194 },
  'western cape': { latitude: -33.2278, longitude: 21.8569 },
  'cape town': { latitude: -33.9249, longitude: 18.4241 },
  kimberley: { latitude: -28.7282, longitude: 24.7499 },
  johannesburg: { latitude: -26.2041, longitude: 28.0473 },
  durban: { latitude: -29.8587, longitude: 31.0218 },
  pretoria: { latitude: -25.7479, longitude: 28.2293 },
};

const DEFAULT_ROUTE_DISTANCE_KM = 50;

const CATEGORY_DEFAULTS: Record<
  QuoteCategoryKey,
  {
    pricingUnit: InventoryPricingUnit;
    unitsPerM2: number;
    piecesPerPallet: number;
    palletsPerTruck: number;
    boxesPerPallet?: number;
  }
> = {
  'cladding-tiles': {
    pricingUnit: 'm2',
    unitsPerM2: 50,
    piecesPerPallet: 2000,
    palletsPerTruck: 24,
    boxesPerPallet: 40,
  },
  bricks: {
    pricingUnit: 'piece',
    unitsPerM2: 55,
    piecesPerPallet: 500,
    palletsPerTruck: 24,
  },
  paving: {
    pricingUnit: 'piece',
    unitsPerM2: 50,
    piecesPerPallet: 360,
    palletsPerTruck: 24,
  },
  'breeze-blocks': {
    pricingUnit: 'piece',
    unitsPerM2: 12.5,
    piecesPerPallet: 100,
    palletsPerTruck: 24,
  },
};

const DEFAULT_LOGISTICS = {
  costPricePerKm: 25,
  sellPricePerKm: 35,
  fixedFee: 0,
  minimumCharge: 0,
};

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clampPositive(value: number | null | undefined, fallback: number) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : fallback;
}

function normalizeRegionKey(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function findCoordinates(value?: string | null): Coordinates | null {
  const normalized = normalizeRegionKey(value);
  if (!normalized) {
    return null;
  }

  if (SA_REGION_COORDINATES[normalized]) {
    return SA_REGION_COORDINATES[normalized];
  }

  for (const [key, coordinates] of Object.entries(SA_REGION_COORDINATES)) {
    if (normalized.includes(key)) {
      return coordinates;
    }
  }

  return null;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(start: Coordinates, end: Coordinates) {
  const earthRadiusKm = 6371;
  const latDistance = toRadians(end.latitude - start.latitude);
  const lonDistance = toRadians(end.longitude - start.longitude);
  const a =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(toRadians(start.latitude)) * Math.cos(toRadians(end.latitude)) * Math.sin(lonDistance / 2) ** 2;

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function resolveOriginCoordinates(model: ProductQuoteModel) {
  if (model.logistics.originLatitude && model.logistics.originLongitude) {
    return {
      latitude: model.logistics.originLatitude,
      longitude: model.logistics.originLongitude,
    };
  }

  return findCoordinates(model.logistics.originCity) ?? findCoordinates(model.logistics.originRegion);
}

export function getPieceLabel(categoryKey: QuoteCategoryKey) {
  switch (categoryKey) {
    case 'bricks':
      return 'brick';
    case 'paving':
      return 'paver';
    case 'breeze-blocks':
      return 'block';
    default:
      return 'tile';
  }
}

export function getPricingUnitLabel(unit: QuoteQuantityUnit, categoryKey: QuoteCategoryKey, quantity = 1) {
  if (unit === 'piece') {
    const label = getPieceLabel(categoryKey);
    return quantity === 1 ? label : `${label}s`;
  }

  if (unit === 'm2') {
    return 'm²';
  }

  if (unit === 'box') {
    return quantity === 1 ? 'box' : 'boxes';
  }

  return quantity === 1 ? 'pallet' : 'pallets';
}

export function getRecommendedQuoteUnit(model: ProductQuoteModel): QuoteQuantityUnit {
  if (model.categoryKey === 'bricks') {
    return 'pallet';
  }

  if (model.categoryKey === 'cladding-tiles') {
    return 'm2';
  }

  return model.pricingUnit;
}

export function normalizeQuoteModel(model: ProductQuoteModel): ProductQuoteModel {
  const categoryDefaults = CATEGORY_DEFAULTS[model.categoryKey];
  const palletsPerTruck = Math.max(1, Math.round(clampPositive(model.palletsPerTruck, categoryDefaults.palletsPerTruck)));
  const piecesPerPallet = Math.max(1, Math.round(clampPositive(model.piecesPerPallet, categoryDefaults.piecesPerPallet)));
  const boxesPerPallet =
    model.categoryKey === 'cladding-tiles'
      ? Math.max(1, Math.round(clampPositive(model.boxesPerPallet, categoryDefaults.boxesPerPallet ?? 40)))
      : Math.max(0, Math.round(clampPositive(model.boxesPerPallet, 0)));
  const unitsPerM2 =
    model.categoryKey === 'cladding-tiles'
      ? round(piecesPerPallet / boxesPerPallet, 4)
      : clampPositive(model.unitsPerM2, categoryDefaults.unitsPerM2);

  return {
    ...model,
    pricingUnit: categoryDefaults.pricingUnit,
    unitsPerM2,
    weightPerPieceKg: clampPositive(model.weightPerPieceKg, 0),
    piecesPerPallet,
    palletsPerTruck,
    boxesPerPallet,
    logistics: {
      costPricePerKm: clampPositive(model.logistics.costPricePerKm, DEFAULT_LOGISTICS.costPricePerKm),
      sellPricePerKm: clampPositive(model.logistics.sellPricePerKm, DEFAULT_LOGISTICS.sellPricePerKm),
      fixedFee: Math.max(0, clampPositive(model.logistics.fixedFee, DEFAULT_LOGISTICS.fixedFee)),
      minimumCharge: Math.max(0, clampPositive(model.logistics.minimumCharge, DEFAULT_LOGISTICS.minimumCharge)),
      originRegion: model.logistics.originRegion,
      originCity: model.logistics.originCity,
      originLatitude: model.logistics.originLatitude ?? null,
      originLongitude: model.logistics.originLongitude ?? null,
    },
  };
}

export function computeProductQuoteRates(input: ProductQuoteModel): ProductQuoteRates {
  const model = normalizeQuoteModel(input);
  const { boxesPerPallet, palletsPerTruck, piecesPerPallet, sellPriceZar, pricingUnit, unitsPerM2, weightPerPieceKg } = model;

  const pricePerPieceZar =
    pricingUnit === 'piece'
      ? sellPriceZar
      : pricingUnit === 'm2'
        ? sellPriceZar / unitsPerM2
        : sellPriceZar / piecesPerPallet;

  const sqmPerBox = model.categoryKey === 'cladding-tiles' ? 1 : boxesPerPallet > 0 ? (piecesPerPallet / unitsPerM2) / boxesPerPallet : 0;
  const piecesPerBox = sqmPerBox > 0 ? unitsPerM2 * sqmPerBox : 0;
  const sqmPerPallet = unitsPerM2 > 0 ? piecesPerPallet / unitsPerM2 : 0;
  const pricePerSqmZar = pricePerPieceZar * unitsPerM2;
  const pricePerBoxZar = sqmPerBox > 0 ? pricePerSqmZar * sqmPerBox : 0;
  const pricePerPalletZar = pricePerPieceZar * piecesPerPallet;
  const piecesPerTruck = piecesPerPallet * palletsPerTruck;
  const boxesPerTruck = boxesPerPallet * palletsPerTruck;
  const sqmPerTruck = sqmPerPallet * palletsPerTruck;
  const weightPerPalletKg = piecesPerPallet * weightPerPieceKg;
  const weightPerTruckKg = piecesPerTruck * weightPerPieceKg;

  return {
    pricePerPieceZar: round(pricePerPieceZar, 4),
    pricePerSqmZar: round(pricePerSqmZar, 2),
    pricePerBoxZar: round(pricePerBoxZar, 2),
    pricePerPalletZar: round(pricePerPalletZar, 2),
    sqmPerBox: round(sqmPerBox, 4),
    piecesPerBox: round(piecesPerBox, 4),
    boxesPerPallet,
    boxesPerTruck,
    sqmPerPallet: round(sqmPerPallet, 4),
    piecesPerTruck,
    sqmPerTruck: round(sqmPerTruck, 4),
    weightPerPalletKg: round(weightPerPalletKg, 3),
    weightPerTruckKg: round(weightPerTruckKg, 3),
  };
}

export function convertQuantity(input: ProductQuoteModel, quantity: number, fromUnit: QuoteQuantityUnit, toUnit: QuoteQuantityUnit) {
  const model = normalizeQuoteModel(input);
  const rates = computeProductQuoteRates(model);
  const normalizedQuantity = Math.max(0, quantity);

  let pieces = normalizedQuantity;
  if (fromUnit === 'm2') {
    pieces = normalizedQuantity * model.unitsPerM2;
  } else if (fromUnit === 'box') {
    pieces = rates.piecesPerBox > 0 ? normalizedQuantity * rates.piecesPerBox : normalizedQuantity;
  } else if (fromUnit === 'pallet') {
    pieces = normalizedQuantity * model.piecesPerPallet;
  }

  if (toUnit === 'piece') {
    return pieces;
  }

  if (toUnit === 'm2') {
    return model.unitsPerM2 > 0 ? pieces / model.unitsPerM2 : 0;
  }

  if (toUnit === 'box') {
    return rates.piecesPerBox > 0 ? pieces / rates.piecesPerBox : 0;
  }

  return model.piecesPerPallet > 0 ? pieces / model.piecesPerPallet : 0;
}

export function calculateDeterministicProjectEstimation(product: ProductQuoteModel, dims: QuoteEstimationInput): QuoteEstimationResult {
  const normalizedProduct = normalizeQuoteModel(product);
  const factor = dims.unit === 'mm' ? 1000 : 1;
  const widthM = dims.width / factor;
  const heightM = dims.height / factor;
  const totalArea = widthM * heightM;
  const totalAreaWithWastage = totalArea * (1 + dims.wastage / 100);
  const tileQuantity = Math.ceil(totalAreaWithWastage * normalizedProduct.unitsPerM2);
  const palletQuantity = Math.max(1, Math.ceil(tileQuantity / normalizedProduct.piecesPerPallet));
  const rates = computeProductQuoteRates(normalizedProduct);
  const totalMass = tileQuantity * normalizedProduct.weightPerPieceKg;
  const totalInvestment = tileQuantity * rates.pricePerPieceZar;

  return {
    totalArea: round(totalArea, 2),
    totalAreaWithWastage: round(totalAreaWithWastage, 2),
    tileQuantity,
    palletQuantity,
    totalMass: round(totalMass, 2),
    totalInvestment: round(totalInvestment, 2),
    formattedArea: round(totalAreaWithWastage, 2).toFixed(2),
    formattedQuantity: tileQuantity.toLocaleString('en-ZA'),
    formattedMass: round(totalMass, 1).toFixed(1),
    formattedInvestment: formatZar(totalInvestment),
  };
}

export function resolveTransportDistance(input: { product: ProductQuoteModel; province?: string }): DistanceResolution {
  const product = normalizeQuoteModel(input.product);
  const origin = resolveOriginCoordinates(product);
  const destination = findCoordinates(input.province);

  if (!origin || !destination) {
    return {
      distanceKm: DEFAULT_ROUTE_DISTANCE_KM,
      source: 'fallback',
    };
  }

  const straightLineDistance = haversineDistanceKm(origin, destination);
  return {
    distanceKm: round(Math.max(DEFAULT_ROUTE_DISTANCE_KM, straightLineDistance * 1.18), 2),
    source: 'fallback',
  };
}

export function calculateQuoteBreakdown(input: {
  product: ProductQuoteModel;
  quantity: number;
  quantityUnit?: QuoteQuantityUnit;
  minimumQuantity?: number;
  province?: string;
  distanceKm?: number;
  isDelivery: boolean;
}) {
  const product = normalizeQuoteModel(input.product);
  const quoteUnit = input.quantityUnit ?? getRecommendedQuoteUnit(product);
  const minimumQuoteUnitQuantity = Math.max(1, Math.ceil(input.minimumQuantity ?? 1));
  const quoteUnitQuantity = Math.max(minimumQuoteUnitQuantity, Math.ceil(input.quantity));
  const rates = computeProductQuoteRates(product);
  const pieces = convertQuantity(product, quoteUnitQuantity, quoteUnit, 'piece');
  const sqm = convertQuantity(product, quoteUnitQuantity, quoteUnit, 'm2');
  const boxes = convertQuantity(product, quoteUnitQuantity, quoteUnit, 'box');
  const pallets = convertQuantity(product, quoteUnitQuantity, quoteUnit, 'pallet');
  const productTotalZar = round(pieces * rates.pricePerPieceZar, 2);

  const distanceResolution =
    input.distanceKm !== undefined
      ? { distanceKm: round(Math.max(0, input.distanceKm), 2), source: 'fallback' as const }
      : resolveTransportDistance({ product, province: input.province });

  const distanceKm = distanceResolution.distanceKm;
  const deliveryTotalZar = input.isDelivery ? round(distanceKm * product.logistics.sellPricePerKm, 2) : 0;
  const totalZar = round(productTotalZar + deliveryTotalZar, 2);
  const orderWeightKg = round(pieces * product.weightPerPieceKg, 3);

  const minPieces = convertQuantity(product, minimumQuoteUnitQuantity, quoteUnit, 'piece');
  const minimumProductTotalZar = round(minPieces * rates.pricePerPieceZar, 2);
  const minimumTotalZar = round(minimumProductTotalZar + deliveryTotalZar, 2);
  const minimumPerPieceDelivered = minPieces > 0 ? minimumTotalZar / minPieces : 0;
  const pricePerPieceDeliveredZar = pieces > 0 ? totalZar / pieces : 0;
  const savingsPercent =
    quoteUnitQuantity > minimumQuoteUnitQuantity && minimumPerPieceDelivered > 0
      ? ((minimumPerPieceDelivered - pricePerPieceDeliveredZar) / minimumPerPieceDelivered) * 100
      : 0;

  return {
    quoteUnit,
    quoteUnitQuantity,
    minimumQuoteUnitQuantity,
    pieces: Math.ceil(pieces),
    sqm: round(sqm, 2),
    boxes: round(boxes, 2),
    pallets: round(pallets, 2),
    orderWeightKg,
    productTotalZar,
    deliveryTotalZar,
    discountZar: 0,
    discountPercent: 0,
    totalZar,
    pricePerPieceDeliveredZar: round(pricePerPieceDeliveredZar, 4),
    pricePerSqmDeliveredZar: sqm > 0 ? round(totalZar / sqm, 2) : 0,
    pricePerBoxDeliveredZar: boxes > 0 ? round(totalZar / boxes, 2) : 0,
    pricePerPalletDeliveredZar: pallets > 0 ? round(totalZar / pallets, 2) : 0,
    savingsPercent: round(savingsPercent, 2),
    distanceKm,
    distanceSource: distanceResolution.source,
    isFullTruck: input.isDelivery && pallets >= product.palletsPerTruck,
    rates,
  } satisfies QuoteBreakdown;
}

export function formatZar(value: number) {
  return `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatStoredPriceLabel(model: ProductQuoteModel) {
  const unitLabel = getPricingUnitLabel(normalizeQuoteModel(model).pricingUnit, model.categoryKey, 1);
  return `${formatZar(model.sellPriceZar)} / ${unitLabel}`;
}
