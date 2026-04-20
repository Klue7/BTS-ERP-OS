import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  ChevronRight,
  Building2,
  MapPin,
  Calendar,
  Save,
  X,
  FileSpreadsheet,
  Send,
  Link as LinkIcon,
  Wand2,
  AlertTriangle,
  ArrowRight,
  User,
  Users,
  Tag,
  Quote,
  ExternalLink,
  Globe,
  Activity,
  Mail,
  RefreshCw,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import type { InventoryUiProduct } from '../inventory/useInventoryPortalData';
import { useTenderDeskData } from '../tenders/useTenderDeskData';
import type {
  ParsedTenderUpload,
  TenderBoqLine,
  TenderBoqSummary,
  TenderDocumentSummary,
  TenderMemberResponseSummary,
  TenderOpportunitySummary,
  TenderProjectMetadata,
  TenderQuoteSummary,
  TenderSubmissionSummary,
  TenderSource,
  TenderProjectType,
} from '../tenders/contracts';
import { usePdfPreview } from './PdfPreviewContext';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value).replace('ZAR', 'R').trim();
}

function formatCompactValue(value: number | null) {
  if (value === null) {
    return 'TBD';
  }
  if (value >= 1_000_000) {
    return `R${(value / 1_000_000).toFixed(1)}m`;
  }
  if (value >= 1_000) {
    return `R${Math.round(value / 1_000)}k`;
  }
  return `R${Math.round(value)}`;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatRelative(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const diffMs = Date.now() - parsed.getTime();
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(value);
}

function renderMetadataTags(metadata?: TenderProjectMetadata | null) {
  if (!metadata) {
    return [];
  }
  const tags: string[] = [];
  if (metadata.tenderNumber) tags.push(`Ref ${metadata.tenderNumber}`);
  if (metadata.siteAddress) tags.push(`Site ${metadata.siteAddress}`);
  if (metadata.deliveryAddress) tags.push(`Delivery ${metadata.deliveryAddress}`);
  if (metadata.briefingDate) tags.push(`Briefing ${metadata.briefingDate}`);
  if (metadata.drawingReferences.length) tags.push(`${metadata.drawingReferences.length} drawing ref${metadata.drawingReferences.length === 1 ? '' : 's'}`);
  if (metadata.detectedMaterials.length) tags.push(metadata.detectedMaterials.join(', '));
  return tags.slice(0, 4);
}

type TenderQuotePreview = {
  lines: Array<{
    boqLineId: string;
    boqDescription: string;
    productId: string;
    productName: string;
    quantity: number;
    quantityLabel: string;
    unitCostZar: number;
    unitRateZar: number;
    lineCostZar: number;
    lineTotalZar: number;
  }>;
  valueZar: number;
  costZar: number;
  marginPct: number;
};

function buildTenderQuotePreview(
  boq: TenderBoqSummary | null,
  products: InventoryUiProduct[],
  discountPct: number,
  markupPct: number,
): TenderQuotePreview {
  if (!boq) {
    return { lines: [], valueZar: 0, costZar: 0, marginPct: 0 };
  }

  const rateMultiplier = Math.max(0, (1 + markupPct / 100) * (1 - discountPct / 100));
  const lines = boq.lines
    .filter((line) => line.matchStatus === 'Mapped' && line.suggestedProductId)
    .map((line) => {
      const product = products.find((record) => record.id === line.suggestedProductId);
      if (!product) {
        return null;
      }
      const unitCostZar = Number.isFinite(product.cost) ? product.cost : 0;
      const unitRateZar = Math.round(product.price * rateMultiplier * 100) / 100;
      return {
        boqLineId: line.id,
        boqDescription: line.description,
        productId: product.id,
        productName: product.name,
        quantity: line.quantity,
        quantityLabel: line.quantityLabel,
        unitCostZar,
        unitRateZar,
        lineCostZar: Math.round(unitCostZar * line.quantity * 100) / 100,
        lineTotalZar: Math.round(unitRateZar * line.quantity * 100) / 100,
      };
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));

  const valueZar = Math.round(lines.reduce((sum, line) => sum + line.lineTotalZar, 0) * 100) / 100;
  const costZar = Math.round(lines.reduce((sum, line) => sum + line.lineCostZar, 0) * 100) / 100;
  const marginPct = valueZar > 0 ? Math.round((((valueZar - costZar) / valueZar) * 100) * 10) / 10 : 0;

  return { lines, valueZar, costZar, marginPct };
}

type QuoteDeskDisplayLine = {
  key: string;
  boqDescription: string;
  productName: string;
  quantityLabel: string;
  unitRateZar: number;
  lineTotalZar: number;
};

function resolveQuoteDeskDisplayLines(
  quote: TenderQuoteSummary,
  boqs: TenderBoqSummary[],
  products: InventoryUiProduct[],
): QuoteDeskDisplayLine[] {
  if (quote.mappedItems.length) {
    return quote.mappedItems.map((item) => ({
      key: item.boqLineId,
      boqDescription: item.boqDescription,
      productName: item.productName,
      quantityLabel: item.quantityLabel,
      unitRateZar: item.unitRateZar,
      lineTotalZar: item.lineTotalZar,
    }));
  }

  const relatedBoq = quote.boqId
    ? boqs.find((boq) => boq.id === quote.boqId)
    : boqs
      .filter((boq) => boq.tenderId === quote.tenderId)
      .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))[0] ?? null;

  if (!relatedBoq) {
    return [];
  }

  return buildTenderQuotePreview(
    relatedBoq,
    products,
    quote.discountPct ?? 0,
    quote.markupPct ?? 25,
  ).lines.map((line) => ({
    key: line.boqLineId,
    boqDescription: line.boqDescription,
    productName: line.productName,
    quantityLabel: line.quantityLabel,
    unitRateZar: line.unitRateZar,
    lineTotalZar: line.lineTotalZar,
  }));
}

const WizardModal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.25 }}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-6">
          <h2 className="text-xl font-serif font-bold tracking-tight text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="custom-scrollbar relative flex-1 overflow-y-auto p-8">{children}</div>
      </motion.div>
    </div>
  );
};

type IntakeDocumentKind = 'BOQ' | 'RFQ' | 'Tender Document' | 'Architectural Drawing' | 'Supporting Document';

function inferIntakeDocumentKind(document: ParsedTenderUpload): IntakeDocumentKind {
  const haystack = [
    document.upload.fileName,
    document.analysisSummary ?? '',
    document.extractedMetadata?.scopeSummary ?? '',
    ...(document.extractedMetadata?.drawingReferences ?? []),
    ...(document.extractedMetadata?.detectedMaterials ?? []),
  ].join(' ').toLowerCase();

  if (document.upload.mimeType.startsWith('image/')) {
    return 'Architectural Drawing';
  }
  if (haystack.includes('bill of quantities') || /\bboq\b/.test(haystack)) {
    return 'BOQ';
  }
  if (/\brfq\b/.test(haystack) || haystack.includes('request for quotation')) {
    return 'RFQ';
  }
  if (haystack.includes('drawing') || haystack.includes('layout plan') || haystack.includes('elevation')) {
    return 'Architectural Drawing';
  }
  if (haystack.includes('specification') || haystack.includes('supporting')) {
    return 'Supporting Document';
  }
  return 'Tender Document';
}

const TendersOverview = ({
  metrics,
  opportunities,
  boqs,
  onOpenBoq,
  onOpenQuote,
  onOpenDetail,
}: {
  metrics: ReturnType<typeof useTenderDeskData>['snapshot']['metrics'];
  opportunities: TenderOpportunitySummary[];
  boqs: TenderBoqSummary[];
  onOpenBoq: (tenderId?: string) => void;
  onOpenQuote: (tenderId?: string) => void;
  onOpenDetail: (tenderId: string) => void;
}) => {
  const recentOpportunities = opportunities.slice(0, 3);
  const flaggedBoq = boqs.find((boq) => boq.status === 'Review Needed');
  const nextDueOpportunity = [...opportunities]
    .sort((left, right) => left.closeDate.localeCompare(right.closeDate))
    .find((opportunity) => opportunity.stage !== 'Submitted' && opportunity.stage !== 'Awarded' && opportunity.stage !== 'Lost');

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {[
          { label: 'Active Tenders', value: metrics.activeTenders, icon: Building2, color: 'text-blue-400' },
          { label: 'BOQs to Review', value: metrics.boqsToReview, icon: FileSpreadsheet, color: 'text-amber-400' },
          { label: 'Draft Quotes', value: metrics.draftQuotes, icon: FileText, color: 'text-purple-400' },
          { label: 'Submissions Due (7d)', value: metrics.submissionsDueSoon, icon: Clock, color: 'text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className="group rounded-2xl border border-white/5 bg-[#0f0f0f] p-6 transition-all hover:border-white/10">
            <div className="mb-4 flex items-center justify-between">
              <div className={`rounded-lg bg-white/5 p-2 transition-colors group-hover:bg-white/10 ${stat.color}`}>
                <stat.icon size={16} />
              </div>
            </div>
            <div className="mb-1 font-mono text-3xl font-bold tracking-tighter text-white">{stat.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0f0f0f]">
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Recent Opportunities</h3>
            <button className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:underline">View All</button>
          </div>
          <div className="divide-y divide-white/5">
            {recentOpportunities.map((tender) => (
              <button key={tender.id} onClick={() => onOpenDetail(tender.id)} className="group flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-white/[0.02]">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[8px] font-mono uppercase text-white/40">{tender.source}</span>
                    <span className="text-sm font-bold text-white transition-colors group-hover:text-[#00ff88]">{tender.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-white/40">
                    <span className="flex items-center gap-1"><Building2 size={10} /> {tender.client}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> Closes: {formatDate(tender.closeDate)}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/20 transition-colors group-hover:text-white" />
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0f0f0f]">
          <div className="border-b border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Action Required</h3>
          </div>
          <div className="space-y-4 p-6">
            {flaggedBoq ? (
              <div className="flex items-start gap-4 rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <div className="mb-1 text-xs font-bold text-amber-400">BOQ Ambiguities Detected</div>
                  <div className="mb-3 text-[10px] leading-relaxed text-white/60">
                    {flaggedBoq.tenderTitle} has {flaggedBoq.ambiguousLines} ambiguous line{flaggedBoq.ambiguousLines === 1 ? '' : 's'} and {flaggedBoq.unmappedLines} unmapped line{flaggedBoq.unmappedLines === 1 ? '' : 's'}.
                  </div>
                  <button onClick={() => onOpenBoq(flaggedBoq.tenderId)} className="text-[10px] font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300">
                    Review BOQ &rarr;
                  </button>
                </div>
              </div>
            ) : null}
            {nextDueOpportunity ? (
              <div className="flex items-start gap-4 rounded-xl border border-red-500/10 bg-red-500/5 p-4">
                <Clock size={16} className="mt-0.5 shrink-0 text-red-400" />
                <div>
                  <div className="mb-1 text-xs font-bold text-red-400">Submission Deadline Approaching</div>
                  <div className="mb-3 text-[10px] leading-relaxed text-white/60">
                    {nextDueOpportunity.title} closes on {formatDate(nextDueOpportunity.closeDate)} and is currently in {nextDueOpportunity.stage}.
                  </div>
                  <button onClick={() => onOpenQuote(nextDueOpportunity.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300">
                    Finalize Quote &rarr;
                  </button>
                </div>
              </div>
            ) : null}
            {!flaggedBoq && !nextDueOpportunity ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-[10px] uppercase tracking-widest text-white/30">
                No urgent tender actions are blocked right now.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const TendersOpportunities = ({
  opportunities,
  onOpenBoq,
  onOpenQuote,
  onOpenDetail,
}: {
  opportunities: TenderOpportunitySummary[];
  onOpenBoq: (tenderId?: string) => void;
  onOpenQuote: (tenderId?: string) => void;
  onOpenDetail: (tenderId: string) => void;
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search tenders, clients, or references..."
            className="w-80 rounded-xl border border-white/5 bg-[#0f0f0f] py-2.5 pl-9 pr-4 text-xs text-white transition-all focus:border-[#00ff88]/30 focus:outline-none"
          />
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#0f0f0f] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/60 transition-all hover:border-white/10 hover:text-white">
          <Filter size={14} /> Filter
        </button>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/30">
        <span>Showing {opportunities.length} Opportunities</span>
      </div>
    </div>

    <div className="space-y-3">
      {opportunities.map((tender) => (
        <motion.div
          key={tender.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f0f0f] p-6 transition-all hover:border-[#00ff88]/30"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#00ff88]/0 to-transparent transition-all group-hover:from-[#00ff88]/[0.02]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-white/40">{tender.id}</span>
                <div className="flex items-center gap-1.5 rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-blue-400">
                  <Globe size={10} /> {tender.source}
                </div>
                <div className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">
                  <Tag size={10} /> {tender.type}
                </div>
                <div className={`flex items-center gap-1.5 rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                  tender.stage === 'Quoting'
                    ? 'border-purple-500/20 bg-purple-500/10 text-purple-400'
                    : tender.stage === 'BOQ Review'
                      ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                      : 'border-white/10 bg-white/5 text-white/40'
                }`}>
                  <Activity size={10} /> {tender.stage}
                </div>
                {tender.memberAccess.gapLines.length > 0 ? (
                  <div className="flex items-center gap-1.5 rounded border border-[#00ff88]/20 bg-[#00ff88]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#7dffc1]">
                    <Users size={10} /> {tender.memberAccess.gapLines.length} Member Scope
                  </div>
                ) : null}
              </div>

              <h3 className="mb-3 truncate text-xl font-serif font-bold text-white transition-colors group-hover:text-[#00ff88]">
                {tender.title}
              </h3>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[11px] font-medium text-white/40">
                <span className="flex items-center gap-2"><Building2 size={14} className="text-white/20" /> {tender.client}</span>
                <span className="flex items-center gap-2"><MapPin size={14} className="text-white/20" /> {tender.location}</span>
                <span className="flex items-center gap-2 font-mono text-amber-400/80"><Clock size={14} /> Closes: {formatDate(tender.closeDate)}</span>
              </div>
            </div>

            <div className="hidden items-center gap-12 border-l border-white/5 px-8 xl:flex">
              <div className="w-32">
                <div className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/20">BOQ Status</div>
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    tender.boqStatus === 'Mapped'
                      ? 'bg-[#00ff88] shadow-[0_0_5px_rgba(0,255,136,0.3)]'
                      : tender.boqStatus === 'Parsed' || tender.boqStatus === 'Pending Review'
                        ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.3)]'
                        : 'bg-red-500'
                  }`} />
                  <span className={`text-[11px] font-bold ${
                    tender.boqStatus === 'Mapped' ? 'text-white' : tender.boqStatus === 'Missing' ? 'text-red-400' : 'text-amber-400'
                  }`}>{tender.boqStatus}</span>
                </div>
              </div>

              <div className="w-32">
                <div className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/20">Project Owner</div>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <User size={10} className="text-white/40" />
                  </div>
                  <span className="text-[11px] font-medium text-white">{tender.owner}</span>
                </div>
              </div>

              <div className="w-24 text-right">
                <div className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/20">Est. Value</div>
                <div className="text-[11px] font-mono font-bold text-white">{formatCompactValue(tender.valueZar)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-white/5 pl-6">
              <button onClick={() => onOpenDetail(tender.id)} className="group/btn rounded-xl border border-white/10 bg-white/5 p-3 text-white/40 transition-all hover:bg-white/10 hover:text-white" title="Open Project">
                <ExternalLink size={16} className="transition-transform group-hover/btn:scale-110" />
              </button>
              <button onClick={() => onOpenBoq(tender.id)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:border-white/20 hover:bg-white/10">
                <FileSpreadsheet size={14} className="text-white/40" /> BOQ
              </button>
              <button onClick={() => onOpenQuote(tender.id)} className="flex items-center gap-2 rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/10 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#00ff88] transition-all hover:bg-[#00ff88]/20">
                <Quote size={14} /> Quote
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const TenderOpportunityDrawer = ({
  tender,
  documents,
  boqs,
  quotes,
  submissions,
  memberResponses,
  isImporting,
  onClose,
  onOpenBoq,
  onOpenQuote,
  onImportSourcePack,
}: {
  tender: TenderOpportunitySummary | null;
  documents: TenderDocumentSummary[];
  boqs: TenderBoqSummary[];
  quotes: TenderQuoteSummary[];
  submissions: TenderSubmissionSummary[];
  memberResponses: TenderMemberResponseSummary[];
  isImporting: boolean;
  onClose: () => void;
  onOpenBoq: (tenderId?: string) => void;
  onOpenQuote: (tenderId?: string) => void;
  onImportSourcePack: (tenderId: string) => void;
}) => {
  if (!tender) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, x: 36 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 36 }}
        transition={{ duration: 0.2 }}
        className="flex h-full w-full max-w-3xl flex-col border-l border-white/10 bg-[#070707]"
      >
        <div className="flex items-start justify-between border-b border-white/5 bg-white/[0.02] px-8 py-6">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-blue-400">
                {tender.source}
              </span>
              <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-white/40">
                {tender.sourceReference ?? tender.id}
              </span>
              <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">
                {tender.stage}
              </span>
            </div>
            <h2 className="truncate text-2xl font-serif font-bold text-white">{tender.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/45">
              <span className="flex items-center gap-2"><Building2 size={12} className="text-white/20" /> {tender.client}</span>
              <span className="flex items-center gap-2"><MapPin size={12} className="text-white/20" /> {tender.location}</span>
              <span className="flex items-center gap-2"><Clock size={12} className="text-amber-400/80" /> Closes {formatDate(tender.closeDate)}</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            {[
              ['Est. Value', formatCompactValue(tender.valueZar)],
              ['Docs Synced', String(documents.length)],
              ['BOQ Status', tender.boqStatus],
              ['Member Leads', String(memberResponses.length)],
              ['Linked CRM', tender.linkedCustomerName ?? 'Pending'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-4">
                <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/30">{label}</div>
                <div className="text-sm font-bold text-white">{value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {tender.sourceUrl ? (
              <button
                type="button"
                onClick={() => window.open(tender.sourceUrl ?? '', '_blank', 'noopener,noreferrer')}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10"
              >
                <Globe size={14} /> Open Source Portal
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onImportSourcePack(tender.id)}
              disabled={isImporting}
              className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-blue-300 transition-all hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={14} className={isImporting ? 'animate-bounce' : ''} /> {isImporting ? 'Importing Pack...' : 'Import Source Pack'}
            </button>
            <button type="button" onClick={() => onOpenBoq(tender.id)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10">
              <FileSpreadsheet size={14} /> Open BOQ Desk
            </button>
            <button type="button" onClick={() => onOpenQuote(tender.id)} className="flex items-center gap-2 rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/10 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#00ff88] transition-all hover:bg-[#00ff88]/20">
              <Quote size={14} /> Open Quote Desk
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.85fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-white/5 bg-[#0f0f0f]">
                <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Source Documents</h3>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/25">{documents.length} files</span>
                </div>
                <div className="divide-y divide-white/5">
                  {documents.length ? documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between gap-4 px-6 py-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-white">{document.fileName}</span>
                          <span className="rounded bg-white/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/40">{document.kind}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-white/40">
                          <span>{formatDate(document.uploadedAt)}</span>
                          <span>{document.providerLabel ?? 'Tender Sync'}</span>
                          <span className={document.analysisStatus === 'Parsed' ? 'text-[#00ff88]' : 'text-amber-400'}>{document.analysisStatus}</span>
                          <span className={document.importStatus === 'Imported' ? 'text-blue-300' : 'text-white/30'}>{document.importStatus}</span>
                        </div>
                        {document.analysisSummary ? (
                          <p className="mt-2 text-[11px] leading-relaxed text-white/50">{document.analysisSummary}</p>
                        ) : null}
                        {document.extractedMetadata ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {renderMetadataTags(document.extractedMetadata).map((tag) => (
                              <span key={`${document.id}-${tag}`} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white/45">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {document.importedAssetUrl ? (
                          <button
                            type="button"
                            onClick={() => window.open(document.importedAssetUrl ?? '', '_blank', 'noopener,noreferrer')}
                            className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-200 transition-all hover:bg-blue-500/20"
                          >
                            Open Internal
                          </button>
                        ) : null}
                        {document.sourceUrl ? (
                          <button
                            type="button"
                            onClick={() => window.open(document.sourceUrl ?? '', '_blank', 'noopener,noreferrer')}
                            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10"
                          >
                            Open Source
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )) : (
                    <div className="px-6 py-8 text-center text-[10px] uppercase tracking-widest text-white/30">
                      No RFQ/BOQ/source files have been synced onto this opportunity yet.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-white/5 bg-[#0f0f0f]">
                <div className="border-b border-white/5 bg-white/[0.02] px-6 py-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Tracking & Handoff</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-3">
                  <div className="rounded-xl border border-white/5 bg-black/30 p-4">
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/30">BOQ Files</div>
                    <div className="text-lg font-bold text-white">{boqs.length}</div>
                    <div className="mt-2 text-[10px] text-white/45">{boqs[0]?.reviewNote ?? 'No BOQ uploaded yet.'}</div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-black/30 p-4">
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/30">Quote Drafts</div>
                    <div className="text-lg font-bold text-white">{quotes.length}</div>
                    <div className="mt-2 text-[10px] text-white/45">{quotes[0] ? `Latest: ${quotes[0].status}` : 'No tender quote drafted yet.'}</div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-black/30 p-4">
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/30">Submissions</div>
                    <div className="text-lg font-bold text-white">{submissions.length}</div>
                    <div className="mt-2 text-[10px] text-white/45">{submissions[0] ? `Latest: ${submissions[0].status}` : 'No submission record yet.'}</div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/5 bg-[#0f0f0f]">
                <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Member Quote Access</h3>
                  <span className="rounded-full border border-[#00ff88]/20 bg-[#00ff88]/10 px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-[#7dffc1]">
                    {tender.memberAccess.accessLabel}
                  </span>
                </div>
                <div className="space-y-5 px-6 py-5">
                  <div className="flex flex-wrap gap-2">
                    {tender.memberAccess.requiredRoles.map((role) => (
                      <span key={role} className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-blue-200">
                        {role}
                      </span>
                    ))}
                    {tender.memberAccess.materialTags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white/45">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-white/5 bg-black/30 p-4">
                      <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/30">Quoteable Gaps</div>
                      <div className="text-lg font-bold text-white">{tender.memberAccess.gapLines.length}</div>
                      <div className="mt-2 text-[10px] leading-relaxed text-white/45">
                        {tender.memberAccess.gapLines[0]?.description ?? 'No unresolved member scope detected.'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-black/30 p-4">
                      <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/30">Member Responses</div>
                      <div className="text-lg font-bold text-white">{memberResponses.length}</div>
                      <div className="mt-2 text-[10px] leading-relaxed text-white/45">
                        {memberResponses[0] ? `${memberResponses[0].memberName} · ${memberResponses[0].memberRole}` : 'No member quote pack requests yet.'}
                      </div>
                    </div>
                  </div>
                  {memberResponses.length ? (
                    <div className="space-y-3">
                      {memberResponses.map((response) => (
                        <div key={response.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-bold text-white">{response.companyName || response.memberName}</div>
                              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/35">{response.memberRole} · {response.email}</div>
                            </div>
                            <span className="rounded border border-[#00ff88]/20 bg-[#00ff88]/10 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-[#7dffc1]">{response.status}</span>
                          </div>
                          {response.scopeNote ? <p className="mt-3 text-[11px] leading-relaxed text-white/50">{response.scopeNote}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-6">
                <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/50">Opportunity Detail</h3>
                <div className="space-y-4 text-[11px]">
                  {[
                    ['Opportunity ID', tender.id],
                    ['Source Ref', tender.sourceReference ?? 'Not available'],
                    ['Authority', tender.client],
                    ['Project Type', tender.type],
                    ['Procurement', tender.procurementCategory ?? 'Not available'],
                    ['Status', tender.sourceStatus ?? 'Not available'],
                    ['Location', tender.location],
                    ['Tender Start', tender.tenderStartDate ? formatDate(tender.tenderStartDate) : 'Not available'],
                    ['Close Date', formatDate(tender.closeDate)],
                    ['CRM Profile', tender.linkedCustomerName ?? 'Pending auto-link'],
                    ['Contact', tender.contactName ?? 'Not available'],
                    ['Email', tender.contactEmail ?? 'Not available'],
                    ['Phone', tender.contactPhone ?? 'Not available'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-6 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                      <span className="font-bold uppercase tracking-widest text-white/30">{label}</span>
                      <span className="text-right font-medium text-white/75">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {tender.projectMetadata ? (
                <section className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-6">
                  <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/50">Project Intelligence</h3>
                  <div className="space-y-4 text-[11px]">
                    {[
                      ['Project Name', tender.projectMetadata.projectName ?? 'Not detected'],
                      ['Tender Number', tender.projectMetadata.tenderNumber ?? 'Not detected'],
                      ['Site Address', tender.projectMetadata.siteAddress ?? 'Not detected'],
                      ['Delivery Address', tender.projectMetadata.deliveryAddress ?? 'Not detected'],
                      ['Briefing Date', tender.projectMetadata.briefingDate ?? 'Not detected'],
                      ['Briefing Location', tender.projectMetadata.briefingLocation ?? 'Not detected'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-6 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                        <span className="font-bold uppercase tracking-widest text-white/30">{label}</span>
                        <span className="text-right font-medium text-white/75">{value}</span>
                      </div>
                    ))}
                  </div>
                  {tender.projectMetadata.scopeSummary ? (
                    <div className="mt-5 rounded-xl border border-white/5 bg-black/30 p-4">
                      <div className="mb-2 text-[9px] font-bold uppercase tracking-widest text-white/30">Scope Summary</div>
                      <p className="text-[11px] leading-relaxed text-white/65">{tender.projectMetadata.scopeSummary}</p>
                    </div>
                  ) : null}
                  {tender.projectMetadata.drawingReferences.length || tender.projectMetadata.detectedMaterials.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tender.projectMetadata.drawingReferences.map((reference) => (
                        <span key={reference} className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-blue-200">
                          {reference}
                        </span>
                      ))}
                      {tender.projectMetadata.detectedMaterials.map((material) => (
                        <span key={material} className="rounded-full border border-[#00ff88]/20 bg-[#00ff88]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#7dffc1]">
                          {material}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}

              <section className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-6">
                <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/50">Next Action</h3>
                <div className="space-y-3">
                  {tender.boqStatus === 'Missing' ? (
                    <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-[11px] leading-relaxed text-amber-300">
                      No BOQ is attached internally yet. Open the source documents above, pull the RFQ/BOQ pack, then upload the BOQ into the workspace to start deterministic product mapping.
                    </div>
                  ) : null}
                  {tender.boqStatus !== 'Missing' && quotes.length === 0 ? (
                    <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4 text-[11px] leading-relaxed text-blue-300">
                      BOQ state exists, but no tender quote has been drafted yet. Move into Quote Desk to generate a linked customer quote and margin view.
                    </div>
                  ) : null}
                  {quotes.length > 0 && submissions.length === 0 ? (
                    <div className="rounded-xl border border-[#00ff88]/10 bg-[#00ff88]/5 p-4 text-[11px] leading-relaxed text-[#7dffc1]">
                      Quote is in motion. Finalize exclusions, then create the tender submission record so the opportunity can be tracked through award/loss status.
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const TendersBOQDesk = ({
  boqs,
  onUpload,
  onOpenQuote,
}: {
  boqs: TenderBoqSummary[];
  onUpload: () => void;
  onOpenQuote: (tenderId?: string) => void;
}) => (
  <div className="space-y-8">
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f0f0f] p-8">
      <div className="absolute right-0 top-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-[#00ff88]/[0.02] blur-3xl" />
      <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="mb-1 text-2xl font-serif font-bold text-white">BOQ Processing Desk</h2>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">Operator Workspace & Material Mapping</p>
        </div>

        <div className="relative flex items-center gap-8">
          <div className="flex gap-8 border-x border-white/5 px-8">
            <div className="text-center">
              <div className="font-mono text-2xl font-bold tracking-tighter text-white">{boqs.length}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">Active BOQs</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl font-bold tracking-tighter text-amber-400">{boqs.reduce((sum, boq) => sum + boq.ambiguousLines + boq.unmappedLines, 0)}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">Review Required</div>
            </div>
          </div>
          <button onClick={onUpload} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:border-white/20 hover:bg-white/10">
            <Upload size={14} className="text-[#00ff88]" /> Upload New BOQ
          </button>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4">
      {boqs.map((boq) => (
        <motion.div key={boq.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group rounded-2xl border border-white/5 bg-[#0f0f0f] p-6 transition-all hover:border-white/10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg bg-white/5 p-2 text-white/40 transition-colors group-hover:text-[#00ff88]">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-bold text-white">{boq.tenderTitle}</h3>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-white/20">{boq.id}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-[10px] text-white/40">Uploaded {formatRelative(boq.uploadedAt)}</span>
                    <div className={`flex items-center gap-1.5 rounded border px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${
                      boq.status === 'Mapped'
                        ? 'border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                    }`}>
                      <div className={`h-1 w-1 rounded-full ${boq.status === 'Mapped' ? 'bg-[#00ff88]' : 'bg-amber-400'}`} />
                      {boq.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-12 border-x border-white/5 px-8">
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="font-mono text-xl font-bold tracking-tighter text-white">{boq.totalLines}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-white/20">Total Lines</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-xl font-bold tracking-tighter text-[#00ff88]">{boq.mappedLines}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-white/20">Mapped</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-xl font-bold tracking-tighter text-amber-400">{boq.ambiguousLines + boq.unmappedLines}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-white/20">Review</div>
                </div>
              </div>
            </div>

            <div className="max-w-xs flex-1">
              <div className="space-y-2">
                {(boq.ambiguousLines + boq.unmappedLines) > 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-400/10 bg-amber-400/5 px-3 py-1.5 text-[10px] font-bold text-amber-400">
                    <AlertTriangle size={12} />
                    <span>{boq.ambiguousLines + boq.unmappedLines} Manual Reviews Needed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-[#00ff88]/10 bg-[#00ff88]/5 px-3 py-1.5 text-[10px] font-bold text-[#00ff88]">
                    <CheckCircle2 size={12} />
                    <span>Ready for Quote Generation</span>
                  </div>
                )}
                <div className="text-[10px] leading-relaxed text-white/45">{boq.reviewNote ?? 'BOQ mapped into the tender desk workspace.'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => onOpenQuote(boq.tenderId)} className="group/btn flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:border-white/20 hover:bg-white/10">
                Open Workspace <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>

    <button onClick={onUpload} className="group flex w-full cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/5 p-12 text-center transition-all hover:border-[#00ff88]/20">
      <div className="mb-4 rounded-full bg-white/5 p-4 text-white/20 transition-all group-hover:bg-[#00ff88]/5 group-hover:text-[#00ff88]">
        <Upload size={32} />
      </div>
      <h3 className="mb-2 text-lg font-bold text-white">Drop new BOQ file here</h3>
      <p className="mx-auto max-w-xs text-xs text-white/40">Support for .xlsx, .csv, and .pdf formats. Automated parsing will begin immediately upon upload.</p>
    </button>
  </div>
);

const TendersQuoteDesk = ({
  quotes,
  boqs,
  products,
  onGenerate,
}: {
  quotes: TenderQuoteSummary[];
  boqs: TenderBoqSummary[];
  products: InventoryUiProduct[];
  onGenerate: (tenderId?: string) => void;
}) => {
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const { openPdfPreview } = usePdfPreview();

  return (
  <div className="space-y-8">
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f0f0f] p-8">
      <div className="absolute right-0 top-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-purple-500/[0.02] blur-3xl" />
      <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="mb-1 text-2xl font-serif font-bold text-white">Quote Generation Desk</h2>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">Drafting, Pricing & Margin Analysis</p>
        </div>

        <button onClick={() => onGenerate()} className="flex items-center gap-2 rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/10 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#00ff88] transition-all hover:bg-[#00ff88]/20">
          <Wand2 size={14} /> Auto-Draft from BOQ
        </button>
      </div>
    </div>

    <div className="space-y-6">
      {quotes.map((quote) => {
        const displayLines = resolveQuoteDeskDisplayLines(quote, boqs, products);
        const isExpanded = expandedQuoteId === quote.id;
        const visibleLines = isExpanded ? displayLines : displayLines.slice(0, 5);
        return (
        <motion.div key={quote.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group overflow-hidden rounded-2xl border border-white/5 bg-[#0f0f0f] transition-all hover:border-white/10">
          <div className="flex flex-col justify-between gap-6 border-b border-white/5 bg-white/[0.01] p-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white/5 p-3 text-white/40 transition-colors group-hover:text-purple-400">
                <Quote size={20} />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">{quote.tenderTitle}</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/20">{quote.id}</span>
                  {quote.businessDocumentKey ? (
                    <span className="rounded border border-[#00ff88]/20 bg-[#00ff88]/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#00ff88]">
                      {quote.businessDocumentKey}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-white/40">
                    <Clock size={12} /> Updated {formatRelative(quote.lastUpdated)}
                  </span>
                  <div className={`rounded border px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${
                    quote.status === 'Ready for Review'
                      ? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                      : quote.status === 'Submitted'
                        ? 'border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]'
                        : 'border-white/10 bg-white/5 text-white/40'
                  }`}>
                    {quote.status}
                  </div>
                  {quote.boqId ? (
                    <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/35">
                      {quote.boqId}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/20">Est. Value</div>
                <div className="font-mono text-xl font-bold tracking-tighter text-white">{formatCurrency(quote.valueZar)}</div>
              </div>
              <div className="text-right">
                <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/20">Net Margin</div>
                <div className="font-mono text-xl font-bold tracking-tighter text-[#00ff88]">{quote.marginPct}%</div>
              </div>
              <div className="text-right">
                <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/20">Adjustments</div>
                <div className="font-mono text-[11px] text-white/55">
                  M+{quote.markupPct ?? 25}% / D-{quote.discountPct ?? 0}%
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onGenerate(quote.tenderId)} className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10">
                  Edit Draft
                </button>
                {quote.pdfUrl ? (
                  <button
                    type="button"
                    onClick={() => openPdfPreview({
                      url: quote.pdfUrl ?? '',
                      title: quote.businessDocumentKey ?? quote.id,
                      subtitle: `${quote.tenderTitle} / ${quote.status}`,
                      fileName: `${quote.businessDocumentKey ?? quote.id}.pdf`,
                    })}
                    className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/10 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#00ff88] transition-all hover:bg-[#00ff88]/20"
                  >
                    Open Quote
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Mapped Materials & BOQ Lines</h4>
                <span className="text-[10px] text-white/20">{displayLines.length} Items Mapped</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/5 bg-black/40">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-4 py-3 font-bold uppercase tracking-widest text-white/20">BOQ Description</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-widest text-white/20">BTS Product Match</th>
                      <th className="px-4 py-3 text-right font-bold uppercase tracking-widest text-white/20">Qty</th>
                      <th className="px-4 py-3 text-right font-bold uppercase tracking-widest text-white/20">Unit Rate</th>
                      <th className="px-4 py-3 text-right font-bold uppercase tracking-widest text-white/20">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {visibleLines.length ? visibleLines.map((item) => (
                      <tr key={item.key} className="transition-colors hover:bg-white/[0.01]">
                        <td className="px-4 py-3 text-white/60">{item.boqDescription}</td>
                        <td className="px-4 py-3 font-medium text-[#00ff88]">{item.productName}</td>
                        <td className="px-4 py-3 text-right font-mono text-white/60">{item.quantityLabel}</td>
                        <td className="px-4 py-3 text-right font-mono text-white/60">{formatCurrency(item.unitRateZar)}</td>
                        <td className="px-4 py-3 text-right font-mono text-white">{formatCurrency(item.lineTotalZar)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-[11px] text-white/35">
                          No mapped quote lines are stored for this draft yet. Reopen the draft from the linked BOQ to rebuild the line set.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {displayLines.length > 5 ? (
                  <div className="border-t border-white/5 bg-white/[0.01] p-3 text-center">
                    <button
                      type="button"
                      onClick={() => setExpandedQuoteId((current) => current === quote.id ? null : quote.id)}
                      className="text-[9px] font-bold uppercase tracking-widest text-white/30 transition-colors hover:text-white"
                    >
                      {isExpanded ? 'Show Less' : `View All ${displayLines.length} Items`} &rarr;
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Exclusions & Assumptions</h4>
                <div className="space-y-2">
                  {quote.exclusions.map((note) => (
                    <div key={note} className="flex items-start gap-2 text-[10px] leading-relaxed text-white/60">
                      <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/20" />
                      {note}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Margin Preview</h4>
                <div className="space-y-3 rounded-xl border border-white/5 bg-black/40 p-4">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/40">Product Cost</span>
                    <span className="font-mono text-white">{formatCurrency(quote.costZar)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/40">Quote Value</span>
                    <span className="font-mono text-white">{formatCurrency(quote.valueZar)}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between text-[11px] font-bold text-[#00ff88]">
                    <span>Net Margin ({quote.marginPct}%)</span>
                    <span className="font-mono">+{formatCurrency(quote.valueZar - quote.costZar)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )})}
      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-white/20">
            <Quote size={24} />
          </div>
          <h3 className="text-lg font-serif font-bold uppercase tracking-tight text-white">No Tender Quotes Yet</h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-white/30">Upload and map a BOQ, then generate a tender quote draft that also creates the underlying customer quote document.</p>
        </div>
      ) : null}
    </div>
  </div>
);
};

const TendersSubmissionTracker = ({
  submissions,
  onSubmit,
}: {
  submissions: TenderSubmissionSummary[];
  onSubmit: (quoteId?: string) => void;
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-white">Submission Tracker</h2>
      <button type="button" onClick={() => onSubmit()} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10">
        <Send size={14} /> New Submission
      </button>
    </div>

    <div className="grid grid-cols-1 gap-4">
      {submissions.map((submission) => (
        <div key={submission.id} className="group flex flex-col justify-between gap-6 rounded-2xl border border-white/5 bg-[#0f0f0f] p-6 transition-all hover:border-white/10 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="text-sm font-bold text-white transition-colors group-hover:text-blue-400">{submission.tenderTitle}</span>
              <span className="text-[10px] font-mono text-white/40">{submission.id}</span>
              {submission.quoteBusinessDocumentKey ? (
                <span className="rounded border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-blue-300">
                  {submission.quoteBusinessDocumentKey}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-4 text-[10px] text-white/40">
              <span>Submitted: {formatDate(submission.submittedAt)}</span>
              <span className={`rounded border px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${
                submission.status === 'Clarification Requested'
                  ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                  : submission.status === 'Awarded'
                    ? 'border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]'
                  : 'border-white/10 bg-white/5 text-white/40'
              }`}>{submission.status}</span>
              {submission.attachments.length ? <span>{submission.attachments.length} attachment{submission.attachments.length === 1 ? '' : 's'}</span> : null}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="mb-1 text-[10px] uppercase tracking-widest text-white/30">Response Expected</div>
              <div className={`text-xs font-bold ${submission.responseExpected.toLowerCase().includes('immediate') ? 'text-amber-400' : 'text-white'}`}>{submission.responseExpected}</div>
            </div>
            {submission.quoteValueZar !== null && submission.quoteValueZar !== undefined ? (
              <div className="text-right">
                <div className="mb-1 text-[10px] uppercase tracking-widest text-white/30">Quote Value</div>
                <div className="text-xs font-bold text-white">{formatCurrency(submission.quoteValueZar)}</div>
              </div>
            ) : null}
            <button type="button" onClick={() => onSubmit(submission.quoteId)} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10">
              Update Status
            </button>
          </div>
        </div>
      ))}
      {submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-white/20">
            <Send size={24} />
          </div>
          <h3 className="text-lg font-serif font-bold uppercase tracking-tight text-white">No Tender Submissions Yet</h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-white/30">Submission records appear here once a tender quote is ready and pushed through the tender channel workflow.</p>
        </div>
      ) : null}
    </div>
  </div>
);

const NewTenderWizard = ({
  isOpen,
  onClose,
  onCreate,
  onUploadDocument,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: ReturnType<typeof useTenderDeskData>['createTenderOpportunity'];
  onUploadDocument: ReturnType<typeof useTenderDeskData>['uploadTenderDocument'];
}) => {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<TenderSource>('Direct');
  const [type, setType] = useState<TenderProjectType>('Commercial');
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [owner, setOwner] = useState('Unassigned');
  const [valueZar, setValueZar] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [aiDirection, setAiDirection] = useState('');
  const [documents, setDocuments] = useState<Array<ParsedTenderUpload & { kind: IntakeDocumentKind }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSource('Direct');
      setType('Commercial');
      setTitle('');
      setClient('');
      setLocation('');
      setCloseDate('');
      setOwner('Unassigned');
      setValueZar('');
      setEmail('');
      setPhone('');
      setAiDirection('');
      setDocuments([]);
    }
  }, [isOpen]);

  const handleUpload = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) return;
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(selectedFiles.map((file) => onUploadDocument(file, aiDirection)));
      const mappedUploads: Array<ParsedTenderUpload & { kind: IntakeDocumentKind }> = uploaded.map((document) => ({
        ...document,
        kind: inferIntakeDocumentKind(document),
      }));
      setDocuments((current) => [...current, ...mappedUploads]);
      toast.success(`${uploaded.length} tender document${uploaded.length === 1 ? '' : 's'} attached.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload tender documents.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !client.trim() || !location.trim() || !closeDate) {
      toast.error('Core tender details are required before intake.');
      return;
    }
    setIsSaving(true);
    try {
      await onCreate({
        source,
        type,
        title,
        client,
        location,
        closeDate,
        owner,
        valueZar: valueZar ? Number(valueZar) : null,
        email: email || undefined,
        phone: phone || undefined,
        documents: documents.map((document) => ({
          kind: document.kind,
          fileName: document.upload.fileName,
          mimeType: document.upload.mimeType,
          url: document.upload.url,
          analysisSummary: document.analysisSummary,
          analysisStatus: document.analysisStatus,
          providerLabel: document.providerLabel,
          extractedMetadata: document.extractedMetadata,
        })),
      });
      toast.success('Tender intake saved and linked into CRM.');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create tender opportunity.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <WizardModal isOpen={isOpen} onClose={onClose} title="New Tender Intake">
      <div className="space-y-8">
        <div className="mb-8 flex items-center justify-between">
          {[
            { num: 1, label: 'Core Details' },
            { num: 2, label: 'Documents' },
            { num: 3, label: 'Assignment' },
          ].map((section, index) => (
            <div key={section.num} className="relative flex flex-1 flex-col items-center gap-2">
              <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                step >= section.num ? 'bg-[#00ff88] text-black shadow-[0_0_10px_rgba(0,255,136,0.15)]' : 'border border-white/10 bg-[#0f0f0f] text-white/40'
              }`}>
                {step > section.num ? <CheckCircle2 size={14} /> : section.num}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= section.num ? 'text-white' : 'text-white/40'}`}>{section.label}</span>
              {index < 2 ? <div className={`absolute left-1/2 top-4 -z-0 h-px w-full ${step > section.num ? 'bg-[#00ff88]/30' : 'bg-white/10'}`} /> : null}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step-1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Source Type</label>
                  <select value={source} onChange={(event) => setSource(event.target.value as TenderSource)} className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none">
                    <option>Direct</option>
                    <option>Leads2Business</option>
                    <option>GovProcure</option>
                    <option>Municipal Feed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Project Type</label>
                  <select value={type} onChange={(event) => setType(event.target.value as TenderProjectType)} className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none">
                    <option>Commercial</option>
                    <option>Residential</option>
                    <option>Public / Infrastructure</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Project Title</label>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} type="text" className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none" placeholder="e.g. Sandton Office Park Phase 2" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Client / Authority</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input value={client} onChange={(event) => setClient(event.target.value)} type="text" className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] py-3 pl-11 pr-4 text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none" placeholder="Search existing clients or enter new..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Location</label>
                  <input value={location} onChange={(event) => setLocation(event.target.value)} type="text" className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none" placeholder="Pretoria, Gauteng" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Close Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input value={closeDate} onChange={(event) => setCloseDate(event.target.value)} type="date" className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] py-3 pl-11 pr-4 text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Est. Value (R)</label>
                  <input value={valueZar} onChange={(event) => setValueZar(event.target.value)} type="number" className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none" placeholder="2500000" />
                </div>
              </div>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Primary Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] py-3 pl-11 pr-4 text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Phone</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input value={phone} onChange={(event) => setPhone(event.target.value)} type="text" className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] py-3 pl-11 pr-4 text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">AI Intake Direction</label>
                <textarea value={aiDirection} onChange={(event) => setAiDirection(event.target.value)} rows={3} className="custom-scrollbar w-full resize-none rounded-xl border border-white/10 bg-[#0f0f0f] p-4 text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none" placeholder="Tell the parser what to look for: BOQ items, finishes, scope exclusions, architectural drawing notes..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Tender Documents</label>
                <button type="button" onClick={() => inputRef.current?.click()} className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 p-8 text-center transition-all hover:border-[#00ff88]/30 hover:bg-[#00ff88]/5">
                  <div className="mb-4 rounded-full bg-white/5 p-4 text-white/20 transition-all group-hover:bg-[#00ff88]/10 group-hover:text-[#00ff88]">
                    <Upload size={24} />
                  </div>
                  <div className="mb-1 text-sm font-bold text-white">{isUploading ? 'Uploading...' : 'Drag & Drop Files'}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">PDF, Excel, Word, drawing images (Max 50MB)</div>
                </button>
                <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*" className="hidden" onChange={(event) => { void handleUpload(event.target.files); }} />
              </div>
              {documents.length ? (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
                  {documents.map((document) => (
                    <div key={`${document.upload.sha256}-${document.upload.fileName}`} className="rounded-xl border border-white/5 bg-black/30 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-bold text-white">{document.upload.fileName}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/30">{document.kind} • {document.providerLabel ?? 'Review Engine'}</div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[8px] font-bold uppercase tracking-widest ${
                          document.analysisStatus === 'Parsed' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {document.analysisStatus}
                        </span>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-white/50">{document.analysisSummary ?? 'Document stored for tender intake review.'}</p>
                      {document.extractedMetadata ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {renderMetadataTags(document.extractedMetadata).map((tag) => (
                            <span key={`${document.upload.sha256}-${tag}`} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white/45">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </motion.div>
          ) : null}

          {step === 3 ? (
            <motion.div key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Assign Project Owner</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <select value={owner} onChange={(event) => setOwner(event.target.value)} className="w-full appearance-none rounded-xl border border-white/10 bg-[#0f0f0f] py-3 pl-11 pr-4 text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none">
                    <option>Sarah J.</option>
                    <option>Mike R.</option>
                    <option>Commercial Desk</option>
                    <option>Unassigned</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
                {[
                  ['Project', title || 'Untitled project'],
                  ['Client', client || 'Client not set'],
                  ['Close Date', closeDate ? formatDate(closeDate) : 'Date not set'],
                  ['Documents', `${documents.length} attached`],
                  ['Linked CRM', client ? 'Customer profile will be matched or created automatically' : 'Pending client details'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/40">{label}</span>
                    <span className="text-sm font-bold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-8 flex justify-between border-t border-white/5 pt-6">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((current) => current - 1)} className="rounded-xl bg-white/5 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10">
              Back
            </button>
          ) : <div />}
          {step < 3 ? (
            <button type="button" onClick={() => setStep((current) => current + 1)} className="flex items-center gap-2 rounded-xl bg-[#00ff88] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-[#00cc6e]">
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button type="button" onClick={() => void handleCreate()} disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-[#00ff88] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-[#00cc6e] disabled:opacity-50">
              <Save size={14} /> {isSaving ? 'Intaking...' : 'Intake Tender'}
            </button>
          )}
        </div>
      </div>
    </WizardModal>
  );
};

const BOQUploadWizard = ({
  isOpen,
  onClose,
  opportunities,
  documents,
  boqs,
  products,
  onUpload,
  onPromote,
  onMapLine,
  onOpenQuote,
  initialTenderId,
}: {
  isOpen: boolean;
  onClose: () => void;
  opportunities: TenderOpportunitySummary[];
  documents: TenderDocumentSummary[];
  boqs: TenderBoqSummary[];
  products: InventoryUiProduct[];
  onUpload: ReturnType<typeof useTenderDeskData>['uploadTenderBoq'];
  onPromote: ReturnType<typeof useTenderDeskData>['promoteTenderDocumentToBoq'];
  onMapLine: ReturnType<typeof useTenderDeskData>['updateTenderBoqLine'];
  onOpenQuote: (tenderId?: string) => void;
  initialTenderId?: string | null;
}) => {
  const [step, setStep] = useState(1);
  const [tenderId, setTenderId] = useState('');
  const [parseMode, setParseMode] = useState<'AI Assisted' | 'Manual Mapping'>('AI Assisted');
  const [aiDirection, setAiDirection] = useState('');
  const [uploadedBoq, setUploadedBoq] = useState<TenderBoqSummary | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resolvedTenderIdRef = useRef<string | null>(null);

  const latestBoqForTender = useMemo(() => {
    if (!tenderId) {
      return null;
    }
    return boqs
      .filter((record) => record.tenderId === tenderId)
      .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))[0] ?? null;
  }, [boqs, tenderId]);

  const promotableDocuments = useMemo(() => {
    if (!tenderId) {
      return [];
    }
    return documents.filter((document) =>
      document.opportunityId === tenderId
      && (document.kind === 'BOQ' || document.kind === 'RFQ'));
  }, [documents, tenderId]);

  useEffect(() => {
    if (!isOpen) {
      resolvedTenderIdRef.current = null;
      setStep(1);
      setTenderId(initialTenderId ?? opportunities[0]?.id ?? '');
      setParseMode('AI Assisted');
      setAiDirection('');
      setUploadedBoq(null);
      return;
    }
    setTenderId((current) => current || initialTenderId || opportunities[0]?.id || '');
  }, [initialTenderId, isOpen, opportunities]);

  useEffect(() => {
    if (!isOpen || !tenderId) {
      return;
    }
    if (resolvedTenderIdRef.current === tenderId) {
      return;
    }
    resolvedTenderIdRef.current = tenderId;
    setParseMode('AI Assisted');
    setAiDirection('');
    setUploadedBoq(latestBoqForTender);
    setStep(latestBoqForTender ? 2 : 1);
  }, [isOpen, latestBoqForTender, tenderId]);

  useEffect(() => {
    if (!uploadedBoq) {
      return;
    }
    const refreshedBoq = boqs.find((record) => record.id === uploadedBoq.id) ?? null;
    if (refreshedBoq && refreshedBoq !== uploadedBoq) {
      setUploadedBoq(refreshedBoq);
    }
  }, [boqs, uploadedBoq]);

  const currentBoq = uploadedBoq ?? latestBoqForTender;

  const handleFileUpload = async (files: FileList | null) => {
    const selectedFile = files?.[0];
    if (!selectedFile || !tenderId) {
      return;
    }
    setIsUploading(true);
    try {
      const snapshot = await onUpload(tenderId, selectedFile, { parseMode, aiDirection });
      const boq = snapshot.boqs
        .filter((record) => record.tenderId === tenderId)
        .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))[0] ?? null;
      setUploadedBoq(boq ?? null);
      setStep(2);
      toast.success('BOQ uploaded and parsed into the workspace.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload BOQ.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handlePromoteDocument = async (documentId: string) => {
    if (!tenderId) {
      return;
    }
    setIsPromoting(true);
    try {
      const snapshot = await onPromote(tenderId, {
        documentId,
        parseMode,
        aiDirection,
      });
      const promotedBoq = snapshot.boqs
        .filter((record) => record.tenderId === tenderId)
        .find((record) => record.sourceDocumentId === documentId)
        ?? snapshot.boqs
          .filter((record) => record.tenderId === tenderId)
          .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))[0]
        ?? null;
      setUploadedBoq(promotedBoq);
      setStep(2);
      toast.success('Tender source document promoted into BOQ processing.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to promote tender source document.');
    } finally {
      setIsPromoting(false);
    }
  };

  const continueExistingBoq = () => {
    if (!latestBoqForTender) {
      return;
    }
    setUploadedBoq(latestBoqForTender);
    setStep(2);
  };

  const handleMap = async (line: TenderBoqLine, productId: string) => {
    if (!currentBoq || !productId) return;
    try {
      const snapshot = await onMapLine(currentBoq.id, line.id, { productId });
      const nextBoq = snapshot.boqs.find((record) => record.id === currentBoq.id) ?? null;
      setUploadedBoq(nextBoq);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to map BOQ line.');
    }
  };

  return (
    <WizardModal isOpen={isOpen} onClose={onClose} title="BOQ Processing">
      <div className="space-y-8">
        <div className="mb-8 flex items-center justify-between">
          {[
            { num: 1, label: 'Upload & Parse' },
            { num: 2, label: 'Line Mapping' },
            { num: 3, label: 'Review' },
          ].map((section, index) => (
            <div key={section.num} className="relative flex flex-1 flex-col items-center gap-2">
              <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                step >= section.num ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.15)]' : 'border border-white/10 bg-[#0f0f0f] text-white/40'
              }`}>
                {step > section.num ? <CheckCircle2 size={14} /> : section.num}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= section.num ? 'text-white' : 'text-white/40'}`}>{section.label}</span>
              {index < 2 ? <div className={`absolute left-1/2 top-4 -z-0 h-px w-full ${step > section.num ? 'bg-amber-400/30' : 'bg-white/10'}`} /> : null}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="boq-step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Select Opportunity</label>
                <select value={tenderId} onChange={(event) => setTenderId(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white transition-colors focus:border-amber-400/50 focus:outline-none">
                  {opportunities.map((opportunity) => (
                    <option key={opportunity.id} value={opportunity.id}>{opportunity.title} · {opportunity.client}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setParseMode('AI Assisted')} className={`relative overflow-hidden rounded-xl border p-5 text-left transition-colors ${parseMode === 'AI Assisted' ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/10 bg-[#0f0f0f] hover:border-white/20'}`}>
                  <div className="absolute right-0 top-0 -mr-12 -mt-12 h-24 w-24 rounded-full bg-amber-400/10 blur-xl" />
                  <div className="relative mb-2 flex items-center justify-between">
                    <span className={`text-sm font-bold ${parseMode === 'AI Assisted' ? 'text-amber-400' : 'text-white'}`}>AI Assisted</span>
                    <Wand2 size={16} className={parseMode === 'AI Assisted' ? 'text-amber-400' : 'text-white/40'} />
                  </div>
                  <div className="relative text-[10px] text-white/50">Auto-maps lines to BTS catalog using extracted text and matching heuristics.</div>
                </button>
                <button type="button" onClick={() => setParseMode('Manual Mapping')} className={`rounded-xl border p-5 text-left transition-colors ${parseMode === 'Manual Mapping' ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/10 bg-[#0f0f0f] hover:border-white/20'}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-sm font-bold ${parseMode === 'Manual Mapping' ? 'text-amber-400' : 'text-white'}`}>Manual Mapping</span>
                    <FileText size={16} className={parseMode === 'Manual Mapping' ? 'text-amber-400' : 'text-white/40'} />
                  </div>
                  <div className="text-[10px] text-white/50">Extracts raw lines and leaves operator control over catalog mapping.</div>
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">AI Direction</label>
                <textarea value={aiDirection} onChange={(event) => setAiDirection(event.target.value)} rows={3} className="custom-scrollbar w-full resize-none rounded-xl border border-white/10 bg-[#0f0f0f] p-4 text-sm text-white transition-colors focus:border-amber-400/50 focus:outline-none" placeholder="e.g. prioritize cladding, bricks, special finishes, and highlight ambiguous scope items..." />
              </div>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">BOQ Sources</div>
                {latestBoqForTender ? (
                  <button type="button" onClick={continueExistingBoq} className="flex w-full items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 text-left transition-all hover:bg-amber-400/10">
                    <div>
                      <div className="text-sm font-bold text-amber-300">Continue Existing BOQ</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{latestBoqForTender.fileName} • {latestBoqForTender.mappedLines}/{latestBoqForTender.totalLines} mapped</div>
                    </div>
                    <ChevronRight size={16} className="text-amber-300" />
                  </button>
                ) : null}
                {promotableDocuments.length ? (
                  <div className="space-y-2">
                    {promotableDocuments.map((document) => (
                      <button
                        key={document.id}
                        type="button"
                        onClick={() => void handlePromoteDocument(document.id)}
                        disabled={isPromoting}
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left transition-all hover:border-white/20 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-white">{document.fileName}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{document.kind} • {document.importStatus ?? 'Source Linked'} • {document.analysisStatus}</div>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white/55">
                          {isPromoting ? 'Working' : 'Use Source'}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-4 text-[10px] uppercase tracking-widest text-white/35">
                    No promotable RFQ or BOQ source documents are attached to this tender yet.
                  </div>
                )}
              </div>
              <button type="button" onClick={() => inputRef.current?.click()} className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 p-10 text-center transition-all hover:border-amber-400/30 hover:bg-amber-400/5">
                <div className="mb-4 rounded-full bg-white/5 p-4 text-white/20 transition-all group-hover:bg-amber-400/10 group-hover:text-amber-400">
                  <FileSpreadsheet size={32} />
                </div>
                <div className="mb-2 text-base font-bold text-white">{isUploading ? 'Processing BOQ...' : 'Upload New BOQ Excel/PDF'}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">Will be parsed automatically</div>
              </button>
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.pdf,.txt" className="hidden" onChange={(event) => { void handleFileUpload(event.target.files); }} />
            </motion.div>
          ) : null}

          {step === 2 && currentBoq ? (
            <motion.div key="boq-step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Line Item Mapping</h3>
                <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-mono text-amber-400">
                  {currentBoq.mappedLines}/{currentBoq.totalLines} Mapped
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f]">
                <div className="grid grid-cols-12 gap-4 border-b border-white/5 bg-white/[0.02] p-4 text-[9px] font-bold uppercase tracking-widest text-white/40">
                  <div className="col-span-1">Ref</div>
                  <div className="col-span-4">BOQ Description</div>
                  <div className="col-span-1">Qty</div>
                  <div className="col-span-5">BTS Product Match</div>
                  <div className="col-span-1">Status</div>
                </div>
                <div className="custom-scrollbar max-h-96 divide-y divide-white/5 overflow-y-auto">
                  {currentBoq.lines.map((row) => (
                    <div key={row.id} className="grid grid-cols-12 items-center gap-4 p-4 text-xs transition-colors hover:bg-white/[0.02]">
                      <div className="col-span-1 font-mono text-white/40">{row.reference}</div>
                      <div className="col-span-4 text-white/80">{row.description}</div>
                      <div className="col-span-1 font-mono text-white/60">{row.quantityLabel}</div>
                      <div className="col-span-5">
                        {row.matchStatus === 'Mapped' && row.suggestedProductName ? (
                          <div className="mb-2 flex w-fit items-center gap-2 rounded border border-[#00ff88]/10 bg-[#00ff88]/5 px-2 py-1 text-[#00ff88]">
                            <LinkIcon size={12} /> <span className="font-medium">{row.suggestedProductName}</span>
                          </div>
                        ) : null}
                        <select value={row.suggestedProductId ?? ''} onChange={(event) => { void handleMap(row, event.target.value); }} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[10px] uppercase tracking-widest text-white transition-colors focus:border-amber-400/40 focus:outline-none">
                          <option value="">Search Catalog</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1">
                        {row.matchStatus === 'Mapped' ? <CheckCircle2 size={16} className="text-[#00ff88]" /> : <AlertTriangle size={16} className="text-amber-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}

          {step === 3 && currentBoq ? (
            <motion.div key="boq-step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className={`rounded-2xl border p-8 text-center ${currentBoq.status === 'Mapped' ? 'border-[#00ff88]/10 bg-[#00ff88]/5' : 'border-amber-500/10 bg-amber-500/5'}`}>
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${currentBoq.status === 'Mapped' ? 'bg-[#00ff88]/10' : 'bg-amber-400/10'}`}>
                  {currentBoq.status === 'Mapped' ? <CheckCircle2 size={32} className="text-[#00ff88]" /> : <AlertTriangle size={32} className="text-amber-400" />}
                </div>
                <h3 className={`mb-2 text-xl font-serif font-bold ${currentBoq.status === 'Mapped' ? 'text-[#00ff88]' : 'text-amber-400'}`}>
                  {currentBoq.status === 'Mapped' ? 'BOQ Ready for Quote Generation' : `${currentBoq.ambiguousLines + currentBoq.unmappedLines} Lines Require Manual Review`}
                </h3>
                <p className="mx-auto max-w-md text-sm leading-relaxed text-white/60">
                  {currentBoq.reviewNote ?? 'The BOQ has been saved to the opportunity desk and is ready for the next workflow step.'}
                </p>
              </div>
              {currentBoq.status === 'Mapped' ? (
                <div className="rounded-xl border border-[#00ff88]/10 bg-[#00ff88]/5 p-4 text-[11px] leading-relaxed text-[#7dffc1]">
                  This BOQ is fully mapped. Move directly into Quote Desk to create the linked tender quote.
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-[11px] leading-relaxed text-amber-300">
                  This BOQ is already saved. Close back to BOQ Desk and continue resolving the remaining ambiguous or unmapped lines.
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-8 flex justify-between border-t border-white/5 pt-6">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((current) => current - 1)} className="rounded-xl bg-white/5 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10">
              Back
            </button>
          ) : <div />}
          {step < 3 ? (
            <button type="button" onClick={() => setStep((current) => current + 1)} disabled={!currentBoq && step > 1} className="flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-amber-500 disabled:opacity-50">
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (currentBoq?.status === 'Mapped') {
                  onClose();
                  onOpenQuote(currentBoq.tenderId);
                  return;
                }
                onClose();
              }}
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-amber-500"
            >
              <Save size={14} /> {currentBoq?.status === 'Mapped' ? 'Open Quote Desk' : 'Back to BOQ Desk'}
            </button>
          )}
        </div>
      </div>
    </WizardModal>
  );
};

const QuoteGenerationWizard = ({
  isOpen,
  onClose,
  opportunities,
  boqs,
  products,
  onGenerate,
  initialTenderId,
}: {
  isOpen: boolean;
  onClose: () => void;
  opportunities: TenderOpportunitySummary[];
  boqs: TenderBoqSummary[];
  products: InventoryUiProduct[];
  onGenerate: ReturnType<typeof useTenderDeskData>['createTenderQuoteDraft'];
  initialTenderId?: string | null;
}) => {
  const [step, setStep] = useState(1);
  const [tenderId, setTenderId] = useState('');
  const [selectedBoqId, setSelectedBoqId] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [markupPct, setMarkupPct] = useState(25);
  const [notes, setNotes] = useState('');
  const [selectedExclusions, setSelectedExclusions] = useState<string[]>([
    'Delivery to Site',
    'Offloading',
    'Breakage Allowance',
    'Pallet Returns',
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setTenderId(initialTenderId ?? opportunities[0]?.id ?? '');
      setSelectedBoqId('');
      setDiscountPct(0);
      setMarkupPct(25);
      setNotes('');
      setSelectedExclusions(['Delivery to Site', 'Offloading', 'Breakage Allowance', 'Pallet Returns']);
      return;
    }
    setTenderId(initialTenderId ?? opportunities[0]?.id ?? '');
  }, [initialTenderId, isOpen, opportunities]);

  const eligibleBoqs = useMemo(
    () => boqs.filter((boq) => boq.tenderId === tenderId),
    [boqs, tenderId],
  );

  useEffect(() => {
    if (!eligibleBoqs.length) {
      if (selectedBoqId) {
        setSelectedBoqId('');
      }
      return;
    }
    if (!eligibleBoqs.some((boq) => boq.id === selectedBoqId)) {
      setSelectedBoqId(eligibleBoqs[0].id);
    }
  }, [eligibleBoqs, selectedBoqId]);

  const selectedBoq = eligibleBoqs.find((boq) => boq.id === selectedBoqId) ?? null;
  const quotePreview = useMemo(
    () => buildTenderQuotePreview(selectedBoq, products, discountPct, markupPct),
    [discountPct, markupPct, products, selectedBoq],
  );
  const unresolvedLineCount = selectedBoq ? selectedBoq.unmappedLines + selectedBoq.ambiguousLines : 0;

  const toggleExclusion = (value: string) => {
    setSelectedExclusions((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const handleCreate = async () => {
    if (!tenderId || !selectedBoqId) {
      toast.error('Select an opportunity and mapped BOQ first.');
      return;
    }
    setIsSaving(true);
    try {
      await onGenerate({
        tenderId,
        boqId: selectedBoqId,
        discountPct,
        markupPct,
        exclusions: selectedExclusions,
        notes,
      });
      toast.success('Tender quote draft created and linked to the real quote workflow.');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate tender quote.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <WizardModal isOpen={isOpen} onClose={onClose} title="Quote Generation">
      <div className="space-y-8">
        <div className="mb-8 flex items-center justify-between">
          {[
            { num: 1, label: 'Select Opportunity' },
            { num: 2, label: 'Pricing & Margin' },
            { num: 3, label: 'Exclusions & Notes' },
          ].map((section, index) => (
            <div key={section.num} className="relative flex flex-1 flex-col items-center gap-2">
              <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                step >= section.num ? 'bg-[#00ff88] text-black shadow-[0_0_10px_rgba(0,255,136,0.15)]' : 'border border-white/10 bg-[#0f0f0f] text-white/40'
              }`}>
                {step > section.num ? <CheckCircle2 size={14} /> : section.num}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= section.num ? 'text-white' : 'text-white/40'}`}>{section.label}</span>
              {index < 2 ? <div className={`absolute left-1/2 top-4 -z-0 h-px w-full ${step > section.num ? 'bg-[#00ff88]/30' : 'bg-white/10'}`} /> : null}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="quote-step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Search Opportunities</label>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <select value={tenderId} onChange={(event) => {
                    setTenderId(event.target.value);
                    setSelectedBoqId('');
                  }} className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] py-3 pl-10 pr-4 text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none">
                    {opportunities.map((opportunity) => (
                      <option key={opportunity.id} value={opportunity.id}>{opportunity.title} · {opportunity.client}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Available BOQ Sources</label>
                {eligibleBoqs.length ? (
                  <div className="space-y-2">
                    {eligibleBoqs.map((boq) => {
                      const boqMappedLineCount = boq.lines.filter((line) => line.matchStatus === 'Mapped' && line.suggestedProductId).length;
                      const boqUnresolvedLineCount = boq.unmappedLines + boq.ambiguousLines;
                      return (
                        <button
                          key={boq.id}
                          type="button"
                          onClick={() => setSelectedBoqId(boq.id)}
                          className={`w-full rounded-xl border p-4 text-left transition-all ${selectedBoqId === boq.id ? 'border-[#00ff88]/30 bg-[#00ff88]/5' : 'border-white/10 bg-[#0f0f0f] hover:border-white/20'}`}
                        >
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-white">{boq.fileName}</span>
                            <span className={`text-[10px] font-mono ${boq.status === 'Mapped' ? 'text-[#00ff88]' : 'text-amber-300'}`}>
                              {boq.status === 'Mapped' ? 'Fully Mapped' : 'Partial Review'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-white/45">
                            <span>{boqMappedLineCount}/{boq.totalLines} mapped</span>
                            <span>{boqUnresolvedLineCount} unresolved</span>
                            <span>{formatRelative(boq.uploadedAt)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-[#0f0f0f] p-4 text-[11px] leading-relaxed text-white/40">
                    No BOQ is available for this opportunity yet. Finish BOQ processing first, then return here to draft the quote.
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div key="quote-step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">Total Cost</div>
                  <div className="font-mono text-lg text-white">{formatCurrency(quotePreview.costZar)}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">Quote Value</div>
                  <div className="font-mono text-lg text-white">{formatCurrency(quotePreview.valueZar)}</div>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-[#00ff88]/30 bg-[#00ff88]/5 p-5">
                  <div className="absolute right-0 top-0 -mr-12 -mt-12 h-24 w-24 rounded-full bg-[#00ff88]/10 blur-xl" />
                  <div className="relative mb-1 text-[10px] font-bold uppercase tracking-widest text-[#00ff88]/60">Est. Margin</div>
                  <div className="relative font-mono text-lg text-[#00ff88]">{quotePreview.marginPct.toFixed(1)}%</div>
                </div>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-4">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f]">
                  <div className="grid grid-cols-12 gap-4 border-b border-white/5 bg-white/[0.02] px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-white/40">
                    <div className="col-span-5">Mapped BOQ Line</div>
                    <div className="col-span-3">Product</div>
                    <div className="col-span-1 text-right">Qty</div>
                    <div className="col-span-1 text-right">Rate</div>
                    <div className="col-span-2 text-right">Line Total</div>
                  </div>
                  <div className="custom-scrollbar max-h-72 divide-y divide-white/5 overflow-y-auto">
                    {quotePreview.lines.length ? quotePreview.lines.map((line) => (
                      <div key={line.boqLineId} className="grid grid-cols-12 gap-4 px-4 py-3 text-xs text-white/80">
                        <div className="col-span-5">
                          <div className="truncate font-medium text-white">{line.boqDescription}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/35">{line.boqLineId}</div>
                        </div>
                        <div className="col-span-3 truncate text-white/65">{line.productName}</div>
                        <div className="col-span-1 text-right font-mono text-white/60">{line.quantityLabel}</div>
                        <div className="col-span-1 text-right font-mono text-white/60">{formatCurrency(line.unitRateZar)}</div>
                        <div className="col-span-2 text-right font-mono text-white">{formatCurrency(line.lineTotalZar)}</div>
                      </div>
                    )) : (
                      <div className="px-4 py-6 text-[11px] text-white/40">
                        No mapped BOQ lines are available for pricing yet. Return to BOQ Desk and finish mapping products first.
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-white/10 bg-[#0f0f0f] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Draft Readiness</div>
                  <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-white/65">
                    <div className="flex items-center justify-between">
                      <span>Mapped lines</span>
                      <span className="font-mono text-white">{quotePreview.lines.length}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Unresolved lines</span>
                      <span className={`font-mono ${unresolvedLineCount > 0 ? 'text-amber-300' : 'text-[#00ff88]'}`}>{unresolvedLineCount}</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] leading-relaxed text-white/55">
                    Pricing uses the selected BOQ’s mapped BTS products, live ZAR sell prices, linked supplier costs, and your current global markup/discount adjustments.
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Global Adjustments</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-white/60">Discount (%)</label>
                    <input value={discountPct} onChange={(event) => setDiscountPct(Number(event.target.value) || 0)} type="number" className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] p-3 font-mono text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-white/60">Markup (%)</label>
                    <input value={markupPct} onChange={(event) => setMarkupPct(Number(event.target.value) || 0)} type="number" className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] p-3 font-mono text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none" />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}

          {step === 3 ? (
            <motion.div key="quote-step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Standard Exclusions</label>
                <div className="space-y-2">
                  {['Delivery to Site', 'Offloading', 'Breakage Allowance', 'Pallet Returns'].map((exclusion) => (
                    <label key={exclusion} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-[#0f0f0f] p-3 transition-colors hover:bg-white/[0.02]">
                      <input type="checkbox" checked={selectedExclusions.includes(exclusion)} onChange={() => toggleExclusion(exclusion)} className="accent-[#00ff88]" />
                      <span className="text-sm text-white/80">{exclusion}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Custom Notes</label>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Add specific terms or notes for this quote..." className="custom-scrollbar w-full resize-none rounded-xl border border-white/10 bg-[#0f0f0f] p-4 text-sm text-white transition-colors focus:border-[#00ff88]/50 focus:outline-none" />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-8 flex justify-between border-t border-white/5 pt-6">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((current) => current - 1)} className="rounded-xl bg-white/5 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10">
              Back
            </button>
          ) : <div />}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((current) => current + 1)}
              disabled={(step === 1 && !selectedBoq) || (step === 2 && quotePreview.lines.length === 0)}
              className="flex items-center gap-2 rounded-xl bg-[#00ff88] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-[#00cc6a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button type="button" onClick={() => void handleCreate()} disabled={isSaving || quotePreview.lines.length === 0} className="flex items-center gap-2 rounded-xl bg-[#00ff88] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-[#00cc6a] disabled:opacity-50">
              <Save size={14} /> {isSaving ? 'Saving Draft...' : 'Save Draft Quote'}
            </button>
          )}
        </div>
      </div>
    </WizardModal>
  );
};

const SubmissionWizard = ({
  isOpen,
  onClose,
  quotes,
  onUploadDocument,
  onSubmit,
  initialQuoteId,
}: {
  isOpen: boolean;
  onClose: () => void;
  quotes: TenderQuoteSummary[];
  onUploadDocument: ReturnType<typeof useTenderDeskData>['uploadTenderDocument'];
  onSubmit: ReturnType<typeof useTenderDeskData>['createTenderSubmission'];
  initialQuoteId?: string | null;
}) => {
  const [step, setStep] = useState(1);
  const [quoteId, setQuoteId] = useState('');
  const [channel, setChannel] = useState<'Direct Email' | 'Portal Upload'>('Direct Email');
  const [responseExpected, setResponseExpected] = useState('');
  const [documents, setDocuments] = useState<ParsedTenderUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const eligibleQuotes = useMemo(
    () => quotes.filter((quote) => quote.status === 'Ready for Review' || quote.id === initialQuoteId),
    [initialQuoteId, quotes],
  );

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setQuoteId(initialQuoteId ?? eligibleQuotes[0]?.id ?? '');
      setChannel('Direct Email');
      setResponseExpected('');
      setDocuments([]);
      return;
    }
    setQuoteId(initialQuoteId ?? eligibleQuotes[0]?.id ?? '');
  }, [eligibleQuotes, initialQuoteId, isOpen]);

  const selectedQuote = eligibleQuotes.find((quote) => quote.id === quoteId) ?? null;

  const handleUpload = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) {
      return;
    }
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(selectedFiles.map((file) => onUploadDocument(file)));
      setDocuments((current) => [...current, ...uploaded]);
      toast.success(`${uploaded.length} submission document${uploaded.length === 1 ? '' : 's'} attached.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload submission documents.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleCreate = async () => {
    if (!selectedQuote || !responseExpected) {
      toast.error('Select a quote and expected response date first.');
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit({
        tenderId: selectedQuote.tenderId,
        quoteId: selectedQuote.id,
        channel,
        responseExpected,
        attachments: documents.map((document) => document.upload),
      });
      toast.success('Tender submission recorded and follow-up timeline updated.');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create submission record.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <WizardModal isOpen={isOpen} onClose={onClose} title="Tender Submission">
      <div className="space-y-8">
        <div className="mb-8 flex items-center justify-between">
          {[
            { num: 1, label: 'Select Quote & Docs' },
            { num: 2, label: 'Submission Channel' },
          ].map((section, index) => (
            <div key={section.num} className="relative flex flex-1 flex-col items-center gap-2">
              <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                step >= section.num ? 'bg-blue-400 text-black shadow-[0_0_10px_rgba(96,165,250,0.15)]' : 'border border-white/10 bg-[#0f0f0f] text-white/40'
              }`}>
                {step > section.num ? <CheckCircle2 size={14} /> : section.num}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= section.num ? 'text-white' : 'text-white/40'}`}>{section.label}</span>
              {index < 1 ? <div className={`absolute left-1/2 top-4 -z-0 h-px w-full ${step > section.num ? 'bg-blue-400/30' : 'bg-white/10'}`} /> : null}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="submission-step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Select Approved Quote</label>
                {eligibleQuotes.length ? (
                  <div className="space-y-2">
                  {eligibleQuotes.map((quote) => (
                    <button type="button" key={quote.id} onClick={() => setQuoteId(quote.id)} className={`w-full rounded-xl border p-4 text-left transition-all ${quoteId === quote.id ? 'border-blue-400/30 bg-blue-400/5' : 'border-white/10 bg-[#0f0f0f] hover:border-white/20'}`}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{quote.tenderTitle}</span>
                        <span className="text-xs font-mono text-blue-400">{formatCurrency(quote.valueZar)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/50">
                        <span>{quote.id}</span>
                        {quote.businessDocumentKey ? <span>• {quote.businessDocumentKey}</span> : null}
                        <span>• {quote.mappedItems.length} mapped lines</span>
                        <span>• {quote.status}</span>
                      </div>
                    </button>
                  ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-[#0f0f0f] p-4 text-[11px] leading-relaxed text-white/40">
                    No submission-ready quotes are available yet. Finish quote generation and review first, then return here to submit.
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Additional Documents</label>
                <button type="button" onClick={() => inputRef.current?.click()} className="group flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 p-6 text-center transition-all hover:border-blue-400/30 hover:bg-blue-400/5">
                  <div className="mb-3 rounded-full bg-white/5 p-3 text-white/20 transition-all group-hover:bg-blue-400/10 group-hover:text-blue-400">
                    <Upload size={24} />
                  </div>
                  <div className="mb-1 text-sm font-bold text-white">{isUploading ? 'Uploading documents...' : 'Attach Specs, Certs, or Cover Letter'}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">PDF, DOCX up to 20MB</div>
                </button>
                <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx" className="hidden" onChange={(event) => { void handleUpload(event.target.files); }} />
                {documents.length ? (
                  <div className="space-y-2">
                    {documents.map((document) => (
                      <div key={`${document.upload.sha256}-${document.upload.fileName}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-left">
                        <div>
                          <div className="text-sm font-bold text-white">{document.upload.fileName}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{document.analysisStatus} • {document.providerLabel ?? 'BTS Intake'}</div>
                        </div>
                        <span className="text-[10px] font-mono text-blue-300">{Math.max(1, Math.round(document.upload.size / 1024))} KB</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div key="submission-step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Submission Method</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Direct Email', icon: Mail, description: 'Sends via BTS CRM with tracking.' },
                    { label: 'Portal Upload', icon: Globe, description: 'Marks as submitted externally.' },
                  ].map((option) => (
                    <button key={option.label} onClick={() => setChannel(option.label as 'Direct Email' | 'Portal Upload')} className={`rounded-xl border p-5 text-left transition-colors ${channel === option.label ? 'border-blue-400/30 bg-blue-400/5' : 'border-white/10 bg-[#0f0f0f] hover:border-white/20'}`}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`text-sm font-bold ${channel === option.label ? 'text-blue-400' : 'text-white'}`}>{option.label}</span>
                        <option.icon size={16} className={channel === option.label ? 'text-blue-400' : 'text-white/40'} />
                      </div>
                      <div className="text-[10px] text-white/50">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              {selectedQuote ? (
                <div className="rounded-xl border border-blue-400/15 bg-blue-400/5 p-4 text-[11px] leading-relaxed text-white/65">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold uppercase tracking-widest text-blue-300">Submission Summary</span>
                    <span className="font-mono text-blue-200">{formatCurrency(selectedQuote.valueZar)}</span>
                  </div>
                  <div>{selectedQuote.tenderTitle}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                    {selectedQuote.businessDocumentKey ?? selectedQuote.id} • {documents.length} additional document{documents.length === 1 ? '' : 's'}
                  </div>
                </div>
              ) : null}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Response Expected By</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input value={responseExpected} onChange={(event) => setResponseExpected(event.target.value)} type="date" className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] py-3 pl-10 pr-4 text-sm text-white transition-colors focus:border-blue-400/50 focus:outline-none" />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-8 flex justify-between border-t border-white/5 pt-6">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((current) => current - 1)} className="rounded-xl bg-white/5 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10">
              Back
            </button>
          ) : <div />}
          {step < 2 ? (
            <button type="button" onClick={() => setStep((current) => current + 1)} disabled={!selectedQuote} className="flex items-center gap-2 rounded-xl bg-blue-400 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button type="button" onClick={() => void handleCreate()} disabled={isSaving || !selectedQuote} className="flex items-center gap-2 rounded-xl bg-blue-400 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-blue-500 disabled:opacity-50">
              <Send size={14} /> {isSaving ? 'Submitting...' : 'Submit Tender'}
            </button>
          )}
        </div>
      </div>
    </WizardModal>
  );
};

export const CRMProjectsTenders = ({ products }: { products: InventoryUiProduct[] }) => {
  const tenders = useTenderDeskData();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Opportunities' | 'BOQDesk' | 'QuoteDesk' | 'SubmissionTracker'>('Overview');
  const [isNewTenderWizardOpen, setIsNewTenderWizardOpen] = useState(false);
  const [isBOQUploadWizardOpen, setIsBOQUploadWizardOpen] = useState(false);
  const [isQuoteWizardOpen, setIsQuoteWizardOpen] = useState(false);
  const [isSubmissionWizardOpen, setIsSubmissionWizardOpen] = useState(false);
  const [focusedTenderId, setFocusedTenderId] = useState<string | null>(null);
  const [focusedQuoteId, setFocusedQuoteId] = useState<string | null>(null);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);

  const snapshot = tenders.snapshot;
  const selectedTender = snapshot?.opportunities.find((opportunity) => opportunity.id === selectedTenderId) ?? null;
  const selectedTenderDocuments = snapshot?.documents.filter((document) => document.opportunityId === selectedTenderId) ?? [];
  const selectedTenderBoqs = snapshot?.boqs.filter((boq) => boq.tenderId === selectedTenderId) ?? [];
  const selectedTenderQuotes = snapshot?.quotes.filter((quote) => quote.tenderId === selectedTenderId) ?? [];
  const selectedTenderSubmissions = snapshot?.submissions.filter((submission) => submission.tenderId === selectedTenderId) ?? [];
  const selectedTenderMemberResponses = snapshot?.memberResponses.filter((response) => response.tenderId === selectedTenderId) ?? [];

  const openTenderDetail = (tenderId: string) => {
    setSelectedTenderId(tenderId);
  };

  const openBoqWizard = (tenderId?: string) => {
    setFocusedTenderId(tenderId ?? null);
    setIsBOQUploadWizardOpen(true);
  };

  const openQuoteWizard = (tenderId?: string) => {
    setFocusedTenderId(tenderId ?? null);
    setIsQuoteWizardOpen(true);
  };

  const openSubmissionWizard = (quoteId?: string) => {
    setFocusedQuoteId(quoteId ?? null);
    setIsSubmissionWizardOpen(true);
  };

  const handleGovSync = async () => {
    try {
      const result = await tenders.syncEtenders({});
      toast.success(`eTender sync complete. Imported ${result.imported}, updated ${result.updated}, skipped ${result.skipped}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sync South African eTender feed.');
    }
  };

  const handleImportSourcePack = async (tenderId: string) => {
    try {
      const result = await tenders.importTenderSourcePack(tenderId);
      toast.success(`Tender pack imported. Imported ${result.imported}, auto-promoted ${result.autoPromotedBoqs}, skipped ${result.skipped}, failed ${result.failed}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import tender source pack.');
    }
  };

  if (tenders.isLoading && !snapshot) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">Loading tenders workspace</div>
      </div>
    );
  }

  if (tenders.error && !snapshot) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-xl rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.25em] text-red-300">Projects & Tenders</div>
          <div className="mb-3 text-xl font-serif font-bold uppercase text-white">Workspace could not load</div>
          <p className="mb-6 text-sm text-white/55">{tenders.error}</p>
          <button type="button" onClick={() => void tenders.refresh()} className="rounded-xl bg-[#00ff88] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return null;
  }

  return (
    <div className="flex h-full flex-col space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-serif font-bold uppercase tracking-tighter text-white">Projects & Tenders</h1>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88]">Procurement & Bidding Engine</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void handleGovSync()}
            disabled={tenders.isSaving}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} className={tenders.isSaving ? 'animate-spin' : ''} /> Sync eTender Feed
          </button>
          <button type="button" onClick={() => setIsNewTenderWizardOpen(true)} className="flex items-center gap-2 rounded-xl bg-[#00ff88] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-[#00cc6e]">
            <Plus size={14} /> New Tender
          </button>
        </div>
      </header>

      <div className="custom-scrollbar flex gap-2 overflow-x-auto border-b border-white/5 pb-4">
        {[
          { id: 'Overview', label: 'Overview' },
          { id: 'Opportunities', label: 'Opportunities' },
          { id: 'BOQDesk', label: 'BOQ Desk' },
          { id: 'QuoteDesk', label: 'Quote Desk' },
          { id: 'SubmissionTracker', label: 'Submission Tracker' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`whitespace-nowrap rounded-xl px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'border border-white/20 bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                : 'border border-transparent text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto pb-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full">
            {activeTab === 'Overview' ? (
              <TendersOverview
                metrics={snapshot.metrics}
                opportunities={snapshot.opportunities}
                boqs={snapshot.boqs}
                onOpenBoq={openBoqWizard}
                onOpenQuote={openQuoteWizard}
                onOpenDetail={openTenderDetail}
              />
            ) : null}
            {activeTab === 'Opportunities' ? (
              <TendersOpportunities opportunities={snapshot.opportunities} onOpenBoq={openBoqWizard} onOpenQuote={openQuoteWizard} onOpenDetail={openTenderDetail} />
            ) : null}
            {activeTab === 'BOQDesk' ? (
              <TendersBOQDesk boqs={snapshot.boqs} onUpload={() => openBoqWizard()} onOpenQuote={openQuoteWizard} />
            ) : null}
            {activeTab === 'QuoteDesk' ? (
              <TendersQuoteDesk quotes={snapshot.quotes} boqs={snapshot.boqs} products={products} onGenerate={openQuoteWizard} />
            ) : null}
            {activeTab === 'SubmissionTracker' ? (
              <TendersSubmissionTracker submissions={snapshot.submissions} onSubmit={openSubmissionWizard} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedTender ? (
          <TenderOpportunityDrawer
            tender={selectedTender}
            documents={selectedTenderDocuments}
            boqs={selectedTenderBoqs}
            quotes={selectedTenderQuotes}
            submissions={selectedTenderSubmissions}
            memberResponses={selectedTenderMemberResponses}
            isImporting={tenders.isSaving}
            onClose={() => setSelectedTenderId(null)}
            onOpenBoq={(tenderId) => {
              setSelectedTenderId(null);
              openBoqWizard(tenderId);
            }}
            onOpenQuote={(tenderId) => {
              setSelectedTenderId(null);
              openQuoteWizard(tenderId);
            }}
            onImportSourcePack={(tenderId) => {
              void handleImportSourcePack(tenderId);
            }}
          />
        ) : null}
        <NewTenderWizard
          isOpen={isNewTenderWizardOpen}
          onClose={() => setIsNewTenderWizardOpen(false)}
          onCreate={tenders.createTenderOpportunity}
          onUploadDocument={tenders.uploadTenderDocument}
        />
        <BOQUploadWizard
          isOpen={isBOQUploadWizardOpen}
          onClose={() => setIsBOQUploadWizardOpen(false)}
          opportunities={snapshot.opportunities}
          documents={snapshot.documents}
          boqs={snapshot.boqs}
          products={products}
          onUpload={tenders.uploadTenderBoq}
          onPromote={tenders.promoteTenderDocumentToBoq}
          onMapLine={tenders.updateTenderBoqLine}
          onOpenQuote={openQuoteWizard}
          initialTenderId={focusedTenderId}
        />
        <QuoteGenerationWizard
          isOpen={isQuoteWizardOpen}
          onClose={() => setIsQuoteWizardOpen(false)}
          opportunities={snapshot.opportunities}
          boqs={snapshot.boqs}
          products={products}
          onGenerate={tenders.createTenderQuoteDraft}
          initialTenderId={focusedTenderId}
        />
        <SubmissionWizard
          isOpen={isSubmissionWizardOpen}
          onClose={() => setIsSubmissionWizardOpen(false)}
          quotes={snapshot.quotes}
          onUploadDocument={tenders.uploadTenderDocument}
          onSubmit={tenders.createTenderSubmission}
          initialQuoteId={focusedQuoteId}
        />
      </AnimatePresence>
    </div>
  );
};
