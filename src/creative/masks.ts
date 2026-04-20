import type { CreativeApplicationMode } from './engine';
import type { CreativeMaskVectorData } from './contracts';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createSuggestedMaskVector(input: {
  focusPoint?: { x: number; y: number } | null;
  applicationMode: CreativeApplicationMode;
}) {
  const focus = input.focusPoint ?? { x: 0.5, y: 0.54 };
  const x = clamp(focus.x, 0.08, 0.92);
  const y = clamp(focus.y, 0.12, 0.9);

  const radii: Record<CreativeApplicationMode, { rx: number; ry: number }> = {
    'full-wall': { rx: 0.34, ry: 0.4 },
    'feature-wall': { rx: 0.22, ry: 0.34 },
    backsplash: { rx: 0.28, ry: 0.12 },
    'facade-panel': { rx: 0.22, ry: 0.3 },
  };

  return {
    kind: 'ellipse',
    focusPoint: { x, y },
    points: [
      { x: x - radii[input.applicationMode].rx, y },
      { x: x, y: y - radii[input.applicationMode].ry },
      { x: x + radii[input.applicationMode].rx, y },
      { x, y: y + radii[input.applicationMode].ry },
    ],
  } satisfies CreativeMaskVectorData;
}

export function createMaskDataUrl(input: {
  width: number;
  height: number;
  vectorData?: CreativeMaskVectorData | null;
  brushStrokes?: Array<{
    mode: 'paint' | 'erase';
    points: Array<{ x: number; y: number }>;
    size: number;
  }>;
}) {
  const canvas = document.createElement('canvas');
  canvas.width = input.width;
  canvas.height = input.height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context unavailable.');
  }

  context.clearRect(0, 0, input.width, input.height);

  const vector = input.vectorData;
  if (vector?.kind === 'ellipse' && vector.focusPoint && vector.points?.length === 4) {
    const rx = Math.abs((vector.points[2]?.x ?? vector.focusPoint.x) - vector.focusPoint.x) * input.width;
    const ry = Math.abs((vector.points[3]?.y ?? vector.focusPoint.y) - vector.focusPoint.y) * input.height;
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.ellipse(vector.focusPoint.x * input.width, vector.focusPoint.y * input.height, rx, ry, 0, 0, Math.PI * 2);
    context.fill();
  } else if (vector?.kind === 'polygon' && vector.points?.length) {
    context.fillStyle = '#ffffff';
    context.beginPath();
    vector.points.forEach((point, index) => {
      const x = point.x * input.width;
      const y = point.y * input.height;
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.closePath();
    context.fill();
  }

  for (const stroke of input.brushStrokes ?? []) {
    context.save();
    context.globalCompositeOperation = stroke.mode === 'paint' ? 'source-over' : 'destination-out';
    context.strokeStyle = '#ffffff';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = stroke.size;
    context.beginPath();
    stroke.points.forEach((point, index) => {
      const x = point.x * input.width;
      const y = point.y * input.height;
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.stroke();
    context.restore();
  }

  return canvas.toDataURL('image/png');
}
