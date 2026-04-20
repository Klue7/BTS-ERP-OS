import type {
  CreativeCanvasPreset,
  CreativeLayer,
  CreativeLayerTransform,
} from './contracts';

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

function getRect(transform: CreativeLayerTransform, width: number, height: number) {
  return {
    x: (transform.xPct / 100) * width,
    y: (transform.yPct / 100) * height,
    w: (transform.widthPct / 100) * width,
    h: (transform.heightPct / 100) * height,
    rotation: transform.rotation ?? 0,
    opacity: transform.opacity ?? 1,
  };
}

function applyRotation(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, rotation: number) {
  context.translate(x + width / 2, y + height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.translate(-(x + width / 2), -(y + height / 2));
}

function drawTextBlock(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    fontWeight?: number | string;
    align?: CanvasTextAlign;
    lineHeight?: number;
  },
) {
  context.fillStyle = options.color ?? '#ffffff';
  context.font = `${options.fontWeight ?? 700} ${options.fontSize ?? 32}px ${options.fontFamily ?? 'Inter'}, sans-serif`;
  context.textAlign = options.align ?? 'left';
  context.textBaseline = 'top';
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const lineHeight = options.lineHeight ?? Math.round((options.fontSize ?? 32) * 1.25);

  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(test).width > width && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  const maxLines = Math.max(1, Math.floor(height / lineHeight));
  const renderLines = lines.slice(0, maxLines);

  renderLines.forEach((line, index) => {
    const drawX = options.align === 'center' ? x + width / 2 : options.align === 'right' ? x + width : x;
    context.fillText(line, drawX, y + index * lineHeight);
  });
}

function drawGuidedBackground(context: CanvasRenderingContext2D, preset: CreativeCanvasPreset) {
  const gradient = context.createLinearGradient(0, preset.height, preset.width, 0);
  gradient.addColorStop(0, '#050505');
  gradient.addColorStop(1, '#111111');
  context.fillStyle = gradient;
  context.fillRect(0, 0, preset.width, preset.height);
}

async function drawImageLayer(
  context: CanvasRenderingContext2D,
  layer: CreativeLayer,
  preset: CreativeCanvasPreset,
  imageUrl: string,
) {
  const image = await loadImage(imageUrl);
  const rect = getRect(layer.transform, preset.width, preset.height);
  const crop = layer.crop ?? { xPct: 0, yPct: 0, scale: 1 };
  const sampleWidth = image.width / clamp(crop.scale, 0.4, 3);
  const sampleHeight = image.height / clamp(crop.scale, 0.4, 3);
  const sx = clamp((crop.xPct / 100) * image.width, 0, Math.max(0, image.width - sampleWidth));
  const sy = clamp((crop.yPct / 100) * image.height, 0, Math.max(0, image.height - sampleHeight));

  context.save();
  context.globalAlpha = rect.opacity;
  applyRotation(context, rect.x, rect.y, rect.w, rect.h, rect.rotation);
  roundRectPath(context, rect.x, rect.y, rect.w, rect.h, Number(layer.style?.borderRadius ?? 18));
  context.clip();
  context.drawImage(image, sx, sy, sampleWidth, sampleHeight, rect.x, rect.y, rect.w, rect.h);
  context.restore();
}

function drawShapeLayer(context: CanvasRenderingContext2D, layer: CreativeLayer, preset: CreativeCanvasPreset) {
  const rect = getRect(layer.transform, preset.width, preset.height);
  context.save();
  context.globalAlpha = rect.opacity;
  applyRotation(context, rect.x, rect.y, rect.w, rect.h, rect.rotation);
  roundRectPath(context, rect.x, rect.y, rect.w, rect.h, Number(layer.style?.borderRadius ?? 18));
  context.fillStyle = String(layer.style?.fill ?? 'rgba(255,255,255,0.08)');
  context.fill();
  if (layer.style?.borderColor) {
    context.strokeStyle = String(layer.style.borderColor);
    context.lineWidth = Number(layer.style.borderWidth ?? 1);
    context.stroke();
  }
  context.restore();
}

function drawTextLayer(context: CanvasRenderingContext2D, layer: CreativeLayer, preset: CreativeCanvasPreset) {
  const rect = getRect(layer.transform, preset.width, preset.height);
  context.save();
  context.globalAlpha = rect.opacity;
  applyRotation(context, rect.x, rect.y, rect.w, rect.h, rect.rotation);
  drawTextBlock(context, String(layer.content?.text ?? ''), rect.x, rect.y, rect.w, rect.h, {
    fontFamily: String(layer.style?.fontFamily ?? 'Inter'),
    fontSize: Number(layer.style?.fontSize ?? 28),
    color: String(layer.style?.color ?? '#ffffff'),
    fontWeight: Number(layer.style?.fontWeight ?? 700),
    align: (layer.style?.align as CanvasTextAlign | undefined) ?? 'left',
  });
  context.restore();
}

function drawBrandBlock(context: CanvasRenderingContext2D, layer: CreativeLayer, preset: CreativeCanvasPreset) {
  drawShapeLayer(context, layer, preset);
  const rect = getRect(layer.transform, preset.width, preset.height);
  context.save();
  context.globalAlpha = rect.opacity;
  applyRotation(context, rect.x, rect.y, rect.w, rect.h, rect.rotation);
  drawTextBlock(context, String(layer.content?.eyebrow ?? 'Brick Tile Shop'), rect.x + 24, rect.y + 18, rect.w - 48, rect.h - 20, {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#22c55e',
    fontWeight: 700,
  });
  drawTextBlock(context, String(layer.content?.templateName ?? 'Creative Studio'), rect.x + 24, rect.y + 42, rect.w - 48, rect.h - 42, {
    fontFamily: 'Playfair Display',
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 700,
  });
  context.restore();
}

function drawProductCard(context: CanvasRenderingContext2D, layer: CreativeLayer, preset: CreativeCanvasPreset) {
  drawShapeLayer(context, layer, preset);
  const rect = getRect(layer.transform, preset.width, preset.height);
  context.save();
  context.globalAlpha = rect.opacity;
  applyRotation(context, rect.x, rect.y, rect.w, rect.h, rect.rotation);
  drawTextBlock(context, String(layer.content?.label ?? ''), rect.x + 18, rect.y + rect.h * 0.28, rect.w - 36, rect.h * 0.4, {
    fontFamily: 'JetBrains Mono',
    fontSize: Math.max(18, rect.h * 0.24),
    color: String(layer.style?.color ?? '#050505'),
    fontWeight: 800,
    align: 'center',
  });
  context.restore();
}

export async function renderCreativeDocumentToDataUrl(input: {
  preset: CreativeCanvasPreset;
  layers: CreativeLayer[];
  assetImageUrls: Record<string, string>;
  backgroundImageUrl?: string | null;
}) {
  const { canvas, context } = getCanvas(input.preset.width, input.preset.height);
  drawGuidedBackground(context, input.preset);

  if (input.backgroundImageUrl) {
    await drawImageLayer(
      context,
      {
        id: 'background',
        name: 'Background',
        type: 'image',
        visible: true,
        locked: true,
        transform: { xPct: 0, yPct: 0, widthPct: 100, heightPct: 100, rotation: 0, zIndex: -1, opacity: 1 },
        content: {},
      },
      input.preset,
      input.backgroundImageUrl,
    );

    context.fillStyle = 'rgba(5, 5, 5, 0.18)';
    context.fillRect(0, 0, input.preset.width, input.preset.height);
  }

  const ordered = [...input.layers]
    .filter((layer) => layer.visible)
    .sort((a, b) => a.transform.zIndex - b.transform.zIndex);

  for (const layer of ordered) {
    if ((layer.type === 'image' || layer.type === 'logo') && (layer.content?.imageUrl || layer.sourceAssetId)) {
      const imageUrl =
        typeof layer.content?.imageUrl === 'string'
          ? layer.content.imageUrl
          : layer.sourceAssetId
            ? input.assetImageUrls[layer.sourceAssetId]
            : null;
      if (imageUrl) {
        await drawImageLayer(context, layer, input.preset, imageUrl);
      }
      continue;
    }

    if (layer.type === 'text') {
      drawTextLayer(context, layer, input.preset);
      continue;
    }

    if (layer.type === 'shape') {
      drawShapeLayer(context, layer, input.preset);
      continue;
    }

    if (layer.type === 'brand-block') {
      drawBrandBlock(context, layer, input.preset);
      continue;
    }

    if (layer.type === 'product-card') {
      drawProductCard(context, layer, input.preset);
    }
  }

  return canvas.toDataURL('image/png');
}
