import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyPriceListImport,
  createInventoryProduct as createInventoryProductRequest,
  createPriceListImport,
  fetchInventoryDashboard,
  fetchInventoryProductDetails,
  fetchInventoryProducts,
  fetchInventorySuppliers,
} from './api';
import type {
  CreateInventoryProductInput,
  CreatePriceListImportInput,
  InventoryDashboardSnapshot,
  InventoryProductDetail,
  InventoryProductSummary,
  PriceListImportResult,
  SupplierSummary,
} from './contracts';

export interface InventoryUiProduct {
  id: string;
  recordId: string;
  name: string;
  sku: string;
  category: string;
  productType: string;
  status: 'Active' | 'Draft' | 'Archived' | 'Out of Stock';
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  margin: string;
  suppliersCount: number;
  catalogHealth: number;
  assetReadiness: number;
  threedReadiness: number;
  marketingReadiness: number;
  publishReadiness: number;
  blockers: string[];
  img: string;
  media: {
    id: string;
    role: 'hero' | 'gallery' | 'face_texture' | 'detail_texture' | 'installation' | 'cutout' | 'quote_render' | 'marketing_variant' | '3d_texture_set' | 'model_reference';
    url: string;
    status: 'Ready' | 'Pending' | 'Missing';
    type: 'Image' | 'Video' | '3D Asset';
  }[];
  specs: Record<string, string>;
  history: { date: string; action: string; user: string }[];
}

export interface InventoryUiAsset {
  id: string;
  name: string;
  type: 'Image' | 'Video' | '3D Asset' | '3D Render' | 'Model';
  protectionLevel: 'Protected Original' | 'Managed Variant' | 'Publishable Variant';
  size: string;
  status: 'Draft' | 'Review' | 'Approved' | 'Archived' | 'Restricted';
  usage: ('Hero' | 'Gallery' | 'Installation' | 'Detail' | 'Campaign' | '3D Ready' | 'Model' | 'Render' | 'Publishable Variant')[];
  img: string;
  parentId?: string;
  productId?: string;
  productName?: string;
  linkedProductIds?: string[];
  linkedCampaignIds?: string[];
  completeness?: number;
  is3DReady?: boolean;
  campaignId?: string;
  campaignName?: string;
  tags: string[];
  workflowNode?: 'asset.uploaded' | 'variant.generated' | 'creative.approved';
  pipeline?: {
    sourceUploaded: boolean;
    textureReady: boolean;
    previewAttached: boolean;
    modelReferenceAttached: boolean;
    conversionStatus: 'Pending' | 'Processing' | 'Complete' | 'Failed';
  };
  watermarkProfile?: string;
  backgroundTransparent?: boolean;
}

function mapMediaRole(usage: string[]): InventoryUiProduct['media'][number]['role'] {
  const joined = usage.join(' ').toLowerCase();
  if (joined.includes('hero')) return 'hero';
  if (joined.includes('model reference')) return 'model_reference';
  if (joined.includes('installation') || joined.includes('render')) return 'installation';
  if (joined.includes('detail texture')) return 'detail_texture';
  if (joined.includes('face texture')) return 'face_texture';
  if (joined.includes('gallery')) return 'gallery';
  if (joined.includes('quote')) return 'quote_render';
  if (joined.includes('marketing')) return 'marketing_variant';
  if (joined.includes('3d') || joined.includes('pbr') || joined.includes('model')) return '3d_texture_set';
  return 'gallery';
}

function mapMediaStatus(status: string): InventoryUiProduct['media'][number]['status'] {
  if (status === 'Approved') return 'Ready';
  if (status === 'Restricted') return 'Missing';
  return 'Pending';
}

function mapMediaType(type: string): InventoryUiProduct['media'][number]['type'] {
  if (type === 'Video') return 'Video';
  if (type === '3D Asset' || type === '3D Render' || type === 'Model') return '3D Asset';
  return 'Image';
}

function mapProduct(detail: InventoryProductDetail): InventoryUiProduct {
  return {
    id: detail.id,
    recordId: detail.recordId,
    name: detail.name,
    sku: detail.sku,
    category: detail.commercialCategory,
    productType: detail.productType,
    status: detail.status,
    stock: detail.stockPosition.onHand,
    minStock: detail.stockPosition.reorderPoint,
    price: detail.sellPrice,
    cost: detail.costPrice,
    margin: `${detail.marginPercent}%`,
    suppliersCount: detail.supplierCount,
    catalogHealth: detail.readiness.catalogHealth,
    assetReadiness: detail.readiness.assetReadiness,
    threedReadiness: detail.readiness.threedReadiness,
    marketingReadiness: detail.readiness.marketingReadiness,
    publishReadiness: detail.readiness.publishReadiness,
    blockers: detail.readiness.blockers,
    img: detail.primaryImageUrl,
    media: detail.media.map((media) => ({
      id: media.id,
      role: mapMediaRole(media.usage),
      url: media.img,
      status: mapMediaStatus(media.status),
      type: mapMediaType(media.type),
    })),
    specs: detail.specifications,
    history: detail.history.map((item) => ({
      date: item.date,
      action: item.action,
      user: item.user,
    })),
  };
}

function mapAssetUsage(usage: string) {
  const normalized = usage.trim().toLowerCase();

  if (normalized.includes('hero')) return 'Hero' as const;
  if (normalized.includes('gallery')) return 'Gallery' as const;
  if (normalized.includes('installation')) return 'Installation' as const;
  if (normalized.includes('campaign')) return 'Campaign' as const;
  if (normalized.includes('publishable')) return 'Publishable Variant' as const;
  if (normalized.includes('3d')) return '3D Ready' as const;
  if (normalized.includes('model')) return 'Model' as const;
  if (normalized.includes('render')) return 'Render' as const;
  return 'Detail' as const;
}

function mapAsset(detail: InventoryProductDetail, asset: InventoryProductDetail['media'][number]): InventoryUiAsset {
  const workflowNode = asset.workflowNode === 'asset.uploaded' || asset.workflowNode === 'variant.generated' || asset.workflowNode === 'creative.approved'
    ? asset.workflowNode
    : undefined;

  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    protectionLevel: asset.protectionLevel,
    size: asset.size,
    status: asset.status,
    usage: asset.usage.map((usage) => mapAssetUsage(usage)),
    img: asset.img,
    parentId: asset.parentId,
    productId: detail.id,
    productName: detail.name,
    linkedProductIds: asset.linkedProductIds,
    linkedCampaignIds: asset.linkedCampaignIds,
    completeness: asset.completeness,
    is3DReady: asset.is3DReady,
    campaignId: asset.campaignId,
    campaignName: asset.campaignName,
    tags: asset.tags,
    workflowNode,
    pipeline: asset.pipeline,
    watermarkProfile: asset.watermarkProfile,
    backgroundTransparent: asset.backgroundTransparent,
  };
}

export function useInventoryPortalData() {
  const [dashboard, setDashboard] = useState<InventoryDashboardSnapshot | null>(null);
  const [products, setProducts] = useState<InventoryUiProduct[]>([]);
  const [rawProducts, setRawProducts] = useState<InventoryProductDetail[]>([]);
  const [productSummaries, setProductSummaries] = useState<InventoryProductSummary[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [dashboardResult, summaryResult, detailResult, supplierResult] = await Promise.all([
        fetchInventoryDashboard(),
        fetchInventoryProducts(),
        fetchInventoryProductDetails(),
        fetchInventorySuppliers(),
      ]);

      setDashboard(dashboardResult);
      setProductSummaries(summaryResult);
      setRawProducts(detailResult);
      setProducts(detailResult.map((detail) => mapProduct(detail)));
      setSuppliers(supplierResult);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to load inventory data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createProduct = useCallback(
    async (input: CreateInventoryProductInput) => {
      setIsSaving(true);
      setError(null);

      try {
        await createInventoryProductRequest(input);
        await refresh();
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : 'Failed to create product.');
        throw createError;
      } finally {
        setIsSaving(false);
      }
    },
    [refresh],
  );

  const importPriceList = useCallback(
    async (input: CreatePriceListImportInput): Promise<PriceListImportResult> => {
      setIsSaving(true);
      setError(null);

      try {
        const staged = await createPriceListImport(input);
        const applied = await applyPriceListImport(staged.batchId);
        await refresh();
        return applied;
      } catch (importError) {
        setError(importError instanceof Error ? importError.message : 'Failed to import price list.');
        throw importError;
      } finally {
        setIsSaving(false);
      }
    },
    [refresh],
  );

  const productsById = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products],
  );

  const assetsByProductId = useMemo(
    () =>
      Object.fromEntries(
        rawProducts.map((detail) => [
          detail.id,
          detail.media.map((asset) => mapAsset(detail, asset)),
        ]),
      ) as Record<string, InventoryUiAsset[]>,
    [rawProducts],
  );

  return {
    dashboard,
    products,
    rawProducts,
    productSummaries,
    productsById,
    assetsByProductId,
    suppliers,
    isLoading,
    isSaving,
    error,
    refresh,
    createProduct,
    importPriceList,
  };
}
