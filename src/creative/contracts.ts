import type {
  MarketingAssetSummary,
  MarketingCampaignSummary,
  MarketingTemplateSummary,
} from '../marketing/contracts';

export type CreativeDocumentStatus = 'Draft' | 'Review' | 'Approved' | 'Archived';
export type CreativeWorkspaceMode = 'Product Design' | 'Cutout' | 'Room Restyle';
export type CreativeLayerType = 'image' | 'text' | 'shape' | 'logo' | 'product-card' | 'brand-block' | 'room-mask';
export type CreativeDocumentLinkType = 'Product' | 'Campaign' | 'Template' | 'Asset' | 'Publish Target';
export type CreativeExportPreset = 'Home Hero' | 'Square Post' | 'Portrait Story' | 'WhatsApp Share' | 'Email Banner' | 'Custom';
export type CreativeExportJobStatus = 'Draft' | 'Queued' | 'Processing' | 'Review' | 'Approved' | 'Failed' | 'Archived';
export type CreativeAiJobType =
  | 'Background Removal'
  | 'Object Cleanup'
  | 'Image Expansion'
  | 'Auto Caption'
  | 'Auto Layout'
  | 'Room Segmentation'
  | 'Room Restyle';
export type CreativeAiJobStatus = 'Draft' | 'Queued' | 'Processing' | 'Review' | 'Approved' | 'Failed' | 'Archived';

export interface CreativeCanvasPreset {
  label: CreativeExportPreset;
  width: number;
  height: number;
  safeZone: {
    topPct: number;
    rightPct: number;
    bottomPct: number;
    leftPct: number;
  };
}

export interface CreativeLayerTransform {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  rotation: number;
  zIndex: number;
  opacity?: number;
}

export interface CreativeImageCrop {
  xPct: number;
  yPct: number;
  scale: number;
}

export interface CreativeMaskVectorData {
  kind: 'ellipse' | 'polygon' | 'brush';
  focusPoint?: {
    x: number;
    y: number;
  } | null;
  points?: Array<{ x: number; y: number }>;
  brushSize?: number;
}

export interface CreativeMask {
  id: string;
  label: string;
  maskMode: string;
  width: number;
  height: number;
  maskImageUrl?: string | null;
  vectorData?: CreativeMaskVectorData | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeLayer {
  id: string;
  name: string;
  type: CreativeLayerType;
  sourceAssetId?: string | null;
  visible: boolean;
  locked: boolean;
  transform: CreativeLayerTransform;
  crop?: CreativeImageCrop | null;
  style?: Record<string, unknown> | null;
  content?: Record<string, unknown> | null;
}

export interface CreativeDocumentLink {
  id: string;
  linkType: CreativeDocumentLinkType;
  productId?: string | null;
  campaignId?: string | null;
  templateId?: string | null;
  assetId?: string | null;
  publishTarget?: string | null;
}

export interface CreativeDocumentMetadata {
  generatorCopy?: string;
  aiDirection?: string;
  selectedSourceAssetId?: string | null;
  selectedSceneAssetId?: string | null;
  selectedTextureAssetId?: string | null;
  selectedCampaignId?: string | null;
  creativeGoal?:
    | 'special-ad'
    | 'website-hero'
    | 'story-reel'
    | 'whatsapp-share'
    | 'email-banner'
    | 'cutout-asset'
    | 'room-visual';
  publishChannel?: 'Instagram' | 'Facebook' | 'TikTok' | 'LinkedIn' | 'Email' | 'WhatsApp' | 'Pinterest';
  scheduledFor?: string | null;
  aspectRatio?: '1:1' | '9:16' | '16:9';
  showPrice?: boolean;
  showCta?: boolean;
  watermarkProfile?: string;
  channelSize?: 'Original' | '1080x1080' | '1080x1920' | '1200x630';
  usagePurpose?: 'Publishable Variant' | 'Campaign' | 'Gallery' | 'Social';
  edgeSoftness?: number;
  isolationMode?: 'corner-key' | 'balanced';
  processingMode?: 'deterministic' | 'ai-enhanced';
  applicationMode?: 'full-wall' | 'feature-wall' | 'backsplash' | 'facade-panel';
  roomType?: 'Interior' | 'Exterior' | 'Commercial';
  blend?: number;
  scale?: number;
  intensity?: number;
  contrast?: number;
  splitView?: boolean;
  focusPoint?: { x: number; y: number } | null;
  activeMaskId?: string | null;
}

export interface CreativeDocumentVersion {
  id: string;
  versionNumber: number;
  createdAt: string;
  snapshot: {
    name: string;
    status: CreativeDocumentStatus;
    workspaceMode: CreativeWorkspaceMode;
    canvasPreset: CreativeCanvasPreset;
    metadata?: CreativeDocumentMetadata | null;
    layerCount: number;
  };
}

export interface CreativeDocumentSummary {
  id: string;
  key: string;
  name: string;
  status: CreativeDocumentStatus;
  workspaceMode: CreativeWorkspaceMode;
  canvasPreset: CreativeCanvasPreset;
  previewImageUrl?: string | null;
  productId?: string | null;
  productName?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
  templateId?: string | null;
  templateName?: string | null;
  updatedAt: string;
}

export interface CreativeDocumentDetail extends CreativeDocumentSummary {
  metadata?: CreativeDocumentMetadata | null;
  layers: CreativeLayer[];
  links: CreativeDocumentLink[];
  versions: CreativeDocumentVersion[];
  masks: CreativeMask[];
  exportJobs: CreativeExportJob[];
  aiJobs: CreativeAiJob[];
}

export interface CreativeAiJob {
  id: string;
  jobKey: string;
  type: CreativeAiJobType;
  status: CreativeAiJobStatus;
  provider: string;
  result?: Record<string, unknown> | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeExportJob {
  id: string;
  jobKey: string;
  preset: CreativeExportPreset;
  width: number;
  height: number;
  status: CreativeExportJobStatus;
  outputAssetId?: string | null;
  outputAsset?: MarketingAssetSummary | null;
  publishChannel?: string | null;
  publishTarget?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeStudioSnapshot {
  documents: CreativeDocumentSummary[];
}

export interface CreateCreativeDocumentInput {
  name: string;
  workspaceMode: CreativeWorkspaceMode;
  canvasPreset: CreativeCanvasPreset;
  productId?: string;
  campaignId?: string;
  templateId?: string;
  metadata?: CreativeDocumentMetadata | null;
  layers?: CreativeLayer[];
}

export interface UpdateCreativeDocumentInput {
  name?: string;
  status?: CreativeDocumentStatus;
  workspaceMode?: CreativeWorkspaceMode;
  canvasPreset?: CreativeCanvasPreset;
  productId?: string | null;
  campaignId?: string | null;
  templateId?: string | null;
  metadata?: CreativeDocumentMetadata | null;
  previewImageUrl?: string | null;
  layers?: CreativeLayer[];
  masks?: Array<{
    id?: string;
    label: string;
    maskMode: string;
    width: number;
    height: number;
    maskImageUrl?: string | null;
    vectorData?: CreativeMaskVectorData | null;
  }>;
}

export interface CreateCreativeLayerInput {
  name: string;
  type: CreativeLayerType;
  sourceAssetId?: string | null;
  visible?: boolean;
  locked?: boolean;
  transform: CreativeLayerTransform;
  crop?: CreativeImageCrop | null;
  style?: Record<string, unknown> | null;
  content?: Record<string, unknown> | null;
}

export interface UpdateCreativeLayerInput extends Partial<CreateCreativeLayerInput> {}

export interface CreateCreativeAiJobInput {
  documentId?: string;
  assetId?: string;
  type: CreativeAiJobType;
  input?: Record<string, unknown>;
}

export interface CreateCreativeExportJobInput {
  preset: CreativeExportPreset;
  width: number;
  height: number;
  uploadedAsset: {
    imageUrl: string;
    originalFilename: string;
    storedFilename?: string | null;
    storagePath?: string | null;
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    sha256?: string | null;
  };
  attachToCampaignId?: string;
  publishChannel?: 'Instagram' | 'Facebook' | 'TikTok' | 'LinkedIn' | 'Email' | 'WhatsApp' | 'Pinterest';
  publishTarget?: string;
  usagePurpose: 'Publishable Variant' | 'Campaign' | 'Gallery' | 'Social';
  watermarkProfile?: string;
}

export interface PublishCreativeDocumentInput {
  exportJobId: string;
  channel: 'Instagram' | 'Facebook' | 'TikTok' | 'LinkedIn' | 'Email' | 'WhatsApp' | 'Pinterest';
  title: string;
  scheduledFor?: string;
}

export interface CreativeLibraryContext {
  assets: MarketingAssetSummary[];
  products: Array<{
    id: string;
    name: string;
    category: string;
    price: number | string;
    img: string;
    recordId?: string;
    color?: string;
  }>;
  templates: MarketingTemplateSummary[];
  campaigns: MarketingCampaignSummary[];
}
