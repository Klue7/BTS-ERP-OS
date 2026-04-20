import type { CreativeMode } from './engine';
import type { CreativeWorkspaceMode } from './contracts';

export type StudioCreativeRouteMode = 'ad-builder' | 'cutout' | 'visualizer';

type BuildStudioCreativePathInput = {
  mode?: StudioCreativeRouteMode;
  creativeMode?: CreativeMode | null;
  documentId?: string | null;
  assetId?: string | null;
  productId?: string | null;
  templateId?: string | null;
  campaignId?: string | null;
  legacyDesignId?: string | null;
};

export function studioRouteModeToWorkspaceMode(mode: StudioCreativeRouteMode): CreativeWorkspaceMode {
  if (mode === 'cutout') {
    return 'Cutout';
  }
  if (mode === 'visualizer') {
    return 'Room Restyle';
  }
  return 'Product Design';
}

export function workspaceModeToStudioRouteMode(mode: CreativeWorkspaceMode): StudioCreativeRouteMode {
  if (mode === 'Cutout') {
    return 'cutout';
  }
  if (mode === 'Room Restyle') {
    return 'visualizer';
  }
  return 'ad-builder';
}

export function creativeModeToStudioRouteMode(mode: CreativeMode | null | undefined): StudioCreativeRouteMode {
  if (mode === 'cutout') {
    return 'cutout';
  }
  if (mode === 'scene') {
    return 'visualizer';
  }
  return 'ad-builder';
}

export function buildStudioCreativePath(input: BuildStudioCreativePathInput = {}) {
  const mode = input.mode ?? creativeModeToStudioRouteMode(input.creativeMode);
  const params = new URLSearchParams();

  if (input.documentId) {
    params.set('document', input.documentId);
  }
  if (input.assetId) {
    params.set('asset', input.assetId);
  }
  if (input.productId) {
    params.set('product', input.productId);
  }
  if (input.templateId) {
    params.set('template', input.templateId);
  }
  if (input.campaignId) {
    params.set('campaign', input.campaignId);
  }
  if (input.legacyDesignId) {
    params.set('legacyDesignId', input.legacyDesignId);
  }

  const search = params.toString();
  return `/studio/creative/${mode}${search ? `?${search}` : ''}`;
}
