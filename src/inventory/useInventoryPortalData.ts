import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { invalidateStorefrontCatalogData } from '../catalog/storefrontData';
import {
  applyPriceListImport,
  createInventorySupplier as createInventorySupplierRequest,
  createInventorySupplierContact as createInventorySupplierContactRequest,
  createInventorySupplierDocument as createInventorySupplierDocumentRequest,
  createInventoryProduct as createInventoryProductRequest,
  createPriceListImport,
  deleteInventorySupplier as deleteInventorySupplierRequest,
  fetchInventorySupplier,
  fetchInventoryDashboard,
  fetchInventoryProductDetails,
  fetchInventoryProducts,
  fetchInventorySuppliers,
  linkInventorySupplierProducts as linkInventorySupplierProductsRequest,
  publishInventoryProduct as publishInventoryProductRequest,
  updateInventorySupplier as updateInventorySupplierRequest,
  updateInventoryProduct as updateInventoryProductRequest,
} from './api';
import type {
  CreateSupplierContactInput,
  CreateSupplierDocumentInput,
  CreateInventoryProductInput,
  CreatePriceListImportInput,
  CreateSupplierInput,
  InventoryAssetRole,
  InventoryDashboardSnapshot,
  InventoryProductDetail,
  InventoryProductSummary,
  LinkSupplierProductsInput,
  PriceListImportResult,
  SupplierSummary,
  UpdateSupplierInput,
  UpdateInventoryProductInput,
} from './contracts';

export interface InventoryUiProduct {
  id: string;
  recordId: string;
  name: string;
  sku: string;
  category: string;
  productType: string;
  finish?: string | null;
  collection?: string | null;
  status: 'Active' | 'Draft' | 'Archived' | 'Out of Stock';
  publishStatus: 'Not Ready' | 'Ready' | 'Published';
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
  supplierName?: string;
  availabilityStatus: 'Ready to Procure' | 'Supplier Delayed' | 'Supplier Onboarding' | 'Missing Supplier';
  leadTimeLabel: string;
  procurementMode: 'Dropship';
  procurementTrigger: 'Quote Paid';
  description: string;
  dimensions: {
    lengthMm: number;
    widthMm: number;
    heightMm: number;
    weightKg: number;
    coverageOrientation: string;
    faceAreaM2: number;
    unitsPerM2: number;
  };
  media: {
    id: string;
    role: InventoryAssetRole;
    url: string;
    status: 'Ready' | 'Pending' | 'Missing';
    type: 'Image' | 'Video' | '2.5D Asset' | '3D Asset';
    source: string;
  }[];
  specs: Record<string, string>;
  history: { date: string; action: string; user: string; details?: string }[];
}

export interface InventoryUiAsset {
  id: string;
  name: string;
  type: 'Image' | 'Video' | '2.5D Asset' | '3D Asset' | '3D Render' | 'Model';
  protectionLevel: 'Protected Original' | 'Managed Variant' | 'Publishable Variant';
  size: string;
  status: 'Draft' | 'Review' | 'Approved' | 'Archived' | 'Restricted';
  role:
    | 'primary_image'
    | 'gallery_image'
    | 'face_image'
    | 'hero_image'
    | 'asset_2_5d'
    | 'asset_3d'
    | 'project_image'
    | 'generated_image'
    | 'gallery_extra'
    | 'installation'
    | 'detail'
    | 'campaign';
  source: string;
  usage: string[];
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
  workflowNode?: string;
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

function mapMediaStatus(status: string): InventoryUiProduct['media'][number]['status'] {
  if (status === 'Approved') return 'Ready';
  if (status === 'Restricted') return 'Missing';
  return 'Pending';
}

function mapMediaType(type: string): InventoryUiProduct['media'][number]['type'] {
  if (type === 'Video') return 'Video';
  if (type === '2.5D Asset') return '2.5D Asset';
  if (type === '3D Asset' || type === '3D Render' || type === 'Model') return '3D Asset';
  return 'Image';
}

function mapProduct(detail: InventoryProductDetail): InventoryUiProduct {
  return {
    id: detail.id,
    recordId: detail.recordId,
    name: detail.name,
    sku: detail.publicSku,
    category: detail.category,
    productType: detail.productType,
    finish: detail.finish,
    collection: detail.collection,
    status: detail.status,
    publishStatus: detail.publishStatus,
    stock: detail.stockPosition.onHand,
    minStock: detail.stockPosition.reorderPoint,
    price: detail.sellPriceZar,
    cost: detail.costPriceZar,
    margin: `${detail.marginPercent}%`,
    suppliersCount: detail.supplierCount,
    catalogHealth: detail.readiness.catalogHealth,
    assetReadiness: detail.readiness.assetReadiness,
    threedReadiness: detail.readiness.threedReadiness,
    marketingReadiness: detail.readiness.marketingReadiness,
    publishReadiness: detail.readiness.publishReadiness,
    blockers: detail.readiness.blockers,
    img: detail.primaryImageUrl,
    supplierName: detail.stockPosition.linkedSupplierName,
    availabilityStatus: detail.stockPosition.availabilityStatus,
    leadTimeLabel: detail.stockPosition.leadTimeLabel ?? 'TBD',
    procurementMode: detail.stockPosition.mode,
    procurementTrigger: detail.stockPosition.procurementTrigger,
    description: detail.description,
    dimensions: {
      lengthMm: detail.dimensions.lengthMm,
      widthMm: detail.dimensions.widthMm,
      heightMm: detail.dimensions.heightMm,
      weightKg: detail.dimensions.weightKg,
      coverageOrientation: detail.dimensions.coverageOrientation,
      faceAreaM2: detail.dimensions.faceAreaM2,
      unitsPerM2: detail.dimensions.unitsPerM2,
    },
    media: detail.media.map((media) => ({
      id: media.id,
      role: media.role,
      url: media.img,
      status: mapMediaStatus(media.status),
      type: mapMediaType(media.type),
      source: media.source,
    })),
    specs: detail.specifications,
    history: detail.history.map((item) => ({
      date: item.date,
      action: item.action,
      user: item.user,
      details: item.details,
    })),
  };
}

function mapAsset(detail: InventoryProductDetail, asset: InventoryProductDetail['media'][number]): InventoryUiAsset {
  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    protectionLevel: asset.protectionLevel,
    size: asset.size,
    status: asset.status,
    role: asset.role,
    source: asset.source,
    usage: asset.usage,
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
    workflowNode: asset.workflowNode,
    pipeline: asset.pipeline,
    watermarkProfile: asset.watermarkProfile,
    backgroundTransparent: asset.backgroundTransparent,
  };
}

function sortSuppliersByName(items: SupplierSummary[]) {
  return [...items].sort((left, right) => left.name.localeCompare(right.name, 'en-ZA'));
}

function upsertSupplier(items: SupplierSummary[], supplier: SupplierSummary) {
  const next = items.filter((item) => item.id !== supplier.id);
  next.push(supplier);
  return sortSuppliersByName(next);
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
  const refreshTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

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
      setSuppliers(sortSuppliersByName(supplierResult));
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to load inventory data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return undefined;
    }

    const scheduleRefresh = () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        void refresh();
      }, 180);
    };

    let eventSource: EventSource | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) {
        return;
      }

      eventSource = new EventSource('/api/inventory/events');
      eventSource.onmessage = () => {
        scheduleRefresh();
      };
      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;

        if (cancelled) {
          return;
        }

        if (reconnectTimerRef.current !== null) {
          window.clearTimeout(reconnectTimerRef.current);
        }

        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null;
          void refresh();
          connect();
        }, 1200);
      };
    };

    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleRefresh();
      }
    };

    window.addEventListener('focus', scheduleRefresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      eventSource?.close();
      window.removeEventListener('focus', scheduleRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh]);

  const createProduct = useCallback(
    async (input: CreateInventoryProductInput) => {
      setIsSaving(true);
      setError(null);

      try {
        await createInventoryProductRequest(input);
        await refresh();
        invalidateStorefrontCatalogData();
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
        invalidateStorefrontCatalogData();
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

  const createSupplier = useCallback(
    async (input: CreateSupplierInput) => {
      setIsSaving(true);
      setError(null);

      try {
        const supplier = await createInventorySupplierRequest(input);
        setSuppliers((current) => upsertSupplier(current, supplier));
        await refresh();
        return supplier;
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to create supplier.');
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
    [refresh],
  );

  const updateSupplier = useCallback(
    async (id: string, input: UpdateSupplierInput) => {
      setIsSaving(true);
      setError(null);

      try {
        const supplier = await updateInventorySupplierRequest(id, input);
        setSuppliers((current) => upsertSupplier(current, supplier));
        await refresh();
        return supplier;
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to update supplier.');
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
    [refresh],
  );

  const deleteSupplier = useCallback(
    async (id: string) => {
      setIsSaving(true);
      setError(null);

      try {
        const result = await deleteInventorySupplierRequest(id);
        setSuppliers((current) => {
          if (result.disposition === 'archived' && result.supplier) {
            return upsertSupplier(current, result.supplier);
          }

          return current.filter((supplier) => supplier.id !== id);
        });
        await refresh();
        return result;
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to delete supplier.');
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
    [refresh],
  );

  const addSupplierContact = useCallback(
    async (id: string, input: CreateSupplierContactInput) => {
      setIsSaving(true);
      setError(null);

      try {
        const supplier = await createInventorySupplierContactRequest(id, input);
        setSuppliers((current) => upsertSupplier(current, supplier));
        await refresh();
        return supplier;
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to add supplier contact.');
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
    [refresh],
  );

  const addSupplierDocument = useCallback(
    async (id: string, input: CreateSupplierDocumentInput) => {
      setIsSaving(true);
      setError(null);

      try {
        const supplier = await createInventorySupplierDocumentRequest(id, input);
        setSuppliers((current) => upsertSupplier(current, supplier));
        await refresh();
        return supplier;
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to add supplier document.');
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
    [refresh],
  );

  const linkSupplierProducts = useCallback(
    async (id: string, input: LinkSupplierProductsInput) => {
      setIsSaving(true);
      setError(null);

      try {
        const supplier = await linkInventorySupplierProductsRequest(id, input);
        setSuppliers((current) => upsertSupplier(current, supplier));
        await refresh();
        return supplier;
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to link supplier products.');
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
    [refresh],
  );

  const fetchSupplier = useCallback((id: string) => fetchInventorySupplier(id), []);

  const productsById = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products],
  );

  const rawProductsById = useMemo(
    () => Object.fromEntries(rawProducts.map((product) => [product.id, product])),
    [rawProducts],
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

  const updateProduct = useCallback(
    async (id: string, input: UpdateInventoryProductInput) => {
      setIsSaving(true);
      setError(null);

      try {
        await updateInventoryProductRequest(id, input);
        await refresh();
        invalidateStorefrontCatalogData();
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : 'Failed to update product.');
        throw updateError;
      } finally {
        setIsSaving(false);
      }
    },
    [refresh],
  );

  const publishProduct = useCallback(
    async (id: string) => {
      setIsSaving(true);
      setError(null);

      try {
        await publishInventoryProductRequest(id);
        await refresh();
        invalidateStorefrontCatalogData();
      } catch (publishError) {
        setError(publishError instanceof Error ? publishError.message : 'Failed to publish product.');
        throw publishError;
      } finally {
        setIsSaving(false);
      }
    },
    [refresh],
  );

  return {
    dashboard,
    products,
    rawProducts,
    rawProductsById,
    productSummaries,
    productsById,
    assetsByProductId,
    suppliers,
    isLoading,
    isSaving,
    error,
    refresh,
    createProduct,
    updateProduct,
    publishProduct,
    importPriceList,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    addSupplierContact,
    addSupplierDocument,
    linkSupplierProducts,
    fetchSupplier,
  };
}
