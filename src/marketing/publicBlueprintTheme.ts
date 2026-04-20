import type {
  MarketingBlueprintConfig,
  MarketingBlueprintSlot,
  MarketingBlueprintSlotKind,
  MarketingTemplateSummary,
} from './contracts';

export function getBlueprintSlot(
  config: MarketingBlueprintConfig | null | undefined,
  kind: MarketingBlueprintSlotKind,
) {
  return config?.slots.find((slot) => slot.kind === kind && slot.enabled) ?? null;
}

export function resolveBlueprintAccentColor(
  template: MarketingTemplateSummary | null | undefined,
) {
  switch (template?.blueprintConfig.style.colorTreatment) {
    case 'Seasonal Warm':
      return '#f59e0b';
    case 'Stone Neutral':
      return '#d6d3d1';
    case 'Emerald Promo':
      return '#34d399';
    case 'Brand Dark':
    default:
      return '#1DB954';
  }
}

export function resolveBlueprintPanelClasses(
  template: MarketingTemplateSummary | null | undefined,
) {
  switch (template?.blueprintConfig.style.overlayMode) {
    case 'Glass Panel':
      return 'border-white/12 bg-white/[0.045] backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.4)]';
    case 'Solid Wash':
      return 'border-white/8 bg-black/55 backdrop-blur-lg shadow-[0_24px_70px_rgba(0,0,0,0.42)]';
    case 'None':
      return 'border-white/5 bg-transparent backdrop-blur-0 shadow-none';
    case 'Gradient Lift':
    default:
      return 'border-white/10 bg-black/20 backdrop-blur-md shadow-[0_24px_80px_rgba(0,0,0,0.32)]';
  }
}

export function resolveBlueprintBackdropClasses(
  template: MarketingTemplateSummary | null | undefined,
) {
  switch (template?.blueprintConfig.style.backgroundTreatment) {
    case 'Texture Wash':
      return 'bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.07),transparent_32%),radial-gradient(circle_at_85%_25%,rgba(29,185,84,0.16),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.28))]';
    case 'Soft Vignette':
      return 'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_45%),radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.42)_100%)]';
    case 'Blurred Backplate':
      return 'bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_70%_40%,rgba(29,185,84,0.14),transparent_35%),linear-gradient(120deg,rgba(255,255,255,0.03),rgba(0,0,0,0.3))]';
    case 'Source Image':
    default:
      return 'bg-[radial-gradient(circle_at_20%_20%,rgba(29,185,84,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.06),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.24))]';
  }
}

export function resolveBlueprintHeadingClasses(
  template: MarketingTemplateSummary | null | undefined,
) {
  switch (template?.blueprintConfig.style.typographyPreset) {
    case 'Campaign Sans':
      return "font-['Anton'] uppercase tracking-[0.02em]";
    case 'Editorial Contrast':
      return 'font-[var(--font-serif)] tracking-[-0.05em]';
    case 'Serif Display':
    default:
      return 'font-[var(--font-serif)] tracking-[-0.045em]';
  }
}

export function resolveSlotMaxWidth(
  slot: MarketingBlueprintSlot | null,
  fallbackRem: number,
) {
  const widthPct = slot?.widthPct ?? 100;
  return `${Math.max(14, Math.round((fallbackRem * widthPct) / 100))}rem`;
}
