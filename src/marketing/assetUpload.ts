import { uploadInventoryFile } from '../inventory/api';
import type {
  CreateMarketingAssetInput,
  MarketingAssetSummary,
  MarketingAssetType,
} from './contracts';

export function inferMarketingAssetType(file: File): MarketingAssetType {
  const lowerName = file.name.toLowerCase();
  if (file.type.startsWith('video/')) {
    return 'Video';
  }
  if (lowerName.endsWith('.glb') || lowerName.endsWith('.gltf') || lowerName.endsWith('.obj') || lowerName.endsWith('.fbx')) {
    return 'Model';
  }
  if (lowerName.includes('2.5d')) {
    return '2.5D Asset';
  }
  if (lowerName.includes('3d') || lowerName.includes('render')) {
    return '3D Asset';
  }
  return 'Image';
}

export function sanitizeMarketingAssetName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, '');
  const normalized = withoutExtension
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return 'Uploaded Asset';
  }

  return normalized
    .split(' ')
    .map((segment) => {
      const lower = segment.toLowerCase();
      if (lower === '3d') return '3D';
      if (lower === '2.5d' || lower === '25d') return '2.5D';
      if (lower === 'bts') return 'BTS';
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export async function createMarketingAssetFromUpload<TAsset extends MarketingAssetSummary>(input: {
  file: File;
  linkedProductId?: string;
  createAsset: (payload: CreateMarketingAssetInput) => Promise<TAsset>;
  tags?: string[];
}) {
  const uploaded = await uploadInventoryFile(input.file);

  return input.createAsset({
    name: sanitizeMarketingAssetName(input.file.name),
    imageUrl: uploaded.url,
    size: `${Math.max(0.1, uploaded.size / (1024 * 1024)).toFixed(1)}MB`,
    type: inferMarketingAssetType(input.file),
    productId: input.linkedProductId,
    tags: input.tags ?? ['Uploaded', 'Marketing Studio'],
    originalFilename: uploaded.originalFilename,
    storedFilename: uploaded.storedFilename,
    storagePath: uploaded.storagePath,
    mimeType: uploaded.mimeType,
    fileSizeBytes: uploaded.size,
    sha256: uploaded.sha256,
  });
}
