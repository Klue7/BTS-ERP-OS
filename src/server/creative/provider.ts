export interface CreativeProviderResult {
  provider: string;
  result: Record<string, unknown>;
}

export interface CreativeAiProvider {
  backgroundRemoval(input: Record<string, unknown>): Promise<CreativeProviderResult>;
  roomSegmentation(input: Record<string, unknown>): Promise<CreativeProviderResult>;
  roomRestyle(input: Record<string, unknown>): Promise<CreativeProviderResult>;
  autoLayout(input: Record<string, unknown>): Promise<CreativeProviderResult>;
  autoCaption(input: Record<string, unknown>): Promise<CreativeProviderResult>;
  expandImage(input: Record<string, unknown>): Promise<CreativeProviderResult>;
  objectCleanup(input: Record<string, unknown>): Promise<CreativeProviderResult>;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizePrompt(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ').slice(0, 180);
}

class GoogleGenAiCreativeAdapter implements CreativeAiProvider {
  private readonly providerName = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY
    ? 'Google GenAI (deterministic fallback active)'
    : 'Deterministic Creative Fallback';

  async backgroundRemoval(input: Record<string, unknown>): Promise<CreativeProviderResult> {
    const edgeSoftness = typeof input.edgeSoftness === 'number' ? input.edgeSoftness : 0.18;
    const isolationMode = typeof input.isolationMode === 'string' ? input.isolationMode : 'balanced';
    const prompt = normalizePrompt(input.prompt);
    return {
      provider: this.providerName,
      result: {
        recommendedEdgeSoftness: clamp(edgeSoftness, 0.08, 0.28),
        recommendedIsolationMode: isolationMode,
        reviewNote: prompt
          ? `Foreground isolation suggestion prepared with direction: ${prompt}.`
          : 'Foreground isolation suggestion prepared for editor refinement.',
      },
    };
  }

  async roomSegmentation(input: Record<string, unknown>): Promise<CreativeProviderResult> {
    const focus = (input.focusPoint as { x?: number; y?: number } | undefined) ?? {};
    const x = clamp(typeof focus.x === 'number' ? focus.x : 0.5, 0.08, 0.92);
    const y = clamp(typeof focus.y === 'number' ? focus.y : 0.54, 0.12, 0.9);
    const applicationMode = typeof input.applicationMode === 'string' ? input.applicationMode : 'full-wall';
    const prompt = normalizePrompt(input.prompt);

    const sizeByMode: Record<string, { rx: number; ry: number }> = {
      'full-wall': { rx: 0.34, ry: 0.4 },
      'feature-wall': { rx: 0.22, ry: 0.34 },
      backsplash: { rx: 0.28, ry: 0.12 },
      'facade-panel': { rx: 0.22, ry: 0.3 },
    };
    const size = sizeByMode[applicationMode] ?? sizeByMode['full-wall'];

    return {
      provider: this.providerName,
      result: {
        maskMode: 'ellipse',
        focusPoint: { x, y },
        radiusXPct: size.rx,
        radiusYPct: size.ry,
        confidence: 0.82,
        reviewNote: prompt
          ? `Suggested wall plane mask tuned for: ${prompt}.`
          : 'Suggested wall plane mask ready for brush refine.',
      },
    };
  }

  async roomRestyle(input: Record<string, unknown>): Promise<CreativeProviderResult> {
    const prompt = normalizePrompt(input.prompt);
    return {
      provider: this.providerName,
      result: {
        recommendedBlend: clamp(typeof input.blend === 'number' ? input.blend : 0.72, 0.45, 0.86),
        recommendedScale: clamp(typeof input.scale === 'number' ? input.scale : 1, 0.82, 1.28),
        recommendedContrast: clamp(typeof input.contrast === 'number' ? input.contrast : 1, 0.88, 1.24),
        reviewNote: prompt
          ? `Restyle settings tuned for believable material placement and direction: ${prompt}.`
          : 'Restyle settings tuned for believable material placement.',
      },
    };
  }

  async autoLayout(input: Record<string, unknown>): Promise<CreativeProviderResult> {
    const prompt = normalizePrompt(input.prompt);
    const promptSuffix = prompt ? ` Direction: ${prompt}.` : '';
    return {
      provider: this.providerName,
      result: {
        headline: input.productName ? `${input.productName}` : 'BTS Signature Material',
        body: input.productCategory
          ? `Premium ${input.productCategory} arranged for campaign-safe layout.${promptSuffix}`
          : `Premium material arranged for campaign-safe layout.${promptSuffix}`,
        cta: 'View Range',
        reviewNote: prompt
          ? `Starter layout and copy prepared from document context with direction: ${prompt}.`
          : 'Starter layout and copy prepared from document context.',
      },
    };
  }

  async autoCaption(input: Record<string, unknown>): Promise<CreativeProviderResult> {
    const productName = typeof input.productName === 'string' ? input.productName : 'BTS material';
    const destination = typeof input.destination === 'string' ? input.destination : 'campaign';
    const prompt = normalizePrompt(input.prompt);
    return {
      provider: this.providerName,
      result: {
        caption: prompt
          ? `${productName} shaped for ${destination.toLowerCase()} storytelling with premium BTS presentation. ${prompt}`
          : `${productName} shaped for ${destination.toLowerCase()} storytelling with premium BTS presentation.`,
      },
    };
  }

  async expandImage(input: Record<string, unknown>): Promise<CreativeProviderResult> {
    return {
      provider: this.providerName,
      result: {
        targetPreset: typeof input.targetPreset === 'string' ? input.targetPreset : 'Home Hero',
        reviewNote: 'Canvas expansion request recorded for controlled resize/export flow.',
      },
    };
  }

  async objectCleanup(input: Record<string, unknown>): Promise<CreativeProviderResult> {
    return {
      provider: this.providerName,
      result: {
        reviewNote: 'Cleanup request recorded. Use editor review before saving derivative output.',
        target: input.target ?? 'selection',
      },
    };
  }
}

export function getCreativeAiProvider(): CreativeAiProvider {
  return new GoogleGenAiCreativeAdapter();
}
