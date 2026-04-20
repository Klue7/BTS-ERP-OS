import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Box,
  BookOpen,
  Calendar,
  Database,
  DollarSign,
  FileText,
  Image,
  LayoutDashboard,
  ListOrdered,
  Lock,
  LogOut,
  Megaphone,
  MessageSquare,
  Share2,
  Sparkles,
  Truck,
  Users,
  Wand2,
} from 'lucide-react';
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from 'react-router-dom';
import { toast } from 'sonner';
import { useVisualLab } from './VisualLabContext';
import { CreativeGeneratorWorkspace } from './CreativeGeneratorWorkspace';
import { useInventoryPortalData, type InventoryUiProduct } from '../inventory/useInventoryPortalData';
import { useMarketingStudioData } from '../marketing/useMarketingStudioData';
import { createMarketingAssetFromUpload } from '../marketing/assetUpload';
import type {
  CreateMarketingCampaignInput,
  CreateMarketingCreativeOutputInput,
  MarketingAssetSummary,
  MarketingCampaignSummary,
  MarketingTemplateSummary,
} from '../marketing/contracts';
import {
  buildStudioCreativePath,
  studioRouteModeToWorkspaceMode,
  type StudioCreativeRouteMode,
  workspaceModeToStudioRouteMode,
} from '../creative/routes';

type StudioCreativeShellContext = {
  templates: MarketingTemplateSummary[];
  assets: MarketingAssetSummary[];
  products: InventoryUiProduct[];
  campaigns: MarketingCampaignSummary[];
  selectedTemplate: MarketingTemplateSummary | null;
  selectedProduct: InventoryUiProduct | null;
  selectedCampaignId: string | null;
  documentId: string | null;
  legacyDesignId: string | null;
  seedAsset: MarketingAssetSummary | null;
  onTemplateChange: (template: MarketingTemplateSummary) => void;
  onProductChange: (product: InventoryUiProduct) => void;
  onUploadSourceAsset: (input: { file: File; productId?: string; productRecordId?: string }) => Promise<MarketingAssetSummary>;
  onCreateCreativeOutput: (input: CreateMarketingCreativeOutputInput) => Promise<MarketingAssetSummary>;
  onCreateCampaign: (input: CreateMarketingCampaignInput) => Promise<MarketingCampaignSummary>;
  onSeedConsumed: () => void;
};

const PORTAL_MODULES = [
  { id: 'Map', icon: Share2, label: 'OS Map' },
  { id: 'Customers', icon: Users, label: 'CRM' },
  { id: 'Comms', icon: MessageSquare, label: 'Comms' },
  { id: 'Finance', icon: DollarSign, label: 'Finance' },
  { id: 'Suppliers', icon: Truck, label: 'Vendors' },
  { id: 'Inventory', icon: Box, label: 'Stock' },
  { id: 'Marketing', icon: Megaphone, label: 'Social' },
] as const;

const MARKETING_SUBMODULES = [
  { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'AssetLab', label: 'Asset Lab', icon: Image },
  { id: 'Templates', label: 'Templates', icon: FileText },
  { id: 'CreativeGenerator', label: 'Creative Studio', icon: Wand2 },
  { id: 'Campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'Calendar', label: 'Calendar', icon: Calendar },
  { id: 'Publishing', label: 'Publishing', icon: ListOrdered },
  { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'CommunityFeed', label: 'Community Feed', icon: Users },
  { id: 'ContentStudio', label: 'Content Desk', icon: BookOpen },
] as const;

function buildPortalModulePath(moduleId: (typeof PORTAL_MODULES)[number]['id']) {
  return `/portal?module=${moduleId}`;
}

function buildPortalMarketingPath(submoduleId: (typeof MARKETING_SUBMODULES)[number]['id']) {
  return `/portal?module=Marketing&submodule=${submoduleId}`;
}

function StudioCreativeAccessGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isLoggedIn,
    userRole,
    setIsLoggedIn,
    setUserRole,
    setIsViewingPortal,
    setIsLoginPageOpen,
    setPostLoginRedirect,
  } = useVisualLab();

  const handleOpenLogin = useCallback(() => {
    setPostLoginRedirect(`${location.pathname}${location.search}`);
    if (isLoggedIn && userRole !== 'employee') {
      setIsLoggedIn(false);
      setUserRole(null);
      setIsViewingPortal(false);
    }
    setIsLoginPageOpen(true);
    toast('Employee access required', {
      description: 'Sign in as owner or employee to open BTS Creative Studio.',
    });
  }, [
    isLoggedIn,
    location.pathname,
    location.search,
    setIsLoggedIn,
    setIsLoginPageOpen,
    setIsViewingPortal,
    setPostLoginRedirect,
    setUserRole,
    userRole,
  ]);

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-10 text-white md:px-10">
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-6xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative w-full overflow-hidden rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,136,0.14),transparent_34%),linear-gradient(135deg,#0d0d0d_0%,#050505_55%,#0b0b0b_100%)] p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.85)] md:p-12"
        >
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.18) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />

          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.34em] text-[#00ff88]">
                <Sparkles size={14} />
                BTS Creative Studio
              </div>

              <h1 className="mt-8 text-5xl font-serif font-bold uppercase tracking-tight text-white md:text-6xl">
                Dedicated Studio
                <span className="block text-white/35">Employee Access Required</span>
              </h1>

              <p className="mt-6 max-w-2xl text-sm leading-8 text-white/56 md:text-base">
                Creative Studio now runs as a dedicated authenticated workspace, not as an embedded portal panel.
                Sign in as owner or employee to access the canvas, cutout tools, and room visualizer without losing the BTS shell quality.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={handleOpenLogin}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#00ff88] px-8 py-4 text-[10px] font-bold uppercase tracking-[0.35em] text-black transition-all hover:bg-[#00d876]"
                >
                  <Lock size={16} />
                  Employee Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/portal', { replace: true })}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-[10px] font-bold uppercase tracking-[0.35em] text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft size={16} />
                  Return To Portal
                </button>
              </div>
            </div>

            <div className="grid gap-4 self-start">
              {[
                {
                  icon: Wand2,
                  title: 'Canvas-First Workflow',
                  body: 'One dedicated studio route for ad building, cutouts, and room visualization with no competing portal copy.',
                },
                {
                  icon: Sparkles,
                  title: 'Protected Asset Flow',
                  body: 'Uploads become protected originals, cutouts become managed variants, and lineage stays attached to products and source media.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-black/35 p-5 backdrop-blur-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">{item.title}</p>
                      <p className="mt-3 text-sm leading-7 text-white/50">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function StudioCreativeShell() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    isLoggedIn,
    userRole,
    setIsLoggedIn,
    setUserRole,
    setIsViewingPortal,
  } = useVisualLab();
  const inventoryPortal = useInventoryPortalData();
  const marketingStudio = useMarketingStudioData();
  const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplateSummary | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<InventoryUiProduct | null>(null);

  const documentId = searchParams.get('document');
  const assetId = searchParams.get('asset');
  const productId = searchParams.get('product');
  const templateId = searchParams.get('template');
  const campaignId = searchParams.get('campaign');
  const legacyDesignId = searchParams.get('legacyDesignId');

  const seedAsset = assetId ? marketingStudio.assetsById[assetId] ?? null : null;

  const updateSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => void, options?: { replace?: boolean }) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      setSearchParams(next, { replace: options?.replace ?? true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (templateId) {
      const nextTemplate = marketingStudio.templates.find((template) => template.id === templateId) ?? null;
      if (nextTemplate && nextTemplate.id !== selectedTemplate?.id) {
        setSelectedTemplate(nextTemplate);
        return;
      }
    }

    if (!selectedTemplate && marketingStudio.templates.length > 0) {
      setSelectedTemplate(marketingStudio.templates[0]);
    }
  }, [marketingStudio.templates, selectedTemplate, templateId]);

  useEffect(() => {
    const directProduct = productId ? inventoryPortal.productsById[productId] ?? null : null;
    const assetLinkedProduct =
      !directProduct && seedAsset?.productId ? inventoryPortal.productsById[seedAsset.productId] ?? null : null;
    const nextProduct = directProduct ?? assetLinkedProduct;

    if (nextProduct && nextProduct.id !== selectedProduct?.id) {
      setSelectedProduct(nextProduct);
      return;
    }

    if (!selectedProduct && inventoryPortal.products.length > 0) {
      setSelectedProduct(inventoryPortal.products[0]);
    }
  }, [inventoryPortal.products, inventoryPortal.productsById, productId, seedAsset?.productId, selectedProduct]);

  const handleTemplateChange = useCallback(
    (template: MarketingTemplateSummary) => {
      setSelectedTemplate(template);
      updateSearchParams((params) => {
        params.set('template', template.id);
      });
    },
    [updateSearchParams],
  );

  const handleProductChange = useCallback(
    (product: InventoryUiProduct) => {
      setSelectedProduct(product);
      updateSearchParams((params) => {
        params.set('product', product.id);
      });
    },
    [updateSearchParams],
  );

  const handleUploadSourceAsset = useCallback(
    async ({ file, productId: nextProductId, productRecordId }: { file: File; productId?: string; productRecordId?: string }) => {
      return createMarketingAssetFromUpload({
        file,
        linkedProductId: nextProductId ?? productRecordId ?? selectedProduct?.id,
        createAsset: marketingStudio.createAsset,
      });
    },
    [marketingStudio, selectedProduct?.id],
  );

  const handleSeedConsumed = useCallback(() => {
    updateSearchParams((params) => {
      params.delete('asset');
    });
  }, [updateSearchParams]);

  const contextValue = useMemo<StudioCreativeShellContext>(
    () => ({
      templates: marketingStudio.templates,
      assets: marketingStudio.assets,
      products: inventoryPortal.products,
      campaigns: marketingStudio.campaigns,
      selectedTemplate,
      selectedProduct,
      selectedCampaignId: campaignId,
      documentId,
      legacyDesignId,
      seedAsset,
      onTemplateChange: handleTemplateChange,
      onProductChange: handleProductChange,
      onUploadSourceAsset: handleUploadSourceAsset,
      onCreateCreativeOutput: marketingStudio.createCreativeOutput,
      onCreateCampaign: marketingStudio.createCampaign,
      onSeedConsumed: handleSeedConsumed,
    }),
    [
      campaignId,
      documentId,
      handleProductChange,
      handleSeedConsumed,
      handleTemplateChange,
      handleUploadSourceAsset,
      inventoryPortal.products,
      legacyDesignId,
      marketingStudio.assets,
      marketingStudio.campaigns,
      marketingStudio.createCampaign,
      marketingStudio.createCreativeOutput,
      marketingStudio.templates,
      seedAsset,
      selectedProduct,
      selectedTemplate,
    ],
  );

  if (!isLoggedIn || userRole !== 'employee') {
    return <StudioCreativeAccessGate />;
  }

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setIsViewingPortal(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '100px 100px' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-0" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <aside className="hidden md:flex w-20 flex-col items-center py-8 border-r border-white/5 bg-[#0a0a0a] z-40">
        <div className="mb-12">
          <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center text-[#00ff88]">
            <Database size={20} />
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-8">
          {PORTAL_MODULES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(buildPortalModulePath(item.id))}
              className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                item.id === 'Marketing'
                  ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20'
                  : 'text-white/30 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              <span className="absolute left-16 px-2 py-1 bg-[#1a1a1a] border border-white/10 rounded text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-6">
          <button type="button" onClick={() => navigate('/portal?module=Marketing&submodule=Dashboard')} className="text-white/30 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <button type="button" onClick={handleLogout} className="text-white/30 hover:text-red-400 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a] border-t border-white/5 z-50 flex items-center justify-around px-2 pb-safe">
        {PORTAL_MODULES.filter((item) => ['Map', 'Customers', 'Inventory', 'Marketing'].includes(item.id)).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(buildPortalModulePath(item.id))}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${item.id === 'Marketing' ? 'text-[#00ff88]' : 'text-white/40'}`}
          >
            <item.icon size={20} strokeWidth={item.id === 'Marketing' ? 2.5 : 2} />
            <span className="text-[9px] uppercase tracking-widest font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="hidden md:flex w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex-col z-30">
        <div className="p-8 border-bottom border-white/5">
          <h2 className="text-xl font-serif font-bold tracking-tighter text-white uppercase">Marketing Studio</h2>
          <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest mt-1">Subsystem v2.5</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {MARKETING_SUBMODULES.map((sub) => {
            const Icon = sub.icon;
            const isActive = sub.id === 'CreativeGenerator';
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  if (sub.id === 'CreativeGenerator') {
                    return;
                  }
                  navigate(buildPortalMarketingPath(sub.id));
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 shadow-[0_0_20px_rgba(0,255,136,0.1)]'
                    : 'text-white/40 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                <span className="text-xs font-bold uppercase tracking-widest">{sub.label}</span>
                {isActive ? <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00ff88]" /> : null}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="bg-[#00ff88]/5 border border-[#00ff88]/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={12} className="text-[#00ff88]" />
              <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">Studio Runtime</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-[#00ff88]" />
            </div>
            <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mt-2">Marketing Context Attached</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col h-[calc(100vh-4rem)] md:h-screen">
        <div className="md:hidden flex overflow-x-auto py-4 px-6 gap-4 border-b border-white/5 no-scrollbar bg-black/40 backdrop-blur-xl">
          {MARKETING_SUBMODULES.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => {
                if (sub.id === 'CreativeGenerator') {
                  return;
                }
                navigate(buildPortalMarketingPath(sub.id));
              }}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                sub.id === 'CreativeGenerator'
                  ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20'
                  : 'text-white/40 border border-transparent'
              }`}
            >
              <sub.icon size={14} />
              {sub.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,136,0.03),transparent)]">
          <Outlet context={contextValue} />
        </div>
      </div>
    </div>
  );
}

function useStudioCreativeShellContext() {
  return useOutletContext<StudioCreativeShellContext>();
}

export function StudioCreativeModeRoute({ routeMode }: { routeMode: StudioCreativeRouteMode }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const context = useStudioCreativeShellContext();

  const navigateToMode = useCallback(
    (nextMode: StudioCreativeRouteMode) => {
      navigate(
        buildStudioCreativePath({
          mode: nextMode,
          documentId: context.documentId,
          productId: context.selectedProduct?.id ?? searchParams.get('product'),
          templateId: context.selectedTemplate?.id ?? searchParams.get('template'),
          campaignId: context.selectedCampaignId ?? searchParams.get('campaign'),
          legacyDesignId: context.legacyDesignId,
        }),
      );
    },
    [
      context.documentId,
      context.legacyDesignId,
      context.selectedCampaignId,
      context.selectedProduct?.id,
      context.selectedTemplate?.id,
      navigate,
      searchParams,
    ],
  );

  return (
    <CreativeGeneratorWorkspace
      templates={context.templates}
      assets={context.assets}
      products={context.products}
      campaigns={context.campaigns}
      selectedTemplate={context.selectedTemplate as never}
      onTemplateChange={context.onTemplateChange as never}
      selectedProduct={context.selectedProduct as never}
      onProductChange={context.onProductChange as never}
      onUploadSourceAsset={context.onUploadSourceAsset}
      onCreateCreativeOutput={context.onCreateCreativeOutput}
      onCreateCampaign={context.onCreateCampaign}
      onOpenAsset={() => {}}
      seedAsset={context.seedAsset as never}
      seedMode={
        context.seedAsset
          ? routeMode === 'visualizer'
            ? 'scene'
            : routeMode === 'cutout'
              ? 'cutout'
              : 'blueprint'
          : null
      }
      onSeedConsumed={context.onSeedConsumed}
      forcedMode={studioRouteModeToWorkspaceMode(routeMode)}
      onModeChange={(mode) => navigateToMode(workspaceModeToStudioRouteMode(mode))}
      documentId={context.documentId}
      selectedCampaignId={context.selectedCampaignId}
    />
  );
}

export function StudioCreativeIndexRedirect() {
  return <Navigate to="ad-builder" replace />;
}
