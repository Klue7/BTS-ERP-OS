import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(serverDirectory, '../..');
const uploadsDirectory = path.join(repoRoot, 'storage', 'uploads');
const privateVendorDocumentsDirectory = path.join(repoRoot, 'storage', 'private-vendor-documents');

export type PublicUploadKind = 'image' | 'video' | 'model' | 'document' | 'other';

export interface StoredPublicUpload {
  originalFilename: string;
  storedFilename: string;
  storagePath: string;
  mimeType: string;
  size: number;
  sha256: string;
  extension: string;
  kind: PublicUploadKind;
  url: string;
  reuse: {
    marketing: boolean;
    publicCatalog: boolean;
    imageGeneration: boolean;
    threeDPipeline: boolean;
    specSheets: boolean;
  };
}

function sanitizeBaseName(filename: string) {
  return filename
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'asset';
}

export function ensureUploadsDirectory() {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
  return uploadsDirectory;
}

export function getUploadsDirectory() {
  return ensureUploadsDirectory();
}

export function ensurePrivateVendorDocumentsDirectory() {
  fs.mkdirSync(privateVendorDocumentsDirectory, { recursive: true });
  return privateVendorDocumentsDirectory;
}

export function getPrivateVendorDocumentsDirectory() {
  return ensurePrivateVendorDocumentsDirectory();
}

export function createStoredUploadName(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  const safeBaseName = sanitizeBaseName(filename);
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${safeBaseName}-${uniqueSuffix}${extension}`;
}

export function toUploadUrl(storedFilename: string) {
  return `/api/uploads/${storedFilename.replace(/\\/g, '/')}`;
}

export function resolvePrivateVendorDocumentPath(storedFilename: string) {
  return path.join(getPrivateVendorDocumentsDirectory(), storedFilename);
}

function detectUploadKind(filename: string, mimeType: string): PublicUploadKind {
  const extension = path.extname(filename).toLowerCase();

  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  if (
    mimeType.includes('model') ||
    ['.glb', '.gltf', '.usdz', '.obj', '.fbx', '.stl'].includes(extension)
  ) {
    return 'model';
  }
  if (
    mimeType.includes('pdf') ||
    mimeType.startsWith('application/') ||
    mimeType.startsWith('text/') ||
    ['.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'].includes(extension)
  ) {
    return 'document';
  }

  return 'other';
}

function buildReuseProfile(kind: PublicUploadKind, mimeType: string) {
  const isImage = kind === 'image';
  const isModel = kind === 'model';
  const isDocument = kind === 'document' || mimeType.includes('pdf');

  return {
    marketing: isImage || kind === 'video',
    publicCatalog: isImage || isModel,
    imageGeneration: isImage,
    threeDPipeline: isImage || isModel,
    specSheets: isImage || isDocument,
  };
}

export function storePublicUpload(input: {
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
}): StoredPublicUpload {
  const uploadsRoot = getUploadsDirectory();
  const sha256 = crypto.createHash('sha256').update(input.buffer).digest('hex');
  const extension = path.extname(input.originalFilename).toLowerCase() || '';
  const kind = detectUploadKind(input.originalFilename, input.mimeType);
  const safeBaseName = sanitizeBaseName(input.originalFilename);
  const stamp = new Date();
  const year = String(stamp.getUTCFullYear());
  const month = String(stamp.getUTCMonth() + 1).padStart(2, '0');
  const hashBucket = sha256.slice(0, 2);
  const relativeDirectory = path.join('originals', kind, year, month, hashBucket);
  const storedFilename = `${safeBaseName}-${sha256.slice(0, 12)}${extension}`;
  const relativePath = path.join(relativeDirectory, storedFilename);
  const absoluteDirectory = path.join(uploadsRoot, relativeDirectory);
  const absolutePath = path.join(uploadsRoot, relativePath);

  fs.mkdirSync(absoluteDirectory, { recursive: true });
  if (!fs.existsSync(absolutePath)) {
    fs.writeFileSync(absolutePath, input.buffer);
  }

  return {
    originalFilename: input.originalFilename,
    storedFilename,
    storagePath: relativePath.replace(/\\/g, '/'),
    mimeType: input.mimeType,
    size: input.buffer.byteLength,
    sha256,
    extension,
    kind,
    url: toUploadUrl(relativePath),
    reuse: buildReuseProfile(kind, input.mimeType),
  };
}
