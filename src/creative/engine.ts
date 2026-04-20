export type CreativeMode = 'blueprint' | 'cutout' | 'scene';
export type CreativeProcessingMode = 'deterministic' | 'ai-enhanced';
export type CreativeApplicationMode = 'full-wall' | 'feature-wall' | 'backsplash' | 'facade-panel';

export interface CreativePreviewAsset {
  id: string;
  name: string;
  img: string;
  type?: string;
  productId?: string;
  linkedProductIds?: string[];
}

export interface CreativePreviewProduct {
  id: string;
  name: string;
  category: string;
  price: number | string;
  img: string;
  color?: string;
}

export interface CreativePreviewTemplate {
  id: string;
  name: string;
  type: 'Product Card' | 'Collection Highlight' | 'Quote CTA';
}

export interface BlueprintRenderRequest {
  template: CreativePreviewTemplate;
  product: CreativePreviewProduct;
  sourceAsset?: CreativePreviewAsset | null;
  aspectRatio: '1:1' | '9:16' | '16:9';
  showPrice: boolean;
  showCta: boolean;
  watermarkProfile: string;
  generatorCopy: string;
}

export interface BackgroundRemovalRequest {
  sourceAsset: CreativePreviewAsset;
  edgeSoftness: number;
  isolationMode: 'corner-key' | 'balanced';
  watermarkProfile: string;
  channelSize: 'Original' | '1080x1080' | '1080x1920' | '1200x630';
  prompt?: string;
}

export interface SceneMockupRequest {
  sceneAsset: CreativePreviewAsset;
  textureAsset?: CreativePreviewAsset | null;
  product: CreativePreviewProduct;
  applicationMode: CreativeApplicationMode;
  processingMode: CreativeProcessingMode;
  roomType: 'Interior' | 'Exterior' | 'Commercial';
  splitView: boolean;
  scale: number;
  blend: number;
  intensity: number;
  contrast: number;
  watermarkProfile: string;
  focusPoint?: {
    x: number;
    y: number;
  } | null;
  maskDataUrl?: string | null;
  prompt?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context unavailable.');
  }
  return { canvas, context };
}

async function loadImage(src: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function coverImage(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const ratio = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function coverImageIntoRect(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const ratio = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;
  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function roundRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign,
) {
  context.textAlign = align;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
}

function applyWatermark(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermarkProfile: string,
) {
  if (watermarkProfile === 'None') {
    return;
  }

  context.save();
  context.globalAlpha =
    watermarkProfile === 'Confidential' ? 0.22 : watermarkProfile === 'Draft' ? 0.18 : 0.12;
  context.translate(width / 2, height / 2);
  context.rotate((-28 * Math.PI) / 180);
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.font = `700 ${Math.max(24, Math.round(width * 0.06))}px Inter, sans-serif`;
  context.fillText(watermarkProfile, 0, 0);
  context.restore();
}

function drawButton(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
) {
  context.save();
  context.fillStyle = '#ffffff';
  context.fillRect(x, y, width, height);
  context.fillStyle = '#050505';
  context.textAlign = 'center';
  context.font = `800 ${Math.round(height * 0.28)}px JetBrains Mono, monospace`;
  context.fillText(label, x + width / 2, y + height * 0.62);
  context.restore();
}

function coverImageSection(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  index: number,
) {
  const sampleWidth = image.width / 3;
  const sampleX = clamp(sampleWidth * index, 0, Math.max(0, image.width - sampleWidth));
  context.drawImage(image, sampleX, 0, sampleWidth, image.height, x, y, width, height);
}

function drawThumbStrip(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const thumbWidth = width * 0.11;
  const thumbHeight = height * 0.12;
  const gap = width * 0.018;
  const totalWidth = thumbWidth * 3 + gap * 2;
  let startX = width / 2 - totalWidth / 2;

  for (let index = 0; index < 3; index += 1) {
    context.save();
    roundRectPath(context, startX, height * 0.76, thumbWidth, thumbHeight, 18);
    context.clip();
    coverImageSection(context, image, startX, height * 0.76, thumbWidth, thumbHeight, index);
    context.restore();
    context.strokeStyle = 'rgba(255,255,255,0.18)';
    context.lineWidth = 2;
    roundRectPath(context, startX, height * 0.76, thumbWidth, thumbHeight, 18);
    context.stroke();
    startX += thumbWidth + gap;
  }
}

function resolveBlueprintDimensions(aspectRatio: BlueprintRenderRequest['aspectRatio']) {
  if (aspectRatio === '9:16') {
    return { width: 1080, height: 1920 };
  }
  if (aspectRatio === '16:9') {
    return { width: 1600, height: 900 };
  }
  return { width: 1080, height: 1080 };
}

export async function renderBlueprintAsset(request: BlueprintRenderRequest) {
  const { width, height } = resolveBlueprintDimensions(request.aspectRatio);
  const { canvas, context } = getCanvas(width, height);
  const sourceImage = await loadImage(request.sourceAsset?.img || request.product.img);
  coverImage(context, sourceImage, width, height);

  const overlay = context.createLinearGradient(0, height, 0, height * 0.34);
  overlay.addColorStop(0, 'rgba(5, 5, 5, 0.96)');
  overlay.addColorStop(1, 'rgba(5, 5, 5, 0)');
  context.fillStyle = overlay;
  context.fillRect(0, 0, width, height);

  if (request.template.type === 'Collection Highlight') {
    context.fillStyle = 'rgba(5, 5, 5, 0.5)';
    context.fillRect(0, 0, width, height);
    context.textAlign = 'center';
    context.fillStyle = '#22c55e';
    context.font = `700 ${Math.round(width * 0.026)}px JetBrains Mono, monospace`;
    context.fillText('CURATED COLLECTION', width / 2, height * 0.14);
    context.fillStyle = '#ffffff';
    context.font = `700 ${Math.round(width * 0.07)}px Playfair Display, serif`;
    context.fillText(`${request.product.category} Series`, width / 2, height * 0.22);
    context.font = `500 ${Math.round(width * 0.022)}px Inter, sans-serif`;
    wrapText(context, request.generatorCopy, width / 2, height * 0.29, width * 0.64, height * 0.035, 'center');
    drawThumbStrip(context, sourceImage, width, height);
  } else if (request.template.type === 'Quote CTA') {
    context.fillStyle = 'rgba(5, 5, 5, 0.62)';
    context.fillRect(0, 0, width, height);
    context.textAlign = 'center';
    context.fillStyle = '#22c55e';
    context.font = `700 ${Math.round(width * 0.038)}px Playfair Display, serif`;
    context.fillText('\"', width / 2, height * 0.28);
    context.fillStyle = '#ffffff';
    context.font = `600 ${Math.round(width * 0.04)}px Playfair Display, serif`;
    wrapText(context, request.generatorCopy, width / 2, height * 0.38, width * 0.66, height * 0.052, 'center');
    context.font = `700 ${Math.round(width * 0.018)}px JetBrains Mono, monospace`;
    context.fillStyle = 'rgba(255,255,255,0.55)';
    context.fillText(`REVIEW: ${request.product.name.toUpperCase()}`, width / 2, height * 0.64);
    if (request.showCta) {
      drawButton(context, width / 2 - width * 0.14, height * 0.72, width * 0.28, height * 0.065, 'EXPLORE SERIES');
    }
  } else {
    context.textAlign = 'left';
    context.fillStyle = '#ffffff';
    context.font = `700 ${Math.round(width * 0.066)}px Playfair Display, serif`;
    context.fillText(request.product.name.toUpperCase(), width * 0.08, height * 0.74);
    context.font = `500 ${Math.round(width * 0.019)}px JetBrains Mono, monospace`;
    context.fillStyle = 'rgba(255,255,255,0.72)';
    wrapText(context, request.generatorCopy, width * 0.08, height * 0.79, width * 0.52, height * 0.032, 'left');
    if (request.showPrice) {
      context.fillStyle = '#22c55e';
      context.fillRect(width * 0.74, height * 0.74, width * 0.18, height * 0.055);
      context.fillStyle = '#050505';
      context.textAlign = 'center';
      context.font = `800 ${Math.round(width * 0.02)}px JetBrains Mono, monospace`;
      context.fillText(String(request.product.price), width * 0.83, height * 0.776);
    }
    if (request.showCta) {
      drawButton(context, width * 0.08, height * 0.875, width * 0.22, height * 0.06, 'VIEW RANGE');
    }
  }

  applyWatermark(context, width, height, request.watermarkProfile);
  return canvas.toDataURL('image/png');
}

function sampleCornerAverage(imageData: ImageData, width: number, height: number) {
  const points = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width * 0.12), Math.floor(height * 0.12)],
    [Math.floor(width * 0.88), Math.floor(height * 0.12)],
    [Math.floor(width * 0.12), Math.floor(height * 0.88)],
    [Math.floor(width * 0.88), Math.floor(height * 0.88)],
  ];

  let r = 0;
  let g = 0;
  let b = 0;

  for (const [x, y] of points) {
    const index = (y * width + x) * 4;
    r += imageData.data[index];
    g += imageData.data[index + 1];
    b += imageData.data[index + 2];
  }

  return {
    r: r / points.length,
    g: g / points.length,
    b: b / points.length,
  };
}

function resizeDataUrl(dataUrl: string, size: { width: number; height: number }, contain = false) {
  return new Promise<string>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const { canvas, context } = getCanvas(size.width, size.height);
      if (contain) {
        const ratio = Math.min(size.width / image.width, size.height / image.height);
        const drawWidth = image.width * ratio;
        const drawHeight = image.height * ratio;
        const offsetX = (size.width - drawWidth) / 2;
        const offsetY = (size.height - drawHeight) / 2;
        context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      } else {
        coverImage(context, image, size.width, size.height);
      }
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = reject;
    image.src = dataUrl;
  });
}

export async function previewBackgroundRemoval(request: BackgroundRemovalRequest) {
  const image = await loadImage(request.sourceAsset.img);
  const { canvas, context } = getCanvas(image.width, image.height);
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const background = sampleCornerAverage(imageData, canvas.width, canvas.height);
  const threshold = request.isolationMode === 'balanced' ? 42 : 34;
  const softness = clamp(request.edgeSoftness, 0.02, 0.45) * 120;

  for (let index = 0; index < imageData.data.length; index += 4) {
    const dr = imageData.data[index] - background.r;
    const dg = imageData.data[index + 1] - background.g;
    const db = imageData.data[index + 2] - background.b;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);

    if (distance < threshold) {
      imageData.data[index + 3] = 0;
      continue;
    }

    if (distance < threshold + softness) {
      const alphaRatio = clamp((distance - threshold) / softness, 0, 1);
      imageData.data[index + 3] = Math.round(255 * alphaRatio);
    }
  }

  context.putImageData(imageData, 0, 0);
  applyWatermark(context, canvas.width, canvas.height, request.watermarkProfile);

  if (request.channelSize === 'Original') {
    return canvas.toDataURL('image/png');
  }

  return await resizeDataUrl(
    canvas.toDataURL('image/png'),
    request.channelSize === '1080x1080'
      ? { width: 1080, height: 1080 }
      : request.channelSize === '1080x1920'
        ? { width: 1080, height: 1920 }
        : { width: 1200, height: 630 },
    true,
  );
}

function scenePath(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: CreativeApplicationMode,
  focusPoint?: SceneMockupRequest['focusPoint'],
) {
  const anchorX = clamp((focusPoint?.x ?? 0.5) * width, width * 0.12, width * 0.88);
  const anchorY = clamp((focusPoint?.y ?? 0.54) * height, height * 0.18, height * 0.86);

  if (mode === 'backsplash') {
    const backsplashWidth = width * 0.78;
    const backsplashHeight = height * 0.22;
    const startX = clamp(anchorX - backsplashWidth / 2, width * 0.04, width - backsplashWidth - width * 0.04);
    const startY = clamp(anchorY - backsplashHeight / 2, height * 0.34, height * 0.72);
    roundRectPath(context, startX, startY, backsplashWidth, backsplashHeight, 28);
    return;
  }

  if (mode === 'feature-wall') {
    const featureWidth = width * 0.48;
    const featureHeight = height * 0.78;
    const startX = clamp(anchorX - featureWidth / 2, width * 0.08, width - featureWidth - width * 0.08);
    const startY = clamp(anchorY - featureHeight / 2, height * 0.06, height - featureHeight - height * 0.08);
    roundRectPath(context, startX, startY, featureWidth, featureHeight, 36);
    return;
  }

  if (mode === 'facade-panel') {
    const panelWidth = width * 0.42;
    const panelHeight = height * 0.76;
    const startX = clamp(anchorX - panelWidth / 2, width * 0.08, width - panelWidth - width * 0.08);
    const startY = clamp(anchorY - panelHeight / 2, height * 0.08, height - panelHeight - height * 0.08);
    context.beginPath();
    context.moveTo(startX + panelWidth * 0.08, startY);
    context.lineTo(startX + panelWidth * 0.92, startY + panelHeight * 0.04);
    context.lineTo(startX + panelWidth, startY + panelHeight * 0.92);
    context.lineTo(startX, startY + panelHeight);
    context.closePath();
    return;
  }

  const wallWidth = width * 0.82;
  const wallHeight = height * 0.82;
  const startX = clamp(anchorX - wallWidth / 2, width * 0.01, width - wallWidth - width * 0.01);
  const startY = clamp(anchorY - wallHeight / 2, height * 0.02, height - wallHeight - height * 0.02);
  context.beginPath();
  context.moveTo(startX + wallWidth * 0.04, startY + wallHeight * 0.04);
  context.lineTo(startX + wallWidth * 0.96, startY);
  context.lineTo(startX + wallWidth, startY + wallHeight * 0.94);
  context.lineTo(startX, startY + wallHeight);
  context.closePath();
}

async function renderPatternedScene(
  request: SceneMockupRequest,
  baseImage: HTMLImageElement,
  textureImage: HTMLImageElement,
) {
  const { canvas, context } = getCanvas(1600, 1000);
  coverImage(context, baseImage, canvas.width, canvas.height);

  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = Math.max(220, Math.round(260 * request.scale));
  patternCanvas.height = Math.max(90, Math.round(110 * request.scale));
  const patternContext = patternCanvas.getContext('2d');

  if (patternContext) {
    patternContext.fillStyle = request.product.color || '#8b5a3c';
    patternContext.fillRect(0, 0, patternCanvas.width, patternCanvas.height);

    const rowHeight = patternCanvas.height / 2;
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        const brickWidth = patternCanvas.width / 2.2;
        const x = column * (brickWidth * 0.54) - (row % 2 ? brickWidth / 2 : 0);
        patternContext.save();
        roundRectPath(patternContext, x, row * rowHeight + 4, brickWidth, rowHeight - 8, 6);
        patternContext.clip();
        coverImageIntoRect(patternContext, textureImage, x, row * rowHeight + 4, brickWidth, rowHeight - 8);
        patternContext.restore();
        patternContext.strokeStyle = 'rgba(255,255,255,0.16)';
        patternContext.lineWidth = 2;
        roundRectPath(patternContext, x, row * rowHeight + 4, brickWidth, rowHeight - 8, 6);
        patternContext.stroke();
      }
    }
  }

  const textureOverlay = document.createElement('canvas');
  textureOverlay.width = canvas.width;
  textureOverlay.height = canvas.height;
  const overlayContext = textureOverlay.getContext('2d');

  if (overlayContext) {
    const pattern = overlayContext.createPattern(patternCanvas, 'repeat');
    if (pattern) {
      overlayContext.fillStyle = pattern;
      overlayContext.fillRect(0, 0, canvas.width, canvas.height);

      if (request.maskDataUrl) {
        const maskImage = await loadImage(request.maskDataUrl);
        overlayContext.globalCompositeOperation = 'destination-in';
        coverImage(overlayContext, maskImage, canvas.width, canvas.height);
        overlayContext.globalCompositeOperation = 'source-over';
      } else {
        overlayContext.globalCompositeOperation = 'destination-in';
        overlayContext.fillStyle = '#ffffff';
        scenePath(overlayContext, canvas.width, canvas.height, request.applicationMode, request.focusPoint);
        overlayContext.fill();
        overlayContext.globalCompositeOperation = 'source-over';
      }

      context.save();
      context.globalAlpha = clamp(request.blend, 0.18, 0.92);
      context.drawImage(textureOverlay, 0, 0);
      context.restore();
    }
  }

  if (request.processingMode === 'ai-enhanced') {
    context.save();
    context.fillStyle = 'rgba(34, 197, 94, 0.08)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.filter = `contrast(${request.contrast * 1.08}) saturate(1.1) brightness(${request.intensity * 1.02})`;
    context.drawImage(canvas, 0, 0);
    context.restore();
  }

  context.save();
  context.fillStyle = 'rgba(5,5,5,0.42)';
  context.fillRect(0, canvas.height * 0.78, canvas.width, canvas.height * 0.22);
  context.fillStyle = '#22c55e';
  context.font = '700 24px JetBrains Mono, monospace';
  context.fillText(
    request.processingMode === 'ai-enhanced' ? 'AI-ENHANCED MOCKUP' : 'DETERMINISTIC MOCKUP',
    64,
    canvas.height - 92,
  );
  context.fillStyle = '#ffffff';
  context.font = '700 56px Playfair Display, serif';
  context.fillText(request.product.name.toUpperCase(), 64, canvas.height - 36);
  context.font = '500 18px Inter, sans-serif';
  context.fillStyle = 'rgba(255,255,255,0.7)';
  context.fillText(
    `${request.roomType.toUpperCase()} • ${request.applicationMode.replace('-', ' ').toUpperCase()}`,
    64,
    canvas.height - 120,
  );
  context.restore();

  return canvas;
}

export async function previewSceneMockup(request: SceneMockupRequest) {
  const baseImage = await loadImage(request.sceneAsset.img);
  const textureImage = await loadImage(request.textureAsset?.img || request.product.img);
  const originalCanvas = await renderPatternedScene(
    { ...request, blend: 0, processingMode: 'deterministic', watermarkProfile: 'None' },
    baseImage,
    textureImage,
  );
  const mockCanvas = await renderPatternedScene(request, baseImage, textureImage);

  const { canvas, context } = getCanvas(mockCanvas.width, mockCanvas.height);

  if (request.splitView) {
    context.drawImage(originalCanvas, 0, 0);
    context.save();
    context.beginPath();
    context.rect(canvas.width * 0.52, 0, canvas.width * 0.48, canvas.height);
    context.clip();
    context.drawImage(mockCanvas, 0, 0);
    context.restore();
    context.fillStyle = '#22c55e';
    context.fillRect(canvas.width * 0.52 - 2, canvas.height * 0.08, 4, canvas.height * 0.84);
  } else {
    context.drawImage(mockCanvas, 0, 0);
  }

  applyWatermark(context, canvas.width, canvas.height, request.watermarkProfile);
  return canvas.toDataURL('image/png');
}

export function dataUrlToFile(dataUrl: string, filename: string) {
  const [header, body] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? 'image/png';
  const binary = window.atob(body);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], filename, { type: mimeType });
}
