import * as THREE from 'three';

// ── Singleton texture cache — generated once, reused everywhere ───────────────
const textureCache: Record<string, THREE.Texture> = {};

/**
 * Generates a 512×256 brick colour canvas (half the previous size — plenty for
 * a bump/colour map that is barely readable at normal viewing distances).
 * Uses a typed Uint8ClampedArray instead of getImageData round-trips.
 */
export function createBrickTexture(): THREE.Texture {
  if (textureCache['brick']) return textureCache['brick'];

  const W = 512, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Base gradient
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
  g.addColorStop(0, '#5C3A21');
  g.addColorStop(0.6, '#3A2315');
  g.addColorStop(1, '#1A110B');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Noise — typed array avoids the ImageData ping-pong overhead
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 50 + 10;
    d[i]     = Math.max(0, Math.min(255, d[i]     + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(id, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  textureCache['brick'] = tex;
  return tex;
}

export function createBumpTexture(): THREE.Texture {
  if (textureCache['brickBump']) return textureCache['brickBump'];

  const W = 512, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, W, H);

  // Use a typed buffer directly — much faster than repeated putPixel calls
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = Math.random() * 255;
    const isPit = Math.random() > 0.85;
    const v = isPit ? n * 0.2 : 160 + n * 0.3;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  textureCache['brickBump'] = tex;
  return tex;
}

export function createPavingTexture(): THREE.Texture {
  if (textureCache['paving']) return textureCache['paving'];

  const W = 512, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.8);
  g.addColorStop(0, '#444444');
  g.addColorStop(0.7, '#222222');
  g.addColorStop(1, '#111111');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 40;
    d[i]     = Math.max(0, Math.min(255, d[i]     + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(id, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  textureCache['paving'] = tex;
  return tex;
}

export function createPavingBumpTexture(): THREE.Texture {
  if (textureCache['pavingBump']) return textureCache['pavingBump'];

  const W = 512, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, W, H);

  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = Math.random() * 255;
    const isPitting = Math.random() > 0.92;
    const v = isPitting ? n * 0.1 : 128 + (n - 128) * 0.4;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  textureCache['pavingBump'] = tex;
  return tex;
}
