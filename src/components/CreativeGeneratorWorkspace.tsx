import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { AnimatePresence, motion } from 'motion/react';
import { Rnd } from 'react-rnd';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  Brush,
  CheckCircle2,
  Copy,
  Crop,
  Download,
  Eraser,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Lock,
  LockOpen,
  Minus,
  Maximize2,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  SquareDashedMousePointer,
  Type,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import { uploadInventoryFile } from '../inventory/api';
import type {
  CreateMarketingCreativeOutputInput,
  CreateMarketingCampaignInput,
  MarketingBlueprintConfig,
  MarketingTemplateSummary,
} from '../marketing/contracts';
import {
  dataUrlToFile,
  previewBackgroundRemoval,
  previewSceneMockup,
  type BackgroundRemovalRequest,
  type CreativeApplicationMode,
  type CreativeMode,
  type CreativePreviewAsset,
  type CreativePreviewProduct,
  type CreativePreviewTemplate,
  type CreativeProcessingMode,
  type SceneMockupRequest,
} from '../creative/engine';
import { sanitizeMarketingAssetName } from '../marketing/assetUpload';
import {
  createSuggestedMaskVector,
  createMaskDataUrl,
} from '../creative/masks';
import {
  renderCreativeDocumentToDataUrl,
} from '../creative/editor-render';
import {
  type CreativeCanvasPreset,
  type CreativeDocumentDetail,
  type CreativeDocumentMetadata,
  type CreativeExportJob,
  type CreativeExportPreset,
  type CreativeLayer,
  type CreativeLayerTransform,
  type CreativeMask,
  type CreativeWorkspaceMode,
} from '../creative/contracts';
import { useCreativeStudioData } from '../creative/useCreativeStudioData';

interface WorkspaceAsset extends CreativePreviewAsset {
  protectionLevel: 'Protected Original' | 'Managed Variant' | 'Publishable Variant';
  status: 'Draft' | 'Review' | 'Approved' | 'Archived' | 'Restricted';
  usage: string[];
  size: string;
  tags: string[];
  linkedCampaignIds?: string[];
}

interface WorkspaceProduct extends CreativePreviewProduct {
  recordId?: string;
}

interface WorkspaceTemplate extends CreativePreviewTemplate {
  status: 'Draft' | 'Active' | 'Archived';
  destination: string;
  blueprint: string;
  blueprintConfig: MarketingBlueprintConfig;
}

interface WorkspaceCampaign {
  id: string;
  name: string;
}

interface CreativeGeneratorWorkspaceProps {
  templates: WorkspaceTemplate[];
  assets: WorkspaceAsset[];
  products: WorkspaceProduct[];
  campaigns: WorkspaceCampaign[];
  selectedTemplate: WorkspaceTemplate | null;
  onTemplateChange: (template: WorkspaceTemplate) => void;
  selectedProduct: WorkspaceProduct | null;
  onProductChange: (product: WorkspaceProduct) => void;
  onUploadSourceAsset: (input: { file: File; productId?: string; productRecordId?: string }) => Promise<WorkspaceAsset>;
  onCreateCreativeOutput: (input: CreateMarketingCreativeOutputInput) => Promise<WorkspaceAsset>;
  onCreateCampaign: (input: CreateMarketingCampaignInput) => Promise<WorkspaceCampaign>;
  onOpenAsset: (asset: WorkspaceAsset) => void;
  seedAsset?: WorkspaceAsset | null;
  seedMode?: CreativeMode | null;
  onSeedConsumed?: () => void;
  forcedMode?: CreativeWorkspaceMode | null;
  onModeChange?: (mode: CreativeWorkspaceMode) => void;
  documentId?: string | null;
  selectedCampaignId?: string | null;
}

type LeftRailTab = 'Assets' | 'Products' | 'Text' | 'Layouts' | 'Brand' | 'AI Tools' | 'Layers';
type BrushMode = 'paint' | 'erase';
type CreativeGoalId =
  | 'special-ad'
  | 'website-hero'
  | 'story-reel'
  | 'whatsapp-share'
  | 'email-banner'
  | 'cutout-asset'
  | 'room-visual';

interface BrushStroke {
  mode: BrushMode;
  size: number;
  points: Array<{ x: number; y: number }>;
}

interface QuickGoalOption {
  id: CreativeGoalId;
  label: string;
  hint: string;
  preset: CreativeExportPreset;
  usagePurpose: 'Publishable Variant' | 'Campaign' | 'Gallery' | 'Social';
  channelSize: 'Original' | '1080x1080' | '1080x1920' | '1200x630';
  mode: CreativeWorkspaceMode;
}

const RAIL_TABS: LeftRailTab[] = ['Assets', 'Products', 'Text', 'Layouts', 'Brand', 'AI Tools', 'Layers'];
const STUDIO_ASSET_DRAG_TYPE = 'application/x-bts-studio-asset';

const CANVAS_PRESETS: CreativeCanvasPreset[] = [
  { label: 'Home Hero', width: 1600, height: 900, safeZone: { topPct: 8, rightPct: 8, bottomPct: 10, leftPct: 8 } },
  { label: 'Square Post', width: 1080, height: 1080, safeZone: { topPct: 8, rightPct: 8, bottomPct: 10, leftPct: 8 } },
  { label: 'Portrait Story', width: 1080, height: 1920, safeZone: { topPct: 10, rightPct: 8, bottomPct: 12, leftPct: 8 } },
  { label: 'WhatsApp Share', width: 1080, height: 1080, safeZone: { topPct: 8, rightPct: 8, bottomPct: 10, leftPct: 8 } },
  { label: 'Email Banner', width: 1200, height: 630, safeZone: { topPct: 8, rightPct: 8, bottomPct: 10, leftPct: 8 } },
];

const QUICK_GOALS: QuickGoalOption[] = [
  { id: 'special-ad', label: 'Special Ad', hint: 'Social promo or catalog push', preset: 'Square Post', usagePurpose: 'Social', channelSize: '1080x1080', mode: 'Product Design' },
  { id: 'website-hero', label: 'Website Hero', hint: 'Homepage or collection hero', preset: 'Home Hero', usagePurpose: 'Publishable Variant', channelSize: 'Original', mode: 'Product Design' },
  { id: 'story-reel', label: 'Story / Reel', hint: 'Portrait social format', preset: 'Portrait Story', usagePurpose: 'Social', channelSize: '1080x1920', mode: 'Product Design' },
  { id: 'whatsapp-share', label: 'WhatsApp Share', hint: 'Direct send or catalog share', preset: 'WhatsApp Share', usagePurpose: 'Campaign', channelSize: '1080x1080', mode: 'Product Design' },
  { id: 'email-banner', label: 'Email Banner', hint: 'Email header and newsletter', preset: 'Email Banner', usagePurpose: 'Campaign', channelSize: '1200x630', mode: 'Product Design' },
  { id: 'cutout-asset', label: 'Cutout Asset', hint: 'Remove background for reuse', preset: 'Square Post', usagePurpose: 'Gallery', channelSize: 'Original', mode: 'Cutout' },
  { id: 'room-visual', label: 'Room Visual', hint: 'Product-guided room mockup', preset: 'Home Hero', usagePurpose: 'Campaign', channelSize: 'Original', mode: 'Room Restyle' },
];

const PUBLISH_CHANNEL_OPTIONS = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Email', 'WhatsApp', 'Pinterest'] as const;

function safeLower(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim()) {
    return value.toLowerCase();
  }
  return fallback;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stageModeFromSeed(mode: CreativeMode | null | undefined): CreativeWorkspaceMode {
  if (mode === 'cutout') {
    return 'Cutout';
  }
  if (mode === 'scene') {
    return 'Room Restyle';
  }
  return 'Product Design';
}

function modeToSeed(mode: CreativeWorkspaceMode): CreativeMode {
  if (mode === 'Cutout') {
    return 'cutout';
  }
  if (mode === 'Room Restyle') {
    return 'scene';
  }
  return 'blueprint';
}

function createCanvasPreset(label: CreativeExportPreset): CreativeCanvasPreset {
  return clone(CANVAS_PRESETS.find((preset) => preset.label === label) ?? CANVAS_PRESETS[1]);
}

function isRenderableAsset(asset: WorkspaceAsset) {
  return asset.type === 'Image' || asset.type === '2.5D Asset' || asset.type === '3D Render';
}

function makeLayerId() {
  return `layer_${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_IMAGE_LAYER_WIDTH_PCT = 28;
const DEFAULT_IMAGE_LAYER_HEIGHT_PCT = 34;

function createImageLayerFromAsset(input: {
  asset: WorkspaceAsset;
  xPct: number;
  yPct: number;
  zIndex: number;
  preset?: CreativeCanvasPreset;
  widthPct?: number;
  heightPct?: number;
}): CreativeLayer {
  const widthPct = input.widthPct ?? DEFAULT_IMAGE_LAYER_WIDTH_PCT;
  const heightPct = input.heightPct ?? DEFAULT_IMAGE_LAYER_HEIGHT_PCT;
  const safe = input.preset ? getSafeZoneGuides(input.preset) : null;
  const minX = safe?.left ?? 0;
  const minY = safe?.top ?? 0;
  const maxX = safe ? Math.max(safe.right - widthPct, minX) : Math.max(100 - widthPct, 0);
  const maxY = safe ? Math.max(safe.bottom - heightPct, minY) : Math.max(100 - heightPct, 0);

  return {
    id: makeLayerId(),
    name: input.asset.name,
    type: 'image',
    sourceAssetId: input.asset.id,
    visible: true,
    locked: false,
    transform: {
      xPct: clamp(input.xPct, minX, maxX),
      yPct: clamp(input.yPct, minY, maxY),
      widthPct,
      heightPct,
      rotation: 0,
      zIndex: input.zIndex,
      opacity: 1,
    },
    crop: { xPct: 0, yPct: 0, scale: 1 },
    style: { borderRadius: 20 },
    content: { imageUrl: input.asset.img },
  };
}

function formatMoney(price: number | string | undefined) {
  if (price === undefined) {
    return '';
  }
  if (typeof price === 'number') {
    return `R ${price.toFixed(2)}`;
  }
  return String(price);
}

function buildDefaultLayers(input: {
  mode: CreativeWorkspaceMode;
  product: WorkspaceProduct | null;
  template: WorkspaceTemplate | null;
  sourceAsset: WorkspaceAsset | null;
}) {
  if (input.mode !== 'Product Design') {
    return [] as CreativeLayer[];
  }

  const sourceImageUrl = input.sourceAsset?.img ?? input.product?.img ?? null;
  const layers: CreativeLayer[] = [];

  if (sourceImageUrl) {
    layers.push({
      id: makeLayerId(),
      name: 'Hero Image',
      type: 'image',
      sourceAssetId: input.sourceAsset?.id ?? null,
      visible: true,
      locked: false,
      transform: { xPct: 8, yPct: 14, widthPct: 38, heightPct: 56, rotation: 0, zIndex: 0, opacity: 1 },
      crop: { xPct: 0, yPct: 0, scale: 1 },
      style: { borderRadius: 24 },
      content: { imageUrl: sourceImageUrl },
    });
  }

  layers.push({
    id: makeLayerId(),
    name: 'Brand Block',
    type: 'brand-block',
    visible: true,
    locked: false,
    transform: { xPct: 6, yPct: 6, widthPct: 88, heightPct: 11, rotation: 0, zIndex: 1, opacity: 1 },
    style: { fill: 'rgba(5,5,5,0.4)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22 },
    content: { eyebrow: 'Brick Tile Shop', templateName: input.template?.name ?? 'Creative Studio' },
  });

  layers.push({
    id: makeLayerId(),
    name: 'Headline',
    type: 'text',
    visible: true,
    locked: false,
    transform: { xPct: 52, yPct: 18, widthPct: 34, heightPct: 16, rotation: 0, zIndex: 2, opacity: 1 },
    style: { fontFamily: 'Playfair Display', fontSize: 54, color: '#ffffff', fontWeight: 700, align: 'left' },
    content: { text: input.product?.name ?? input.template?.name ?? 'BTS Creative Studio' },
  });

  layers.push({
    id: makeLayerId(),
    name: 'Body Copy',
    type: 'text',
    visible: true,
    locked: false,
    transform: { xPct: 52, yPct: 39, widthPct: 30, heightPct: 16, rotation: 0, zIndex: 3, opacity: 1 },
    style: { fontFamily: 'Inter', fontSize: 18, color: 'rgba(255,255,255,0.76)', fontWeight: 500, align: 'left' },
    content: { text: `Premium ${safeLower(input.product?.category, 'material')} shaped for campaign-safe visual reuse.` },
  });

  if (input.product?.price !== undefined) {
    layers.push({
      id: makeLayerId(),
      name: 'Price Pill',
      type: 'product-card',
      visible: true,
      locked: false,
      transform: { xPct: 52, yPct: 60, widthPct: 20, heightPct: 10, rotation: 0, zIndex: 4, opacity: 1 },
      style: { fill: '#22c55e', color: '#050505', borderRadius: 18 },
      content: { label: formatMoney(input.product.price) },
    });
  }

  return layers;
}

function createBlankDocumentState(input: {
  mode: CreativeWorkspaceMode;
  product: WorkspaceProduct | null;
  template: WorkspaceTemplate | null;
  sourceAsset: WorkspaceAsset | null;
}) {
  const preset =
    input.mode === 'Room Restyle'
      ? createCanvasPreset('Home Hero')
      : input.mode === 'Cutout'
        ? createCanvasPreset('Square Post')
        : createCanvasPreset(input.template?.destination === 'Public Site Hero' ? 'Home Hero' : 'Square Post');

  const metadata: CreativeDocumentMetadata = {
    generatorCopy: `Premium ${safeLower(input.product?.category, 'bts')} creative.`,
    aiDirection: '',
    selectedSourceAssetId: input.sourceAsset?.id ?? null,
    selectedSceneAssetId: input.sourceAsset?.id ?? null,
    selectedTextureAssetId: null,
    selectedCampaignId: null,
    creativeGoal: input.mode === 'Room Restyle' ? 'room-visual' : input.mode === 'Cutout' ? 'cutout-asset' : 'special-ad',
    publishChannel: 'Instagram',
    scheduledFor: null,
    aspectRatio: preset.width > preset.height ? '16:9' : preset.height > preset.width ? '9:16' : '1:1',
    showPrice: true,
    showCta: true,
    watermarkProfile: 'Standard BTS',
    channelSize: 'Original',
    usagePurpose: input.mode === 'Cutout' ? 'Gallery' : 'Publishable Variant',
    edgeSoftness: 0.18,
    isolationMode: 'balanced',
    processingMode: 'deterministic',
    applicationMode: 'full-wall',
    roomType: 'Interior',
    blend: 0.72,
    scale: 1,
    intensity: 1,
    contrast: 1,
    splitView: true,
    focusPoint: null,
    activeMaskId: null,
  };

  return {
    name:
      input.mode === 'Room Restyle'
        ? `${input.product?.name ?? 'BTS'} Room Restyle`
        : input.mode === 'Cutout'
          ? `${input.sourceAsset?.name ?? input.product?.name ?? 'BTS'} Cutout`
          : `${input.product?.name ?? input.template?.name ?? 'BTS Creative'} Design`,
    workspaceMode: input.mode,
    canvasPreset: preset,
    metadata,
    layers: buildDefaultLayers(input),
    masks: [] as CreativeMask[],
  };
}

function getStageClass(preset: CreativeCanvasPreset) {
  return 'aspect-[16/10]';
}

function getAspectRatio(preset: CreativeCanvasPreset) {
  return `${preset.width} / ${preset.height}`;
}

function getSafeZoneGuides(preset: CreativeCanvasPreset) {
  return {
    left: preset.safeZone.leftPct,
    top: preset.safeZone.topPct,
    right: 100 - preset.safeZone.rightPct,
    bottom: 100 - preset.safeZone.bottomPct,
  };
}

function snapTransform(next: CreativeLayerTransform, preset: CreativeCanvasPreset) {
  const safe = getSafeZoneGuides(preset);
  const snapPct = (value: number) => Math.round(value * 2) / 2;
  const candidate = {
    ...next,
    xPct: snapPct(next.xPct),
    yPct: snapPct(next.yPct),
    widthPct: clamp(snapPct(next.widthPct), 8, 100),
    heightPct: clamp(snapPct(next.heightPct), 8, 100),
  };

  const centerX = candidate.xPct + candidate.widthPct / 2;
  const centerY = candidate.yPct + candidate.heightPct / 2;
  if (Math.abs(centerX - 50) < 1.5) {
    candidate.xPct = 50 - candidate.widthPct / 2;
  }
  if (Math.abs(centerY - 50) < 1.5) {
    candidate.yPct = 50 - candidate.heightPct / 2;
  }
  if (Math.abs(candidate.xPct - safe.left) < 1.5) {
    candidate.xPct = safe.left;
  }
  if (Math.abs(candidate.yPct - safe.top) < 1.5) {
    candidate.yPct = safe.top;
  }
  if (Math.abs(candidate.xPct + candidate.widthPct - safe.right) < 1.5) {
    candidate.xPct = safe.right - candidate.widthPct;
  }
  if (Math.abs(candidate.yPct + candidate.heightPct - safe.bottom) < 1.5) {
    candidate.yPct = safe.bottom - candidate.heightPct;
  }
  candidate.xPct = clamp(candidate.xPct, 0, Math.max(100 - candidate.widthPct, 0));
  candidate.yPct = clamp(candidate.yPct, 0, Math.max(100 - candidate.heightPct, 0));
  return candidate;
}

export function CreativeGeneratorWorkspace({
  templates,
  assets,
  products,
  campaigns,
  selectedTemplate,
  onTemplateChange,
  selectedProduct,
  onProductChange,
  onUploadSourceAsset,
  onCreateCreativeOutput,
  onCreateCampaign,
  onOpenAsset,
  seedAsset,
  seedMode,
  onSeedConsumed,
  forcedMode,
  onModeChange,
  documentId,
  selectedCampaignId,
}: CreativeGeneratorWorkspaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageViewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceUploadRef = useRef<HTMLInputElement>(null);
  const stageUploadRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<LeftRailTab>('Assets');
  const [assetQuery, setAssetQuery] = useState('');
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [workingDocument, setWorkingDocument] = useState<CreativeDocumentDetail | null>(null);
  const [workingDraft, setWorkingDraft] = useState<ReturnType<typeof createBlankDocumentState> | null>(null);
  const [pinPlacementArmed, setPinPlacementArmed] = useState(false);
  const [maskEditMode, setMaskEditMode] = useState<BrushMode | null>(null);
  const [maskBrushSize, setMaskBrushSize] = useState(32);
  const [maskStrokes, setMaskStrokes] = useState<BrushStroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<BrushStroke | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [zoomPercent, setZoomPercent] = useState(100);
  const [savedOutputAsset, setSavedOutputAsset] = useState<WorkspaceAsset | null>(null);
  const [isSavingManagedOutput, setIsSavingManagedOutput] = useState(false);
  const [dragAssetId, setDragAssetId] = useState<string | null>(null);
  const [isStageDragOver, setIsStageDragOver] = useState(false);
  const [showAdvancedStudio, setShowAdvancedStudio] = useState(false);
  const [isCreatingCampaignFromStudio, setIsCreatingCampaignFromStudio] = useState(false);

  const creativeStudio = useCreativeStudioData();

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        rootRef.current?.querySelectorAll('[data-studio-section]') ?? [],
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.05,
        },
      );
    }, rootRef);

    return () => context.revert();
  }, []);

  useEffect(() => {
    if (!stageViewportRef.current) {
      return;
    }

    const node = stageViewportRef.current;
    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setViewportSize({
        width: Math.max(rect.width, 1),
        height: Math.max(rect.height, 1),
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(node);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    if (!selectedTemplate && templates.length > 0) {
      onTemplateChange(templates[0]);
    }
  }, [onTemplateChange, selectedTemplate, templates]);

  useEffect(() => {
    if (!selectedProduct && products.length > 0) {
      onProductChange(products[0]);
    }
  }, [onProductChange, products, selectedProduct]);

  useEffect(() => {
    if (!seedAsset && !seedMode) {
      return;
    }

    const draft = createBlankDocumentState({
      mode: stageModeFromSeed(seedMode),
      product: selectedProduct,
      template: selectedTemplate,
      sourceAsset: seedAsset ?? null,
    });

    setWorkingDraft(draft);
    setWorkingDocument(null);
    setActiveTab(seedMode === 'scene' ? 'AI Tools' : 'Assets');
    onSeedConsumed?.();
  }, [onSeedConsumed, seedAsset, seedMode, selectedProduct, selectedTemplate]);

  useEffect(() => {
    if (!documentId) {
      return;
    }

    const nextDocument = creativeStudio.documentsById[documentId];
    if (nextDocument && creativeStudio.activeDocument?.id !== nextDocument.id) {
      creativeStudio.setActiveDocument(nextDocument);
    }
  }, [creativeStudio.activeDocument?.id, creativeStudio.documentsById, creativeStudio.setActiveDocument, documentId]);

  useEffect(() => {
    if (!creativeStudio.activeDocument) {
      return;
    }
    setWorkingDocument(clone(creativeStudio.activeDocument));
    setWorkingDraft(null);
    setSelectedLayerId(null);
    setMaskStrokes([]);
    if (creativeStudio.activeDocument.productId) {
      const product = products.find((item) => item.id === creativeStudio.activeDocument?.productId);
      if (product) {
        onProductChange(product);
      }
    }
    if (creativeStudio.activeDocument.templateId) {
      const template = templates.find((item) => item.id === creativeStudio.activeDocument?.templateId);
      if (template) {
        onTemplateChange(template);
      }
    }
  }, [creativeStudio.activeDocument, onProductChange, onTemplateChange, products, templates]);

  const activeState = useMemo(() => {
    if (workingDocument) {
      return {
        id: workingDocument.id,
        name: workingDocument.name,
        workspaceMode: workingDocument.workspaceMode,
        canvasPreset: workingDocument.canvasPreset,
        metadata: (workingDocument.metadata ?? {}) as CreativeDocumentMetadata,
        layers: workingDocument.layers,
        masks: workingDocument.masks,
      };
    }

    if (workingDraft) {
      return {
        id: null,
        name: workingDraft.name,
        workspaceMode: workingDraft.workspaceMode,
        canvasPreset: workingDraft.canvasPreset,
        metadata: workingDraft.metadata,
        layers: workingDraft.layers,
        masks: workingDraft.masks,
      };
    }

    return createBlankDocumentState({
      mode: 'Product Design',
      product: selectedProduct,
      template: selectedTemplate,
      sourceAsset: seedAsset ?? null,
    });
  }, [seedAsset, selectedProduct, selectedTemplate, workingDocument, workingDraft]);

  const imageAssets = useMemo(() => assets.filter(isRenderableAsset), [assets]);
  const filteredAssets = useMemo(() => {
    const query = assetQuery.trim().toLowerCase();
    if (!query) {
      return imageAssets;
    }
    return imageAssets.filter((asset) =>
      [asset.name, ...(asset.tags ?? []), ...(asset.usage ?? [])].some((value) =>
        String(value ?? '').toLowerCase().includes(query),
      ),
    );
  }, [assetQuery, imageAssets]);

  const activePreset = activeState.canvasPreset;
  const activeMode = activeState.workspaceMode;
  const activeMetadata = activeState.metadata;
  const selectedCampaign = campaigns.find((campaign) => campaign.id === activeMetadata.selectedCampaignId) ?? null;
  const goalOptions = QUICK_GOALS;
  const activeGoal =
    QUICK_GOALS.find((goal) => goal.id === activeMetadata.creativeGoal) ??
    QUICK_GOALS.find((goal) => goal.mode === activeMode) ??
    QUICK_GOALS[0] ??
    null;

  useEffect(() => {
    setStageSize({
      width: activePreset.width,
      height: activePreset.height,
    });
  }, [activePreset.height, activePreset.width]);
  const normalizedSeedAsset = seedAsset && isRenderableAsset(seedAsset) ? seedAsset : null;
  const selectedSourceAsset = imageAssets.find((asset) => asset.id === activeMetadata.selectedSourceAssetId) ?? normalizedSeedAsset ?? null;
  const selectedSceneAsset = imageAssets.find((asset) => asset.id === activeMetadata.selectedSceneAssetId) ?? normalizedSeedAsset ?? null;
  const selectedTextureAsset = imageAssets.find((asset) => asset.id === activeMetadata.selectedTextureAssetId) ?? null;
  const draggedAsset = dragAssetId ? imageAssets.find((asset) => asset.id === dragAssetId) ?? null : null;
  const selectedMask = activeState.masks.find((mask) => mask.id === activeMetadata.activeMaskId) ?? activeState.masks[0] ?? null;
  const selectedLayer = activeState.layers.find((layer) => layer.id === selectedLayerId) ?? null;

  const stageAssetImageUrls = useMemo(
    () => Object.fromEntries(imageAssets.map((asset) => [asset.id, asset.img])),
    [imageAssets],
  );

  const guides = useMemo(() => {
    if (!selectedLayer) {
      return null;
    }
    const safe = getSafeZoneGuides(activePreset);
    const centerX = selectedLayer.transform.xPct + selectedLayer.transform.widthPct / 2;
    const centerY = selectedLayer.transform.yPct + selectedLayer.transform.heightPct / 2;
    return {
      vertical: Math.abs(centerX - 50) < 1.5 ? 50 : null,
      horizontal: Math.abs(centerY - 50) < 1.5 ? 50 : null,
      leftSafe: Math.abs(selectedLayer.transform.xPct - safe.left) < 1.5 ? safe.left : null,
      topSafe: Math.abs(selectedLayer.transform.yPct - safe.top) < 1.5 ? safe.top : null,
    };
  }, [activePreset, selectedLayer]);

  const setCurrentState = useCallback(
    (updater: (current: typeof activeState) => typeof activeState) => {
      if (workingDocument) {
        setWorkingDocument((current) => {
          if (!current) {
            return current;
          }
          const next = updater({
            id: current.id,
            name: current.name,
            workspaceMode: current.workspaceMode,
            canvasPreset: current.canvasPreset,
            metadata: (current.metadata ?? {}) as CreativeDocumentMetadata,
            layers: current.layers,
            masks: current.masks,
          });
          return {
            ...current,
            name: next.name,
            workspaceMode: next.workspaceMode,
            canvasPreset: next.canvasPreset,
            metadata: next.metadata,
            layers: next.layers,
            masks: next.masks,
          };
        });
        return;
      }

      setWorkingDraft((current) => {
        const baseline =
          current ??
          createBlankDocumentState({
            mode: activeMode,
            product: selectedProduct,
            template: selectedTemplate,
            sourceAsset: seedAsset ?? null,
          });
        return updater({
          id: null,
          name: baseline.name,
          workspaceMode: baseline.workspaceMode,
          canvasPreset: baseline.canvasPreset,
          metadata: baseline.metadata,
          layers: baseline.layers,
          masks: baseline.masks,
        });
      });
    },
    [activeMode, seedAsset, selectedProduct, selectedTemplate, workingDocument],
  );

  const updateMetadata = useCallback(
    (patch: Partial<CreativeDocumentMetadata>) => {
      setCurrentState((current) => ({
        ...current,
        metadata: {
          ...current.metadata,
          ...patch,
        },
      }));
    },
    [setCurrentState],
  );

  useEffect(() => {
    if (!forcedMode) {
      return;
    }

    if (activeState.workspaceMode === forcedMode) {
      return;
    }

    setCurrentState((current) => ({
      ...current,
      workspaceMode: forcedMode,
    }));
    setSelectedLayerId(null);
    setActiveTab(forcedMode === 'Room Restyle' ? 'AI Tools' : forcedMode === 'Product Design' ? 'Layouts' : 'Assets');
  }, [activeState.workspaceMode, forcedMode, setCurrentState]);

  useEffect(() => {
    if ((activeMetadata.selectedCampaignId ?? null) === (selectedCampaignId ?? null)) {
      return;
    }
    updateMetadata({ selectedCampaignId: selectedCampaignId ?? null });
  }, [activeMetadata.selectedCampaignId, selectedCampaignId, updateMetadata]);

  const updateSelectedLayer = useCallback(
    (updater: (layer: CreativeLayer) => CreativeLayer) => {
      if (!selectedLayerId) {
        return;
      }
      setCurrentState((current) => ({
        ...current,
        layers: current.layers.map((layer) => (layer.id === selectedLayerId ? updater(layer) : layer)),
      }));
    },
    [selectedLayerId, setCurrentState],
  );

  const commitLayerTransformFromPixels = useCallback(
    (layerId: string, nextFrame: { x: number; y: number; width: number; height: number }) => {
      if (!stageSize.width || !stageSize.height) {
        return;
      }

      setCurrentState((current) => ({
        ...current,
        layers: current.layers.map((layer) => {
          if (layer.id !== layerId) {
            return layer;
          }

          return {
            ...layer,
            transform: snapTransform(
              {
                ...layer.transform,
                xPct: clamp((nextFrame.x / stageSize.width) * 100, 0, 100),
                yPct: clamp((nextFrame.y / stageSize.height) * 100, 0, 100),
                widthPct: clamp((nextFrame.width / stageSize.width) * 100, 8, 100),
                heightPct: clamp((nextFrame.height / stageSize.height) * 100, 8, 100),
              },
              activePreset,
            ),
          };
        }),
      }));
    },
    [activePreset, setCurrentState, stageSize.height, stageSize.width],
  );

  const addLayer = useCallback(
    (layer: CreativeLayer) => {
      setCurrentState((current) => ({
        ...current,
        layers: [...current.layers, { ...layer, transform: { ...layer.transform, zIndex: current.layers.length + 1 } }],
      }));
      setSelectedLayerId(layer.id);
      setActiveTab('Layers');
    },
    [setCurrentState],
  );

  const removeSelectedLayer = useCallback(() => {
    if (!selectedLayerId) {
      return;
    }
    setCurrentState((current) => ({
      ...current,
      layers: current.layers.filter((layer) => layer.id !== selectedLayerId),
    }));
    setSelectedLayerId(null);
  }, [selectedLayerId, setCurrentState]);

  const requestModeChange = useCallback(
    (nextMode: CreativeWorkspaceMode) => {
      if (onModeChange) {
        onModeChange(nextMode);
        return;
      }

      setCurrentState((current) => ({ ...current, workspaceMode: nextMode }));
    },
    [onModeChange, setCurrentState],
  );

  const applyQuickGoal = useCallback(
    (goalId: CreativeGoalId) => {
      const goal = QUICK_GOALS.find((item) => item.id === goalId);
      if (!goal) {
        return;
      }

      if (goal.mode !== activeMode) {
        requestModeChange(goal.mode);
      }

      setCurrentState((current) => ({
        ...current,
        canvasPreset: createCanvasPreset(goal.preset),
        metadata: {
          ...current.metadata,
          creativeGoal: goal.id,
          usagePurpose: goal.usagePurpose,
          channelSize: goal.channelSize,
        },
      }));
      setSelectedLayerId(null);
    },
    [activeMode, requestModeChange, setCurrentState],
  );

  useEffect(() => {
    if (!showAdvancedStudio && selectedLayerId) {
      setSelectedLayerId(null);
    }
  }, [selectedLayerId, showAdvancedStudio]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedLayerId) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingTarget =
        target?.isContentEditable ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select';

      if (isTypingTarget) {
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        removeSelectedLayer();
      }

      if (event.key === 'Escape') {
        setSelectedLayerId(null);
        setPinPlacementArmed(false);
        setMaskEditMode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [removeSelectedLayer, selectedLayerId]);

  const createNewDocument = useCallback(async () => {
    try {
      const base = createBlankDocumentState({
        mode: activeMode,
        product: selectedProduct,
        template: selectedTemplate,
        sourceAsset: activeMode === 'Room Restyle' ? selectedSceneAsset : selectedSourceAsset,
      });

      const created = await creativeStudio.createDocument({
        name: base.name,
        workspaceMode: base.workspaceMode,
        canvasPreset: base.canvasPreset,
        productId: selectedProduct?.id,
        campaignId: activeMetadata.selectedCampaignId ?? undefined,
        templateId: selectedTemplate?.id,
        metadata: base.metadata,
        layers: base.layers,
      });

      setWorkingDocument(created);
      setWorkingDraft(null);
      toast.success('Creative document created.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create document.');
    }
  }, [activeMetadata.selectedCampaignId, activeMode, creativeStudio, selectedProduct, selectedSceneAsset, selectedSourceAsset, selectedTemplate]);

  const buildRoomMaskDataUrl = useCallback(
    (vectorData: CreativeMask['vectorData'] | null, brushStrokes: BrushStroke[]) => {
      return createMaskDataUrl({
        width: 640,
        height: 400,
        vectorData: vectorData ?? undefined,
        brushStrokes,
      });
    },
    [],
  );

  useEffect(() => {
    if (!maskCanvasRef.current || activeMode !== 'Room Restyle') {
      return;
    }

    const canvas = maskCanvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    canvas.width = 640;
    canvas.height = 400;
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (selectedMask?.maskImageUrl) {
      const image = new window.Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = selectedMask.maskImageUrl;
    }
  }, [activeMode, selectedMask?.id, selectedMask?.maskImageUrl]);

  useEffect(() => {
    if (activeMode === 'Product Design') {
      setPreviewUrl(null);
      setPreviewError(null);
      return;
    }

    let alive = true;

    const run = async () => {
      setPreviewError(null);
      if (activeMode === 'Cutout') {
        if (!selectedSourceAsset) {
          setPreviewUrl(null);
          return;
        }
      const request: BackgroundRemovalRequest = {
        sourceAsset: selectedSourceAsset,
        edgeSoftness: activeMetadata.edgeSoftness ?? 0.18,
        isolationMode: activeMetadata.isolationMode ?? 'balanced',
        watermarkProfile: activeMetadata.watermarkProfile ?? 'Standard BTS',
        channelSize: activeMetadata.channelSize ?? 'Original',
        prompt: activeMetadata.aiDirection ?? '',
      };
        const next = await previewBackgroundRemoval(request);
        if (alive) {
          setPreviewUrl(next);
        }
        return;
      }

      if (!selectedSceneAsset || !selectedProduct) {
        setPreviewUrl(null);
        return;
      }

      const request: SceneMockupRequest = {
        sceneAsset: selectedSceneAsset,
        textureAsset: selectedTextureAsset ?? undefined,
        product: selectedProduct,
        applicationMode: activeMetadata.applicationMode ?? 'full-wall',
        processingMode: activeMetadata.processingMode ?? 'deterministic',
        roomType: activeMetadata.roomType ?? 'Interior',
        splitView: activeMetadata.splitView ?? true,
        scale: activeMetadata.scale ?? 1,
        blend: activeMetadata.blend ?? 0.72,
        intensity: activeMetadata.intensity ?? 1,
        contrast: activeMetadata.contrast ?? 1,
        watermarkProfile: activeMetadata.watermarkProfile ?? 'Standard BTS',
        focusPoint: activeMetadata.focusPoint ?? null,
        maskDataUrl: selectedMask?.maskImageUrl ?? null,
      };

      const next = await previewSceneMockup(request);
      if (alive) {
        setPreviewUrl(next);
      }
    };

    void run().catch((error) => {
      if (!alive) {
        return;
      }
      setPreviewUrl(null);
      setPreviewError(error instanceof Error ? error.message : 'Failed to build preview.');
    });

    return () => {
      alive = false;
    };
  }, [activeMetadata, activeMode, selectedMask?.maskImageUrl, selectedProduct, selectedSceneAsset, selectedSourceAsset, selectedTextureAsset]);

  const persistPreviewImage = useCallback(async () => {
    try {
      if (activeMode === 'Product Design') {
        const dataUrl = await renderCreativeDocumentToDataUrl({
          preset: activePreset,
          layers: activeState.layers,
          assetImageUrls: stageAssetImageUrls,
        });
        const file = dataUrlToFile(dataUrl, `${activeState.name.replace(/\s+/g, '-').toLowerCase()}-preview.png`);
        return await uploadInventoryFile(file);
      }

      if (!previewUrl) {
        return null;
      }

      const file = dataUrlToFile(previewUrl, `${activeState.name.replace(/\s+/g, '-').toLowerCase()}-preview.png`);
      return await uploadInventoryFile(file);
    } catch {
      return null;
    }
  }, [activeMode, activePreset, activeState.layers, activeState.name, previewUrl, stageAssetImageUrls]);

  const handleSaveDocument = useCallback(async () => {
    try {
      const uploadedPreview = await persistPreviewImage();
      const payload = {
        name: activeState.name,
        workspaceMode: activeState.workspaceMode,
        canvasPreset: activePreset,
        productId: selectedProduct?.id ?? null,
        campaignId: activeMetadata.selectedCampaignId ?? null,
        templateId: selectedTemplate?.id ?? null,
        metadata: activeMetadata,
        previewImageUrl: uploadedPreview?.url ?? undefined,
        layers: activeState.layers,
        masks: activeState.masks.map((mask) => ({
          id: mask.id,
          label: mask.label,
          maskMode: mask.maskMode,
          width: mask.width,
          height: mask.height,
          maskImageUrl: mask.maskImageUrl ?? null,
          vectorData: mask.vectorData ?? null,
        })),
      };

      if (workingDocument?.id) {
        const updated = await creativeStudio.updateDocument(workingDocument.id, payload);
        setWorkingDocument(updated);
        toast.success('Creative document saved.');
        return updated;
      } else {
        const created = await creativeStudio.createDocument({
          name: payload.name,
          workspaceMode: payload.workspaceMode,
          canvasPreset: payload.canvasPreset,
          productId: payload.productId ?? undefined,
          campaignId: payload.campaignId ?? undefined,
          templateId: payload.templateId ?? undefined,
          metadata: payload.metadata,
          layers: payload.layers,
        });

        if (payload.previewImageUrl || payload.masks.length) {
          const updated = await creativeStudio.updateDocument(created.id, {
            previewImageUrl: payload.previewImageUrl ?? undefined,
            masks: payload.masks,
          });
          setWorkingDocument(updated);
          setWorkingDraft(null);
          toast.success('Creative document saved.');
          return updated;
        } else {
          setWorkingDocument(created);
          setWorkingDraft(null);
          toast.success('Creative document saved.');
          return created;
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save document.');
      throw error;
    }
  }, [activeMetadata, activePreset, activeState.layers, activeState.masks, activeState.name, activeState.workspaceMode, creativeStudio, persistPreviewImage, selectedProduct, selectedTemplate, workingDocument?.id]);

  const buildExportDataUrl = useCallback(async () => {
    if (activeMode === 'Product Design') {
      return await renderCreativeDocumentToDataUrl({
        preset: activePreset,
        layers: activeState.layers,
        assetImageUrls: stageAssetImageUrls,
      });
    }

    if (!previewUrl) {
      throw new Error('Preview is required before exporting.');
    }
    return previewUrl;
  }, [activeMode, activePreset, activeState.layers, previewUrl, stageAssetImageUrls]);

  const handleExport = useCallback(async (): Promise<CreativeExportJob | null> => {
    try {
      let currentDocumentId = workingDocument?.id ?? creativeStudio.activeDocument?.id ?? null;
      if (!currentDocumentId) {
        const saved = await handleSaveDocument();
        currentDocumentId = saved?.id ?? null;
      }

      if (!currentDocumentId) {
        throw new Error('Save the document before exporting.');
      }

      const dataUrl = await buildExportDataUrl();
      const file = dataUrlToFile(dataUrl, `${activeState.name.replace(/\s+/g, '-').toLowerCase()}-export.png`);
      const uploaded = await uploadInventoryFile(file);
      const exportJob = await creativeStudio.createExportJob(currentDocumentId, {
        preset: activePreset.label,
        width: activePreset.width,
        height: activePreset.height,
        uploadedAsset: {
          imageUrl: uploaded.url,
          originalFilename: uploaded.originalFilename,
          storedFilename: uploaded.storedFilename,
          storagePath: uploaded.storagePath,
          mimeType: uploaded.mimeType,
          fileSizeBytes: uploaded.size,
          sha256: uploaded.sha256,
        },
        attachToCampaignId: activeMetadata.selectedCampaignId ?? undefined,
        publishChannel: activeMetadata.publishChannel ?? undefined,
        publishTarget: activeGoal?.label ?? activeMode,
        usagePurpose: activeMetadata.usagePurpose ?? 'Publishable Variant',
        watermarkProfile: activeMetadata.watermarkProfile,
      });

      const createdAsset = assets.find((asset) => asset.id === exportJob.outputAssetId);
      if (createdAsset) {
        onOpenAsset(createdAsset);
      }
      toast.success('Export created and saved to Asset Lab.');
      return exportJob;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export creative.');
      return null;
    }
  }, [activeGoal?.label, activeMetadata.publishChannel, activeMetadata.selectedCampaignId, activeMetadata.usagePurpose, activeMetadata.watermarkProfile, activeMode, activePreset.height, activePreset.label, activePreset.width, activeState.name, assets, buildExportDataUrl, creativeStudio, handleSaveDocument, onOpenAsset, workingDocument?.id]);

  const handleSaveCutoutOutput = useCallback(async () => {
    if (activeMode !== 'Cutout') {
      return null;
    }
    if (!selectedSourceAsset) {
      toast.error('Select or upload a source image before saving the cutout.');
      return null;
    }
    if (!previewUrl) {
      toast.error('A cutout preview is required before saving.');
      return null;
    }

    setIsSavingManagedOutput(true);

    try {
      let currentDocumentId = workingDocument?.id ?? creativeStudio.activeDocument?.id ?? null;
      if (!currentDocumentId) {
        const saved = await handleSaveDocument();
        currentDocumentId = saved?.id ?? null;
      }

      const baseName = sanitizeMarketingAssetName(`${activeState.name || selectedSourceAsset.name} Cutout`);
      const file = dataUrlToFile(previewUrl, `${baseName.replace(/\s+/g, '-').toLowerCase()}.png`);
      const uploaded = await uploadInventoryFile(file);
      const createdAsset = await onCreateCreativeOutput({
        name: baseName,
        imageUrl: uploaded.url,
        size: `${Math.max(0.1, uploaded.size / (1024 * 1024)).toFixed(1)}MB`,
        type: 'Image',
        productId: selectedProduct?.id ?? selectedSourceAsset.productId ?? undefined,
        campaignId: activeMetadata.selectedCampaignId ?? undefined,
        templateId: selectedTemplate?.id ?? undefined,
        sourceAssetIds: [selectedSourceAsset.id],
        tags: Array.from(new Set([...(selectedSourceAsset.tags ?? []), 'Cutout', 'Managed Variant', 'Creative Studio'])),
        usagePurpose: activeMetadata.usagePurpose === 'Publishable Variant' ? 'Gallery' : activeMetadata.usagePurpose ?? 'Gallery',
        protectionLevel: 'Managed Variant',
        status: 'Review',
        watermarkProfile: activeMetadata.watermarkProfile,
        backgroundTransparent: true,
        workflowNode: 'creative.cutout.review',
        originalFilename: uploaded.originalFilename,
        storedFilename: uploaded.storedFilename,
        storagePath: uploaded.storagePath,
        mimeType: uploaded.mimeType,
        fileSizeBytes: uploaded.size,
        sha256: uploaded.sha256,
      });

      setSavedOutputAsset(createdAsset);

      if (currentDocumentId) {
        const updated = await creativeStudio.updateDocument(currentDocumentId, {
          status: 'Review',
          metadata: {
            ...activeMetadata,
            selectedSourceAssetId: selectedSourceAsset.id,
          },
        });
        setWorkingDocument(updated);
      }

      toast.success('Managed cutout saved to Asset Lab.');
      return createdAsset;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save cutout.');
      return null;
    } finally {
      setIsSavingManagedOutput(false);
    }
  }, [
    activeMetadata,
    activeMode,
    activeState.name,
    creativeStudio,
    handleSaveDocument,
    onCreateCreativeOutput,
    previewUrl,
    selectedProduct?.id,
    selectedSourceAsset,
    selectedTemplate?.id,
    workingDocument?.id,
  ]);

  const handlePublish = useCallback(async () => {
    try {
      let documentId = workingDocument?.id ?? creativeStudio.activeDocument?.id ?? null;
      if (!documentId) {
        const saved = await handleSaveDocument();
        documentId = saved?.id ?? null;
      }

      if (!documentId) {
        throw new Error('Save the document before publishing.');
      }

      let latestExport =
        (workingDocument?.exportJobs ?? []).find((job) => job.outputAssetId) ??
        (creativeStudio.activeDocument?.exportJobs ?? []).find((job) => job.outputAssetId);
      if (!latestExport) {
        latestExport = await handleExport();
      }

      if (!latestExport) {
        throw new Error('Create an export before publishing.');
      }

      const published = await creativeStudio.publishDocument(documentId, {
        exportJobId: latestExport.id,
        channel: activeMetadata.publishChannel ?? 'Instagram',
        title: activeState.name,
        scheduledFor: activeMetadata.scheduledFor ?? undefined,
      });
      setWorkingDocument(published);
      toast.success(activeMetadata.scheduledFor ? 'Creative scheduled into Calendar and Publishing.' : 'Creative sent into Publishing.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to publish creative.');
    }
  }, [activeMetadata.publishChannel, activeMetadata.scheduledFor, activeState.name, creativeStudio, handleExport, handleSaveDocument, workingDocument?.id]);

  const handleUploadAsset = useCallback(
    async (file: File, kind: 'source' | 'scene') => {
      try {
        const asset = await onUploadSourceAsset({
          file,
          productId: kind === 'source' ? selectedProduct?.id : undefined,
        });

        if (kind === 'scene') {
          updateMetadata({ selectedSceneAssetId: asset.id });
        } else {
          updateMetadata({ selectedSourceAssetId: asset.id });
          if (activeMode === 'Product Design') {
            addLayer({
              id: makeLayerId(),
              name: asset.name,
              type: 'image',
              sourceAssetId: asset.id,
              visible: true,
              locked: false,
              transform: { xPct: 12, yPct: 20, widthPct: 32, heightPct: 40, rotation: 0, zIndex: activeState.layers.length + 1, opacity: 1 },
              crop: { xPct: 0, yPct: 0, scale: 1 },
              style: { borderRadius: 24 },
              content: { imageUrl: asset.img },
            });
          }
        }

        toast.success(`${asset.name} stored in Asset Lab.`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to upload image.');
      }
    },
    [activeMode, activeState.layers.length, addLayer, onUploadSourceAsset, selectedProduct, updateMetadata],
  );

  const handleStageDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsStageDragOver(false);
      setDragAssetId(null);
      const assetId =
        event.dataTransfer.getData(STUDIO_ASSET_DRAG_TYPE) ||
        event.dataTransfer.getData('text/plain');
      const asset = imageAssets.find((item) => item.id === assetId);
      if (!asset || !stageRef.current) {
        return;
      }

      const rect = stageRef.current.getBoundingClientRect();
      const xPct = ((event.clientX - rect.left) / rect.width) * 100 - DEFAULT_IMAGE_LAYER_WIDTH_PCT / 2;
      const yPct = ((event.clientY - rect.top) / rect.height) * 100 - DEFAULT_IMAGE_LAYER_HEIGHT_PCT / 2;

      addLayer(
        createImageLayerFromAsset({
          asset,
          xPct,
          yPct,
          zIndex: activeState.layers.length + 1,
          preset: activePreset,
        }),
      );
    },
    [activePreset, activeState.layers.length, addLayer, imageAssets],
  );

  const startBrushStroke = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!maskEditMode || !stageRef.current) {
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      setActiveStroke({
        mode: maskEditMode,
        size: maskBrushSize,
        points: [{ x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height }],
      });
    },
    [maskBrushSize, maskEditMode],
  );

  const moveBrushStroke = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeStroke) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setActiveStroke((current) =>
      current
        ? {
            ...current,
            points: [
              ...current.points,
              { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height },
            ],
          }
        : current,
    );
  }, [activeStroke]);

  const endBrushStroke = useCallback(() => {
    if (!activeStroke) {
      return;
    }

    const nextStrokes = [...maskStrokes, activeStroke];
    setMaskStrokes(nextStrokes);
    const maskVector = selectedMask?.vectorData ?? null;
    const maskImageUrl = buildRoomMaskDataUrl(maskVector, nextStrokes);
    const maskId = selectedMask?.id ?? `mask_${Math.random().toString(36).slice(2, 10)}`;
    setCurrentState((current) => {
      const nextMask: CreativeMask = {
        id: maskId,
        label: 'Room Mask',
        maskMode: 'brush',
        width: 640,
        height: 400,
        maskImageUrl,
        vectorData: maskVector,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const nextMasks = current.masks.filter((mask) => mask.id !== maskId);
      return {
        ...current,
        metadata: {
          ...current.metadata,
          activeMaskId: maskId,
        },
        masks: [nextMask, ...nextMasks],
      };
    });
    setActiveStroke(null);
  }, [activeStroke, buildRoomMaskDataUrl, maskStrokes, selectedMask?.id, selectedMask?.vectorData, setCurrentState]);

  const handleSegmentRoom = useCallback(async () => {
    try {
      const job = await creativeStudio.createAiJob({
        documentId: workingDocument?.id ?? undefined,
        assetId: selectedSceneAsset?.id,
        type: 'Room Segmentation',
        input: {
          width: 640,
          height: 400,
          focusPoint: activeMetadata.focusPoint ?? { x: 0.5, y: 0.54 },
          applicationMode: activeMetadata.applicationMode ?? 'full-wall',
          prompt: activeMetadata.aiDirection ?? '',
        },
      });

      const vectorData = (job.result ?? createSuggestedMaskVector({
        focusPoint: activeMetadata.focusPoint ?? { x: 0.5, y: 0.54 },
        applicationMode: activeMetadata.applicationMode ?? 'full-wall',
      })) as CreativeMask['vectorData'];

      const maskImageUrl = createMaskDataUrl({
        width: 640,
        height: 400,
        vectorData: vectorData ?? undefined,
      });

      const maskId = `mask_${Math.random().toString(36).slice(2, 10)}`;
      setMaskStrokes([]);
      setCurrentState((current) => ({
        ...current,
        metadata: {
          ...current.metadata,
          activeMaskId: maskId,
        },
        masks: [
          {
            id: maskId,
            label: 'AI Suggested Mask',
            maskMode: 'ellipse',
            width: 640,
            height: 400,
            maskImageUrl,
            vectorData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...current.masks.filter((mask) => mask.id !== maskId),
        ],
      }));

      toast.success('Suggested room mask created. Use Paint or Erase to refine it.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to segment room.');
    }
  }, [activeMetadata.applicationMode, activeMetadata.focusPoint, creativeStudio, selectedSceneAsset?.id, setCurrentState, workingDocument?.id]);

  const handleBackgroundAssist = useCallback(async () => {
    try {
      await creativeStudio.createAiJob({
        documentId: workingDocument?.id ?? undefined,
        assetId: selectedSourceAsset?.id,
        type: 'Background Removal',
        input: {
          edgeSoftness: activeMetadata.edgeSoftness ?? 0.18,
          isolationMode: activeMetadata.isolationMode ?? 'balanced',
          prompt: activeMetadata.aiDirection ?? '',
        },
      });
      toast.success('Background removal assist prepared. Adjust the cutout and export when ready.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start background assist.');
    }
  }, [activeMetadata.edgeSoftness, activeMetadata.isolationMode, creativeStudio, selectedSourceAsset?.id, workingDocument?.id]);

  const handleAutoLayout = useCallback(async () => {
    try {
      const job = await creativeStudio.createAiJob({
        documentId: workingDocument?.id ?? undefined,
        type: 'Auto Layout',
        input: {
          templateName: selectedTemplate?.name,
          productName: selectedProduct?.name,
          productCategory: selectedProduct?.category,
          prompt: activeMetadata.aiDirection ?? '',
        },
      });

      const result = job.result ?? {};
      setCurrentState((current) => ({
        ...current,
        metadata: {
          ...current.metadata,
          generatorCopy: String(result.body ?? current.metadata.generatorCopy ?? ''),
        },
        layers: current.layers.map((layer) => {
          if (layer.name === 'Headline') {
            return {
              ...layer,
              content: {
                ...layer.content,
                text: String(result.headline ?? layer.content?.text ?? selectedProduct?.name ?? 'BTS Creative'),
              },
            };
          }
          if (layer.name === 'Body Copy') {
            return {
              ...layer,
              content: {
                ...layer.content,
                text: String(result.body ?? layer.content?.text ?? ''),
              },
            };
          }
          return layer;
        }),
      }));

      toast.success('Auto layout suggestions applied to the current document.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply auto layout.');
    }
  }, [creativeStudio, selectedProduct?.category, selectedProduct?.name, selectedTemplate?.name, setCurrentState, workingDocument?.id]);

  const handleAutoCaption = useCallback(async () => {
    try {
      const job = await creativeStudio.createAiJob({
        documentId: workingDocument?.id ?? undefined,
        type: 'Auto Caption',
        input: {
          productName: selectedProduct?.name,
          destination: selectedTemplate?.destination ?? activePreset.label,
          prompt: activeMetadata.aiDirection ?? '',
        },
      });
      const caption = String(job.result?.caption ?? '');
      updateMetadata({ generatorCopy: caption });
      toast.success('Caption added to the studio copy controls.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate caption.');
    }
  }, [activePreset.label, creativeStudio, selectedProduct?.name, selectedTemplate?.destination, updateMetadata, workingDocument?.id]);

  const handleGenerateCreative = useCallback(async () => {
    try {
      if (activeMode === 'Cutout') {
        if (!selectedSourceAsset) {
          toast.error('Select or upload an image first.');
          return;
        }
        await handleBackgroundAssist();
        toast.success('Cutout preview refreshed.');
        return;
      }

      if (activeMode === 'Room Restyle') {
        if (!selectedSceneAsset) {
          toast.error('Select or upload a room image first.');
          return;
        }
        if (!selectedProduct) {
          toast.error('Select the product you want to visualize.');
          return;
        }
        if (!selectedMask) {
          await handleSegmentRoom();
        }
        toast.success('Room visual refreshed.');
        return;
      }

      if (!selectedSourceAsset && !selectedProduct) {
        toast.error('Choose a source asset or linked product first.');
        return;
      }

      setCurrentState((current) => {
        const nextLayers = buildDefaultLayers({
          mode: 'Product Design',
          product: selectedProduct,
          template: selectedTemplate,
          sourceAsset: selectedSourceAsset,
        });
        return {
          ...current,
          name:
            current.name ||
            `${selectedProduct?.name ?? selectedSourceAsset?.name ?? selectedTemplate?.name ?? 'BTS Creative'} ${activeGoal?.label ?? 'Creative'}`,
          layers: nextLayers,
          metadata: {
            ...current.metadata,
            selectedSourceAssetId: selectedSourceAsset?.id ?? current.metadata.selectedSourceAssetId ?? null,
            selectedCampaignId: selectedCampaign?.id ?? current.metadata.selectedCampaignId ?? null,
          },
        };
      });

      if ((activeMetadata.processingMode ?? 'deterministic') === 'ai-enhanced') {
        await handleAutoLayout();
        if (!(activeMetadata.generatorCopy ?? '').trim()) {
          await handleAutoCaption();
        }
      }

      toast.success('Creative preview assembled from your selected asset, product, and brief.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate creative.');
    }
  }, [
    activeGoal?.label,
    activeMetadata.generatorCopy,
    activeMetadata.processingMode,
    activeMode,
    handleAutoCaption,
    handleAutoLayout,
    handleBackgroundAssist,
    handleSegmentRoom,
    selectedCampaign?.id,
    selectedMask,
    selectedProduct,
    selectedSceneAsset,
    selectedSourceAsset,
    selectedTemplate,
    setCurrentState,
  ]);

  const handleCreateCampaignFromStudio = useCallback(async () => {
    if (activeMetadata.selectedCampaignId) {
      toast('Campaign already linked', {
        description: 'This studio brief is already attached to a campaign.',
      });
      return;
    }

    try {
      setIsCreatingCampaignFromStudio(true);
      const now = new Date();
      const scheduledDate = activeMetadata.scheduledFor ? new Date(activeMetadata.scheduledFor) : null;
      const startDate = (scheduledDate ?? now).toISOString().slice(0, 10);
      const endSource = scheduledDate ? new Date(scheduledDate) : new Date(now);
      endSource.setDate(endSource.getDate() + 14);
      const endDate = endSource.toISOString().slice(0, 10);

      const campaign = await onCreateCampaign({
        name: activeState.name || `${selectedProduct?.name ?? activeGoal?.label ?? 'BTS'} Campaign`,
        owner: 'BTS Operator',
        description:
          (activeMetadata.aiDirection ?? '').trim() ||
          (activeMetadata.generatorCopy ?? '').trim() ||
          `Created from BTS Creative Studio for ${activeGoal?.label ?? 'creative production'}.`,
        status: activeMetadata.scheduledFor ? 'Scheduled' : 'Draft',
        startDate,
        endDate,
        channels: activeMetadata.publishChannel ? [activeMetadata.publishChannel] : ['Instagram'],
        linkedAssetIds: Array.from(
          new Set([
            ...(selectedSourceAsset?.id ? [selectedSourceAsset.id] : []),
            ...(selectedSceneAsset?.id ? [selectedSceneAsset.id] : []),
          ]),
        ),
        productIds: selectedProduct?.id ? [selectedProduct.id] : [],
        budget: 'R 0',
      });

      updateMetadata({ selectedCampaignId: campaign.id });
      toast.success('Campaign created and linked to this studio brief.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign from studio.');
    } finally {
      setIsCreatingCampaignFromStudio(false);
    }
  }, [
    activeGoal?.label,
    activeMetadata.aiDirection,
    activeMetadata.generatorCopy,
    activeMetadata.publishChannel,
    activeMetadata.scheduledFor,
    activeMetadata.selectedCampaignId,
    activeState.name,
    onCreateCampaign,
    selectedProduct,
    selectedSceneAsset?.id,
    selectedSourceAsset?.id,
    updateMetadata,
  ]);

  const safeZone = getSafeZoneGuides(activePreset);
  const fitScale = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) {
      return 1;
    }
    return Math.min(viewportSize.width / activePreset.width, viewportSize.height / activePreset.height);
  }, [activePreset.height, activePreset.width, viewportSize.height, viewportSize.width]);
  const appliedScale = Math.max(0.35, Math.min(2, fitScale * (zoomPercent / 100)));
  const stageFrameWidth = activePreset.width * appliedScale;
  const stageFrameHeight = activePreset.height * appliedScale;

  return (
    <div ref={rootRef} className="flex h-[calc(100dvh-10.5rem)] min-h-0 flex-col gap-3 overflow-hidden xl:h-[calc(100dvh-9rem)]">
      <header data-studio-section className="rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.34em] text-[#00ff88]">BTS Creative Studio</p>
            <h1 className="mt-2 text-3xl font-serif font-bold uppercase tracking-tight text-white xl:text-[2rem]">Guided Creative Workflow</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/52">
              Pick the source asset, choose the treatment and output goal, add a short brief, then let the studio assemble the preview and push it into campaigns, calendar, and publishing.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => void createNewDocument()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/80 transition-all hover:border-white/20 hover:text-white"
            >
              <Plus size={14} />
              New Draft
            </button>
            <button
              type="button"
              onClick={() => (activeMode === 'Room Restyle' ? stageUploadRef.current?.click() : sourceUploadRef.current?.click())}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/80 transition-all hover:border-white/20 hover:text-white"
            >
              <Upload size={14} />
              Upload
            </button>
            <button
              type="button"
              onClick={() => void handleGenerateCreative()}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#00ff88]/25 bg-[#00ff88]/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#00ff88] transition-all hover:border-[#00ff88]/40"
            >
              <Sparkles size={14} />
              Generate
            </button>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/8 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.24em] text-[#00ff88]">
              <Layers size={14} />
              {activeGoal?.label ?? 'Creative'}
            </div>
            <button
              type="button"
              onClick={() => void handleSaveDocument()}
              disabled={creativeStudio.isSaving}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/80 transition-all hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              <Save size={14} />
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeMode === 'Cutout') {
                  void handleSaveCutoutOutput();
                  return;
                }
                void handleExport();
              }}
              disabled={activeMode === 'Cutout' ? isSavingManagedOutput : false}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#00ff88] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-[#00cc6e]"
            >
              <Download size={14} />
              {activeMode === 'Cutout' ? (isSavingManagedOutput ? 'Saving...' : 'Save Cutout') : 'Export'}
            </button>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={activeMode === 'Cutout'}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#00ff88]/25 bg-[#00ff88]/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#00ff88] transition-all hover:border-[#00ff88]/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUpRight size={14} />
              {activeMetadata.scheduledFor ? 'Schedule' : 'Publish'}
            </button>
            <button
              type="button"
              onClick={() => setShowAdvancedStudio((current) => !current)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                showAdvancedStudio
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
              }`}
            >
              <LayoutTemplate size={14} />
              {showAdvancedStudio ? 'Hide Advanced' : 'Advanced'}
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[250px_minmax(0,1.9fr)_286px] 2xl:grid-cols-[260px_minmax(0,2.2fr)_300px]">
        <aside data-studio-section className="min-h-0 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-3">
          {!showAdvancedStudio ? (
            <div className="h-full overflow-y-auto pr-1 custom-scrollbar">
              <div className="space-y-5">
                <div className="rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/8 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00ff88]">Quick Flow</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/68">
                    Choose the source, choose the treatment, add a short brief, then generate. The stage is a preview, not the main job.
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Creative Treatment</p>
                  <div className="mt-3 grid gap-2">
                    {goalOptions.map((goal) => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => applyQuickGoal(goal.id)}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                          activeGoal?.id === goal.id
                            ? 'border-[#00ff88]/35 bg-[#00ff88]/10'
                            : 'border-white/10 bg-black/25 hover:border-white/20'
                        }`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white">{goal.label}</p>
                        <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">{goal.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {activeMode === 'Product Design' ? (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Template</p>
                    <select
                      value={selectedTemplate?.id ?? ''}
                      onChange={(event) => {
                        const nextTemplate = templates.find((template) => template.id === event.target.value);
                        if (!nextTemplate) {
                          return;
                        }
                        onTemplateChange(nextTemplate);
                        setCurrentState((current) => ({
                          ...current,
                          canvasPreset: createCanvasPreset(
                            nextTemplate.destination === 'Public Site Hero'
                              ? 'Home Hero'
                              : nextTemplate.destination === 'Story / Reel Cover'
                                ? 'Portrait Story'
                                : nextTemplate.destination === 'Email Banner'
                                  ? 'Email Banner'
                                  : 'Square Post',
                          ),
                        }));
                      }}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-white outline-none transition-colors focus:border-[#00ff88]/30"
                    >
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
                      {activeMode === 'Room Restyle' ? 'Room Image' : 'Source Asset'}
                    </p>
                    <input
                      value={assetQuery}
                      onChange={(event) => setAssetQuery(event.target.value)}
                      placeholder="Search"
                      className="w-28 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white outline-none transition-colors focus:border-[#00ff88]/30"
                    />
                  </div>
                  <div className="mt-3 space-y-2">
                    {filteredAssets.slice(0, 8).map((asset) => {
                      const isSelected =
                        activeMode === 'Room Restyle'
                          ? selectedSceneAsset?.id === asset.id
                          : selectedSourceAsset?.id === asset.id;
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            if (activeMode === 'Room Restyle') {
                              updateMetadata({ selectedSceneAssetId: asset.id });
                              return;
                            }
                            updateMetadata({ selectedSourceAssetId: asset.id });
                            if (activeMode === 'Product Design') {
                              setCurrentState((current) => ({
                                ...current,
                                layers: buildDefaultLayers({
                                  mode: 'Product Design',
                                  product: selectedProduct,
                                  template: selectedTemplate,
                                  sourceAsset: asset,
                                }),
                              }));
                            }
                          }}
                          className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                            isSelected ? 'border-[#00ff88]/35 bg-[#00ff88]/10' : 'border-white/10 bg-black/25 hover:border-white/20'
                          }`}
                        >
                          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-black">
                            <img src={asset.img} alt={asset.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-white">{asset.name}</p>
                            <p className="mt-1 truncate text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">{asset.protectionLevel}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(activeMode === 'Product Design' || activeMode === 'Room Restyle') ? (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Linked Product</p>
                    <select
                      value={selectedProduct?.id ?? ''}
                      onChange={(event) => {
                        const product = products.find((item) => item.id === event.target.value);
                        if (!product) {
                          return;
                        }
                        onProductChange(product);
                      }}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-white outline-none transition-colors focus:border-[#00ff88]/30"
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Campaign</p>
                  <select
                    value={activeMetadata.selectedCampaignId ?? ''}
                    onChange={(event) => updateMetadata({ selectedCampaignId: event.target.value || null })}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-white outline-none transition-colors focus:border-[#00ff88]/30"
                  >
                    <option value="">No Campaign Linked</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleCreateCampaignFromStudio()}
                      disabled={isCreatingCampaignFromStudio}
                      className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white/75 transition-all hover:border-white/20 hover:text-white disabled:opacity-40"
                    >
                      <Plus size={12} />
                      {isCreatingCampaignFromStudio ? 'Creating...' : 'Create Campaign From Brief'}
                    </button>
                </div>

                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">AI Assist</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {([
                      ['deterministic', 'Deterministic'],
                      ['ai-enhanced', 'AI-Assisted'],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateMetadata({ processingMode: value })}
                        className={`rounded-xl border px-3 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                          (activeMetadata.processingMode ?? 'deterministic') === value
                            ? 'border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]'
                            : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Brief</p>
                  <textarea
                    value={activeMetadata.aiDirection ?? ''}
                    onChange={(event) => updateMetadata({ aiDirection: event.target.value })}
                    placeholder={
                      activeMode === 'Room Restyle'
                        ? 'Describe the room treatment, tone, and realism you want.'
                        : activeMode === 'Cutout'
                          ? 'Describe the cutout quality or cleanup you want.'
                          : 'Describe the ad angle, seasonal offer, audience, and tone.'
                    }
                    className="mt-3 h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white/75 outline-none transition-colors focus:border-[#00ff88]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Channel</p>
                    <select
                      value={activeMetadata.publishChannel ?? 'Instagram'}
                      onChange={(event) => updateMetadata({ publishChannel: event.target.value as CreativeDocumentMetadata['publishChannel'] })}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-white outline-none transition-colors focus:border-[#00ff88]/30"
                    >
                      {PUBLISH_CHANNEL_OPTIONS.map((channel) => (
                        <option key={channel} value={channel}>
                          {channel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Schedule</p>
                    <input
                      type="datetime-local"
                      value={activeMetadata.scheduledFor ?? ''}
                      onChange={(event) => updateMetadata({ scheduledFor: event.target.value || null })}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-[0.8rem] text-[11px] text-white outline-none transition-colors focus:border-[#00ff88]/30"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => void handleGenerateCreative()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00ff88] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-black transition-all hover:bg-[#00d876]"
                  >
                    <Sparkles size={14} />
                    Generate Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveDocument()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/80 transition-all hover:border-white/20 hover:text-white"
                  >
                    <Save size={14} />
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeMode === 'Cutout') {
                        void handleSaveCutoutOutput();
                        return;
                      }
                      void handlePublish();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#00ff88]/25 bg-[#00ff88]/10 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#00ff88] transition-all hover:border-[#00ff88]/40"
                  >
                    <ArrowUpRight size={14} />
                    {activeMode === 'Cutout' ? 'Save To Asset Lab' : activeMetadata.scheduledFor ? 'Schedule Campaign' : 'Publish Now'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
          <div className="flex flex-wrap gap-2">
            {RAIL_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] transition-all ${
                  activeTab === tab
                    ? 'border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]'
                    : 'border-white/10 bg-black/20 text-white/60 hover:border-white/20 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4 h-[calc(100%-3.25rem)] overflow-y-auto pr-1 custom-scrollbar">
            {activeTab === 'Assets' ? (
              <div className="space-y-4">
                <input
                  value={assetQuery}
                  onChange={(event) => setAssetQuery(event.target.value)}
                  placeholder="Search assets..."
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/30"
                />
                <div className="space-y-3">
                  {filteredAssets.slice(0, 18).map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      draggable={activeMode === 'Product Design'}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'copy';
                        event.dataTransfer.setData(STUDIO_ASSET_DRAG_TYPE, asset.id);
                        event.dataTransfer.setData('text/plain', asset.id);
                        setDragAssetId(asset.id);
                      }}
                      onDragEnd={() => {
                        setDragAssetId(null);
                        setIsStageDragOver(false);
                      }}
                      onClick={() => {
                        updateMetadata({ selectedSourceAssetId: asset.id });
                        if (activeMode === 'Room Restyle') {
                          updateMetadata({ selectedSceneAssetId: asset.id });
                          return;
                        }

                        if (activeMode === 'Product Design') {
                          addLayer(
                            createImageLayerFromAsset({
                              asset,
                              xPct: clamp(12 + activeState.layers.length * 2, 6, 62),
                              yPct: clamp(14 + activeState.layers.length * 2, 10, 58),
                              zIndex: activeState.layers.length + 1,
                              preset: activePreset,
                            }),
                          );
                        }
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-left transition-all hover:border-white/20"
                    >
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-black">
                        <img src={asset.img} alt={asset.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-bold uppercase tracking-widest text-white">{asset.name}</p>
                        <p className="mt-1 truncate text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">
                          {asset.protectionLevel} • {asset.status}
                        </p>
                      </div>
                      <GripVertical size={14} className="text-white/20" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === 'Products' ? (
              <div className="space-y-3">
                {products.slice(0, 18).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      onProductChange(product);
                      setCurrentState((current) => ({
                        ...current,
                        name:
                          current.workspaceMode === 'Room Restyle'
                            ? `${product.name} Room Restyle`
                            : current.workspaceMode === 'Cutout'
                              ? `${product.name} Cutout`
                              : `${product.name} Design`,
                      }));
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                      selectedProduct?.id === product.id
                        ? 'border-[#00ff88]/35 bg-[#00ff88]/10'
                        : 'border-white/10 bg-black/25 hover:border-white/20'
                    }`}
                  >
                    <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-black">
                      <img src={product.img} alt={product.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-bold uppercase tracking-widest text-white">{product.name}</p>
                      <p className="mt-1 truncate text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">
                        {product.category} • {formatMoney(product.price)}
                      </p>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    addLayer({
                      id: makeLayerId(),
                      name: 'Product Card',
                      type: 'product-card',
                      visible: true,
                      locked: false,
                      transform: { xPct: 54, yPct: 60, widthPct: 22, heightPct: 10, rotation: 0, zIndex: activeState.layers.length + 1, opacity: 1 },
                      style: { fill: '#22c55e', color: '#050505', borderRadius: 18 },
                      content: { label: formatMoney(selectedProduct?.price) || 'Quote' },
                    })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/80 transition-all hover:border-white/20 hover:text-white"
                >
                  Insert Product Card
                </button>
              </div>
            ) : null}

            {activeTab === 'Text' ? (
              <div className="space-y-3">
                {[
                  { label: 'Heading', style: { fontFamily: 'Playfair Display', fontSize: 52, color: '#ffffff', fontWeight: 700 } },
                  { label: 'Body Copy', style: { fontFamily: 'Inter', fontSize: 18, color: 'rgba(255,255,255,0.76)', fontWeight: 500 } },
                  { label: 'CTA', style: { fontFamily: 'JetBrains Mono', fontSize: 18, color: '#050505', fontWeight: 800, fill: '#22c55e' } },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      addLayer({
                        id: makeLayerId(),
                        name: preset.label,
                        type: preset.label === 'CTA' ? 'product-card' : 'text',
                        visible: true,
                        locked: false,
                        transform: { xPct: 18, yPct: 18 + activeState.layers.length * 2, widthPct: 36, heightPct: preset.label === 'Heading' ? 16 : 10, rotation: 0, zIndex: activeState.layers.length + 1, opacity: 1 },
                        style: preset.label === 'CTA'
                          ? { fill: '#22c55e', color: '#050505', borderRadius: 18 }
                          : preset.style,
                        content: preset.label === 'CTA' ? { label: 'View Range' } : { text: preset.label === 'Heading' ? (selectedProduct?.name ?? 'BTS Heading') : 'Editable studio copy.' },
                      })
                    }
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left transition-all hover:border-white/20"
                  >
                    <Type size={16} className="text-[#00ff88]" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white">{preset.label}</p>
                      <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">Insert Layer</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {activeTab === 'Layouts' ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Templates</p>
                  <div className="mt-3 space-y-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          onTemplateChange(template);
                          setCurrentState((current) => ({
                            ...current,
                            name: current.name || `${template.name} Design`,
                            canvasPreset: createCanvasPreset(
                              template.destination === 'Public Site Hero'
                                ? 'Home Hero'
                                : template.destination === 'Story / Reel Cover'
                                  ? 'Portrait Story'
                                  : template.destination === 'Email Banner'
                                    ? 'Email Banner'
                                    : 'Square Post',
                            ),
                            layers: current.workspaceMode === 'Product Design'
                              ? buildDefaultLayers({
                                  mode: 'Product Design',
                                  product: selectedProduct,
                                  template,
                                  sourceAsset: selectedSourceAsset,
                                })
                              : current.layers,
                          }));
                        }}
                        className={`w-full rounded-2xl border p-4 text-left transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-[#00ff88]/35 bg-[#00ff88]/10'
                            : 'border-white/10 bg-black/25 hover:border-white/20'
                        }`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white">{template.name}</p>
                        <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">{template.destination}</p>
                        <p className="mt-3 text-xs leading-relaxed text-white/45">{template.blueprint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Recent Documents</p>
                  <div className="mt-3 space-y-3">
                    {creativeStudio.documents.slice(0, 8).map((document) => (
                      <button
                        key={document.id}
                        type="button"
                        onClick={() => creativeStudio.setActiveDocument(document as CreativeDocumentDetail)}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                          creativeStudio.activeDocument?.id === document.id
                            ? 'border-[#00ff88]/35 bg-[#00ff88]/10'
                            : 'border-white/10 bg-black/25 hover:border-white/20'
                        }`}
                      >
                        <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-black">
                          {document.previewImageUrl ? (
                            <img src={document.previewImageUrl} alt={document.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-white/25">
                              <LayoutTemplate size={18} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-bold uppercase tracking-widest text-white">{document.name}</p>
                          <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">{document.workspaceMode} • {document.status}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'Brand' ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    addLayer({
                      id: makeLayerId(),
                      name: 'Brand Block',
                      type: 'brand-block',
                      visible: true,
                      locked: false,
                      transform: { xPct: 8, yPct: 8, widthPct: 86, heightPct: 12, rotation: 0, zIndex: activeState.layers.length + 1, opacity: 1 },
                      style: { fill: 'rgba(5,5,5,0.42)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22 },
                      content: { eyebrow: 'Brick Tile Shop', templateName: selectedTemplate?.name ?? 'Creative Studio' },
                    })
                  }
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left transition-all hover:border-white/20"
                >
                  <Palette size={16} className="text-[#00ff88]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white">Insert Brand Block</p>
                    <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">BTS chrome</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    addLayer({
                      id: makeLayerId(),
                      name: 'Overlay Shape',
                      type: 'shape',
                      visible: true,
                      locked: false,
                      transform: { xPct: 50, yPct: 10, widthPct: 40, heightPct: 78, rotation: 0, zIndex: activeState.layers.length + 1, opacity: 0.88 },
                      style: { fill: 'rgba(5,5,5,0.48)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 32, borderWidth: 1 },
                      content: {},
                    })
                  }
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left transition-all hover:border-white/20"
                >
                  <Maximize2 size={16} className="text-[#00ff88]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white">Add Overlay Panel</p>
                    <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">safe layout depth</p>
                  </div>
                </button>
              </div>
            ) : null}

            {activeTab === 'AI Tools' ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/8 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00ff88]">Assist Mode</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {([
                      ['deterministic', 'Deterministic'],
                      ['ai-enhanced', 'AI-Assisted'],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateMetadata({ processingMode: value })}
                        className={`rounded-xl border px-3 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                          (activeMetadata.processingMode ?? 'deterministic') === value
                            ? 'border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]'
                            : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {(activeMetadata.processingMode ?? 'deterministic') === 'ai-enhanced' ? (
                    <>
                      <p className="mt-4 text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">AI Direction</p>
                      <textarea
                        value={activeMetadata.aiDirection ?? ''}
                        onChange={(event) => updateMetadata({ aiDirection: event.target.value })}
                        placeholder="Describe the look, mood, campaign angle, room treatment, or composition you want the AI to bias toward."
                        className="mt-3 h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white/75 outline-none transition-colors focus:border-[#00ff88]/30"
                      />
                    </>
                  ) : (
                    <p className="mt-4 text-xs leading-relaxed text-white/45">
                      Keep the design deterministic and use product truth, approved assets, and manual layout controls.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleBackgroundAssist()}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left transition-all hover:border-white/20"
                >
                  <Crop size={16} className="text-[#00ff88]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white">Background Remove</p>
                    <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">cutout assist</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void handleAutoLayout()}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left transition-all hover:border-white/20"
                >
                  <LayoutTemplate size={16} className="text-[#00ff88]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white">Auto Layout</p>
                    <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">template assist</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void handleAutoCaption()}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left transition-all hover:border-white/20"
                >
                  <Wand2 size={16} className="text-[#00ff88]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white">Auto Caption</p>
                    <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">catalog-aware copy</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSegmentRoom()}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left transition-all hover:border-white/20"
                >
                  <SquareDashedMousePointer size={16} className="text-[#00ff88]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white">Segment Room</p>
                    <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">mask suggestion</p>
                  </div>
                </button>
              </div>
            ) : null}

            {activeTab === 'Layers' ? (
              <div className="space-y-3">
                {activeState.layers
                  .slice()
                  .sort((a, b) => b.transform.zIndex - a.transform.zIndex)
                  .map((layer, index, all) => (
                    <div
                      key={layer.id}
                      className={`rounded-2xl border p-3 transition-all ${
                        selectedLayerId === layer.id
                          ? 'border-[#00ff88]/35 bg-[#00ff88]/10'
                          : 'border-white/10 bg-black/25'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedLayerId(layer.id)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white">{layer.name}</p>
                          <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">{layer.type}</p>
                        </div>
                        <GripVertical size={14} className="text-white/25" />
                      </button>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateSelectedLayer((current) => current.id === layer.id ? { ...current, visible: !current.visible } : current)}
                          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70"
                        >
                          {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedLayer((current) => current.id === layer.id ? { ...current, locked: !current.locked } : current)}
                          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70"
                        >
                          {layer.locked ? <Lock size={14} /> : <LockOpen size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (index < all.length - 1) {
                              const other = all[index + 1];
                              setCurrentState((current) => ({
                                ...current,
                                layers: current.layers.map((item) => {
                                  if (item.id === layer.id) {
                                    return { ...item, transform: { ...item.transform, zIndex: other.transform.zIndex } };
                                  }
                                  if (item.id === other.id) {
                                    return { ...item, transform: { ...item.transform, zIndex: layer.transform.zIndex } };
                                  }
                                  return item;
                                }),
                              }));
                            }
                          }}
                          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70"
                        >
                          <ArrowUpRight size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            addLayer({
                              ...clone(layer),
                              id: makeLayerId(),
                              name: `${layer.name} Copy`,
                              transform: {
                                ...layer.transform,
                                xPct: clamp(layer.transform.xPct + 2, 0, 92),
                                yPct: clamp(layer.transform.yPct + 2, 0, 92),
                                zIndex: activeState.layers.length + 1,
                              },
                            })
                          }
                          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : null}
          </div>
            </>
          )}
        </aside>

        <main data-studio-section className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#050505] p-3.5 xl:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.26em] text-[#00ff88]">Creative Preview</p>
              <h2 className="mt-1.5 line-clamp-1 text-xl font-serif font-bold uppercase tracking-tight text-white xl:text-2xl">{activeState.name}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.22em] text-white/45">
                {activePreset.label}
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.22em] text-white/45">
                {activePreset.width}x{activePreset.height}
              </div>
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.2em] text-white/45">
                <button
                  type="button"
                  onClick={() => setZoomPercent((current) => Math.max(60, current - 10))}
                  className="rounded-full p-1 text-white/70 transition-colors hover:text-white"
                  aria-label="Zoom out"
                >
                  <Minus size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomPercent(100)}
                  className="rounded-full px-2 py-1 text-white/60 transition-colors hover:text-white"
                >
                  Fit {Math.round(appliedScale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomPercent((current) => Math.min(160, current + 10))}
                  className="rounded-full p-1 text-white/70 transition-colors hover:text-white"
                  aria-label="Zoom in"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>

          <div ref={stageViewportRef} className="mt-3 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[24px] border border-white/5 bg-black/25 p-2 xl:p-3">
            <div
              className="relative shrink-0"
              style={{
                width: `${stageFrameWidth}px`,
                height: `${stageFrameHeight}px`,
              }}
            >
            <div
              ref={stageRef}
              className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a0a] shadow-[0_24px_80px_rgba(0,0,0,0.45)] ${getStageClass(activePreset)}`}
              style={{
                width: `${activePreset.width}px`,
                height: `${activePreset.height}px`,
                transform: `scale(${appliedScale})`,
                transformOrigin: 'top left',
              }}
              onDragOver={(event) => {
                if (activeMode === 'Product Design') {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'copy';
                  setIsStageDragOver(true);
                }
              }}
              onDragEnter={(event) => {
                if (activeMode === 'Product Design') {
                  event.preventDefault();
                  setIsStageDragOver(true);
                }
              }}
              onDragLeave={(event) => {
                if (event.currentTarget === event.target) {
                  setIsStageDragOver(false);
                }
              }}
              onDrop={handleStageDrop}
              onClick={(event) => {
                setIsStageDragOver(false);
                setDragAssetId(null);
                if (activeMode === 'Room Restyle' && pinPlacementArmed && stageRef.current) {
                  const rect = stageRef.current.getBoundingClientRect();
                  const focusPoint = {
                    x: clamp((event.clientX - rect.left) / rect.width, 0.05, 0.95),
                    y: clamp((event.clientY - rect.top) / rect.height, 0.05, 0.95),
                  };
                  updateMetadata({ focusPoint });
                  setPinPlacementArmed(false);
                  toast.success('Focus pin placed.');
                } else if (showAdvancedStudio && activeMode === 'Product Design' && event.target === stageRef.current) {
                  setSelectedLayerId(null);
                }
              }}
            >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_40%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
            {activeMode === 'Product Design' && isStageDragOver ? (
              <div className="pointer-events-none absolute inset-4 z-20 rounded-[24px] border border-dashed border-[#00ff88]/45 bg-[#00ff88]/[0.05] shadow-[0_0_0_1px_rgba(0,255,136,0.25)]">
                <div className="absolute left-5 top-5 rounded-full border border-[#00ff88]/25 bg-black/65 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.26em] text-[#00ff88]">
                  Drop {draggedAsset?.name ?? 'asset'} onto canvas
                </div>
              </div>
            ) : null}

            <div
              className="pointer-events-none absolute border border-dashed border-white/10"
              style={{
                left: `${safeZone.left}%`,
                top: `${safeZone.top}%`,
                right: `${100 - safeZone.right}%`,
                bottom: `${100 - safeZone.bottom}%`,
              }}
            />

            {typeof guides?.vertical === 'number' ? (
              <div className="pointer-events-none absolute top-0 bottom-0 w-px bg-[#00ff88]/35" style={{ left: `${guides.vertical}%` }} />
            ) : null}
            {typeof guides?.horizontal === 'number' ? (
              <div className="pointer-events-none absolute left-0 right-0 h-px bg-[#00ff88]/35" style={{ top: `${guides.horizontal}%` }} />
            ) : null}

            {activeMode === 'Product Design' ? (
              <div className="absolute inset-0">
                {activeState.layers
                  .slice()
                  .filter((layer) => layer.visible)
                  .sort((a, b) => a.transform.zIndex - b.transform.zIndex)
                  .map((layer) => (
                    <Rnd
                      key={layer.id}
                      scale={appliedScale}
                      size={{
                        width: Math.max((layer.transform.widthPct / 100) * stageSize.width, 80),
                        height: Math.max((layer.transform.heightPct / 100) * stageSize.height, 80),
                      }}
                      position={{
                        x: (layer.transform.xPct / 100) * stageSize.width,
                        y: (layer.transform.yPct / 100) * stageSize.height,
                      }}
                      bounds="parent"
                      dragGrid={[4, 4]}
                      resizeGrid={[4, 4]}
                      disableDragging={!showAdvancedStudio || layer.locked}
                      enableResizing={showAdvancedStudio && !layer.locked ? { top: false, right: false, bottom: false, left: false, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true } : false}
                      onDragStart={(event) => {
                        if (!showAdvancedStudio) {
                          return;
                        }
                        event.stopPropagation();
                        setSelectedLayerId(layer.id);
                      }}
                      onDragStop={(_, data) => {
                        commitLayerTransformFromPixels(layer.id, {
                          x: data.x,
                          y: data.y,
                          width: Math.max((layer.transform.widthPct / 100) * stageSize.width, 80),
                          height: Math.max((layer.transform.heightPct / 100) * stageSize.height, 80),
                        });
                      }}
                      onResizeStart={(event) => {
                        if (!showAdvancedStudio) {
                          return;
                        }
                        event.stopPropagation();
                        setSelectedLayerId(layer.id);
                      }}
                      onResizeStop={(_, __, ref, ___, position) => {
                        commitLayerTransformFromPixels(layer.id, {
                          x: position.x,
                          y: position.y,
                          width: ref.offsetWidth,
                          height: ref.offsetHeight,
                        });
                      }}
                      style={{ zIndex: layer.transform.zIndex }}
                      resizeHandleStyles={{
                        topLeft: { width: 12, height: 12, borderRadius: 9999, background: '#00ff88', border: '1px solid #050505', left: -6, top: -6 },
                        topRight: { width: 12, height: 12, borderRadius: 9999, background: '#00ff88', border: '1px solid #050505', right: -6, top: -6 },
                        bottomLeft: { width: 12, height: 12, borderRadius: 9999, background: '#00ff88', border: '1px solid #050505', left: -6, bottom: -6 },
                        bottomRight: { width: 12, height: 12, borderRadius: 9999, background: '#00ff88', border: '1px solid #050505', right: -6, bottom: -6 },
                      }}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onMouseDown={() => {
                          if (showAdvancedStudio) {
                            setSelectedLayerId(layer.id);
                          }
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (showAdvancedStudio) {
                            setSelectedLayerId(layer.id);
                          }
                        }}
                        className={`relative h-full w-full overflow-hidden rounded-[18px] transition-shadow ${
                          showAdvancedStudio && !layer.locked ? 'cursor-move ' : ''
                        }${
                          showAdvancedStudio && selectedLayerId === layer.id ? 'ring-2 ring-[#00ff88]/55 shadow-[0_0_0_1px_rgba(0,255,136,0.3)]' : ''
                        }`}
                        style={{
                          transform: `rotate(${layer.transform.rotation}deg)`,
                          transformOrigin: 'center',
                        }}
                      >
                        {layer.type === 'image' || layer.type === 'logo' ? (
                          <div className="relative h-full w-full overflow-hidden rounded-[18px]" style={{ borderRadius: Number(layer.style?.borderRadius ?? 18) }}>
                            <img
                              src={
                                (typeof layer.content?.imageUrl === 'string' ? layer.content.imageUrl : null) ??
                                (layer.sourceAssetId ? stageAssetImageUrls[layer.sourceAssetId] : '')
                              }
                              alt={layer.name}
                              className="h-full w-full object-cover"
                              style={{
                                transform: `translate(${-Number(layer.crop?.xPct ?? 0)}%, ${-Number(layer.crop?.yPct ?? 0)}%) scale(${Number(layer.crop?.scale ?? 1)})`,
                                transformOrigin: 'center',
                              }}
                              draggable={false}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : null}

                        {layer.type === 'text' ? (
                          <div
                            className="h-full w-full whitespace-pre-wrap"
                            style={{
                              fontFamily: String(layer.style?.fontFamily ?? 'Inter'),
                              fontSize: `${Number(layer.style?.fontSize ?? 28)}px`,
                              color: String(layer.style?.color ?? '#ffffff'),
                              fontWeight: Number(layer.style?.fontWeight ?? 700),
                              textAlign: (layer.style?.align as 'left' | 'center' | 'right' | undefined) ?? 'left',
                              padding: '8px 10px',
                              lineHeight: 1.18,
                            }}
                          >
                            {String(layer.content?.text ?? '')}
                          </div>
                        ) : null}

                        {layer.type === 'shape' || layer.type === 'brand-block' || layer.type === 'product-card' ? (
                          <div
                            className="h-full w-full"
                            style={{
                              background: String(layer.style?.fill ?? 'rgba(255,255,255,0.08)'),
                              borderRadius: `${Number(layer.style?.borderRadius ?? 18)}px`,
                              border: layer.style?.borderColor ? `1px solid ${String(layer.style.borderColor)}` : '1px solid rgba(255,255,255,0.08)',
                              padding: '12px 14px',
                            }}
                          >
                            {layer.type === 'brand-block' ? (
                              <>
                                <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-[#00ff88]">{String(layer.content?.eyebrow ?? 'Brick Tile Shop')}</div>
                                <div className="mt-2 text-xl font-serif font-bold uppercase tracking-tight text-white">{String(layer.content?.templateName ?? 'Creative Studio')}</div>
                              </>
                            ) : null}
                            {layer.type === 'product-card' ? (
                              <div className="flex h-full items-center justify-center text-center text-sm font-black uppercase tracking-[0.18em]" style={{ color: String(layer.style?.color ?? '#050505') }}>
                                {String(layer.content?.label ?? '')}
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {showAdvancedStudio && selectedLayerId === layer.id && !layer.locked ? (
                          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/55 backdrop-blur-sm">
                            <span>{Math.round(layer.transform.widthPct)}w</span>
                            <span>Drag To Position</span>
                            <span>{Math.round(layer.transform.heightPct)}h</span>
                          </div>
                        ) : null}
                        {showAdvancedStudio && selectedLayerId === layer.id ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeSelectedLayer();
                            }}
                            className="absolute right-3 top-12 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-red-400/30 bg-black/75 text-red-300 shadow-xl transition-all hover:border-red-300/45 hover:text-red-200"
                            aria-label={`Delete ${layer.name}`}
                          >
                            <X size={14} />
                          </button>
                        ) : null}
                      </div>
                    </Rnd>
                  ))}
              </div>
            ) : null}

            {activeMode !== 'Product Design' ? (
              <AnimatePresence mode="wait">
                {previewUrl || (activeMode === 'Room Restyle' ? selectedSceneAsset?.img : selectedSourceAsset?.img) ? (
                  <motion.div
                    key={previewUrl ?? selectedSceneAsset?.img ?? selectedSourceAsset?.img ?? 'preview'}
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.01 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    className="absolute inset-0"
                  >
                    <img
                      src={previewUrl ?? (activeMode === 'Room Restyle' ? selectedSceneAsset?.img : selectedSourceAsset?.img) ?? ''}
                      alt="Creative preview"
                      className="h-full w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-stage"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center p-10 text-center"
                  >
                    <div className="max-w-md">
                      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-white/30">
                        <ImageIcon size={28} />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest text-white">Add An Image To Begin</p>
                      <p className="mt-3 text-sm leading-relaxed text-white/45">Choose a room photo or source image from the left rail, or upload one into Asset Lab.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : null}

            {activeMode === 'Room Restyle' && selectedMask?.maskImageUrl ? (
              <div className="pointer-events-none absolute inset-0 bg-[#00ff88]/[0.05]" />
            ) : null}

            {activeMode === 'Room Restyle' ? (
              <canvas
                ref={maskCanvasRef}
                className={`absolute inset-0 h-full w-full ${maskEditMode ? 'cursor-crosshair' : 'pointer-events-none opacity-55'}`}
                style={{ mixBlendMode: 'screen' }}
                onMouseDown={startBrushStroke}
                onMouseMove={moveBrushStroke}
                onMouseUp={endBrushStroke}
                onMouseLeave={endBrushStroke}
              />
            ) : null}

            {activeMode === 'Room Restyle' && activeMetadata.focusPoint ? (
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  left: `${activeMetadata.focusPoint.x * 100}%`,
                  top: `${activeMetadata.focusPoint.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#00ff88]/50 bg-black/70 shadow-[0_0_0_8px_rgba(0,255,136,0.08)]">
                  <div className="h-3 w-3 rounded-full bg-[#00ff88]" />
                  <div className="absolute h-px w-8 bg-[#00ff88]/65" />
                  <div className="absolute h-8 w-px bg-[#00ff88]/65" />
                </div>
              </div>
            ) : null}

            {pinPlacementArmed ? (
              <div className="pointer-events-none absolute inset-x-5 top-5 rounded-2xl border border-[#00ff88]/25 bg-black/60 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.26em] text-[#00ff88]">
                Click the wall area you want restyled.
              </div>
            ) : null}

            {previewError ? (
              <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {previewError}
              </div>
            ) : null}
            </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2.5">
            {!showAdvancedStudio ? (
              <>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
                  {activeGoal?.label ?? activeMode}
                </div>
                {selectedCampaign ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
                    {selectedCampaign.name}
                  </div>
                ) : null}
                <div className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/8 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.22em] text-[#00ff88]">
                  Preview updates from the brief and selected asset
                </div>
              </>
            ) : activeMode === 'Room Restyle' ? (
              <>
                <button
                  type="button"
                  onClick={() => setPinPlacementArmed(true)}
                  className={`rounded-xl border px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    pinPlacementArmed
                      ? 'border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]'
                      : 'border-white/10 bg-white/5 text-white/75 hover:border-white/20 hover:text-white'
                  }`}
                >
                  Place Pin
                </button>
                <button
                  type="button"
                  onClick={() => setMaskEditMode('paint')}
                  className={`rounded-xl border px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    maskEditMode === 'paint'
                      ? 'border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]'
                      : 'border-white/10 bg-white/5 text-white/75 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Brush size={14} className="inline mr-2" />
                  Paint
                </button>
                <button
                  type="button"
                  onClick={() => setMaskEditMode('erase')}
                  className={`rounded-xl border px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    maskEditMode === 'erase'
                      ? 'border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]'
                      : 'border-white/10 bg-white/5 text-white/75 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Eraser size={14} className="inline mr-2" />
                  Erase
                </button>
                <button
                  type="button"
                  onClick={() => setMaskEditMode(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/75 transition-all hover:border-white/20 hover:text-white"
                >
                  Stop Brush
                </button>
              </>
            ) : activeMode === 'Cutout' ? (
              <button
                type="button"
                onClick={() => void handleBackgroundAssist()}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/75 transition-all hover:border-white/20 hover:text-white"
              >
                Refresh Cutout Assist
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void handleAutoLayout()}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/75 transition-all hover:border-white/20 hover:text-white"
                >
                  Refresh Layout Assist
                </button>
                {selectedLayer ? (
                  <button
                    type="button"
                    onClick={removeSelectedLayer}
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-300 transition-all hover:border-red-400/30"
                  >
                    Delete Selected Layer
                  </button>
                ) : null}
              </>
            )}
          </div>
        </main>

        <aside data-studio-section className="min-h-0 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-3.5 xl:overflow-hidden">
          <div className="h-full overflow-y-auto pr-1 custom-scrollbar">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.26em] text-white/35">Inspector</p>
              <h3 className="mt-2 text-xl font-serif font-bold uppercase tracking-tight text-white">
                {selectedLayer ? selectedLayer.name : activeMode}
              </h3>
            </div>

            {!showAdvancedStudio ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/8 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00ff88]">Current Run</p>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-white">
                    {activeGoal?.label ?? activeMode}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    {activeMode === 'Cutout'
                      ? 'This treatment removes the background and saves a reusable managed asset back into Asset Lab.'
                      : activeMode === 'Room Restyle'
                        ? 'This treatment uses the selected product and room image to generate a guided room visual.'
                        : 'This treatment assembles the ad or social creative from your selected asset, product, and brief.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Linked Context</p>
                  <div className="mt-3 space-y-3 text-sm text-white/72">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/42">Asset</span>
                      <span className="max-w-[11rem] truncate text-right">{(activeMode === 'Room Restyle' ? selectedSceneAsset?.name : selectedSourceAsset?.name) ?? 'Not selected'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/42">Product</span>
                      <span className="max-w-[11rem] truncate text-right">{selectedProduct?.name ?? 'Optional'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/42">Campaign</span>
                      <span className="max-w-[11rem] truncate text-right">{selectedCampaign?.name ?? 'Not linked'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/42">Output</span>
                      <span className="max-w-[11rem] truncate text-right">{activePreset.label}</span>
                    </div>
                  </div>
                </div>

                {activeMode === 'Product Design' ? (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Auto Copy</p>
                    <textarea
                      value={activeMetadata.generatorCopy ?? ''}
                      onChange={(event) => updateMetadata({ generatorCopy: event.target.value })}
                      placeholder="The studio can generate this, but you can nudge the final copy here."
                      className="mt-3 h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white/75 outline-none transition-colors focus:border-[#00ff88]/30"
                    />
                  </div>
                ) : null}

                {activeMode === 'Cutout' ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Edge Softness</p>
                        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">{(activeMetadata.edgeSoftness ?? 0.18).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.4"
                        step="0.01"
                        value={activeMetadata.edgeSoftness ?? 0.18}
                        onChange={(event) => updateMetadata({ edgeSoftness: Number(event.target.value) })}
                        className="mt-3 w-full accent-[#00ff88]"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Isolation</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {(['balanced', 'corner-key'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => updateMetadata({ isolationMode: mode })}
                            className={`rounded-xl border px-3 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                              (activeMetadata.isolationMode ?? 'balanced') === mode
                                ? 'border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]'
                                : 'border-white/10 bg-white/5 text-white/70'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}

                {activeMode === 'Room Restyle' ? (
                  <>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Application Area</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {([
                          ['full-wall', 'Full Wall'],
                          ['feature-wall', 'Feature Wall'],
                          ['backsplash', 'Backsplash'],
                          ['facade-panel', 'Facade'],
                        ] as Array<[CreativeApplicationMode, string]>).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => updateMetadata({ applicationMode: value })}
                            className={`rounded-xl border px-3 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                              (activeMetadata.applicationMode ?? 'full-wall') === value
                                ? 'border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]'
                                : 'border-white/10 bg-white/5 text-white/70'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => setPinPlacementArmed(true)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/75 transition-all hover:border-white/20 hover:text-white"
                      >
                        Place Focus Pin
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSegmentRoom()}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/75 transition-all hover:border-white/20 hover:text-white"
                      >
                        Refresh Wall Mask
                      </button>
                    </div>
                  </>
                ) : null}

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Output State</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/62">
                    {savedOutputAsset
                      ? `${savedOutputAsset.name} is stored in Asset Lab and ready to be reused across campaigns, product media, or future exports.`
                      : workingDocument
                        ? `Document saved as ${workingDocument.status}. Publish will create the campaign-linked calendar and queue records.`
                        : 'This is still a working draft. Generate first, then save or publish when the preview looks right.'}
                  </p>
                </div>
              </div>
            ) : !selectedLayer ? (
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Document Name</p>
                  <input
                    value={activeState.name}
                    onChange={(event) => setCurrentState((current) => ({ ...current, name: event.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/30"
                  />
                </div>

                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Canvas Preset</p>
                  <select
                    value={activePreset.label}
                    onChange={(event) => {
                      const preset = createCanvasPreset(event.target.value as CreativeExportPreset);
                      setCurrentState((current) => ({ ...current, canvasPreset: preset }));
                    }}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-white outline-none transition-colors focus:border-[#00ff88]/30"
                  >
                    {CANVAS_PRESETS.map((preset) => (
                      <option key={preset.label} value={preset.label}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Watermark</p>
                  <select
                    value={activeMetadata.watermarkProfile ?? 'Standard BTS'}
                    onChange={(event) => updateMetadata({ watermarkProfile: event.target.value })}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-white outline-none transition-colors focus:border-[#00ff88]/30"
                  >
                    <option value="None">None</option>
                    <option value="Standard BTS">Standard BTS</option>
                    <option value="Confidential">Confidential</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Processing Mode</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {([
                      ['deterministic', 'Deterministic'],
                      ['ai-enhanced', 'AI-Assisted'],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateMetadata({ processingMode: value })}
                        className={`rounded-xl border px-3 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                          (activeMetadata.processingMode ?? 'deterministic') === value
                            ? 'border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]'
                            : 'border-white/10 bg-white/5 text-white/70'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {(activeMetadata.processingMode ?? 'deterministic') === 'ai-enhanced' ? (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">AI Direction</p>
                    <textarea
                      value={activeMetadata.aiDirection ?? ''}
                      onChange={(event) => updateMetadata({ aiDirection: event.target.value })}
                      placeholder="Guide the AI with your desired style, campaign tone, room treatment, or composition."
                      className="mt-3 h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white/75 outline-none transition-colors focus:border-[#00ff88]/30"
                    />
                  </div>
                ) : null}

                {activeMode === 'Product Design' ? (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Studio Copy</p>
                    <textarea
                      value={activeMetadata.generatorCopy ?? ''}
                      onChange={(event) => updateMetadata({ generatorCopy: event.target.value })}
                      className="mt-3 h-32 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white/75 outline-none transition-colors focus:border-[#00ff88]/30"
                    />
                  </div>
                ) : null}

                {activeMode === 'Cutout' ? (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Cutout Source</p>
                      <p className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-white">
                        {selectedSourceAsset?.name ?? 'No source selected'}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-white/45">
                        Direct uploads remain protected originals. Saving this cutout creates a managed variant in Asset Lab and keeps the lineage attached to the source asset.
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Edge Softness</p>
                        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">{(activeMetadata.edgeSoftness ?? 0.18).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.4"
                        step="0.01"
                        value={activeMetadata.edgeSoftness ?? 0.18}
                        onChange={(event) => updateMetadata({ edgeSoftness: Number(event.target.value) })}
                        className="mt-3 w-full accent-[#00ff88]"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Isolation</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {(['balanced', 'corner-key'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => updateMetadata({ isolationMode: mode })}
                            className={`rounded-xl border px-3 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                              (activeMetadata.isolationMode ?? 'balanced') === mode
                                ? 'border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]'
                                : 'border-white/10 bg-white/5 text-white/70'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/8 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00ff88]">Output State</p>
                        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
                          {savedOutputAsset ? savedOutputAsset.status : workingDocument ? workingDocument.status : 'Draft'}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-white/68">
                        {savedOutputAsset
                          ? `${savedOutputAsset.name} is stored in Asset Lab as a managed variant and can be reused across campaigns, products, and future studio documents.`
                          : 'Save Cutout writes a managed derivative into Asset Lab. It does not create a publishable asset in this mode.'}
                      </p>
                    </div>
                  </>
                ) : null}

                {activeMode === 'Room Restyle' ? (
                  <>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Material Source</p>
                      <select
                        value={activeMetadata.selectedTextureAssetId ?? ''}
                        onChange={(event) => updateMetadata({ selectedTextureAssetId: event.target.value || null })}
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-white outline-none transition-colors focus:border-[#00ff88]/30"
                      >
                        <option value="">Use Product Primary Image</option>
                        {imageAssets
                          .filter((asset) => asset.productId === selectedProduct?.id || asset.linkedProductIds?.includes(selectedProduct?.id ?? ''))
                          .map((asset) => (
                            <option key={asset.id} value={asset.id}>
                              {asset.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        ['full-wall', 'Full Wall'],
                        ['feature-wall', 'Feature Wall'],
                        ['backsplash', 'Backsplash'],
                        ['facade-panel', 'Facade Panel'],
                      ] as Array<[CreativeApplicationMode, string]>).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateMetadata({ applicationMode: value })}
                          className={`rounded-xl border px-3 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                            (activeMetadata.applicationMode ?? 'full-wall') === value
                              ? 'border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]'
                              : 'border-white/10 bg-white/5 text-white/70'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {[
                      ['blend', activeMetadata.blend ?? 0.72, 0.2, 0.95, 0.01],
                      ['scale', activeMetadata.scale ?? 1, 0.7, 1.6, 0.01],
                      ['intensity', activeMetadata.intensity ?? 1, 0.6, 1.6, 0.01],
                      ['contrast', activeMetadata.contrast ?? 1, 0.7, 1.5, 0.01],
                    ].map(([label, value, min, max, step]) => (
                      <div key={String(label)}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">{String(label)}</p>
                          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">{Number(value).toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={Number(min)}
                          max={Number(max)}
                          step={Number(step)}
                          value={Number(value)}
                          onChange={(event) => updateMetadata({ [label]: Number(event.target.value) } as Partial<CreativeDocumentMetadata>)}
                          className="mt-3 w-full accent-[#00ff88]"
                        />
                      </div>
                    ))}
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Mask Brush</p>
                        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">{maskBrushSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="96"
                        step="2"
                        value={maskBrushSize}
                        onChange={(event) => setMaskBrushSize(Number(event.target.value))}
                        className="mt-3 w-full accent-[#00ff88]"
                      />
                    </div>
                  </>
                ) : null}

                <div className="rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/8 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00ff88]">Studio State</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/62">
                    {workingDocument
                      ? `Document saved as ${workingDocument.status}.`
                      : 'This is a working draft. Save once to turn it into a reusable studio document.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Layer Name</p>
                  <input
                    value={selectedLayer.name}
                    onChange={(event) => updateSelectedLayer((layer) => ({ ...layer, name: event.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['xPct', selectedLayer.transform.xPct],
                    ['yPct', selectedLayer.transform.yPct],
                    ['widthPct', selectedLayer.transform.widthPct],
                    ['heightPct', selectedLayer.transform.heightPct],
                  ].map(([key, value]) => (
                    <div key={String(key)}>
                      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">{String(key)}</p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={Number(value)}
                        onChange={(event) =>
                          updateSelectedLayer((layer) => ({
                            ...layer,
                            transform: {
                              ...layer.transform,
                              [key]: Number(event.target.value),
                            },
                          }))
                        }
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/30"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Rotation</p>
                    <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">{selectedLayer.transform.rotation.toFixed(0)}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={selectedLayer.transform.rotation}
                    onChange={(event) =>
                      updateSelectedLayer((layer) => ({
                        ...layer,
                        transform: { ...layer.transform, rotation: Number(event.target.value) },
                      }))
                    }
                    className="mt-3 w-full accent-[#00ff88]"
                  />
                </div>

                {selectedLayer.type === 'image' || selectedLayer.type === 'logo' ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Crop X</p>
                        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">{Number(selectedLayer.crop?.xPct ?? 0).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={Number(selectedLayer.crop?.xPct ?? 0)}
                        onChange={(event) =>
                          updateSelectedLayer((layer) => ({
                            ...layer,
                            crop: { xPct: Number(event.target.value), yPct: Number(layer.crop?.yPct ?? 0), scale: Number(layer.crop?.scale ?? 1) },
                          }))
                        }
                        className="mt-3 w-full accent-[#00ff88]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Crop Y</p>
                        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">{Number(selectedLayer.crop?.yPct ?? 0).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={Number(selectedLayer.crop?.yPct ?? 0)}
                        onChange={(event) =>
                          updateSelectedLayer((layer) => ({
                            ...layer,
                            crop: { xPct: Number(layer.crop?.xPct ?? 0), yPct: Number(event.target.value), scale: Number(layer.crop?.scale ?? 1) },
                          }))
                        }
                        className="mt-3 w-full accent-[#00ff88]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Crop Scale</p>
                        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">{Number(selectedLayer.crop?.scale ?? 1).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="2.4"
                        step="0.01"
                        value={Number(selectedLayer.crop?.scale ?? 1)}
                        onChange={(event) =>
                          updateSelectedLayer((layer) => ({
                            ...layer,
                            crop: { xPct: Number(layer.crop?.xPct ?? 0), yPct: Number(layer.crop?.yPct ?? 0), scale: Number(event.target.value) },
                          }))
                        }
                        className="mt-3 w-full accent-[#00ff88]"
                      />
                    </div>
                  </>
                ) : null}

                {selectedLayer.type === 'text' ? (
                  <>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Text</p>
                      <textarea
                        value={String(selectedLayer.content?.text ?? '')}
                        onChange={(event) => updateSelectedLayer((layer) => ({ ...layer, content: { ...layer.content, text: event.target.value } }))}
                        className="mt-3 h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white/75 outline-none transition-colors focus:border-[#00ff88]/30"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Font Size</p>
                        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">{Number(selectedLayer.style?.fontSize ?? 28)}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="96"
                        step="1"
                        value={Number(selectedLayer.style?.fontSize ?? 28)}
                        onChange={(event) => updateSelectedLayer((layer) => ({ ...layer, style: { ...layer.style, fontSize: Number(event.target.value) } }))}
                        className="mt-3 w-full accent-[#00ff88]"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Text Color</p>
                      <input
                        type="color"
                        value={String(selectedLayer.style?.color ?? '#ffffff')}
                        onChange={(event) => updateSelectedLayer((layer) => ({ ...layer, style: { ...layer.style, color: event.target.value } }))}
                        className="mt-3 h-12 w-full rounded-xl border border-white/10 bg-black/30"
                      />
                    </div>
                  </>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateSelectedLayer((layer) => ({ ...layer, visible: !layer.visible }))}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/75 transition-all hover:border-white/20 hover:text-white"
                  >
                    {selectedLayer.visible ? 'Hide Layer' : 'Show Layer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedLayer((layer) => ({ ...layer, locked: !layer.locked }))}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/75 transition-all hover:border-white/20 hover:text-white"
                  >
                    {selectedLayer.locked ? 'Unlock' : 'Lock'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      addLayer({
                        ...clone(selectedLayer),
                        id: makeLayerId(),
                        name: `${selectedLayer.name} Copy`,
                        transform: {
                          ...selectedLayer.transform,
                          xPct: clamp(selectedLayer.transform.xPct + 2, 0, 92),
                          yPct: clamp(selectedLayer.transform.yPct + 2, 0, 92),
                          zIndex: activeState.layers.length + 1,
                        },
                      })
                    }
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/75 transition-all hover:border-white/20 hover:text-white"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={removeSelectedLayer}
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-300 transition-all hover:border-red-400/30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <input
        ref={sourceUploadRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) {
            void handleUploadAsset(file, 'source');
          }
        }}
      />
      <input
        ref={stageUploadRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) {
            void handleUploadAsset(file, 'scene');
          }
        }}
      />
    </div>
  );
}
